// Código de acesso comum à página e à API. O prefixo _ impede a Vercel de publicar como rota.
function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function codigo() {
  return (process.env.CODIGO || '').trim().toLowerCase();
}
function liberado(req) {
  const c = codigo();
  return !!c && cookies(req).gc === c;
}
module.exports = { cookies, codigo, liberado };
