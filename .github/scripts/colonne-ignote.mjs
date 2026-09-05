/* «C'È UNA GUARDIA APERTA SULLE COLONNE NON RICONOSCIUTE?»
 * Esce 0 se sì, 1 se no, ed è la forma che una condizione di shell sa leggere.
 *
 * STA IN UN FILE E NON DENTRO «run: |»: il JavaScript multiriga dentro un blocco run ha
 * già reso questo workflow invalido una volta — esecuzione fallita in zero secondi, nome
 * del workflow non riconosciuto, e il lavoro notturno che non parte portandosi via anche
 * il canale che avrebbe dovuto dirlo.
 *
 * E LEGGE LA STESSA COSA CHE LEGGE LA PAGINA: dati/da-fare.json, la voce che blocca con
 * id «colonne-ignote». Una fonte sola, quindi og:title e il titolo in pagina non possono
 * dire due cose diverse — che è precisamente il difetto che questo stato esiste per
 * chiudere. */
import {readFileSync} from 'node:fs';
try {
  const d = JSON.parse(readFileSync('dati/da-fare.json', 'utf8'));
  const c = (d.voci || []).some(v => v && v.urgenza === 'blocca' && v.id === 'colonne-ignote');
  process.exit(c ? 0 : 1);
} catch (e) {
  /* il file assente o guasto non e' una guardia aperta: si tace invece di indovinare */
  process.exit(1);
}
