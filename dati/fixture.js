/* riproduce la struttura reale della pagina Wikipedia: intestazioni annidate con
   rowspan/colspan, note fra parentesi quadre, righe-evento, righe di scenario
   (che ereditano la data via rowspan), sezione di altro anno e tabella di scenari. */
module.exports=`
<h2>Voting intention</h2>
<h3>2026</h3>
<table class="wikitable">
<tr>
 <th rowspan="2">Fieldwork<br>date</th><th rowspan="2">Polling firm</th><th rowspan="2">Publisher</th>
 <th rowspan="2">Sample<br>size</th>
 <th rowspan="2">Likud</th><th rowspan="2">Together</th><th rowspan="2">RZP</th><th rowspan="2">Otzma</th>
 <th rowspan="2">Blue &amp; White</th><th rowspan="2">Shas</th><th rowspan="2">UTJ</th>
 <th rowspan="2">Yisrael Beiteinu</th><th rowspan="2">Ra'am</th>
 <th colspan="2">Joint List</th>
 <th rowspan="2">Dems</th><th rowspan="2">Yashar</th><th rowspan="2">Zionist Home</th>
 <th rowspan="2">Unity</th><th rowspan="2">Others</th><th rowspan="2">Gov.</th>
</tr>
<tr><th>Hadash<br>–Ta'al</th><th>Balad</th></tr>
<tr><td>18–19 Aug</td><td>Kantar</td><td>Kan 11<sup>[21]</sup></td><td>558</td>
 <td>23</td><td>14</td><td>5</td><td>9</td><td><i>(1.4%)</i></td><td>7</td><td>8</td><td>9</td><td>5</td>
 <td>6</td><td><i>(2.1%)</i></td><td>10</td><td><b>24</b></td><td><i>(2.9%)</i></td><td><i>(1.6%)</i></td><td>—N/a</td><td>52</td></tr>
<tr><td>16 Aug</td><td>Maagar Mochot</td><td>Israel Hayom</td><td>(552)</td>
 <td>26</td><td>16</td><td>(3)</td><td>9</td><td>(1)</td><td>7</td><td>8</td><td>9</td><td>5</td>
 <td>6</td><td>(2)</td><td>10</td><td><b>24</b></td><td>(2)</td><td>(1)</td><td>—N/a</td><td>(50)</td></tr>
<tr><td>17 Aug</td><td colspan="19">Likud conducts a primary to select candidates for the election<sup>[23]</sup></td></tr>
<tr><td colspan="20">26 Apr — Bennett 2026 and Yesh Atid form the Together alliance under Bennett's leadership</td></tr>
<tr><td rowspan="2">12–13 Aug</td><td rowspan="2">Lazar</td><td rowspan="2">Maariv<sup>[27]</sup></td><td rowspan="2">506</td>
 <td>21</td><td>14</td><td>4</td><td>8</td><td><i>(1.9%)</i></td><td>7</td><td>8</td><td>10</td><td>5</td>
 <td>6</td><td><i>(1.5%)</i></td><td>10</td><td><b>23</b></td><td>4</td><td><i>(1.9%)</i></td><td>3.1%<sup>[c]</sup></td><td>48</td></tr>
<tr><td>21</td><td>30</td><td>4</td><td>8</td><td>—</td><td>7</td><td>8</td><td>10</td><td>5</td>
 <td>6</td><td>—</td><td>10</td><td>—</td><td>4</td><td>—</td><td>—</td><td>48</td></tr>
<tr><td>4 Aug</td><td>Filber</td><td>Channel 14</td><td>588</td>
 <td>31</td><td>8</td><td>6</td><td>6</td><td><i>(0.5%)</i></td><td>11</td><td>8</td><td>8</td><td>5</td>
 <td>5</td><td><i>(2.9%)</i></td><td>10</td><td>22</td><td><i>(1.9%)</i></td><td>—</td><td>3.2%</td><td>62</td></tr>
<tr><td>1 Aug</td><td>Kantar</td><td>Kan 11</td><td>500</td>
 <td>23</td><td>14</td><td>5</td><td>9</td><td>—</td><td>7</td><td>8</td><td>9</td><td>5</td>
 <td>6</td><td>—</td><td>11</td><td>23</td><td>—</td><td>—</td><td>—</td><td>99</td></tr>
<tr><td>19–20 Aug</td><td>Yossi Tatika</td><td>Zman Yisrael</td><td>500</td>
 <td>21</td><td>15</td><td>6</td><td>7</td><td><i>(2.4%)</i></td><td>9</td><td>8</td><td>11</td><td>5</td>
 <td colspan="2">7</td>
 <td>8</td><td>23</td><td><i>(3.0%)</i></td><td><i>(0.8%)</i></td><td>—<style>.mw-parser-output .sr-only{border:0;clip:rect(0,0,0,0);height:1px;margin:-1px}</style>N/a</td><td>51</td></tr>
<tr><td>15 Aug</td><td>Direct Polls</td><td>i24 News</td><td>535</td>
 <td>30</td><td>9</td><td>5</td><td>6</td><td>(&lt;1%)</td><td>8</td><td>8</td><td>8</td><td>5</td>
 <td>6</td><td>(1.4%)</td><td>11</td><td>24</td><td>N/A</td><td>n/a</td><td>—</td><td>57</td></tr>
<tr><td>10 Jan</td><td>Midgam R&amp;C</td><td>HaHadashot 12</td><td>500</td>
 <td>25</td><td>14</td><td>5</td><td>8</td><td>—</td><td>8</td><td>8</td><td>9</td>
 <td colspan="3">10</td>
 <td>10</td><td>23</td><td>—</td><td>—</td><td>—</td><td>54</td></tr>
</table>
<h3>2025</h3>
<table class="wikitable">
<tr><th>Fieldwork date</th><th>Polling firm</th><th>Publisher</th><th>Likud</th><th>Yesh Atid</th><th>National Unity</th><th>Shas</th><th>Gov.</th></tr>
<tr><td>18 Sep</td><td>Midgam</td><td>HaHadashot 12</td><td>24</td><td>9</td><td>10</td><td>9</td><td>49</td></tr>
</table>
<h3>Hypothetical scenarios</h3>
<table class="wikitable">
<tr><th>Fieldwork date</th><th>Polling firm</th><th>Publisher</th><th>Likud</th><th>Together</th><th>Shas</th><th>Gov.</th></tr>
<tr><td>1 Aug</td><td>Lazar</td><td>Maariv</td><td>40</td><td>40</td><td>40</td><td>40</td></tr>
</table>
`;

/* Tabella tarata per legare il conteggio delle righe valide alla decisione sulla
   tabella. Quattro righe sono valide — sommano 120 e il blocco torna — e portano una
   colonna sempre a «—N/a», che è la scrittura reale di Wikipedia per una lista non
   rilevata. Due righe sono rotte davvero, con somma 119.
   Con il parser riparato: 4 valide su 6, il 67%, la tabella si accetta.
   Se la lettura delle celle senza cifre tornasse a fallire: 0 valide su 6, e la
   tabella verrebbe ignorata in blocco portandosi via anche le quattro buone. È il
   difetto misurato sulla pagina vera, dove costava 24 rilevazioni. */
module.exports += `
<h3>2026</h3>
<table class="wikitable">
<tr><th>Fieldwork date</th><th>Polling firm</th><th>Publisher</th><th>Likud</th><th>Together</th>
 <th>RZP</th><th>Otzma</th><th>Blue &amp; White</th><th>Shas</th><th>UTJ</th><th>Yisrael Beiteinu</th>
 <th>Ra'am</th><th>Hadash–Ta'al</th><th>Dems</th><th>Yashar</th><th>Gov.</th></tr>
<tr><td>9 Aug</td><td>Kantar</td><td>Kan 11</td><td>30</td><td>15</td><td>5</td><td>8</td><td>—N/a</td>
 <td>9</td><td>8</td><td>9</td><td>5</td><td>6</td><td>10</td><td>15</td><td>60</td></tr>
<tr><td>8 Aug</td><td>Midgam</td><td>HaHadashot 12</td><td>30</td><td>15</td><td>5</td><td>8</td><td>—N/a</td>
 <td>9</td><td>8</td><td>9</td><td>5</td><td>6</td><td>10</td><td>15</td><td>60</td></tr>
<tr><td>7 Aug</td><td>Lazar</td><td>Maariv</td><td>30</td><td>15</td><td>5</td><td>8</td><td>—N/a</td>
 <td>9</td><td>8</td><td>9</td><td>5</td><td>6</td><td>10</td><td>15</td><td>60</td></tr>
<tr><td>5 Aug</td><td>Maagar Mochot</td><td>Israel Hayom</td><td>30</td><td>15</td><td>5</td><td>8</td><td>—N/a</td>
 <td>9</td><td>8</td><td>9</td><td>5</td><td>6</td><td>10</td><td>15</td><td>60</td></tr>
<tr><td>3 Aug</td><td>Panels Politics</td><td>Maariv</td><td>29</td><td>15</td><td>5</td><td>8</td><td>—N/a</td>
 <td>9</td><td>8</td><td>9</td><td>5</td><td>6</td><td>10</td><td>15</td><td>59</td></tr>
<tr><td>2 Aug</td><td>Stat-Net</td><td>Walla</td><td>29</td><td>15</td><td>5</td><td>8</td><td>—N/a</td>
 <td>9</td><td>8</td><td>9</td><td>5</td><td>6</td><td>10</td><td>15</td><td>59</td></tr>
</table>
`;

/* tabelle problematiche realmente presenti nella pagina: percentuali dell'Israel
   Democracy Institute, sondaggi sulla popolazione araba, scenari con Ofer Winter */
module.exports += `
<h3>2026</h3>
<table class="wikitable">
<tr><th>Date</th><th>Polling firm</th><th>Publisher</th><th>Likud</th><th>Otzma</th><th>Shas</th><th>UTJ</th>
 <th>Yesh Atid</th><th>Dems</th><th>Other</th><th>Don't know</th><th>Gov. total</th></tr>
<tr><td>Dec</td><td>Viterbi Center</td><td>IDI</td><td>20.5</td><td>5.6</td><td>6.1</td><td>11.0</td>
 <td>8.9</td><td>10.02</td><td>2.3</td><td>7.8</td><td>48.8</td></tr>
<tr><td>Oct</td><td>Viterbi Center</td><td>IDI</td><td>19.4</td><td>8.9</td><td>6.3</td><td>6.1</td>
 <td>9.4</td><td>9.6</td><td>2.0</td><td>7.6</td><td>45.0</td></tr>
</table>
<table class="wikitable">
<tr><th>Fieldwork date</th><th>Polling firm</th><th>Publisher</th><th>Likud</th><th>Together</th><th>Shas</th>
 <th>UTJ</th><th>Otzma</th><th>Winter</th><th>Yashar</th><th>Dems</th><th>Gov.</th></tr>
<tr><td>10 Aug</td><td>Lazar</td><td>Maariv</td><td>20</td><td>14</td><td>8</td><td>8</td><td>7</td>
 <td>8</td><td>22</td><td>10</td><td>43</td></tr>
</table>
`;
