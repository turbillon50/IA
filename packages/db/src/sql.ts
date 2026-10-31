import pg from "pg";
export interface Query {
  query<T extends Record<string, any> = Record<string, any>>(
    sql: string,
    params?: any[],
  ): Promise<{ rows: T[] }>;
}
export interface Database {
  transaction<T>(work: (tx: Query) => Promise<T>): Promise<T>;
}
export function postgres(
  connectionString: string,
): Database & { close(): Promise<void> } {
  const pool = new pg.Pool({ connectionString, max: 10 });
  return {
    async transaction(work) {
      const c = await pool.connect();
      try {
        await c.query("BEGIN");
        const result = await work(c);
        await c.query("COMMIT");
        return result;
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
    },
    close: () => pool.end(),
  };
}
export class DomainError extends Error {
  code:
    | "UNAUTHENTICATED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "VALIDATION_ERROR"
    | "CONFLICT"
    | "CONNECTION_UNAVAILABLE"
    | "RETRYABLE";
  constructor(
    code:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "VALIDATION_ERROR"
      | "CONFLICT"
      | "CONNECTION_UNAVAILABLE"
      | "RETRYABLE",
    message: string = code,
  ) {
    super(message);
    this.code = code;
  }
}
export const fail = (
  code: ConstructorParameters<typeof DomainError>[0],
): never => {
  throw new DomainError(code);
};
