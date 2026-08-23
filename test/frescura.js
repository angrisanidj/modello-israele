/* Riporta l'archivio a «fresco»: sposta TUTTE le date della stessa quantità, in modo che
 * la rilevazione più recente cada oggi, e ri-rende.
 *
 * IL DIFETTO CHE CHIUDE. Sei suite leggono la tabella dell'analisi o la proiezione di
 * confronto, e tutte e sei danno per scontato che l'archivio sia fresco. Finché
 * finestra() si ancorava all'ultimo sondaggio l'assunzione era gratis: la finestra dei
 * sette giorni conteneva sempre almeno quello. Da quando si ancora a OGGI — che è la
 * riparazione giusta, perché il sottotitolo dice «negli ultimi 7 giorni» — bastano sette
 * giorni senza rilevazioni perché la finestra si svuoti e quelle sei cadano. Succede il
 * 23 ottobre col silenzio demoscopico, quattro giorni prima del voto, o il primo giorno
 * in cui il lavoro notturno si ferma: cioè quando la pagina conta di più, e quando il job
 * ha il suo cancello proprio lì.
 *
 * PERCHÉ RIBASARE E NON SCRIVERE UNA FIXTURE. Quelle sei non provano il contenuto
 * dell'archivio: provano la forma delle colonne, il testo della cronologia, il grafico, il
 * confronto a sette giorni. Una fixture sintetica cambierebbe quello che provano;
 * spostando tutte le date della stessa quantità **non cambia niente di relativo** — le
 * distanze fra rilevazioni, i pesi per recenza, il grappolo di istituto, l'era
 * pre-fusione restano identici — e cambia solo il rapporto con oggi, che è precisamente
 * l'assunzione che si vuole rendere esplicita invece che silenziosa.
 *
 * Le suite che provano DAVVERO una data d'archivio non devono usarla: lì la data è il
 * fatto, non un modo di dire «adesso». Vedi l'invariante 10 in CLAUDE.md.
 */
function giornoUTC(d){ return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); }

module.exports = function frescura(A){
  const s = A.SOND();
  if (!s.length) return 0;
  const ultimo = s.map(x => x.data).sort().pop();
  const delta = Math.round((giornoUTC(new Date()) -
                            giornoUTC(new Date(ultimo + 'T00:00:00'))) / 864e5);
  if (delta > 0) {
    const sposta = iso => new Date(giornoUTC(new Date(iso + 'T00:00:00')) + delta * 864e5)
      .toISOString().slice(0, 10);
    A.setSOND(s.map(x => Object.assign({}, x, {data: sposta(x.data)})));
    /* ANCHE LA CRONOLOGIA, o si sposta metà del mondo. Gli eventi sono ancorati alle date
       delle rilevazioni — il grafico della tendenza li disegna sul suo asse, e l'analisi
       cita l'ultimo che cade dentro la finestra: spostando i sondaggi e non gli eventi,
       questi finirebbero fuori dall'asse e il legame fra i due si romperebbe. Spostati
       della stessa quantità, tutto ciò che è relativo resta identico. */
    if (A.EVENTI) A.EVENTI().forEach(e => { e.data = sposta(e.data); });
    A.render();
  }
  return delta;
};
