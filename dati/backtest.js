/* BANCO DI PROVA — riusa le funzioni reali del modello (dhondt, invD) estratte da app.js
   e ne replica la pipeline: quote per sondaggio → media pesata → riparto → Monte Carlo. */
const fs=require('fs'), app=fs.readFileSync('app.js','utf8');
const SOGLIA=3.25, DISP=8;
/* estrazione letterale delle due funzioni dal modello in produzione */
function estrai(nome){
  const i=app.indexOf('function '+nome+'(');
  let d=0,j=app.indexOf('{',i);
  for(let k=j;k<app.length;k++){ if(app[k]==='{')d++; else if(app[k]==='}'){d--; if(!d){j=k;break;}} }
  return app.slice(i,j+1);
}
eval(estrai('dhondt')); eval(estrai('invD'));
const gg=(a,b)=>Math.round((b-a)/864e5);
let _g=null;
function gauss(){ if(_g!==null){const v=_g;_g=null;return v;}
  let u=0,w=0; while(!u)u=Math.random(); while(!w)w=Math.random();
  const r=Math.sqrt(-2*Math.log(u)); _g=r*Math.sin(2*Math.PI*w); return r*Math.cos(2*Math.PI*w); }

function pesoDi(p,rif,quanti){
  let w=Math.pow(2,-gg(new Date(p.d),rif)/7);
  w*=Math.max(0.75,Math.min(1.6,Math.sqrt((p.n||500)/500)));
  w*=1/(1+0.5*(quanti||0));
  if(p.casa) w*=0.5;
  return w;
}
let ACC=false;
function proietta(caso, SIM=20000, acc=false){ ACC=acc;
  const P=caso.polls, rif=new Date(P[0].d);
  /* 1 · quote per sondaggio */
  const noti={}, per=P.map(p=>{
    const sotto=p.o||{}; let ws=0; for(const k in sotto) ws+=sotto[k];
    const q=100-Math.max(ws,DISP);
    const sh=Object.assign({},invD(p.s,sotto,q),sotto);
    for(const k in sh){ (noti[k]=noti[k]||[]).push(sh[k]); }
    return {p,sh};
  });
  /* 2 · imputazione */
  const tutte=Object.keys(noti), mn={};
  tutte.forEach(i=>mn[i]=noti[i].reduce((a,b)=>a+b,0)/noti[i].length);
  per.forEach(x=>tutte.forEach(i=>{ if(x.sh[i]===undefined) x.sh[i]=Math.min(3.0,mn[i]*0.75); }));
  /* 3 · media pesata */
  const visti={}; let W=0; const avg={}; tutte.forEach(i=>avg[i]=0);
  per.forEach(x=>{ const k=x.p.i; const w=pesoDi(x.p,rif,visti[k]||0); visti[k]=(visti[k]||0)+1;
    x.w=w; W+=w; tutte.forEach(i=>avg[i]+=x.sh[i]*w); });
  tutte.forEach(i=>avg[i]/=W);
  /* 4 · normalizzazione e riparto */
  const QUO={}; let T=0;
  for(const k in avg) if(avg[k]>0.05){ QUO[k]=avg[k]; T+=avg[k]; }
  for(const k in QUO) QUO[k]*=99/T;
  const SEG=dhondt(QUO);
  /* 5 · Monte Carlo, stessi parametri del modello */
  const ids=Object.keys(QUO), bl=new Set(caso.blocco);
  /* stesse coppie del modello, mappate sui nomi delle liste storiche */
  const PAIR = ACC ? [["ya","nu",-0.45],["likud","rzp",-0.26],["likud","otzma",-0.26],
                      ["likud","rz",-0.20],["shas","utj",0.18],["bw","ya",-0.45]] : [];
  const CP=[], IDIO={}; ids.forEach(k=>IDIO[k]=1);
  const qv={}; ids.forEach(k=>qv[k]=0);
  PAIR.forEach(([a,b,r])=>{ if(ids.indexOf(a)<0||ids.indexOf(b)<0) return;
    const ar=Math.abs(r), tau=Math.sqrt(ar/(1-ar));
    CP.push({a,b,tau,seg:r<0?-1:1}); qv[a]+=tau*tau; qv[b]+=tau*tau; });
  ids.forEach(k=>IDIO[k]=Math.sqrt(Math.max(0.15,1-qv[k])));
  const g=caso.giorni;
  const sg=0.065+0.085*Math.min(1,g/150), sb=0.050+0.055*Math.min(1,g/150);
  const dist={}, blocDist=[]; ids.forEach(k=>dist[k]=[]);
  for(let s=0;s<SIM;s++){
    const sw=gauss()*sb; const sim={}; let tot=0;
    const eps={}; ids.forEach(k=>eps[k]=gauss()*IDIO[k]);
    CP.forEach(c=>{const t=gauss()*c.tau; eps[c.a]+=t; eps[c.b]+=c.seg*t;});
    ids.forEach(k=>{ const dir=bl.has(k)?1:-1;
      const f=1+Math.max(0,(6-QUO[k])/6);
      sim[k]=QUO[k]*Math.exp(eps[k]*sg*f+dir*sw); tot+=sim[k]; });
    ids.forEach(k=>sim[k]*=99/tot);
    const seg=dhondt(sim); let b=0;
    ids.forEach(k=>{ const v=seg[k]||0; dist[k].push(v); if(bl.has(k)) b+=v; });
    blocDist.push(b);
  }
  blocDist.sort((a,b)=>a-b); ids.forEach(k=>dist[k].sort((a,b)=>a-b));
  return {SEG, blocDist, dist, QUO};
}
/* Swing: sposta punti di quota dal blocco di opposizione a quello di governo,
   con la stessa formula del modello. */
function applicaSwing(q, s, blocco, oppo){
  let a=0,b=0;
  for(const k in q){ if(blocco.has(k)) a+=q[k]; else if(oppo.has(k)) b+=q[k]; }
  if(a<=0||b<=0) return Object.assign({},q);
  const s2=Math.max(-a+0.5,Math.min(b-0.5,s)), o={};
  for(const k in q){
    if(blocco.has(k)) o[k]=q[k]*(1+s2/a);
    else if(oppo.has(k)) o[k]=q[k]*(1-s2/b);
    else o[k]=q[k];
  }
  return o;
}
module.exports={proietta, dhondt, invD, applicaSwing};
