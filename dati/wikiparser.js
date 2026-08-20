/* ══════════ PARSER DELLA TABELLA WIKIPEDIA ══════════
   Scarica la pagina via REST API (CORS aperto), espande la griglia tenendo conto
   di rowspan e colspan, ricava i nomi delle liste dalle intestazioni e valida ogni
   riga su due vincoli: somma 120 e totale del blocco di governo. */
var WIKI_PAGE='Opinion_polling_for_the_2026_Israeli_legislative_election';
var WIKI_URL='https://en.wikipedia.org/api/rest_v1/page/html/'+WIKI_PAGE;

var W_LISTA={
 'likud':'likud','together':'byachad','yesh atid':'yesh_atid','bennett 2026':'bennett26',
 'rzp':'sionismo_rel','religious zionism':'sionismo_rel','mafdal-rz':'sionismo_rel','mafdal- rz':'sionismo_rel',
 'otzma':'otzma','otzma yehudit':'otzma','blue & white':'blue_white','blue and white':'blue_white',
 'shas':'shas','utj':'utj','united torah judaism':'utj',
 'yisrael beiteinu':'beitenu','yisrael beitenu':'beitenu',
 "ra'am":'raam',"hadash -ta'al":'hadash_taal',"hadash-ta'al":'hadash_taal',"hadash ta'al":'hadash_taal',
 'balad':'balad','joint list':'lista_araba',
 'dems':'democratici','democrats':'democratici','the democrats':'democratici',
 'yashar':'yashar','zionist home':'casa_sionista','reserv.':'casa_sionista','reservists':'casa_sionista',
 'unity':'unity_erdan'
};
var W_IST={'filber':'Direct Polls','direct':'Direct Polls','lazar':'Lazar · Panel4All','midgam':'Midgam',
 'hamidgam':'Hamidgam Project','maagar':'Maagar Mochot','kantar':'Kantar','yossi':'Yossi Taktika',
 'camil':'Camil Fuchs','panels':'Panels Politics','trendzone':'TrendZone','stat':'Stat-Net'};
var W_TEST={'hahadashot 12':'Canale 12','channel 13':'Canale 13','channel 14':'Canale 14',
 'channel 16':'Canale 16','i24 news':'i24NEWS','kan 11':'Kan 11','israel hayom':'Israel Hayom',
 'zman yisrael':'Zman Israel','zman israel':'Zman Israel','maariv':'Maariv','walla':'Walla',
 'the times of israel':'Times of Israel','the jerusalem post':'Jerusalem Post','arutz sheva':'Arutz Sheva'};
var W_MESI={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};

function wClean(s){
 return String(s||'').replace(/\[[^\]]*\]/g,'')       /* note e riferimenti */
  .replace(/[\u200e\u200f\u00a0]/g,' ')
  .replace(/\s+/g,' ').trim();
}
function wKey(s){return wClean(s).toLowerCase().replace(/[–—]/g,'-').replace(/\s*-\s*/g,'-').trim();}
/* nelle righe-evento la data è un prefisso: "17 Aug — Likud conducts a primary…" */
function wDataPrefisso(txt,anno){
 var m=wClean(txt).replace(/[–—]/g,'-').match(/^\s*(\d{1,2})(?:\s*-\s*(\d{1,2}))?\s+([A-Za-z]{3})/);
 if(!m) return null;
 var mm=W_MESI[m[3].toLowerCase()]; if(!mm) return null;
 var dd=+(m[2]||m[1]);
 if(!(dd>=1&&dd<=31)) return null;
 return anno+'-'+(mm<10?'0':'')+mm+'-'+(dd<10?'0':'')+dd;
}
function wData(txt,anno){
 var t=wClean(txt).replace(/[–—]/g,'-');
 var mesi=t.match(/([A-Za-z]{3})[a-z]*/g)||[];
 var gio=t.match(/\d{1,2}/g)||[];
 if(!mesi.length||!gio.length) return null;
 var mm=W_MESI[mesi[mesi.length-1].toLowerCase().slice(0,3)];
 if(!mm) return null;
 var dd=+gio[gio.length-1];
 if(!(dd>=1&&dd<=31)) return null;
 return anno+'-'+(mm<10?'0':'')+mm+'-'+(dd<10?'0':'')+dd;
}
/* espande la tabella in una griglia rettangolare, risolvendo rowspan e colspan */
function wGriglia(tab){
 var righe=tab.rows,g=[],r,i,c,dr,dc;
 for(r=0;r<righe.length;r++){
  g[r]=g[r]||[]; c=0;
  for(i=0;i<righe[r].cells.length;i++){
   while(g[r][c]!==undefined) c++;
   var cel=righe[r].cells[i],cs=cel.colSpan||1,rs=cel.rowSpan||1;
   for(dr=0;dr<rs;dr++){
    g[r+dr]=g[r+dr]||[];
    for(dc=0;dc<cs;dc++)
     g[r+dr][c+dc]={t:wClean(cel.textContent),h:cel.tagName==='TH',o:cel,orig:dr===0};
   }
   c+=cs;
  }
 }
 return g;
}
function parseWikiTabella(tab,anno,out){
 var loc={ok:[],ko:[],ignote:[],eventi:[]};
 var g=wGriglia(tab);
 if(!g.length) return;
 /* le prime righe interamente di intestazione definiscono le colonne;
    per ogni colonna vale l'etichetta più profonda non vuota */
 var lab=[],nHead=0,r,c;
 for(r=0;r<g.length;r++){
  var soloTh=g[r].length&&g[r].every(function(x){return !x||x.h;});
  if(!soloTh) break;
  nHead++;
  for(c=0;c<g[r].length;c++) if(g[r][c]&&g[r][c].t) lab[c]=g[r][c].t;
 }
 if(!nHead) return;
 var key=lab.map(wKey);
 var iData=key.findIndex(function(k){return /fieldwork|^date$/.test(k);});
 var iIst =key.findIndex(function(k){return /polling firm/.test(k);});
 var iPub =key.findIndex(function(k){return /publisher/.test(k);});
 var iCamp=key.findIndex(function(k){return /sample/.test(k);});
 var iGov =key.findIndex(function(k){return /^gov/.test(k);});
 if(iData<0||iIst<0) return null;                  /* non è una tabella di intenzioni di voto */
 var liste={},ignote=[];
 key.forEach(function(k,ix){
  if(ix===iData||ix===iIst||ix===iPub||ix===iCamp||ix===iGov) return;
  if(/^(opp|lead|others|gov)/.test(k)||!k) return;
  if(W_LISTA[k]) liste[ix]=W_LISTA[k];
  else ignote.push(lab[ix]);
 });
 loc.ignote=ignote;
 /* Serve una massa critica di liste riconosciute: sotto questa soglia la tabella
    è quasi certamente di altro tipo (percentuali grezze, sondaggi tematici, scenari
    con partiti di fantasia) e non va nemmeno tentata. */
 if(Object.keys(liste).length<6) return null;

 for(r=nHead;r<g.length;r++){
  var row=g[r]; if(!row) continue;
  var cel=row[iData];
  /* riga-evento: una sola cella che copre tutta la larghezza */
  var distinte=[],seen=[];
  row.forEach(function(x){if(x&&seen.indexOf(x.o)<0){seen.push(x.o);distinte.push(x);}});
  if(distinte.length<=2&&distinte.length){
   var d,testo;
   if(distinte.length===2){                       /* data in una cella, testo nell'altra */
    d=wDataPrefisso(distinte[0].t,anno)||wData(distinte[0].t,anno);
    testo=distinte[1].t;
   }else{                                          /* tutto in un'unica cella */
    d=wDataPrefisso(distinte[0].t,anno);
    testo=distinte[0].t.replace(/^\s*\d{1,2}(\s*[–—-]\s*\d{1,2})?\s+[A-Za-z]{3}[a-z]*\s*[:–—-]?\s*/,'');
   }
   if(d&&testo&&testo.length>12) loc.eventi.push({data:d,testo:testo});
   continue;
  }
  if(!cel) continue;
  /* riga di scenario: eredita la data dalla riga precedente (rowspan) */
  if(!cel.orig) continue;
  var data=wData(cel.t,anno); if(!data) continue;
  var ist=wClean(row[iIst]?row[iIst].t:''); if(!ist) continue;
  var pub=iPub>=0&&row[iPub]?wClean(row[iPub].t):'';
  var seggi={},sotto={},tot=0,ok=true;
  Object.keys(liste).forEach(function(ix){
   var x=row[ix]; if(!x) return;
   var v=wClean(x.t);
   if(!v||/n\/a|^[–—-]$/.test(v)) return;
   var mp=v.match(/^\(?\s*(\d+(?:[.,]\d+)?)\s*%\s*\)?$/);
   if(mp){sotto[liste[ix]]=parseFloat(mp[1].replace(',','.'));return;}
   var mi=v.match(/^(\d+)$/);
   if(mi){var n=+mi[1];seggi[liste[ix]]=(seggi[liste[ix]]||0)+n;tot+=n;}
   else ok=false;
  });
  var gov=null;
  if(iGov>=0&&row[iGov]){var mg=wClean(row[iGov].t).match(/^(\d+)$/); if(mg) gov=+mg[1];}
  var gcalc=0;
  ['likud','sionismo_rel','otzma','shas','utj'].forEach(function(k){gcalc+=seggi[k]||0;});
  var motivo=null;
  if(tot!==120) motivo='somma '+tot;
  else if(gov!==null&&gcalc!==gov) motivo='blocco governo '+gcalc+' invece di '+gov;
  else if(!ok) motivo='valore non numerico';
  if(motivo){loc.ko.push({data:data,istituto:ist,testata:pub,motivo:motivo});continue;}
  var nist=W_IST[wKey(ist).split(/[^a-z0-9]/)[0]]||wClean(ist);
  var npub=W_TEST[wKey(pub)]||wClean(pub);
  var o={data:data,istituto:nist,testata:npub,seggi:seggi};
  if(Object.keys(sotto).length) o.sotto=sotto;
  if(iCamp>=0&&row[iCamp]){var mc=wClean(row[iCamp].t).replace(/[.,]/g,'').match(/^(\d+)$/); if(mc) o.campione=+mc[1];}
  if(/direct|filber|channel 14|canale 14/i.test(nist+' '+npub)) o.casa=1;
  if(liste&&Object.keys(liste).map(function(i){return liste[i];}).indexOf('yesh_atid')>=0&&
     Object.keys(liste).map(function(i){return liste[i];}).indexOf('bennett26')>=0) o.pre=1;
  loc.ok.push(o);
 }
 return loc;
}
function parseWiki(html,anni){
 var doc=new DOMParser().parseFromString(html,'text/html');
 var out={sondaggi:[],eventi:[],scartate:[],ignote:[],ignorate:[]};
 var anno=null,escl=false;
 var nodi=doc.querySelectorAll('h2,h3,h4,table');
 for(var i=0;i<nodi.length;i++){
  var n=nodi[i];
  if(/^H[234]$/.test(n.tagName)){
   var t=wClean(n.textContent);
   var ma=t.match(/^(20\d\d)/); if(ma) anno=ma[1];
   if(/scenario|hypothetical|leadership|preferred|arab (society|public)|suitab/i.test(t)) escl=true;
   else if(ma||/voting intention|opinion poll/i.test(t)) escl=false;
   continue;
  }
  if(escl||!anno) continue;
  if(anni&&anni.indexOf(anno)<0) continue;
  if(!/wikitable/.test(n.className||'')) continue;
  var loc=null;
  try{loc=parseWikiTabella(n,anno,out);}catch(e){loc=null;}
  if(!loc) continue;
  var tot=loc.ok.length+loc.ko.length;
  /* Una tabella si accetta solo se la maggioranza delle sue righe supera la
     validazione. Se quasi tutte falliscono non sono righe sbagliate: è la tabella
     a non essere di seggi, e segnalarle una per una sarebbe solo rumore. */
  if(!loc.ok.length||loc.ok.length/tot<0.5){
   out.ignorate.push({righe:tot,ignote:loc.ignote.slice(0,4)});
   continue;
  }
  loc.ok.forEach(function(x){out.sondaggi.push(x);});
  loc.ko.forEach(function(x){out.scartate.push(x);});
  loc.eventi.forEach(function(x){out.eventi.push(x);});
  loc.ignote.forEach(function(x){if(out.ignote.indexOf(x)<0) out.ignote.push(x);});
 }
 return out;
}
