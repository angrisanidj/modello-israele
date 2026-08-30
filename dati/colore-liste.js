/* ============================================================
   colore-liste.js — REGOLA GENERATIVA dei colori, Knesset 2026
   Consegna 6 · 22 agosto 2026 · revisione 6

   QUESTO FILE E' LA SORGENTE UNICA DEI COLORI DI LISTA E DI BLOCCO.
   tokens-colore.css e palette-partiti.md sono istantanee GENERATE da
   qui: non si modificano a mano.

   Le superfici (--card, --paper, --wash, --ink*, --acc, --on-color...)
   NON stanno qui: restano quelle della consegna 4, in knesset-theme.css.

   ── CHE COSA CAMBIA DALLA REVISIONE 5 ────────────────────────
   1. oklch() applica la funzione di trasferimento sRGB. Nella
      revisione 5 non la applicava: restituiva RGB LINEARE trattato
      come sRGB. Le luminanze erano giuste comunque (atY() misura Y
      sul risultato), e quindi contrasti e DeltaE erano giusti; ma la
      TINTA OTTENUTA non era quella chiesta, e ruotava fino a 30°.
      Non era il clamp: era la trasformata. Ora il round trip chiude.
   2. Ogni colore porta la tinta e il croma MISURATI sull'esadecimale
      consegnato (misuraColore()), non quelli chiesti, e un candidato
      la cui tinta misurata cade fuori dal settore del blocco viene
      scartato: il settore disgiunto e' verificato, non dichiarato.
   3. La distanza per un dicromate DENTRO il blocco e' un pavimento
      (V.dentro_dic), non un esito. E' 4,2 / 4,5 nei tre blocchi che
      stanno in aula e 3,0 / 3,3 nell'ago della bilancia, dove la
      famiglia ocra non ha varianza protanopica: il valore e' per
      blocco, dichiarato, e la ragione e' scritta accanto.
   4. La tinta assegnata a ogni lista e' un VINCOLO con tolleranza
      (14°), non uno spareggio. Delle venti, quattro coincidono con la
      tinta del colore storico della lista; per le altre sedici il
      colore storico e' grigio o sta nell'arco di un altro blocco, e
      l'identita' e' dichiarata persa in tinta-storica.md.
   ============================================================ */
var COLORE = (function () {
  'use strict';

  /* ── 1 · superfici della consegna 4 (sola lettura) ───────── */
  var SUP = {
    chiaro: { card:'#FFFFFF', paper:'#F7F8FA', wash:'#F1F5FC',
              on:'#FFFFFF', onInv:'#0A1730', acc:'#0038B8' },
    scuro:  { card:'#0F1727', paper:'#070D18', wash:'#131E32',
              on:'#070D18', onInv:'#E8EDF6', acc:'#6994E5' }
  };

  /* ── 2 · settori di tinta, disgiunti (gradi OKLCH) ───────── */
  var SETTORE = {
    coalizione : [226, 78],   /* 226°–304° · azzurro -> blu -> viola     */
    opposizione: [340, 60],   /* 340°– 40° · magenta -> rosso -> arancio */
    arabo      : [142, 50],   /* 142°–192° · verde -> verde acqua        */
    incerto     : [ 58, 47]   /*  58°–105° · arancio bruciato -> ocra    */
  };

  /* ── 3 · finestre di luminanza ammesse dai contrasti ─────── */
  var FINESTRA = {
    chiaro: [[0.042, 0.1730], [0.2280, 0.2600]],
    /* Il tetto dello scuro è 0,6500 e non 0,7200, ed è nostro, non della consegna.
       A 0,7200 la finestra arriva a L* 88, dove il gamut sRGB non ha quasi più croma da
       dare: i due colori più alti uscivano a croma 0,053 e 0,057 — quasi bianchi — e
       portavano 32 seggi su 120, il 27% della camera, contro ZERO seggi sotto croma 0,08
       in tema chiaro. Peggio: i due quasi-bianchi stavano sui due lati opposti della
       soglia dei 61, cioè la zona più luminosa dell'emiciclo scavalcava la riga che il
       grafico esiste per mostrare, e uno dei due era il primo partito con 24 seggi.
       Abbassando il tetto a 0,650: seggi sotto croma 0,08 da 32 a 8, croma minima da
       0,053 a 0,067, e il pavimento dicromatico DENTRO il blocco sale da 3,88 a 5,47 —
       cioè sopra il 4,5 dichiarato, il che chiude da sé la discrepanza fra le matrici di
       Viénot e quelle di Machado su cui la consegna e noi non concordavamo.
       Prezzo accettato: slot liberi in scuro 2/3/1/1 invece di 1/5/2/2, e ΔE fra blocchi
       da 17,4 a 15,9 — entrambi sopra soglia. Sotto 0,600 non si può scendere: l'ago
       della bilancia va a −1 slot e una lista resta senza colore.
       Il tema chiaro non è toccato. */
    scuro : [[0.2060, 0.6500]]
  };

  /* ── 4 · pavimenti, in ordine di priorita' del documento ─── */
  var V = {
    croma_max        : 0.26,
    passo_tinta      : 3,
    passo_L          : 1.5,
    /* L'AGO DELLA BILANCIA SCENDE A 2,4 IN CHIARO, ed è la scala di ripiego del §9
       percorsa per la prima volta — il 26 agosto 2026, quando Amcha Israel è diventata la
       quinta lista di quel blocco. A 3,0 il blocco satura a QUATTRO in tema chiaro: la
       quinta usciva #626D7E, che è --mute esatto, cioè il colore del testo disabilitato.
       Il primo gradino basta: 3,0 → 2,4 porta la saturazione a cinque, «liberi» a zero, e
       il colore esce #955A00 senza avvisi. Il prezzo è dichiarato ed è quello: la distanza
       dicromatica DENTRO l'ago della bilancia scende da 3,0 a 2,4 — quel blocco è la
       famiglia ocra, che non ha varianza protanopica, ed è la ragione per cui partiva già
       più basso degli altri tre. Gli altri blocchi non si toccano.
       LA SCALA HA UN SECONDO E UN TERZO GRADINO e non sono stati percorsi: fra_blocchi_dic
       di quelle coppie meno 0,5, poi allargare il settore. Una sesta lista qui li chiede. */
    dentro_dic       : { chiaro: { coalizione:4.2, opposizione:4.2, arabo:4.2, incerto:2.4 },
                         scuro : { coalizione:4.5, opposizione:4.5, arabo:4.5, incerto:3.3 } },
    fra_blocchi      : 11,
    /* fra blocchi il pavimento dicromatico e' piu' alto fra i tre blocchi
       che stanno in aula, dove il colore e' l'unico portatore sui seggi,
       e piu' basso per le coppie che coinvolgono l'ago della bilancia,
       che non ha seggi e compare solo dove c'e' un nome accanto.        */
    fra_blocchi_dic  : { chiaro: { aula:7.0, incerto:6.0 },
                         scuro : { aula:6.5, incerto:5.5 } },
    da_acc           : 11,
    testo            : 4.65,
    superficie       : 3.15,
    tolleranza       : 0.5,   /* entro cui si sceglie il croma minore   */
    tolleranza_tinta : 14     /* scarto massimo dalla tinta storica     */
  };

  /* ── 5 · anagrafica ──────────────────────────────────────── */
  var ORDINE = {
    coalizione : ['likud','shas','utj','otzma','sionismo_rel'],
    opposizione: ['byachad','democratici','beitenu','yashar','blue_white','yesh_atid','bennett26'],
    arabo      : ['raam','lista_araba','hadash_taal','balad'],
    incerto    : ['casa_sionista','economico','unity_erdan','israel_first','amcha']
  };
  /* TINTA_ASSEGNATA: la posizione di tinta di ogni lista dentro il
     settore del suo blocco. E' un PARAMETRO DELLA REGOLA, uno per
     lista, e va letto per quello che e': una spaziatura dichiarata
     dentro la famiglia, non un'identita'.
     Quattro valori su venti coincidono con la tinta del colore storico
     della lista, perche' quel colore e' cromatico e cade dentro il suo
     settore: sono marcati STORICA e sono l'unica identita' che questa
     tavolozza tiene. Gli altri sedici sono nostri: il colore storico di
     quelle liste e' un grigio o ha una tinta che appartiene all'arco di
     un altro blocco. L'elenco con la ragione di ciascuna, misurata,
     sta in tinta-storica.md. La regola non finge di poterle tenere. */
  var TINTA_ASSEGNATA = {
    likud       : 258,  /* STORICA · #1b4a8f H 258,4 C 0,125 */
    shas        : 240,
    utj         : 294,
    otzma       : 252,
    sionismo_rel: 280,
    byachad     : 20,
    democratici : 30,   /* STORICA · #c0392b H  29,7 C 0,174 */
    beitenu     : 343,  /* bordo magenta: il punto legale piu' vicino al viola storico (297,5°) */
    yashar      : 40,   /* bordo arancio: il punto legale piu' vicino all'arancio storico (67,4°) */
    blue_white  : 352,
    yesh_atid   : 8,
    bennett26   : 36,
    raam        : 157,  /* STORICA · #1f7a4d H 156,8 C 0,110 */
    lista_araba : 147,  /* STORICA · #3f8047 H 146,5 C 0,110 */
    hadash_taal : 170,
    balad       : 186,
    casa_sionista: 75,
    economico   : 90,
    unity_erdan : 58,
    israel_first: 100,
    amcha       : 66   /* varco fra unity_erdan 58 e casa_sionista 75: 8° per parte */
  };
  var TINTA_STORICA = TINTA_ASSEGNATA;   /* nome della revisione 5, conservato */

  /* ── 6 · colorimetria ────────────────────────────────────── */
  function gam(c){ return c<=0.0031308 ? 12.92*c : 1.055*Math.pow(c,1/2.4)-0.055; }
  function lin(c){ return c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); }
  /* OKLCH -> sRGB. La funzione di trasferimento e' l'ultima riga, ed e'
     quella che mancava nella revisione 5.                             */
  function oklch(L,C,H){
    var h=H*Math.PI/180, a=C*Math.cos(h), b=C*Math.sin(h);
    var l=Math.pow(L+0.3963377774*a+0.2158037573*b,3),
        m=Math.pow(L-0.1055613458*a-0.0638541728*b,3),
        s=Math.pow(L-0.0894841775*a-1.2914855480*b,3);
    var R= 4.0767416621*l-3.3077115913*m+0.2309699292*s,
        G=-1.2684380046*l+2.6097574011*m-0.3413193965*s,
        B=-0.0041960863*l-0.7034186147*m+1.7076147010*s;
    return [gam(R), gam(G), gam(B)];
  }
  /* sRGB -> OKLCH. Serve per annotare che cosa e' stato prodotto. */
  function misuraColore(h){
    var r=[0,1,2].map(function(i){ return lin(parseInt(h.slice(1+i*2,3+i*2),16)/255); });
    var l=Math.cbrt(0.4122214708*r[0]+0.5363325363*r[1]+0.0514459929*r[2]),
        m=Math.cbrt(0.2119034982*r[0]+0.6806995451*r[1]+0.1073969566*r[2]),
        s=Math.cbrt(0.0883024619*r[0]+0.2817188376*r[1]+0.6299787005*r[2]);
    var L=0.2104542553*l+0.7936177850*m-0.0040720468*s,
        A=1.9779984951*l-2.4285922050*m+0.4505937099*s,
        B=0.0259040371*l+0.7827717662*m-0.8086757660*s;
    var H=Math.atan2(B,A)*180/Math.PI; if(H<0) H+=360;
    return { L:L, C:Math.sqrt(A*A+B*B), H:H };
  }
  function clamp(r){ return [Math.min(1,Math.max(0,r[0])),Math.min(1,Math.max(0,r[1])),Math.min(1,Math.max(0,r[2]))]; }
  function inGamut(r){ for(var i=0;i<3;i++) if(r[i]<-0.002||r[i]>1.002) return false; return true; }
  function lumLin(r){ return 0.2126*r[0]+0.7152*r[1]+0.0722*r[2]; }
  function Y(srgb){ return lumLin([lin(srgb[0]),lin(srgb[1]),lin(srgb[2])]); }
  function hex(r){ var o='#',v,i,c=clamp(r);
    for(i=0;i<3;i++){ v=Math.round(c[i]*255).toString(16).toUpperCase(); o+=v.length<2?'0'+v:v; }
    return o; }
  function daHex(h){ return [parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255]; }
  var Y2L = function(y){ return y>0.008856 ? 116*Math.cbrt(y)-16 : 903.3*y; };
  var L2Y = function(L){ return L>8 ? Math.pow((L+16)/116,3) : L/903.3; };
  function contrasto(y1,y2){ var a=Math.max(y1,y2), b=Math.min(y1,y2); return (a+0.05)/(b+0.05); }
  function dTinta(a,b){ return Math.abs(((a-b)%360+540)%360-180); }

  function aLuminanza(y,C,H){
    var lo=0, hi=1.2, mid, r, i;
    for(i=0;i<22;i++){ mid=(lo+hi)/2; r=clamp(oklch(mid,C,H));
      if(Y(r)<y) lo=mid; else hi=mid; }
    return oklch((lo+hi)/2,C,H);
  }
  /* massimo croma in gamut a quella luminanza e tinta, fino a cap */
  function colore(y,H,cap){
    var lo=0, hi=cap, ok=aLuminanza(y,0,H), okC=0, i, m, r;
    for(i=0;i<16;i++){ m=(lo+hi)/2; r=aLuminanza(y,m,H);
      if(inGamut(r)&&Math.abs(Y(clamp(r))-y)<0.0015){ ok=r; okC=m; lo=m; } else hi=m; }
    var h=hex(ok), mis=misuraColore(h);
    return { hex:h, srgb:daHex(h), C:okC, Y:Y(daHex(h)),
             Hmis:mis.H, Cmis:mis.C, Lmis:mis.L };
  }

  /* CIELAB D65 + DeltaE 2000 */
  function lab(srgb){
    var r=lin(srgb[0]), g=lin(srgb[1]), b=lin(srgb[2]);
    var X=0.4124564*r+0.3575761*g+0.1804375*b,
        Yv=0.2126729*r+0.7151522*g+0.0721750*b,
        Z=0.0193339*r+0.1191920*g+0.9503041*b;
    var f=function(t){ return t>0.008856?Math.cbrt(t):7.787*t+16/116; };
    var fx=f(X/0.95047), fy=f(Yv), fz=f(Z/1.08883);
    return [116*fy-16, 500*(fx-fy), 200*(fy-fz)];
  }
  function dE(l1,l2){
    var L1=l1[0],a1=l1[1],b1=l1[2],L2=l2[0],a2=l2[1],b2=l2[2];
    var C1=Math.sqrt(a1*a1+b1*b1), C2=Math.sqrt(a2*a2+b2*b2), Cb=(C1+C2)/2;
    var G=0.5*(1-Math.sqrt(Math.pow(Cb,7)/(Math.pow(Cb,7)+Math.pow(25,7))));
    var A1=(1+G)*a1, A2=(1+G)*a2;
    var c1=Math.sqrt(A1*A1+b1*b1), c2=Math.sqrt(A2*A2+b2*b2);
    var h1=Math.atan2(b1,A1)*180/Math.PI; if(h1<0) h1+=360;
    var h2=Math.atan2(b2,A2)*180/Math.PI; if(h2<0) h2+=360;
    var dL=L2-L1, dC=c2-c1, dh=0;
    if(c1*c2!==0){ dh=h2-h1; if(dh>180) dh-=360; else if(dh<-180) dh+=360; }
    var dH=2*Math.sqrt(c1*c2)*Math.sin(dh*Math.PI/360);
    var Lb=(L1+L2)/2, cb=(c1+c2)/2, hb;
    if(c1*c2===0) hb=h1+h2;
    else { hb=(h1+h2)/2; if(Math.abs(h1-h2)>180) hb += (h1+h2<360)?180:-180; }
    var T=1-0.17*Math.cos((hb-30)*Math.PI/180)+0.24*Math.cos(2*hb*Math.PI/180)
          +0.32*Math.cos((3*hb+6)*Math.PI/180)-0.20*Math.cos((4*hb-63)*Math.PI/180);
    var SL=1+0.015*Math.pow(Lb-50,2)/Math.sqrt(20+Math.pow(Lb-50,2)),
        SC=1+0.045*cb, SH=1+0.015*cb*T;
    var RT=-2*Math.sqrt(Math.pow(cb,7)/(Math.pow(cb,7)+Math.pow(25,7)))
           *Math.sin(60*Math.exp(-Math.pow((hb-275)/25,2))*Math.PI/180);
    return Math.sqrt(Math.pow(dL/SL,2)+Math.pow(dC/SC,2)+Math.pow(dH/SH,2)
           +RT*(dC/SC)*(dH/SH));
  }

  /* dicromazie: Vienot-Brettel-Mollon su RGB lineare */
  var DIC = {
    protanopia  : [[0.11238,0.88762,0],[0.11238,0.88762,0],[0.00401,-0.00401,1]],
    deuteranopia: [[0.29275,0.70725,0],[0.29275,0.70725,0],[-0.02234,0.02234,1]],
    tritanopia  : [[1,0.14461,-0.14461],[0,1,0],[0,0.85924,0.14076]]
  };
  function applica(M,r){
    var o=[],i; for(i=0;i<3;i++) o.push(Math.min(1,Math.max(0,M[i][0]*r[0]+M[i][1]*r[1]+M[i][2]*r[2])));
    return o;
  }
  function viste(srgb){
    var l=[lin(srgb[0]),lin(srgb[1]),lin(srgb[2])], g=lumLin(l);
    var q=function(v){ return lab([gam(v[0]),gam(v[1]),gam(v[2])]); };
    return { nominale:lab(srgb), protanopia:q(applica(DIC.protanopia,l)),
             deuteranopia:q(applica(DIC.deuteranopia,l)),
             tritanopia:q(applica(DIC.tritanopia,l)), grigio:q([g,g,g]) };
  }
  function minDic(a,b){
    return Math.min(dE(a.protanopia,b.protanopia), dE(a.deuteranopia,b.deuteranopia),
                    dE(a.tritanopia,b.tritanopia));
  }

  /* ── 7 · dominio di un blocco in un tema ─────────────────── */
  var _dom = {};
  function dominio(blocco,tema){
    var k=blocco+'|'+tema; if(_dom[k]) return _dom[k];
    var S=SETTORE[blocco], H0=S[0], W=S[1], sup=SUP[tema], out=[], w,i,h,n;
    var Ycard=Y(daHex(sup.card)), Ypaper=Y(daHex(sup.paper)), Ywash=Y(daHex(sup.wash)),
        Yon=Y(daHex(sup.on)), Yinv=Y(daHex(sup.onInv));
    for(w=0; w<FINESTRA[tema].length; w++){
      var La=Y2L(FINESTRA[tema][w][0]), Lb=Y2L(FINESTRA[tema][w][1]);
      n=Math.floor((Lb-La)/V.passo_L+1e-9);
      for(i=0;i<=n;i++){
        var y=L2Y(La+i*V.passo_L);
        for(h=0; h<=Math.floor(W/V.passo_tinta+1e-9); h++){
          var Hraw=H0+h*V.passo_tinta, c=colore(y,(Hraw+360)%360,V.croma_max), yy=c.Y;
          if(contrasto(yy,Ycard)<V.superficie) continue;
          if(contrasto(yy,Ypaper)<V.superficie) continue;
          if(contrasto(yy,Ywash)<V.superficie) continue;
          if(Math.max(contrasto(yy,Yon),contrasto(yy,Yinv))<V.testo) continue;
          /* la tinta MISURATA deve stare nel settore: e' il §2 verificato */
          var dentro=(function(Hm){ var d=((Hm-H0)%360+360)%360; return d<=W+1e-9; })(c.Hmis);
          if(!dentro) continue;
          out.push({ hex:c.hex, srgb:c.srgb, Y:yy, Hchiesto:(Hraw+360)%360,
                     H:c.Hmis, C:c.Cmis, v:viste(c.srgb) });
        }
      }
    }
    _dom[k]=out; return out;
  }

  /* ── 8 · inserimento a distanza massima ──────────────────── */
  var BLOCCHI = ['coalizione','opposizione','arabo','incerto'];
  var _pal = {};
  function palette(tema,capienza){
    var key=tema+'|'+capienza; if(_pal[key]) return _pal[key];
    var A={}, i, k, b;
    for(i=0;i<4;i++) A[BLOCCHI[i]]=[];
    var accV=viste(daHex(SUP[tema].acc)), saturi=[], perse=[];
    var Lmid=(function(){ var f=FINESTRA[tema]; return (Y2L(f[0][0])+Y2L(f[f.length-1][1]))/2; })();
    for(k=0;k<capienza;k++){
      for(i=0;i<4;i++){
        b=BLOCCHI[(k+i)%4];
        var D=dominio(b,tema), miei=A[b], j, x;
        var id=(ORDINE[b]||[])[k], pref=TINTA_STORICA[id];
        var base=[], c, ok, s, d, m;
        for(x=0;x<D.length;x++){
          c=D[x]; ok=true; s=1e9; d=1e9;
          if(dE(c.v.nominale,accV.nominale)<V.da_acc) continue;
          for(j=0;j<4;j++){ if(BLOCCHI[j]===b) continue;
            var soglia=(BLOCCHI[j]==='incerto'||b==='incerto')
              ? V.fra_blocchi_dic[tema].incerto : V.fra_blocchi_dic[tema].aula;
            var lista=A[BLOCCHI[j]];
            for(var z=0;z<lista.length;z++){
              if(dE(c.v.nominale,lista[z].v.nominale)<V.fra_blocchi){ ok=false; break; }
              if(minDic(c.v,lista[z].v)<soglia){ ok=false; break; }
            }
            if(!ok) break;
          }
          if(!ok) continue;
          for(j=0;j<miei.length;j++){
            if(minDic(c.v,miei[j].v)<V.dentro_dic[tema][b]){ ok=false; break; }
          }
          if(!ok) continue;
          for(j=0;j<miei.length;j++){ m=miei[j];
            s=Math.min(s,dE(c.v.nominale,m.v.nominale)); }
          if(!miei.length) s=1e6;
          base.push({ c:c, s:s, seme:!miei.length });
        }
        if(!base.length){ saturi.push(b+'@'+k+(id?' ('+id+')':'')); continue; }
        /* la tinta storica e' un vincolo: si prova a rispettarla, e se
           non c'e' nessun candidato dentro tolleranza si dichiara persa */
        var ammessi=base;
        if(pref!==undefined){
          var dentroTinta=base.filter(function(a){ return dTinta(a.c.H,pref)<=V.tolleranza_tinta; });
          if(dentroTinta.length) ammessi=dentroTinta;
          else {
            var vicino=base.slice().sort(function(p,q){ return dTinta(p.c.H,pref)-dTinta(q.c.H,pref); })[0];
            perse.push({ lista:id, chiesta:pref, ottenuta:+vicino.c.H.toFixed(1),
                         scarto:+dTinta(vicino.c.H,pref).toFixed(1) });
          }
        }
        var best=-1; for(x=0;x<ammessi.length;x++) if(ammessi[x].s>best) best=ammessi[x].s;
        var vicini=ammessi.filter(function(a){ return a.s>=best-V.tolleranza; });
        vicini.sort(function(p,q){
          if(p.seme){    /* capolista: centro della finestra, croma massimo */
            var lp=Math.abs(Y2L(p.c.Y)-Lmid), lq=Math.abs(Y2L(q.c.Y)-Lmid);
            if(Math.abs(lp-lq)>0.01) return lp-lq;
            return q.c.C-p.c.C;
          }
          if(pref!==undefined){
            var dp=dTinta(p.c.H,pref), dq=dTinta(q.c.H,pref);
            if(Math.abs(dp-dq)>0.05) return dp-dq;
          }
          return p.c.C-q.c.C;
        });
        A[b].push(vicini[0].c);
      }
    }
    _pal[key]={ blocchi:A, saturi:saturi, identita_perse:perse }; return _pal[key];
  }

  /* ── 9 · interfaccia pubblica ────────────────────────────── */
  /* ── oltre la saturazione la regola non tace, E IL COLORE NON È PIÙ --mute ──
     La versione consegnata restituiva il grigio di ripiego — #626D7E, che è --mute —
     senza avviso e senza errore. Cioè: la sera dell'8 settembre una lista in più
     nell'ago della bilancia avrebbe preso un grigio identico al testo attenuato, e
     nessuno se ne sarebbe accorto fino a guardare la pagina.
     DI QUELLA RIPARAZIONE PER GIORNI È STATA FATTA UNA METÀ SOLA, e questo commento
     affermava il contrario: diceva «il primo slot oltre la saturazione dà un colore
     distinto E avvisa», mentre il colore restituito era --mute ESATTO in tutti e due i
     temi. Il silenzio era riparato, il colore no. Misurato il 30 agosto 2026 nella prova
     di regia dell'8 settembre, e chiuso lo stesso giorno.
     ADESSO IL SUPPLEMENTARE È --ink2: #33435A in chiaro, #A3B3C8 in scuro.
     LA RAGIONE NON È IL CONTRASTO, che --mute ce l'aveva (5,24 e 5,10): è che --mute è il
     colore del TESTO SECONDARIO ATTENUATO, e la pagina lo usa altrove per dire «esclusa».
     Una lista dipinta così non si legge come «senza colore assegnato»: si legge come
     SPENTA, cioè disattivata, che è uno stato che quella lista non ha. --ink2 sta sulla
     stessa tinta — 257,5° contro 259,1° — ma più scuro e più presente, L 0,379 contro
     0,532, ed è l'inchiostro secondario NORMALE, quello dei nomi di lista nelle schede
     dell'house effect. Una pastiglia slate dice «la regola ha finito i colori», che è il
     messaggio onesto.
     I NUMERI, misurati contro tutte e ventuno le liste dell'anagrafica e non solo contro
     quelle del suo blocco: contrasto su --card 10,04 e 8,39 (contro un pavimento di 3);
     distanza minima da una lista qualunque 10,3 in chiaro — hadash_taal, che è araba,
     quindi in legenda non le sta accanto — e 10,7 in scuro (likud).
     SCARTATI CON LA LORO RAGIONE: il token --inc, che sta a ZERO dai token di blocco e a
     4,4 da amcha in scuro, e direbbe «questa lista è il blocco»; --acc, che sta a 6,0 da
     --coal e si leggerebbe come coalizione; --ink, che è l'inchiostro primario e la linea
     del 61, cioè la cosa più pesante del disegno.
     E LA DICROMAZIA NON LO TOCCA: --ink2 è quasi acromatico — croma 0,045 e 0,035 contro
     0,073-0,116 delle cinque liste dell'ago — quindi la separazione la portano croma e
     chiarezza, non una coppia di tinte che può collassare.
     Quello che il codice fa, per intero: il primo slot oltre la saturazione restituisce
     --ink2 e registra un avviso in _avvisi, leggibile con COLORE.avvisi() e preteso vuoto
     da test/suite/regola.js sull'anagrafica vera; dal secondo in poi fallisce con un
     errore esplicito che nomina il blocco e rimanda al §9. */
  var _avvisi=[];
  function avvisi(){ return _avvisi.slice(); }
  function azzeraAvvisi(){ _avvisi=[]; }
  function di(blocco,slot,tema){
    tema=tema||'chiaro';
    var p=palette(tema,Math.max(7,slot+1)).blocchi[blocco];
    if(p&&p[slot]) return p[slot].hex;
    var sat=capienza()[tema][blocco].saturazione;
    if(slot===sat){
      _avvisi.push('blocco '+blocco+' saturo a '+sat+' in tema '+tema+
        ': lo slot '+slot+' esce dal dominio. Vedi docs/regola-colore.md §9.');
      return tema==='scuro'?'#A3B3C8':'#33435A';   /* --ink2, non --mute: vedi sopra */
    }
    throw new Error('colore-liste: '+blocco+' è saturo a '+sat+' slot in tema '+tema+
      ', chiesto lo slot '+slot+'. Oltre il primo supplementare non c\'è un colore da dare: '+
      'si scende la scala di ripiego di docs/regola-colore.md §9, un parametro per volta.');
  }
  function diLista(id,tema){
    var b,i;
    for(b in ORDINE){ i=ORDINE[b].indexOf(id); if(i>=0) return di(b,i,tema); }
    return null;
  }
  var _tok={};
  function tokenBlocco(tema){
    if(_tok[tema]) return _tok[tema];
    var C={}, i, b, sel={}, sup=SUP[tema];
    var Ycard=Y(daHex(sup.card)), Ypaper=Y(daHex(sup.paper)), Ywash=Y(daHex(sup.wash)),
        Yon=Y(daHex(sup.on)), Yinv=Y(daHex(sup.onInv));
    for(i=0;i<4;i++){
      b=BLOCCHI[i]; var S=SETTORE[b], Hc=S[0]+S[1]/2, o=[], w, j, dh;
      for(w=0;w<FINESTRA[tema].length;w++){
        var La=Y2L(FINESTRA[tema][w][0]), Lb=Y2L(FINESTRA[tema][w][1]),
            n=Math.floor((Lb-La)/1.0+1e-9);
        for(j=0;j<=n;j++){
          var y=L2Y(La+j*1.0), off=[-9,-6,-3,0,3,6,9];
          for(dh=0;dh<off.length;dh++){
            var c=colore(y,(Hc+off[dh]+360)%360,0.24), yy=c.Y;
            if(contrasto(yy,Ycard)<V.superficie||contrasto(yy,Ypaper)<V.superficie
               ||contrasto(yy,Ywash)<V.superficie) continue;
            if(Math.max(contrasto(yy,Yon),contrasto(yy,Yinv))<V.testo) continue;
            if(((c.Hmis-S[0])%360+360)%360 > S[1]+1e-9) continue;
            o.push({ hex:c.hex, srgb:c.srgb, C:c.Cmis, H:c.Hmis, Y:yy, v:viste(c.srgb) });
          }
        }
      }
      C[b]=o; sel[b]=o[Math.floor(o.length/2)];
    }
    var viste5=['nominale','protanopia','deuteranopia','tritanopia','grigio'];
    var punteggio=function(S){
      var m=1e9,a,z,v; for(a=0;a<4;a++) for(z=a+1;z<4;z++) for(v=0;v<5;v++)
        m=Math.min(m,dE(S[BLOCCHI[a]].v[viste5[v]],S[BLOCCHI[z]].v[viste5[v]]));
      return m; };
    var cur=punteggio(sel), mosso=true, giri=0;
    while(mosso&&giri++<15){ mosso=false;
      for(i=0;i<4;i++){ b=BLOCCHI[i]; var meglio=sel[b], val=cur, x;
        for(x=0;x<C[b].length;x++){
          var S2={}, z; for(z=0;z<4;z++) S2[BLOCCHI[z]]=sel[BLOCCHI[z]];
          S2[b]=C[b][x]; var v2=punteggio(S2);
          if(v2>val+1e-9){ val=v2; meglio=C[b][x]; }
        }
        if(meglio!==sel[b]){ sel[b]=meglio; cur=val; mosso=true; }
      }
    }
    _tok[tema]={ sel:sel, minimo:cur }; return _tok[tema];
  }
  function token(blocco,tema){ return tokenBlocco(tema||'chiaro').sel[blocco].hex; }

  function testoSopra(hexColore,tema){
    var y=Y(daHex(hexColore)), sup=SUP[tema||'chiaro'];
    return contrasto(y,Y(daHex(sup.on)))>=contrasto(y,Y(daHex(sup.onInv)))
      ? '--on-color' : '--on-color-inv';
  }

  /* misura: distanze garantite, archi reali, identita' perse */
  function misura(){
    var R={}, temi=['chiaro','scuro'], t, i, b, N;
    for(t=0;t<2;t++){
      var tema=temi[t]; R[tema]={ blocchi:{}, archi:{} };
      var P=palette(tema,7);
      for(i=0;i<4;i++){
        b=BLOCCHI[i]; var S=P.blocchi[b], o={};
        for(N=2;N<=7;N++){
          var mn=1e9, md=1e9, x, y2;
          for(x=0;x<Math.min(N,S.length);x++) for(y2=x+1;y2<Math.min(N,S.length);y2++){
            mn=Math.min(mn,dE(S[x].v.nominale,S[y2].v.nominale));
            md=Math.min(md,minDic(S[x].v,S[y2].v));
          }
          o[N]={ nominale:+mn.toFixed(1), dicromate:+md.toFixed(1) };
        }
        R[tema].blocchi[b]=o;
        /* arco reale: tinte misurate, minima e massima */
        var hs=S.map(function(c){ return ((c.H-SETTORE[b][0])%360+360)%360; });
        R[tema].archi[b]=[ +(((Math.min.apply(null,hs)+SETTORE[b][0])%360)).toFixed(1),
                           +(((Math.max.apply(null,hs)+SETTORE[b][0])%360)).toFixed(1) ];
      }
      R[tema].saturi=P.saturi;
      R[tema].identita_perse=P.identita_perse;
    }
    return R;
  }

  /* capienza: quanti slot la regola riesce a riempire, per blocco e
     tema, e quanti restano liberi oltre le liste in anagrafica. E' il
     numero da guardare l'8 settembre, prima del deposito.            */
  /* ── la capienza VERA, e perché la consegna la dichiarava sbagliata ──
     La versione consegnata chiamava palette(tema, 7) e riportava «liberi» come
     riempiti − in_anagrafica. Ma 7 è il TETTO CHIESTO, non la saturazione: un blocco
     che riempie sette slot su sette risulta «pieno» anche quando ne reggerebbe dodici.
     Misurato: l'opposizione in chiaro arriva a 12 e oltre, la coalizione a 10, mentre
     l'ago della bilancia si ferma davvero a 4 e le liste arabe a 5. Il §9 della consegna
     dichiarava «opposizione zero slot liberi» ed era un artefatto del tetto.
     Qui si cresce il tetto finché il blocco smette di riempirsi: quello è il numero che
     serve la sera dell'8 settembre, ed è l'unico che risponde alla domanda «ci sta?». */
  var TETTO_RICERCA=16;
  var _cap=null;
  function capienza(){
    if(_cap) return _cap;
    var R={}, temi=['chiaro','scuro'], t, i, b;
    for(t=0;t<2;t++){
      var tema=temi[t]; R[tema]={};
      for(i=0;i<4;i++){ b=BLOCCHI[i];
        var sat=0, n;
        for(n=1;n<=TETTO_RICERCA;n++){
          var quanti=palette(tema,n).blocchi[b].length;
          if(quanti<n){ sat=quanti; break; }
          sat=quanti;
        }
        R[tema][b]={ saturazione:sat, in_anagrafica:ORDINE[b].length,
                     liberi:sat-ORDINE[b].length,
                     oltre:sat>=TETTO_RICERCA?'non satura entro '+TETTO_RICERCA:null };
      }
    }
    /* Il rimedio si deve trovare dal punto in cui la regola fallisce, non cercandolo:
       chi legge questo oggetto la sera del deposito ha poco tempo e nessuna memoria. */
    R.ripiego='Se «liberi» è 0 per il blocco che serve: docs/regola-colore.md §9. '+
      'Prima mossa: abbassare VINCOLI.dentro_dic di quel blocco di 0,6 — costa '+
      'distinguibilità per un dicromate dentro quel blocco, e solo lì.';
    _cap=R; return R;
  }

  return { di:di, diLista:diLista, token:token, testoSopra:testoSopra,
           misura:misura, capienza:capienza, palette:palette, tokenBlocco:tokenBlocco,
           dominio:dominio, dE:dE, viste:viste, minDic:minDic,
           contrasto:contrasto, Y:Y, daHex:daHex, misuraColore:misuraColore,
           SETTORE:SETTORE, FINESTRA:FINESTRA, VINCOLI:V,
           ORDINE:ORDINE, TINTA_ASSEGNATA:TINTA_ASSEGNATA,
           TINTA_STORICA:TINTA_STORICA, SUPERFICI:SUP,
           BLOCCHI:BLOCCHI, avvisi:avvisi, azzeraAvvisi:azzeraAvvisi };
})();
if (typeof module !== 'undefined') module.exports = COLORE;
