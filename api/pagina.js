const fs = require('fs');
const path = require('path');
const { codigo, liberado } = require('./_acesso');

function login(erro, semCodigo) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Grade de Campo · Figueira Branca</title>
<style>:root{--bg:#EFEBE3;--s:#FBF9F5;--f:#1B1A16;--m:#59564D;--l:#DCD5C7;--a:#232E75}@media (prefers-color-scheme:dark){:root{--bg:#16150F;--s:#201E18;--f:#F2EEE4;--m:#B8B2A3;--l:#3A362D;--a:#95A2E6;color-scheme:dark}}
body{margin:0;background:var(--bg);color:var(--f);font:16px/1.5 -apple-system,"Segoe UI",Roboto,sans-serif;display:grid;place-items:center;min-height:100vh;padding:16px;box-sizing:border-box}
form{background:var(--s);border:1px solid var(--l);border-radius:10px;padding:24px;max-width:22rem;width:100%;display:flex;flex-direction:column;gap:12px}
h1{margin:0;font-size:1.4rem}p{margin:0;color:var(--m)}input{font:inherit;padding:.6rem .7rem;border:1px solid var(--l);border-radius:8px;background:var(--bg);color:var(--f)}
button{font:inherit;font-weight:600;padding:.6rem;border:0;border-radius:8px;background:var(--a);color:#fff}.e{color:#b54a3c}</style></head>
<body><form method="get" action="/"><h1>Grade de Campo</h1>
<p>Congregação Figueira Branca. Digite o código que você recebeu.</p>
${semCodigo ? '<p class="e">O código de acesso ainda não foi configurado.</p>' : ''}
${erro ? '<p class="e">Código incorreto. Confira e tente de novo.</p>' : ''}
<label for="c">Código</label><input id="c" name="c" autocomplete="off" autocapitalize="none" required>
<button type="submit">Entrar</button></form></body></html>`;
}

function send(res, html, status) {
  res.statusCode = status || 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(html);
}

module.exports = (req, res) => {
  const CODIGO = codigo();
  if (!CODIGO) return send(res, login(false, true), 503);
  const url = new URL(req.url, 'http://local');
  const c = url.searchParams.get('c');
  if (c !== null) {
    if (c.trim().toLowerCase() === CODIGO) {
      res.statusCode = 302;
      res.setHeader('Set-Cookie', `gc=${encodeURIComponent(CODIGO)}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`);
      res.setHeader('Location', '/');
      res.setHeader('Cache-Control', 'no-store');
      return res.end();
    }
    return send(res, login(true, false), 401);
  }
  if (liberado(req)) {
    return send(res, fs.readFileSync(path.join(process.cwd(), 'conteudo', 'site.html'), 'utf8'));
  }
  return send(res, login(false, false), 401);
};
