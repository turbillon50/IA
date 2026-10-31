import { randomBytes } from 'node:crypto';
import { createSelfHostedIdentity, toNodeHandler, oauthProviderAuthServerMetadata, oauthProviderOpenIdConfigMetadata, verifyOAuthQueryParams, type SelfHostedOptions } from '../auth/self-hosted.ts';
import { createApplication } from '../application.ts';
import { fromNodeHeaders } from '../auth/self-hosted.ts';

/** Minimal branded access + OAuth consent. No frontend fixtures or third-party login. */
export function createSelfHostedApplication(options: SelfHostedOptions) {
  const own = createSelfHostedIdentity({ ...options, allowSignUp: false });
  const app = createApplication({ rest: { db: options.db, auth: own.adapter, allowedOrigins: [own.origin] }, mcp: own.mcp });
  app.get('/auth/profile', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const { actor } = await own.resolver.authenticate(new Request(own.origin, { headers: fromNodeHeaders(req.headers) }));
      const profile = await own.mcp.getAuthorizedProfile(actor.userId);
      if (!profile) { res.sendStatus(401); return; }
      res.json(profile);
    } catch { res.status(401).json({ error: 'UNAUTHENTICATED' }); }
  });
  app.all('/api/auth/*splat', toNodeHandler(own.auth));
  app.get(['/.well-known/oauth-authorization-server/api/auth', '/api/auth/.well-known/oauth-authorization-server'], toNodeHandler(oauthProviderAuthServerMetadata(own.auth)));
  app.get(['/.well-known/openid-configuration/api/auth', '/api/auth/.well-known/openid-configuration'], toNodeHandler(oauthProviderOpenIdConfigMetadata(own.auth)));
  app.get(['/auth/sign-in', '/auth/consent', '/auth/account'], async (req, res) => {
    const query = req.originalUrl.split('?').slice(1).join('?');
    if ((req.path === '/auth/consent' && !query) || (query && !await verifyOAuthQueryParams(query, options.secret))) {
      res.status(400).type('text/plain').send('La autorización no es válida o venció. Inicia la conexión otra vez.'); return;
    }
    const nonce = randomBytes(18).toString('base64url');
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'` });
    res.type('html').send(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IAapp · Acceso</title>
<style nonce="${nonce}">body{font:16px system-ui;background:#fafafa;color:#111;margin:0;padding:32px 20px}main{max-width:390px;margin:8vh auto}label,input,button{display:block;box-sizing:border-box;width:100%;margin:14px 0}input,button{padding:14px;border:1px solid #ccc;border-radius:10px}button{background:#111;color:white;cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere}small{color:#555}</style>
<main><h1>IAapp</h1><p id="heading"></p><form id="login"><label>Correo<input name="email" type="email" autocomplete="username" required></label><label>Contraseña<input name="password" type="password" autocomplete="current-password" required></label><button>Entrar</button></form><section id="consent" hidden><pre id="details"></pre><button id="accept">Autorizar</button><button id="reject">Rechazar</button></section><pre id="status" role="status"></pre></main>
<script nonce="${nonce}">
const status=document.querySelector('#status'), form=document.querySelector('#login'), heading=document.querySelector('#heading');
const query=location.search.slice(1), path=location.pathname;
async function post(path,body){const r=await fetch('/api/auth'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error('No se pudo completar. Revisa tus datos o inicia otra vez.');return d;}
function onward(data){const next=data.url||data.redirect_uri;if(next)location.assign(next);else location.assign('/auth/account');}
form.onsubmit=async e=>{e.preventDefault();status.textContent='Validando cuenta…';try{const f=new FormData(form);onward(await post('/sign-in/email',{email:f.get('email'),password:f.get('password'),...(query?{oauth_query:query}:{})}));}catch(e){status.textContent=e.message;}};
async function start(){
 const r=await fetch('/api/auth/get-session');const s=await r.json();
 if(path==='/auth/account'){form.hidden=true;heading.textContent='Tu cuenta';const me=await fetch('/auth/profile');if(!me.ok){location.replace('/auth/sign-in');return;}const d=await me.json();status.textContent=d.displayName+'\\nTu número de IAapp: '+d.lineNumber;return;}
 if(path==='/auth/consent'){form.hidden=true;if(!s){status.textContent='Inicia la conexión otra vez para identificar tu cuenta.';return;}heading.textContent='Autorizar conexión';document.querySelector('#consent').hidden=false;const p=new URLSearchParams(query);document.querySelector('#details').textContent='Cuenta: '+s.user.email+'\\nCliente: '+p.get('client_id')+'\\nRecurso: '+p.get('resource')+'\\nPermisos: '+p.get('scope');for(const [id,accept] of [['accept',true],['reject',false]])document.getElementById(id).onclick=async()=>{try{onward(await post('/oauth2/consent',{accept,oauth_query:query}));}catch(e){status.textContent=e.message;}};return;}
 heading.textContent='Entra con tu cuenta de IAapp';if(s&&query)onward(await post('/oauth2/continue',{selected:true,oauth_query:query}));
}
start().catch(()=>{status.textContent='No se pudo comprobar la cuenta. Inténtalo de nuevo.';});
</script></html>`);
  });
  return { app, own };
}
