# Modello previsionale Knesset 2026

Modello statistico per le elezioni della 26ª Knesset — **27 ottobre 2026**.

**→ [angrisanidj.github.io/modello-israele](https://angrisanidj.github.io/modello-israele/)**

Un unico file HTML autonomo. Legge i sondaggi dalla tabella di Wikipedia, li valida riga per riga,
inverte i seggi in quote di voto, li media pesando recenza e affidabilità dell'istituto, riparte i
seggi con Bader-Ofer sopra la soglia del 3,25% e simula 20.000 scenari.

Comandi interattivi per swing fra i blocchi, ampiezza dell'errore, affluenza araba, esclusione di
singoli istituti. Nota metodologica completa, compreso come il modello si è comportato riapplicato
alle elezioni del 2020, 2021 e 2022.

## Sviluppo

```bash
npm install
npm run verifica     # 458 prove + controlli strutturali
```

Le istruzioni di progetto sono in [CLAUDE.md](CLAUDE.md).

## Licenza

Codice: MIT. Dati dei sondaggi: da Wikipedia, CC BY-SA.
