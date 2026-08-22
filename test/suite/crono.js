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
W.Element.prototype.scrollIntoView=function(){};
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};
global.fetch=()=>Promise.reject(0);
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,S:()=>({serieModello,EVENTI})};carica().then(render,render)');
eval(src);
const A=global.A;A.render();
const $=i=>D.getElementById(i);
const tx=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const click=el=>el.dispatchEvent(new W.MouseEvent('click',{bubbles:true}));
/* le voci di cronologia sono <button>: erano <div>, e un div non si raggiunge col
   tabulatore né dichiara lo stato. Il selettore cambia con loro. */
const voci=()=>[...D.querySelectorAll('.crono button[data-ev]')];
const apri=i=>click(voci()[i]);
const chiudi=()=>{const x=D.querySelector('#k-evsel .x'); if(x) click(x);};
console.log("CRONOLOGIA CLICCABILE — "+voci().length+" fatti\n");
[0,3,7,voci().length-1].forEach(i=>{
  chiudi(); apri(i);
  console.log("  ["+(i+1)+"] "+tx($('k-evsel').innerHTML).replace('chiudi ','').slice(0,132));
});
chiudi(); apri(2);
const sel=[...D.querySelectorAll('.crono button[data-ev][aria-pressed="true"]')].length;
const aperto=/on/.test($('k-evsel').className);
const testo=tx($('k-evsel').innerHTML);
chiudi();
const chiuso=!/on/.test($('k-evsel').className);
apri(1); const a1=/on/.test($('k-evsel').className);
apri(1); const a2=/on/.test($('k-evsel').className);
chiudi();
// date distinte per fatti diversi
const date=[0,5,11].map(i=>{chiudi();apri(i);return tx($('k-evsel').innerHTML).match(/\d\d\.\d\d/)[0];});
chiudi();
console.log("\n  date lette dai fatti 1, 6 e 12: "+date.join(" · "));
/* ── La voce citata in «L'analisi» arriva come è scritta, iniziale compresa ──
 *
 * rAnalisi() inserisce l'ultimo fatto della cronologia dopo i due punti, e ne abbassava
 * l'iniziale: su «Hadash, Ta'al e Balad firmano l'accordo» usciva «hadash». Dopo i due
 * punti l'italiano non chiede la minuscola, e la cronologia non distingue un nome proprio
 * da un nome comune: la forzatura è stata tolta e le voci si scrivono già nella forma che
 * serve. Dall'8 settembre la cronologia sarà piena di nomi di lista e di persona,
 * quindi quello che va sorvegliato non è il caso singolo ma la regola: il testo passa
 * intatto, e nessuna voce comincia in minuscola. */
const EV=A.S().EVENTI;
const analisi=tx($('k-analisi').innerHTML);
const citate=EV.filter(e=>analisi.indexOf(e.testo)>=0);
const citata=citate[0];
/* La voce citata oggi comincia con un nome proprio — «Hadash, Ta'al e Balad …» — cioè
   proprio il caso che la forzatura rovinava. Il controllo sulle iniziali abbassate non
   guarda `citata`: se la forzatura torna, `citata` sparisce, e un'asserzione che
   dipendesse da lei smetterebbe di mordere proprio quando serve. */
const abbassate=EV.filter(e=>analisi.indexOf(e.testo.charAt(0).toLowerCase()+e.testo.slice(1))>=0)
  .map(e=>e.data);
const minuscole=EV.filter(e=>/^[a-zà-ÿ]/.test(e.testo)).map(e=>e.data);

console.log("\n── controlli ──");
const ck={
 "la voce di cronologia arriva in «L'analisi» invariata": citate.length===1,
 "la voce citata comincia con una maiuscola": !!citata && /^[A-ZÀ-Ý]/.test(citata.testo),
 "nessuna voce arriva in pagina con l'iniziale abbassata": abbassate.length===0,
 "nessuna voce della cronologia comincia in minuscola": minuscole.length===0,
 "tutti i fatti sono cliccabili": voci().length===A.S().EVENTI.length && voci().length>8,
 "fatti diversi mostrano date diverse": new Set(date).size===3,
 "il click apre il riquadro": aperto,
 "il fatto scelto si evidenzia": sel===1,
 "mostra i tre blocchi": /Blocco Netanyahu/.test(testo)&&/Opposizione sionista/.test(testo)&&/Partiti arabi/.test(testo),
 /* Lo scostamento «rispetto a oggi» è stato TOLTO di proposito, e l'attesa cambia con
    lui. Non misurava l'evento, misurava la distanza dal presente: sulla fusione di
    B'Yachad del 26 aprile il riquadro diceva «invariato» su tutti e tre i blocchi, cioè
    dichiarava che il fatto più importante dell'anno non aveva mosso niente. Al suo posto
    c'è il movimento nella finestra dei 30 giorni successivi, dichiarato come osservazione
    e non come effetto — il modello misura i sondaggi, non le cause. */
 "mostra il movimento nella finestra dei 30 giorni": /giorni successivi/.test(testo),
 "e lo dichiara osservazione, non effetto": /non l.effetto di questo fatto/.test(testo),
 "dice su quante rilevazioni": /erano disponibili \d+ rilevazioni/.test(testo),
 /* La finestra è di 30 giorni di CALENDARIO. Il conto va fatto in UTC: con le date
    interpretate in ora locale, il 2 marzo + 30 giorni scavallava il cambio dell'ora
    legale del 29 marzo e il riquadro annunciava «29 giorni». È la stessa famiglia del
    punto 12 delle cose da fare — differenze di millisecondi al posto di giorni di
    calendario — e qui il numero sbagliato lo legge il lettore. */
 "la finestra è di 30 giorni pieni quando i dati ci sono": /Nei 30 giorni successivi/.test(testo),
 "il pulsante chiudi lo richiude": chiuso,
 "riclickando lo stesso si richiude": a1 && !a2,
};
require('../esito.js')(ck);
