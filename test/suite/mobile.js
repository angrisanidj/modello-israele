/* Audit mobile. Parser CSS a macchina di stati: tiene conto delle @media annidate
   e restituisce le regole realmente attive a una data larghezza di viewport. */
const fs=require('fs');
const html=fs.readFileSync('../../index.html','utf8');
const css=html.match(/<style>([\s\S]*?)<\/style>/)[1];

function attiva(cond,w){
  if(/prefers|print/.test(cond)) return false;
  const mx=/max-width:\s*(\d+)px/.exec(cond), mn=/min-width:\s*(\d+)px/.exec(cond);
  if(mx&&w>+mx[1]) return false;
  if(mn&&w<+mn[1]) return false;
  return !!(mx||mn);
}
/* estrae [{sel, decl, ordine}] attive a larghezza w */
function regole(w){
  const out=[];let i=0,ord=0;
  while(i<css.length){
    const at=css.indexOf('@media',i);
    const nextBrace=css.indexOf('{',i);
    if(nextBrace<0) break;
    if(at>=0&&at<nextBrace){
      const condEnd=css.indexOf('{',at);
      const cond=css.slice(at+6,condEnd).replace(/[()]/g,'').trim();
      let d=1,j=condEnd+1;
      while(j<css.length&&d>0){ if(css[j]==='{')d++; else if(css[j]==='}')d--; j++; }
      const body=css.slice(condEnd+1,j-1);
      if(attiva(cond,w)) parseBlocco(body,out,()=>ord++);
      i=j; continue;
    }
    const end=css.indexOf('}',nextBrace);
    if(end<0) break;
    out.push({sel:css.slice(i,nextBrace).trim(),decl:css.slice(nextBrace+1,end),ord:ord++});
    i=end+1;
  }
  return out;
}
function parseBlocco(body,out,next){
  let i=0;
  while(i<body.length){
    const b=body.indexOf('{',i); if(b<0)break;
    const e=body.indexOf('}',b); if(e<0)break;
    out.push({sel:body.slice(i,b).trim(),decl:body.slice(b+1,e),ord:next()});
    i=e+1;
  }
}
function prop(regs,sel,p){
  let v=null;
  regs.forEach(r=>{
    const sels=r.sel.split(',').map(s=>s.trim());
    if(sels.indexOf(sel)<0) return;
    const m=new RegExp('(?:^|;)\\s*'+p+'\\s*:\\s*([^;]+)').exec(r.decl);
    if(m) v=m[1].trim();
  });
  return v;
}
function minLarghezza(gt,gap){
  if(!gt) return null;
  if(/auto-fit|auto-fill/.test(gt)){
    const m=/minmax\((\d+)px/.exec(gt); return m?+m[1]:0;
  }
  const rep=/repeat\((\d+)\s*,\s*([^)]+)\)/.exec(gt);
  if(rep) return 0;                      /* repeat(n,1fr) è elastico */
  const px=[...gt.matchAll(/(\d+)px/g)].map(x=>+x[1]);
  const n=gt.trim().split(/\s+/).length;
  return px.reduce((a,b)=>a+b,0)+gap*(n-1);
}
const SEL=[['probabilità','#kn26 .probs'],['proiezione','#kn26 .pr'],['movers','#kn26 .prh.mv'],
 ['barra comandi','#kn26 .cmd'],['parametri','#kn26 .pan'],['direzione','#kn26 .dz .row'],
 ['legenda blocchi','#kn26 .legb'],['calendario','#kn26 .cal'],['cronologia','#kn26 .crono'],
 ['guida','#kn26 .guida'],['modulo dati','#kn26 .form'],['emiciclo legenda','#kn26 .legb']];
console.log("AUDIT MOBILE\n");
let totProb=0;
[360,390,414,768].forEach(w=>{
  const R=regole(w);
  const pad=prop(R,'#kn26','padding')||'0 32px';
  const padH=+(/\s(\d+)px/.exec(pad)?.[1]||0);
  const disp=w-2*padH;
  console.log(`── viewport ${w}px · padding ${padH}px · contenuto ${disp}px ──`);
  let prob=0;
  SEL.forEach(([nome,sel])=>{
    const gt=prop(R,sel,'grid-template-columns');
    if(!gt) return;
    const gap=+(/(\d+)px/.exec(prop(R,sel,'gap')||'0')?.[1]||0);
    const min=minLarghezza(gt,gap);
    const ok=min<=disp;
    if(!ok) prob++;
    console.log(`  ${ok?'ok  ':'!!  '}${nome.padEnd(17)} ${String(min).padStart(4)}px   ${gt.slice(0,40)}`);
  });
  const im=prop(R,'#kn26 .filtri input','min-width');
  if(im){const v=parseInt(im);console.log(`  ${v<=disp?'ok  ':'!!  '}${'input filtri'.padEnd(17)} ${String(v).padStart(4)}px`);if(v>disp)prob++;}
  totProb+=prob;
  console.log(prob?`  → ${prob} a rischio\n`:"  → nessuno sforamento\n");
});
console.log("── controlli qualitativi ──");
const ck={
 "indice sticky sempre visibile": /#kn26 \.idx\{position:sticky;top:0/.test(css),
 "indice scorre su schermo stretto": /#kn26 \.idx nav\{flex-wrap:nowrap;overflow-x:auto/.test(css),
 "ancore non finiscono sotto l'indice": /scroll-margin-top/.test(css),
 "barre di scorrimento blu bandiera": /scrollbar-color:var\(--acc\)/.test(css)&&/scrollbar-thumb\{background:var\(--acc\)/.test(css),
 "nessuna barra fissa che copre l'indice": !/position:fixed/.test(css),
 "SVG dei grafici senza larghezza fissa": !/#kn26 svg\{[^}]*width:\s*\d+px/.test(css),
 "tooltip anche al tocco": /touchstart/.test(html),
 "nessun overflow orizzontale complessivo": totProb===0,
};
Object.entries(ck).forEach(([k,v])=>console.log(" "+(v?"OK  ":"KO  ")+k));
