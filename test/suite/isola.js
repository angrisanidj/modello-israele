/* Un evento isolato: il grafico accende il suo tratto e attenua il resto.
 *
 * Le proprietà, e perché ciascuna è qui.
 *
 * · IL TRATTO PARTE DAL MARCATORE. Il riquadro agganciava l'ultimo punto della serie
 *   <= data e si contraddiceva da solo: titolo «10.06», riga sotto «al 05.06». Finché
 *   il grafico non mostrava niente lo scarto era invisibile; con il tratto acceso
 *   diventa un segmento che non parte da dove punta il numero. Ora il valore agli
 *   estremi è interpolato fra i due punti che circondano la data — che è poi il valore
 *   che la linea disegna lì, perché fra due punti la spezzata è una retta.
 *
 * · LE TRE ATTENUATE RESTANO TRE. Qui l'attenuazione NON è quella dell'emiciclo: là le
 *   liste spente dovevano collassare in una massa sola, qui l'isolamento è nel tempo e
 *   le tre serie restano in scena. Il vincolo è rovesciato — ΔE2000 fra loro >= 11, il
 *   pavimento che il progetto usa fra blocchi — e il tema chiaro è quello che morde: a
 *   0,22 il minimo è 10,5, sotto il pavimento; a 0,26 sale a 11,9.
 *
 * · LE TRE VIE D'USCITA. Vale la regola dell'emiciclo: il lettore non resta
 *   intrappolato. Stesso numero premuto di nuovo, «chiudi», Esc.
 *
 * · IL FUOCO NON RESTA A VUOTO. rCrono e rTrend riscrivono innerHTML: l'elemento che
 *   aveva il fuoco sparisce, e chi naviga da tastiera si ritroverebbe sul body a metà
 *   pagina. Vale per l'ingresso e per tutte e tre le uscite.
 *
 * Quel che jsdom non può dire: che i 2,4 px di tratto attenuato si distinguano davvero
 * a 380, e che il riquadro spostato sotto il grafico eviti il salto. Misurato a mano su
 * browser, nei due temi, alle tre larghezze.
 */
const {JSDOM} = require('jsdom');
const fs = require('fs');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

const dom = new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>', {pretendToBeVisual:true});
const W = dom.window, D = W.document;
global.DOMParser = W.DOMParser;
const html = fs.readFileSync('../../index.html','utf8');
D.body.innerHTML = html.replace(/<script>[\s\S]*?<\/script>/g,'')
  .match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document = D; global.window = W;
/* la stub deve rispondere alle DUE query: (max-width:660px) governa la geometria del
   disegno, (min-width:900px) decide se i marcatori sono uno strato HTML o dischi nell'SVG */
W.matchMedia = q => ({matches:/min-width:900px/.test(q), addEventListener(){}, addListener(){}});
W.IntersectionObserver = class { observe(){} unobserve(){} };
global.IntersectionObserver = W.IntersectionObserver;
W.requestAnimationFrame = f => f();
W.localStorage = {getItem:()=>null, setItem(){}, removeItem(){}};
global.getComputedStyle = () => ({getPropertyValue:()=>''});
global.Blob = function(){};
global.URL = {createObjectURL(){ return ''; }};
global.FileReader = function(){};
global.fetch = () => Promise.reject(0);
W.Element.prototype.scrollIntoView = function(){};

let src = fs.readFileSync(__dirname + '/../app.js','utf8');
src = src.replace('carica().then(render,render)',
  'global.A={render:render,EVENTI:function(){return EVENTI;},EVSEL:function(){return EVSEL;},' +
  'serieModello:serieModello,serieAl:serieAl,finestraEv:finestraEv,' +
  'TRATTO:function(){return TRATTO;},MIN:function(){return TRATTO_MIN;},' +
  'aggiungiEvento:function(e){EVENTI.push(e);},togliEvento:function(){EVENTI.pop();}};carica().then(render,render)');
eval(src);

const $ = i => D.getElementById(i);
const css = (html.match(/<style>([\s\S]*?)<\/style>/) || ['',''])[1];
const click = el => el.dispatchEvent(new W.MouseEvent('click',{bubbles:true}));
const esc = () => D.dispatchEvent(new W.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
const voci = () => [].slice.call(D.querySelectorAll('#k-crono button[data-ev]'));
const marcatori = () => [].slice.call(D.querySelectorAll('#k-evlay button[data-ev]'));
const acc = () => [].slice.call(D.querySelectorAll('#k-trend .acc'));

/* ── ΔE2000, per la misura dell'attenuazione ── */
function hx(s){ s=s.trim().replace('#',''); if(s.length===3)s=s.split('').map(c=>c+c).join('');
  return [0,2,4].map(i=>parseInt(s.substr(i,2),16)); }
function linR(v){ v/=255; return v<=0.04045? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }
function mix(fg,bg,a){ return fg.map((v,i)=>Math.round(v*a+bg[i]*(1-a))); }
function lab(t){ const [r,g,b]=t.map(linR);
  const X=0.4124*r+0.3576*g+0.1805*b, Y=0.2126*r+0.7152*g+0.0722*b, Z=0.0193*r+0.1192*g+0.9505*b;
  const f=v=>v>Math.pow(6/29,3)?Math.cbrt(v):v/(3*Math.pow(6/29,2))+4/29;
  const x=f(X/0.95047), y=f(Y), z=f(Z/1.08883);
  return [116*y-16, 500*(x-y), 200*(y-z)]; }
function de2000(c1,c2){ const [L1,a1,b1]=lab(c1),[L2,a2,b2]=lab(c2);
  const C1=Math.hypot(a1,b1),C2=Math.hypot(a2,b2),Cb=(C1+C2)/2;
  const G=0.5*(1-Math.sqrt(Math.pow(Cb,7)/(Math.pow(Cb,7)+Math.pow(25,7))));
  const A1=a1*(1+G),A2=a2*(1+G),Cp1=Math.hypot(A1,b1),Cp2=Math.hypot(A2,b2);
  const h=(x,y)=>{let t=Math.atan2(y,x)*180/Math.PI;return t<0?t+360:t;};
  const h1=Cp1?h(A1,b1):0,h2=Cp2?h(A2,b2):0;
  const dL=L2-L1,dC=Cp2-Cp1; let dh=0;
  if(Cp1*Cp2){dh=h2-h1; if(dh>180)dh-=360; if(dh<-180)dh+=360;}
  const dH=2*Math.sqrt(Cp1*Cp2)*Math.sin(dh*Math.PI/360);
  const Lb=(L1+L2)/2,Cpb=(Cp1+Cp2)/2; let hb=h1+h2;
  if(Cp1*Cp2){ if(Math.abs(h1-h2)>180) hb=(h1+h2<360)?(h1+h2+360)/2:(h1+h2-360)/2; else hb=(h1+h2)/2; }
  const T=1-0.17*Math.cos((hb-30)*Math.PI/180)+0.24*Math.cos(2*hb*Math.PI/180)+0.32*Math.cos((3*hb+6)*Math.PI/180)-0.20*Math.cos((4*hb-63)*Math.PI/180);
  const Sl=1+(0.015*Math.pow(Lb-50,2))/Math.sqrt(20+Math.pow(Lb-50,2)),Sc=1+0.045*Cpb,Sh=1+0.015*Cpb*T;
  const dTh=30*Math.exp(-Math.pow((hb-275)/25,2));
  const Rc=2*Math.sqrt(Math.pow(Cpb,7)/(Math.pow(Cpb,7)+Math.pow(25,7)));
  const Rt=-Rc*Math.sin(2*dTh*Math.PI/180);
  return +Math.sqrt(Math.pow(dL/Sl,2)+Math.pow(dC/Sc,2)+Math.pow(dH/Sh,2)+Rt*(dC/Sc)*(dH/Sh)).toFixed(2); }
function vars(b){ const o={}; for(const m of b.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,8})/g)) o[m[1]]=m[2]; return o; }
const CH = vars(html.match(/#kn26\{([\s\S]*?)\n\}/)[1]);
const SC = Object.assign({}, CH, vars(html.match(/#kn26\.scuro\{([\s\S]*?)\}/)[1]));

setTimeout(function(){

  /* ══ 1 · i comandi sono bottoni veri, con lo stato dichiarato ══ */
  esito(voci().length === A.EVENTI().length && voci().length > 8,
    'ogni fatto della cronologia è un <button> con data-ev', String(voci().length));
  esito(voci().every(b => b.getAttribute('type') === 'button'),
    'e sono type="button", non bottoni che inviano qualcosa');
  esito(voci().every(b => b.getAttribute('aria-pressed') !== null),
    'ognuno dichiara aria-pressed, come legenda dell\'emiciclo, veti e pastiglie');
  esito(marcatori().length === A.EVENTI().length,
    'sopra il grafico c\'è un marcatore per evento, ed è anch\'esso un <button>',
    String(marcatori().length));
  esito(marcatori().every(b => b.getAttribute('type')==='button' && b.getAttribute('aria-pressed')!==null),
    'con lo stesso contratto: type="button" e aria-pressed');
  /* Lo strato compare solo da 900 in su: a 760 costava tre corsie e 102px sopra un grafico
     alto 224,7 — quasi metà. Sotto, il comando è già la voce di cronologia, larga 325px, e
     i dischi restano nell'SVG con le loro corsie. La regola è scritta al positivo, uguale
     alla media query che il JS interroga, così le due non possono divergere. */
  const pulito = css.replace(/\s+/g,'');
  esito(/#kn26\.evlay\{display:none;\}/.test(pulito),
    'lo strato dei marcatori è nascosto per impostazione predefinita');
  esito(/@media\(min-width:900px\)\{#kn26\.evlay\{display:block;\}\}/.test(pulito),
    'e compare solo da 900px in su, dove le corsie hanno spazio verticale');
  /* FIGLIO DIRETTO: la regola vale per le voci, non per tutto ciò che finisce dentro
     l'elenco — sotto i 660 ci viene spostato dentro il riquadro dell'evento, e con il
     selettore discendente «chiudi» ereditava width:100% e 44px di altezza, finendo sopra
     il titolo. Nessuna prova di questo file se n'era accorta. */
  const regolaVoce = (css.match(/#kn26 \.crono>button\{[^}]*\}/) || [''])[0];
  esito(!/#kn26 \.crono button\{/.test(css),
    'nessuna regola della cronologia usa il selettore discendente, che raggiunge il riquadro spostato');
  esito(!/#kn26 \.crono b\{/.test(css),
    'e nemmeno per il badge: era lui a fare dei tre seggi tre macchie scure');
  esito(/min-height:44px/.test(regolaVoce),
    'la voce di cronologia arriva a 44px: è il bersaglio, e a una riga misurava 18',
    regolaVoce.slice(0,80));

  /* ══ 2 · lo stato pieno non ha niente di acceso ══ */
  esito(acc().length === 0, 'senza evento scelto non c\'è nessun tratto acceso');
  esito(!/\biso\b/.test($('k-trend').className), 'e il grafico non è in stato isolato');
  esito(!/on/.test($('k-evsel').className), 'e il riquadro è chiuso');

  /* ══ 3 · un evento isolato accende esattamente il suo tratto ══ */
  const EV = A.EVENTI().slice().sort((a,b)=>a.data<b.data?-1:1);
  const scelto = EV[5];                       /* 26.04, la fusione di B'Yachad */
  click(voci()[5]);
  esito(A.EVSEL() === scelto.data, 'il clic isola quel fatto', A.EVSEL());
  esito(/\biso\b/.test($('k-trend').className), 'il grafico entra in stato isolato');
  esito(acc().length === 3, 'e accende un tratto per ciascuna delle tre linee', String(acc().length));
  esito(voci()[5].getAttribute('aria-pressed') === 'true' &&
        voci().filter(b=>b.getAttribute('aria-pressed')==='true').length === 1,
    'una sola voce risulta premuta, ed è quella');
  esito(marcatori()[5].getAttribute('aria-pressed') === 'true' &&
        marcatori().filter(b=>b.getAttribute('aria-pressed')==='true').length === 1,
    'e lo stesso vale per il marcatore sul grafico');

  /* ══ 4 · il tratto parte DAL MARCATORE, non dal punto che lo precede ══ */
  const S = A.serieModello();
  const fin = A.finestraEv(S, scelto.data);
  esito(fin.gg === 30, 'la finestra è di 30 giorni di calendario', String(fin.gg));
  /* la x del marcatore è quella del tratteggio verticale disegnato per quell'evento */
  /* solo i tratteggi degli eventi: la linea della maggioranza è anch'essa tratteggiata,
     ma con un altro passo, ed è orizzontale — inclusa, sposterebbe tutti gli indici */
  const dash = [].slice.call($('k-trend').querySelectorAll('line'))
    .filter(l => l.getAttribute('stroke-dasharray') === '2 3');
  const xMarc = +dash.map(l=>+l.getAttribute('x1')).sort((a,b)=>a-b)[5].toFixed(1);
  const partenze = acc().map(p => +p.getAttribute('d').match(/^M([\d.]+)/)[1]);
  esito(partenze.every(x => Math.abs(x - xMarc) < 0.15),
    'tutti e tre i tratti partono dalla x del marcatore',
    JSON.stringify(partenze) + ' contro ' + xMarc);
  /* e il punto della serie che PRECEDE la data è altrove: se il tratto partisse da lì
     — che è quello che faceva il riquadro — la prova qui sopra cadrebbe */
  let pre = null; S.forEach(x => { if (x.d < scelto.data) pre = x; });
  esito(pre && pre.d !== scelto.data,
    'e il punto precedente della serie è a una data diversa, quindi la prova morde',
    pre && pre.d);
  /* il valore agli estremi è l'interpolazione, cioè quello che la linea disegna lì */
  const vi = A.serieAl(S, scelto.data);
  esito(vi && typeof vi.g === 'number' && vi.g > 0,
    'il valore alla data del marcatore si legge per interpolazione', vi && vi.g.toFixed(2));

  /* ══ 4b · il tratto sotto i 10px non si disegna, e il riquadro dice perché ══
   *
   * La soglia è in pixel reali e si ricalcola a ogni render: la stessa finestra di 30
   * giorni vale 36,8px a 380 e 125,8 a 1265, e si accorcia da sola mentre l'asse si
   * allunga verso il voto. Un tratto da un pixel non è un segno; ma un tratto che
   * sparisce senza spiegazione è un difetto, non una scelta — quindi le due cose vanno
   * legate: se il grafico non lo disegna, il riquadro lo deve dire. */
  esito(A.MIN() === 10, 'la soglia del tratto è 10 pixel reali', String(A.MIN()));
  const stato = [];
  EV.forEach(function(e, i){
    click(voci()[i]);
    const t = A.TRATTO();
    stato.push({ n:i+1, data:e.data, px:t&&t.px, gg:t&&t.gg, mostrato:t&&t.mostrato,
      tratti:acc().length, spiega:/tratto non è disegnato/.test($('k-evsel').textContent) });
    click(voci()[i]);
  });
  esito(stato.every(x => x.mostrato === (x.px >= A.MIN())),
    'il tratto si disegna esattamente quando supera la soglia, non un caso a parte',
    JSON.stringify(stato.filter(x => x.mostrato !== (x.px >= A.MIN())).slice(0,2)));
  esito(stato.every(x => x.tratti === (x.mostrato ? 3 : 0)),
    'sopra soglia i tratti sono tre, sotto soglia nessuno',
    JSON.stringify(stato.filter(x => x.tratti !== (x.mostrato?3:0)).map(x=>x.n)));
  esito(stato.every(x => x.spiega === (!x.mostrato && x.gg > 0)),
    'e la spiegazione compare esattamente dove il tratto manca: mai muto, mai di troppo',
    JSON.stringify(stato.filter(x => x.spiega !== (!x.mostrato && x.gg>0)).map(x=>x.n)));
  const sotto = stato.filter(x => !x.mostrato), sopra = stato.filter(x => x.mostrato);
  esito(sotto.length > 0 && sopra.length > 0,
    'e oggi il confine cade davvero fra gli eventi, quindi la prova morde',
    'senza tratto: ' + JSON.stringify(sotto.map(x=>x.n+' ('+x.px+'px)')));
  esito(Math.max.apply(null, sotto.map(x=>x.px)) < A.MIN() &&
        Math.min.apply(null, sopra.map(x=>x.px)) >= A.MIN(),
    'nessuno dei due gruppi sconfina nel campo opposto',
    'max sotto ' + Math.max.apply(null, sotto.map(x=>x.px)) +
    ' · min sopra ' + Math.min.apply(null, sopra.map(x=>x.px)));

  /* il caso che l'8 settembre capiterà: un fatto datato all'ultimo giorno d'archivio */
  const S0 = A.serieModello(), ultimo = S0[S0.length-1].d;
  A.aggiungiEvento({data:ultimo, testo:'Deposito delle liste (prova)'});
  A.render();
  const ultimoBtn = voci()[voci().length-1];
  click(ultimoBtn);
  const f0 = A.finestraEv(A.serieModello(), ultimo);
  esito(f0.gg === 0, 'con un fatto datato sul giorno finale dell archivio la finestra è vuota', String(f0.gg));
  esito(acc().length === 0, 'e il grafico non accende nessun tratto');
  esito(/non ha ancora rilevazioni/.test($('k-evsel').textContent),
    'ma il riquadro lo dichiara invece di tacere',
    $('k-evsel').textContent.replace(/s+/g,' ').slice(-90));
  esito(!/tratto non è disegnato/.test($('k-evsel').textContent),
    'e lo dice una volta sola, senza sommare due spiegazioni');
  click(ultimoBtn);
  A.togliEvento(); A.render();
  esito(voci().length === A.EVENTI().length, 'la cronologia torna come prima dopo la prova');

  /* ricompongo lo stato per le prove che seguono */
  click(voci()[5]);

  /* ══ 5 · il riquadro àncora la data del marcatore ══ */
  const nota = $('k-evsel').querySelector('.en').textContent;
  const titolo = $('k-evsel').querySelector('.ed').textContent;
  const dgg = s => (s.match(/\d\d\.\d\d/g) || []);
  esito(dgg(nota)[0] === dgg(titolo)[0],
    'il riquadro dichiara la stessa data del titolo, non un punto precedente',
    'titolo ' + dgg(titolo)[0] + ' · nota ' + dgg(nota)[0]);
  esito(/giorni successivi/.test($('k-evsel').textContent),
    'e dice come si è mossa la proiezione nella finestra');
  esito(/non l'effetto di questo fatto/.test($('k-evsel').textContent),
    'dichiarandolo osservazione e non effetto: il modello misura i sondaggi, non le cause');
  esito(!/rispetto a oggi/.test($('k-evsel').textContent),
    'e non confronta più con oggi, che sulla fusione del 26 aprile diceva «invariato» tre volte');

  /* ══ 6 · l'attenuazione: le tre restano tre ══ */
  const regolaIso = (css.match(/#kn26 #k-trend\.iso \.ln\{[^}]*\}/) || [''])[0];
  const alpha = +(regolaIso.match(/opacity:([\d.]+)/) || [0,0])[1];
  esito(alpha > 0 && alpha < 1, 'le linee non accese hanno un\'opacità dichiarata', String(alpha));
  [['chiaro', CH], ['scuro', SC]].forEach(function(t){
    const nome = t[0], V = t[1], card = hx(V.card);
    const sp = ['coal','oppo','arab'].map(k => mix(hx(V[k]), card, alpha));
    const fra = [de2000(sp[0],sp[1]), de2000(sp[0],sp[2]), de2000(sp[1],sp[2])];
    const min = Math.min.apply(null, fra);
    esito(min >= 11,
      'tema ' + nome + ': le tre linee attenuate restano distinte fra loro (ΔE ≥ 11)',
      min.toFixed(2));
    const dalPieno = ['coal','oppo','arab'].map((k,i) => de2000(sp[i], hx(V[k])));
    esito(Math.min.apply(null, dalPieno) >= 20,
      'tema ' + nome + ': e restano lontane dal pieno, quindi il tratto acceso è inequivocabile',
      Math.min.apply(null, dalPieno).toFixed(2));
  });
  /* i punti dei sondaggi stavano già a .28: se restassero lì finirebbero esattamente sul
     livello della linea attenuata, e il grafico diventerebbe poltiglia */
  const regolaPt = (css.match(/#kn26 #k-trend\.iso \.pt\{[^}]*\}/) || [''])[0];
  const aPt = +(regolaPt.match(/opacity:([\d.]+)/) || [0,0])[1];
  esito(aPt > 0 && aPt < alpha,
    'nello stato isolato i punti dei sondaggi scendono sotto il livello della linea attenuata',
    aPt + ' contro ' + alpha);

  /* ══ 7 · le tre vie d'uscita ══ */
  esito(D.activeElement === voci()[5],
    'entrando, il fuoco resta sul comando premuto e non cade sul body',
    D.activeElement && (D.activeElement.tagName + '/' + (D.activeElement.dataset||{}).ev));

  /* prima via: lo stesso numero */
  click(voci()[5]);
  esito(A.EVSEL() === null && acc().length === 0, 'ripremendo lo stesso numero si esce');
  esito(D.activeElement === voci()[5], 'e il fuoco resta lì', D.activeElement && D.activeElement.tagName);

  /* seconda via: il pulsante «chiudi», che sta dentro il riquadro */
  click(voci()[3]);
  const x = $('k-evsel').querySelector('.x');
  esito(!!x && x.tagName === 'BUTTON' && x.getAttribute('type') === 'button',
    '«chiudi» è un bottone vero, dentro il riquadro dove il dito ha appena premuto');
  click(x);
  esito(A.EVSEL() === null && acc().length === 0, 'e chiude');
  esito(D.activeElement === voci()[3],
    'riportando il fuoco sulla voce da cui si era entrati, non sul body',
    D.activeElement && D.activeElement.tagName);

  /* terza via: Esc */
  click(marcatori()[7]);
  esito(A.EVSEL() === EV[7].data, 'si entra anche dal marcatore sul grafico');
  esito(D.activeElement === marcatori()[7], 'e il fuoco ci resta');
  esc();
  esito(A.EVSEL() === null && acc().length === 0, 'Esc esce dallo stato isolato');
  esito(D.activeElement === voci()[7],
    'e lascia il fuoco su una voce vera', D.activeElement && D.activeElement.tagName);

  /* la cautela: senza nessuno stato attivo Esc non deve fare niente, per non sottrarlo
     alla pagina che ci ospita */
  const primaHtml = $('k-trend').innerHTML.length;
  esc();
  esito(A.EVSEL() === null && $('k-trend').innerHTML.length === primaHtml,
    'e con nessuno stato attivo Esc non fa niente: non lo sottrae alla pagina che ci ospita');

  console.log('\nisola: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 3000);
