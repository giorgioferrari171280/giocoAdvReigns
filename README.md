## File README.md principale

Questo file documenta la struttura del progetto, le istruzioni di setup, le convenzioni di sviluppo e le linee guida per l'aggiunta di nuovi contenuti per il videogioco di avventura testuale in stile Reigns.

**Nome del Gioco:** (Placeholder - Da definire)
**Tecnologia:** HTML5, CSS3, JavaScript Vanilla

### Struttura del Progetto

```
.
├── assets/
│   ├── audio/
│   │   ├── music/
│   │   │   └── README.md
│   │   └── sfx/
│   │       └── README.md
│   ├── fonts/
│   │   └── README.md
│   ├── images/
│   │   ├── characters/
│   │   │   └── README.md
│   │   ├── cutscenes/
│   │   │   └── README.md
│   │   ├── items/
│   │   │   └── README.md
│   │   ├── locations/
│   │   │   └── README.md
│   │   └── ui/
│   │       └── README.md
│   └── videos/
│       └── README.md
├── config/
│   ├── gameConfig.js     # Configurazione globale del gioco (dimensioni, difficoltà, costanti)
│   └── locales.js        # Testi localizzati per UI e dialoghi
├── data/
│   ├── achievements.js   # Definizione degli achievement
│   ├── chapters.js       # Definizione dei capitoli della storia
│   ├── cutscenes.js      # Definizione delle cutscene (sequenze di immagini/testo)
│   ├── endings.js        # Definizione dei finali possibili
│   ├── items.js          # Descrizione degli oggetti collezionabili/utilizzabili
│   ├── players.js        # Struttura dati per la Hall of Fame (gestita da localStorage)
│   ├── scenes.js         # Specifiche di ogni schermata/scena statica del gioco
│   └── sideQuests.js     # Definizione delle missioni secondarie
├── utils/
│   ├── audioManager.js   # Gestione audio (musica, SFX)
│   ├── helpers.js        # Funzioni di utilità generiche (DOM, random, formatting)
│   ├── localizationManager.js # Logica per caricamento e switch lingua
│   ├── narrativeEngine.js # Gestione progressione storia, flag, ramificazioni
│   ├── storageManager.js # Interazione con localStorage per salvataggi e preferenze
│   └── uiManager.js      # Gestione dinamica elementi UI
├── .gitignore            # File e cartelle da ignorare per Git
├── CONTRIBUTING.md       # Linee guida per contributori
├── index.html            # Entry point dell'applicazione
├── LICENSE               # Licenza del software
├── README.md             # Questo file
├── script.js             # Logica principale del gioco, game loop, gestione stati
└── style.css             # Stili CSS principali del gioco
```

### Setup Ambiente di Sviluppo Locale

1.  **Clonare il repository:**
    ```bash
    git clone <url_del_repository>
    cd <nome_cartella_progetto>
    ```
2.  **Aprire `index.html`:**
    Non è richiesto un server di sviluppo complesso per la versione base. Semplicemente apri il file `index.html` con un qualsiasi browser web moderno (Google Chrome, Firefox, Edge, Safari).
    *   Su Windows: Doppio click su `index.html` o "Apri con..."
    *   Su macOS: Doppio click su `index.html` o trascinalo sull'icona del browser.
    *   Su Linux: `xdg-open index.html` o doppio click dal file manager.

3.  **Strumenti di Sviluppo del Browser:**
    Utilizza gli strumenti di sviluppo integrati nel browser (solitamente accessibili con `F12` o `Cmd+Opt+I` / `Ctrl+Shift+I`) per ispezionare elementi, debuggare JavaScript (Console, Debugger) e analizzare problemi di rete o performance.

### Convenzioni di Sviluppo

*   **Nomi File e Cartelle:** `kebab-case` (es. `game-config.js`, `player-stats.js`).
*   **Variabili e Funzioni JavaScript:** `camelCase` (es. `playerInventory`, `updatePlayerStats()`).
*   **Classi CSS:** `kebab-case` (es. `.game-container`, `.action-button`).
*   **Commenti:** Commentare il codice in modo chiaro, specialmente per logiche complesse o strutture dati. Usare JSDoc per documentare funzioni, parametri e valori di ritorno in JavaScript.
*   **Localizzazione:** Tutti i testi visibili all'utente devono essere gestiti tramite `config/locales.js` e `utils/localizationManager.js`. Non inserire stringhe di testo direttamente nell'HTML o nel JavaScript se devono essere tradotte.
*   **Moduli JavaScript (Concettuali):** Anche se si usa JavaScript vanilla senza un bundler, organizzare il codice in file distinti per responsabilità (come nella cartella `utils/`) e caricarli in `index.html` nell'ordine corretto di dipendenza. Gli oggetti globali (es. `UIManager`, `AudioManager`) fungono da namespace.
*   **Dati di Gioco:** I dati che definiscono il contenuto del gioco (scene, oggetti, capitoli) sono separati in file JSON-like (oggetti/array JavaScript) nella cartella `data/`. Questo facilita la modifica e l'espansione del contenuto senza toccare la logica principale.
*   **CSS:** Utilizzare variabili CSS (`:root { --main-color: #fff; }`) per temi e dimensioni facilmente modificabili. Strutturare `style.css` in sezioni logiche.

### Linee Guida per l'Aggiunta di Nuovi Contenuti

#### Aggiungere una Nuova Scena:

1.  **Definire la Scena:**
    *   Apri `data/scenes.js`.
    *   Aggiungi un nuovo oggetto al `gameScenes` con un ID univoco (es. `"scene_market_enter"`).
    *   Specifica `backgroundImage` (crea l'immagine in `assets/images/locations/`), `narrativeTextKey`, e le `choices`.
    *   Per ogni `narrativeTextKey` e `choiceTextKey`, aggiungi le traduzioni corrispondenti in tutte le lingue in `config/locales.js`.
2.  **Collegare la Scena:**
    *   Assicurati che una scelta in una scena esistente abbia come `targetSceneId` l'ID della tua nuova scena.
    *   Oppure, se è la prima scena di un nuovo capitolo, aggiungi il suo ID all'array `sceneIds` del capitolo in `data/chapters.js`.
3.  **Effetti e Condizioni (Opzionale):**
    *   Aggiungi `effects` alle scelte o `onEnterEffects`/`onExitEffects` alla scena per modificare lo stato del gioco, statistiche, inventario o flag.
    *   Aggiungi `conditions` alle scelte se devono apparire solo in determinate circostanze.

#### Aggiungere un Nuovo Oggetto (Item):

1.  **Definire l'Oggetto:**
    *   Apri `data/items.js`.
    *   Aggiungi un nuovo oggetto a `gameItems` con un ID univoco (es. `"ancient_scroll"`).
    *   Specifica `nameKey`, `descriptionKey`, `icon` (crea l'icona in `assets/images/items/`).
    *   Aggiungi le traduzioni per `nameKey` e `descriptionKey` in `config/locales.js`.
2.  **Integrare l'Oggetto:**
    *   Puoi far ottenere l'oggetto al giocatore tramite un effetto di una scelta in una scena (es. `{ type: "item_add", itemId: "ancient_scroll" }`).
    *   Puoi usare la presenza dell'oggetto come condizione per una scelta (`{ type: "item_check", itemId: "ancient_scroll", present: true }`).

#### Aggiungere una Nuova Lingua:

1.  **Creare la Sezione Lingua:**
    *   Apri `config/locales.js`.
    *   Aggiungi una nuova chiave di primo livello con il codice ISO 639-1 della lingua (es. `"pl"` per il Polacco).
    *   Copia la struttura di una lingua esistente (es. `en`) e traduci tutte le stringhe.
2.  **Aggiornare il Selettore Lingua:**
    *   `LocalizationManager.getAvailableLanguages()` dovrebbe essere aggiornato se si usa una mappatura statica dei nomi delle lingue.
    *   La UI che mostra il selettore di lingua (in `showPreOptionsScreen` e `showOptions` in `script.js`) dovrebbe popolare dinamicamente le opzioni basandosi su `LocalizationManager.getAvailableLanguages()`.

#### Aggiungere una Nuova Cutscene:

1.  **Definire la Cutscene:**
    *   Apri `data/cutscenes.js`.
    *   Aggiungi un nuovo oggetto a `gameCutscenes` con un ID univoco.
    *   Definisci l'array `screens`, ognuno con `imageId` (o `videoId`), `textKey`, e opzionalmente `soundtrackId` o `sfx`.
    *   Crea le immagini/video necessari in `assets/images/cutscenes/` o `assets/videos/`.
    *   Aggiungi le traduzioni per ogni `textKey` in `config/locales.js`.
2.  **Attivare la Cutscene:**
    *   Imposta `openingCutsceneId` o `closingCutsceneId` in un capitolo (`data/chapters.js`).
    *   Oppure, da una scena, una scelta potrebbe avere un effetto che porta a una cutscene (logica da implementare in `script.js` o `NarrativeEngine`).
    *   Specifica `nextSceneAfterEnd` o `nextCutsceneIdAfterEnd` per definire cosa succede dopo la cutscene.

### Flusso di Gioco (Panoramica MVP)

1.  **Pre-Opzioni:** Scelta lingua, audio ON/OFF, volume.
2.  **Splash Screen:** Caricamento fittizio.
3.  **Menu Principale:** Nuova Partita, Carica Partita, Hall of Fame, Opzioni, Crediti, Esci.
4.  **Nuova Partita:** Scelta slot salvataggio -> Cutscene Introduttiva.
5.  **Gioco:**
    *   Visualizzazione scena (immagine, testo).
    *   Scelta azioni (pulsanti).
    *   Aggiornamento stato gioco (statistiche, inventario, flag).
    *   Progressione alla scena successiva.
    *   Accesso a Inventario, Stats Eroe, Opzioni (Menu Pausa).
6.  **Fine Capitolo:** Cutscene -> Inizio nuovo capitolo (con cutscene).
7.  **Fine Gioco:** Determinazione finale basato su metriche -> Cutscene Finale -> Hall of Fame.

Consultare i singoli file `README.md` nelle sottocartelle di `assets/` per convenzioni specifiche sugli asset.
Consultare i commenti nei file `.js` per dettagli sull'implementazione di specifiche funzioni o strutture dati.
