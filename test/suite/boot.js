/* Verifica dei tre esiti: avvio riuscito, script che va in errore, JS assente.
   Ispeziona le stesse tre situazioni di prima, ma ora asserisce invece di
   descrivere: l'avviso #k-boot deve esserci ed essere visibile in partenza,
   sparire quando il calcolo riesce, restare quando il calcolo fallisce. */
const {JSDOM}=require('jsdom');
let ok=0,ko=0;
function esito(cond,desc,dettaglio){
 if(cond){ ok++; console.log('OK '+desc); }
 else{ ko++; console.log('KO '+desc+(dettaglio?' — '+dettaglio:'')); }
}
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
  const verdetto=D.getElementById('k-verdetto');
  r({nome,avviso:b,classe:b?b.className:null,
     testo:b?b.textContent.replace(/\s+/g,' ').trim():'',
     eccezione:errore,
     calcolati:!!(verdetto&&verdetto.innerHTML.length>50)});
 },250));
}
(async()=>{
 const html=require('fs').readFileSync('../../index.html','utf8');

 /* ── 1. l'avviso è nel markup ed è visibile per impostazione predefinita ── */
 const blocco=html.match(/<div class="boot" id="k-boot">([\s\S]*?)\n<\/div>/);
 esito(!!blocco,'l\'avviso #k-boot è nel markup di index.html');

 // «visibile per impostazione predefinita» = niente attributo hidden, niente
 // stile in linea che lo nasconda, e la regola CSS .boot che non lo spegne.
 const tag=(html.match(/<div class="boot" id="k-boot"[^>]*>/)||[''])[0];
 const nascostoInLinea=/\bhidden\b/.test(tag)||/style="[^"]*(display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0)/.test(tag);
 const regola=(html.match(/#kn26 \.boot\{([\s\S]*?)\}/)||['',''])[1];
 const nascostoInCss=/display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0/.test(regola);
 esito(!nascostoInLinea&&!nascostoInCss,
       'l\'avviso è visibile per impostazione predefinita',
       nascostoInLinea?'nascosto sul tag: '+tag:(nascostoInCss?'nascosto dalla regola #kn26 .boot':''));

 /* ── 2. il blocco <noscript> esiste ── */
 const ns=/<noscript>[\s\S]*?<\/noscript>/.test(html);
 esito(ns,'esiste il blocco <noscript>');
 esito(ns&&blocco&&/<noscript>/.test(blocco[1]),'il <noscript> sta dentro l\'avviso di avvio');

 /* ── 3. render riuscito: l'avviso sparisce ── */
 const buono=await prova('AVVIO NORMALE');
 esito(buono.avviso===null,'dopo un render riuscito l\'avviso è rimosso',
       buono.avviso?'ancora presente, classe «'+buono.classe+'»':'');
 esito(buono.calcolati,'dopo un render riuscito i dati sono calcolati',
       buono.calcolati?'':'#k-verdetto è rimasto vuoto');

 /* ── 4. render in errore: l'avviso resta ── */
 const rotto=await prova('SCRIPT IN ERRORE',{rompi:true});
 esito(rotto.avviso!==null,'se il render lancia un\'eccezione l\'avviso resta visibile',
       rotto.avviso?'':'rimosso nonostante il guasto: la pagina resterebbe muta');
 esito(rotto.avviso!==null&&/\bko\b/.test(rotto.classe||''),
       'l\'avviso segnala il guasto con la classe «ko»',
       rotto.avviso?'classe trovata: «'+rotto.classe+'»':'avviso assente');
 esito(rotto.avviso!==null&&rotto.testo.length>40,
       'l\'avviso di guasto spiega cosa è successo',
       rotto.avviso?'testo troppo corto: «'+rotto.testo+'»':'avviso assente');

 if(ko) process.exitCode=1;
})();
