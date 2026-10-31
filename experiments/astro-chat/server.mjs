import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const sha = s => createHash('sha256').update(s).digest('hex');
const userPattern = /^[a-z0-9][a-z0-9_.-]{2,29}$/;
const response = (res, status, data, extras={}) => { res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store',...extras});res.end(JSON.stringify(data)); };
const reject = (status, message) => { const e=Error(message);e.status=status;throw e; };
const sessionCookie = req => (req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('iachat_session='))?.slice(15) || '';
const dto = m => ({id:m.id,seq:m.seq,roomId:m.room_id,senderId:m.sender_id,senderName:m.display_name,body:m.body,createdAt:m.created_at});
async function readJson(req) {
  let data='',bytes=0;
  for await (const chunk of req) {bytes+=chunk.length;if(bytes>16384)reject(413,'Contenido demasiado grande');data+=chunk.toString();}
  try { const v=JSON.parse(data);if(v&&typeof v==='object'&&!Array.isArray(v))return v; }catch{}
  reject(400,'JSON inválido');
}
export function openStore(file) {
  mkdirSync(dirname(file),{recursive:true});
  const db=new DatabaseSync(file);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
  db.exec("CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, salt TEXT NOT NULL, secret TEXT NOT NULL);");
  db.exec("CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL);");
  db.exec("CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL, created_at INTEGER NOT NULL);");
  db.exec("CREATE TABLE IF NOT EXISTS members(room_id TEXT NOT NULL REFERENCES rooms(id),user_id TEXT NOT NULL REFERENCES users(id),PRIMARY KEY(room_id,user_id));");
  db.exec("CREATE TABLE IF NOT EXISTS messages(seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,room_id TEXT NOT NULL REFERENCES rooms(id),sender_id TEXT NOT NULL REFERENCES users(id),body TEXT NOT NULL,created_at INTEGER NOT NULL,idem_key TEXT NOT NULL,UNIQUE(room_id,sender_id,idem_key));");
  db.exec("CREATE INDEX IF NOT EXISTS message_order ON messages(room_id,seq);");
  db.exec("CREATE TABLE IF NOT EXISTS room_views(room_id TEXT NOT NULL REFERENCES rooms(id),user_id TEXT NOT NULL REFERENCES users(id),last_read_seq INTEGER NOT NULL DEFAULT 0,archived INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(room_id,user_id));");
  return db;
}
export function addUser(db,username,password,name=username) {
  username=String(username||'').toLowerCase();
  if(!userPattern.test(username)||typeof password!=='string'||password.length<10||password.length>256||typeof name!=='string'||name.trim().length<1||name.length>80)throw Error('Credenciales inválidas');
  const salt=randomBytes(16).toString('hex');
  db.prepare('INSERT INTO users(id,username,display_name,salt,secret) VALUES (?,?,?,?,?)').run(randomUUID(),username,name.trim(),salt,scryptSync(password,salt,64).toString('hex'));
}
export async function startChat({dbPath=join(root,'data/chat.sqlite'),port=4051,host='127.0.0.1',secureCookies=false}={}) {
  const db=openStore(dbPath),listeners=new Map(),rate=new Map();
  const userFrom = req => {
    const cookie=sessionCookie(req);
    if(!/^[a-f0-9]{64}$/.test(cookie))reject(401,'Inicia sesión');
    const u=db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires_at>?').get(sha(cookie),Date.now());
    if(!u)reject(401,'Sesión vencida');
    return u;
  };
  const isMember=(room,id) => {if(!db.prepare('SELECT 1 FROM members WHERE room_id=? AND user_id=?').get(room,id))reject(404,'Sala no disponible');};
  const events=(room,seq) => {
    const users=db.prepare('SELECT user_id FROM members WHERE room_id=?').all(room);
    for(const u of users) for(const stream of listeners.get(u.user_id)||[]) { try{stream.write('event: message\ndata: '+JSON.stringify({room,seq})+'\n\n');}catch{} }
  };
  const server=createServer(async(req,res)=>{
    try {
      const method=req.method||'GET',url=new URL(req.url,'http://localhost'),path=url.pathname;
      res.setHeader('X-Content-Type-Options','nosniff');
      res.setHeader('Referrer-Policy','no-referrer');
      if(method==='POST'&&(req.headers['sec-fetch-site']==='cross-site'||(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)))reject(403,'Origen no autorizado');
      if(method==='GET'&&['/','/app.js','/styles.css'].includes(path)){
        const name=path==='/'?'index.html':path.slice(1);
        res.writeHead(200,{'Content-Type':(path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'text/html')+'; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; connect-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'"});
        return res.end(readFileSync(join(root,'public',name)));
      }
      if(method==='GET'&&path==='/healthz')return response(res,200,{ok:true});
      if(method==='POST'&&path==='/api/login'){
        const v=await readJson(req),ip=req.socket.remoteAddress||'unknown',r=rate.get(ip);
        if(r&&r.until>Date.now())reject(429,'Demasiados intentos');
        const u=db.prepare('SELECT * FROM users WHERE username=?').get(String(v.username||'').toLowerCase());
        const expected=Buffer.from(u?.secret||'00'.repeat(64),'hex');
        const computed=scryptSync(String(v.password||'').slice(0,256),u?.salt||'00000000000000000000000000000000',64);
        if(!u||!timingSafeEqual(expected,computed)){
          const n=(r?.n||0)+1;
          rate.set(ip,{n,until:n>=8?Date.now()+60000:0});
          reject(401,'Usuario o contraseña incorrectos');
        }
        rate.delete(ip);
        const token=randomBytes(32).toString('hex');
        db.prepare('INSERT INTO sessions(hash,user_id,expires_at) VALUES(?,?,?)').run(sha(token),u.id,Date.now()+7*86400000);
        return response(res,200,{user:{id:u.id,username:u.username,displayName:u.display_name}},{'Set-Cookie':'iachat_session='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800'+(secureCookies?'; Secure':'')});
      }
      const u=userFrom(req);
      if(method==='GET'&&path==='/api/me')return response(res,200,{user:{id:u.id,username:u.username,displayName:u.display_name}});
      if(method==='POST'&&path==='/api/logout'){
        db.prepare('DELETE FROM sessions WHERE hash=?').run(sha(sessionCookie(req)));
        for(const stream of listeners.get(u.id)||[])stream.end();
        listeners.delete(u.id);
        return response(res,200,{ok:true},{'Set-Cookie':'iachat_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'+(secureCookies?'; Secure':'')});
      }
      if(method==='GET'&&path==='/api/contacts'){
        return response(res,200,{items:db.prepare('SELECT id,username,display_name FROM users WHERE id<>? ORDER BY display_name COLLATE NOCASE LIMIT 150').all(u.id).map(x=>({id:x.id,username:x.username,displayName:x.display_name}))});
      }
      if(method==='GET'&&path==='/api/rooms'){
        const rows=db.prepare("SELECT r.*, (SELECT body FROM messages WHERE room_id=r.id ORDER BY seq DESC LIMIT 1) AS preview, COALESCE((SELECT MAX(seq) FROM messages WHERE room_id=r.id),0) AS last_seq, (SELECT u.display_name FROM users u JOIN members m ON m.user_id=u.id WHERE m.room_id=r.id AND u.id<>? LIMIT 1) AS peer FROM rooms r JOIN members mine ON mine.room_id=r.id WHERE mine.user_id=? ORDER BY last_seq DESC,r.created_at DESC").all(u.id,u.id);
        return response(res,200,{items:rows.map(r=>{
          const status=db.prepare('SELECT last_read_seq,archived FROM room_views WHERE room_id=? AND user_id=?').get(r.id,u.id);
          const unread=db.prepare('SELECT COUNT(*) n FROM messages WHERE room_id=? AND sender_id<>? AND seq>?').get(r.id,u.id,status?.last_read_seq??0).n;
          return {id:r.id,name:r.kind==='direct'?r.peer:r.name,kind:r.kind,preview:r.preview||'',lastSeq:r.last_seq,unread,archived:!!status?.archived,
            lastAt:db.prepare('SELECT created_at t FROM messages WHERE room_id=? ORDER BY seq DESC LIMIT 1').get(r.id)?.t||r.created_at};
        })});
      }
      if(method==='POST'&&path==='/api/rooms'){
        const v=await readJson(req);
        if(!['direct','group'].includes(v.kind))reject(400,'Tipo de sala inválido');
        const names=v.kind==='direct'?[v.peer]:v.members;
        if(!Array.isArray(names)||names.length<1||names.length>24||names.some(x=>typeof x!=='string'||!userPattern.test(x)))reject(400,'Participantes inválidos');
        const peers=[...new Set(names.map(x=>x.toLowerCase()))].filter(x=>x!==u.username).map(n=>db.prepare('SELECT id FROM users WHERE username=?').get(n));
        if(!peers.length||peers.some(x=>!x))reject(404,'Destinatario no disponible');
        if(v.kind==='direct'&&peers.length!==1)reject(400,'Se requiere una persona');
        if(v.kind==='direct'){
          const old=db.prepare("SELECT r.id FROM rooms r WHERE r.kind='direct' AND (SELECT COUNT(*) FROM members WHERE room_id=r.id)=2 AND EXISTS(SELECT 1 FROM members WHERE room_id=r.id AND user_id=?) AND EXISTS(SELECT 1 FROM members WHERE room_id=r.id AND user_id=?) LIMIT 1").get(u.id,peers[0].id);
          if(old)return response(res,200,{roomId:old.id});
        }
        const name=v.kind==='group'?String(v.name||'').trim():'Directo';
        if(v.kind==='group'&&(name.length<2||name.length>80))reject(400,'Nombre inválido');
        const id=randomUUID();db.exec('BEGIN IMMEDIATE');
        try{db.prepare('INSERT INTO rooms(id,name,kind,created_at) VALUES(?,?,?,?)').run(id,name,v.kind,Date.now());const insert=db.prepare('INSERT INTO members(room_id,user_id) VALUES(?,?)');for(const pid of [u.id,...peers.map(x=>x.id)])insert.run(id,pid);db.exec('COMMIT');}
        catch(e){db.exec('ROLLBACK');throw e;}
        return response(res,201,{roomId:id});
      }
      const archive=path.match(/^\/api\/rooms\/([0-9a-f-]{36})\/archive$/);
      if(archive&&method==='POST'){
        isMember(archive[1],u.id);
        const values=await readJson(req);
        if(typeof values.archived!=='boolean')reject(400,'Estado inválido');
        db.prepare('INSERT INTO room_views(room_id,user_id,archived) VALUES(?,?,?) ON CONFLICT(room_id,user_id) DO UPDATE SET archived=excluded.archived').run(archive[1],u.id,values.archived?1:0);
        return response(res,200,{roomId:archive[1],archived:values.archived});
      }
      const match=path.match(/^\/api\/rooms\/([0-9a-f-]{36})\/messages$/);
      if(match){
        const room=match[1];isMember(room,u.id);
        if(method==='GET'){
          const before=url.searchParams.get('before'),after=url.searchParams.get('after');
          if((before&&after)||[before,after].some(n=>n&&!/^[1-9]\d{0,14}$/.test(n)))reject(400,'Cursor inválido');
          const base='SELECT m.*,users.display_name FROM messages m JOIN users ON users.id=m.sender_id WHERE m.room_id=?';
          const rows=after?db.prepare(base+' AND m.seq>? ORDER BY m.seq ASC LIMIT 101').all(room,Number(after)):db.prepare(base+(before?' AND m.seq<?':'')+' ORDER BY m.seq DESC LIMIT 51').all(...(before?[room,Number(before)]:[room]));
          const items=(after?rows.slice(0,100):rows.slice(0,50).reverse()).map(dto);
          if(!before){
            const high=db.prepare('SELECT MAX(seq) n FROM messages WHERE room_id=?').get(room).n||0;
            db.prepare('INSERT INTO room_views(room_id,user_id,last_read_seq) VALUES(?,?,?) ON CONFLICT(room_id,user_id) DO UPDATE SET last_read_seq=MAX(room_views.last_read_seq,excluded.last_read_seq)').run(room,u.id,high);
          }
          return response(res,200,{items,nextBefore:!after&&rows.length>50?String(items[0].seq):null,hasMore:!!after&&rows.length>100});
        }
        if(method==='POST'){
          const v=await readJson(req),message=String(v.body||'').trim(),key=String(v.key||'');
          if(!message||message.length>8000||!/^[a-zA-Z0-9-]{8,80}$/.test(key))reject(400,'Mensaje o identificador inválido');
          const old=db.prepare('SELECT * FROM messages WHERE room_id=? AND sender_id=? AND idem_key=?').get(room,u.id,key);
          if(old){if(old.body!==message)reject(409,'Mensaje diferente con la misma clave');return response(res,200,{message:dto({...old,display_name:u.display_name}),duplicate:true});}
          const m={id:randomUUID(),room_id:room,sender_id:u.id,body:message,created_at:Date.now()};
          const seq=Number(db.prepare('INSERT INTO messages(id,room_id,sender_id,body,created_at,idem_key) VALUES(?,?,?,?,?,?)').run(m.id,room,u.id,message,m.created_at,key).lastInsertRowid);
          db.prepare('INSERT INTO room_views(room_id,user_id,last_read_seq) VALUES(?,?,?) ON CONFLICT(room_id,user_id) DO UPDATE SET last_read_seq=MAX(room_views.last_read_seq,excluded.last_read_seq)').run(room,u.id,seq);
          events(room,seq);
          return response(res,201,{message:dto({...m,seq,display_name:u.display_name}),duplicate:false});
        }
      }
      if(method==='GET'&&path==='/api/search'){
        const q=(url.searchParams.get('q')||'').trim();
        if(q.length<2||q.length>100)reject(400,'Búsqueda inválida');
        const escaped='%'+q.replace(/[%_\\]/g,'\\$&')+'%';
        const rows=db.prepare("SELECT m.*,u.display_name,r.name AS room_name FROM messages m JOIN users u ON u.id=m.sender_id JOIN rooms r ON r.id=m.room_id JOIN members rm ON rm.room_id=r.id WHERE rm.user_id=? AND m.body LIKE ? ESCAPE '\\' ORDER BY m.seq DESC LIMIT 40").all(u.id,escaped);
        return response(res,200,{items:rows.map(m=>({...dto(m),roomName:m.room_name}))});
      }
      if(method==='GET'&&path==='/api/events'){
        res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});
        res.write('event: ready\ndata: {}\n\n');
        let set=listeners.get(u.id);if(!set){set=new Set();listeners.set(u.id,set);}set.add(res);
        const timer=setInterval(()=>{try{res.write(':ping\n\n');}catch{}},20000);
        req.on('close',()=>{clearInterval(timer);set.delete(res);if(!set.size)listeners.delete(u.id);});
        return;
      }
      reject(404,'Ruta inexistente');
    }catch(e){if(!res.headersSent)response(res,e.status||500,{error:e.status?e.message:'Error interno'});else res.end();}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});
  return {server,db,address:server.address(),async stop(){for(const set of listeners.values())for(const res of set)res.end();await new Promise(resolve=>server.close(resolve));db.close();}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  startChat({dbPath:process.env.CHAT_DB||join(root,'data/chat.sqlite'),port:Number(process.env.CHAT_PORT||4051),host:process.env.CHAT_HOST||'127.0.0.1',secureCookies:process.env.CHAT_PUBLIC_HTTPS==='true'}).then(v=>console.log('Chat piloto en '+JSON.stringify(v.address))).catch(e=>{console.error(e.message);process.exitCode=1;});
}
