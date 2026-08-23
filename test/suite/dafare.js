/* IL RIEPILOGO NOTTURNO, provato sulla funzione che lo compone.
 *
 * `componi()` è pura: riceve quello che il job ha trovato e restituisce il file. Qui si
 * prova che ogni categoria diventi una voce sul suo caso e NON la produca sul caso buono
 * — nei due versi, perché un riepilogo che elenca sempre tutto e uno che non elenca mai
 * niente passerebbero entrambi una prova scritta in un verso solo.
 *
 * LE DUE PROPRIETÀ CHE CONTANO PIÙ DELLE ALTRE.
 *
 * 1 · IL SILENZIO DEVE VOLER DIRE «NIENTE DA FARE». Se il file dicesse qualcosa anche
 *     quando non c'è niente, la mattina dopo nessuno lo leggerebbe più: `richiedono` a
 *     zero è il caso più importante, non quello banale.
 *
 * 2 · IL FILE ESISTE SEMPRE, ANCHE VUOTO. Un file che manca è ambiguo — non c'è niente da
 *     fare, o il job non è arrivato a scriverlo? — e da domani lo legge un agente, che
 *     l'ambiguità la risolve male.
 *
 * E una che riguarda la sera del 16 ottobre: LA TABELLA DEGLI ACCORDI INVALIDA È LA VOCE
 * PIÙ URGENTE CHE IL FILE POSSA PORTARE, perché è la sola che ferma la pubblicazione da
 * dentro — `npm run verifica` diventa rosso e il job non pubblica più. I motivi sono
 * quelli di erroriRiga(), passati di peso: una seconda formulazione direbbe al riepilogo
 * una cosa e alla pagina un'altra.
 */
let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

(async function(){
  const {componi, voci, markdown, conSpazzolata, riassunto} =
    await import('file:///' + (__dirname + '/../../.github/scripts/dafare.mjs').replace(/\\/g, '/'));
  const fs = require('fs');

  /* la notte buona: il job gira, niente di nuovo, niente da fare */
  const buona = () => ({
    oggi: '2026-08-23', guardia: null, notti: null,
    archivioAl: '2026-08-20', nuove: 0,
    accordiInvalidi: [], ignote: [],
    ambigue: 24, ambigueIeri: 24, esempiAmbigui: [],
    eventiNuovi: [], quiete: 3, gapSondaggi: 7
  });

  /* ══ 1 · IL SILENZIO ════════════════════════════════════════════════════ */
  {
    const f = componi(buona());
    esito(f.voci.length === 0, 'sulla notte buona non c\'è nessuna voce', JSON.stringify(f.voci));
    esito(f.conto.richiedono === 0 && f.conto.informative === 0 && f.conto.blocca === 0,
      'e il conto è zero su tutte e tre le urgenze', JSON.stringify(f.conto));
    esito(f.riga === 'Niente da fare.', 'e la riga in testa lo dice in tre parole', f.riga);
    esito(f.job.esito === 'ok', 'e dichiara che il job ha girato', JSON.stringify(f.job));
    esito(typeof f.generato === 'string' && f.generato === '2026-08-23',
      'la data del riepilogo arriva da fuori: qui dentro non si chiama Date()', f.generato);
  }

  /* ══ 2 · LA TABELLA DEGLI ACCORDI INVALIDA ══════════════════════════════ */
  {
    const s = buona();
    s.accordiInvalidi = [{riga: 2, x: {a: 'raamm', b: 'lista_araba', stato: 'proposto', data: '2026-10-15'},
                          errori: ['«raamm» non è in P{}: nessuna lista ha questo id']}];
    const f = componi(s);
    const v = f.voci.filter(x => x.categoria === 'apparentamenti');
    esito(v.length === 1, 'una riga invalida diventa una voce', String(v.length));
    if (!v.length) { console.log('KO le prove che seguono non hanno una voce da guardare'); ko++; }
    else {
    esito(v[0].urgenza === 'blocca',
      'ed è marcata «blocca»: è la sola che ferma la pubblicazione da dentro', v[0].urgenza);
    esito(f.conto.blocca === 1 && /BLOCCA la pubblicazione/.test(f.riga),
      'il conto in testa lo dice per primo', f.riga);
    esito(v[0].titolo.indexOf('Riga 2') >= 0, 'la voce nomina la riga', v[0].titolo);
    esito(v[0].dettaglio.errori.join(' ') === s.accordiInvalidi[0].errori.join(' '),
      'e i motivi sono quelli di erroriRiga(), non una seconda formulazione',
      JSON.stringify(v[0].dettaglio.errori));
    esito(/non è in P\{\}/.test(v[0].chiude) && /riga 2/.test(v[0].chiude),
      'anche nella riga che dice come si chiude', v[0].chiude);
    esito(v[0].dettaglio.a === 'raamm' && v[0].dettaglio.b === 'lista_araba',
      'e il dettaglio porta i due id, che sono il campo da correggere', JSON.stringify(v[0].dettaglio));
    esito(v[0].procedura === 'docs/aggiungere-un-apparentamento.md',
      'e rimanda alla procedura', String(v[0].procedura));

    }
    s.accordiInvalidi.push({riga: 3, x: {a: 'shas', b: 'shas'}, errori: ['«shas» è apparentata con sé stessa']});
    esito(componi(s).voci.filter(x => x.categoria === 'apparentamenti').length === 2,
      'due righe sbagliate fanno due voci, perché si correggono una per una');
  }

  /* ══ 3 · LE ALTRE CATEGORIE, OGNUNA SUL SUO CASO ════════════════════════ */
  {
    const casi = [
      ['colonne ignote', s => { s.ignote = ['Winter', 'Other']; }, 'colonne-ignote', 'blocca'],
      ['ambigue in crescita', s => { s.ambigue = 27; }, 'ambigue-cresciute', 'blocca'],
      ['job fermo', s => { s.guardia = 'Wikipedia non raggiungibile'; s.notti = 3; }, 'job-fermo', 'blocca'],
      ['voci-evento nuove', s => { s.eventiNuovi = [
          {chiave: 'k1', data: '2026-08-22', testo: 'Ra\'am conducts a primary'},
          {chiave: 'k2', data: '2026-08-23', testo: 'Likud and RZP sign a surplus deal'}]; },
        'eventi-da-tradurre', 'richiede'],
      ['silenzio demoscopico', s => { s.quiete = 9; }, 'silenzio-demoscopico', 'informativa']
    ];
    casi.forEach(function(c){
      const s = buona(); c[1](s);
      const f = componi(s);
      const v = f.voci.filter(x => x.id === c[2] || x.id.indexOf(c[2]) === 0);
      esito(v.length === 1, 'la categoria «' + c[0] + '» produce la sua voce',
        JSON.stringify(f.voci.map(x => x.id)));
      if (!v.length) return;
      esito(v[0].urgenza === c[3], '  · con urgenza «' + c[3] + '»', v[0].urgenza);
      esito(typeof v[0].chiude === 'string' && v[0].chiude.length > 40,
        '  · e dice che cosa serve per chiuderla, non solo che cosa è successo', v[0].chiude);
      /* e NON compare sulla notte buona: è la metà che una prova scritta in un verso solo perde */
      esito(componi(buona()).voci.filter(x => x.id.indexOf(c[2]) === 0).length === 0,
        '  · e sulla notte buona non c\'è');
    });
  }

  /* ══ 4 · IL CONTO IN TESTA ══════════════════════════════════════════════ */
  {
    const s = buona();
    s.ignote = ['Winter'];
    s.eventiNuovi = [{chiave: 'k', data: '2026-08-22', testo: 'qualcosa'}];
    s.quiete = 9;
    const f = componi(s);
    esito(f.conto.blocca === 1, 'blocca conta solo quelle che fermano la pubblicazione', String(f.conto.blocca));
    esito(f.conto.richiedono === 2,
      'richiedono comprende le bloccanti: sono cose da fare anche loro', String(f.conto.richiedono));
    esito(f.conto.informative === 1, 'e le informative stanno per conto loro', String(f.conto.informative));
    esito(/2 cose richiedono te/.test(f.riga) && /1 informativa/.test(f.riga) && /BLOCCA/.test(f.riga),
      'la riga in testa dice tutti e tre i numeri', f.riga);
    esito(riassunto(0, 1, 0) === '1 cosa richiede te', 'e l\'accordo singolare è quello giusto',
      riassunto(0, 1, 0));
  }

  /* ══ 5 · LA SPAZZOLATA SI AGGIUNGE, NON RICOMPONE ═══════════════════════ */
  {
    /* il file di partenza porta GIÀ una voce: con un file vuoto, aggiungere e sostituire
       darebbero lo stesso risultato e la prova non distinguerebbe le due cose */
    const s = buona();
    s.ignote = ['Winter'];
    const f = componi(s);
    esito(f.voci.length === 1, 'il file di partenza ha già una voce, o questa prova non distingue niente');
    const g = conSpazzolata(f, 'OROLOGIO AL 2026-10-23\n  mediana 3/14 KO ...');
    esito(g.voci.length === 2 && g.voci.some(x => x.id === 'spazzolata-caduta'),
      'la spazzolata arriva dopo il push e si AGGIUNGE al file già scritto',
      JSON.stringify(g.voci.map(x => x.id)));
    esito(g.voci.some(x => x.id === 'colonne-ignote'),
      'senza cancellare quello che c\'era: il parser non si rifà per una prova che scade',
      JSON.stringify(g.voci.map(x => x.id)));
    esito(g.conto.richiedono === 2 && /2 cose richiedono te/.test(g.riga),
      'e il conto in testa si rifà', g.riga);
    esito(f.voci.length === 1, 'senza toccare il file di partenza');
    const sp = g.voci.filter(x => x.id === 'spazzolata-caduta')[0];
    esito(sp && sp.dettaglio.uscita.indexOf('OROLOGIO') >= 0,
      'e porta l\'uscita vera, che è quello che serve per riprodurla',
      sp ? sp.dettaglio.uscita.slice(0, 60) : 'voce assente');
  }

  /* ══ 6 · IL MARKDOWN È UNA VISTA DEL JSON, NON UN SECONDO ELENCO ════════ */
  {
    const s = buona();
    s.accordiInvalidi = [{riga: 1, x: {a: 'raamm', b: 'lista_araba'}, errori: ['«raamm» non è in P{}']}];
    s.eventiNuovi = [{chiave: 'k', data: '2026-08-22', testo: 'Likud signs a surplus deal'}];
    const f = componi(s);
    const m = markdown(f);
    esito(m.indexOf(f.riga) >= 0, 'il corpo comincia con la stessa riga del file', m.split('\n')[0]);
    esito(f.voci.every(v => m.indexOf(v.titolo) >= 0),
      'ogni voce del file compare nel corpo: sono lo stesso elenco visto due volte');
    esito(f.voci.every(v => m.indexOf(v.chiude.slice(0, 30)) >= 0),
      'con la sua riga di «come si chiude»');
    esito(/Likud signs a surplus deal/.test(m),
      'e il testo inglese originale, che è quello da tradurre');
    esito(/Blocca la pubblicazione/.test(m) && m.indexOf('Blocca la pubblicazione') < m.indexOf('Richiede te'),
      'le bloccanti stanno in cima', m.slice(0, 200));
  }

  /* ══ 7 · IL FILE SEMINATO SU DISCO ══════════════════════════════════════ */
  {
    const p = __dirname + '/../../dati/da-fare.json';
    esito(fs.existsSync(p), 'dati/da-fare.json esiste: un file che manca è ambiguo, uno vuoto no');
    const f = JSON.parse(fs.readFileSync(p, 'utf8'));
    esito(typeof f.riga === 'string' && Array.isArray(f.voci) && f.conto,
      'ed è nella forma che componi() produce', Object.keys(f).join(', '));
    esito(f.voci.length === f.conto.blocca + f.conto.richiedono - f.conto.blocca + f.conto.informative
          || f.voci.length === f.conto.richiedono + f.conto.informative,
      'il conto e le voci dicono lo stesso numero',
      f.voci.length + ' voci · ' + JSON.stringify(f.conto));
  }

  console.log('\ndafare: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
})();
