/* Il foglio di stile letto come dato: quali regole sono davvero attive a una data
   larghezza di viewport.
 *
 * Sta FUORI da test/suite/ apposta: il banco esegue tutti i .js che trova lì dentro, e
 * un modulo condiviso finirebbe nell'elenco delle prove con zero asserzioni. Qui invece
 * è una libreria, e le suite se la prendono con require('../css.js').
 *
 * Nato dentro mobile.js, estratto il 22 agosto 2026 quando è servito anche a colonne.js.
 * Copiarlo sarebbe stata la solita strada doppia: due parser dello stesso foglio che
 * divergono in silenzio la prima volta che si tocca una @media annidata.
 */
const fs = require('fs');

function carica(percorso){
  const html = fs.readFileSync(percorso, 'utf8');
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];

  /* una @media conta se la sua condizione comprende w; prefers-* e print non si valutano */
  function attiva(cond, w){
    if (/prefers|print/.test(cond)) return false;
    const mx = /max-width:\s*(\d+)px/.exec(cond), mn = /min-width:\s*(\d+)px/.exec(cond);
    if (mx && w > +mx[1]) return false;
    if (mn && w < +mn[1]) return false;
    return !!(mx || mn);
  }

  function parseBlocco(body, out, next){
    let i = 0;
    while (i < body.length){
      const b = body.indexOf('{', i); if (b < 0) break;
      const e = body.indexOf('}', b); if (e < 0) break;
      out.push({sel: body.slice(i, b).trim(), decl: body.slice(b+1, e), ord: next()});
      i = e + 1;
    }
  }

  /* [{sel, decl, ord}] delle regole attive a larghezza w, in ordine di sorgente */
  function regole(w){
    const out = []; let i = 0, ord = 0;
    while (i < css.length){
      const at = css.indexOf('@media', i);
      const nextBrace = css.indexOf('{', i);
      if (nextBrace < 0) break;
      if (at >= 0 && at < nextBrace){
        const condEnd = css.indexOf('{', at);
        const cond = css.slice(at+6, condEnd).replace(/[()]/g, '').trim();
        let d = 1, j = condEnd + 1;
        while (j < css.length && d > 0){ if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; }
        const body = css.slice(condEnd+1, j-1);
        if (attiva(cond, w)) parseBlocco(body, out, () => ord++);
        i = j; continue;
      }
      const end = css.indexOf('}', nextBrace);
      if (end < 0) break;
      out.push({sel: css.slice(i, nextBrace).trim(), decl: css.slice(nextBrace+1, end), ord: ord++});
      i = end + 1;
    }
    return out;
  }

  /* l'ultimo valore dichiarato per una proprietà su un selettore ESATTO */
  function prop(regs, sel, p){
    let v = null;
    regs.forEach(r => {
      const sels = r.sel.split(',').map(s => s.trim());
      if (sels.indexOf(sel) < 0) return;
      const m = new RegExp('(?:^|;)\\s*' + p + '\\s*:\\s*([^;]+)').exec(r.decl);
      if (m) v = m[1].trim();
    });
    return v;
  }

  /* idem, ma su TUTTI i selettori che soddisfano un predicato: serve quando la regola
     che conta non è su un selettore esatto ma su una famiglia (`.pr.mv>div:nth-child(3)`) */
  function propSe(regs, test, p){
    let v = null, sel = null;
    regs.forEach(r => {
      r.sel.split(',').map(s => s.trim()).forEach(s => {
        if (!test(s)) return;
        const m = new RegExp('(?:^|;)\\s*' + p + '\\s*:\\s*([^;]+)').exec(r.decl);
        if (m) { v = m[1].trim(); sel = s; }
      });
    });
    return v === null ? null : {valore: v, selettore: sel};
  }

  return {css, regole, prop, propSe, attiva};
}

module.exports = {carica};
