import { openStore, addUser } from './server.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir=dirname(fileURLToPath(import.meta.url));
const username=process.env.CHAT_NEW_USERNAME;
const password=process.env.CHAT_NEW_PASSWORD;
const displayName=process.env.CHAT_NEW_DISPLAY_NAME||username;
const db=openStore(process.env.CHAT_DB||join(dir,'data/chat.sqlite'));
try{
  addUser(db,username,password,displayName);
  console.log('Usuario aprovisionado: '+username);
}catch(e){
  console.error('No se pudo dar de alta: '+e.message);
  process.exitCode=1;
}finally{db.close();}
