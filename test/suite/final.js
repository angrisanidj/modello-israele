const {JSDOM}=require('jsdom');
const dom=new JSDOM('');global.DOMParser=dom.window.DOMParser;
const store={},lst={};
function El(id){return{id,innerHTML:'',textContent:'',style:{},className:'',dataset:{},disabled:false,
 classList:{toggle(){},contains(){return false},add(){},remove(){}},
 addEventListener(e,f){lst[id]=f;},querySelectorAll(){return[]},value:''};}
global.document={getElementById:id=>store[id]||(store[id]=El(id)),createElement:()=>({click(){},style:{}}),
 addEventListener(){},documentElement:{scrollTop:0}};
global.window={addEventListener(){},requestAnimationFrame(){},pageYOffset:0};
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};
global.fetch=(u)=>/wikipedia/.test(u)?Promise.resolve({ok:true,text:()=>Promise.resolve(require('../../dati/fixture.js'))})
 :Promise.resolve({json:()=>Promise.resolve({content:[{type:'text',text:'{"sondaggi":[]}'}]})});
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={S:()=>({SOND,SEG,MC,L,EVENTI,COALS,SOGLIE,blocchi}),render:render,sim:v=>{SIM=v}};carica().then(render,render)');
eval(src);
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
 "countdown sticky": /giorni/.test(store['k-scd'].textContent),
 "data aggiornamento": /aggiornato al/.test(store['k-upd'].textContent),
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
 "calendario 6 tappe": (store['k-calend'].innerHTML.match(/class="dt"/g)||[]).length===6,
 "totale 120": Object.values(SEG).reduce((a,b)=>a+b,0)===120,
};
Object.entries(checks).forEach(([k,v])=>console.log(" "+(v?"OK  ":"KO  ")+k));
