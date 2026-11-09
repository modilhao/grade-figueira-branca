// Controle das cartas às escolas.
// Cada gravação vira um arquivo novo e imutável em Vercel Blob: escolas/<id>/<momento>.json.
// A leitura lista os arquivos e pega o mais recente de cada escola. Arquivo imutável
// não sofre com cache de CDN, e nenhuma gravação apaga a anterior (histórico de graça).
const { put, list } = require('@vercel/blob');
const { liberado } = require('./_acesso');

const ID = /^[a-z0-9-]{1,40}$/;

function inteiro(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 && n <= 999 ? n : null;
}

function limpa(doc) {
  doc = doc && typeof doc === 'object' ? doc : {};
  return {
    nome: String(doc.nome || '').slice(0, 80),
    ordem: inteiro(doc.ordem) ?? 99,
    precisaProf: inteiro(doc.precisaProf),
    precisaEquipe: inteiro(doc.precisaEquipe),
    prontasProf: inteiro(doc.prontasProf) ?? 0,
    prontasEquipe: inteiro(doc.prontasEquipe) ?? 0,
    entregue: doc.entregue === true,
  };
}

async function ler() {
  const recentes = {};
  let cursor;
  do {
    const r = await list({ prefix: 'escolas/', limit: 1000, cursor });
    for (const b of r.blobs) {
      const id = b.pathname.split('/')[1];
      if (!ID.test(id)) continue;
      const t = new Date(b.uploadedAt).getTime();
      if (!recentes[id] || t > recentes[id].t || (t === recentes[id].t && b.pathname > recentes[id].p)) {
        recentes[id] = { t, p: b.pathname, url: b.url };
      }
    }
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  const escolas = {};
  await Promise.all(Object.keys(recentes).map(async (id) => {
    const r = await fetch(recentes[id].url, { cache: 'no-store' });
    if (r.ok) escolas[id] = limpa(await r.json());
  }));
  return escolas;
}

function json(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

module.exports = async (req, res) => {
  if (!liberado(req)) return json(res, 401, { erro: 'sem acesso' });
  try {
    if (req.method === 'GET') {
      return json(res, 200, { escolas: await ler(), podeEditar: true });
    }
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body || '{}');
      const id = body && body.id;
      if (!ID.test(String(id || ''))) return json(res, 400, { erro: 'escola inválida' });
      const doc = limpa(body.doc);
      const momento = new Date().toISOString().replace(/[:.]/g, '-');
      await put(`escolas/${id}/${momento}.json`, JSON.stringify(doc), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: true,
      });
      const escolas = await ler();
      escolas[id] = doc; // garante que quem gravou vê a própria gravação mesmo se a listagem atrasar
      return json(res, 200, { escolas, podeEditar: true });
    }
    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { erro: 'método não permitido' });
  } catch (e) {
    return json(res, 500, { erro: 'falha no armazenamento' });
  }
};
