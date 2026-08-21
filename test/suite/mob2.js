/* Verifica mobile: viewport 380px, tutti gli elementi introdotti di recente. */
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>',{pretendToBeVisual:true});
global.DOMParser=dom.window.DOMParser;
const W=dom.window,D=W.document;
const html=require('fs').readFileSync('../../index.html','utf8');
D.body.innerHTML=html.replace(/<script>[\s\S]*?<\/script>/g,'').match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document=D;global.window=W;
Object.defineProperty(W,'innerWidth',{value:380,writable:true});
W.matchMedia=q=>({matches:/max-width:\s*(660|760|520)px/.test(q),addEventListener(){},addListener(){}});
W.IntersectionObserver=class{observe(){}unobserve(){}};global.IntersectionObserver=W.IntersectionObserver;
W.requestAnimationFrame=f=>f();global.getComputedStyle=()=>({getPropertyValue:()=>''});
W.Element.prototype.scrollIntoView=function(){};
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};
global.fetch=()=>Promise.reject(0);
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,S:()=>({SEG,EVENTI})};carica().then(render,render)');
eval(src);
const A=global.A;A.render();
const $=i=>D.getElementById(i);
const click=el=>el&&el.dispatchEvent(new W.MouseEvent('click',{bubbles:true}));
const css=(html.match(/<style>([\s\S]*?)<\/style>/)||[])[1]||'';
const V=380;                       /* larghezza utile del viewport */

/* 1 · gli SVG scalano: verifico che nessuno abbia larghezza fissa in pixel */
const svgFissi=[...D.querySelectorAll('svg')].filter(s=>s.hasAttribute('width')||s.hasAttribute('height')).length;
/* 2 · testo minimo negli SVG una volta scalati */
function minFont(id,vbW){
  const s=$(id); if(!s) return null;
  const fs=[...s.innerHTML.matchAll(/font-size="([\d.]+)"/g)].map(m=>+m[1]);
  if(!fs.length) return null;
  return (Math.min(...fs)*V/vbW);
}
const fTrend=minFont('k-trend',520), fEmi=minFont('k-emi',430);
/* 3 · elementi interattivi: area di tocco */
const bottoni=[...D.querySelectorAll('button')].length;
const anc=[...D.querySelectorAll('[data-sw]')].length;
const cronoVoci=[...D.querySelectorAll('.crono button[data-ev]')].length;
/* 4 · il riquadro del fatto si apre anche da mobile */
click(D.querySelectorAll('.crono button[data-ev]')[4]);
const evOk=/on/.test($('k-evsel').className) && $('k-evsel').innerHTML.length>120;
click(D.querySelector('#k-evsel .x'));
/* 4b · sotto i 660 il riquadro dell'evento vive DENTRO l'elenco, sotto la voce premuta.
   A 380 le voci portate a 44px fanno un elenco alto ~893px: un riquadro in cima, o anche
   solo sotto il grafico, dalla coda dell'elenco resterebbe lontano quanto prima. Qui il
   comando e la risposta sono nello stesso punto, e non c'è nessuno scorrimento da fare —
   quindi nessun salto sotto il dito. È lo STESSO elemento spostato, non una seconda
   copia: rEvSel scrive una volta sola. */
/* figli DIRETTI: quando il riquadro è dentro l'elenco, il suo «chiudi» è anch'esso un
   button[data-ev] — con data-ev vuoto — e un selettore discendente lo pescherebbe come
   se fosse una voce di cronologia */
const cronoBtn=()=>[...D.querySelectorAll('#k-crono > button[data-ev]')];
const evsel=()=>$('k-evsel');
click(cronoBtn()[cronoBtn().length-1]);                    /* l'ultima voce: il caso peggiore */
const mobDentro=evsel().parentElement.id==='k-crono';
const mobDopo=cronoBtn()[cronoBtn().length-1].nextElementSibling===evsel();
const mobUno=D.querySelectorAll('#k-evsel').length===1;
/* «chiudi» riporta il riquadro a casa e NON lascia il fuoco a vuoto: con il riquadro
   dentro l'elenco, riconoscerlo da closest('#k-crono') mandava il fuoco su un selettore
   che dopo il render non esisteva più */
const ultimoEv=cronoBtn()[cronoBtn().length-1].dataset.ev;
click(evsel().querySelector('.x'));
const mobCasa=evsel().parentElement!==$('k-crono');
const mobFuoco=D.activeElement&&D.activeElement.dataset&&D.activeElement.dataset.ev===ultimoEv;
/* e l'elenco non ha perso il riquadro per strada: si riapre */
click(cronoBtn()[2]);
const mobRiapre=/on/.test(evsel().className)&&evsel().parentElement.id==='k-crono';
click(evsel().querySelector('.x'));

/* 4c · il riquadro spostato dentro l'elenco non deve essere raggiunto da NESSUNA regola
   scritta per le voci. È il difetto che rendeva i tre seggi tre macchie scure — fondo
   --ink2 e testo --ink dentro un cerchio da 17px, contrasto 1,76:1 — e «chiudi», che è in
   posizione assoluta, un rettangolo 324x44 sopra il titolo. La prova non guarda un
   selettore per volta: prende TUTTE le regole della cronologia dal foglio e verifica che
   nessuna raggiunga qualcosa dentro il riquadro, così vale anche per quelle di domani. */
click(cronoBtn()[4]);
const selCrono=(css.match(/#kn26 .crono[^{]*{/g)||[]).map(x=>x.slice(0,-1).trim())
 .filter(x=>!/#k-evsel/.test(x));
const dentroRiq=[...evsel().querySelectorAll('*')];
const raggiunti=selCrono.filter(sel=>{try{return dentroRiq.some(e=>e.matches(sel));}catch(_){return false;}});
const mobPulito=raggiunti.length===0;
const mobQuanteRegole=selCrono.length;
click(evsel().querySelector('.x'));

/* 4d · i dischi degli eventi nell'SVG stanno su corsie: erano sedici su una riga sola,
   passo minimo 2,4px e sette coppie sovrapposte su quindici. Non sono bersagli — il
   comando resta la voce — ma un segno illeggibile non è un segno. */
const cyDischi=[...new Set([...$('k-trend').querySelectorAll('circle')]
 .filter(c=>c.getAttribute('r')==='10').map(c=>c.getAttribute('cy')))];

/* 5 · legenda del grafico */
const legOk=[...D.querySelectorAll('#k-trendleg b[data-ln]')].length===3;
/* 6 · regole mobile presenti per i nuovi elementi */
const R660=(css.match(/@media\(max-width:660px\)\{([\s\S]*?)\n\}/g)||[]).join(' ');
const haRegola=n=>new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(css.replace(/\s+/g,' '));

console.log("VERIFICA MOBILE · viewport 380px\n");
console.log("  carattere più piccolo nel grafico:  "+(fTrend?fTrend.toFixed(1)+' px':'—'));
console.log("  carattere più piccolo nell emiciclo: "+(fEmi?fEmi.toFixed(1)+' px':'—'));
console.log("  bottoni totali: "+bottoni+" · ancoraggi swing: "+anc+" · voci cronologia: "+cronoVoci);
console.log("\n── controlli ──");
const ck={
 "nessun SVG a larghezza fissa": svgFissi===0,
 "testo del grafico leggibile (≥5px scalato)": fTrend>=5,
 "testo dell emiciclo leggibile (≥7px scalato)": fEmi>=7,
 "cinque ancoraggi dello swing presenti": anc===5,
 /* Il conto era cablato a quattordici e cadeva ogni volta che una voce-evento veniva
    tradotta ed entrava in EVENTI — che è il lavoro previsto, non una regressione. La
    proprietà vera è che da mobile siano cliccabili TUTTE le voci, non che siano quattordici. */
 "tutte le voci di cronologia cliccabili da mobile": cronoVoci===A.S().EVENTI.length && cronoVoci>8,
 "il riquadro del fatto si apre da mobile": evOk,
 "sotto i 660 il riquadro compare dentro l elenco": mobDentro,
 "e subito sotto la voce premuta, anche l ultima": mobDopo,
 "ed è un elemento solo, spostato e non copiato": mobUno,
 "«chiudi» lo riporta a casa": mobCasa,
 "e non lascia il fuoco a vuoto": mobFuoco,
 "e l elenco lo riapre senza averlo perso": mobRiapre,
 "nessuna regola della cronologia raggiunge il riquadro spostato": mobPulito,
 "e le regole controllate sono quelle vere del foglio": mobQuanteRegole>=6,
 "i dischi degli eventi stanno su piu di una corsia": cyDischi.length>1,
 "legenda del grafico con tre serie": legOk,
 "regola mobile per la legenda interattiva": haRegola('.leg.lint'),
 "regola mobile per il riquadro del fatto": haRegola('.evsel .eb'),
 "regola mobile per gli ancoraggi": haRegola('.anc'),
 "titoli istogrammi vanno a capo": haRegola('.htit') && /flex-wrap:wrap/.test(css.replace(/\s+/g,'')),
 "totale 120": Object.values(A.S().SEG).reduce((a,b)=>a+b,0)===120,
};
Object.entries(ck).forEach(([k,v])=>console.log(" "+(v?"OK  ":"KO  ")+k));
