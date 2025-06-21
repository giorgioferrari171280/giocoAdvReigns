# Contribuire al Progetto

Grazie per l'interesse nel contribuire a questo videogioco di avventura testuale! Ogni contributo è benvenuto.

## Come Contribuire

Ci sono molti modi per contribuire, tra cui:

*   **Segnalare Bug:** Se trovi un bug, per favore apri una "Issue" su GitHub descrivendo il problema, i passi per riprodurlo e, se possibile, uno screenshot.
*   **Suggerire Miglioramenti:** Hai idee su come migliorare il gioco, la storia, l'interfaccia o aggiungere nuove funzionalità? Apri una "Issue" con l'etichetta "enhancement".
*   **Scrivere Codice:** Se vuoi contribuire con codice (nuove funzionalità, bug fix):
    1.  Fai un "Fork" del repository.
    2.  Crea un nuovo "Branch" per le tue modifiche (`git checkout -b nome-branch-descrittivo`).
    3.  Effettua le modifiche e committa (`git commit -m "Descrizione chiara del commit"`).
    4.  Fai il "Push" del tuo branch sul tuo fork (`git push origin nome-branch-descrittivo`).
    5.  Apri una "Pull Request" (PR) verso il branch principale (`main` o `master`) del repository originale.
    6.  Assicurati che la tua PR descriva chiaramente le modifiche apportate.
*   **Traduzioni:** Se parli una lingua non ancora supportata o vuoi migliorare le traduzioni esistenti, puoi contribuire modificando `config/locales.js`.
*   **Scrivere Contenuti di Gioco:**
    *   **Scene:** Aggiungi nuove scene in `data/scenes.js` e i relativi testi in `config/locales.js`.
    *   **Oggetti:** Definisci nuovi oggetti in `data/items.js`.
    *   **Capitoli/Side Quest:** Struttura nuove parti della storia in `data/chapters.js` o `data/sideQuests.js`.
    *   Assicurati di seguire le convenzioni di naming e la struttura dati esistente.
*   **Creare Asset Grafici/Audio:** Se hai competenze grafiche o musicali, nuovi asset (immagini, suoni, musiche) sono sempre utili. Segui le convenzioni nelle cartelle `assets/`.

## Linee Guida per il Codice

*   Segui le [Convenzioni di Sviluppo](README.md#convenzioni-di-sviluppo) definite nel `README.md` principale.
*   Mantieni il codice pulito, leggibile e ben commentato, specialmente per le parti complesse.
*   Assicurati che le tue modifiche non introducano regressioni testando il flusso di gioco principale.
*   Se aggiungi nuove funzionalità che richiedono configurazione (es. nuovi tipi di effetti o condizioni), documentale.

## Processo di Revisione delle Pull Request

1.  Una volta aperta una PR, verrà revisionata il prima possibile.
2.  Potrebbero essere richiesti dei cambiamenti o poste delle domande.
3.  Una volta approvata, la PR verrà unita (merged) al branch principale.

## Comportamento

Ci aspettiamo che tutti i contributori seguano un codice di condotta che promuova un ambiente aperto e accogliente. Tratta tutti con rispetto.

Grazie ancora per il tuo contributo!
