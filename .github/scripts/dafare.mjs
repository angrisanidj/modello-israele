/* IL RIEPILOGO DEL LAVORO NOTTURNO, in forma leggibile da una macchina.
 *
 * Oggi le segnalazioni stanno in tre posti — il registro degli eventi, le issue delle
 * guardie, il messaggio del pulsante — e nessuno le mette insieme. `dati/da-fare.json` è
 * quel posto: le stesse voci, con il conto in testa, il testo originale dove serve, e per
 * ciascuna CHE COSA SERVE PER CHIUDERLA. «Tre voci nuove» non è utile; «tre voci da
 * tradurre: apri dati/eventi-grezzi.json, cerca "stato": "nuovo"» lo è.
 *
 * IL FILE ESISTE SEMPRE, ANCHE VUOTO. Un file che manca è ambiguo — non c'è niente da
 * fare, o il job non è arrivato a scriverlo? — e chi lo legge domani è un agente, che
 * l'ambiguità la risolve male. Quando non c'è niente il file lo dice, con `richiedono: 0`.
 *
 * TRE URGENZE, E LA PRIMA È QUELLA CHE FERMA LA PUBBLICAZIONE.
 *   · blocca      — l'archivio non si aggiorna finché non lo tocchi tu;
 *   · richiede    — qualcosa da fare, ma la pagina intanto vive;
 *   · informativa — da sapere, non da fare.
 * Il conto in testa serve a decidere in dieci secondi se la mattinata cambia.
 *
 * PERCHÉ UN MODULO E NON UNA STAMPA DENTRO IL JOB. Le voci nascono in due momenti — il
 * grosso prima delle guardie, la spazzolata dopo il push, che è quaranta minuti più tardi
 * — e comporle in due posti diversi vorrebbe dire scriverle due volte. Qui la
 * composizione è una funzione pura, provata da test/suite/dafare.js, e il job la chiama
 * due volte con quello che sa.
 */

/* Le voci, in ordine di urgenza. Ognuna dichiara come si chiude: il file, il comando, il
   numero da guardare. I percorsi delle procedure sono quelli di docs/, che sono il
   contratto lungo — qui c'è la riga che basta a cominciare. */
export function voci(s){
  const v = [];

  /* ── blocca ─────────────────────────────────────────────────────────────── */

  /* LA TABELLA DEGLI ACCORDI INVALIDA È LA VOCE PIÙ URGENTE CHE QUESTO FILE PORTI, e non
     perché sia la più grave in sé: è la sola che ferma la pubblicazione DA DENTRO. Una
     riga sbagliata rende rosso `npm run verifica`, che è il cancello del job, quindi
     l'archivio non si aggiorna più finché qualcuno non la corregge — e chi ha scritto la
     riga se n'è andato a dormire. I motivi sono quelli di erroriRiga(), passati di peso:
     una seconda formulazione qui direbbe al riepilogo una cosa e alla pagina un'altra. */
  (s.accordiInvalidi || []).forEach(r => {
    v.push({
      id: 'accordo-invalido-' + r.riga,
      categoria: 'apparentamenti',
      urgenza: 'blocca',
      titolo: 'Riga ' + r.riga + ' della tabella degli accordi non è valida',
      quanti: r.errori.length,
      dettaglio: {riga: r.riga, a: r.x && r.x.a, b: r.x && r.x.b,
                  stato: r.x && r.x.stato, data: r.x && r.x.data, errori: r.errori},
      chiude: 'Apri index.html, cerca `var APPARENTAMENTI=[`, correggi la riga ' + r.riga +
              ': ' + r.errori.join('; ') + '. Poi `npm run verifica`, che deve tornare verde.',
      procedura: 'docs/aggiungere-un-apparentamento.md'
    });
  });

  if (s.ignote && s.ignote.length)
    v.push({
      id: 'colonne-ignote',
      categoria: 'liste',
      urgenza: 'blocca',
      titolo: (s.ignote.length === 1 ? 'Una colonna di lista non riconosciuta'
                                     : s.ignote.length + ' colonne di lista non riconosciute'),
      quanti: s.ignote.length,
      dettaglio: {colonne: s.ignote},
      chiude: 'Mappa le colonne in `W_LISTA` e le liste in `P{}` dentro index.html — con ' +
              '`dentro` se sono componenti di una fusione. Poi il job riprende da solo la ' +
              'notte successiva. GIUDIZIO: quale id dare a un nome inglese lo decide una persona.',
      procedura: 'docs/mappare-una-lista-nuova.md'
    });

  if (s.ambigue > s.ambigueIeri)
    v.push({
      id: 'ambigue-cresciute',
      categoria: 'liste',
      urgenza: 'blocca',
      titolo: 'Righe con una cella su più liste: da ' + s.ambigueIeri + ' a ' + s.ambigue,
      quanti: s.ambigue - s.ambigueIeri,
      dettaglio: {ieri: s.ambigueIeri, oggi: s.ambigue, esempi: (s.esempiAmbigui || []).slice(0, 4)},
      chiude: 'Dichiara la configurazione nuova in `P{}` col campo `dentro`, oppure lasciala ' +
              'fuori a ragion veduta aggiornando `dati/stato-job.json`. GIUDIZIO: sono liste ' +
              'che si sono fuse davvero, o è una cella scritta male?',
      procedura: 'docs/mappare-una-lista-nuova.md'
    });

  if (s.guardia)
    v.push({
      id: 'job-fermo',
      categoria: 'job',
      urgenza: 'blocca',
      titolo: 'Il lavoro notturno si è fermato' + (s.notti > 1 ? ' da ' + s.notti + ' notti' : ''),
      quanti: s.notti || 1,
      dettaglio: {motivo: s.guardia, notti: s.notti || 1, archivioAl: s.archivioAl},
      chiude: 'Il motivo è: ' + s.guardia + '. L\'archivio pubblicato resta fermo al ' +
              (s.archivioAl || '?') + ' finché la causa non è tolta.',
      procedura: null
    });

  /* ── richiede ───────────────────────────────────────────────────────────── */

  if (s.eventiNuovi && s.eventiNuovi.length)
    v.push({
      id: 'eventi-da-tradurre',
      categoria: 'eventi',
      urgenza: 'richiede',
      titolo: s.eventiNuovi.length + (s.eventiNuovi.length === 1 ? ' voce-evento da tradurre'
                                                                 : ' voci-evento da tradurre'),
      quanti: s.eventiNuovi.length,
      dettaglio: {voci: s.eventiNuovi.map(e => ({chiave: e.chiave, data: e.data, testo: e.testo}))},
      chiude: 'Apri `dati/eventi-grezzi.json`, cerca `"stato": "nuovo"`. Per ognuna: o la ' +
              'traduci — riga italiana in `EVENTI` dentro index.html, e la voce passa a ' +
              '`"tradotto"` — o la scarti portandola a `"scartato"`. GIUDIZIO: se la voce ' +
              'meriti la cronologia lo decide una persona; la data NON si tocca, sposta il ' +
              'marcatore sull\'asse.',
      procedura: 'docs/tradurre-una-voce-evento.md'
    });

  if (s.spazzolata)
    v.push({
      id: 'spazzolata-caduta',
      categoria: 'prove',
      urgenza: 'richiede',
      titolo: 'Prove che scadono con l\'orologio portato avanti',
      quanti: 1,
      dettaglio: {uscita: String(s.spazzolata).slice(0, 4000)},
      chiude: 'Riproduci con `npm run spazzola`. Non è un guasto di oggi: è una prova che ' +
              'dà per scontato un archivio fresco e che cadrà da sola il giorno in cui ' +
              'l\'archivio smette di esserlo. Da lì `npm run verifica` è rosso e questo job ' +
              'smette di pubblicare.',
      procedura: null
    });

  /* ── informativa ────────────────────────────────────────────────────────── */

  if (s.quiete >= s.gapSondaggi)
    v.push({
      id: 'silenzio-demoscopico',
      categoria: 'archivio',
      urgenza: 'informativa',
      titolo: 'Nessuna rilevazione nuova da ' + s.quiete + ' giorni',
      quanti: s.quiete,
      dettaglio: {ultimoSondaggio: s.archivioAl, soglia: s.gapSondaggi},
      chiude: 'Niente da fare: è un fatto dei sondaggisti, non del modello. La pagina lo ' +
              'dichiara da sé nella testata.',
      procedura: null
    });

  return v;
}

/* Il file intero: il conto in testa, poi le voci. `generato` è passato da fuori — qui non
   si chiama Date(), o due esecuzioni dello stesso stato darebbero due file diversi e le
   prove non potrebbero confrontarli. */
export function componi(s){
  const v = voci(s);
  const conta = u => v.filter(x => x.urgenza === u).length;
  return {
    generato: s.oggi,
    job: {
      esito: s.guardia ? 'fermo' : 'ok',
      motivo: s.guardia || null,
      archivioAl: s.archivioAl || null,
      rilevazioniNuove: s.nuove || 0
    },
    conto: {
      blocca: conta('blocca'),
      richiedono: conta('blocca') + conta('richiede'),
      informative: conta('informativa')
    },
    /* la riga che si legge per prima, e in dieci secondi */
    riga: riassunto(conta('blocca'), conta('blocca') + conta('richiede'), conta('informativa')),
    voci: v
  };
}

export function riassunto(blocca, richiedono, informative){
  if (!richiedono && !informative) return 'Niente da fare.';
  const p = [];
  p.push(richiedono + (richiedono === 1 ? ' cosa richiede te' : ' cose richiedono te'));
  if (informative) p.push(informative + (informative === 1 ? ' informativa' : ' informative'));
  let s = p.join(' · ');
  if (blocca) s += ' — ' + (blocca === 1 ? 'una BLOCCA la pubblicazione'
                                         : blocca + ' BLOCCANO la pubblicazione');
  return s;
}

/* IL CORPO DELLA ISSUE, dallo stesso file che legge l'agente. Due formulazioni — una per
   la macchina e una per la persona — sarebbero due elenchi che divergono la prima volta
   che se ne aggiunge uno: qui il markdown è una VISTA del JSON, e il conto in testa è lo
   stesso conto. */
export function markdown(f){
  const r = [];
  r.push('**' + f.riga + '**');
  r.push('');
  r.push('Riepilogo del ' + f.generato + ' · il job ' +
    (f.job.esito === 'ok' ? 'ha girato' : 'si è fermato: ' + f.job.motivo) +
    ' · archivio all\'' + (f.job.archivioAl || '?') +
    (f.job.rilevazioniNuove ? ' · ' + f.job.rilevazioniNuove + ' rilevazioni nuove' : ''));
  const ORD = ['blocca', 'richiede', 'informativa'];
  const TIT = {blocca: 'Blocca la pubblicazione', richiede: 'Richiede te', informativa: 'Da sapere'};
  ORD.forEach(u => {
    const v = f.voci.filter(x => x.urgenza === u);
    if (!v.length) return;
    r.push('');
    r.push('## ' + TIT[u]);
    v.forEach(x => {
      r.push('');
      r.push('### ' + x.titolo);
      r.push(x.chiude);
      if (x.procedura) r.push('');
      if (x.procedura) r.push('Procedura: [`' + x.procedura + '`](' + x.procedura + ')');
      const d = x.dettaglio || {};
      if (d.voci) d.voci.forEach(e => r.push('- `' + e.data + '` ' + e.testo));
      if (d.colonne) d.colonne.forEach(c => r.push('- `' + c + '`'));
      if (d.errori) d.errori.forEach(e => r.push('- ' + e));
      if (d.esempi && d.esempi.length) d.esempi.forEach(e => r.push('- `' + e.data + '` ' + e.istituto + ' — ' + e.motivo));
      if (d.uscita) { r.push(''); r.push('```'); r.push(d.uscita); r.push('```'); }
    });
  });
  r.push('');
  r.push('---');
  r.push('Questo corpo è riscritto ogni notte da `dati/da-fare.json`. Finché resta qualcosa ' +
         'da fare la issue si aggiorna in silenzio; quando non resta niente si chiude da sé.');
  return r.join('\n');
}

/* La spazzolata arriva dopo il push, quaranta minuti più tardi: si aggiunge al file già
   scritto invece di ricomporlo, perché ricomporlo vorrebbe dire rieseguire il parser. */
export function conSpazzolata(file, uscita){
  const s = Object.assign({}, file);
  const v = voci({spazzolata: uscita});
  s.voci = (s.voci || []).concat(v);
  const conta = u => s.voci.filter(x => x.urgenza === u).length;
  s.conto = {blocca: conta('blocca'),
             richiedono: conta('blocca') + conta('richiede'),
             informative: conta('informativa')};
  s.riga = riassunto(s.conto.blocca, s.conto.richiedono, s.conto.informative);
  return s;
}
