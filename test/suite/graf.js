const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>',{pretendToBeVisual:true});
global.DOMParser=dom.window.DOMParser;
const W=dom.window,D=W.document;
const html=require('fs').readFileSync('../../index.html','utf8');
D.body.innerHTML=html.replace(/<script>[\s\S]*?<\/script>/g,'').match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document=D;global.window=W;
W.matchMedia=()=>({matches:false,addEventListener(){},addListener(){}});
W.IntersectionObserver=class{observe(){}unobserve(){}};global.IntersectionObserver=W.IntersectionObserver;
W.requestAnimationFrame=f=>f();global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};
global.fetch=()=>Promise.reject(0);
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,SOND:function(){return SOND;},setSOND:function(v){SOND=v;},EVENTI:function(){return EVENTI;},emi:v=>{EMIMODE=v},S:()=>({SEG,serieModello,blocchi})};carica().then(render,render)');
eval(src);
/* L'ARCHIVIO SI RIPORTA A OGGI PRIMA DI PROVARE. Questa suite legge la tabella
   dell'analisi (o la proiezione di confronto), che vivono in una finestra di sette giorni
   ancorata a OGGI: con l'archivio del repository letto fra un mese la finestra è vuota, la
   tabella lo dichiara — giustamente — e la suite cade su un difetto che non c'è. Ribasare
   sposta tutte le date della stessa quantità e non cambia niente di relativo: rende
   esplicita l'assunzione «archivio fresco» invece di lasciarla silenziosa.
   Vedi test/frescura.js e npm run spazzola. */
require('../frescura.js')(global.A);

const A=global.A;A.render();
const $=i=>D.getElementById(i);
const tx=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
console.log("── TITOLI ISTOGRAMMI ──");
console.log("  1: "+tx($('k-htit1').innerHTML));
console.log("  2: "+tx($('k-htit2').innerHTML));
console.log("\n── PROIEZIONE con affiliazione ──");
$('k-proj').innerHTML.split('</div></div>').slice(0,4).forEach(x=>{const c=tx(x);if(c)console.log("  "+c.slice(0,72));});
console.log("\n── LEGENDA DEL GRAFICO ──\n  "+tx($('k-trendleg').innerHTML));
const svg=$('k-trend').innerHTML;
console.log("\n── controlli ──");
const ck={
 "titoli istogrammi presenti": /Blocco Netanyahu/.test($('k-htit1').innerHTML)&&/Opposizione sionista/.test($('k-htit2').innerHTML),
 "affiliazione accanto alle liste": ($('k-proj').innerHTML.match(/class="blq"/g)||[]).length>=8,
 "affiliazione nei movers": ($('k-movers').innerHTML.match(/class="blq"/g)||[]).length>=8,
 "emiciclo senza righe sopra i pallini": !/stroke-width="3"/.test($('k-emi').innerHTML),
 "emiciclo 120 seggi": ($('k-emi').innerHTML.match(/r="5.4"/g)||[]).length===120,
 "grafico: almeno le tre linee di blocco": (svg.match(/class="ln ln-/g)||[]).length>=3,
 "grafico: nuvola dei sondaggi": (svg.match(/class="pt pt-/g)||[]).length>100,
 /* IL NUMERO DELLE SERIE NON SI SCRIVE PIÙ QUI. Erano tre, e il 27 agosto 2026 sono
    diventate quattro il giorno in cui la tendenza ha smesso di buttare via l'ago della
    bilancia — che nell'archivio pubblicato ha seggi in quindici rilevazioni. Un «3» in
    questa prova avrebbe detto «difetto» dove c'era una riparazione, ed è esattamente
    l'attesa che si aggiorna facendola tornare verde senza guardare.
    La proprietà che conta è che le TRE VISTE della stessa serie concordino: la linea nel
    disegno, la pastiglia col valore in fondo alla linea, la voce di legenda. Sono tre
    strade per lo stesso insieme, ed è la regola del progetto sulle strade multiple. */
 "etichette finali, linee e legenda dicono lo stesso numero di serie":
   (function(){
     var linee=new Set((svg.match(/class="ln ln-([a-z])"/g)||[]).map(function(x){return x.slice(-2,-1);}));
     var past=(svg.match(/<rect[^>]*rx="4"/g)||[]).length;
     var voci=($('k-trendleg').innerHTML.match(/<s>/g)||[]).length;
     return linee.size>=3 && past===linee.size && voci===linee.size;
   })(),
 "legenda cliccabile": /data-ln=/.test($('k-trendleg').innerHTML),
 /* Era «parte da gennaio», cioè una data assoluta: dopo che l'archivio viene riportato a
    oggi le date sono tutte spostate della stessa quantità, e gennaio non c'è più. La
    proprietà che serviva non era quella — era che la serie cominci dove comincia
    l'archivio, cioè che non tagli via i mesi vecchi, e quella vale a qualunque data. */
 "la serie copre anche l'era pre-fusione, invece di partire dall'era attuale":
   (() => { const s = A.S().serieModello();
     const pre = A.SOND().filter(x => x.pre).map(x => x.data).sort();
     /* serieModello chiama attiviAl(d, true), cioè col flag che tiene dentro le
        rilevazioni di prima della fusione: se lo perdesse, la serie comincerebbe dove
        comincia l'era attuale. Il confronto è fra due date dell'archivio, quindi non
        dipende da quando la prova viene eseguita. */
     return s.length > 20 && pre.length > 0 && s[0].d < pre[pre.length - 1]; })(),
 "totale 120": Object.values(A.S().SEG).reduce((a,b)=>a+b,0)===120,
};
require('../esito.js')(ck);
