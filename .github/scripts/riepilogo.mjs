/* La riga di comando del riepilogo: unisce la spazzolata se è caduta, scrive il corpo
 * della issue e il conto delle cose da fare.
 *
 * PERCHÉ UN FILE E NON DUE RIGHE DENTRO IL WORKFLOW. C'erano, scritte come
 * `node --input-type=module -e "…"` dentro un blocco `run: |`, e hanno reso il file YAML
 * **invalido**: GitHub non è riuscito nemmeno a leggerne il nome, e la esecuzione è
 * fallita in zero secondi. Cioè il lavoro notturno non sarebbe partito affatto, e senza
 * job non c'è nemmeno il riepilogo che avrebbe dovuto dirlo.
 * JavaScript multiriga dentro YAML è una doppia citazione dentro un formato sensibile
 * all'indentazione: si mette in un file, e il workflow lo chiama.
 *
 * Uso:  node .github/scripts/riepilogo.mjs
 *       SPAZZOLA_CADUTA=1 node .github/scripts/riepilogo.mjs   (unisce spazzola.txt)
 *
 * Scrive: dati/da-fare.json (solo se la spazzolata va unita), corpo-dafare.md, conto.txt
 */
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {conSpazzolata, conEsito, markdown} from './dafare.mjs';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const P = join(RADICE, 'dati', 'da-fare.json');

/* IL FILE PUÒ NON ESSERCI, E NON È UNA RAGIONE PER TACERE. Prima qui c'era un'uscita
   silenziosa — «il parser non è arrivato a scriverlo», e via — cioè il riepilogo si
   zittiva proprio nel caso in cui aveva più da dire. Si parte da un riepilogo vuoto e ci
   si mette sopra l'esito del job. */
let f = existsSync(P)
  ? JSON.parse(readFileSync(P, 'utf8'))
  : {voci: [], conto: {blocca: 0, richiedono: 0, informative: 0}, riga: ''};

const sp = join(RADICE, 'spazzola.txt');
if (process.env.SPAZZOLA_CADUTA === '1' && existsSync(sp)){
  f = conSpazzolata(f, readFileSync(sp, 'utf8'));
  writeFileSync(P, JSON.stringify(f, null, 1) + '\n');
  console.log('spazzolata unita al riepilogo');
}

/* L'ESITO DEL JOB ENTRA NEL RIEPILOGO, e viene dal workflow perché nei file non c'è: una
   notte bloccata non committa niente, quindi non lascia traccia nel repository. */
f = conEsito(f, process.env.ESITO_JOB, process.env.ESECUZIONI_FERME);

writeFileSync(join(RADICE, 'corpo-dafare.md'), markdown(f));
writeFileSync(join(RADICE, 'conto.txt'), String(f.conto.richiedono + f.conto.informative));
console.log(f.riga);
