/* Sondaggi storici trascritti dalle tabelle Wikipedia, verificati: somma 120
   e totale di blocco coincidente con quello pubblicato. */
module.exports = {

"2020 · finale (26-28 feb 2020)": {
 giorni: 3,
 blocco: ["likud","shas","utj","yamina"],
 reale: {likud:36, bw:33, jl:15, emet:7, shas:9, yb:7, utj:7, yamina:6},
 sotto_reale: {otzma:0.42},
 polls:[
  {d:"2020-02-28", i:"Smith",        n:null, s:{bw:34,likud:35,jl:14,emet:8,shas:9,yb:6,utj:7,yamina:7}},
  {d:"2020-02-28", i:"Hamidgam",     n:null, s:{bw:33,likud:33,jl:15,emet:9,shas:8,yb:7,utj:7,yamina:8}, o:{otzma:1.8}},
  {d:"2020-02-28", i:"Midgam",       n:null, s:{bw:33,likud:35,jl:14,emet:9,shas:8,yb:6,utj:8,yamina:7}, o:{otzma:1.5}},
  {d:"2020-02-27", i:"Panels",       n:null, s:{bw:34,likud:34,jl:13,emet:9,shas:9,yb:7,utj:7,yamina:7}, o:{otzma:2.1}},
  {d:"2020-02-27", i:"Maagar",       n:null, s:{bw:33,likud:33,jl:14,emet:9,shas:8,yb:7,utj:7,yamina:9}, o:{otzma:2.0}},
  {d:"2020-02-27", i:"Kantar",       n:null, s:{bw:34,likud:35,jl:14,emet:8,shas:8,yb:6,utj:8,yamina:7}, o:{otzma:1.6}},
  {d:"2020-02-26", i:"Direct Polls", n:null, casa:1, s:{bw:33,likud:35,jl:13,emet:9,shas:9,yb:6,utj:8,yamina:7}, o:{otzma:0.96}}
 ]},

"2020 · due mesi (29 dic - 2 gen)": {
 giorni: 62,
 blocco: ["likud","shas","utj","nr","nu","ujh"],
 blocco_reale: ["likud","shas","utj","yamina"],
 reale: {likud:36, bw:33, jl:15, emet:7, shas:9, yb:7, utj:7, yamina:6},
 note: "le liste si fondono dopo: NR+NU+UJH→Yamina il 15 gen, LG+Meretz→Emet il 13 gen",
 polls:[
  {d:"2020-01-02", i:"Kantar",   s:{bw:35,likud:33,jl:13,shas:7,yb:7,utj:8,lg:6,du:5,nr:6}, o:{nu:3.0}},
  {d:"2020-01-02", i:"Midgam",   s:{bw:35,likud:33,jl:13,shas:8,yb:8,utj:8,lg:5,du:4,nr:6}, o:{nu:0.9,ujh:2.6}},
  {d:"2020-01-02", i:"Hamidgam", s:{bw:36,likud:34,jl:13,shas:7,yb:6,utj:7,lg:5,du:4,nr:8}, o:{nu:2.9}},
  {d:"2020-01-01", i:"Panels",   s:{bw:36,likud:30,jl:13,shas:8,yb:8,utj:7,lg:5,nr:6,nu:7}, o:{du:2.9}},
  {d:"2019-12-29", i:"Midgam",   s:{bw:34,likud:32,jl:13,shas:8,yb:8,utj:7,lg:5,du:4,nr:5,nu:4}}
 ]},

"2021 · due mesi (21-28 gen 2021)": {
 giorni: 58,
 blocco: ["likud","shas","utj","rz"],
 blocco_reale: ["likud","shas","utj","rz"],
 reale: {likud:30, ya:17, bw:8, jl:6, shas:9, utj:7, yb:7, meretz:6, raam:4, yamina:7, nh:6, labor:7, rz:6},
 note: "Sionismo Religioso si stacca da Yamina il 20 gen e si fonde con Otzma+Noam il 3 feb; Ra'am esce dalla Lista Unita il 28 gen",
 polls:[
  {d:"2021-01-28", i:"Maagar",      s:{likud:28,ya:15,jl:11,bw:5,shas:9,utj:7,yb:6,yamina:11,meretz:6,labor:5,nh:13,nep:4}, o:{rz:2.0,jh:1.2}},
  {d:"2021-01-28", i:"Panels",      s:{likud:30,ya:18,jl:10,bw:4,shas:8,utj:8,yb:7,yamina:12,meretz:5,labor:4,nh:14}, o:{rz:2.8,oy:1.9}},
  {d:"2021-01-26", i:"Midgam",      s:{likud:29,ya:16,jl:10,bw:4,shas:8,utj:8,yb:7,yamina:14,meretz:5,labor:4,nh:15}, o:{rz:2.2,oy:2.1}},
  {d:"2021-01-24", i:"Panels",      s:{likud:31,ya:16,jl:10,bw:4,shas:7,utj:7,yb:7,yamina:11,meretz:5,nh:14,rz:4,israelis:4}, o:{labor:2.4,oy:1.8}},
  {d:"2021-01-24", i:"Camil Fuchs", s:{likud:32,ya:18,jl:10,bw:4,shas:6,utj:7,yb:6,yamina:10,meretz:5,labor:4,nh:14,israelis:4}, o:{rz:2.6}},
  {d:"2021-01-21", i:"Panels",      s:{likud:31,ya:16,jl:10,bw:4,shas:8,utj:8,yb:7,yamina:11,meretz:5,nh:16,israelis:4}, o:{labor:0.7,rz:2.0}}
 ]},

"2021 · finale (17-19 mar 2021)": {
 giorni: 4,
 blocco: ["likud","shas","utj","rz"],
 reale: {likud:30, ya:17, bw:8, jl:6, shas:9, utj:7, yb:7, meretz:6, raam:4, yamina:7, nh:6, labor:7, rz:6},
 polls:[
  {d:"2021-03-19", i:"Camil Fuchs", s:{likud:30,ya:18,bw:4,jl:8,shas:8,utj:7,yb:6,meretz:4,raam:4,yamina:10,nh:10,labor:6,rz:5}, o:{nep:2.1}},
  {d:"2021-03-19", i:"Midgam",      s:{likud:32,ya:18,bw:4,jl:8,shas:8,utj:7,yb:7,meretz:4,raam:4,yamina:9,nh:9,labor:6,rz:4}, o:{nep:1.3}},
  {d:"2021-03-18", i:"Panels",      s:{likud:30,ya:19,bw:5,jl:8,shas:8,utj:6,yb:8,meretz:4,raam:4,yamina:10,nh:8,labor:5,rz:5}},
  {d:"2021-03-18", i:"Direct Polls",casa:1, s:{likud:32,ya:17,bw:7,jl:7,shas:9,utj:7,yb:9,meretz:4,raam:4,yamina:8,nh:7,labor:4,rz:5}, o:{nep:1.3}},
  {d:"2021-03-18", i:"Kantar",      s:{likud:31,ya:19,bw:4,jl:8,shas:8,utj:7,yb:7,meretz:4,raam:4,yamina:9,nh:9,labor:5,rz:5}, o:{nep:1.4}},
  {d:"2021-03-18", i:"Smith",       s:{likud:31,ya:19,bw:4,jl:8,shas:8,utj:7,yb:7,meretz:4,raam:4,yamina:9,nh:9,labor:5,rz:5}, o:{nep:1.4}},
  {d:"2021-03-18", i:"Maagar",      s:{likud:29,ya:18,bw:4,jl:10,shas:9,utj:7,yb:8,meretz:5,yamina:10,nh:10,labor:5,rz:5}, o:{raam:1.7,nep:1.1}}
 ]},

"2022 · sette settimane (11-15 set 2022)": {
 giorni: 49,
 blocco: ["likud","shas","utj","rzp"],
 blocco_reale: ["likud","shas","utj","rzp"],
 reale: {likud:32, ya:24, nu:12, shas:11, labor:4, utj:7, yb:6, rzp:14, ht:5, raam:5},
 sotto_reale: {jh:1.19, meretz:3.16, balad:2.90},
 note: "la Lista Unita si spacca il 15 set: Hadash-Ta'al entra, Balad resta sotto soglia al 2,90%",
 polls:[
  {d:"2022-09-15", i:"Panels",      s:{likud:31,ya:25,nu:12,shas:8,labor:5,utj:7,yb:6,rzp:11,jl:6,meretz:5,raam:4}, o:{jh:2.2}},
  {d:"2022-09-14", i:"Camil Fuchs", s:{likud:31,ya:24,nu:12,shas:8,labor:5,utj:7,yb:6,rzp:13,jl:5,meretz:5,raam:4}, o:{jh:1.9}},
  {d:"2022-09-13", i:"Kantar",      s:{likud:32,ya:24,nu:12,shas:9,labor:5,utj:7,yb:5,rzp:12,jl:5,meretz:5,raam:4}, o:{jh:1.3}},
  {d:"2022-09-13", i:"Panels",      s:{likud:32,ya:26,nu:12,shas:8,labor:5,utj:6,yb:5,rzp:11,jl:6,meretz:5,raam:4}, o:{jh:1.4}},
  {d:"2022-09-12", i:"Maagar",      s:{likud:33,ya:23,nu:12,shas:7,labor:7,utj:7,yb:4,rzp:12,jl:6,meretz:5,raam:4}, o:{jh:0.9}},
  {d:"2022-09-11", i:"Direct Polls",casa:1, s:{likud:34,ya:23,nu:12,shas:9,labor:4,utj:7,yb:5,rzp:11,jl:6,meretz:5,raam:4}, o:{jh:2.4}}
 ]},

"2022 · cinque settimane (16-29 set 2022)": {
 giorni: 38,
 blocco: ["likud","shas","utj","rzp"],
 blocco_reale: ["likud","shas","utj","rzp"],
 reale: {likud:32, ya:24, nu:12, shas:11, labor:4, utj:7, yb:6, rzp:14, ht:5, raam:5},
 sotto_reale: {jh:1.19, meretz:3.16, balad:2.90},
 polls:[
  {d:"2022-09-29", i:"Panels",      s:{likud:32,ya:24,nu:12,shas:8,labor:5,utj:7,yb:6,rzp:13,ht:4,meretz:5,raam:4}, o:{jh:1.8,balad:1.6}},
  {d:"2022-09-28", i:"Midgam",      s:{likud:32,ya:24,nu:13,shas:8,labor:5,utj:7,yb:6,rzp:12,ht:4,meretz:5,raam:4}, o:{jh:1.6,balad:1.1}},
  {d:"2022-09-22", i:"Direct Polls",casa:1, s:{likud:34,ya:23,nu:13,shas:9,labor:4,utj:7,yb:6,rzp:12,ht:4,meretz:4,raam:4}, o:{jh:2.3,balad:1.4}},
  {d:"2022-09-22", i:"Camil Fuchs", s:{likud:32,ya:25,nu:11,shas:8,labor:5,utj:7,yb:5,rzp:14,ht:4,meretz:5,raam:4}, o:{jh:1.9,balad:2.1}},
  {d:"2022-09-22", i:"Midgam",      s:{likud:34,ya:23,nu:12,shas:8,labor:5,utj:7,yb:6,rzp:11,ht:4,meretz:5,raam:5}, o:{jh:1.8,balad:2.4}},
  {d:"2022-09-21", i:"Panels",      s:{likud:33,ya:24,nu:12,shas:8,labor:6,utj:7,yb:5,rzp:12,ht:4,meretz:5,raam:4}, o:{jh:2.0,balad:1.2}},
  {d:"2022-09-20", i:"Panels",      s:{likud:33,ya:24,nu:12,shas:8,labor:5,utj:7,yb:6,rzp:12,ht:4,meretz:5,raam:4}, o:{jh:1.9,balad:1.1}},
  {d:"2022-09-17", i:"Kantar",      s:{likud:33,ya:24,nu:12,shas:8,labor:6,utj:7,yb:5,rzp:12,ht:4,meretz:5,raam:4}, o:{jh:1.9,balad:1.5}},
  {d:"2022-09-16", i:"Camil Fuchs", s:{likud:32,ya:24,nu:12,shas:8,labor:5,utj:7,yb:6,rzp:13,ht:4,meretz:5,raam:4}, o:{jh:2.0,balad:1.2}},
  {d:"2022-09-16", i:"Midgam",      s:{likud:33,ya:23,nu:12,shas:8,labor:6,utj:7,yb:6,rzp:12,ht:4,meretz:5,raam:4}, o:{jh:1.9,balad:0.9}}
 ]},

"2022 · finale (28 ott 2022)": {
 giorni: 4,
 blocco: ["likud","shas","utj","rzp"],
 reale: {likud:32, ya:24, nu:12, shas:11, labor:4, utj:7, yb:6, rzp:14, ht:5, raam:5},
 sotto_reale: {jh:1.19, meretz:3.16, balad:2.90},
 polls:[
  {d:"2022-10-28", i:"Kantar",      s:{likud:30,ya:22,nu:13,shas:10,labor:5,utj:7,yb:5,rzp:15,ht:4,meretz:4,raam:5}, o:{jh:1.4,balad:3.1}},
  {d:"2022-10-28", i:"Midgam",      s:{likud:30,ya:24,nu:11,shas:10,labor:6,utj:7,yb:4,rzp:14,ht:4,meretz:5,raam:5}},
  {d:"2022-10-28", i:"Camil Fuchs", s:{likud:31,ya:24,nu:12,shas:10,labor:5,utj:7,yb:4,rzp:14,ht:4,meretz:4,raam:5}},
  {d:"2022-10-28", i:"Direct Polls",casa:1, s:{likud:31,ya:23,nu:11,shas:10,labor:6,utj:8,yb:6,rzp:12,ht:4,meretz:5,raam:4}}
 ]}
};
