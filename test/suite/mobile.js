/* Audit mobile. Le regole davvero attive a una data larghezza le risolve test/css.js —
   parser a macchina di stati che tiene conto delle @media annidate. Stava qui dentro
   fino al 22 agosto 2026, ed è stato estratto quando è servito anche a colonne.js:
   due copie dello stesso parser divergono alla prima @media annidata che si tocca. */
const fs=require('fs');
const html=fs.readFileSync('../../index.html','utf8');
const css=html.match(/<style>([\s\S]*?)<\/style>/)[1];
const {regole,prop}=require('../css.js').carica('../../index.html');
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
 /* ══ IL CERCHIO SI DEVE VEDERE ══
    Col bordo --hair il contrasto misurato è 1,24 sulla carta e 1,17 sul fondo della gronda
    in chiaro: sei glifi che galleggiano senza confine, e il bersaglio da 44 non si legge da
    nessuna parte. --mute misura 4,93 e 5,54 sulla gronda, 5,24 e 5,10 sulla carta, ed è già
    il colore del glifo — cerchio e segno diventano un segno solo. È la stessa trappola del
    bordo delle pastiglie del gradino 1 nell'house effect, dove né il riempimento né il
    filetto delimitavano. La prova è sul TOKEN e non sul numero: il contrasto lo misura un
    browser, il token lo può leggere il foglio. */
 "il cerchio dei glifi ha un bordo che si vede": /#kn26 \.soci\{[^}]*border:1px solid var\(--mute\)/.test(css)
   && !/#kn26 \.soci\{[^}]*border:1px solid var\(--hair\)/.test(css),
 "barre di scorrimento blu bandiera": /scrollbar-color:var\(--acc\)/.test(css)&&/scrollbar-thumb\{background:var\(--acc\)/.test(css),
 /* ══ NIENTE COPRE L'INDICE ══
    Qui c'era «!/position:fixed/.test(css)», cioè il DIVIETO della parola invece della
    proprietà. Ha retto finché nessuna regola ne aveva bisogno, e il 25 agosto 2026 la
    colonna di condivisione — fissa nella gronda sopra i 1380 — l'ha fatto cadere.
    ATTESA CAMBIATA DI PROPOSITO, e la decisione l'ha presa l'autore chiedendo la colonna
    per nome. La sostituzione prova DI PIÙ del divieto, non di meno: non «non esiste nessun
    fissato», ma «ogni fissato è dichiarato qui, sta sotto l'indice nella pila, e vive solo
    dove c'è gronda». Un divieto lascia passare tutto il giorno in cui viene tolto; un
    inventario cade da solo appena ne compare uno non dichiarato, anche scritto domani.
    È l'idioma di opacita.js applicato all'impilamento. */
 "ogni position:fixed è dichiarato": (function(){
   const dichiarati=['#kn26 .colsoc'];
   const trovati=[...css.matchAll(/([^{}]+){([^{}]*position:fixed[^{}]*)}/g)]
     .map(m=>m[1].trim().split(String.fromCharCode(10)).pop().trim());
   return trovati.length===dichiarati.length &&
          trovati.every(t=>dichiarati.indexOf(t)>=0);
 })(),
 "e sta sotto l'indice nella pila": (function(){
   /* la regola giusta e non la prima che capita: #kn26 .colsoc è dichiarato DUE volte —
      display:none fuori, e la forma fissa dentro la media query — e la prima non ha
      z-index. Una regex che prende la prima misura la regola sbagliata e risponde. */
   const zi=(css.match(/#kn26 \.idx\{[^}]*?z-index:(\d+)/)||[])[1];
   const zc=(css.match(/#kn26 \.colsoc\{[^}]*?z-index:(\d+)/)||[])[1];
   return zi && zc && +zc < +zi;
 })(),
 "e la colonna compare solo sopra i 1380": (function(){
   const i=css.indexOf('@media(min-width:1380px)');
   if(i<0) return false;
   const dentro=css.slice(i, i+1200);
   const fuori=css.slice(0,i);
   /* fuori dalla media query la colonna esiste e non si vede; dentro, e solo dentro, è fissa */
   return /#kn26 \.colsoc\{display:none;\}/.test(fuori)
       && !/#kn26 \.colsoc\{[^}]*position:fixed/.test(fuori)
       && /#kn26 \.colsoc\{[^}]*position:fixed/.test(dentro);
 })(),
 "tooltip anche al tocco": /touchstart/.test(html),
 "nessun overflow orizzontale complessivo": totProb===0,
};
require('../esito.js')(ck);
