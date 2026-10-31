import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openStore, addUser, startChat } from '../server.mjs';

const playwrightPath=process.env.PLAYWRIGHT_CORE;
if(!playwrightPath)throw Error('Define PLAYWRIGHT_CORE con la ruta local de playwright-core/index.mjs');
const {chromium}=await import(pathToFileURL(playwrightPath).href);
const dir=mkdtempSync(join(tmpdir(),'astro-ui-'));
let service,browser;
try {
  const dbPath=join(dir,'pilot.sqlite');
  const db=openStore(dbPath);
  addUser(db,'alice','test-alice-password-123','Alicia');
  addUser(db,'bob','test-bob-password-123','Bob');
  db.close();
  service=await startChat({dbPath,port:0});
  const url='http://127.0.0.1:'+service.address.port;
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const phone=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const desktop=await browser.newContext({viewport:{width:1440,height:900}});
  const a=await phone.newPage(),b=await desktop.newPage();
  const errors=[];
  for(const page of [a,b])page.on('pageerror',e=>errors.push(e.message));
  const signIn=async(page,who,pass)=>{
    await page.goto(url);
    await page.locator('#username').fill(who);
    await page.locator('#password').fill(pass);
    await page.locator('#loginButton').click();
    await page.locator('#workspace:visible').waitFor({timeout:10000});
  };
  await signIn(a,'alice','test-alice-password-123');
  await signIn(b,'bob','test-bob-password-123');
  await a.locator('#newRoomButton').click();
  await a.locator('#peerNames').fill('bob');
  await a.locator('#newRoomForm .primary').click();
  await a.locator('#activeRoom:visible').waitFor();
  await a.locator('#messageInput').fill('Hola Bob, prueba real por SSE');
  await a.locator('#sendButton').click();
  await a.locator('.message-row.mine .message-text').getByText('Hola Bob, prueba real por SSE').waitFor({timeout:10000});
  await b.locator('.room-item').first().waitFor({timeout:10000});
  await b.locator('.room-item').first().click();
  await b.getByText('Hola Bob, prueba real por SSE').waitFor({timeout:10000});
  await b.locator('#messageInput').fill('Confirmo que lo recibí');
  await b.locator('#sendButton').click();
  await a.locator('#messageList').getByText('Confirmo que lo recibí').waitFor({timeout:10000});
  await a.screenshot({path:join(dir,'mobile.png'),fullPage:true});
  await b.screenshot({path:join(dir,'desktop.png'),fullPage:true});
  const measurements=await a.evaluate(()=>{
    const composer=document.querySelector('#composeForm').getBoundingClientRect();
    return {innerWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth,composerBottom:composer.bottom,viewportHeight:innerHeight};
  });
  assert.ok(measurements.scrollWidth<=measurements.innerWidth+1,'Hay desplazamiento horizontal móvil');
  assert.ok(measurements.composerBottom<=measurements.viewportHeight+1,'Compositor fuera de pantalla');
  await b.reload();
  await b.getByText('Hola Bob, prueba real por SSE').waitFor({timeout:10000});
  assert.deepEqual(errors,[],'Error de JavaScript del navegador');
  console.log(JSON.stringify({passed:true,flows:['login dos cuentas','crear conversación','envío y recepción SSE','respuesta en vivo','recarga persistente','móvil 390px','escritorio 1440px'],measurements,errors}));
}catch(e){console.error(e);process.exitCode=1;}
finally{if(browser)await browser.close();if(service)await service.stop();rmSync(dir,{recursive:true,force:true});}
