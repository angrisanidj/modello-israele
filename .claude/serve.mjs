/* server statico minimo, solo per le misure su browser: non fa parte del progetto */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const RADICE = process.cwd();
const TIPI = {'.html':'text/html; charset=utf-8','.json':'application/json; charset=utf-8',
  '.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'};
http.createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(RADICE, p);
  if (!f.startsWith(RADICE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){
    res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, {'content-type': TIPI[path.extname(f)] || 'application/octet-stream',
    'access-control-allow-origin':'*'});
  res.end(fs.readFileSync(f));
}).listen(8788, ()=>console.log('http://localhost:8788'));
