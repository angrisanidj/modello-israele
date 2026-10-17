#!/usr/bin/env bash
# LA CONSEGNA DEL RIEPILOGO, UNA STRADA SOLA PER DUE JOB.
# Fino al 17 ottobre 2026 stava dentro il passo «Consegna il riepilogo» del job aggiorna, e
# la spazzolata ci arrivava perché era un passo dello stesso job. Da quando la spazzolata ha
# un job suo — corre accanto a meta, e l'anteprima non la aspetta — la issue la devono poter
# consegnare tutti e due: il riepilogo della notte e, se cade, la spazzolata. Due copie di
# questo blocco divergerebbero alla prima modifica, quindi è un file, e i due passi lo chiamano.
# Lo stesso «bash -eo pipefail» con cui GitHub esegue un passo «run».
# test/struttura.mjs legge questo file insieme ai passi che lo chiamano, quindi i suoi controlli
# sui comandi — commit senza guardia, rebase senza autostash, virgolette aperte — lo vedono.
# Prima di chiamarlo: riepilogo.mjs ha scritto corpo-dafare.md e conto.txt.
set -eo pipefail
[ -f corpo-dafare.md ] || exit 0
# STESSO IDIOMA DELL'ALTRO COMMIT, e non per simmetria: la guardia sta DOPO
# git add ed è «--cached», così guarda per costruzione esattamente i file che
# verranno committati. Qui l'insieme è uno solo e le due forme coinciderebbero,
# ma è precisamente la condizione in cui la forma sbagliata non si vede — nel
# passo di sopra i due insiemi divergevano e il job moriva.
#
# E «STESSO IDIOMA» ERA UNA DICHIARAZIONE CHE IL CODICE NON MANTENEVA. Il commit
# di sopra usa «git pull --rebase --autostash» con dodici righe che spiegano
# perché l'autostash serve; questo diceva di fare la stessa cosa e chiamava
# «git pull --rebase» nudo. Il 26 agosto 2026 la notte è andata così: il parser
# ha trovato due cose che bloccavano, il job si è fermato — giustamente — la
# issue è stata aperta, e poi QUESTO passo è morto su «cannot pull with rebase:
# You have unstaged changes». Risultato: dati/da-fare.json è rimasto al 25 agosto
# mentre stato-job.json diceva 26, cioè due file che la stessa notte scrive,
# divergenti di un giorno.
# È la stessa famiglia della sigla che dichiarava «incerti» mentre la riga era
# cablata a tre chiavi: un testo che afferma quello che il codice non fa. Adesso
# test/struttura.mjs confronta i due comandi e cade se divergono.
git config user.name "aggiornamento-notturno"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add dati/da-fare.json
if ! git diff --cached --quiet; then
  git commit -m "Aggiornare il riepilogo delle cose da fare (lavoro notturno)"
  git pull --rebase --autostash origin main && git push origin main || { git rebase --abort || true; echo "rebase non pulito: il file resta locale"; }
fi
TITOLO="Cose da fare — riepilogo del lavoro notturno"
NUM=$(gh issue list --state open --search "\"$TITOLO\" in:title" --json number,title                   --jq ".[] | select(.title==\"$TITOLO\") | .number" | head -1)
if [ "$(cat conto.txt)" = "0" ]; then
  if [ -n "$NUM" ]; then
    gh issue comment "$NUM" --body "Non resta niente da fare: chiudo."
    gh issue close "$NUM"
  else
    echo "niente da fare e nessuna issue aperta: silenzio"
  fi
  exit 0
fi
if [ -n "$NUM" ]; then
  # modifica del corpo: NON notifica, ed è quello che si vuole
  gh issue edit "$NUM" --body-file corpo-dafare.md
  echo "issue #$NUM aggiornata in silenzio"
else
  # creazione + assegnazione: notifica, ed è l'unica volta che deve farlo
  gh issue create --title "$TITOLO" --body-file corpo-dafare.md --assignee angrisanidj
fi
