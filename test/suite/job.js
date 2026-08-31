/* Le guardie del lavoro notturno, provate sulla funzione che decide.
 *
 * valuta() è pura: riceve i conteggi e restituisce {ok} oppure {stop, issue?}. Qui si
 * prova che ogni guardia scatti sul suo caso e NON scatti sul caso buono — nei due
 * versi, perché una guardia che ferma sempre e una che non ferma mai passerebbero
 * entrambe una prova scritta in un verso solo. Le soglie stanno in SOGLIE, e le prove
 * le leggono da lì: se una soglia cambia, le prove seguono senza mentire.
 *
 * aggiornaRegistro() è l'altro pezzo puro: le voci con chiave mai vista entrano con
 * stato «nuovo», le altre non si toccano — mai — qualunque sia il loro stato.
 *
 * L'orchestrazione (fetch, jsdom, scritture) non si prova qui: il suo contratto è il
 * workflow, e il suo modo di fallire è terminare prima di scrivere.
 */
let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

(async function(){
  const {valuta, aggiornaRegistro, SOGLIE} =
    await import('file:///' + (__dirname + '/../../.github/scripts/aggiorna.mjs').replace(/\\/g, '/'));

  /* il caso buono, tarato sui numeri veri del 21 agosto */
  const buono = () => ({
    httpOk: true, byte: 3_100_000,
    valide: 154, valideIeri: 154,
    nuove: 3, ignote: [],
    ambigue: 24, ambigueIeri: 24,
    blocchi: {coalizione: 52, opposizione: 56, arabo: 12},
    blocchiIeri: {coalizione: 51, opposizione: 56, arabo: 13}
  });

  esito(valuta(buono()).ok === true,
    'il caso buono passa: nessuna guardia scatta a vuoto', JSON.stringify(valuta(buono())));

  /* ── ogni guardia, sul suo caso ── */
  let p = buono(); p.httpOk = false;
  esito(/raggiungibile/.test(valuta(p).stop || ''), 'Wikipedia irraggiungibile ferma il job');

  p = buono(); p.byte = SOGLIE.CORPO_MINIMO - 1;
  esito(/troncata/.test(valuta(p).stop || ''), 'una risposta troncata ferma il job');
  p = buono(); p.byte = SOGLIE.CORPO_MINIMO;
  esito(valuta(p).ok === true, 'al confine esatto del corpo minimo il job passa');

  p = buono(); p.ignote = ['New Hope 2026'];
  const gi = valuta(p);
  esito(/non riconosciute/.test(gi.stop || ''), 'una colonna di lista ignota ferma il job');
  /* (gi.issue||{}): sotto mutazione la issue può mancare, e la suite deve riferirlo
     come KO, non morire con un TypeError lasciando i controlli successivi non eseguiti */
  esito(!!gi.issue && /New Hope 2026/.test((gi.issue||{}).corpo || ''),
    'e produce una issue che nomina la colonna da mappare', JSON.stringify(gi.issue));
  esito(/8 settembre|W_LISTA/.test((gi.issue||{}).corpo || ''),
    'la issue dice dove mettere le mani, non solo che qualcosa è rotto');

  p = buono(); p.ambigue = 25;
  const ga = valuta(p);
  esito(/ambigue in crescita/.test(ga.stop || ''), 'una configurazione ambigua nuova ferma il job');
  esito(!!ga.issue, 'e anche lei produce una issue: è una decisione umana');

  p = buono(); p.valide = 154 - SOGLIE.CALO_VALIDE - 1;
  esito(/crollo/.test(valuta(p).stop || ''), 'un crollo delle righe valide ferma il job');
  p = buono(); p.valide = 154 - SOGLIE.CALO_VALIDE;
  esito(valuta(p).ok === true, 'un calo entro la tolleranza passa: Wikipedia ogni tanto riorganizza');

  /* ── L'INCROCIO CHE DICE «È ARRIVATA UNA LISTA NUOVA» ──
   *
   * Trovato il 30 agosto 2026 eseguendo la prova di regia dell'8 settembre sul markup vero
   * di Wikipedia, con una colonna di lista ribattezzata. Una lista nuova HA dei seggi,
   * quindi nessuna riga somma più 120, quindi meno della metà passa la validazione, quindi
   * parseWiki scarta la tabella INTERA — e le sue colonne sconosciute finiscono in
   * «ignorate» invece che in «ignote». Misurato: valide 165 → 0, ignote VUOTO, e tutte e
   * sei le tabelle in ignorate a nominare la colonna nuova.
   * Il job si fermava lo stesso (la guardia del crollo lo prendeva) ma diceva «righe valide
   * in crollo» e NON apriva la issue che elenca che cosa mappare — cioè il solo segnale che
   * l'8 settembre serve, e quello che il contratto dice di andare a leggere.
   *
   * LA CONGIUNZIONE È LA GUARDIA, e le due metà da sole non valgono:
   * · colonne ignote da sole ce ne sono OGNI NOTTE — la tabella degli scenari ne ha tre,
   *   «Winter», «Other», «Don't know» — e farebbero scattare la guardia tutte le notti;
   * · un crollo da solo può essere Wikipedia che riorganizza, ed è il caso che la guardia
   *   di sopra continua a coprire con le parole di prima.
   * È l'INCROCIO dei due a dire «è arrivata una lista nuova», e nient'altro lo produce.
   * Per questo le quattro asserzioni qui sotto sono quattro e non una: due sui casi in cui
   * la guardia NON deve scattare, una sul caso in cui deve, e una sul fatto che nomini la
   * colonna — una guardia che ferma senza dire quale colonna sarebbe muta come prima. */
  const ignorateCon = n => [{righe: 22, ignote: n}, {righe: 65, ignote: n}];

  p = buono(); p.ignorate = ignorateCon(['Winter', 'Other']);
  esito(valuta(p).ok === true,
    'colonne sconosciute in tabelle scartate, da sole, NON fermano il job: ce ne sono ogni notte',
    JSON.stringify(valuta(p)));

  p = buono(); p.valide = 0; p.ignorate = [];
  esito(/crollo/.test(valuta(p).stop || '') && !valuta(p).issue,
    'un crollo senza colonne sconosciute resta quello di prima, e non apre nessuna issue',
    valuta(p).stop);

  p = buono(); p.valide = 0; p.ignorate = ignorateCon(['Zionist Future']);
  const nuova = valuta(p);
  esito(!nuova.ok && !!nuova.issue,
    'ma l INCROCIO dei due ferma il job E apre la issue: e la firma del deposito delle liste',
    nuova.stop || 'non ha fermato niente');
  esito(/Zionist Future/.test(nuova.stop || '') && /Zionist Future/.test((nuova.issue || {}).corpo || ''),
    'e nomina la colonna, nel messaggio e nella issue: fermarsi senza dire quale sarebbe muto come prima',
    (nuova.stop || '').slice(0, 90));
  esito((nuova.stop.match(/Zionist Future/g) || []).length === 1,
    'e la nomina UNA VOLTA SOLA anche se sei tabelle la ripetono',
    nuova.stop);

  /* E IL CABLAGGIO SI PROVA NEL SORGENTE, perché qui non passa.
   * Queste asserzioni chiamano valuta() direttamente e le passano «ignorate» a mano:
   * resterebbero tutte verdi il giorno in cui aggiorna.mjs smettesse di passarglielo, e la
   * guardia diventerebbe irraggiungibile senza che niente cadesse. È lo stesso idioma di
   * og:title col job e di colonneBlocco() con le due tabelle: il legame si prova DOVE STA. */
  const sorgente = require('fs').readFileSync(__dirname + '/../../.github/scripts/aggiorna.mjs', 'utf8');
  const chiamata = sorgente.slice(sorgente.indexOf('const esito = valuta({'),
                                  sorgente.indexOf('const esito = valuta({') + 400);
  esito(/ignorate:\s*out\.ignorate/.test(chiamata),
    'e il job passa DAVVERO out.ignorate a valuta(): senza, la guardia sarebbe irraggiungibile',
    chiamata.split('\n').slice(0, 7).join(' ').replace(/\s+/g, ' ').slice(0, 120));

  p = buono(); p.nuove = SOGLIE.MASSIMO_NUOVE + 1;
  esito(/troppe/.test(valuta(p).stop || ''), 'troppe rilevazioni in una notte fermano il job');
  p = buono(); p.nuove = SOGLIE.MASSIMO_NUOVE;
  esito(valuta(p).ok === true, 'il massimo esatto di nuove passa');

  p = buono(); p.blocchi.coalizione = p.blocchiIeri.coalizione + SOGLIE.DELTA_BLOCCO + 1;
  esito(/si muove di/.test(valuta(p).stop || ''), 'un salto di blocco oltre soglia ferma il job');
  p = buono(); p.blocchi.coalizione = p.blocchiIeri.coalizione - SOGLIE.DELTA_BLOCCO - 1;
  esito(/si muove di/.test(valuta(p).stop || ''), 'anche in discesa: il valore assoluto, non il segno');
  p = buono(); p.blocchi.coalizione = p.blocchiIeri.coalizione + SOGLIE.DELTA_BLOCCO;
  esito(valuta(p).ok === true, 'il movimento al confine esatto passa: la soglia è «oltre», non «da»');
  esito(SOGLIE.DELTA_BLOCCO === 6,
    'la soglia di blocco è 6: il doppio del massimo mai osservato (2 storico, 3 serie 2026)',
    String(SOGLIE.DELTA_BLOCCO));

  /* un blocco assente da uno dei due lati non fa scattare niente: succede quando
     l'ago della bilancia entra o esce dal riparto */
  p = buono(); delete p.blocchi.arabo;
  esito(valuta(p).ok === true, 'un blocco assente da un lato non ferma il job');

  /* ── il registro ── */
  const chiave = (d, t) => d + '|' + String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const reg0 = [{chiave: chiave('2026-08-19', 'Hadash re-form'), data: '2026-08-19',
                 testo: 'Hadash re-form', visto: '2026-08-21', stato: 'tradotto'}];
  const r1 = aggiornaRegistro(reg0,
    [{data: '2026-08-19', testo: 'Hadash re-form'},
     {data: '2026-09-08', testo: 'Lists are submitted'}], chiave, '2026-09-09');
  esito(r1.nuove === 1 && r1.registro.length === 2,
    'entra solo la voce con chiave mai vista', r1.nuove + ' nuove, registro ' + r1.registro.length);
  esito(r1.registro[1].stato === 'nuovo' && r1.registro[1].visto === '2026-09-09',
    'la voce nuova entra con stato «nuovo» e la data di avvistamento');
  esito(r1.registro[0].stato === 'tradotto',
    'la voce già lavorata non viene toccata: lo stato non si cancella mai');
  const r2 = aggiornaRegistro(r1.registro,
    [{data: '2026-09-08', testo: 'Lists are submitted'}], chiave, '2026-09-10');
  esito(r2.nuove === 0, 'il giorno dopo la stessa voce non è più nuova');
  esito(aggiornaRegistro(null, [{data: '2026-01-01', testo: 'x y z'}], chiave, '2026-01-02').nuove === 1,
    'un registro assente vale come vuoto, non come errore');

  /* ══ dati/stato-job.json REGISTRA I BLOCCHI DELLA FONTE, E DICHIARA L'IPOTESI ═══════
   * Scritto il 31 agosto 2026. Il file registrava il conteggio del MODELLO, cioe' con la
   * leva applicata, e da li' venivano due cose diverse:
   *
   * 1 · LA GUARDIA POTEVA SCATTARE PER UNA DECISIONE UMANA. DELTA_BLOCCO e' tarata sui
   *     dati — massimo storico 2-3 seggi, soglia 6 — e il rovesciamento di PAR.inbilico del
   *     30 agosto ha spostato la coalizione da 49 a 54: CINQUE su sei, passata per uno. Con
   *     la soglia a 4 la notte si sarebbe fermata per una ragione che non ha niente a che
   *     vedere con la qualita' del dato. E si ripresentera' a OGNI cambio di leva futuro.
   * 2 · E CHI LEGGE IL FILE NON POTEVA SAPERLO: e' servito da Pages con
   *     access-control-allow-origin: *, e diceva «coalizione: 54» senza dichiarare che
   *     cinque di quei seggi ci sono per ipotesi.
   *
   * LE DUE PROPRIETA' SONO DIVERSE E VANNO PROVATE SEPARATE. La prima si prova sul
   * SORGENTE, perche' la scrittura del file non e' esercitabile qui — e' il legame, come
   * per og:title col job. La seconda sulla FUNZIONE, che e' pura e si esercita.
   * E la terza e' quella che tiene insieme le altre due: il campo che dichiara l'ipotesi
   * dev'essere la STESSA stringa che esce dalla pagina, non un secondo testo. */
  {
    /* stesso idioma della riga 117: il percorso relativo a __dirname, che e' quello che
       questa suite usa gia' per leggere il sorgente del job */
    const src = require('fs').readFileSync(__dirname + '/../../.github/scripts/aggiorna.mjs', 'utf8');
    const riga = src.split('\n').find(l => l.indexOf('const blocchi =') >= 0) || '';
    esito(riga.indexOf('true') > 0,
      'i blocchi registrati sono quelli della FONTE: la guardia e sui dati, e non deve poter ' +
      'scattare perche qualcuno ha cambiato una leva', riga.trim());
    const rigaIp = src.split('\n').find(l => l.indexOf('const ipotesi =') >= 0) || '';
    esito(rigaIp.indexOf('ipotesiNeiNumeri(') > 0,
      'e l ipotesi che li accompagna e la STESSA stringa che esce dalla pagina: sesto ' +
      'consumatore, non un secondo testo', rigaIp.trim());
    esito(/statoNuovo *= *\{[^}]*\bipotesi\b/.test(src.replace(/\n/g, ' ')),
      'e finisce davvero nel file: una stringa calcolata e non scritta e il difetto ' +
      'dell anteprima che nessuno generava');
    /* IL VERSO CHE MANCA SEMPRE: non basta che ci sia il campo giusto, serve che NON ci sia
       il conteggio del modello accanto. Due serie che divergono, e il primo che legge quella
       sbagliata non se ne accorge — e' la ragione per cui l alternativa a due campi e stata
       scartata, e senza questa riga la si potrebbe reintrodurre lasciando tutto verde. */
    /* SI GUARDA LA RIGA CHE COMPONE, NON IL SORGENTE — e la prima stesura non lo faceva,
       quindi cadeva sul COMMENTO che spiega perche' l alternativa e stata scartata: quel
       commento nomina «blocchiModello» per dire che non c e. E' la trappola di ARCO_ORD per
       la terza volta in un giorno, e la difesa e sempre la stessa — un controllo che cerca
       una stringa nel sorgente crudo trova anche chi la nomina per negarla. */
    /* ══ E OGNI FUNZIONE CHIAMATA SU «A.» DEV'ESSERE ESPOSTA NELLA SPIA ══
       Il mutante che toglie ipotesiNeiNumeri dalla spia era VIVO, e non era un mutante da
       poco: a esecuzione «A.ipotesiNeiNumeri()» su undefined LANCIA, cioe' il job muore.
       Letale in produzione e invisibile a una prova che legge le righe del sorgente, perche'
       quelle righe restano scritte identiche — la funzione semplicemente non c'e' piu'.
       La proprieta' non nomina nessuna funzione: OGNI «A.qualcosa(» che lo script chiama
       dev'essere fra quelle che la spia espone. Vale anche per quella che qualcuno aggiunge
       domani, che e' il giorno in cui nessuno rileggerebbe questo commento. */
    {
      const spia = (src.match(/global\.A=\{[\s\S]*?\};/) || [''])[0];
      const usate = [...new Set((src.match(/\bA\.[A-Za-z_$][\w$]*/g) || [])
        .map(x => x.slice(2)))].filter(n => src.indexOf('A.' + n + '(') >= 0);
      const fuori = usate.filter(n => spia.indexOf(n + ':') < 0);
      esito(usate.length > 3 && fuori.length === 0,
        'ogni funzione che il job chiama su A. e esposta nella spia: una che manca non fa ' +
        'cadere nessuna riga del sorgente, fa MORIRE il job',
        usate.length + ' chiamate' + (fuori.length ? ' · fuori: ' + fuori.join(', ') : ''));
    }
    const rigaSt = src.split('\n').find(l => l.indexOf('const statoNuovo =') >= 0) || '';
    const campi = (rigaSt.match(/\{(.*)\}/) || ['', ''])[1].split(',').map(x => x.trim().split(':')[0].trim());
    esito(campi.filter(c => c.indexOf('blocchi') === 0).length === 1,
      'e NON c e un secondo conteggio accanto: una serie sola piu una frase non ha un modo ' +
      'sbagliato di essere letta', 'campi: ' + campi.join(' · '));
  }

  console.log('\njob: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
})();
