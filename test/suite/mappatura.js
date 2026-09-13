/* ══════════════════════════════════════════════════════════════════════════════════
 * LA MAPPATURA DI UNA LISTA È COMPLETA, O NON LO È IN SILENZIO
 *
 * docs/mappare-una-lista-nuova.md elenca otto posti e, in fondo, che cosa succede quando se
 * ne sbaglia uno. Due voci di quella tabella dicono «in silenzio», e sono le due che questa
 * suite copre — perché erano le uniche senza nessuna prova che le guardasse in blocco:
 *
 *   · «id in W_LISTA che non esiste in P{}» → la lista sparisce dai calcoli e NESSUNA
 *     guardia la vede. Il parser mappa la colonna su un id, l'id non è in anagrafica, i
 *     seggi non entrano da nessuna parte: la riga cade per somma ≠ 120 e il motivo dice
 *     «somma», cioè dà la colpa alla fonte per un difetto nostro.
 *   · PAL_SCURO mancante → è l'OTTAVO POSTO, e il contratto lo racconta così: un posto
 *     dimenticato non lascia un buco, PRODUCE UN COLORE. schiarisci() ne inventa uno che la
 *     regola non conosce, e passa in pagina finché qualcuno non misura il contrasto.
 *     L'ha trovato la prova di regia del 26 agosto 2026 con quattro asserzioni cadute in
 *     tre suite; qui c'è l'asserzione che lo dice prima, e per ogni lista.
 *
 * LE PROPRIETÀ SONO GENERALI, non sulla lista di oggi: valgono per quella che qualcuno
 * mappa domani, che è il punto — l'8 settembre le liste arrivano tutte insieme e chi le
 * mappa alle undici di sera esegue quello che trova.
 * ══════════════════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log(' OK  ' + desc); }
  else { ko++; console.log(' KO  ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

const RADICE = path.join(__dirname, '..', '..');
const HTML = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8');

/* l'anagrafica e le due tabelle si leggono dal sorgente, non da un render: qui si prova la
   forma dei dati, e montare un DOM aggiungerebbe un modo di fallire che non c'entra */
const A = (() => {
  const blocchi = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const app = blocchi[blocchi.length - 1];
  function estrai(nome, apri, chiudi){
    const i = app.indexOf(nome);
    if (i < 0) return null;
    let d = 0, j = app.indexOf(apri, i);
    for (let k = j; k < app.length; k++){
      if (app[k] === apri) d++;
      else if (app[k] === chiudi){ d--; if (!d){ j = k; break; } }
    }
    return app.slice(app.indexOf(apri, i), j + 1);
  }
  const out = {};
  eval('out.P=' + estrai('var P={', '{', '}'));
  eval('out.W_LISTA=' + estrai('var W_LISTA={', '{', '}'));
  eval('out.PAL_SCURO=' + estrai('var PAL_SCURO={', '{', '}'));
  eval('out.ART=' + estrai('var ART={', '{', '}'));
  return out;
})();

esito(A.P && Object.keys(A.P).length > 10, 'l anagrafica P{} si legge dal sorgente (' + Object.keys(A.P || {}).length + ' liste)');
esito(A.W_LISTA && Object.keys(A.W_LISTA).length > 10, 'e W_LISTA anche (' + Object.keys(A.W_LISTA || {}).length + ' grafie)');
esito(A.PAL_SCURO && Object.keys(A.PAL_SCURO).length > 10, 'e PAL_SCURO anche (' + Object.keys(A.PAL_SCURO || {}).length + ' coppie)');

/* ══ 1 · OGNI GRAFIA DI W_LISTA PORTA A UNA LISTA CHE ESISTE ══
 * il difetto che «nessuna guardia vede»: la lista sparisce dai calcoli e la riga viene
 * respinta per somma, cioè incolpando la fonte. */
{
  const orfani = [];
  Object.keys(A.W_LISTA).forEach(g => { if (!A.P[A.W_LISTA[g]]) orfani.push(g + ' -> ' + A.W_LISTA[g]); });
  esito(orfani.length === 0,
    'ogni grafia di W_LISTA porta a un id che esiste in P{}',
    orfani.join(', '));
}

/* ══ 2 · L'OTTAVO POSTO: ogni lista che corre ha il suo colore scuro ══
 * Una lista RITIRATA resta in P{} con il colore con cui è stata pubblicata — la sua storia
 * in archivio la nomina ancora — quindi deve avere la coppia anche lei. La condizione non è
 * «corre», è «ha un colore»: se ce l'ha, PAL_SCURO deve saperlo tradurre. */
{
  const chiavi = {};
  Object.keys(A.PAL_SCURO).forEach(k => chiavi[k.toUpperCase()] = 1);
  const senza = [];
  Object.keys(A.P).forEach(id => {
    const c = A.P[id].c;
    if (!c) return;
    if (!chiavi[c.toUpperCase()]) senza.push(id + ' (' + c + ')');
  });
  esito(senza.length === 0,
    'ogni lista di P{} con un colore ha la sua coppia in PAL_SCURO — l ottavo posto',
    senza.join(', ') + ' : senza, schiarisci() inventa un colore che la regola non conosce');
}

/* e il verso opposto: una coppia che non serve a niente è un residuo, e un residuo in una
   tabella indicizzata sul colore CHIARO è il posto in cui una collisione futura non si
   nota.
   I QUATTRO TOKEN DI BLOCCO CONTANO COME LEGITTIMI, e la prima stesura di questa asserzione
   li dichiarava orfani: PAL_SCURO non è la tabella delle liste, è quella di ogni colore che
   deve avere una traduzione nel tema scuro — e --coal, --oppo, --arab, --inc ce l'hanno
   perché cp() li consulta come consulta quelli di lista. Si leggono dal foglio invece di
   scriverli qui: sono l'uscita di COLORE.token(), e ricopiarli sarebbe la strada doppia che
   regola.js esiste per chiudere. */
{
  const usati = {};
  Object.keys(A.P).forEach(id => { if (A.P[id].c) usati[A.P[id].c.toUpperCase()] = 1; });
  const chiaro = HTML.match(/--paper:[\s\S]*?\}/);
  [...(chiaro ? chiaro[0] : '').matchAll(/--(?:coal|oppo|arab|inc):\s*(#[0-9A-Fa-f]{6})/g)]
    .forEach(m => usati[m[1].toUpperCase()] = 1);
  const orfane = Object.keys(A.PAL_SCURO).filter(k => !usati[k.toUpperCase()]);
  esito(orfane.length === 0,
    'e ogni coppia di PAL_SCURO serve a una lista o a un token di blocco', orfane.join(', '));
}

/* ══ 3 · LE SIGLE DELLE COLONNE NON COLLIDONO ══
 * Il contratto lo dichiara come cosa riuscita per fortuna: «nessuna coppia collideva — ma
 * la regola non lo garantisce, e l'8 settembre una lista nuova può scontrarsi con una che
 * c'è». Due colonne con la stessa intestazione sono indistinguibili nella tabella
 * dell'archivio e in quella dell'house effect. */
{
  function senzaArt(id){
    const n = A.P[id].n || id;
    const art = A.ART[id];
    return art ? n.replace(new RegExp('^' + art + '\\s+', 'i'), '') : n;
  }
  const sigle = {}, collisioni = [];
  Object.keys(A.P).forEach(id => {
    const s = A.P[id].ab || senzaArt(id).split(/[ –]/)[0];
    if (sigle[s]) collisioni.push(s + ': ' + sigle[s] + ' e ' + id);
    sigle[s] = id;
  });
  esito(collisioni.length === 0, 'le sigle delle colonne sono tutte distinte', collisioni.join(' · '));
  const vuote = Object.keys(A.P).filter(id => { const s = A.P[id].ab || senzaArt(id).split(/[ –]/)[0]; return !s || !s.trim(); });
  esito(vuote.length === 0, 'e nessuna è vuota', vuote.join(', '));
}

/* ══ 4 · IL CASO VERO: la lista mappata l'8 settembre 2026 è in tutti i posti che la
 * riguardano. Le proprietà di sopra sono generali e cadrebbero comunque; questa dice che la
 * mappatura è ANCHE avvenuta, cioè che la guardia del parser ha di che riaprirsi. */
{
  const ID = 'haredi_pubblico';
  esito(!!A.P[ID], '1-2 · «' + ID + '» è in anagrafica');
  esito(Object.keys(A.W_LISTA).some(g => A.W_LISTA[g] === ID),
    '1 · e almeno una grafia di Wikipedia ci porta',
    'senza, la colonna resta ignota e il job non riparte');
  esito(A.P[ID] && A.P[ID].b === 'incerto',
    '2 · sta nell ago della bilancia, dove la mette la fonte',
    'la fonte non dichiara campo né raccomandazione: assegnarla per analogia religiosa sarebbe un inferenza');
  esito(A.P[ID] && !A.P[ID].dentro, '3 · non è componente di nessuna fusione');
  esito(A.ART[ID] === 'il', '4 · ha il suo articolo, o uscirebbe «i seggi di Pubblico Haredi»');
  esito(A.P[ID] && A.P[ID].ab === 'Haredi',
    '2 · e la sigla è dichiarata: quella automatica darebbe «Pubblico»');
  esito(A.P[ID] && A.P[ID].c === '#33435A',
    '2 · il colore è --ink2, che è quello che la regola restituisce oltre la saturazione',
    A.P[ID] && A.P[ID].c);
  esito(A.PAL_SCURO['#33435A'] === '#A3B3C8', '8 · e la coppia scura c è');
  esito(A.P[ID] && A.P[ID].r22 === null, '2 · r22 è null: la sigla non esisteva nel 2022');
}

console.log('\n' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
