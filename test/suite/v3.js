const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>',{pretendToBeVisual:true});
global.DOMParser=dom.window.DOMParser;
const W=dom.window, D=W.document;
const html=require('fs').readFileSync('../../index.html','utf8');
const body=html.replace(/<script>[\s\S]*?<\/script>/g,'').match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
D.body.innerHTML=body;
global.document=D; global.window=W;
W.matchMedia=q=>({matches:/dark/.test(q)?false:false,addEventListener(){},addListener(){}});
W.IntersectionObserver=class{constructor(f){this.f=f;}observe(){}unobserve(){}};
W.requestAnimationFrame=f=>f();
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};
global.fetch=()=>Promise.reject(0);
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,S:()=>({SOND,SEG,MC,L,blocchi}),sim:v=>{SIM=v},setEmi:v=>{EMIMODE=v},setF:o=>{Object.assign(FILTRI,o);},rTab:rTab,idx:costruisciIndice};carica().then(render,render)');
eval(src);
const A=global.A; A.sim(20000);
const t0=Date.now(); A.render(); const ms=Date.now()-t0;
A.idx();
const $=i=>D.getElementById(i);
const tx=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const {SOND,SEG,MC,blocchi}=A.S();
console.log("render:",ms+"ms  · totale seggi:",Object.values(SEG).reduce((a,b)=>a+b,0));
console.log("\n── INDICE ──\n "+tx($('k-idx').innerHTML));
console.log("\n── DIDASCALIA ISTOGRAMMA ──\n "+tx($('k-cap1').innerHTML));
console.log("\n── LEDE COALIZIONI ──\n "+tx($('k-coallede').innerHTML));
console.log("\n── ANALISI (coda) ──\n ..."+tx($('k-analisi').innerHTML).slice(-260));
console.log("\n── CALENDARIO ──");
Array.from($('k-calend').querySelectorAll('.dt')).forEach(d=>console.log("  "+d.textContent));
const q=(a,p)=>a[Math.floor(p*a.length)];
console.log("\n── INTERVALLI ──");
console.log("  coalizione 80%:",q(MC.coal,.10),"-",q(MC.coal,.90),"| 90%:",q(MC.coal,.05),"-",q(MC.coal,.95));
console.log("  Likud 80%:",q(MC.d.likud,.10),"-",q(MC.d.likud,.90));
// emiciclo blocchi
A.setEmi('blocchi'); A.render();
const emiB=$('k-emileg').innerHTML;
A.setEmi('partiti'); A.render();
// filtri
A.setF({ist:'Lazar · Panel4All'}); A.rTab();
const n1=($('k-tab').innerHTML.match(/<tr/g)||[]).length;
A.setF({ist:'',per:'30'}); A.rTab();
const n2=($('k-tab').innerHTML.match(/<tr/g)||[]).length;
A.setF({per:'0'}); A.rTab();
const n3=($('k-tab').innerHTML.match(/<tr/g)||[]).length;
console.log("\n── controlli ──");
const ck={
 "indice generato": ($('k-idx').innerHTML.match(/<a /g)||[]).length>=10,
 "sesto blocco calendario (8 settembre)": /8 settembre/.test($('k-calend').innerHTML),
 "grafico da gennaio ad agosto": (()=>{const t=$('k-trend').innerHTML;
   const gen=t.indexOf('>gen<'), ago=t.indexOf('>ago<'); return gen>=0&&ago>=0&&gen<ago;})(),
 "emiciclo per blocchi": /Blocco Netanyahu/.test(emiB)&&/Opposizione sionista/.test(emiB),
 "emiciclo per lista ripristinato": /Likud/.test($('k-emileg').innerHTML),
 "filtro istituto riduce le righe": n1<n3 && n1>1,
 "filtro periodo riduce le righe": n2<n3 && n2>1,
 "intestazione 8 casi su 10": /8 casi su 10/.test(D.body.innerHTML),
 "nota metodologica richiudibile": !!D.querySelector('#k-metodo summary'),
 "guida ai comandi presente": /Sposta punti percentuali/.test(D.body.innerHTML),
 "titolo house effect": /House effect/.test(D.body.innerHTML),
 "simulatore rinominato": /Simulatore manuale di maggioranza/.test(D.body.innerHTML),
 "didascalia senza gergo": !/mediana simulata/.test($('k-cap1').innerHTML),
};
Object.entries(ck).forEach(([k,v])=>console.log(" "+(v?"OK  ":"KO  ")+k));
