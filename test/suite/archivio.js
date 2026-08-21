/* L'archivio fresco in dati/archivio.json e il seme BASE di riserva.
 *
 * L'archivio pubblicato vive in un file dati che il lavoro notturno aggiorna senza
 * toccare index.html; BASE, dentro index.html, resta il seme per chi apre il file da
 * disco, dove fetch è bloccato. Le proprietà che tengono in piedi il disegno:
 *
 *   · se il fetch riesce e il JSON è un archivio plausibile, la pagina usa quello;
 *   · se il fetch fallisce — file://, offline, 404 — resta il seme, senza errori;
 *   · un JSON corrotto, vuoto o PIÙ CORTO del seme non si porta via l'archivio:
 *     un file troncato a metà da un deploy zoppo deve lasciare la pagina com'era;
 *   · il salvato locale ha la precedenza ma vi si uniscono le rilevazioni fresche
 *     del JSON che ancora non contiene — senza, un salvato di ieri nasconderebbe i
 *     dati di stanotte per sempre;
 *   · unisci() conserva il flag `pre`: perderlo trasformerebbe una rilevazione di
 *     gennaio in una attuale e quoteDa() smetterebbe di fonderla in B'Yachad.
 *
 * Ogni scenario ricarica app.js da zero: carica() parte all'avvio e lo stato che
 * lascia è ciò che si misura. Il DOM è quello ridotto di final.js perché qui non si
 * guarda il reso: si guarda SOND.
 */
const {JSDOM} = require('jsdom');
const fs = require('fs');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

const dom = new JSDOM('');
global.DOMParser = dom.window.DOMParser;
const src = fs.readFileSync(__dirname + '/../app.js','utf8')
  .replace('carica().then(render,render)',
    'global.A={S:function(){return {SOND:SOND,BASE:BASE};}};carica().then(function(){global.__pronto=true;},function(){global.__pronto=true;})');

/* una rilevazione plausibile, con la data e i seggi che unisci() pretende */
function ril(data, ist, extra){
  return Object.assign({data:data, istituto:ist, testata:'Prova',
    seggi:{likud:24, yashar:23, byachad:14, democratici:10, beitenu:10,
           otzma:8, shas:8, utj:8, sionismo_rel:5, raam:5, hadash_taal:5}}, extra||{});
}

function scenario(nome, rispostaFetch, salvato){
  return new Promise(function(res){
    const store = {}, LS = {};
    if (salvato) LS['knesset2026-v2'] = JSON.stringify(salvato);
    function El(id){return {id, innerHTML:'', textContent:'', style:{}, className:'', dataset:{}, disabled:false,
      classList:{toggle(){},contains(){return false},add(){},remove(){}},
      addEventListener(){}, querySelectorAll(){return [];}, value:''};}
    global.document = {getElementById:id=>store[id]||(store[id]=El(id)),
      createElement:()=>({click(){},style:{}}), addEventListener(){}, documentElement:{scrollTop:0}};
    global.window = {addEventListener(){}, requestAnimationFrame(){}, pageYOffset:0,
      location:{protocol:'https:'},
      matchMedia:()=>({matches:false,addEventListener(){},addListener(){}}),
      IntersectionObserver:class{observe(){}unobserve(){}},
      storage:{get:k=>Promise.resolve(LS[k]?{value:LS[k]}:null),
               set:(k,v)=>{LS[k]=v;return Promise.resolve();}}};
    global.IntersectionObserver = global.window.IntersectionObserver;
    global.getComputedStyle = () => ({getPropertyValue:()=>''});
    global.Blob = function(){}; global.URL = {createObjectURL(){return '';}};
    global.FileReader = function(){};
    global.fetch = rispostaFetch;
    global.__pronto = false;
    global.A = null;
    eval(src);
    (function attendi(n){
      if (global.__pronto || n > 200) { res({nome:nome, S:global.A.S()}); return; }
      setTimeout(function(){attendi(n+1);}, 10);
    })(0);
  });
}

const rifiuta = () => Promise.reject(new Error('rete assente'));
function conJson(costruisci){
  return (url) => {
    if (/^dati\/archivio\.json$/.test(url))
      return Promise.resolve({ok:true, json:()=>Promise.resolve(costruisci())});
    return Promise.reject(new Error('url inatteso: ' + url));
  };
}

(async function(){
  /* il seme, per sapere quanto è lungo prima di ogni scenario */
  const s0 = await scenario('misura', rifiuta, null);
  const N = s0.S.BASE.length;
  esito(N >= 100, 'il seme BASE contiene l\'archivio di partenza', String(N));

  /* ══ fetch fallito → seme ══ */
  const s1 = await scenario('offline', rifiuta, null);
  esito(s1.S.SOND.length === N,
    'senza rete la pagina usa il seme, senza errori', String(s1.S.SOND.length));

  /* ══ JSON buono → sostituisce ══ */
  const fresco = s0.S.BASE.concat([ril('2026-08-21','Istituto Nuovo')]);
  const s2 = await scenario('fresco', conJson(()=>fresco), null);
  esito(s2.S.SOND.length === N + 1,
    'con il JSON fresco la pagina usa il JSON', s2.S.SOND.length + ' contro ' + (N+1));
  esito(s2.S.SOND.some(x=>x.istituto==='Istituto Nuovo'),
    'e la rilevazione nuova del JSON c\'è davvero');

  /* ══ JSON più corto del seme → resta il seme ══
     è il file troncato da un deploy zoppo: non deve portarsi via l'archivio */
  const s3 = await scenario('troncato', conJson(()=>s0.S.BASE.slice(0,10)), null);
  esito(s3.S.SOND.length === N,
    'un JSON più corto del seme viene rifiutato e resta il seme', String(s3.S.SOND.length));

  /* ══ JSON malformato → resta il seme ══ */
  const s4 = await scenario('corrotto', conJson(()=>({errore:'non un array'})), null);
  esito(s4.S.SOND.length === N,
    'un JSON che non è un array viene rifiutato', String(s4.S.SOND.length));
  const s5 = await scenario('mutilo', conJson(()=>s0.S.BASE.map(function(x,i){
    return i===40 ? {data:x.data} : x;   /* una rilevazione senza seggi in mezzo */
  }).concat([ril('2026-08-21','X')])), null);
  esito(s5.S.SOND.length === N,
    'un JSON con una rilevazione senza seggi viene rifiutato per intero', String(s5.S.SOND.length));

  /* ══ salvato locale + JSON fresco: il salvato vince ma si arricchisce ══ */
  const salvatoLocale = {s: s0.S.BASE.concat([ril('2026-08-20','Inserita A Mano')]), t: 1};
  const s6 = await scenario('salvato', conJson(()=>fresco), salvatoLocale);
  esito(s6.S.SOND.some(x=>x.istituto==='Inserita A Mano'),
    'l\'inserimento manuale del salvato locale sopravvive');
  esito(s6.S.SOND.some(x=>x.istituto==='Istituto Nuovo'),
    'e la rilevazione fresca del JSON viene unita al salvato',
    'archivio di ' + s6.S.SOND.length);

  /* ══ unisci() conserva il flag pre ══
     il salvato NON contiene la rilevazione pre del JSON: deve entrare col suo flag */
  const conPre = s0.S.BASE.concat([ril('2026-02-02','Solo Nel Json',{pre:1,
    seggi:{likud:28, yesh_atid:10, bennett26:23, democratici:10, beitenu:10,
           otzma:8, shas:8, utj:8, sionismo_rel:5, raam:5, hadash_taal:5}})]);
  const s7 = await scenario('flagpre', conJson(()=>conPre),
    {s: s0.S.BASE.concat([ril('2026-08-20','Inserita A Mano')]), t: 1});
  const entrata = s7.S.SOND.filter(x=>x.istituto==='Solo Nel Json')[0];
  esito(!!entrata, 'la rilevazione pre-fusione del JSON entra nel salvato');
  esito(!!entrata && entrata.pre === 1,
    'e conserva il flag pre: senza, quoteDa() smetterebbe di fonderla in B\'Yachad',
    JSON.stringify(entrata));

  console.log('\narchivio: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
})();
