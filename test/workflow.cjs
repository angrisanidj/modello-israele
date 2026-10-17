/* LA LETTURA «WORKFLOW + SCRIPT CHIAMATI», UNA VOLTA SOLA.
 *
 * Dal 17 ottobre 2026 la consegna del riepilogo non sta più dentro un passo «run» di
 * .github/workflows/aggiorna.yml: è .github/scripts/consegna.sh, chiamato da due job — aggiorna
 * e spazzola. Ogni controllo che guardava i comandi del workflow avrebbe smesso di vederla senza
 * dirlo, cioè sarebbe diventato verde per assenza del caso. Quindi chi legge un passo legge
 * anche lo script che il passo chiama, e la regola che dice quali script sono «chiamati» sta qui
 * e in nessun altro posto: la usano test/struttura.mjs e test/suite/dafare.js. Due copie della
 * stessa regola divergono alla prima modifica.
 *
 * Sta fuori da suite/ come css.js ed esito.js: è una libreria, non una prova.
 */
const fs = require('fs');
const path = require('path');

const RADICE = path.join(__dirname, '..');

/* I fine riga si normalizzano come fa il caricatore YAML con un blocco «run»: su Windows la
   copia di lavoro può avere CRLF, e una riga di commento che finisce con un ritorno a capo non
   si riconosce più come commento. */
const lf = t => String(t).replace(/\r\n/g, '\n');

/* Gli script chiamati da un testo di comandi: «bash .github/scripts/<nome>.sh», nelle righe che
   NON sono commenti — un commento che nomina lo script per spiegarlo non lo chiama. */
function scriptChiamati(testo){
  const comandi = lf(testo).split('\n').filter(r => !/^\s*#/.test(r)).join('\n');
  return [...new Set((comandi.match(/\bbash\s+\.github\/scripts\/[\w.-]+\.sh\b/g) || [])
    .map(x => x.replace(/^bash\s+/, '')))];
}

/* Il testo con, in coda, il contenuto di ogni script che chiama. Uno script che manca lascia
   una riga che lo dichiara invece di sparire: chi legge deve poter vedere il buco. */
function conScript(testo, radice){
  const r = radice || RADICE;
  return [lf(testo)].concat(scriptChiamati(testo).map(p => {
    const f = path.join(r, p);
    return fs.existsSync(f) ? lf(fs.readFileSync(f, 'utf8')) : '# script mancante: ' + p;
  })).join('\n');
}

/* Un file di workflow per nome, con gli script che i suoi passi chiamano. */
function workflowConScript(nome, radice){
  const r = radice || RADICE;
  return conScript(fs.readFileSync(path.join(r, '.github', 'workflows', nome), 'utf8'), r);
}

module.exports = {scriptChiamati, conScript, workflowConScript, lf};
