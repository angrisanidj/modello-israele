const {proietta}=require('./backtest.js'), S=require('./storico.js');
const q=(a,p)=>a[Math.floor(p*a.length)];
const NOMI={likud:"Likud",bw:"Blu e Bianco",jl:"Lista Unita",emet:"Emet",shas:"Shas",yb:"Yisrael Beitenu",
 utj:"Giud. Torah",yamina:"Yamina",ya:"Yesh Atid",meretz:"Meretz",raam:"Ra'am",nh:"Nuova Speranza",
 labor:"Labor",rz:"Sionismo Rel.",rzp:"Sionismo Rel.",nu:"Unità Naz.",ht:"Hadash-Ta'al",
 lg:"Labor-Gesher",du:"Unione Dem.",nr:"Nuova Destra",ujh:"Casa Ebraica",otzma:"Otzma",jh:"Casa Ebraica",balad:"Balad",nep:"NEP"};
let rigaBloc=[];
for(const [k,v] of Object.entries(S)){
  const r=proietta(v,30000);
  const blocReale=(v.blocco_reale||v.blocco);
  const br=blocReale.reduce((a,x)=>a+(v.reale[x]||0),0);
  const bp=v.blocco.reduce((a,x)=>a+(r.SEG[x]||0),0);
  // media grezza dei seggi dei sondaggi, per confronto
  const grezza={}; v.polls.forEach(p=>{for(const kk in p.s) grezza[kk]=(grezza[kk]||0)+p.s[kk];});
  for(const kk in grezza) grezza[kk]/=v.polls.length;
  const bg=v.blocco.reduce((a,x)=>a+(grezza[x]||0),0);
  const lo=q(r.blocDist,.10), hi=q(r.blocDist,.90);
  console.log("\n══════ "+k+" ══════"+(v.note?"\n  ("+v.note+")":""));
  console.log("  BLOCCO NETANYAHU   media grezza "+bg.toFixed(1)+"   modello "+bp+
    "   reale "+br+"   → errore modello "+((br-bp)>=0?"+":"")+(br-bp)+
    " · errore media grezza "+((br-bg)>=0?"+":"")+(br-bg).toFixed(1));
  console.log("  intervallo 80% del modello: "+lo+"–"+hi+
    "   il reale "+(br>=lo&&br<=hi?"CADE DENTRO":"cade FUORI"));
  const tutte=[...new Set([...Object.keys(v.reale),...Object.keys(r.SEG)])]
    .sort((a,b)=>(v.reale[b]||0)-(v.reale[a]||0));
  console.log("  lista            modello  reale  err   grezza  err   80% modello");
  let em=0,eg=0,n=0,dentro=0;
  tutte.forEach(p=>{
    const m=r.SEG[p]||0, re=v.reale[p]||0, gr=grezza[p]||0;
    if(!m&&!re) return;
    const d=r.dist[p]||[0], l=q(d,.10), h=q(d,.90);
    em+=Math.abs(re-m); eg+=Math.abs(re-gr); n++;
    if(re>=l&&re<=h) dentro++;
    console.log("  "+(NOMI[p]||p).padEnd(16)+String(m).padStart(5)+String(re).padStart(7)+
      String(re-m>=0?"+"+(re-m):re-m).padStart(5)+gr.toFixed(1).padStart(8)+
      (re-gr>=0?"+"+(re-gr).toFixed(1):(re-gr).toFixed(1)).padStart(6)+("   "+l+"–"+h).padStart(12));
  });
  console.log("  errore medio per lista: modello "+(em/n).toFixed(2)+"  ·  media grezza "+(eg/n).toFixed(2));
  console.log("  liste il cui risultato cade nell'intervallo 80%: "+dentro+" su "+n);
  rigaBloc.push({k,bp,bg,br,lo,hi,em:em/n,eg:eg/n,dentro,n});
}
console.log("\n\n═══════════ SINTESI ═══════════");
console.log("  caso                              blocco    errore    errore     err/lista   err/lista");
console.log("                                    modello   modello   grezza     modello     grezza");
rigaBloc.forEach(r=>console.log("  "+r.k.padEnd(34)+String(r.bp).padStart(5)+
  String(r.br-r.bp>=0?"+"+(r.br-r.bp):r.br-r.bp).padStart(10)+
  (r.br-r.bg>=0?"+"+(r.br-r.bg).toFixed(1):(r.br-r.bg).toFixed(1)).padStart(10)+
  r.em.toFixed(2).padStart(12)+r.eg.toFixed(2).padStart(12)));
const fin=rigaBloc.filter(r=>/finale/.test(r.k));
console.log("\n  Sui tre casi FINALI:");
console.log("   errore medio sul blocco   modello "+(fin.reduce((a,r)=>a+(r.br-r.bp),0)/fin.length).toFixed(2)+
  "  ·  media grezza "+(fin.reduce((a,r)=>a+(r.br-r.bg),0)/fin.length).toFixed(2));
console.log("   errore medio per lista    modello "+(fin.reduce((a,r)=>a+r.em,0)/fin.length).toFixed(2)+
  "  ·  media grezza "+(fin.reduce((a,r)=>a+r.eg,0)/fin.length).toFixed(2));
console.log("   copertura dell'intervallo 80%: "+fin.reduce((a,r)=>a+r.dentro,0)+" liste su "+
  fin.reduce((a,r)=>a+r.n,0)+" ("+(100*fin.reduce((a,r)=>a+r.dentro,0)/fin.reduce((a,r)=>a+r.n,0)).toFixed(0)+"%, atteso 80%)");
