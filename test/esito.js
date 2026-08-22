/* Stampa un blocco di controlli e FA FALLIRE IL PROCESSO se uno cade.
 *
 * Sta FUORI da test/suite/ apposta, come css.js: il banco esegue tutti i .js che trova lì
 * dentro, e un modulo condiviso finirebbe nell'elenco delle prove con zero asserzioni.
 *
 * IL DIFETTO CHE QUESTO FILE CHIUDE. Quattordici suite finivano con
 *
 *     Object.entries(ck).forEach(([k,v]) => console.log(' ' + (v?'OK  ':'KO  ') + k));
 *
 * cioè stampavano KO e uscivano con codice ZERO. Il banco le contava lo stesso, perché
 * esegui.mjs legge lo stdout e conta le righe — quindi `npm run verifica` falliva davvero.
 * Ma era una salvezza per caso, di una riga sola e in un altro file: chi lanciava una
 * suite da sola vedeva uscita zero con asserzioni fallite, e qualunque strumento che
 * guardasse il codice d'uscita — un hook, una CI diversa, un misuratore di mutanti — la
 * dava per verde. È successo davvero: il primo giro di mutanti sulla barra dei comandi
 * dava tutti i mutanti vivi, e non lo erano.
 *
 * È la stessa forma di v5.js, che è rimasta morta per commit senza che nessuno se ne
 * accorgesse: non falliva, rispondeva.
 *
 * Il conteggio del banco non cambia — le righe stampate sono identiche — e in più adesso
 * il codice d'uscita dice la stessa cosa che dicono le righe.
 */
module.exports = function stampa(ck){
  let ko = 0;
  Object.entries(ck).forEach(([k, v]) => {
    console.log(' ' + (v ? 'OK  ' : 'KO  ') + k);
    if (!v) ko++;
  });
  if (ko) process.exitCode = 1;
  return ko;
};
