/* LA TARGA DELL'ANTEPRIMA OPEN GRAPH: due righe, la larghezza vera, e il taglio legato
 * alla misura.
 *
 * Scritta il 14 settembre 2026, il giorno in cui la forma corta dell'ipotesi ha preso la
 * seconda clausola — gli accordi di eccedenza accesi per difetto — ed è arrivata a 1173 unità
 * di larghezza contro 1120. Il taglio di allora stimava 0,62 em per carattere, diceva 1573,6,
 * e faceva uscire «…dove la fonte non li mette; 3…»: la seconda ipotesi spariva in silenzio.
 *
 * LE TRE COSE CHE QUESTA PROVA TIENE.
 * 1 · La geometria: TESTA è quella che due righe a corpo 18 chiedono, e il disegno comincia
 *     sotto di lei.
 * 2 · Una strada sola per la larghezza: il taglio lascia intera una riga QUANDO E SOLO QUANDO
 *     la misura vera ci sta. Il giorno in cui una stima rientra, cade.
 * 3 · L'a capo sul separatore che la pagina dichiara, non sul punto e virgola di oggi. E con
 *     più clausole di quante la testata ne regge, la targa fallisce e lo dice.
 * E una quarta, che le altre non vedono: la targa VERA, composta sull'archivio pubblicato e
 * resa da resvg, non ha righe tagliate e non tocca il disegno.
 */
const fs = require('fs');
let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio !== undefined ? ' — ' + dettaglio : '')); }
}

(async function(){
  const A = await import('file:///' + (__dirname + '/../../.github/scripts/anteprima.mjs').replace(/\\/g, '/'));
  const {W, TESTA, PIEDE, LATO, Y_IP, FS_IP, INTERLINEA_IP, RIGHE_IP, ARIA_IP, larghezza, taglia, righeIpotesi, targa} = A;
  const LARGO = W - 2 * LATO;
  const src = fs.readFileSync(__dirname + '/../../.github/scripts/anteprima.mjs', 'utf8');
  const html = fs.readFileSync(__dirname + '/../../index.html', 'utf8');

  /* ══ 1 · LA GEOMETRIA ══ */
  const fondo = Y_IP + (RIGHE_IP - 1) * INTERLINEA_IP + 0.25 * FS_IP;
  esito(RIGHE_IP === 2 && FS_IP === 18, 'la testata regge due righe, e il corpo resta 18', RIGHE_IP + ' righe a ' + FS_IP);
  esito(TESTA === Math.ceil(fondo + ARIA_IP),
    'e TESTA è quella che le due righe chiedono, con la stessa aria sotto che la riga sola aveva',
    TESTA + ' contro ' + (fondo + ARIA_IP));
  esito(INTERLINEA_IP >= 1.2 * FS_IP, 'e l\'interlinea separa le due righe', String(INTERLINEA_IP));

  /* ══ 2 · LA MISURA È VERA ══
     Due controlli che una stima per carattere non passerebbe: raddoppia col corpo, e quattro
     «i» sono più strette di quattro «M». */
  const m18 = larghezza('Ipotesi del modello', 18), m36 = larghezza('Ipotesi del modello', 36);
  esito(m18 > 0 && Math.abs(m36 / m18 - 2) < 0.05, 'larghezza() misura davvero: raddoppia col corpo', m18.toFixed(1) + ' · ' + m36.toFixed(1));
  esito(larghezza('iiii', 18) < larghezza('MMMM', 18) / 2,
    'e non conta caratteri: quattro «i» sono molto più strette di quattro «M»',
    larghezza('iiii', 18).toFixed(1) + ' contro ' + larghezza('MMMM', 18).toFixed(1));

  /* ══ 3 · IL TAGLIO SEGUE LA MISURA: UNA STRADA SOLA ══ */
  const base = 'Ipotesi del modello: 4 seggi contati con Blocco Netanyahu, dove la fonte non li mette; ' +
               '3 apparentamenti firmati e non depositati nel riparto.';
  esito(larghezza(base, FS_IP) > LARGO, 'la frase del 14 settembre su una riga sola non ci sta',
    larghezza(base, FS_IP).toFixed(1) + ' su ' + LARGO);
  const parole = base.split(' '), discordi = [];
  let lati = {dentro: 0, fuori: 0};
  for (let n = 1; n <= parole.length; n++) {
    const t = parole.slice(0, n).join(' ');
    const ci = larghezza(t, FS_IP) <= LARGO;
    lati[ci ? 'dentro' : 'fuori']++;
    if ((taglia(t, FS_IP, LARGO) === t) !== ci) discordi.push(n + ' parole');
  }
  esito(!discordi.length && lati.dentro > 0 && lati.fuori > 0,
    'il taglio lascia intera una riga QUANDO E SOLO QUANDO la larghezza vera ci sta — provato da una parola alla frase intera, dai due lati del limite',
    discordi.length ? 'discordi: ' + discordi.join(', ') : JSON.stringify(lati));
  const corpoTaglia = src.slice(src.indexOf('export function taglia('), src.indexOf('export function righeIpotesi('));
  esito(corpoTaglia.length > 0 && !/0\.\d+\s*\*\s*fs/.test(corpoTaglia) && /larghezza\(/.test(corpoTaglia),
    'e taglia() non stima: chiama larghezza(), che è l\'unica strada', corpoTaglia.slice(0, 80));
  const tagliata = taglia(base, FS_IP, LARGO);
  esito(tagliata.endsWith('…') && larghezza(tagliata, FS_IP) <= LARGO && base.indexOf(tagliata.slice(0, -1)) === 0,
    'e quando taglia, quello che resta è l\'inizio della frase e ci sta davvero', tagliata);

  /* ══ 4 · L'A CAPO SUL SEPARATORE CHE LA PAGINA DICHIARA ══ */
  const dich = /var SEP_IPOTESI='([^']*)'/.exec(html);
  esito(!!dich, 'il separatore delle clausole è una costante della pagina', dich ? JSON.stringify(dich[1]) : 'assente');
  const SEP = dich ? dich[1] : '';
  esito(/p\.join\(SEP_IPOTESI\)/.test(html), 'e la forma corta di ipotesiNeiNumeri() la usa per unire le clausole');
  esito(/SEP_IPOTESI:SEP_IPOTESI/.test(src) && !/split\(\s*['"];/.test(src),
    'e la targa la riceve dalla pagina: nel generatore non c\'è nessun punto e virgola scritto a mano');
  const r2 = righeIpotesi(base, SEP);
  esito(r2.length === 2 && r2.every(r => larghezza(r, FS_IP) <= LARGO),
    'la frase del 14 settembre va su due righe, e ciascuna ci sta intera',
    r2.map(r => larghezza(r, FS_IP).toFixed(1)).join(' · '));
  esito(r2[0].endsWith(SEP.trim()) && r2.join(' ') === base,
    'e la punteggiatura resta dov\'era: le righe rimesse insieme sono la frase', JSON.stringify(r2));
  const altro = righeIpotesi('uno | due | tre', ' | ');
  esito(altro.length === 3 && altro[0] === 'uno |' && altro[2] === 'tre',
    'con un altro separatore spezza su quello: la regola non conosce la frase di oggi', JSON.stringify(altro));
  esito(righeIpotesi('una clausola sola.', SEP).length === 1 && righeIpotesi('', SEP).length === 0,
    'una clausola sola sta su una riga, e senza ipotesi non c\'è nessuna riga');

  /* ══ 4-bis · LE CLAUSOLE CHE LA PAGINA PUÒ PRODURRE SONO AL MASSIMO QUELLE CHE LA TESTATA REGGE ══
     Il fallimento a tre clausole, da solo, lo scoprirebbe il JOB: una modifica che aggiunge una
     terza ipotesi passerebbe il cancello e romperebbe l'anteprima la notte dopo, dove nessuno
     guarda finché non condivide un link. Qui lo scopre la prova.
     SI CONTA NEL SORGENTE E NON FACENDO PARLARE LE IPOTESI, ed è la scelta: una terza clausola
     arriverebbe con condizioni sue, che una prova scritta oggi non saprebbe accendere — la
     conterebbe solo il giorno in cui si accende da sola. Il ramo corto di ipotesiNeiNumeri()
     costruisce la frase in un modo solo, e quel modo si legge: `var p=[]`, una `p.push` per
     clausola, `p.join(SEP_IPOTESI)`. Le clausole possibili sono gli argomenti delle push. */
  {
    function argomenti(t, i){           /* i subito dopo la parentesi aperta; conta a profondità zero */
      let d = 0, q = null, n = 1, vuoto = true;
      for (; i < t.length; i++) {
        const c = t[i];
        if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
        if (c === "'" || c === '"') { q = c; vuoto = false; continue; }
        if (c === '(' || c === '[' || c === '{') d++;
        else if (c === ')' || c === ']' || c === '}') { if (d === 0) return vuoto ? 0 : n; d--; }
        else if (c === ',' && d === 0) n++;
        else if (!/\s/.test(c)) vuoto = false;
      }
      return -1;
    }
    function stringhe(t){
      const out = []; let q = null, s = '';
      for (let i = 0; i < t.length; i++) {
        const c = t[i];
        if (q) { if (c === '\\') { s += t[i + 1]; i++; continue; } if (c === q) { out.push(s); q = null; s = ''; } else s += c; }
        else if (c === "'" || c === '"') q = c;
      }
      return out;
    }
    const i0 = html.indexOf('function ipotesiNeiNumeri(corta){');
    const iC = html.indexOf('if(corta){', i0);
    const iR = html.indexOf("return 'Ipotesi del modello: '", iC);
    const ramo = (i0 >= 0 && iC > i0 && iR > iC) ? html.slice(iC, iR) : '';
    esito(ramo.length > 0, 'il ramo della forma corta di ipotesiNeiNumeri() si trova nel sorgente', iC + ' · ' + iR);
    const rigaR = html.slice(iR, html.indexOf('\n', iR)).trim();
    esito(rigaR === "return 'Ipotesi del modello: '+p.join(SEP_IPOTESI)+'.';",
      'e la frase nasce SOLO da p.join(SEP_IPOTESI): niente di attaccato prima o dopo che aggiunga una clausola', rigaR);
    const push = [];
    for (let i = ramo.indexOf('p.push('); i >= 0; i = ramo.indexOf('p.push(', i + 1)) push.push(argomenti(ramo, i + 'p.push('.length));
    const clausole = push.reduce((a, n) => a + Math.max(n, 0), 0);
    esito(push.length > 0 && push.every(n => n >= 1) && clausole <= RIGHE_IP,
      'le clausole che la pagina può produrre sono ' + clausole + ' e la testata ne regge ' + RIGHE_IP +
      ': il giorno in cui qualcuno ne aggiunge una terza cade questa prova, non l\'anteprima della notte dopo',
      push.length + ' push, argomenti ' + JSON.stringify(push));
    esito((ramo.match(/\bp\s*=(?!=)/g) || []).length === 1 && /var p=\[\];/.test(ramo) &&
          !/\bp\s*\.\s*(unshift|splice|concat)\b|\bp\s*\[/.test(ramo),
      'e l\'elenco delle clausole nasce vuoto e cresce solo con p.push: nessun altro modo di aggiungerne');
    const colSep = stringhe(ramo).filter(s => SEP && s.indexOf(SEP) >= 0);
    esito(!colSep.length, 'e nessuna stringa del ramo contiene il separatore, che spezzerebbe una clausola in due righe',
      JSON.stringify(colSep));
  }

  /* ══ 5 · TRE CLAUSOLE: LO SI SA ADESSO ══ */
  const ink = {x: 21.6, y: 0.4, w: 386.7, h: 217}, col = {paper: '#fff', ink: '#000', mute: '#666'};
  let errore = null;
  try { targa('', ink, [0, 0, 430, 232], 'titolo', 'piede', col, ['a', 'b', 'c'].join(SEP) + '.', SEP); }
  catch (e) { errore = e.message; }
  esito(!!errore && /3 clausole/.test(errore) && new RegExp('ne regge ' + RIGHE_IP).test(errore),
    'con tre clausole la targa FALLISCE e dice perché, invece di scrivere la terza riga sopra il disegno', errore);
  const svg2 = targa('', ink, [0, 0, 430, 232], 'titolo', 'piede', col, base, SEP);
  const ts = [...svg2.matchAll(/<tspan x="([\d.]+)" y="([\d.]+)">([^<]*)<\/tspan>/g)];
  esito(ts.length === 2 && +ts[0][2] === Y_IP && +ts[1][2] === Y_IP + INTERLINEA_IP && ts.every(m => !m[3].endsWith('…')),
    'con due clausole le righe sono due, una sotto l\'altra, e nessuna tagliata', ts.map(m => m[2] + ':' + m[3]).join(' | '));
  const k = +(/scale\(([\d.]+)\)/.exec(svg2) || [0, 0])[1];
  const oy = +(/translate\([-\d.]+,([-\d.]+)\)/.exec(svg2) || [0, 0])[1];
  /* il disegno comincia ESATTAMENTE a TESTA quando è limitato dall'altezza, e translate() è
     scritto a due decimali: il confronto tollera quell'arrotondamento e nient'altro */
  esito(+ts[1][2] + 0.25 * FS_IP <= TESTA - ARIA_IP + 0.5 && oy + ink.y * k >= TESTA - 0.01,
    'e il disegno comincia sotto la testata: la seconda riga non lo tocca',
    'fondo della riga ' + (+ts[1][2] + 0.25 * FS_IP) + ', inizio del disegno ' + (oy + ink.y * k).toFixed(1));

  /* ══ 6 · LA TARGA VERA, COMPOSTA E RESA ══
     Sull'archivio pubblicato, con la pagina vera. Non si asserisce il testo — cambia con i
     sondaggi — ma le proprietà: nessuna riga tagliata, nessuna riga fuori dalla testata, e il
     disegno reso da resvg che comincia sotto l'ultima riga. */
  let vera = null, err = null;
  try { vera = await A.componi(); } catch (e) { err = e.message; }
  esito(!!vera, 'la targa vera si compone', err);
  if (vera) {
    const tv = [...vera.matchAll(/<tspan x="([\d.]+)" y="([\d.]+)">([^<]*)<\/tspan>/g)];
    esito(tv.length <= RIGHE_IP, 'le righe dell\'ipotesi stanno nella testata', tv.length + ' righe');
    esito(tv.every(m => !m[3].endsWith('…') && larghezza(m[3], FS_IP) <= LARGO),
      'e nessuna esce tagliata', tv.map(m => m[3]).join(' | '));
    const {Resvg} = require('@resvg/resvg-js');
    const g = vera.slice(vera.indexOf('<g transform='), vera.lastIndexOf('</svg>'));
    const solo = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="630" viewBox="0 0 ' + W + ' 630" font-family="Inter">' + g + '</svg>';
    const FONT = ['Inter_400Regular.ttf', 'Inter_600SemiBold.ttf'].map(f => __dirname + '/../../.github/font/' + f);
    const b = new Resvg(solo, {font: {loadSystemFonts: false, fontFiles: FONT, defaultFontFamily: 'Inter'}}).getBBox();
    const fondoUltima = tv.length ? +tv[tv.length - 1][2] + 0.25 * FS_IP : 0;
    esito(!!b && b.y >= TESTA && b.y > fondoUltima,
      'e il disegno reso comincia sotto la testata e sotto l\'ultima riga',
      b ? 'disegno da y ' + b.y.toFixed(1) + ', ultima riga fino a ' + fondoUltima : 'nessuna scatola');
  }

  console.log('\ntarga: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
  process.exit(0);
})();
