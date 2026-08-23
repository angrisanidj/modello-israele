const {JSDOM}=require('jsdom');
const dom=new JSDOM('');global.DOMParser=dom.window.DOMParser;
const store={},lst={};
/* attributi veri e non finto silenzio: vedi il commento in aff.js e il punto 13 */
function El(id){return{id,innerHTML:'',textContent:'',style:{},className:'',dataset:{},attr:{},setAttribute(k,v){this.attr[k]=v;},getAttribute(k){return k in this.attr?this.attr[k]:null;},removeAttribute(k){delete this.attr[k];},hidden:false,disabled:false,
 classList:{toggle(){},contains(){return false},add(){},remove(){}},
 addEventListener(e,f){lst[id]=f;},querySelectorAll(){return[]},value:''};}
global.document={getElementById:id=>store[id]||(store[id]=El(id)),createElement:()=>({click(){},style:{}}),
 addEventListener(){},documentElement:{scrollTop:0}};
global.window={addEventListener(){},requestAnimationFrame(){},pageYOffset:0};
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};
global.fetch=(u)=>/wikipedia/.test(u)?Promise.resolve({ok:true,text:()=>Promise.resolve(require('../../dati/fixture.js'))})
 :Promise.resolve({json:()=>Promise.resolve({content:[{type:'text',text:'{"sondaggi":[]}'}]})});
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={S:()=>({SOND,SEG,MC,L,EVENTI,COALS,SOGLIE,blocchi,TAPPE}),render:render,sim:v=>{SIM=v},SOND:function(){return SOND;},setSOND:function(v){SOND=v;},EVENTI:function(){return EVENTI;}};carica().then(render,render)');
eval(src);
/* L'ARCHIVIO SI RIPORTA A OGGI PRIMA DI PROVARE. Questa suite legge la tabella
   dell'analisi (o la proiezione di confronto), che vivono in una finestra di sette giorni
   ancorata a OGGI: con l'archivio del repository letto fra un mese la finestra è vuota, la
   tabella lo dichiara — giustamente — e la suite cade su un difetto che non c'è. Ribasare
   sposta tutte le date della stessa quantità e non cambia niente di relativo: rende
   esplicita l'assunzione «archivio fresco» invece di lasciarla silenziosa.
   Vedi test/frescura.js e npm run spazzola. */
require('../frescura.js')(global.A);

global.A.sim(20000);
const t=Date.now(); global.A.render(); const ms=Date.now()-t;
const {SOND,SEG,MC,L,EVENTI,blocchi}=global.A.S();
const txt=s=>String(s||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
console.log("archivio",SOND.length,"| nel modello",L.length,"| eventi",EVENTI.length,"| render",ms+"ms");
console.log("\n── SOMMARIO DI TESTATA ──\n"+txt(store['k-deck'].innerHTML));
console.log("\n── ANALISI GENERATA ──\n"+txt(store['k-analisi'].innerHTML));
console.log("\n── VERDETTO ──\n"+txt(store['k-verdetto'].innerHTML).slice(0,330)+"…");
console.log("\n── MOVERS (prime righe) ──");
txt(store['k-movers'].innerHTML).split(/(?=[A-Z])/).slice(0,0);
const mv=store['k-movers'].innerHTML.split('</div></div>').slice(0,6)
 .map(x=>txt(x).replace(/^\s+/,'')).filter(Boolean);
mv.forEach(x=>console.log("  "+x));
console.log("\n── CRONOLOGIA ──\n  "+txt(store['k-crono'].innerHTML).slice(0,260)+"…");
console.log("\n── CALENDARIO ──");
store['k-calend'].innerHTML.split('</div></div>').filter(x=>x.trim()).forEach(x=>{
 const c=txt(x); if(c) console.log("  "+c.slice(0,110));});
console.log("\n── controlli ──");
const checks={
 "sticky popolata": txt(store['k-sprobs'].innerHTML).length>5,
 /* Era /giorni/, che dopo il 27 ottobre è falso e a ragione: la fascia dice «voto
    concluso». L'attesa giusta non è la parola ma la coppia — o il conto alla rovescia, o
    la dichiarazione che è finito — e non c'è un terzo caso in cui la riga possa restare
    muta. Trovato con npm run spazzola al 20 novembre. */
 "la fascia dice o quanto manca o che si è votato":
   /^\d+ giorni al voto$/.test(store['k-scd'].textContent.trim()) ||
   /^voto concluso$/.test(store['k-scd'].textContent.trim()),
/* Le due date sono due grandezze diverse: k-upd è l'ultima VERIFICA riuscita, letta da
    dati/stato-job.json, k-fresh l'ultimo SONDAGGIO. Qui il fetch è respinto, quindi il
    registro non c'è e la testata deve DIRLO invece di ripiegare sulla data del sondaggio:
    è precisamente il difetto che la separazione chiude. */
 "la verifica non nota è dichiarata": /verifica non nota/.test(store['k-upd'].textContent),
 "e l'ultimo sondaggio resta una data vera": /ultimo sondaggio/.test(store['k-fresh'].innerHTML)
   && /\d{4}/.test(store['k-fresh'].innerHTML)
   && !/aggiornato al/.test(store['k-upd'].textContent),
 "analisi non vuota": txt(store['k-analisi'].innerHTML).length>120,
 "movers popolati": store['k-movers'].innerHTML.includes('class="pr mv"'),
 "cronologia popolata": store['k-crono'].innerHTML.includes('<b>1</b>'),
 /* I numeri degli eventi non stanno più dentro l'SVG sopra i 660px: sono <button> veri
    in uno strato HTML sopra il grafico, perché un <circle> non ha fuoco né area di tocco.
    L'attesa segue il numero degli eventi, non una stringa di stile. */
 /* Questo banco non ha matchMedia, quindi STRATO è falso: i marcatori sono i dischi
    dentro l'SVG, che è il ramo attivo sotto i 900px. L'attesa segue il numero degli
    eventi, non una stringa di stile. */
 "eventi sul grafico": (store['k-trend'].innerHTML.match(/<title>/g)||[]).length===EVENTI.length,
 /* NON SEI: quante ne dichiara TAPPE. Il calendario ha preso la riga del termine degli
    accordi di eccedenza, e un numero scritto qui direbbe «difetto» a ogni riga in più. */
 "calendario: tutte le tappe rese": (store['k-calend'].innerHTML.match(/class="dt"/g)||[]).length===A.S().TAPPE.length,
 "totale 120": Object.values(SEG).reduce((a,b)=>a+b,0)===120,
};
require('../esito.js')(checks);
