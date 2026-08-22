/* Esegue tutto il banco con l'orologio portato avanti, e dice che cosa cade.
 *
 * PERCHÉ SERVE UNO STRUMENTO E NON UN GREP. Cercando le fixture stagionali il 23 agosto
 * 2026 si è contato quante date letterali ci fossero nelle prove: dieci file. Spazzolando
 * l'orologio, **nessuno di quei dieci cade** — le date d'archivio non scadono, perché
 * attiviAl() àncora la finestra dei 60 giorni alla rilevazione più recente e non a oggi.
 * Cadono invece sei suite che di date letterali non ne hanno nessuna, per una ragione che
 * il grep non poteva vedere: leggono la tabella dell'analisi, e quella si svuota quando
 * passano sette giorni senza una rilevazione nuova.
 *
 * QUANDO RIFARLA: dopo ogni modifica a un'àncora temporale — finestra(), attiviAl(), il
 * taglio del confronto, l'orizzonte. Una prova che dà per scontato un archivio fresco non
 * fallisce oggi: fallisce il giorno in cui l'archivio smette di esserlo, e quel giorno è
 * il 23 ottobre, quattro giorni prima del voto.
 *
 * La data predefinita è proprio quella: il silenzio demoscopico, il primo giorno in cui la
 * finestra dei sette giorni si svuota da sola senza che niente sia rotto.
 *
 *   npm run spazzola
 *   npm run spazzola 2026-11-20 2027-02-01
 */
import {readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const qui = dirname(fileURLToPath(import.meta.url));
const DATE = process.argv.slice(2).filter(a => /^\d{4}-\d{2}-\d{2}$/.test(a));
if (!DATE.length) DATE.push('2026-10-23');   /* il silenzio demoscopico */

execFileSync('node', [join(qui, 'estrai.mjs')], {stdio: 'inherit'});

const file = readdirSync(join(qui, 'suite')).filter(f => f.endsWith('.js')).sort();
let rotte = 0;

for (const giorno of DATE) {
  console.log('\n══ OROLOGIO AL ' + giorno + ' ══');
  const caduti = [];
  for (const f of file) {
    let out = '';
    try {
      out = execFileSync('node', ['--require', join(qui, 'orologio.cjs'), f], {
        encoding: 'utf8', cwd: join(qui, 'suite'),
        env: Object.assign({}, process.env, {FINTO_OGGI: giorno, TZ: 'Europe/Rome'})
      });
    } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
    const ok = (out.match(/^\s*OK\s/gm) || []).length + (out.match(/: OK/g) || []).length;
    const ko = (out.match(/^\s*KO\s/gm) || []).length + (out.match(/: FALLITO/g) || []).length;
    /* zero asserzioni vuol dire che la suite è morta prima di provare qualcosa: è la
       stessa assenza che esegui.mjs dichiara fallita, e qui vale uguale */
    if (ko || (!ok && !ko)) {
      const perche = ko
        ? (out.match(/^\s*KO.*$/gm) || []).slice(0, 2).join(' | ')
        : 'nessuna asserzione — ' + ((out.match(/^.*Error.*$/m) || ['uscita vuota'])[0]).trim();
      caduti.push('  ' + f.replace('.js', '').padEnd(16) + ok + '/' + (ok + ko) + '  ' + perche.slice(0, 150));
    }
  }
  if (caduti.length) { rotte++; console.log(caduti.join('\n')); }
  else console.log('  tutte in piedi');
}

console.log('\n' + (rotte
  ? rotte + ' date su ' + DATE.length + ' con prove che cadono'
  : 'nessuna prova scade su ' + DATE.length + (DATE.length === 1 ? ' data' : ' date')));
if (rotte) process.exit(1);
