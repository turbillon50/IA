import { randomUUID } from "node:crypto";
import {
  Repository,
  roomAccess,
  attachmentDTO,
  text,
  type Actor,
} from "./repository.ts";
import { fail } from "./sql.ts";
/** Implement with a PRIVATE Supabase bucket. The gateway must bind upload to key,
 * exact declared size/type, disallow overwrite, and scan immutable object bytes.
 * No public fallback. Do not allow client storage metadata to stand in for scanning. */
export interface PrivateStorage {
  signUpload(
    key: string,
    options: {
      bytes: number;
      contentType: string;
      expiresInSeconds: 60;
      overwrite: false;
    },
  ): Promise<{ url: string; expiresAt: string }>;
  inspect(key: string): Promise<{
    bytes: number;
    detectedContentType: string;
    scan: "clean" | "pending" | "rejected";
    immutable: boolean;
  } | null>;
  signDownload(
    key: string,
    expiresInSeconds: 60,
  ): Promise<{ url: string; expiresAt: string }>;
}
export class Files {
  repo: Repository;
  storage: PrivateStorage;
  constructor(repo: Repository, storage: PrivateStorage) {
    this.repo = repo;
    this.storage = storage;
  }
  create(
    a: Actor,
    rid: string,
    input: { fileName: string; bytes: number; contentType: string },
  ) {
    return this.repo.db.transaction(async (tx) => {
      await roomAccess(tx, a, rid, true);
      const name = text(input.fileName, 200);
      if (
        /[\/\\\x00-\x1f]/.test(name) ||
        !Number.isInteger(input.bytes) ||
        input.bytes < 1 ||
        input.bytes > 10485760 ||
        !["image/png", "image/jpeg", "application/pdf", "text/plain"].includes(
          input.contentType,
        )
      )
        fail("VALIDATION_ERROR");
      const fid = randomUUID();
      const key = `rooms/${rid}/${fid}`;
      const r = (
        await tx.query(
          "INSERT INTO iaapp.attachments(id,room_id,owner_user_id,object_key,file_name,content_type,bytes) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
          [fid, rid, a.userId, key, name, input.contentType, input.bytes],
        )
      ).rows[0];
      const upload = await this.storage.signUpload(key, {
        bytes: input.bytes,
        contentType: input.contentType,
        expiresInSeconds: 60,
        overwrite: false,
      });
      return { attachment: attachmentDTO(r), upload };
    });
  }
  complete(a: Actor, fid: string) {
    return this.repo.db.transaction(async (tx) => {
      const f = (
        await tx.query(
          "SELECT * FROM iaapp.attachments WHERE id=$1 FOR UPDATE",
          [fid],
        )
      ).rows[0];
      if (!f) fail("NOT_FOUND");
      await roomAccess(tx, a, f.room_id, true);
      if (f.owner_user_id !== a.userId) fail("FORBIDDEN");
      if (f.state !== "processing") return attachmentDTO(f);
      const actual = await this.storage.inspect(f.object_key);
      if (!actual) return fail("VALIDATION_ERROR");
      const rejected =
        actual.bytes !== Number(f.bytes) ||
        actual.detectedContentType !== f.content_type ||
        actual.scan === "rejected" ||
        !actual.immutable;
      const state = rejected
        ? "rejected"
        : actual.scan === "clean"
          ? "ready"
          : "processing";
      const r = (
        await tx.query(
          "UPDATE iaapp.attachments SET state=$1 WHERE id=$2 RETURNING *",
          [state, fid],
        )
      ).rows[0];
      return attachmentDTO(r);
    });
  }
  download(a: Actor, fid: string) {
    return this.repo.db.transaction(async (tx) => {
      const f = (
        await tx.query("SELECT * FROM iaapp.attachments WHERE id=$1", [fid])
      ).rows[0];
      if (!f) fail("NOT_FOUND");
      await roomAccess(tx, a, f.room_id);
      if (f.state !== "ready") fail("CONFLICT");
      return this.storage.signDownload(f.object_key, 60);
    });
  }
}
