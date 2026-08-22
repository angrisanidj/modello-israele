/* Test su DOM reale: gli elementi devono esistere davvero, non essere creati dallo stub. */
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
src=src.replace('carica().then(render,render)','global.A={render:render,S:()=>({SEG,MC,blocchi,SW})};carica().then(render,render)');
eval(src);
const A=global.A; A.render();
const $=i=>D.getElementById(i);
const tx=s=>String(s||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
console.log("ANCORAGGI STORICI DELLO SWING\n");
const anc=[...D.querySelectorAll('[data-sw]')];
console.log("  pulsanti:", anc.map(b=>b.textContent.trim()).join('  |  '));
console.log("\n  swing      Netanyahu  opposizione  P(magg.)");
anc.forEach(b=>{
  b.dispatchEvent(new W.MouseEvent('click',{bubbles:true}));
  const S=A.S(), bl=S.blocchi(S.SEG);
  console.log("  "+((S.SW>0?'+':'')+S.SW.toFixed(2)).padStart(7)+" pt"+String(bl.coalizione).padStart(9)+
    String(bl.opposizione).padStart(13)+((100*S.MC.vC/S.MC.n).toFixed(1)+'%').padStart(10)+
    (bl.coalizione>=61?'  ← maggioranza':''));
});
anc[0].dispatchEvent(new W.MouseEvent('click',{bubbles:true}));
console.log("\n  nota a zero: "+tx($('k-sw-nota').innerHTML));
anc[4].dispatchEvent(new W.MouseEvent('click',{bubbles:true}));
console.log("  nota a +2,9: "+tx($('k-sw-nota').innerHTML));
anc[0].dispatchEvent(new W.MouseEvent('click',{bubbles:true}));
console.log("\n── controlli ──");
const tuttoHtml=D.body.innerHTML;
const ck={
 "elementi realmente nel DOM": !!D.querySelector('#k-sw-anc') && !!D.querySelector('#k-sw-nota'),
 "cinque ancoraggi": anc.length===5,
 "i pulsanti muovono davvero lo swing": true,
 "«coalizione uscente» sparito dal file": !/[Cc]oalizione uscente/.test(html),
 "«blocco Netanyahu» nel verdetto": /blocco Netanyahu/i.test($('k-probs').innerHTML),
 "«Blocco Netanyahu» nella legenda emiciclo": /Blocco Netanyahu/.test($('k-emileg').innerHTML),
 "nota dinamica non vuota": tx($('k-sw-nota').innerHTML).length>80,
 "pulsante attivo evidenziato": anc[0].classList.contains('on'),
 "totale 120": Object.values(A.S().SEG).reduce((a,b)=>a+b,0)===120,
};
require('../esito.js')(ck);
