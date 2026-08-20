/* Verifica dei tre esiti: avvio riuscito, script che va in errore, JS assente. */
const {JSDOM}=require('jsdom');
function prova(nome,{rompi=false}={}){
 const dom=new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>',{pretendToBeVisual:true});
 const W=dom.window,D=W.document;
 global.DOMParser=W.DOMParser;
 const html=require('fs').readFileSync('../../index.html','utf8');
 D.body.innerHTML=html.replace(/<script>[\s\S]*?<\/script>/g,'').match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
 global.document=D;global.window=W;
 W.matchMedia=()=>({matches:false,addEventListener(){},addListener(){}});
 W.IntersectionObserver=class{observe(){}unobserve(){}};global.IntersectionObserver=W.IntersectionObserver;
 W.requestAnimationFrame=f=>f();W.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
 global.getComputedStyle=()=>({getPropertyValue:()=>''});
 global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};
 global.fetch=()=>Promise.reject(0);
 let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
 if(rompi) src=src.replace('function calcola(){','function calcola(){ throw new Error("guasto simulato nel motore");');
 src=src.replace('carica().then(render,render)','global.A={render:render,sim:v=>{SIM=v}};carica().then(render,render)');
 let errore=null;
 try{ eval(src); }catch(e){ errore=e.message; }
 return new Promise(r=>setTimeout(()=>{
  const b=D.getElementById('k-boot');
  console.log(`\n══ ${nome} ══`);
  console.log("  avviso presente :", b?("SÌ — classe «"+b.className+"»"):"no (rimosso)");
  if(b) console.log("  testo           :", b.textContent.replace(/\s+/g,' ').trim().slice(0,190)+"…");
  console.log("  eccezione       :", errore||"nessuna");
  const verdetto=D.getElementById('k-verdetto');
  console.log("  dati calcolati  :", verdetto&&verdetto.innerHTML.length>50?"sì":"no");
  r();
 },250));
}
(async()=>{
 await prova("AVVIO NORMALE");
 await prova("SCRIPT IN ERRORE",{rompi:true});
 // JS assente: si controlla il markup così com'è nel file
 const html=require('fs').readFileSync('../../index.html','utf8');
 console.log("\n══ JAVASCRIPT DISATTIVATO (anteprima) ══");
 const m=html.match(/<div class="boot" id="k-boot">([\s\S]*?)<\/div>/);
 console.log("  avviso nel markup:", m?"SÌ, visibile per impostazione predefinita":"NO");
 console.log("  testo            :", m[1].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,200)+"…");
 console.log("  blocco <noscript>:", /<noscript>/.test(html)?"presente":"assente");
})();
