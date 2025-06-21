// utils/narrativeEngine.js

/**
 * @fileoverview
 * Gestione della progressione della storia, dei flag narrativi e delle ramificazioni.
 * Questo modulo è il cuore della logica di gioco per avanzare nella narrazione.
 */

const NarrativeEngine = {
    /** @type {object} gameState - Riferimento all'oggetto gameState globale. */
    gameState: null,
    /** @type {object} playerStats - Riferimento all'oggetto playerStats globale. */
    playerStats: null,
    /** @type {object} worldState - Riferimento all'oggetto worldState globale. */
    worldState: null,
    /** @type {object} playerInventory - Riferimento all'oggetto playerInventory globale. */
    playerInventory: null,

    /** @type {object} gameScenesData - Riferimento ai dati delle scene (da data/scenes.js). */
    gameScenesData: null,
    /** @type {object} gameChaptersData - Riferimento ai dati dei capitoli (da data/chapters.js). */
    gameChaptersData: null,
    /** @type {object} gameSideQuestsData - Riferimento ai dati delle side quest (da data/sideQuests.js). */
    gameSideQuestsData: null,
    /** @type {object} gameEndingsData - Riferimento ai dati dei finali (da data/endings.js). */
    gameEndingsData: null,
    /** @type {object} gameItemsData - Riferimento ai dati degli oggetti (da data/items.js). */
    gameItemsData: null,


    /**
     * Inizializza il NarrativeEngine con i riferimenti necessari.
     * @param {object} gameStateRef - Riferimento a gameState.
     * @param {object} playerStatsRef - Riferimento a playerStats.
     * @param {object} worldStateRef - Riferimento a worldState.
     * @param {object} playerInventoryRef - Riferimento a playerInventory.
     * @param {object} scenesData - Dati da data/scenes.js.
     * @param {object} chaptersData - Dati da data/chapters.js.
     * @param {object} sideQuestsData - Dati da data/sideQuests.js
     * @param {object} endingsData - Dati da data/endings.js
     * @param {object} itemsData - Dati da data/items.js
     */
    initialize: function(gameStateRef, playerStatsRef, worldStateRef, playerInventoryRef, scenesData, chaptersData, sideQuestsData, endingsData, itemsData) {
        this.gameState = gameStateRef;
        this.playerStats = playerStatsRef;
        this.worldState = worldStateRef;
        this.playerInventory = playerInventoryRef;
        this.gameScenesData = scenesData;
        this.gameChaptersData = chaptersData;
        this.gameSideQuestsData = sideQuestsData;
        this.gameEndingsData = endingsData;
        this.gameItemsData = itemsData;
        console.log("NarrativeEngine initialized.");
    },

    /**
     * Ottiene i dati di una scena specifica.
     * @param {string} sceneId - L'ID della scena.
     * @returns {object|null} L'oggetto di configurazione della scena o null se non trovato.
     */
    getSceneData: function(sceneId) {
        if (this.gameScenesData && this.gameScenesData[sceneId]) {
            return this.gameScenesData[sceneId];
        }
        console.warn(`NarrativeEngine: Scena con ID '${sceneId}' non trovata in gameScenesData.`);
        return null;
    },

    /**
     * Valuta le condizioni per una scelta o un evento.
     * @param {Array<object>} conditions - Array di oggetti condizione.
     *        Esempio condizione: { type: "stat_check", playerStat: true, stat: "strength", operator: ">=", value: 10 }
     *                           { type: "item_check", itemId: "rope", present: true, quantity: 1 }
     *                           { type: "flag_check", flagName: "door_open", value: true }
     *                           { type: "money_check", amount: 100, operator: ">="}
     *                           { type: "random_chance", percentage: 50}
     * @returns {boolean} True se tutte le condizioni sono soddisfatte, false altrimenti.
     */
    evaluateConditions: function(conditions) {
        if (!conditions || conditions.length === 0) {
            return true; // Nessuna condizione, quindi è sempre vero.
        }

        for (const condition of conditions) {
            let conditionMet = false;
            switch (condition.type) {
                case 'stat_check':
                    const targetStatObj = condition.playerStat ? this.playerStats : this.worldState;
                    if (targetStatObj && typeof targetStatObj[condition.stat] !== 'undefined') {
                        const statValue = targetStatObj[condition.stat];
                        switch (condition.operator) {
                            case '>=': conditionMet = statValue >= condition.value; break;
                            case '<=': conditionMet = statValue <= condition.value; break;
                            case '>':  conditionMet = statValue >  condition.value; break;
                            case '<':  conditionMet = statValue <  condition.value; break;
                            case '==': conditionMet = statValue == condition.value; break; // Usare == per confronto flessibile se i tipi possono variare
                            case '!=': conditionMet = statValue != condition.value; break;
                            default: console.warn(`Operatore non valido '${condition.operator}' in stat_check.`);
                        }
                    }
                    break;
                case 'item_check':
                    const itemInInventory = this.playerInventory.items[condition.itemId];
                    const quantity = itemInInventory ? itemInInventory.quantity : 0;
                    const requiredQuantity = condition.quantity || 1;
                    if (condition.present === false) { // Verifica assenza
                        conditionMet = !itemInInventory || quantity === 0;
                    } else { // Verifica presenza
                        conditionMet = itemInInventory && quantity >= requiredQuantity;
                    }
                    break;
                case 'flag_check':
                    const flagValue = this.gameState.flags[condition.flagName] || false; // Default a false se non settato
                    conditionMet = (flagValue === condition.value);
                    break;
                case 'money_check':
                    const currentMoney = this.playerStats.money || 0; // Assumendo che 'money' sia in playerStats
                    switch (condition.operator) {
                        case '>=': conditionMet = currentMoney >= condition.amount; break;
                        case '<=': conditionMet = currentMoney <= condition.amount; break;
                        case '==': conditionMet = currentMoney == condition.amount; break;
                        default: console.warn(`Operatore non valido '${condition.operator}' in money_check.`);
                    }
                    break;
                case 'random_chance':
                    conditionMet = (Math.random() * 100) < condition.percentage;
                    break;
                // Aggiungere altri tipi di condizioni (es. capitolo corrente, tempo trascorso, ecc.)
                default:
                    console.warn(`NarrativeEngine: Tipo di condizione '${condition.type}' non riconosciuto.`);
            }
            if (!conditionMet) return false; // Se una condizione non è soddisfatta, l'intero set fallisce.
        }
        return true; // Tutte le condizioni sono soddisfatte.
    },

    /**
     * Applica una serie di effetti al gameState, playerStats, worldState o playerInventory.
     * @param {Array<object>} effects - Array di oggetti effetto.
     *        Esempio effetto: { type: "stat_change", playerStat: true, stat: "karma", value: 1 }
     *                         { type: "item_add", itemId: "key_01", quantity: 1 }
     *                         { type: "flag_set", flagName: "door_unlocked", value: true }
     *                         { type: "money_add", amount: 50 }
     *                         { type: "money_subtract", amount: 20 }
     */
    applyEffects: function(effects) {
        if (!effects || effects.length === 0) {
            return;
        }

        effects.forEach(effect => {
            switch (effect.type) {
                case 'stat_change':
                    const targetStatObj = effect.playerStat ? this.playerStats : this.worldState;
                    if (targetStatObj && typeof targetStatObj[effect.stat] !== 'undefined') {
                        targetStatObj[effect.stat] += effect.value;
                        console.log(`Statistica cambiata: ${effect.playerStat ? 'Player' : 'World'}.${effect.stat} += ${effect.value}. Nuovo valore: ${targetStatObj[effect.stat]}`);
                    } else if (targetStatObj) { // Inizializza la stat se non esiste
                        targetStatObj[effect.stat] = effect.value;
                         console.log(`Statistica inizializzata: ${effect.playerStat ? 'Player' : 'World'}.${effect.stat} = ${effect.value}.`);
                    }
                    break;
                case 'item_add':
                    this.playerInventory.addItem(effect.itemId, effect.quantity || 1);
                    console.log(`Oggetto aggiunto: ${effect.itemId}, quantità: ${effect.quantity || 1}`);
                    break;
                case 'item_remove':
                    this.playerInventory.removeItem(effect.itemId, effect.quantity || 1);
                    console.log(`Oggetto rimosso: ${effect.itemId}, quantità: ${effect.quantity || 1}`);
                    break;
                case 'flag_set':
                    this.gameState.flags[effect.flagName] = effect.value;
                    console.log(`Flag impostato: ${effect.flagName} = ${effect.value}`);
                    break;
                case 'money_add':
                    if (this.playerStats) {
                        this.playerStats.money = (this.playerStats.money || 0) + effect.amount;
                        console.log(`Denaro aggiunto: ${effect.amount}. Totale: ${this.playerStats.money}`);
                    }
                    break;
                case 'money_subtract':
                    if (this.playerStats) {
                        this.playerStats.money = Math.max(0, (this.playerStats.money || 0) - effect.amount);
                        console.log(`Denaro sottratto: ${effect.amount}. Totale: ${this.playerStats.money}`);
                    }
                    break;
                case 'sfx_play':
                    if (typeof AudioManager !== 'undefined' && AudioManager.playSound) {
                        AudioManager.playSound(effect.soundId);
                    }
                    break;
                case 'music_change':
                     if (typeof AudioManager !== 'undefined' && AudioManager.playMusic) {
                        // Assumendo che la musica sia già caricata con loadSound(id, src, true)
                        AudioManager.playMusic(effect.trackId);
                    }
                    break;
                case 'trigger_ending':
                    // Questa logica dovrebbe essere gestita da Game.js o un gestore di stato superiore
                    console.log(`Effetto trigger_ending: ${effect.endingId}. Richiede gestione esterna.`);
                    document.dispatchEvent(new CustomEvent('triggerEndingEvent', { detail: { endingId: effect.endingId } }));
                    break;
                case 'chapter_progress':
                     console.log(`Effetto chapter_progress: ${effect.chapterId}. Richiede gestione esterna.`);
                     document.dispatchEvent(new CustomEvent('goToChapterEvent', { detail: { chapterId: effect.chapterId } }));
                    break;
                // Aggiungere altri tipi di effetti
                default:
                    console.warn(`NarrativeEngine: Tipo di effetto '${effect.type}' non riconosciuto.`);
            }
        });
        // Dopo aver applicato gli effetti, potrebbe essere necessario aggiornare l'UI
        // Questo di solito è gestito dal loop di gioco principale o da un gestore di eventi.
        document.dispatchEvent(new CustomEvent('gameStateChanged', { detail: { reason: 'effectsApplied' } }));
    },

    /**
     * Determina la prossima scena o azione basata sulla scelta del giocatore.
     * @param {string} currentSceneId - L'ID della scena corrente.
     * @param {string} choiceId - L'ID della scelta fatta dal giocatore.
     * @returns {string|null} L'ID della prossima scena, o null se la scelta non è valida o non porta a una nuova scena.
     */
    processPlayerChoice: function(currentSceneId, choiceId) {
        const scene = this.getSceneData(currentSceneId);
        if (!scene || !scene.choices) {
            console.error(`NarrativeEngine: Scena ${currentSceneId} o le sue scelte non trovate.`);
            return null;
        }

        const choiceMade = scene.choices.find(c => c.id === choiceId || c.choiceTextKey === choiceId); // Permette ID o textKey come identificatore
        if (!choiceMade) {
            console.warn(`NarrativeEngine: Scelta '${choiceId}' non trovata nella scena '${currentSceneId}'.`);
            // Potrebbe essere un 'default_continue' o un errore
            if (choiceId === 'default_continue' && scene.nextSceneDefault) {
                 return scene.nextSceneDefault;
            }
            return null;
        }

        // Verifica le condizioni per la scelta (sebbene questo dovrebbe essere fatto da UIManager prima di mostrare il pulsante)
        // Ma una doppia verifica qui non fa male, specialmente se le condizioni possono cambiare dinamicamente.
        if (choiceMade.conditions && !this.evaluateConditions(choiceMade.conditions)) {
            console.warn(`NarrativeEngine: Condizioni per la scelta '${choiceId}' non soddisfatte (verifica post-selezione).`);
            // Comunica all'utente che la scelta non è valida (raro se l'UI le filtra correttamente)
            UIManager.showMessage('error_choice_conditions_not_met'); // Placeholder per chiave di localizzazione
            return currentSceneId; // Rimane sulla stessa scena
        }

        // Applica gli effetti della scelta
        if (choiceMade.effects) {
            this.applyEffects(choiceMade.effects);
        }

        // Determina la scena di destinazione
        let targetSceneId = choiceMade.targetSceneId;

        // Logica speciale per le Side Quest
        // Se targetSceneId è un ID di una side quest, gestiscila.
        // Esempio: if (this.gameSideQuestsData[targetSceneId]) { ... }

        // Se la scelta avvia una side quest
        if (choiceMade.startsSideQuestId && this.gameSideQuestsData[choiceMade.startsSideQuestId]) {
            const sq = this.gameSideQuestsData[choiceMade.startsSideQuestId];
            if (sq.sceneSequence && sq.sceneSequence.length > 0) {
                this.gameState.currentSideQuest = {
                    id: sq.id,
                    currentSceneIndex: 0,
                    returnToMainSceneId: scene.id // Dove tornare dopo la side quest
                };
                targetSceneId = sq.sceneSequence[0];
                console.log(`Avvio Side Quest: ${sq.id}, prima scena: ${targetSceneId}`);
            }
        }


        if (!targetSceneId && scene.nextSceneDefault) {
            console.log(`Nessuna targetSceneId per la scelta ${choiceId}, uso nextSceneDefault: ${scene.nextSceneDefault}`);
            targetSceneId = scene.nextSceneDefault;
        } else if (!targetSceneId) {
            console.warn(`Nessuna targetSceneId specificata per la scelta ${choiceId} e nessuna nextSceneDefault per la scena ${currentSceneId}. Il gioco potrebbe bloccarsi.`);
            return null; // O gestire come un finale/errore
        }

        return targetSceneId;
    },

    /**
     * Avanza in una side quest.
     * @returns {string|null} L'ID della prossima scena della side quest, o della scena principale a cui tornare.
     */
    progressSideQuest: function() {
        if (!this.gameState.currentSideQuest) return null;

        const sqProgress = this.gameState.currentSideQuest;
        const sqData = this.gameSideQuestsData[sqProgress.id];

        if (!sqData || !sqData.sceneSequence) return sqProgress.returnToMainSceneId; // Errore o fine imprevista

        sqProgress.currentSceneIndex++;
        if (sqProgress.currentSceneIndex < sqData.sceneSequence.length) {
            // C'è un'altra scena nella side quest
            return sqData.sceneSequence[sqProgress.currentSceneIndex];
        } else {
            // Side quest completata
            console.log(`Side Quest ${sqProgress.id} completata.`);
            const returnScene = sqData.returnPoint.returnSceneIdIfCompleted || sqProgress.returnToMainSceneId;

            // Applica ricompense se definite
            if (sqData.rewardsOnCompletion && this.evaluateConditions([{type: "flag_check", flagName: sqData.returnPoint.flagForCompletion, value:true }])) { // Assumendo che il flag sia settato nell'ultima scena della SQ
                this.applyEffects(sqData.rewardsOnCompletion);
            }

            this.gameState.flags[`sq_${sqProgress.id}_completed`] = true; // Flag generico di completamento
            this.gameState.currentSideQuest = null; // Pulisce lo stato della side quest
            return returnScene;
        }
    },


    /**
     * Determina quale finale il giocatore ha raggiunto in base allo stato del gioco.
     * @returns {object|null} L'oggetto di configurazione del finale o null se nessun finale corrisponde.
     */
    determineEnding: function() {
        if (!this.gameEndingsData) return null;

        const possibleEndings = [];
        for (const endingId in this.gameEndingsData) {
            const ending = this.gameEndingsData[endingId];
            if (this.evaluateConditions(ending.conditions || [])) {
                possibleEndings.push(ending);
            }
        }

        if (possibleEndings.length === 0) {
            console.warn("Nessun finale raggiunto in base alle condizioni. Verificare la logica dei finali.");
            // Potrebbe restituire un finale di fallback/default se definito
            return this.gameEndingsData["ending_default_neutral"] || null;
        }

        // Ordina i finali per priorità (più basso = più prioritario)
        possibleEndings.sort((a, b) => (a.priority || 999) - (b.priority || 999));

        console.log(`Finale determinato: ${possibleEndings[0].id} (Priorità: ${possibleEndings[0].priority})`);
        return possibleEndings[0];
    },

    /**
     * Applica effetti all'entrata di una scena.
     * @param {string} sceneId ID della scena.
     */
    applyOnEnterSceneEffects: function(sceneId) {
        const sceneData = this.getSceneData(sceneId);
        if (sceneData && sceneData.onEnterEffects) {
            console.log(`Applicazione effetti onEnter per la scena ${sceneId}`);
            this.applyEffects(sceneData.onEnterEffects);
        }
    }

    // Altre funzioni per la gestione della progressione dei capitoli,
    // sblocco di achievement basati su flag/eventi narrativi, ecc.
};

// Per l'uso in vanilla JS, NarrativeEngine sarà globale.
// window.NarrativeEngine = NarrativeEngine; // Opzionale.
// È importante che gameState, playerStats, ecc., siano accessibili.
// E che i dati da data/*.js siano caricati e passati a initialize.## File README.md principale

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
