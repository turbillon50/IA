-- Scope-local commit-ordered cursors: all changes in a scope lock the same counter.
ALTER TABLE iaapp.rooms ADD COLUMN next_update_sequence bigint NOT NULL DEFAULT 0;
ALTER TABLE iaapp.projects ADD COLUMN next_update_sequence bigint NOT NULL DEFAULT 0;
CREATE TABLE iaapp.change_events (
 room_id uuid REFERENCES iaapp.rooms, project_id uuid REFERENCES iaapp.projects,
 sequence bigint NOT NULL, resource_kind text NOT NULL CHECK(resource_kind IN ('message','memory','task','attachment')),
 resource_id uuid NOT NULL, version integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(num_nonnulls(room_id,project_id)=1)
);
CREATE UNIQUE INDEX change_events_room ON iaapp.change_events(room_id,sequence) WHERE room_id IS NOT NULL;
CREATE UNIQUE INDEX change_events_project ON iaapp.change_events(project_id,sequence) WHERE project_id IS NOT NULL;
ALTER TABLE iaapp.change_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON iaapp.change_events FROM PUBLIC;
CREATE FUNCTION iaapp.record_change() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE rid uuid; pid uuid; seq bigint; kind text; ver integer;
BEGIN
 IF TG_TABLE_NAME='messages' THEN rid=NEW.room_id; kind='message'; ver=1;
 ELSIF TG_TABLE_NAME='memory_entries' THEN rid=NEW.room_id; pid=NEW.project_id; kind='memory'; ver=NEW.version;
 ELSIF TG_TABLE_NAME='tasks' THEN pid=NEW.project_id; kind='task'; ver=NEW.version;
 ELSIF TG_TABLE_NAME='attachments' THEN rid=NEW.room_id; kind='attachment'; ver=1;
 END IF;
 IF rid IS NOT NULL THEN UPDATE iaapp.rooms SET next_update_sequence=next_update_sequence+1 WHERE id=rid RETURNING next_update_sequence INTO seq;
 ELSE UPDATE iaapp.projects SET next_update_sequence=next_update_sequence+1 WHERE id=pid RETURNING next_update_sequence INTO seq;
 END IF;
 INSERT INTO iaapp.change_events(room_id,project_id,sequence,resource_kind,resource_id,version) VALUES(rid,pid,seq,kind,NEW.id,ver);
 RETURN NEW;
END $$;
CREATE TRIGGER message_changes AFTER INSERT ON iaapp.messages FOR EACH ROW EXECUTE FUNCTION iaapp.record_change();
CREATE TRIGGER memory_changes AFTER INSERT OR UPDATE ON iaapp.memory_entries FOR EACH ROW EXECUTE FUNCTION iaapp.record_change();
CREATE TRIGGER task_changes AFTER INSERT OR UPDATE ON iaapp.tasks FOR EACH ROW EXECUTE FUNCTION iaapp.record_change();
CREATE TRIGGER attachment_changes AFTER INSERT OR UPDATE ON iaapp.attachments FOR EACH ROW EXECUTE FUNCTION iaapp.record_change();
