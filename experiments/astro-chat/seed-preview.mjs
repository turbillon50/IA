import { randomUUID } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore } from './server.mjs';
if (process.env.CHAT_DEMO_SEED !== 'yes') throw Error('Sembrar solo el laboratorio de demostración');
const root=dirname(fileURLToPath(import.meta.url));
const db=openStore(process.env.CHAT_DB || join(root,'data/visual.sqlite'));
try {
  const a=db.prepare('SELECT id FROM users WHERE username=?').get('vista1');
  const b=db.prepare('SELECT id FROM users WHERE username=?').get('vista2');
  if (!a||!b) throw Error('Faltan cuentas de demostración');
  const existing=db.prepare('SELECT count(*) n FROM rooms').get().n;
  if (!existing) {
    const room=randomUUID();
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('INSERT INTO rooms(id,name,kind,created_at) VALUES(?,?,?,?)').run(room,'Chat de prueba','direct',Date.now());
      const member=db.prepare('INSERT INTO members(room_id,user_id) VALUES(?,?)');
      member.run(room,a.id);member.run(room,b.id);
      const add=db.prepare('INSERT INTO messages(id,room_id,sender_id,body,created_at,idem_key) VALUES(?,?,?,?,?,?)');
      add.run(randomUUID(),room,a.id,'Hola, este es nuestro chat de demostración.',Date.now()-9000,randomUUID());
      add.run(randomUUID(),room,b.id,'Prueba escribir, recargar y volver a entrar: los mensajes se conservan.',Date.now()-6000,randomUUID());
      db.exec('COMMIT');
    } catch(e){db.exec('ROLLBACK');throw e;}
  }
  console.log('Rooms:',db.prepare('SELECT count(*) n FROM rooms').get().n);
  console.log('Messages:',db.prepare('SELECT count(*) n FROM messages').get().n);
} finally {db.close();}
