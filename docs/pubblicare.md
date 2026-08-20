# Pubblicare una nuova versione

GitHub Pages serve `index.html` dal ramo `main`. Un push è una pubblicazione immediata.

```bash
npm run verifica                    # deve passare per intero
git add index.html
git commit -m "Aggiornare <cosa> perché <perché>"
git push
```

La pagina si aggiorna in un paio di minuti. Verificare a schermo largo e stretto, nei due temi,
e con JavaScript disattivato (deve comparire l'avviso di avvio, non una pagina vuota).

## Se qualcosa va storto

```bash
git revert HEAD && git push          # torna alla versione precedente
```

## Prima di un aggiornamento importante

Salvare una copia della versione in produzione: `curl -o /tmp/prod.html https://angrisanidj.github.io/modello-israele/`
