/* Misuratore di tavolozza — SOLA LETTURA.
 *
 * Confronta una consegna di design con la tavolozza attualmente in index.html,
 * misurando il contrasto sul rendering vero dei grafici SVG invece che sui token isolati.
 *
 *   node test/misura-consegna.mjs [cartella-consegna]
 *
 * Non scrive nulla e non tocca index.html. Non fa parte di `npm test`.
 *
 * ── Sorgenti di tavolozza accettate ──
 *  a) palette-liste.json   — tavolozza chiusa, {lista:{chiaro,scuro}}   (consegne 1 e 2)
 *  b) colore-liste.js      — regola generativa COLORE.di(blocco,slot,tema)  (consegna 3)
 *  Con (b) i venti colori si derivano dalla mappa SLOT qui sotto, trascritta dalla
 *  specifica: la funzione è la fonte, la mappa dice solo quale slot occupa ogni lista.
 *
 * ── Condizioni di misura, da tenere identiche fra un referto e l'altro ──
 *  1. Math.random sostituito da un mulberry32 seminato a SEME.
 *  2. cp() neutralizzata nel giro scuro della consegna.
 *  3. Fondo del pannello = --card.
 *  4. --on-color al posto del bianco cablato nel testo delle pastiglie.
 *  5. Guardie contro il passaggio a vuoto: zero testi o zero elementi grafici = KO.
 *  6. Il fondo di ogni elemento è risolto geometricamente, compositando in ordine di
 *     pittura tutte le forme piene che contengono il punto. Solo <rect> e <circle>.
 *
 * ── Trappole già pagate ──
 *  · Non costruire questo file per append da shell: gli heredoc mangiano le sequenze di
 *    escape e le regex arrivano corrotte. È successo due volte. Si scrive tutto in una volta.
 *  · Le guardie non sono decorative: la prima stesura passava con 0 testi esaminati.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {JSDOM} = require('jsdom');

const QUI = path.dirname(fileURLToPath(import.meta.url));
const RADICE = path.join(QUI, '..');
const APP = path.join(QUI, 'app.js');
const INDEX = path.join(RADICE, 'index.html');
const CONSEGNA = process.argv[2] || 'C:/Progetti/tema-nuovo-israele';

const SEME = 20260827;
const GRAFICI = ['k-trend','k-hist','k-hist2','k-emi','k-proj','k-power','k-movers'];
const SOGLIA_GRAFICA = 3;
const DE_FRA_BLOCCHI = 11;
/* 7,5 e non 8: la soglia originale era ricavata da una misura su un solo tema e con
   varianza sottostimata. Il vincolo che morde è la larghezza delle bande, fissata dai
   salti ≥1,309 e dai soffitti di contrasto — non la scelta dei punti. Vedi CLAUDE.md. */
const DE_DENTRO_BLOCCO = 7.5;
/* croma OKLCH minimo perché un colore conti come colorato: sotto questa soglia
   l'angolo di tinta non significa più niente e il controllo sui settori non morde. */
const CROMA_PAVIMENTO = 0.0424;
const LUM_BORDI = 1.309;    // salto richiesto fra i bordi di banda dichiarati
const LUM_COLORI = 1.30;    // salto richiesto fra i colori effettivamente consegnati
const MARGINE = 0.15;       // margine richiesto sopra ogni soglia di contrasto

/* Slot di ciascuna lista, trascritti da regola-colore.md §9. Le liste alternative
   condividono lo slot: B'Yachad quello di Yesh Atid, Lista Unita quello di Hadash-Ta'al. */
const SLOT = {
  likud:['coalizione',0], shas:['coalizione',1], utj:['coalizione',2],
  sionismo_rel:['coalizione',3], otzma:['coalizione',4],
  yesh_atid:['opposizione',0], byachad:['opposizione',0], democratici:['opposizione',1],
  blue_white:['opposizione',2], beitenu:['opposizione',3], yashar:['opposizione',4],
  bennett26:['opposizione',5],
  hadash_taal:['arabo',0], lista_araba:['arabo',0], raam:['arabo',1], balad:['arabo',2],
  casa_sionista:['incerto',0], unity_erdan:['incerto',1], israel_first:['incerto',2],
  economico:['incerto',3]
};

/* Configurazioni alternative: queste liste non compaiono mai insieme, quindi le loro
   distanze reciproche non vanno verificate. */
const ALTERNATIVE = [
  ['byachad', ['yesh_atid','bennett26']],
  ['lista_araba', ['hadash_taal','balad']]
];
function coesistono(a,b){
  for (const [x,ys] of ALTERNATIVE) {
    if (a === x && ys.includes(b)) return false;
    if (b === x && ys.includes(a)) return false;
  }
  return true;
}

if (!fs.existsSync(APP)) {
  console.error('manca test/app.js — lancia prima `npm test`');
  process.exit(2);
}

/* ══════════ COLORE ══════════ */
function rgb(c){
  c = String(c||'').trim();
  if (!c || c === 'none' || c === 'transparent') return null;
  let m = /^#([0-9a-fA-F]{6})$/.exec(c);
  if (m) { const n = parseInt(m[1],16); return [(n>>16)&255,(n>>8)&255,n&255]; }
  m = /^#([0-9a-fA-F]{3})$/.exec(c);
  if (m) return [0,1,2].map(i => parseInt(m[1][i]+m[1][i],16));
  m = /^rgba?\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)/.exec(c);
  if (m) return [+m[1],+m[2],+m[3]];
  return null;
}
function lin(x){ x/=255; return x<=0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055,2.4); }
function lum(t){ return 0.2126*lin(t[0]) + 0.7152*lin(t[1]) + 0.0722*lin(t[2]); }
function rap(a,b){ const A=lum(a), B=lum(b); return (Math.max(A,B)+0.05)/(Math.min(A,B)+0.05); }
function rapL(La,Lb){ return (Math.max(La,Lb)+0.05)/(Math.min(La,Lb)+0.05); }
function miscela(fg,bg,a){ return [0,1,2].map(i => fg[i]*a + bg[i]*(1-a)); }
function hex(t){ return '#'+t.map(v => Math.round(v).toString(16).padStart(2,'0')).join('').toUpperCase(); }

function lab(t){
  const f = x => { x/=255; return x<=0.04045 ? x/12.92 : Math.pow((x+0.055)/1.055,2.4); };
  const r=f(t[0]), g=f(t[1]), b=f(t[2]);
  let X=(r*0.4124564+g*0.3575761+b*0.1804375)/0.95047;
  let Y=(r*0.2126729+g*0.7151522+b*0.0721750);
  let Z=(r*0.0193339+g*0.1191920+b*0.9503041)/1.08883;
  const h = v => v > 216/24389 ? Math.cbrt(v) : (841/108)*v + 4/29;
  X=h(X); Y=h(Y); Z=h(Z);
  return [116*Y-16, 500*(X-Y), 200*(Y-Z)];
}
function dE2000(t1,t2){
  const [L1,a1,b1]=lab(t1), [L2,a2,b2]=lab(t2);
  const rad=Math.PI/180, deg=180/Math.PI;
  const C1=Math.hypot(a1,b1), C2=Math.hypot(a2,b2), Cm=(C1+C2)/2;
  const G=0.5*(1-Math.sqrt(Math.pow(Cm,7)/(Math.pow(Cm,7)+Math.pow(25,7))));
  const ap1=(1+G)*a1, ap2=(1+G)*a2;
  const Cp1=Math.hypot(ap1,b1), Cp2=Math.hypot(ap2,b2);
  let hp1=(b1===0&&ap1===0)?0:Math.atan2(b1,ap1)*deg; if(hp1<0) hp1+=360;
  let hp2=(b2===0&&ap2===0)?0:Math.atan2(b2,ap2)*deg; if(hp2<0) hp2+=360;
  const dLp=L2-L1, dCp=Cp2-Cp1;
  let dhp=0;
  if (Cp1*Cp2!==0){ dhp=hp2-hp1; if(dhp>180) dhp-=360; else if(dhp<-180) dhp+=360; }
  const dHp=2*Math.sqrt(Cp1*Cp2)*Math.sin(dhp/2*rad);
  const Lpm=(L1+L2)/2, Cpm=(Cp1+Cp2)/2;
  let hpm;
  if (Cp1*Cp2===0) hpm=hp1+hp2;
  else { const d=Math.abs(hp1-hp2);
    if (d<=180) hpm=(hp1+hp2)/2;
    else hpm=(hp1+hp2<360)?(hp1+hp2+360)/2:(hp1+hp2-360)/2; }
  const Tt = 1 - 0.17*Math.cos((hpm-30)*rad) + 0.24*Math.cos(2*hpm*rad)
           + 0.32*Math.cos((3*hpm+6)*rad) - 0.20*Math.cos((4*hpm-63)*rad);
  const dTh=30*Math.exp(-Math.pow((hpm-275)/25,2));
  const Rc=2*Math.sqrt(Math.pow(Cpm,7)/(Math.pow(Cpm,7)+Math.pow(25,7)));
  const Sl=1+(0.015*Math.pow(Lpm-50,2))/Math.sqrt(20+Math.pow(Lpm-50,2));
  const Sc=1+0.045*Cpm, Sh=1+0.015*Cpm*Tt;
  const Rt=-Math.sin(2*dTh*rad)*Rc;
  return Math.sqrt(Math.pow(dLp/Sl,2)+Math.pow(dCp/Sc,2)+Math.pow(dHp/Sh,2)
       + Rt*(dCp/Sc)*(dHp/Sh));
}
/* sRGB → OKLCH, per verificare i settori di tinta dichiarati */
function aOklch(t){
  const r=lin(t[0]), g=lin(t[1]), b=lin(t[2]);
  const l=Math.cbrt(0.4122214708*r+0.5363325363*g+0.0514459929*b);
  const m=Math.cbrt(0.2119034982*r+0.6806995451*g+0.1073969566*b);
  const s=Math.cbrt(0.0883024619*r+0.2817188376*g+0.6299787005*b);
  const L=0.2104542553*l+0.7936177850*m-0.0040720468*s;
  const A=1.9779984951*l-2.4285922050*m+0.4505937099*s;
  const B=0.0259040371*l+0.7827717662*m-0.8086757660*s;
  let H=Math.atan2(B,A)*180/Math.PI; if(H<0) H+=360;
  return {L, C:Math.hypot(A,B), H};
}
/* Appartenenza a un settore circolare di tinta. NESSUNA tolleranza: nella consegna 4
   la tinta ideale più vicina a un bordo dista 4,17° e lo scarto massimo introdotto
   dall'arrotondamento a 8 bit è 0,75°, quindi il margine non serve — e una tolleranza
   larga aveva già fatto passare --inc per 0,2° nel referto della consegna 3. */
function inSettore(H, da, a, toll){
  const t = toll || 0;
  H=((H%360)+360)%360; da=((da%360)+360)%360; a=((a%360)+360)%360;
  return da<=a ? (H>=da-t && H<=a+t) : (H>=da-t || H<=a+t);
}
/* quanto dista una tinta dal bordo più vicino del settore (negativo = fuori) */
function margineSettore(H, da, a){
  const g = x => ((x%360)+360)%360;
  const dentroDa = g(H-da), versoA = g(a-H), largo = g(a-da);
  if (dentroDa > largo) return -Math.min(g(da-H), g(H-a));
  return Math.min(dentroDa, versoA);
}
/* settori dichiarati: forma consegna 4 {da,a} oppure consegna 3 {ancora,verso,passo} */
function settoreDi(b){
  const S = REGOLA && REGOLA.SETTORI && REGOLA.SETTORI[b];
  if (!S) return null;
  if (S.da !== undefined && S.a !== undefined) return [S.da, S.a];
  return null;
}

/* ══════════ SORGENTI ══════════ */
const IDX = fs.readFileSync(INDEX,'utf8');
const CSS = fs.readFileSync(path.join(CONSEGNA,'knesset-theme.css'),'utf8');

function tokens(b){
  const o = {};
  for (const m of b.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) o[m[1]] = m[2].trim();
  return o;
}
function estraiTema(t, reC, reS){
  const c = tokens(t.match(reC)[1]);
  return {chiaro:c, scuro:Object.assign({}, c, tokens(t.match(reS)[1]))};
}
const T = {
  attuale : estraiTema(IDX, /#kn26\{([\s\S]*?)\n\}/, /#kn26\.scuro\{([\s\S]*?)\}/),
  consegna: estraiTema(CSS, /#kn26\{([\s\S]*?)\n\}/, /#kn26\.scuro\{([\s\S]*?)\}/)
};
const AUTO_CONSEGNA = Object.assign({}, T.consegna.chiaro,
  tokens(CSS.match(/#kn26\.auto\{([\s\S]*?)\}/)[1]));

/* anagrafica del modello: il blocco sta qui e solo qui */
const ANAG = {};
for (const m of IDX.match(/var P=\{([\s\S]*?)\n\};/)[1]
     .matchAll(/^\s*([a-z0-9_]+)\s*:\{n:"([^"]*)"[\s\S]*?c:"(#[0-9a-fA-F]{6})"[\s\S]*?b:"([a-z]+)"/gm))
  ANAG[m[1]] = {nome:m[2], c:m[3], blocco:m[4]};
const IDS = Object.keys(ANAG);
const BLOCCO_TOKEN = {coalizione:'coal', opposizione:'oppo', arabo:'arab', incerto:'inc'};

/* tavolozza: file chiuso oppure regola generativa */
let PAL = null, REGOLA = null, FONTE = '';
const fJson = path.join(CONSEGNA,'palette-liste.json');
const fJs   = path.join(CONSEGNA,'colore-liste.js');
if (fs.existsSync(fJson)) {
  const j = JSON.parse(fs.readFileSync(fJson,'utf8'));
  PAL = j.liste || j;
  FONTE = 'palette-liste.json (tavolozza chiusa)';
} else if (fs.existsSync(fJs)) {
  REGOLA = require(fJs);
  PAL = {};
  for (const id of IDS) {
    const s = SLOT[id];
    if (!s) { console.error('nessuno slot noto per la lista ' + id); process.exit(2); }
    PAL[id] = {chiaro: REGOLA.di(s[0], s[1], 'chiaro'), scuro: REGOLA.di(s[0], s[1], 'scuro')};
  }
  FONTE = 'colore-liste.js (regola generativa) + mappa SLOT da regola-colore.md §9';
} else {
  console.error('nella consegna non c\'è né palette-liste.json né colore-liste.js');
  process.exit(2);
}

/* ══════════ RENDER ══════════ */
function semina(s0){
  let s = s0>>>0;
  Math.random = function(){
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s>>>15, 1|s);
    t = t + Math.imul(t ^ t>>>7, 61|t) ^ t;
    return ((t ^ t>>>14)>>>0) / 4294967296;
  };
}
const patchLog = [];
function patchTavolozza(src, tema, tok){
  let n = 0; const mancate = [];
  for (const id of Object.keys(PAL)) {
    const re = new RegExp('(' + id + '\\s*:\\{[^}]*?c:")#[0-9a-fA-F]{6}(")');
    if (re.test(src)) { src = src.replace(re, '$1' + PAL[id][tema] + '$2'); n++; }
    else mancate.push('P.' + id);
  }
  for (const b of Object.keys(BLOCCO_TOKEN)) {
    const val = tok[BLOCCO_TOKEN[b]];
    const re = new RegExp('(' + b + ':\\{n:"[^"]*",c:")#[0-9a-fA-F]{6}(")');
    if (val && re.test(src)) { src = src.replace(re, '$1' + val + '$2'); n++; }
    else mancate.push('BL.' + b);
  }
  patchLog.push({cosa:'tavolozza ' + tema, applicate:n, mancate});
  return src;
}
function patchUna(src, da, a, etichetta){
  const prima = src;
  src = src.split(da).join(a);
  patchLog.push({cosa:etichetta, applicate: prima===src?0:1, mancate: prima===src?[da]:[]});
  return src;
}
function esegui(cfg){
  semina(SEME);
  const store = {};
  const TOK = cfg.scuro ? cfg.tok.scuro : cfg.tok.chiaro;
  const El = id => ({id, innerHTML:'', textContent:'', style:{}, className:'', dataset:{},
    disabled:false, classList:{toggle(){}, contains(){return false;}, add(){}, remove(){}},
    addEventListener(){}, querySelectorAll(){return [];}, value:''});
  global.document = {
    getElementById: id => store[id] || (store[id] = El(id)),
    createElement: () => ({click(){}, style:{}}),
    addEventListener(){}, documentElement:{scrollTop:0}, querySelectorAll(){return [];}
  };
  global.window = {
    addEventListener(){}, requestAnimationFrame(){}, pageYOffset:0,
    matchMedia: () => ({matches:cfg.scuro, addEventListener(){}, addListener(){}}),
    IntersectionObserver: class { observe(){} unobserve(){} }
  };
  global.IntersectionObserver = class { observe(){} unobserve(){} };
  global.getComputedStyle = () => ({getPropertyValue: n => TOK[n.replace('--','')] || ''});
  global.Blob = function(){};
  global.URL = {createObjectURL(){ return ''; }};
  global.FileReader = function(){};
  global.fetch = () => Promise.reject(0);

  let src = fs.readFileSync(APP,'utf8');
  src = src.replace('carica().then(render,render)',
    'global.A={render:render,sim:function(v){SIM=v;}};carica().then(render,render)');
  if (cfg.consegna) {
    src = patchTavolozza(src, cfg.scuro ? 'scuro' : 'chiaro', TOK);
    if (cfg.scuro)
      src = patchUna(src, 'function cp(hex){return SCURO?schiarisci(hex,0.40):hex;}',
                          'function cp(hex){return hex;}', 'cp() neutralizzata');
    if (TOK['on-color'])
      src = patchUna(src, 'fill="#fff"', 'fill="' + TOK['on-color'] + '"', '--on-color nelle pastiglie');
  }
  new Function(src)();      // non eval: in ESM eval eredita la modalità stretta
  global.A.sim(3000);
  global.A.render();
  const out = {};
  for (const id of GRAFICI) out[id] = (store[id] && store[id].innerHTML) || '';
  return out;
}

/* ══════════ LETTURA GEOMETRICA ══════════ */
function att(t,n){
  const s = ' ' + t, i = s.indexOf(' ' + n + '="');
  if (i < 0) return null;
  const r = s.slice(i + n.length + 3), j = r.indexOf('"');
  return j < 0 ? null : r.slice(0,j);
}
function nu(t,n,d){ const v = att(t,n), x = parseFloat(v); return v===null||isNaN(x) ? d : x; }
function alfa(t,q){ return nu(t,'opacity',1) * nu(t, q==='stroke'?'stroke-opacity':'fill-opacity', 1); }
function coppie(d){
  const n = (String(d).match(/-?[0-9]*\.?[0-9]+/g) || []).map(Number);
  const p = [];
  for (let i=0; i+1<n.length; i+=2) p.push([n[i],n[i+1]]);
  return p;
}
function elementi(svg){
  const out = [];
  for (const m of svg.matchAll(/<(rect|circle|line|path|polyline|polygon|text)\b[^>]*>/g)) {
    const t=m[0], k=m[1], e={i:m.index, tag:k, t};
    if (k==='rect'){ e.x=nu(t,'x',0); e.y=nu(t,'y',0); e.w=nu(t,'width',0); e.h=nu(t,'height',0); e.p=[e.x+e.w/2,e.y+e.h/2]; }
    else if (k==='circle'){ e.cx=nu(t,'cx',0); e.cy=nu(t,'cy',0); e.r=nu(t,'r',0); e.p=[e.cx,e.cy]; }
    else if (k==='line'){ e.p=[(nu(t,'x1',0)+nu(t,'x2',0))/2,(nu(t,'y1',0)+nu(t,'y2',0))/2]; }
    else if (k==='text'){ e.p=[nu(t,'x',0),nu(t,'y',0)]; }
    else { const c=coppie(att(t,'points')||att(t,'d')||''); e.p=c.length?c[Math.floor(c.length/2)]:null; }
    out.push(e);
  }
  return out;
}
function fondoNel(els,punto,prima,pannello){
  let bg = pannello.slice(), attribuito = false;
  for (const e of els) {
    if (e.i >= prima) break;
    if (e.tag !== 'rect' && e.tag !== 'circle') continue;
    const f = rgb(att(e.t,'fill'));
    if (!f) continue;
    const a = alfa(e.t,'fill');
    if (a <= 0) continue;
    const dentro = e.tag==='rect'
      ? (punto[0]>=e.x && punto[0]<=e.x+e.w && punto[1]>=e.y && punto[1]<=e.y+e.h)
      : (Math.hypot(punto[0]-e.cx, punto[1]-e.cy) <= e.r);
    if (dentro) { bg = miscela(f,bg,a); attribuito = true; }
  }
  return {bg, attribuito};
}
function grassetto(t){ const w=att(t,'font-weight'); return w!==null && (w==='bold'||w==='bolder'||parseFloat(w)>=700); }
function sogliaTesto(px,bold){ return (px>=24 || (bold && px>=18.66)) ? 3 : 4.5; }

function misura(html,tok){
  const pannello = rgb(tok.card);
  const testi=[], grafici=[], fuoriForma=[], irrisolti=[];
  for (const id of GRAFICI) {
    for (const blocco of (html[id].match(/<svg[\s\S]*?<\/svg>/g) || [])) {
      const els = elementi(blocco);
      for (const e of els) {
        if (!e.p) { irrisolti.push({id,tag:e.tag,perche:'nessuna coordinata utilizzabile'}); continue; }
        const {bg,attribuito} = fondoNel(els,e.p,e.i,pannello);
        if (e.tag === 'text') {
          const f = rgb(att(e.t,'fill'));
          if (!f) { irrisolti.push({id,tag:'text',perche:'fill non interpretabile: '+att(e.t,'fill')}); continue; }
          const a = alfa(e.t,'fill');
          const col = a<1 ? miscela(f,bg,a) : f;
          const px = nu(e.t,'font-size',12), bold = grassetto(e.t);
          testi.push({id,col,bg,k:rap(col,bg),px,bold,soglia:sogliaTesto(px,bold),attribuito});
          if (!attribuito) fuoriForma.push({id,tag:'text'});
        } else {
          for (const q of ['fill','stroke']) {
            const c = rgb(att(e.t,q));
            if (!c) continue;
            const a = alfa(e.t,q);
            if (a <= 0) continue;
            const col = a<1 ? miscela(c,bg,a) : c;
            grafici.push({id,tag:e.tag,quale:q,col,bg,k:rap(col,bg),a,soglia:SOGLIA_GRAFICA,attribuito});
            if (!attribuito) fuoriForma.push({id,tag:e.tag+'/'+q});
          }
        }
      }
    }
  }
  return {testi,grafici,fuoriForma,irrisolti};
}

/* ══════════ I QUATTRO GIRI ══════════ */
const giri = {};
for (const [nome,cfg] of [
  ['attuale/chiaro' , {tok:T.attuale , scuro:false, consegna:false}],
  ['attuale/scuro'  , {tok:T.attuale , scuro:true , consegna:false}],
  ['consegna/chiaro', {tok:T.consegna, scuro:false, consegna:true }],
  ['consegna/scuro' , {tok:T.consegna, scuro:true , consegna:true }]
]) {
  const html = esegui(cfg);
  giri[nome] = Object.assign({}, misura(html, cfg.scuro ? cfg.tok.scuro : cfg.tok.chiaro));
}

console.log('════ CONDIZIONI DI MISURA ════');
console.log('  consegna          : ' + CONSEGNA);
console.log('  tavolozza da      : ' + FONTE);
console.log('  seme              : ' + SEME);
console.log('  fondo pannello    : --card');
console.log('  cp() nel giro scuro della consegna: neutralizzata');
console.log('  --on-color al posto del bianco cablato nelle pastiglie: sì');

console.log('\n════ PATCH ════');
for (const p of patchLog)
  console.log('  ' + p.cosa.padEnd(28) + 'applicate: ' + p.applicate
    + (p.mancate.length ? '   NON APPLICATE: ' + p.mancate.join(', ') : ''));

console.log('\n════ GUARDIE ════');
let guardiaKO = false;
for (const g in giri) {
  const nT = giri[g].testi.length, nG = giri[g].grafici.length;
  const ok = nT>0 && nG>0;
  if (!ok) guardiaKO = true;
  console.log('  ' + (ok?'OK':'KO') + '  ' + g.padEnd(17) + nT + ' testi · ' + nG + ' elementi grafici');
}
if (guardiaKO) { console.log('\n  ATTENZIONE: giro a vuoto, referto non valido.'); process.exitCode = 1; }

/* ══════════ COESISTENZA ══════════ */
console.log('\n════ COPPIE ESCLUSE PERCHÉ NON COESISTENTI ════');
const escluse = [];
for (let i=0;i<IDS.length;i++) for (let j=i+1;j<IDS.length;j++)
  if (!coesistono(IDS[i],IDS[j])) escluse.push([IDS[i],IDS[j]]);
escluse.forEach(([a,b]) => {
  const st = ANAG[a].blocco === ANAG[b].blocco ? 'stesso blocco' : 'blocchi diversi';
  const sa = SLOT[a], sb = SLOT[b];
  console.log('  ' + (a+' / '+b).padEnd(30) + st.padEnd(16)
    + 'slot ' + sa[0] + '#' + sa[1] + ' e ' + sb[0] + '#' + sb[1]
    + (sa[0]===sb[0] && sa[1]===sb[1] ? '  (stesso slot: colore identico)' : ''));
});
console.log('  totale escluse: ' + escluse.length + ' su ' + (IDS.length*(IDS.length-1)/2) + ' coppie');

/* ══════════ A · CONFORMITÀ ══════════ */
console.log('\n════ A · CONFORMITÀ ════');
const esiti = [];
const riga = (n,d,p,x) => esiti.push({n,desc:d,passa:p,dett:x});

/* A1 · una famiglia di tinta per blocco, settori disgiunti.
   L'angolo di tinta è calcolato in OKLCH, lo stesso spazio in cui la consegna dichiara
   i settori. Attenzione: in HSL gli stessi colori cadono 40-50° più in basso — non è
   un errore, sono due spazi diversi, e confrontarli fra loro non significa niente.
   MUTA=settori ruota tutti i settori di 90° per accertarsi che il controllo sappia fallire. */
{
  const MUTA = process.env.MUTA === 'settori';
  const sett = {};
  let mancanti = 0;
  for (const b of Object.keys(BLOCCO_TOKEN)) {
    const s = settoreDi(b);
    if (!s) { mancanti++; continue; }
    sett[b] = MUTA ? [(s[0]+90)%360, (s[1]+90)%360] : s;
  }
  if (MUTA) console.log('  [MUTAZIONE ATTIVA: settori ruotati di 90°]');
  if (mancanti) {
    riga(1,'una famiglia di tinta per blocco, settori disgiunti', false,
      'la consegna non dichiara settori nella forma {da,a}: non verificabile');
  } else {
    const fuori = [];
    console.log('  [angolo di tinta OKLCH di ogni colore, e settore dichiarato]');
    for (const b of Object.keys(sett)) {
      const lista = IDS.filter(id => ANAG[id].blocco === b);
      console.log('     ' + b + '  settore [' + sett[b][0] + '°, ' + sett[b][1] + '°]');
      for (const id of lista) for (const tema of ['chiaro','scuro']) {
        const o = aOklch(rgb(PAL[id][tema]));
        const H = o.H;
        /* un grigio ha un angolo di tinta che non significa niente: sotto il pavimento
           di croma il colore non appartiene a nessuna famiglia, e va respinto */
        const colorato = o.C >= CROMA_PAVIMENTO;
        const ok = colorato && inSettore(H, sett[b][0], sett[b][1]);
        const m = margineSettore(H, sett[b][0], sett[b][1]);
        if (!ok) fuori.push({id,tema,H,b,C:o.C,perche: colorato ? 'fuori settore' : 'croma ' + o.C.toFixed(4)});
        console.log('        ' + (ok?'  ':'>>') + ' ' + tema.padEnd(7) + id.padEnd(14)
          + PAL[id][tema] + '  H=' + H.toFixed(1).padStart(6) + '°  C=' + o.C.toFixed(4)
          + '  dal bordo ' + (m>=0?'+':'') + m.toFixed(1) + '°'
          + (ok ? '' : (colorato ? '   FUORI SETTORE' : '   SOTTO IL PAVIMENTO DI CROMA')));
      }
    }
    /* i settori devono anche essere disgiunti fra loro */
    const bs = Object.keys(sett), sovr = [];
    for (let i=0;i<bs.length;i++) for (let j=i+1;j<bs.length;j++) {
      const A=sett[bs[i]], B=sett[bs[j]];
      const passi = [];
      for (let h=0;h<360;h+=0.25)
        if (inSettore(h,A[0],A[1]) && inSettore(h,B[0],B[1])) passi.push(h);
      if (passi.length) sovr.push(bs[i]+'/'+bs[j]+' si sovrappongono su ' + passi.length*0.25 + '°');
    }
    riga(1,'una famiglia di tinta per blocco, settori disgiunti, nessun grigio',
      fuori.length === 0 && sovr.length === 0,
      (fuori.length ? fuori.length + ' colori respinti: '
        + fuori.map(f=>f.id+'/'+f.tema+' ('+f.perche+')').join(', ')
        : (IDS.length*2) + ' colori su ' + (IDS.length*2) + ' dentro il proprio settore e sopra il pavimento di croma ' + CROMA_PAVIMENTO)
      + ' · ' + (sovr.length ? 'SETTORI SOVRAPPOSTI: ' + sovr.join(' · ') : 'i quattro settori sono disgiunti'));
  }
}

/* A3 · bande: bordi dichiarati ≥ LUM_BORDI, salti fra i colori consegnati ≥ LUM_COLORI */
if (REGOLA && REGOLA.BANDE) {
  /* l'ordine delle bande si ricava dalla luminanza, non si dà per scontato */
  const ordine = Object.keys(REGOLA.BANDE.chiaro)
    .sort((a,b) => REGOLA.BANDE.chiaro[a][0] - REGOLA.BANDE.chiaro[b][0]);
  const gap = [];
  for (const tema of ['chiaro','scuro'])
    for (let i=0;i<ordine.length-1;i++)
      gap.push({tema, fra:ordine[i]+'→'+ordine[i+1],
        r:rapL(REGOLA.BANDE[tema][ordine[i+1]][0], REGOLA.BANDE[tema][ordine[i]][1])});
  const perB = {};
  for (const tema of ['chiaro','scuro']) {
    perB[tema] = {};
    for (const id of IDS) (perB[tema][ANAG[id].blocco] = perB[tema][ANAG[id].blocco] || []).push(lum(rgb(PAL[id][tema])));
  }
  const gapReali = [];
  for (const tema of ['chiaro','scuro'])
    for (let i=0;i<ordine.length-1;i++) {
      const b = perB[tema][ordine[i]], a = perB[tema][ordine[i+1]];
      if (b && a) gapReali.push({tema, fra:ordine[i]+'→'+ordine[i+1], r:rapL(Math.min(...a), Math.max(...b))});
    }
  console.log('  [ordine delle bande per luminanza crescente: ' + ordine.join(' < ') + ']');
  console.log('  [salto  bordi dichiarati / colori consegnati]');
  for (let i=0;i<gap.length;i++)
    console.log('     ' + gap[i].tema.padEnd(7) + gap[i].fra.padEnd(26)
      + gap[i].r.toFixed(4) + (gap[i].r>=LUM_BORDI?'  ':'  <') + '   '
      + gapReali[i].r.toFixed(4) + (gapReali[i].r>=LUM_COLORI?'':'  <'));
  riga(3,'bordi dichiarati ≥ ' + LUM_BORDI + ' e salti effettivi ≥ ' + LUM_COLORI,
    gap.every(g=>g.r>=LUM_BORDI) && gapReali.every(g=>g.r>=LUM_COLORI),
    'bordi: minimo ' + Math.min(...gap.map(g=>g.r)).toFixed(4)
    + ' · colori consegnati: minimo ' + Math.min(...gapReali.map(g=>g.r)).toFixed(4));
} else {
  riga(3,'bordi dichiarati ≥ ' + LUM_BORDI + ' e salti effettivi ≥ ' + LUM_COLORI, false,
    'la consegna non dichiara bande: non verificabile');
}

/* A2 · ΔE dentro il blocco, solo liste coesistenti */
{
  const guasti = [], tutte = [];
  for (const tema of ['chiaro','scuro'])
    for (let i=0;i<IDS.length;i++) for (let j=i+1;j<IDS.length;j++) {
      const a=IDS[i], b=IDS[j];
      if (ANAG[a].blocco !== ANAG[b].blocco) continue;
      if (!coesistono(a,b)) continue;
      const E = dE2000(rgb(PAL[a][tema]), rgb(PAL[b][tema]));
      tutte.push({tema,a,b,E});
      if (E < DE_DENTRO_BLOCCO) guasti.push({tema,a,b,E});
    }
  tutte.sort((x,y)=>x.E-y.E);
  riga(2,'ΔE2000 ≥ ' + DE_DENTRO_BLOCCO + ' fra liste coesistenti dello stesso blocco',
    guasti.length === 0,
    tutte.length + ' coppie · minimo ' + tutte[0].E.toFixed(1) + ' (' + tutte[0].a + '/' + tutte[0].b + ', ' + tutte[0].tema + ')'
    + (guasti.length ? ' · sotto soglia: ' + guasti.map(g=>g.a+'/'+g.b+' '+g.tema+' '+g.E.toFixed(1)).join(', ') : ''));
  console.log('  [cinque coppie più strette dentro il blocco, fra coesistenti]');
  tutte.slice(0,5).forEach(c => console.log('     ΔE ' + c.E.toFixed(1).padStart(5) + '  ' + c.tema.padEnd(7) + c.a + ' / ' + c.b));
}

/* ── i cinque vincoli già passati, più il margine richiesto sopra ciascuno ── */
const SOGLIE = [];
{
  const casi = [];
  for (const tema of ['chiaro','scuro']) for (const f of ['card','paper'])
    casi.push({k:rap(rgb(T.consegna[tema].mute), rgb(T.consegna[tema][f])), dove:tema+'/'+f});
  SOGLIE.push({id:'B1', desc:'--mute su --card e --paper nei due temi', soglia:4.5,
    min:Math.min(...casi.map(c=>c.k)), n:casi.length, c3:4.93});
}
{
  const t = giri['consegna/scuro'].testi.filter(x => x.id==='k-trend' && x.bold && x.px>=18.66);
  SOGLIE.push({id:'B2', desc:'testo delle pastiglie in tema scuro', soglia:3,
    min: t.length ? Math.min(...t.map(x=>x.k)) : null, n:t.length, c3:4.53});
}
{
  const ks = [];
  for (const tema of ['chiaro','scuro']) for (const id of IDS)
    for (const f of ['card','paper']) ks.push(rap(rgb(PAL[id][tema]), rgb(T.consegna[tema][f])));
  SOGLIE.push({id:'B3', desc:'ogni lista su --card e --paper a opacità piena', soglia:3,
    min:Math.min(...ks), n:ks.length, c3:4.17});
}
{
  const ink = T.consegna.chiaro.ink;
  const ks = IDS.map(id => Math.max(rap([255,255,255], rgb(PAL[id].chiaro)), rap(rgb(ink), rgb(PAL[id].chiaro))));
  SOGLIE.push({id:'B4', desc:'tema chiaro: ogni lista ha un testo conforme', soglia:4.5,
    min:Math.min(...ks), n:ks.length, c3:4.5037});
}
{
  const oc = T.consegna.scuro['on-color'];
  const ks = oc ? IDS.map(id => rap(rgb(oc), rgb(PAL[id].scuro))) : [];
  SOGLIE.push({id:'B5', desc:'--on-color scuro sulle 20 liste', soglia:4.5,
    min: ks.length ? Math.min(...ks) : null, n:ks.length, c3:4.5302});
}

/* A4 · margine ≥ MARGINE su ogni soglia di contrasto */
{
  const stretti = SOGLIE.filter(s => s.min === null || s.min < s.soglia + MARGINE);
  riga(4,'margine ≥ ' + MARGINE + ' su ogni soglia di contrasto',
    stretti.length === 0,
    SOGLIE.map(s => s.id + ' ' + (s.min===null?'—':s.min.toFixed(3)) + '/' + (s.soglia+MARGINE)).join(' · ')
    + (stretti.length ? '   SOTTO MARGINE: ' + stretti.map(s=>s.id).join(', ') : ''));
}

/* fra blocchi diversi, per continuità coi referti precedenti */
{
  const c = [];
  for (const tema of ['chiaro','scuro'])
    for (let i=0;i<IDS.length;i++) for (let j=i+1;j<IDS.length;j++) {
      const a=IDS[i], b=IDS[j];
      if (ANAG[a].blocco === ANAG[b].blocco || !coesistono(a,b)) continue;
      c.push({tema,a,b,E:dE2000(rgb(PAL[a][tema]),rgb(PAL[b][tema]))});
    }
  c.sort((x,y)=>x.E-y.E);
  riga('extra','ΔE2000 ≥ ' + DE_FRA_BLOCCHI + ' fra liste di blocchi diversi', c[0].E >= DE_FRA_BLOCCHI,
    c.length + ' coppie · minimo ' + c[0].E.toFixed(1) + ' (' + c[0].a + '/' + c[0].b + ', ' + c[0].tema + ')');
}
esiti.sort((a,b) => String(a.n).localeCompare(String(b.n)));
for (const e of esiti)
  console.log('  ' + (e.passa?'PASSA    ':'NON PASSA') + '  ' + e.n + '. ' + e.desc + '\n              ' + e.dett);

console.log('\n════ B · NON REGRESSIONE DEI CINQUE ════');
console.log('  id  vincolo                                       soglia  +marg  misurato  consegna3  verso');
for (const s of SOGLIE) {
  const m = s.min;
  const verso = (m===null||s.c3===undefined) ? '' : (m > s.c3+0.0005 ? 'cresciuto' : (m < s.c3-0.0005 ? 'CALATO' : 'uguale'));
  console.log('  ' + s.id + '  ' + s.desc.padEnd(45)
    + s.soglia.toFixed(2).padStart(6) + (s.soglia+MARGINE).toFixed(2).padStart(7)
    + (m===null?'     —':m.toFixed(3).padStart(10))
    + (s.c3===undefined?'         —':s.c3.toFixed(3).padStart(11)) + '  ' + verso
    + (m!==null && m>=s.soglia ? '' : '   NON PASSA'));
}

/* ══════════ B · LA REGOLA ══════════ */
if (REGOLA) {
  console.log('\n════ B · VERIFICA DELLA REGOLA ════');
  const ordine = Object.keys(REGOLA.BANDE.chiaro);

  console.log('  [1] ogni colore ricade nella banda di luminanza dichiarata?');
  let fuoriBanda = 0;
  for (const tema of ['chiaro','scuro']) {
    for (const id of IDS) {
      const b = ANAG[id].blocco, B = REGOLA.BANDE[tema][b], L = lum(rgb(PAL[id][tema]));
      const dentro = L >= B[0]-0.0015 && L <= B[1]+0.0015;
      if (!dentro) {
        fuoriBanda++;
        console.log('     FUORI  ' + tema.padEnd(7) + id.padEnd(14) + PAL[id][tema]
          + '  L=' + L.toFixed(4) + '  banda [' + B[0].toFixed(4) + ', ' + B[1].toFixed(4) + ']');
      }
    }
  }
  console.log('     ' + (fuoriBanda ? fuoriBanda + ' colori fuori banda' : 'tutti e 40 dentro banda'));

  console.log('  [2] la tinta corrisponde al passo dichiarato da + ampiezza·(k+0,5)/n?');
  let fuoriReticolo = 0, maxScartoH = 0;
  for (const id of IDS) {
    const [b,slot] = SLOT[id], S = REGOLA.SETTORI[b];
    if (S.da === undefined) continue;
    const n = S.posti, k = slot % n, w = ((S.a - S.da) + 360) % 360;
    const atteso = ((S.da + w*(k+0.5)/n)%360+360)%360;
    for (const tema of ['chiaro','scuro']) {
      const H = aOklch(rgb(PAL[id][tema])).H;
      let d = Math.abs(H-atteso); if (d>180) d = 360-d;
      maxScartoH = Math.max(maxScartoH, d);
      if (d > 1.5) {
        fuoriReticolo++;
        console.log('     SCOSTA ' + tema.padEnd(7) + id.padEnd(14) + 'slot ' + slot
          + '  atteso ' + atteso.toFixed(1) + '°  ottenuto ' + H.toFixed(1) + '°  scarto ' + d.toFixed(2) + '°');
      }
    }
  }
  console.log('     ' + (fuoriReticolo ? fuoriReticolo + ' colori fuori reticolo (scarto > 1,5°)'
    : 'tutte le tinte sul reticolo') + ' · scarto massimo ' + maxScartoH.toFixed(2) + '°');

  console.log('  [3] ΔE minimo dichiarato per numero di liste accese (regola-colore.md §4)');
  const dich = {
    2:{arabo:5.8, coalizione:6.3, incerto:8.3, opposizione:5.5},
    3:{arabo:5.8, coalizione:6.3, incerto:7.0, opposizione:4.5},
    4:{arabo:4.3, coalizione:6.3, incerto:6.9, opposizione:3.7},
    5:{arabo:null, coalizione:6.3, incerto:null, opposizione:3.7},
    6:{arabo:null, coalizione:6.3, incerto:null, opposizione:3.7}
  };
  console.log('     n  blocco        dichiarato  misurato');
  for (const n of [2,3,4,5,6]) {
    for (const b of ordine) {
      const d = dich[n][b];
      let min = Infinity, dove='';
      for (const tema of ['chiaro','scuro']) {
        const cs = [];
        for (let s=0;s<n;s++) cs.push(rgb(REGOLA.di(b,s,tema)));
        for (let i=0;i<n;i++) for (let j=i+1;j<n;j++) {
          const E = dE2000(cs[i],cs[j]);
          if (E < min) { min = E; dove = tema+' '+i+'/'+j; }
        }
      }
      const scarto = d===null ? '' : (Math.abs(min-d) <= 0.35 ? '  ok' : '  SCOSTA di ' + (min-d).toFixed(1));
      console.log('     ' + n + '  ' + b.padEnd(13) + (d===null?'   —    ':String(d).padStart(6)+'  ')
        + '    ' + min.toFixed(1).padStart(5) + scarto + '   (' + dove + ')');
    }
  }
}

/* ══════════ C · REGRESSIONI ══════════ */
console.log('\n════ C · REGRESSIONI, stesso elemento ════');
const ruoloDi = (r,q) => q==='testi'
  ? 'testo ' + r.px + 'px' + (r.bold?' grassetto':'')
  : r.tag + '/' + r.quale + (r.a<1 ? ' a='+r.a.toFixed(2) : '');
for (const tema of ['chiaro','scuro']) {
  const A = giri['attuale/'+tema], C = giri['consegna/'+tema];
  const righe = {};
  for (const q of ['testi','grafici']) {
    if (A[q].length !== C[q].length) { console.log('  ⚠ ' + tema+'/'+q + ' non appaiabile'); continue; }
    for (let i=0;i<A[q].length;i++) {
      const a=A[q][i], c=C[q][i];
      if (a.k >= a.soglia && c.k >= c.soglia) continue;
      const ch = [a.id, ruoloDi(a,q), hex(a.col)+' → '+hex(c.col), hex(a.bg)+' → '+hex(c.bg), a.soglia].join('|');
      if (!righe[ch]) righe[ch] = {n:0, ka:99, kc:99, ch};
      righe[ch].n++;
      righe[ch].ka = Math.min(righe[ch].ka, a.k);
      righe[ch].kc = Math.min(righe[ch].kc, c.k);
    }
  }
  const ord = Object.values(righe).sort((x,y)=>(x.kc-x.ka)-(y.kc-y.ka));
  const nuove = ord.filter(r => r.ka >= +r.ch.split('|')[4] && r.kc < +r.ch.split('|')[4]);
  console.log('\n── tema ' + tema + ' ── ' + ord.length + ' contesti · '
    + nuove.length + ' REGRESSIONI VERE (passavano, ora no)');
  ord.forEach(r => {
    const [id,ruolo,col,bg,s] = r.ch.split('|');
    const nuova = r.ka >= +s && r.kc < +s;
    const verso = r.kc<r.ka-0.005 ? 'peggiora' : (r.kc>r.ka+0.005 ? 'migliora' : 'invariato');
    console.log('  ' + (nuova ? '>>>' : '   ') + String(r.n).padStart(4) + 'x ' + id.padEnd(9)
      + ruolo.padEnd(22) + col.padEnd(21) + ' su ' + bg.padEnd(21)
      + ' ' + r.ka.toFixed(2).padStart(5) + ' → ' + r.kc.toFixed(2).padStart(5)
      + '  soglia ' + s + '  ' + verso + (r.kc >= +s ? '  [rientra]' : ''));
  });
}

console.log('\n════ TAVOLOZZA DERIVATA ════');
for (const id of IDS)
  console.log('  ' + id.padEnd(14) + (SLOT[id] ? (SLOT[id][0]+'#'+SLOT[id][1]).padEnd(16) : ''.padEnd(16))
    + PAL[id].chiaro + '  ' + PAL[id].scuro);
console.log('\n  token consegna chiaro/scuro:');
for (const k of Object.keys(T.consegna.chiaro).sort())
  if (/^#/.test(T.consegna.chiaro[k]))
    console.log('    --' + k.padEnd(10) + T.consegna.chiaro[k] + '  ' + (T.consegna.scuro[k]||''));
