# Grade de Campo · Figueira Branca

Página da grade mensal das saídas de campo, com o controle das cartas às escolas.

- `conteudo/site.html`: a página. Não é publicada direto; só sai pela função com código.
- `api/pagina.js`: confere o código de acesso (variável `CODIGO`) e grava um cookie por 1 ano.
- `api/escolas.js`: lê e grava o controle das cartas em Vercel Blob (`escolas/<id>/<momento>.json`, um arquivo por gravação; vale o mais recente).

Na Vercel: Framework = Other, Output Directory = `public`, variável `CODIGO` em Production, e um Blob store conectado ao projeto (injeta `BLOB_READ_WRITE_TOKEN`).
Link para os irmãos: `https://<endereço>/?c=<código>`
