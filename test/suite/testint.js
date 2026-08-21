/* test d'integrazione: simula il click su "Aggiorna" con Wikipedia servita dal fixture */
const {JSDOM}=require('jsdom');
const dom=new JSDOM('');global.DOMParser=dom.window.DOMParser;
const store={},listeners={};
function El(id){return{id,innerHTML:'',textContent:'',style:{},className:'',dataset:{},disabled:false,
 classList:{toggle(){},contains(){return false},add(){},remove(){}},
 addEventListener(ev,fn){listeners[id]=fn;},querySelectorAll(){return[]},value:''};}
global.document={getElementById:id=>store[id]||(store[id]=El(id)),createElement:()=>({click(){},style:{}}),
 addEventListener(){},documentElement:{scrollTop:0}};
const LS={};
global.window={addEventListener(){},requestAnimationFrame(){},pageYOffset:0,
 location:{protocol:'https:'},
 matchMedia:()=>({matches:false,addEventListener(){},addListener(){}}),
 IntersectionObserver:class{observe(){}unobserve(){}},
 /* dentro Claude l'ambiente fornisce window.storage e autentica la chiamata all'API */
 storage:{get:k=>Promise.resolve(LS[k]?{value:LS[k]}:null),set:(k,v)=>{LS[k]=v;return Promise.resolve();}}};
global.IntersectionObserver=window.IntersectionObserver;
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};
const FIX=require('../../dati/fixture.js');
let calls=[];
global.fetch=(url,opt)=>{
 calls.push(url);
 if(/wikipedia/.test(url)) return Promise.resolve({ok:true,text:()=>Promise.resolve(FIX)});
 return Promise.resolve({json:()=>Promise.resolve({content:[{type:'text',text:
   '{"sondaggi":[{"data":"2026-08-21","istituto":"Lazar","testata":"Maariv","campione":500,'+
   '"seggi":{"likud":22,"yashar":25,"byachad":13,"beitenu":10,"democratici":10,"otzma":8,"shas":8,"utj":8,'+
   '"sionismo_rel":5,"raam":5,"hadash_taal":6}}]}'}]})});
};
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={S:()=>({SOND,EVENTI}),render:render,sim:v=>{SIM=v}};carica().then(render,render)');
eval(src);
global.A.sim(2000);global.A.render();
const prima=global.A.S().SOND.length, evPrima=global.A.S().EVENTI.length;
console.log("archivio prima:",prima,"| eventi prima:",evPrima);
listeners['k-refresh']({});
setTimeout(()=>{
 const {SOND,EVENTI}=global.A.S();
 console.log("archivio dopo :",SOND.length,"| eventi dopo :",EVENTI.length);
 console.log("chiamate:",calls.map(u=>u.includes('wikipedia')?'wikipedia':'api.anthropic').join(' → '));
 console.log("\nmessaggio mostrato:\n  "+store['k-msg'].innerHTML.replace(/<[^>]+>/g,''));
 const nuove=SOND.filter(s=>s.data>='2026-08-19');
 console.log("\nrilevazioni nuove entrate:");
 nuove.forEach(s=>console.log("  ",s.data,s.istituto,s.testata));
 console.log("\n── controlli ──");
 /* dall'introduzione di dati/archivio.json la PRIMA chiamata è il fetch relativo
    dell'archivio fresco; Wikipedia arriva dopo, al click su Aggiorna */
 console.log("prima chiamata: l'archivio fresco relativo:", /^dati\/archivio\.json$/.test(calls[0])?"OK":"FALLITO");
 console.log("Wikipedia interrogata:", calls.some(c=>/wikipedia/.test(c))?"OK":"FALLITO");
 console.log("nessuna chiamata all'API di Anthropic:", !calls.some(c=>/anthropic/.test(c))?"OK":"FALLITO");
 /* Dalla porta unica sugli eventi la cronologia pubblicata NON cresce piu' col pulsante:
    le voci trovate — in inglese, non curate — vengono dichiarate in attesa nel messaggio
    e la loro chiave finisce nel salvato locale. L'attesa precedente («evento nuovo in
    cronologia») e' obsoleta di proposito: era esattamente il difetto. */
 console.log("la cronologia NON cresce col pulsante:", EVENTI.length===evPrima?"OK ("+evPrima+" invariato)":"FALLITO ("+EVENTI.length+")");
 console.log("nessuna voce inglese entrata in cronologia:", !EVENTI.some(e=>/ the | and |conducts/.test(e.testo))?"OK":"FALLITO");
 console.log("le voci trovate sono dichiarate in attesa:", /voci-evento|voce-evento/.test(store['k-msg'].innerHTML)?"OK":"FALLITO");
 console.log("solo fonte Wikipedia:", !SOND.some(s=>s.data==='2026-08-21')?"OK":"FALLITO");
 console.log("nessun duplicato per data+istituto+testata:",
   (new Set(SOND.map(s=>s.data+'|'+s.istituto+'|'+s.testata))).size===SOND.length?"OK":"FALLITO");
 // secondo click: non deve aggiungere nulla
 const n1=SOND.length; calls=[];
 listeners['k-refresh']({});
 setTimeout(()=>{
  console.log("idempotenza (2° click):", global.A.S().SOND.length===n1?"OK ("+n1+" invariato)":"FALLITO ("+global.A.S().SOND.length+")");
  console.log("messaggio 2° click:\n  "+store['k-msg'].innerHTML.replace(/<[^>]+>/g,''));
 },400);
},400);
