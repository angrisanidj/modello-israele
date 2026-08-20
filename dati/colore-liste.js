/* ============================================================
   colore-liste.js — regola generativa dei colori delle liste
   Knesset 2026 · revisione 5: slot riposizionati.

   Cambia rispetto alla revisione 4 di Design SOLO la scelta dei punti dentro i
   confini già verificati. Restano identici: settori di tinta, bande di luminanza,
   famiglie, ordine delle bande, --on-color, --flag, token di superficie.

   Il reticolo a passo costante è sostituito da una terna per slot —
   (tinta, posizione nella banda, croma) — scelta massimizzando il ΔE2000 minimo
   fra liste coesistenti sul peggiore dei due temi, con due vincoli aggiunti:

   · PAVIMENTO DI CROMA. Senza, l'ottimo porta il croma a zero e produce grigi:
     un grigio ha un angolo di tinta che non significa niente, e il controllo sui
     settori non se ne accorgerebbe. Il pavimento è 0,0424, cioè il croma minimo
     effettivo della revisione 4: non è una regressione.
   · ANCORE DI BLOCCO. Lo slot 0 di ogni banda è il token di blocco (--coal, --oppo,
     --arab, --inc): tinta entro ±6° dal valore della revisione 4 e croma non
     inferiore a quello. Senza, --coal finiva magenta e --oppo grigio-verdazzurro.

   I punti sono già arrotondati alla griglia su cui sono stati misurati: i valori
   qui sotto sono esattamente quelli valutati, non una versione stampata di altri.

   COLORE.di('coalizione', 0, 'chiaro')
   COLORE.avvisi()    -> messaggi accumulati (capienza superata)
   ============================================================ */
var COLORE = (function () {
  'use strict';

  /* 1 · bande di luminanza relativa [min, max] — invariate dalla revisione 4 */
  var BANDE = {
    chiaro: { arabo:[0.0176,0.0229], coalizione:[0.0456,0.0608],
              incerto:[0.0951,0.0979], opposizione:[0.1438,0.1747] },
    scuro:  { arabo:[0.2046,0.2248], coalizione:[0.3098,0.3673],
              incerto:[0.4964,0.5072], opposizione:[0.6795,0.7961] }
  };

  /* 2 · una famiglia di tinta per blocco, settori disgiunti — invariati */
  var SETTORI = {
    arabo      : { da:125, a:182, posti:4 },   /* verde            */
    opposizione: { da:186, a:236, posti:6 },   /* verdeazzurro     */
    coalizione : { da:240, a:330, posti:6 },   /* blu -> indaco    */
    incerto    : { da: 38, a:102, posti:4 }    /* sabbia -> ambra  */
  };

  /* 3 · i punti: [tinta OKLCH, posizione nella banda 0..1, croma massimo] */
  var PUNTI = {
    arabo       : [[126.13,0.9885,0.299], [146.75,1.0000,0.370], [143.91,0.9484,0.043], [180.40,0.6255,0.357]],
    opposizione : [[187.00,0.9276,0.363], [211.02,1.0000,0.048], [187.00,0.0248,0.054], [222.82,0.0000,0.164], [235.00,0.0277,0.045], [204.24,0.5284,0.095]],
    coalizione  : [[241.50,1.0000,0.192], [329.00,1.0000,0.276], [277.45,1.0000,0.042], [329.00,0.0530,0.067], [266.28,0.9532,0.370], [292.38,0.0313,0.138]],
    incerto     : [[49.49,0.0000,0.285], [39.00,0.6803,0.043], [101.00,0.9746,0.042], [80.51,0.9700,0.312]]
  };

  /* 4 · pavimento di croma: sotto questo valore un colore non appartiene più a
     nessuna famiglia, e va segnalato invece che accettato in silenzio */
  var CROMA_PAVIMENTO = 0.0424;

  var AVVISI = [];

  function srgb(c){ return c<=0.0031308 ? 12.92*c : 1.055*Math.pow(c,1/2.4)-0.055; }
  function lin(c){ return c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); }
  function oklch(Lo,C,H){
    var h=H*Math.PI/180, a=C*Math.cos(h), b=C*Math.sin(h);
    var l=Math.pow(Lo+0.3963377774*a+0.2158037573*b,3),
        m=Math.pow(Lo-0.1055613458*a-0.0638541728*b,3),
        s=Math.pow(Lo-0.0894841775*a-1.2914855480*b,3);
    return [ srgb( 4.0767416621*l-3.3077115913*m+0.2309699292*s),
             srgb(-1.2684380046*l+2.6097574011*m-0.3413193965*s),
             srgb(-0.0041960863*l-0.7034186147*m+1.7076147010*s) ];
  }
  function inGamut(r){ for(var i=0;i<3;i++) if(r[i]<-0.002||r[i]>1.002) return false; return true; }
  function lum(r){ return 0.2126*lin(r[0])+0.7152*lin(r[1])+0.0722*lin(r[2]); }
  function hex(r){ var o='#',v; for(var i=0;i<3;i++){ v=Math.round(Math.min(1,Math.max(0,r[i]))*255).toString(16).toUpperCase();
      o += v.length<2 ? '0'+v : v; } return o; }

  function aLuminanza(target,H,Cmax){
    for(var c=Cmax;c>=0.004;c-=0.004){
      var lo=0,hi=1,mid,rgb,i;
      for(i=0;i<36;i++){
        mid=(lo+hi)/2; rgb=oklch(mid,c,H);
        if(lum([Math.min(1,Math.max(0,rgb[0])),Math.min(1,Math.max(0,rgb[1])),Math.min(1,Math.max(0,rgb[2]))])<target) lo=mid; else hi=mid;
      }
      rgb=oklch((lo+hi)/2,c,H);
      if(inGamut(rgb)) return hex(rgb);
    }
    return hex(oklch(0.5,0.02,H));
  }

  /* croma OKLCH di un esadecimale, per la verifica del pavimento */
  function croma(h){
    var n=parseInt(h.slice(1),16), t=[(n>>16)&255,(n>>8)&255,n&255];
    var r=lin(t[0]/255), g=lin(t[1]/255), b=lin(t[2]/255);
    var l=Math.cbrt(0.4122214708*r+0.5363325363*g+0.0514459929*b);
    var m=Math.cbrt(0.2119034982*r+0.6806995451*g+0.1073969566*b);
    var s=Math.cbrt(0.0883024619*r+0.2817188376*g+0.6299787005*b);
    var A=1.9779984951*l-2.4285922050*m+0.4505937099*s;
    var B=0.0259040371*l+0.7827717662*m-0.8086757660*s;
    return Math.sqrt(A*A+B*B);
  }

  function avvisa(t){ if(AVVISI.indexOf(t)<0) AVVISI.push(t); }

  /* Oltre la capienza la revisione 4 faceva k = slot % n e restituiva in silenzio
     un colore già assegnato. Qui lo slot supplementare cade a mezzeria fra due punti
     esistenti — colore distinto, distanza ridotta — e la cosa viene dichiarata.
     Dal secondo supplementare in poi la funzione fallisce con un errore esplicito:
     un colore che nessuno sa leggere è peggio di una lista senza colore proprio. */
  function punto(blocco, slot){
    var P=PUNTI[blocco], n=P.length;
    if(slot < n) return P[slot];
    var extra = slot - n;
    if(extra >= n-1)
      throw new Error('colore-liste: il blocco «'+blocco+'» ha '+n+' posti e '+(n-1)+
        ' supplementari; lo slot '+slot+' non ha un colore leggibile. '+
        'La lista in eccesso va accorpata in «altre liste» o resa a tratteggio.');
    avvisa('Il blocco «'+blocco+'» ha superato la capienza di '+n+' colori: lo slot '+
           slot+' usa un colore supplementare, più vicino agli altri.');
    var a=P[extra], b=P[extra+1];
    return [ (a[0]+b[0])/2, (a[1]+b[1])/2, Math.min(a[2],b[2]) ];
  }

  function di(blocco, slot, tema){
    var B = BANDE[tema||'chiaro'] && BANDE[tema||'chiaro'][blocco];
    if(!PUNTI[blocco] || !B) return tema==='scuro' ? '#7D8A9B' : '#626D7E';
    var p = punto(blocco, slot);
    var h = aLuminanza(B[0] + (B[1]-B[0])*p[1], p[0], p[2]);
    if(croma(h) < CROMA_PAVIMENTO - 1e-6)
      avvisa('Il colore dello slot '+slot+' di «'+blocco+'» ('+h+') è sotto il pavimento '+
             'di croma: non appartiene più alla famiglia del blocco.');
    return h;
  }

  function capienza(b){ return PUNTI[b] ? PUNTI[b].length : 0; }
  function avvisi(){ return AVVISI.slice(); }
  function azzeraAvvisi(){ AVVISI.length = 0; }

  return { di:di, capienza:capienza, avvisi:avvisi, azzeraAvvisi:azzeraAvvisi,
           croma:croma, CROMA_PAVIMENTO:CROMA_PAVIMENTO,
           BANDE:BANDE, SETTORI:SETTORI, PUNTI:PUNTI };
})();
if (typeof module !== 'undefined') module.exports = COLORE;
