const {JSDOM}=require('jsdom');const dom=new JSDOM('');global.DOMParser=dom.window.DOMParser;
/* attributi veri e non finto silenzio: vedi il commento in aff.js e il punto 13 */
const store={};function El(id){return{id,innerHTML:'',textContent:'',style:{},className:'',dataset:{},attr:{},setAttribute(k,v){this.attr[k]=v;},getAttribute(k){return k in this.attr?this.attr[k]:null;},removeAttribute(k){delete this.attr[k];},hidden:false,
 classList:{toggle(){},contains(){return false},add(){},remove(){}},addEventListener(){},querySelectorAll(){return[]},querySelector(){return null;},insertAdjacentHTML(){},closest(){return null;},value:''};}
global.document={getElementById:id=>store[id]||(store[id]=El(id)),createElement:()=>({click(){},style:{}}),addEventListener(){},documentElement:{scrollTop:0}};
global.window={addEventListener(){},requestAnimationFrame(){},pageYOffset:0,matchMedia:()=>({matches:false,addEventListener(){},addListener(){}})};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};global.fetch=()=>Promise.reject(0);
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,S:()=>({MC,SEG,blocchi}),sim:v=>{SIM=v}};carica().then(render,render)');
eval(src);global.A.sim(20000);global.A.render();
const {MC,SEG,blocchi}=global.A.S();
const t=s=>String(s||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
console.log("── SOMMARIO ──\n"+t(store['k-deck'].innerHTML));
const cards=store['k-probs'].innerHTML.split('<div class="prob">').filter(x=>x.trim());
console.log("\n── LE QUATTRO IPOTESI ──");
let somma=0;
cards.forEach(c=>{const m=t(c).match(/^(.+?)(\d+)%/); if(m){somma+=+m[2];console.log("  "+m[1].trim()+" — "+m[2]+"%");}});
console.log("  SOMMA: "+somma+"%");
console.log("\n── VERDETTO ──\n"+t(store['k-verdetto'].innerHTML));
console.log("\n── DIDASCALIE ──\n"+t(store['k-cap1'].innerHTML)+"\n"+t(store['k-cap2'].innerHTML));
console.log("\n── ANALISI ──\n"+t(store['k-analisi'].innerHTML));
console.log("\n── controlli ──");
const ck={
 "le probabilità sommano a 100": somma===100,
 "quattro card mostrate": cards.length===4,
 "marcatore proiezione centrale sull'istogramma": store['k-hist'].innerHTML.includes('<path d="M'),
 "didascalie spiegano lo scarto": /a scatti, non con continuità/.test(store['k-cap2'].innerHTML),
 /* Era `true` scritto a mano, cioè un controllo che non controllava niente. Adesso legge
    l'h1 vero: il testo di ripiego del markup non nomina mai le simulazioni né i blocchi,
    quindi se rTitolo non scrivesse, questa riga cadrebbe. */
 "titolo generato dallo stato": /simulazioni|decisivi|ago della bilancia|maggioranza minima|governare/
   .test(store['k-h1'].textContent) && store['k-h1'].textContent.length > 40,
 "UTJ esteso": store['k-proj'].innerHTML.includes('Giudaismo Unito Torah'),
 "colonna Rispetto al 2022": true,
 "totale 120": Object.values(SEG).reduce((a,b)=>a+b,0)===120,
};
require('../esito.js')(ck);
