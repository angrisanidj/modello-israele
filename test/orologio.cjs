/* Congela l'orologio del processo alla data in FINTO_OGGI, prima che la suite parta.
   Si carica con `node --require`, così vale anche per il codice che la suite valuta con
   eval: l'app gira nel realm di Node e usa il Date globale. */
const q = new Date(process.env.FINTO_OGGI + 'T10:00:00+02:00').getTime();
const D0 = Date;
class DF extends D0 {
  constructor(...a){ if (!a.length) super(q); else super(...a); }
  static now(){ return q; }
}
global.Date = DF;
