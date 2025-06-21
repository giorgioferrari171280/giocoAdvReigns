// script.js - Logica principale del gioco Reigns-like

/**
 * @fileoverview Script principale per il gioco di avventura testuale.
 * Gestisce lo stato del gioco, il loop di gioco (concettuale), l'interazione dell'utente
 * e la coordinazione tra i vari moduli (UI, Audio, Narrativa, Storage).
 */

// --- STATO DEL GIOCO GLOBALE ---
// Questi oggetti verranno inizializzati e manipolati durante il gioco.

/**
 * @typedef {Object} GameState
 * @property {string} currentSceneId - ID della scena attualmente visualizzata.
 * @property {string|null} currentChapterId - ID del capitolo corrente.
 * @property {Object<string, boolean>} flags - Collezione di flag narrativi (es. { "ha_parlato_al_re": true }).
 * @property {string} currentLanguage - Lingua selezionata dall'utente (es. "en", "it").
 * @property {boolean} audioEnabled - Stato dell'audio (true = ON, false = OFF).
 * @property {number} audioVolume - Volume dell'audio (da 0.0 a 1.0).
 * @property {string|null} activeSaveSlotId - ID dello slot di salvataggio attivo.
 * @property {string|null} saveName - Nome del salvataggio corrente.
 * @property {boolean} gameInitialized - Flag per indicare se il gioco è stato inizializzato.
 * @property {boolean} gameStarted - Flag per indicare se una partita è iniziata (dopo menu/intro).
 * @property {object|null} currentSideQuest - Stato della side quest attiva {id, currentSceneIndex, returnToMainSceneId}.
 * @property {Array<string>} unlockedAchievements - Array degli ID degli achievement sbloccati.
 * @property {Date|null} gameStartTime - Timestamp di quando la partita è iniziata.
 */
const gameState = {
    currentSceneId: "", // Verrà impostato all'inizio del gioco o al caricamento
    currentChapterId: null,
    flags: {},
    currentLanguage: "en", // Default, verrà sovrascritto da localStorage o pre-opzioni
    audioEnabled: true,
    audioVolume: 0.5,
    activeSaveSlotId: null,
    saveName: "",
    gameInitialized: false,
    gameStarted: false,
    currentSideQuest: null,
    unlockedAchievements: [],
    gameStartTime: null,
};

/**
 * @typedef {Object} PlayerInventoryItem
 * @property {string} id - ID dell'oggetto (corrisponde a una chiave in `gameItems`).
 * @property {number} quantity - Quantità dell'oggetto posseduta.
 * @property {object} [itemData] - Dati specifici dell'istanza dell'oggetto (raro per questo gioco).
 */
/**
 * @typedef {Object<string, PlayerInventoryItem>} PlayerInventoryCollection
 */
/**
 * Inventario del giocatore.
 * @type {{items: PlayerInventoryCollection}}
 */
const playerInventory = {
    items: {
        // Esempio:
        // "key_01": { id: "key_01", quantity: 1 },
        // "gold_coins": { id: "gold_coins", quantity: 100 }
    },
    /**
     * Aggiunge un oggetto all'inventario.
     * @param {string} itemId - ID dell'oggetto da data/items.js.
     * @param {number} [quantity=1] - Quantità da aggiungere.
     */
    addItem: function(itemId, quantity = 1) {
        if (!gameItems[itemId]) {
            console.warn(`Tentativo di aggiungere oggetto inesistente: ${itemId}`);
            return;
        }
        if (this.items[itemId]) {
            if (gameItems[itemId].stackable) {
                this.items[itemId].quantity += quantity;
            } else {
                this.items[itemId].quantity = Math.max(this.items[itemId].quantity, quantity); // Non stackabile, ma se ne prende un altro non fa nulla o sovrascrive se ha senso
            }
        } else {
            this.items[itemId] = { id: itemId, quantity: quantity };
        }
        console.log(`Aggiunto ${quantity}x ${itemId} all'inventario. Totale: ${this.items[itemId].quantity}`);
        document.dispatchEvent(new CustomEvent('inventoryChanged'));
    },
    /**
     * Rimuove un oggetto dall'inventario.
     * @param {string} itemId - ID dell'oggetto.
     * @param {number} [quantity=1] - Quantità da rimuovere.
     * @returns {boolean} True se l'oggetto è stato rimosso con successo in quantità sufficiente.
     */
    removeItem: function(itemId, quantity = 1) {
        if (this.items[itemId] && this.items[itemId].quantity >= quantity) {
            this.items[itemId].quantity -= quantity;
            if (this.items[itemId].quantity <= 0 && !gameItems[itemId].questItem) { // Non rimuovere quest items se non esplicitamente
                delete this.items[itemId];
            }
            console.log(`Rimosso ${quantity}x ${itemId} dall'inventario.`);
            document.dispatchEvent(new CustomEvent('inventoryChanged'));
            return true;
        }
        console.warn(`Tentativo di rimuovere ${quantity}x ${itemId}, ma non presente o quantità insufficiente.`);
        return false;
    },
    /**
     * Controlla se il giocatore ha un oggetto.
     * @param {string} itemId - ID dell'oggetto.
     * @param {number} [quantity=1] - Quantità minima richiesta.
     * @returns {boolean} True se l'oggetto è presente in quantità sufficiente.
     */
    hasItem: function(itemId, quantity = 1) {
        return this.items[itemId] && this.items[itemId].quantity >= quantity;
    }
};

/**
 * Statistiche del giocatore (es. carisma, forza, reputazione con fazioni).
 * @type {Object<string, number|string>}
 */
const playerStats = {
    // Esempi, da definire in base al gioco specifico:
    // karma: 0,
    // strength: 5,
    // intelligence: 5,
    // reputation_pirates: 0,
    // reputation_crown: 0,
    money: 100, // Valuta di gioco
    // health: 100, // Se ci fosse un sistema di salute
    // sanity: 100, // Per giochi horror/cthulhu
};

/**
 * Stato del mondo di gioco (es. livello di allarme, inquinamento, relazioni tra fazioni).
 * @type {Object<string, number|string|boolean>}
 */
const worldState = {
    // Esempi:
    // alarmLevel: 0, // 0: calmo, 1: sospetto, 2: allerta, 3: lockdown
    // currentKingMood: "neutral", // "happy", "neutral", "angry"
    // plagueOutbreak: false,
    // economicState: "stable" // "booming", "stable", "recession"
};


// --- FUNZIONI TEMPLATE PER LA LOGICA DI GIOCO ---

/**
 * Inizializza il gioco la prima volta che viene caricato.
 * Configura i manager, carica le preferenze, imposta la UI iniziale.
 * @async
 */
async function initializeGame() {
    console.log("Inizializzazione gioco...");

    // 0. Inizializza i riferimenti agli elementi UI
    // Questi ID devono corrispondere a quelli in index.html
    const uiElementIds = {
        gameContainer: 'game-container',
        preOptionsScreen: 'pre-options-screen',
        splashScreen: 'splash-screen',
        mainMenuScreen: 'main-menu-screen',
        gameplayScreen: 'gameplay-screen',
        optionsScreen: 'options-screen',
        creditsScreen: 'credits-screen',
        hallOfFameScreen: 'hall-of-fame-screen',
        saveLoadScreen: 'save-load-screen',
        cutsceneViewer: 'cutscene-viewer',
        inventoryScreen: 'inventory-screen',
        heroStatsScreen: 'hero-stats-screen',
        pauseMenuScreen: 'pause-menu-screen',

        gameImageElement: 'scene-image',
        storyTextElement: 'story-text',
        actionButtonsContainer: 'action-buttons-container',
        moneyDisplayElement: 'player-money-display',
        playerStatsContainer: 'player-stats-display-container',
        worldStatsContainer: 'world-stats-display-container',

        languageSelect: 'language-select', // In pre-options
        audioToggleButton: 'audio-toggle-button', // In pre-options
        volumeSlider: 'volume-slider', // In pre-options
        optionsLanguageSelect: 'options-language-select', // In options screen
        optionsAudioToggleButton: 'options-audio-toggle-button',
        optionsVolumeSlider: 'options-volume-slider',
        pauseLanguageSelect: 'pause-language-select', // In pause menu
        pauseAudioToggleButton: 'pause-audio-toggle-button',
        pauseVolumeSlider: 'pause-volume-slider',


        loadingBarElement: 'loading-bar',
        splashLoadingText: 'splash-loading-text',
        mainMenuTitle: 'main-menu-title',

        saveSlotsContainer: 'save-slots-container',
        saveNameInput: 'save-name-input',
        performSaveButton: 'perform-save-button',

        cutsceneImageElement: 'cutscene-image-element',
        cutsceneVideoElement: 'cutscene-video-element',
        cutsceneTextElement: 'cutscene-text-element',
        cutsceneNextButton: 'cutscene-next-button',

        inventoryItemsList: 'inventory-items-list',
        inventoryItemDetails: 'inventory-item-details',
        inventoryItemImage: 'inventory-item-image',
        inventoryItemName: 'inventory-item-name',
        inventoryItemDescription: 'inventory-item-description',

        heroPlayerStatsSliders: 'hero-player-stats-sliders',
        heroWorldStatsSliders: 'hero-world-stats-sliders',

        // Pulsanti specifici per navigazione/azioni
        playGameButton: 'play-game-button',
        newGameButton: 'new-game-button',
        loadGameButton: 'load-game-button',
        hallOfFameButton: 'hall-of-fame-button',
        optionsButton: 'options-button', // Menu principale
        creditsButton: 'credits-button',
        exitGameButton: 'exit-game-button',
        optionsBackButton: 'options-back-button',
        creditsBackButton: 'credits-back-button',
        hallOfFameBackButton: 'hall-of-fame-back-button',
        saveLoadBackButton: 'save-load-back-button',
        inventoryButtonIngame: 'inventory-button-ingame',
        heroStatsButtonIngame: 'hero-stats-button-ingame',
        optionsButtonIngame: 'options-button-ingame', // Pulsante opzioni nella HUD di gioco
        inventoryBackButton: 'inventory-back-button',
        heroStatsBackButton: 'hero-stats-back-button',
        pauseResumeButton: 'pause-resume-button',
        pauseBackToMainMenuButton: 'pause-back-to-main-menu-button',
    };
    UIManager.initializeUI(uiElementIds);

    // 1. Carica le preferenze utente da localStorage (lingua, audio)
    const userPrefs = StorageManager.loadUserPreferences({
        language: gameSettings.defaultLanguage || 'en',
        audioEnabled: true,
        audioVolume: 0.5
    });
    gameState.currentLanguage = userPrefs.language;
    gameState.audioEnabled = userPrefs.audioEnabled;
    gameState.audioVolume = userPrefs.audioVolume;

    // 2. Inizializza LocalizationManager
    LocalizationManager.initialize(locales, gameState.currentLanguage); // `locales` è globale da config/locales.js

    // 3. Inizializza AudioManager
    AudioManager.initialize(); // Carica stato volume/mute da localStorage (fatto internamente)
    AudioManager.setVolume(gameState.audioVolume);
    AudioManager.setMute(!gameState.audioEnabled);

    // 4. Inizializza NarrativeEngine
    NarrativeEngine.initialize(gameState, playerStats, worldState, playerInventory, gameScenes, gameChapters, gameSideQuests, gameEndings, gameItems);

    // 5. Precarica asset critici (es. musica del menu, font) - opzionale, può essere fatto dopo
    // Esempio: await AudioManager.preloadAudioList([{ id: 'menu_music', src: 'assets/audio/music/menu.mp3', isMusic: true }]);

    // 6. Imposta gli event listener globali (es. per cambio lingua, resize finestra)
    document.addEventListener('languageChanged', handleLanguageChange);
    // window.addEventListener('resize', debounce(handleWindowResize, 200)); // `debounce` da helpers.js

    // 7. Mostra la schermata di pre-opzioni o direttamente lo splash screen
    // L'HTML ha lo splash screen visibile per default.
    // Il flusso corretto è: Splash (breve) -> PreOpzioni -> (dopo click GIOCA) Splash (caricamento) -> Menu
    UIManager.hideAllScreens();
    UIManager.showScreen('splashScreen'); // Mostra lo splash iniziale brevemente
    UIManager.setLoadingBarProgress(0); // Inizia da 0
    UIManager.updateText(UIManager.splashLoadingText, 'ui_loading_text'); // Testo "Loading..."

    // Breve splash screen iniziale prima delle pre-opzioni
    let initialSplashProgress = 0;
    const initialSplashInterval = setInterval(() => {
        initialSplashProgress += 25; // Più veloce
        UIManager.setLoadingBarProgress(initialSplashProgress);
        if (initialSplashProgress >= 100) {
            clearInterval(initialSplashInterval);
            showPreOptionsScreen(); // Dopo il breve splash, mostra le pre-opzioni
        }
    }, 200); // Durata totale circa 0.8s per lo splash iniziale

    gameState.gameInitialized = true;
    console.log("Gioco inizializzato. Stato attuale:", gameState);
}

/**
 * Carica una partita salvata.
 * @param {string} slotId - L'ID dello slot da cui caricare.
 * @returns {boolean} True se il caricamento ha avuto successo, false altrimenti.
 */
function loadGame(slotId) {
    console.log(`Tentativo di caricare la partita dallo slot: ${slotId}`);
    const savedDataContainer = StorageManager.loadGameSlot(slotId);

    if (savedDataContainer && savedDataContainer.data) {
        const savedGameState = savedDataContainer.data.gameState;
        const savedPlayerStats = savedDataContainer.data.playerStats;
        const savedWorldState = savedDataContainer.data.worldState;
        const savedPlayerInventory = savedDataContainer.data.playerInventory;

        // Ripristina lo stato del gioco
        Object.assign(gameState, savedGameState);
        Object.assign(playerStats, savedPlayerStats);
        Object.assign(worldState, savedWorldState);
        // Per l'inventario, è meglio ripristinare la sua struttura interna
        playerInventory.items = savedPlayerInventory.items || {};

        gameState.activeSaveSlotId = slotId;
        gameState.saveName = savedGameState.saveName || `Salvataggio ${slotId}`;

        console.log("Partita caricata con successo:", { gameState, playerStats, worldState, playerInventory });

        // Applica le impostazioni caricate (lingua, audio)
        LocalizationManager.setLanguage(gameState.currentLanguage);
        AudioManager.setVolume(gameState.audioVolume);
        AudioManager.setMute(!gameState.audioEnabled);

        // Aggiorna l'UI per riflettere lo stato caricato
        // UIManager.updateMoneyDisplay(playerStats.money); // Esempio
        // ... altre chiamate a UIManager per aggiornare l'interfaccia

        // Porta il giocatore alla scena salvata
        goToScene(gameState.currentSceneId);
        gameState.gameStarted = true;
        return true;
    } else {
        console.error(`Errore nel caricamento della partita dallo slot: ${slotId}. Dati non trovati o corrotti.`);
        UIManager.showMessage('error_loading_game_slot_failed', {slot: slotId}); // Placeholder
        return false;
    }
}

/**
 * Salva lo stato attuale del gioco.
 * @param {string} [slotIdToSave] - L'ID dello slot in cui salvare. Se non fornito, usa gameState.activeSaveSlotId.
 * @param {string} [saveNameOverride] - Nome da dare al salvataggio, sovrascrive gameState.saveName per questo salvataggio.
 * @returns {boolean} True se il salvataggio ha avuto successo, false altrimenti.
 */
function saveGame(slotIdToSave, saveNameOverride) {
    const targetSlotId = slotIdToSave || gameState.activeSaveSlotId;
    if (!targetSlotId) {
        console.error("Tentativo di salvare senza uno slot attivo o specificato.");
        UIManager.showMessage('error_saving_no_slot_selected'); // Placeholder
        return false;
    }

    gameState.saveName = saveNameOverride || gameState.saveName || `Salvataggio ${targetSlotId}`;

    const fullGameData = {
        saveName: gameState.saveName, // Includi il nome del salvataggio nei dati stessi
        timestamp: new Date().toISOString(),
        gameState: { ...gameState }, // Copia per evitare riferimenti diretti se gameState cambia
        playerStats: { ...playerStats },
        worldState: { ...worldState },
        playerInventory: { items: { ...playerInventory.items } } // Copia profonda per l'inventario
    };

    // Rimuovi elementi che non devono essere serializzati o sono troppo grandi/dinamici
    // delete fullGameData.gameState.someLargeDynamicObject;

    console.log(`Tentativo di salvare la partita nello slot: ${targetSlotId} con nome: ${gameState.saveName}`);
    if (StorageManager.saveGameSlot(targetSlotId, fullGameData)) {
        gameState.activeSaveSlotId = targetSlotId; // Assicura che lo slot attivo sia aggiornato
        console.log("Partita salvata con successo.");
        UIManager.showMessage('ui_game_saved_successfully', {slot: targetSlotId, name: gameState.saveName}); // Placeholder
        return true;
    } else {
        console.error(`Errore durante il salvataggio della partita nello slot: ${targetSlotId}.`);
        UIManager.showMessage('error_saving_game_failed', {slot: targetSlotId}); // Placeholder
        return false;
    }
}


/**
 * Gestisce la transizione a una nuova scena.
 * @param {string} sceneId - L'ID della scena a cui passare.
 */
function goToScene(sceneId) {
    console.log(`Transizione alla scena: ${sceneId}`);
    const sceneData = NarrativeEngine.getSceneData(sceneId);

    if (!sceneData) {
        console.error(`Impossibile trovare i dati per la scena: ${sceneId}. Il gioco potrebbe bloccarsi.`);
        UIManager.showMessage('error_scene_data_not_found', { id: sceneId }); // Placeholder
        // Potrebbe tornare al menu principale o a una scena di errore
        // showMainMenu();
        return;
    }

    gameState.currentSceneId = sceneId;

    // Applica effetti "onEnter" della scena (se presenti)
    NarrativeEngine.applyOnEnterSceneEffects(sceneId);

    // Aggiorna l'UI per la nuova scena
    renderGameScene(sceneId); // Questa funzione si occuperà di chiamare UIManager

    // Logica per la progressione dei capitoli (semplificata)
    // Potrebbe essere più complesso, es. controllando se tutte le scene chiave di un capitolo sono state visitate.
    gameChapters.forEach(chapter => {
        if (chapter.sceneIds.includes(sceneId) && gameState.currentChapterId !== chapter.id) {
            gameState.currentChapterId = chapter.id;
            console.log(`Entrato nel capitolo: ${LocalizationManager.getLocalizedString(chapter.titleKey)}`);
            // Potrebbe triggerare una cutscene di inizio capitolo se chapter.openingCutsceneId è definito
            if (chapter.openingCutsceneId && gameState.flags[`played_cutscene_${chapter.openingCutsceneId}`] !== true) {
                playCutscene(chapter.openingCutsceneId, () => renderGameScene(sceneId)); // Callback per tornare alla scena dopo la cutscene
                gameState.flags[`played_cutscene_${chapter.openingCutsceneId}`] = true;
                return; // Interrompe goToScene perché la cutscene gestirà il rendering successivo
            }
        }
    });

    // Salvataggio automatico (opzionale, ma comune in questi giochi)
    if (gameState.gameStarted && gameState.activeSaveSlotId) {
        // Potrebbe essere condizionale (es. non salvare ad ogni scena, ma a scene chiave o dopo N scelte)
        // saveGame(gameState.activeSaveSlotId);
        console.log("Autosave point (logica da implementare per decidere quando salvare).");
    }
}

/**
 * Gestisce la scelta fatta dal giocatore in una scena.
 * @param {string} choiceId - L'ID della scelta effettuata.
 */
function handleChoice(choiceId) {
    console.log(`Scelta del giocatore: ${choiceId} nella scena ${gameState.currentSceneId}`);

    let nextSceneId;

    if (gameState.currentSideQuest) {
        // Se siamo in una side quest, la scelta potrebbe far avanzare la side quest
        // o essere una scelta interna alla scena della side quest.
        // NarrativeEngine.processPlayerChoice gestirà l'applicazione degli effetti.
        const sqSceneOutcome = NarrativeEngine.processPlayerChoice(gameState.currentSceneId, choiceId);
        if (sqSceneOutcome === gameState.currentSceneId) { // La scelta non ha cambiato scena (es. condizione non soddisfatta)
            return; // Non fare nulla, l'UI dovrebbe già averlo gestito
        }
        // Se sqSceneOutcome è un ID di scena, significa che è la prossima scena della side quest
        // o la scena a cui tornare. Se è null, potrebbe essere un errore.
        if (sqSceneOutcome) {
            nextSceneId = sqSceneOutcome;
            // Verifichiamo se questa scelta ha terminato la side quest
            const sqData = gameSideQuests[gameState.currentSideQuest.id];
            const currentSqSceneIndex = sqData.sceneSequence.indexOf(gameState.currentSceneId);

            if (currentSqSceneIndex === sqData.sceneSequence.length -1 || NarrativeEngine.getSceneData(nextSceneId)?.id === sqData.returnPoint.returnSceneIdIfCompleted) {
                 // Ultima scena della SQ o stiamo andando alla scena di ritorno
                 console.log(`Side quest ${gameState.currentSideQuest.id} potrebbe essere terminata.`);
                 // Applica ricompense se il flag di completamento è settato
                 if (sqData.rewardsOnCompletion && NarrativeEngine.evaluateConditions([{type: "flag_check", flagName: sqData.returnPoint.flagForCompletion, value:true }])) {
                    NarrativeEngine.applyEffects(sqData.rewardsOnCompletion);
                 }
                 gameState.flags[`sq_${gameState.currentSideQuest.id}_completed`] = true;
                 gameState.currentSideQuest = null; // Pulisce
            }

        } else {
            console.error("Errore nell'elaborazione della scelta della side quest.");
            return; // O gestisci l'errore
        }

    } else {
        // Siamo nella storia principale
        nextSceneId = NarrativeEngine.processPlayerChoice(gameState.currentSceneId, choiceId);
    }


    if (nextSceneId) {
        // Controlla se la prossima "scena" è in realtà un trigger per un finale
        if (NarrativeEngine.gameEndingsData && NarrativeEngine.gameEndingsData[nextSceneId]) {
            triggerEnding(nextSceneId);
        } else if (NarrativeEngine.getSceneData(nextSceneId)) {
            goToScene(nextSceneId);
        } else {
            console.error(`ID scena di destinazione '${nextSceneId}' non valido dopo la scelta '${choiceId}'.`);
            // Potrebbe essere un finale implicito o un errore di configurazione
            // Forse qui si dovrebbe chiamare determineEnding() se non si sa dove andare?
        }
    } else {
        // La scelta non ha portato a una nuova scena (es. errore, o la logica è gestita dagli effetti)
        // Potrebbe essere necessario aggiornare l'UI se gli effetti hanno cambiato qualcosa.
        console.log("La scelta non ha specificato una scena successiva diretta. Aggiorno UI.");
        updateUI();
    }
}

/**
 * Aggiorna tutti gli elementi dell'interfaccia utente in base allo stato corrente del gioco.
 * Chiamata dopo cambiamenti di stato significativi.
 */
function updateUI() {
    console.log("Aggiornamento UI generale...");
    // Questa è una funzione generica. Le parti specifiche dell'UI (scena, inventario, ecc.)
    // sono spesso aggiornate da funzioni più mirate come renderGameScene, showInventory.

    // Esempio: Aggiorna il display del denaro, che è globale
    if (UIManager.moneyDisplayElement) { // Verifica che UIManager e l'elemento siano pronti
        UIManager.updateMoneyDisplay(playerStats.money, 'game_money_label'); // Adattare la chiave se necessario
    }

    // Aggiorna le statistiche visibili del giocatore e del mondo (se presenti nella UI corrente)
    // Questa logica potrebbe essere meglio in renderGameScene o in funzioni specifiche per le schermate stats
    if (UIManager.playerStatsContainer && UIManager.worldStatsContainer && gameState.gameStarted) {
        // Creare una mappatura delle chiavi stat alle chiavi di localizzazione per i nomi
        const statsDisplayConfig = {
            playerStats: { /* karma: "player_stat_karma", ... */ },
            worldStats: { /* alarmLevel: "world_stat_alarm_level", ... */ }
        };
        // Popolare statsDisplayConfig dinamicamente basandosi su playerStats e worldState keys
        // e una convenzione (es. player_stat_ + key, world_stat_ + key)
        for(const key in playerStats) {
            if (key !== 'money') statsDisplayConfig.playerStats[key] = `player_stat_${key.toLowerCase()}`;
        }
        for(const key in worldState) {
            statsDisplayConfig.worldStats[key] = `world_stat_${key.toLowerCase()}`;
        }
        UIManager.updateStatsDisplay(playerStats, worldState, statsDisplayConfig);
    }

    // Aggiorna lo stato dei pulsanti globali (audio, ecc.)
    if (UIManager.audioToggleButton) UIManager.updateText(UIManager.audioToggleButton, gameState.audioEnabled ? 'ui_audio_on_label' : 'ui_audio_off_label'); // Placeholder keys
    if (UIManager.optionsAudioToggleButton) UIManager.updateText(UIManager.optionsAudioToggleButton, gameState.audioEnabled ? 'ui_audio_on_label' : 'ui_audio_off_label');
    if (UIManager.pauseAudioToggleButton) UIManager.updateText(UIManager.pauseAudioToggleButton, gameState.audioEnabled ? 'ui_audio_on_label' : 'ui_audio_off_label');

    if (UIManager.volumeSlider) UIManager.volumeSlider.value = gameState.audioVolume;
    if (UIManager.optionsVolumeSlider) UIManager.optionsVolumeSlider.value = gameState.audioVolume;
    if (UIManager.pauseVolumeSlider) UIManager.pauseVolumeSlider.value = gameState.audioVolume;


    // Potrebbe aggiornare dinamicamente i testi che dipendono dalla lingua se non già gestito da languageChanged event
    // Esempio: UIManager.updateText(UIManager.mainMenuTitle, 'main_menu_title');
}

/**
 * Avanza al capitolo successivo (logica di base).
 * @param {string} [chapterId] - ID del capitolo a cui avanzare. Se omesso, cerca il prossimo.
 */
function nextChapter(chapterId) {
    // Questa funzione è più concettuale. La progressione dei capitoli è spesso
    // gestita da goToScene e dalla struttura dati di chapters.js (es. cutscene di chiusura/apertura).
    console.log(`Tentativo di avanzare al capitolo ${chapterId || 'successivo'}`);
    let targetChapterId = chapterId;
    if (!targetChapterId) {
        const currentChapterIndex = gameChapters.findIndex(ch => ch.id === gameState.currentChapterId);
        if (currentChapterIndex !== -1 && currentChapterIndex < gameChapters.length - 1) {
            targetChapterId = gameChapters[currentChapterIndex + 1].id;
        } else {
            console.log("Nessun capitolo successivo trovato o già all'ultimo capitolo.");
            // Potrebbe significare la fine del gioco -> triggerEnding()
            triggerEnding(); // Chiama il calcolo del finale
            return;
        }
    }

    const chapterData = gameChapters.find(ch => ch.id === targetChapterId);
    if (chapterData) {
        gameState.currentChapterId = targetChapterId;
        // Mostra cutscene di apertura capitolo, poi vai alla prima scena del capitolo
        if (chapterData.openingCutsceneId) {
            playCutscene(chapterData.openingCutsceneId, () => {
                if (chapterData.sceneIds && chapterData.sceneIds.length > 0) {
                    goToScene(chapterData.sceneIds[0]);
                } else {
                     console.error(`Capitolo ${targetChapterId} non ha scene definite!`);
                }
            });
        } else if (chapterData.sceneIds && chapterData.sceneIds.length > 0) {
            goToScene(chapterData.sceneIds[0]);
        } else {
            console.error(`Capitolo ${targetChapterId} non ha cutscene di apertura né scene definite!`);
        }
    } else {
        console.error(`Dati per il capitolo ${targetChapterId} non trovati.`);
    }
}

/**
 * Attiva un finale specifico o determina quale finale mostrare.
 * @param {string} [endingId] - L'ID del finale da attivare. Se omesso, viene determinato.
 */
function triggerEnding(endingId) {
    console.log(`Trigger finale: ${endingId || '(da determinare)'}`);
    let finalEnding;

    if (endingId && NarrativeEngine.gameEndingsData[endingId]) {
        finalEnding = NarrativeEngine.gameEndingsData[endingId];
    } else {
        finalEnding = NarrativeEngine.determineEnding();
    }

    if (finalEnding) {
        console.log(`Finale scelto: ${finalEnding.id} - ${LocalizationManager.getLocalizedString(finalEnding.titleKey)}`);
        gameState.gameStarted = false; // La partita è "finita"
        // Salva lo stato finale del giocatore per la Hall of Fame
        updateHallOfFame(finalEnding.id);

        // Riproduci la sequenza di cutscene del finale
        if (finalEnding.cutsceneSequenceIds && finalEnding.cutsceneSequenceIds.length > 0) {
            playCutsceneSequence(finalEnding.cutsceneSequenceIds, () => {
                // Dopo le cutscene del finale, mostra la Hall of Fame
                showHallOfFame();
            });
        } else {
            // Se non ci sono cutscene, mostra comunque un messaggio e poi la Hall of Fame
            UIManager.showMessage(finalEnding.descriptionKey || 'ending_generic_description', {}, 'info'); // Placeholder
            showHallOfFame();
        }
        // Sblocca achievement legato al finale, se presente
        if (finalEnding.unlocksAchievementId) {
            unlockAchievement(finalEnding.unlocksAchievementId);
        }

    } else {
        console.error("Impossibile determinare o trovare un finale valido.");
        UIManager.showMessage('error_no_ending_found'); // Placeholder
        showMainMenu(); // Torna al menu principale come fallback
    }
}

// --- FUNZIONI DI GESTIONE SCHERMATE E FLUSSO UTENTE ---

/**
 * Mostra la schermata di pre-opzioni all'avvio del gioco.
 */
function showPreOptionsScreen() {
    UIManager.showScreen('preOptionsScreen');
    UIManager.updateText(UIManager.preOptionsScreen.querySelector('h2'), 'pre_options_title');
    UIManager.updateText(UIManager.languageSelect.labels[0], 'ui_language_select_label'); // Assumendo label associata
    UIManager.updateText(UIManager.volumeSlider.labels[0], 'ui_volume_label'); // Assumendo label associata
    UIManager.updateText(UIManager.playGameButton, 'ui_play_button');


    // Popola il select della lingua
    const languages = LocalizationManager.getAvailableLanguages();
    UIManager.populateLanguageOptions(languages, gameState.currentLanguage);
    if (UIManager.languageSelect) UIManager.languageSelect.value = gameState.currentLanguage;

    // Imposta i valori iniziali per audio e volume
    if (UIManager.audioToggleButton) UIManager.updateText(UIManager.audioToggleButton, gameState.audioEnabled ? 'ui_audio_status_on' : 'ui_audio_status_off'); // Placeholder keys
    if (UIManager.volumeSlider) UIManager.volumeSlider.value = gameState.audioVolume;

    // Pulisci e riattacca listener per evitare duplicazioni
    // Nota: .onclick sovrascrive, quindi non c'è bisogno di cloneNode se si usa solo .onclick
    // Ma se si usasse addEventListener, la clonazione o la rimozione esplicita sarebbero necessarie.

    UIManager.playGameButton.onclick = () => {
        AudioManager.playSound('sfx_ui_click'); // Suono al click
        // Salva le preferenze scelte
        StorageManager.saveUserPreferences({
            language: gameState.currentLanguage,
            audioEnabled: gameState.audioEnabled,
            audioVolume: gameState.audioVolume
        });
        // Ora mostra lo splash screen di caricamento "reale"
        showSplashScreen(true); // true indica che è lo splash screen pre-menu
    };

    if(UIManager.languageSelect) {
        UIManager.languageSelect.onchange = (event) => {
            gameState.currentLanguage = event.target.value;
            LocalizationManager.setLanguage(gameState.currentLanguage);
            // I testi della preOptionsScreen stessa dovrebbero aggiornarsi tramite l'evento 'languageChanged'
            // che viene emesso da LocalizationManager.setLanguage.
            // Assicurati che handleLanguageChange() aggiorni i testi di questa schermata se è visibile.
        };
    }
    if(UIManager.audioToggleButton) {
        UIManager.audioToggleButton.onclick = () => {
            gameState.audioEnabled = !gameState.audioEnabled;
            AudioManager.setMute(!gameState.audioEnabled);
            // Aggiorna il testo del pulsante e salva la preferenza
            UIManager.updateText(UIManager.audioToggleButton, gameState.audioEnabled ? 'ui_audio_status_on' : 'ui_audio_status_off');
            StorageManager.saveUserPreferences( { ...StorageManager.loadUserPreferences(), audioEnabled: gameState.audioEnabled });
            AudioManager.playSound('sfx_ui_click');
        };
    }
    if(UIManager.volumeSlider) {
        UIManager.volumeSlider.oninput = (event) => { // oninput per aggiornamento live
            gameState.audioVolume = parseFloat(event.target.value);
            AudioManager.setVolume(gameState.audioVolume);
        };
        UIManager.volumeSlider.onchange = () => { // onchange per salvare quando si rilascia
             StorageManager.saveUserPreferences( { ...StorageManager.loadUserPreferences(), audioVolume: gameState.audioVolume });
             AudioManager.playSound('sfx_ui_click'); // Feedback sonoro al cambio volume
        };
    }
}

/**
 * Mostra lo splash screen (simulazione caricamento).
 * @param {boolean} [isPreMenuSplash=false] - Se true, dopo lo splash mostra il menu principale.
 *                                            Se false (o omesso), è lo splash iniziale prima delle pre-opzioni.
 */
function showSplashScreen(isPreMenuSplash = false) {
    UIManager.showScreen('splashScreen');
    UIManager.setLoadingBarProgress(0); // Resetta la barra
    UIManager.updateText(UIManager.splashLoadingText, 'ui_loading_text');

    if (!isPreMenuSplash) { // Questo è lo splash iniziale brevissimo, gestito da initializeGame
        return;
    }

    // Questo è lo splash screen di "caricamento" prima del menu principale (dura 5-6 secondi)
    let progress = 0;
    const targetDuration = 5500; // 5.5 secondi
    const updatesPerSecond = 10;
    const increment = 100 / (targetDuration / 1000 * updatesPerSecond);

    const interval = setInterval(() => {
        progress += increment;
        if (progress >= 100) {
            progress = 100;
            UIManager.setLoadingBarProgress(progress);
            clearInterval(interval);

            // Precaricamento audio principale (musica menu, click UI)
            AudioManager.preloadAudioList([
                { id: 'sfx_ui_click', src: 'assets/audio/sfx/placeholder_click.mp3' }, // Placeholder
                { id: 'music_main_menu', src: 'assets/audio/music/placeholder_menu_theme.mp3', isMusic: true } // Placeholder
                // Aggiungere qui altri asset critici da precaricare per il menu e l'inizio del gioco
            ]).then(() => {
                console.log("Audio e asset base precaricati.");
                showMainMenu();
            }).catch(err => {
                console.error("Errore precaricamento audio/asset:", err);
                showMainMenu(); // Continua comunque
            });
        }
        UIManager.setLoadingBarProgress(progress);
    }, 1000 / updatesPerSecond);
}


/**
 * Mostra il menu principale.
 */
function showMainMenu() {
    UIManager.showScreen('mainMenuScreen');
    // Aggiorna i testi del menu in base alla lingua
    UIManager.updateText(UIManager.mainMenuTitle, 'main_menu_title'); // Assumendo che il titolo sia un h1 con ID in UIManager
    UIManager.updateText(UIManager.newGameButton, 'ui_new_game_button');
    UIManager.updateText(UIManager.loadGameButton, 'ui_load_game_button');
    UIManager.updateText(UIManager.hallOfFameButton, 'ui_hall_of_fame_button');
    UIManager.updateText(UIManager.optionsButton, 'ui_options_button');
    UIManager.updateText(UIManager.creditsButton, 'ui_credits_button');
    UIManager.updateText(UIManager.exitGameButton, 'ui_exit_game_button');

    // Logica per la musica del menu
    AudioManager.playMusic('music_main_menu', true); // Assumendo 'music_main_menu' sia stato precaricato

    // Aggiungi event listener ai pulsanti del menu (una sola volta)
    // Si usa .onclick per semplicità, sovrascrive eventuali listener precedenti.
    UIManager.newGameButton.onclick = () => {
        AudioManager.playSound('sfx_ui_click');
        startNewGame();
    };
    UIManager.loadGameButton.onclick = () => {
        AudioManager.playSound('sfx_ui_click');
        loadSavedGame(); // Chiama la funzione wrapper che mostrerà gli slot
    };
    UIManager.hallOfFameButton.onclick = () => {
        AudioManager.playSound('sfx_ui_click');
        showHallOfFame();
    };
    UIManager.optionsButton.onclick = () => {
        AudioManager.playSound('sfx_ui_click');
        showOptionsScreen(true); // true indica che torniamo al menu principale
    };
    UIManager.creditsButton.onclick = () => {
        AudioManager.playSound('sfx_ui_click');
        showCredits();
    };
    UIManager.exitGameButton.onclick = () => {
        AudioManager.playSound('sfx_ui_click');
        // Non c'è un vero "exit" nel browser, si può reindirizzare o chiudere la finestra se aperta da JS
        // Per questo MVP, reindirizziamo come da richiesta
        window.location.href = 'https://www.google.com';
    };
}

/**
 * Avvia una nuova partita.
 * Chiede di selezionare uno slot di salvataggio.
 */
function startNewGame() {
    console.log("Avvio nuova partita...");
    // Mostra la schermata di selezione/creazione slot di salvataggio in modalità "nuova partita"
    showSaveLoadSlots(true); // true per isNewGameMode
}

/**
 * Carica una partita salvata (funzione wrapper per la UI).
 * Mostra la schermata di selezione slot in modalità "caricamento".
 */
function loadSavedGame() {
    console.log("Apertura schermata caricamento partita...");
    showSaveLoadSlots(false); // false per isNewGameMode (quindi è modalità caricamento)
}


/**
 * Mostra la schermata della Hall of Fame.
 */
function showHallOfFame() {
    UIManager.showScreen('hallOfFameScreen');
    UIManager.updateText(UIManager.hallOfFameScreen.querySelector('h2'), 'hall_of_fame_title');
    UIManager.updateText(UIManager.hallOfFameBackButton, 'ui_back_button');

    const entries = StorageManager.loadHallOfFame();
    const container = UIManager.hallOfFameScreen.querySelector('#hall-of-fame-entries'); // Assumendo ID
    container.innerHTML = ''; // Pulisce

    if (entries.length === 0) {
        container.innerHTML = `<p>${LocalizationManager.getLocalizedString('hall_of_fame_no_entries')}</p>`;
    } else {
        // Ordina per score (o achievementsUnlocked) e poi per data
        entries.sort((a,b) => (b.score || b.achievementsUnlocked || 0) - (a.score || a.achievementsUnlocked || 0) || new Date(b.dateCompleted) - new Date(a.dateCompleted));

        const rankLabel = LocalizationManager.getLocalizedString('hall_of_fame_player_rank');
        const nameLabel = LocalizationManager.getLocalizedString('hall_of_fame_player_name');
        const scoreLabel = LocalizationManager.getLocalizedString('hall_of_fame_player_score');

        const header = createElement('div', 'hall-of-fame-entry header-entry');
        header.innerHTML = `<span>${rankLabel}</span><span>${nameLabel}</span><span>${scoreLabel}</span>`;
        container.appendChild(header);

        entries.slice(0, 20).forEach((entry, index) => { // Mostra solo i top 20
            const entryDiv = createElement('div', 'hall-of-fame-entry');
            // Qui si potrebbe aggiungere un event listener per mostrare gli achievement specifici di `entry`
            entryDiv.innerHTML = `<span>${index + 1}.</span><span>${entry.playerName}</span><span>${entry.achievementsUnlocked} (${entry.score || 0} pts)</span>`;
            // entryDiv.onclick = () => showPlayerAchievementsDetail(entry.unlockedAchievementIds); // Funzione da implementare
            container.appendChild(entryDiv);
        });
    }
    UIManager.hallOfFameBackButton.onclick = ()_JS_GAME_OBJECT_START_ AudioManager.playSound('sfx_ui_click'); showMainMenu(); _JS_GAME_OBJECT_END_;
}

/**
 * Mostra la schermata delle opzioni.
 * @param {boolean} fromMainMenu - Indica se si accede dal menu principale (per il pulsante Indietro).
 */
function showOptionsScreen(fromMainMenu = false) {
    UIManager.showScreen('optionsScreen');
    UIManager.updateText(UIManager.optionsScreen.querySelector('h2'), 'options_screen_title');
    UIManager.updateText(UIManager.optionsBackButton, 'ui_back_button');

    // Popola lingua
    const languages = LocalizationManager.getAvailableLanguages();
    UIManager.populateLanguageOptions(languages, gameState.currentLanguage); // Usa il select specifico delle opzioni
    if (UIManager.optionsLanguageSelect) UIManager.optionsLanguageSelect.value = gameState.currentLanguage;

    // Imposta valori audio/volume
    if (UIManager.optionsAudioToggleButton) UIManager.updateText(UIManager.optionsAudioToggleButton, gameState.audioEnabled ? 'ui_audio_on_label' : 'ui_audio_off_label');
    if (UIManager.optionsVolumeSlider) UIManager.optionsVolumeSlider.value = gameState.audioVolume;

    // Event Listeners (specifici per questa schermata)
    if(UIManager.optionsLanguageSelect) {
        UIManager.optionsLanguageSelect.onchange = (event) => {
            gameState.currentLanguage = event.target.value;
            LocalizationManager.setLanguage(gameState.currentLanguage);
            StorageManager.saveUserPreferences( { ...StorageManager.loadUserPreferences(), language: gameState.currentLanguage });
        };
    }
    if(UIManager.optionsAudioToggleButton) {
        UIManager.optionsAudioToggleButton.onclick = () => {
            gameState.audioEnabled = !gameState.audioEnabled;
            AudioManager.setMute(!gameState.audioEnabled);
            StorageManager.saveUserPreferences( { ...StorageManager.loadUserPreferences(), audioEnabled: gameState.audioEnabled });
            updateUI(); // Aggiorna testo pulsante
        };
    }
    if(UIManager.optionsVolumeSlider){
        UIManager.optionsVolumeSlider.oninput = (event) => {
            gameState.audioVolume = parseFloat(event.target.value);
            AudioManager.setVolume(gameState.audioVolume);
            // Salva il volume con un debounce per non scrivere troppo spesso su localStorage
            // Per ora, salviamo subito. In un gioco reale, usare debounce.
            StorageManager.saveUserPreferences( { ...StorageManager.loadUserPreferences(), audioVolume: gameState.audioVolume });
        };
    }

    UIManager.optionsBackButton.onclick = ()_JS_GAME_OBJECT_START_
        AudioManager.playSound('sfx_ui_click');
        if (fromMainMenu) {
            showMainMenu();
        } else {
            // Se si è in gioco, torna al menu di pausa o al gioco (da definire)
            showPauseMenu(); // O direttamente a UIManager.showScreen('gameplayScreen');
        }
    _JS_GAME_OBJECT_END_;
}

/**
 * Mostra la schermata dei crediti.
 */
function showCredits() {
    UIManager.showScreen('creditsScreen');
    UIManager.updateText(UIManager.creditsScreen.querySelector('h2'), 'credits_screen_title');
    UIManager.updateText(UIManager.creditsBackButton, 'ui_back_button');
    // Popola i testi dei crediti (potrebbero essere anch'essi localizzati)
    const creditsContent = UIManager.creditsScreen.querySelector('#credits-content'); // Assumendo ID
    if (creditsContent) {
        // I testi dei crediti possono essere lunghi, quindi potrebbero essere caricati da un file o da una sezione dedicata in locales.js
        let creditsHTML = `<p>${LocalizationManager.getLocalizedString('credits_developed_by', { name: "Il Tuo Nome/Studio" })}</p>`;
        creditsHTML += `<p>${LocalizationManager.getLocalizedString('credits_story_by', { name: "Nome Scrittore" })}</p>`;
        // ... altri crediti ...
        creditsHTML += `<p>Powered by Vanilla JavaScript, HTML5, CSS3</p>`;
        creditsContent.innerHTML = creditsHTML;
    }
    UIManager.creditsBackButton.onclick = ()_JS_GAME_OBJECT_START_ AudioManager.playSound('sfx_ui_click'); showMainMenu(); _JS_GAME_OBJECT_END_;
}


/**
 * Mostra la schermata per selezionare uno slot di salvataggio/caricamento.
 * @param {boolean} isNewGameMode - True se si sta iniziando una nuova partita (quindi modalità "scegli slot per salvare").
 *                                  False se si sta caricando una partita esistente.
 */
function showSaveLoadSlots(isNewGameMode) {
    UIManager.showScreen('saveLoadScreen');
    const titleKey = isNewGameMode ? 'save_load_screen_title_save_new' : 'save_load_screen_title_load'; // Nuova chiave per "Scegli slot per Nuova Partita"
    UIManager.updateText(UIManager.saveLoadScreen.querySelector('h2'), titleKey);
    UIManager.updateText(UIManager.saveLoadBackButton, 'ui_back_button');

    const slots = StorageManager.getAllSaveSlotsInfo(gameSettings.maxSaveSlots);
    const container = UIManager.saveSlotsContainer;
    container.innerHTML = ''; // Pulisce

    slots.forEach((slot, index) => {
        const slotId = `slot_${index + 1}`;
        const slotDiv = createElement('div', 'save-slot');
        slotDiv.setAttribute('data-slot-id', slotId);

        const infoDiv = createElement('div', 'save-slot-info');
        if (slot) {
            infoDiv.textContent = `${slot.name} - ${new Date(slot.timestamp).toLocaleString(gameState.currentLanguage)}`;
        } else {
            infoDiv.textContent = LocalizationManager.getLocalizedString('ui_empty_slot');
            slotDiv.classList.add('empty-slot');
        }
        slotDiv.appendChild(infoDiv);

        const actionsDiv = createElement('div', 'save-slot-actions');
        if (isNewGameMode) { // Modalità Nuova Partita: pulsante "Scegli Slot"
            const chooseSlotButton = createElement('button', 'action-button', {}, LocalizationManager.getLocalizedString('ui_choose_slot_button')); // Placeholder key
            chooseSlotButton.onclick = () => handleSlotSelectionForNewGame(slotId, slot);
            actionsDiv.appendChild(chooseSlotButton);
        } else { // Modalità Caricamento
            if (slot) {
                const loadButton = createElement('button', 'action-button', {}, LocalizationManager.getLocalizedString('ui_load_button'));
                loadButton.onclick = () => {
                    AudioManager.playSound('sfx_ui_click');
                    if (loadGame(slotId)) {
                        // goToScene è chiamato da loadGame
                    }
                };
                actionsDiv.appendChild(loadButton);
            }
        }
        // Pulsante Elimina (sempre presente se lo slot non è vuoto)
        if (slot) {
            const deleteButton = createElement('button', 'action-button delete', {}, LocalizationManager.getLocalizedString('ui_delete_button'));
            deleteButton.onclick = () => {
                AudioManager.playSound('sfx_ui_click');
                if (confirm(LocalizationManager.getLocalizedString('ui_confirm_delete_save', {name: slot.name}))) {
                    StorageManager.deleteGameSlot(slotId);
                    showSaveLoadSlots(isNewGameMode); // Ricarica la lista
                }
            };
            actionsDiv.appendChild(deleteButton);
        }
        slotDiv.appendChild(actionsDiv);
        container.appendChild(slotDiv);
    });

    // Gestione input nome salvataggio per modalità salvataggio
    if (isSavingMode) {
        UIManager.saveNameInput.style.display = 'block';
        UIManager.saveNameInput.value = gameState.saveName || `Partita ${new Date().toLocaleDateString()}`;
        // Il pulsante "Salva" generale è nascosto, si usano i pulsanti per slot
        // UIManager.performSaveButton.style.display = 'block';
        // UIManager.updateText(UIManager.performSaveButton, 'ui_save_button');
        // UIManager.performSaveButton.onclick = () => { /* Logica per salvare in slot selezionato o nuovo */ };
    } else {
        UIManager.saveNameInput.style.display = 'none';
        // UIManager.performSaveButton.style.display = 'none';
    }

    UIManager.saveLoadBackButton.onclick = ()_JS_GAME_OBJECT_START_
        AudioManager.playSound('sfx_ui_click');
        // Se stavamo iniziando una nuova partita e torniamo indietro, torniamo al menu principale.
        // Se stavamo caricando, torniamo al menu principale.
        // Se stavamo salvando dal menu di pausa, torniamo al menu di pausa.
        if (gameState.gameStarted && isSavingMode) { // Salvataggio da menu pausa
            showPauseMenu();
        } else { // Nuova partita, caricamento, o annullamento da menu principale
            showMainMenu();
        }
    _JS_GAME_OBJECT_END_;
}

/**
 * Gestore per il salvataggio in uno slot specifico dalla UI di showSaveLoadScreen.
 * @param {string} slotId L'ID dello slot (es. "slot_1").
 * @param {object|null} existingSlotData Dati dello slot esistente, null se vuoto.
 */
function handleSaveToSlot(slotId, existingSlotData) {
    AudioManager.playSound('sfx_ui_click');
    const saveName = UIManager.saveNameInput.value.trim() || `Salvataggio ${slotId}`;

    if (existingSlotData) {
        if (!confirm(LocalizationManager.getLocalizedString('ui_overwrite_save_confirm', {name: existingSlotData.name}))) {
            return; // Utente ha annullato la sovrascrittura
        }
    }

    if (!gameState.gameStarted) { // Se stiamo iniziando una Nuova Partita
        // Inizializza lo stato del gioco per una nuova partita
        Object.assign(gameState, { // Resetta gameState parzialmente
            currentSceneId: gameSettings.initialSceneId || "scene_01_start", // Da gameConfig.js o hardcoded
            currentChapterId: gameSettings.initialChapterId || null, // Da gameConfig.js
            flags: {},
            gameStarted: true,
            currentSideQuest: null,
            unlockedAchievements: [],
            gameStartTime: new Date(),
            // Non resettare lingua, audio, volume che sono preferenze utente
            activeSaveSlotId: slotId, // Imposta lo slot attivo
            saveName: saveName
        });
        Object.assign(playerStats, gameSettings.initialPlayerStats || { money: 100 }); // Resetta playerStats
        Object.assign(worldState, gameSettings.initialWorldState || {});   // Resetta worldState
        playerInventory.items = {}; // Resetta inventario

        console.log("Nuova partita creata e pronta per il primo salvataggio.");
        saveGame(slotId, saveName); // Salva lo stato iniziale
        // Dopo il salvataggio, avvia il gioco con la cutscene introduttiva
        const introCutsceneId = gameSettings.introCutsceneId || "cutscene_intro_game"; // Da config
        playCutscene(introCutsceneId, () => goToScene(gameState.currentSceneId));

    } else { // Se stiamo salvando una partita esistente (es. dal menu di pausa)
        gameState.activeSaveSlotId = slotId; // Potrebbe cambiare slot
        saveGame(slotId, saveName);
        showSaveLoadScreen(true); // Ricarica la schermata per mostrare il salvataggio aggiornato
    }
}


/**
 * Riproduce una cutscene.
 * @param {string} cutsceneId - L'ID della cutscene da `data/cutscenes.js`.
 * @param {function} [onCompleteCallback] - Funzione da chiamare al termine della cutscene.
 */
function playCutscene(cutsceneId, onCompleteCallback) {
    const cutsceneData = gameCutscenes[cutsceneId];
    if (!cutsceneData || !cutsceneData.screens || cutsceneData.screens.length === 0) {
        console.error(`Cutscene con ID '${cutsceneId}' non trovata o vuota.`);
        if (onCompleteCallback) onCompleteCallback();
        return;
    }
    console.log(`Riproduzione cutscene: ${cutsceneId}`);
    UIManager.showScreen('cutsceneViewer');

    const firstScreenSoundtrack = cutsceneData.screens[0].soundtrackId;
    const muteMusicDuringCutscenes = gameSettings.hasOwnProperty('muteMusicDuringCutscenes') ? gameSettings.muteMusicDuringCutscenes : true;

    if (firstScreenSoundtrack || muteMusicDuringCutscenes) {
         AudioManager.stopMusic();
    }

    let currentScreenIndex = 0;
    let autoProceedTimeout = null;

    // Assicurati che il pulsante Next sia inizialmente abilitato se la prima schermata non ha durata
    if (UIManager.cutsceneNextButton) {
        UIManager.cutsceneNextButton.disabled = !!(cutsceneData.screens[0].duration && cutsceneData.screens[0].duration > 0);
    }


    function showNextCutsceneScreen() {
        if (autoProceedTimeout) clearTimeout(autoProceedTimeout);

        if (currentScreenIndex >= cutsceneData.screens.length) {
            if (UIManager.cutsceneVideoElement && UIManager.cutsceneVideoElement.src) {
                UIManager.cutsceneVideoElement.pause();
                UIManager.cutsceneVideoElement.removeAttribute('src');
                UIManager.cutsceneVideoElement.load();
                UIManager.updateVideo(UIManager.cutsceneVideoElement, null);
            }

            const nextSceneId = cutsceneData.nextSceneAfterEnd;
            const nextCutsceneId = cutsceneData.nextCutsceneIdAfterEnd;

            // Non tentare di riprodurre musica qui, lascia che la prossima scena/cutscene/callback la gestisca
            // per evitare conflitti o interruzioni indesiderate.

            if (nextSceneId) {
                goToScene(nextSceneId);
            } else if (nextCutsceneId) {
                playCutscene(nextCutsceneId, onCompleteCallback);
            } else if (onCompleteCallback) {
                onCompleteCallback();
            } else {
                showMainMenu();
            }
            return;
        }

        const screen = cutsceneData.screens[currentScreenIndex];
        UIManager.updateImage(UIManager.cutsceneImageElement, screen.imageId || null);
        UIManager.updateVideo(UIManager.cutsceneVideoElement, screen.videoId || null);

        if (UIManager.cutsceneVideoElement && screen.videoId) {
            UIManager.cutsceneVideoElement.currentTime = 0;
            UIManager.cutsceneVideoElement.play().catch(e => console.warn("Video autoplay bloccato o errore:", e));
        } else if (UIManager.cutsceneVideoElement && !screen.videoId && UIManager.cutsceneVideoElement.hasAttribute('src') && UIManager.cutsceneVideoElement.src !== "") {
             // Solo se c'era un video prima e ora non c'è, pulisci
             UIManager.cutsceneVideoElement.pause();
             UIManager.cutsceneVideoElement.removeAttribute('src');
             UIManager.cutsceneVideoElement.load();
             UIManager.updateVideo(UIManager.cutsceneVideoElement, null);
        }

        UIManager.updateText(UIManager.cutsceneTextElement, screen.textKey);

        if (screen.soundtrackId && AudioManager.currentMusicId !== screen.soundtrackId) {
            AudioManager.playMusic(screen.soundtrackId, true);
        } else if (!screen.soundtrackId && currentScreenIndex === 0 && AudioManager.currentMusicId && muteMusicDuringCutscenes) {
            // Già gestito. Se la prima schermata non ha musica, la musica di gioco è stata fermata.
        }


        if (screen.sfx && screen.sfx.length > 0) {
            screen.sfx.forEach(sfx => {
                setTimeout(() => AudioManager.playSound(sfx.soundId), sfx.delay || 0);
            });
        }

        UIManager.updateText(UIManager.cutsceneNextButton, screen.duration && screen.duration > 0 ? LocalizationManager.getLocalizedString('ui_auto_proceeding') : LocalizationManager.getLocalizedString('ui_next_button'));
        UIManager.cutsceneNextButton.disabled = !!(screen.duration && screen.duration > 0);

        if (screen.duration && screen.duration > 0) {
            autoProceedTimeout = setTimeout(() => {
                // Verifica aggiuntiva per evitare che il timeout scatti se l'utente ha già navigato via
                if (UIManager.cutsceneViewer.style.display !== 'none' && screen === cutsceneData.screens[currentScreenIndex]) {
                    currentScreenIndex++;
                    if (UIManager.cutsceneVideoElement && UIManager.cutsceneVideoElement.src) UIManager.cutsceneVideoElement.pause();
                    showNextCutsceneScreen();
                }
            }, screen.duration);
        }

        // Listener per il pulsante Next
        UIManager.cutsceneNextButton.onclick = () => {
            if (UIManager.cutsceneNextButton.disabled) return; // Non fare nulla se il pulsante è disabilitato (es. durante auto-proceed)

            AudioManager.playSound('sfx_ui_click');
            currentScreenIndex++;
            if (UIManager.cutsceneVideoElement && UIManager.cutsceneVideoElement.src) UIManager.cutsceneVideoElement.pause();
            showNextCutsceneScreen();
        };
    }
    showNextCutsceneScreen();
}

/**
 * Riproduce una sequenza di cutscene.
 * @param {string[]} cutsceneIds - Array di ID delle cutscene da riprodurre in ordine.
 * @param {function} [onSequenceCompleteCallback] - Funzione da chiamare al termine dell'intera sequenza.
 */
function playCutsceneSequence(cutsceneIds, onSequenceCompleteCallback) {
    let currentCutsceneInSequenceIndex = 0;

    function playNextInSequence() {
        if (currentCutsceneInSequenceIndex >= cutsceneIds.length) {
            if (onSequenceCompleteCallback) onSequenceCompleteCallback();
            return;
        }
        const nextCutsceneId = cutsceneIds[currentCutsceneInSequenceIndex];
        currentCutsceneInSequenceIndex++;
        playCutscene(nextCutsceneId, playNextInSequence); // Chiama playNextInSequence come callback
    }
    playNextInSequence();
}


/**
 * Renderizza la schermata di gioco principale per una data scena.
 * @param {string} sceneId - L'ID della scena da renderizzare.
 */
function renderGameScene(sceneId) {
    const sceneData = NarrativeEngine.getSceneData(sceneId);
    if (!sceneData) {
        console.error(`Dati scena non trovati per ${sceneId} in renderGameScene.`);
        UIManager.showMessage('error_scene_data_not_found', {id: sceneId});
        showMainMenu(); // Fallback
        return;
    }

    UIManager.showScreen('gameplayScreen');
    // gameState.currentSceneId è già stato impostato da goToScene, che chiama questa funzione.

    // Aggiorna immagine di sfondo
    UIManager.updateImage(UIManager.gameImageElement, sceneData.backgroundImage || gameSettings.defaultBackgroundImage || "assets/images/locations/placeholder_default.jpg");

    // Aggiorna testo narrativo
    UIManager.updateText(UIManager.storyTextElement, sceneData.narrativeTextKey);

    // Aggiorna musica di scena
    const targetMusic = sceneData.musicTrack || gameSettings.defaultAmbientMusic || null;
    if (targetMusic && AudioManager.currentMusicId !== targetMusic) {
        AudioManager.playMusic(targetMusic, true);
    } else if (!targetMusic && AudioManager.currentMusicId && AudioManager.currentMusicId !== (gameSettings.defaultAmbientMusic || "")) {
        // Se la scena non ha musica specifica, e la musica corrente non è quella ambientale di default,
        // potremmo volerla fermare o passare a quella ambientale.
        // Per ora, la musica precedente continua se non specificato diversamente.
    }

    // Filtra e visualizza le scelte disponibili
    const availableChoices = (sceneData.choices || []).filter(choice => {
        if (!choice.id) choice.id = toKebabCase(choice.choiceTextKey || `choice-${Math.random().toString(36).substr(2, 9)}`);
        return NarrativeEngine.evaluateConditions(choice.conditions || []);
    });

    if (availableChoices.length === 0 && sceneData.nextSceneDefault) {
         const continueChoice = {
            id: 'default_continue_action',
            choiceTextKey: 'ui_continue_button',
            targetSceneId: sceneData.nextSceneDefault
         };
         UIManager.renderActionButtons([continueChoice], handleChoice);
    } else if (availableChoices.length === 0 && !sceneData.isPlayerControllable && sceneData.autoProceedDelay && sceneData.nextSceneDefault) {
        console.log(`Scena ${sceneId} avanza automaticamente a ${sceneData.nextSceneDefault} dopo ${sceneData.autoProceedDelay}ms.`);
        UIManager.renderActionButtons([], handleChoice);
        if (sceneData.onExitEffects) { // Applica effetti onExit prima di auto-procedere
            NarrativeEngine.applyEffects(sceneData.onExitEffects);
        }
        setTimeout(() => {
            if(gameState.currentSceneId === sceneId) {
                 goToScene(sceneData.nextSceneDefault);
            }
        }, sceneData.autoProceedDelay);
    } else {
        UIManager.renderActionButtons(availableChoices, handleChoice);
    }

    updateUI();

    UIManager.inventoryButtonIngame.onclick = () => { AudioManager.playSound('sfx_ui_click'); showInventory(); };
    UIManager.heroStatsButtonIngame.onclick = () => { AudioManager.playSound('sfx_ui_click'); showHeroStats(); };
    UIManager.optionsButtonIngame.onclick = () => { AudioManager.playSound('sfx_ui_click'); showPauseMenu(); };

    checkAchievements();

    console.log(`Scena ${sceneId} renderizzata. Flags:`, JSON.stringify(gameState.flags), "Stats Giocatore:", JSON.stringify(playerStats));
}

/**
 * Mostra la schermata dell'inventario.
 */
function showInventory() {
    UIManager.showScreen('inventoryScreen');
    UIManager.updateText(UIManager.inventoryScreen.querySelector('h2'), 'ui_inventory_button');
    UIManager.updateText(UIManager.inventoryBackButton, 'ui_back_button');

    const itemsListContainer = UIManager.inventoryItemsList;
    itemsListContainer.innerHTML = '';

    if (Object.keys(playerInventory.items).length === 0) {
        itemsListContainer.innerHTML = `<p>${LocalizationManager.getLocalizedString('inventory_empty')}</p>`;
    } else {
        for (const itemId in playerInventory.items) {
            const item = playerInventory.items[itemId];
            const itemData = gameItems[itemId];
            if (itemData) {
                const itemDiv = createElement('div', 'inventory-item-entry');
                itemDiv.textContent = `${LocalizationManager.getLocalizedString(itemData.nameKey)} (x${item.quantity})`;
                itemDiv.onclick = () => showItemDetails(itemId);
                itemsListContainer.appendChild(itemDiv);
            }
        }
    }
    if (UIManager.inventoryItemDetails) UIManager.inventoryItemDetails.style.display = 'none';

    UIManager.inventoryBackButton.onclick = () => {
        AudioManager.playSound('sfx_ui_click');
        UIManager.showScreen('gameplayScreen');
    };
}

/**
 * Mostra i dettagli di un oggetto specifico nell'inventario.
 * @param {string} itemId L'ID dell'oggetto.
 */
function showItemDetails(itemId) {
    const itemInstance = playerInventory.items[itemId];
    const itemData = gameItems[itemId];
    if (!itemInstance || !itemData) return;

    if (UIManager.inventoryItemDetails) {
        UIManager.updateImage(UIManager.inventoryItemImage, itemData.icon || "assets/images/items/placeholder_item.png");
        UIManager.updateText(UIManager.inventoryItemName, itemData.nameKey);
        UIManager.updateText(UIManager.inventoryItemDescription, itemData.descriptionKey);
        UIManager.inventoryItemDetails.style.display = 'block';
    }
}


/**
 * Mostra la schermata delle statistiche dell'eroe.
 */
function showHeroStats() {
    UIManager.showScreen('heroStatsScreen');
    const screenTitleElement = UIManager.heroStatsScreen.querySelector('h2');
    if (screenTitleElement) UIManager.updateText(screenTitleElement, 'ui_hero_stats_button');

    UIManager.updateText(UIManager.heroStatsBackButton, 'ui_back_button');

    const playerSlidersContainer = UIManager.heroPlayerStatsSliders;
    if (playerSlidersContainer) {
        playerSlidersContainer.innerHTML = `<h3>${LocalizationManager.getLocalizedString('hero_player_stats_title')}</h3>`;
        for (const stat in playerStats) {
            if (stat === 'money') continue;
            const statName = LocalizationManager.getLocalizedString(`player_stat_${stat.toLowerCase()}`) || stat;
            const maxValue = gameSettings.playerStatMaxValues?.[stat] || 10; // Usa optional chaining e fallback
            const statDiv = createElement('div', 'stat-slider-entry');
            statDiv.innerHTML = `
                <label for="stat-${stat}">${statName}: ${playerStats[stat]}</label>
                <progress id="stat-${stat}" value="${playerStats[stat]}" max="${maxValue}"></progress>
            `;
            playerSlidersContainer.appendChild(statDiv);
        }
    }

    const worldSlidersContainer = UIManager.heroWorldStatsSliders;
    if (worldSlidersContainer) {
        worldSlidersContainer.innerHTML = `<h3>${LocalizationManager.getLocalizedString('hero_world_stats_title')}</h3>`;
         for (const stat in worldState) {
            const statName = LocalizationManager.getLocalizedString(`world_stat_${stat.toLowerCase()}`) || stat;
            const maxValue = gameSettings.worldStatMaxValues?.[stat] || 10; // Usa optional chaining e fallback
            const statDiv = createElement('div', 'stat-slider-entry');
            statDiv.innerHTML = `
                <label for="world-stat-${stat}">${statName}: ${worldState[stat]}</label>
                <progress id="world-stat-${stat}" value="${worldState[stat]}" max="${maxValue}"></progress>
            `;
            worldSlidersContainer.appendChild(statDiv);
        }
    }

    UIManager.heroStatsBackButton.onclick = () => {
        AudioManager.playSound('sfx_ui_click');
        UIManager.showScreen('gameplayScreen');
    };
}

/**
 * Mostra il menu di pausa.
 */
function showPauseMenu() {
    if (!UIManager.pauseMenuScreen) return;
    UIManager.pauseMenuScreen.style.display = 'flex';
    AudioManager.pauseMusic();

    const screenTitleElement = UIManager.pauseMenuScreen.querySelector('h2');
    if (screenTitleElement) UIManager.updateText(screenTitleElement, 'ui_pause_menu_title');

    UIManager.updateText(UIManager.pauseResumeButton, 'ui_resume_game_button');
    UIManager.updateText(UIManager.pauseBackToMainMenuButton, 'ui_back_to_main_menu_button');

    // Aggiungere pulsanti Salva e Carica se non già presenti nell'HTML
    // Per ora assumiamo che siano lì e li aggiorniamo o aggiungiamo listener
    // const saveGameButton = UIManager.pauseMenuScreen.querySelector('#pause-save-game-button'); // Esempio ID
    // if (saveGameButton) UIManager.updateText(saveGameButton, 'ui_save_game_button');


    const languages = LocalizationManager.getAvailableLanguages();
    UIManager.populateLanguageOptions(languages, gameState.currentLanguage, UIManager.pauseLanguageSelect);
    if (UIManager.pauseLanguageSelect) UIManager.pauseLanguageSelect.value = gameState.currentLanguage;

    if (UIManager.pauseAudioToggleButton) UIManager.updateText(UIManager.pauseAudioToggleButton, gameState.audioEnabled ? 'ui_audio_status_on' : 'ui_audio_status_off');
    if (UIManager.pauseVolumeSlider) UIManager.pauseVolumeSlider.value = gameState.audioVolume;

    // Event Listeners
    if(UIManager.pauseLanguageSelect) {
        UIManager.pauseLanguageSelect.onchange = (event) => {
            gameState.currentLanguage = event.target.value;
            LocalizationManager.setLanguage(gameState.currentLanguage);
            StorageManager.saveUserPreferences( { ...StorageManager.loadUserPreferences(), language: gameState.currentLanguage });
        };
    }
    if(UIManager.pauseAudioToggleButton) {
        UIManager.pauseAudioToggleButton.onclick = () => {
            gameState.audioEnabled = !gameState.audioEnabled;
            AudioManager.setMute(!gameState.audioEnabled);
            StorageManager.saveUserPreferences( { ...StorageManager.loadUserPreferences(), audioEnabled: gameState.audioEnabled });
            UIManager.updateText(UIManager.pauseAudioToggleButton, gameState.audioEnabled ? 'ui_audio_status_on' : 'ui_audio_status_off'); // Aggiorna testo qui
        };
    }
    if(UIManager.pauseVolumeSlider){
        UIManager.pauseVolumeSlider.oninput = (event) => {
            gameState.audioVolume = parseFloat(event.target.value);
            AudioManager.setVolume(gameState.audioVolume);
        };
        UIManager.pauseVolumeSlider.onchange = () => { // Salva solo onchange
            StorageManager.saveUserPreferences( { ...StorageManager.loadUserPreferences(), audioVolume: gameState.audioVolume });
        };
    }

    UIManager.pauseResumeButton.onclick = () => {
        AudioManager.playSound('sfx_ui_click');
        if (UIManager.pauseMenuScreen) UIManager.pauseMenuScreen.style.display = 'none';
        AudioManager.resumeMusic();
    };
    UIManager.pauseBackToMainMenuButton.onclick = () => {
        AudioManager.playSound('sfx_ui_click');
        if (confirm(LocalizationManager.getLocalizedString('ui_confirm_back_to_main_menu'))) {
            if (UIManager.pauseMenuScreen) UIManager.pauseMenuScreen.style.display = 'none';
            gameState.gameStarted = false;
            AudioManager.stopMusic();
            showMainMenu();
        }
    };
    // Listener per Salva/Carica da aggiungere qui se i pulsanti sono implementati
    // Esempio:
    // const pauseSaveButton = document.getElementById('pause-save-button');
    // if (pauseSaveButton) {
    //     pauseSaveButton.onclick = () => {
    //         AudioManager.playSound('sfx_ui_click');
    //         showSaveLoadSlots(true); // true per modalità salvataggio da pausa
    //     };
    // }
}


/**
 * Aggiorna la Hall of Fame con i dati del giocatore corrente.
 * @param {string} endingId - L'ID del finale raggiunto.
 */
function updateHallOfFame(endingId) {
    const hallOfFameEntries = StorageManager.loadHallOfFame();
    const newEntry = {
        playerName: gameState.saveName || LocalizationManager.getLocalizedString('player_default_name') || "Anonymous Hero",
        endingId: endingId,
        dateCompleted: new Date().toISOString(),
        achievementsUnlocked: gameState.unlockedAchievements.length,
        unlockedAchievementIds: [...gameState.unlockedAchievements],
        score: calculatePlayerScore(),
        saveSlotId: gameState.activeSaveSlotId
    };
    hallOfFameEntries.push(newEntry);
    hallOfFameEntries.sort((a, b) => (b.score || 0) - (a.score || 0) || new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime());
    const trimmedEntries = hallOfFameEntries.slice(0, gameSettings.maxHallOfFameEntries || 20);

    StorageManager.saveHallOfFame(trimmedEntries);
    console.log("Hall of Fame aggiornata.", newEntry);
}


/**
 * Determina quale finale il giocatore ha raggiunto in base allo stato del gioco.
 * Questa è una funzione placeholder. La logica effettiva dipenderà dalle condizioni
 * definite in `data/endings.js` e dallo stato di `playerStats` e `worldState`.
 * @returns {object|null} L'oggetto di configurazione del finale o null.
 */
function determineEnding() {
    console.log("Determinazione del finale...");
    // Logica Placeholder:
    // Itera su gameEndingsData.
    // Per ogni finale, valuta le sue `conditions` usando NarrativeEngine.evaluateConditions.
    // Restituisci il primo finale le cui condizioni sono soddisfatte (considerando la priorità).

    if (!NarrativeEngine.gameEndingsData || Object.keys(NarrativeEngine.gameEndingsData).length === 0) {
        console.warn("Nessun dato sui finali disponibile.");
        return null; // o un finale di default hardcoded
    }

    const possibleEndings = [];
    for (const endingId in NarrativeEngine.gameEndingsData) {
        const ending = NarrativeEngine.gameEndingsData[endingId];
        if (NarrativeEngine.evaluateConditions(ending.conditions || [])) {
            possibleEndings.push(ending);
        }
    }

    if (possibleEndings.length === 0) {
        console.warn("Nessun finale corrisponde alle condizioni attuali. Si usa il finale di default se esiste.");
        return NarrativeEngine.gameEndingsData["ending_default_neutral"] || null; // Fallback al finale neutro/default
    }

    // Ordina per priorità (valore più basso ha priorità più alta)
    possibleEndings.sort((a, b) => (a.priority || 999) - (b.priority || 999));

    console.log("Finale possibile determinato:", possibleEndings[0].id);
    return possibleEndings[0];
}


/**
 * Calcola il punteggio del giocatore per la Hall of Fame.
 * @returns {number} Il punteggio calcolato.
 */
function calculatePlayerScore() {
    let score = 0;
    // Esempio: 10 punti per ogni achievement
    score += gameState.unlockedAchievements.length * 10;
    // Aggiungere altri fattori (es. tempo impiegato, scelte specifiche, denaro rimasto)
    // const timeTaken = (new Date() - gameState.gameStartTime) / (1000 * 60); // Minuti
    // if (timeTaken < 30) score += 50; // Bonus per velocità
    return score;
}

/**
 * Sblocca un achievement.
 * @param {string} achievementId - ID dell'achievement da sbloccare.
 */
function unlockAchievement(achievementId) {
    if (!gameAchievements[achievementId]) {
        console.warn(`Tentativo di sbloccare achievement inesistente: ${achievementId}`);
        return;
    }
    if (!gameState.unlockedAchievements.includes(achievementId)) {
        gameState.unlockedAchievements.push(achievementId);
        console.log(`Achievement sbloccato: ${LocalizationManager.getLocalizedString(gameAchievements[achievementId].nameKey)}`);
        UIManager.showMessage('ui_achievement_unlocked', { name: LocalizationManager.getLocalizedString(gameAchievements[achievementId].nameKey) }, 'success'); // Placeholder
        // Salva lo stato degli achievement (potrebbe essere parte di saveGame o separato)
        // Per ora, è parte di gameState che viene salvato.
        document.dispatchEvent(new CustomEvent('achievementUnlocked', {detail: {achievementId: achievementId}}));
    }
}

/**
 * Controlla e sblocca achievement basati sullo stato corrente.
 * Da chiamare dopo azioni significative.
 */
function checkAchievements() {
    for (const achId in gameAchievements) {
        if (!gameState.unlockedAchievements.includes(achId)) {
            const achievement = gameAchievements[achId];
            if (NarrativeEngine.evaluateConditions(achievement.conditions || [])) {
                unlockAchievement(achId);
            }
        }
    }
}


// --- GESTORI DI EVENTI GLOBALI ---

/**
 * Gestisce il cambio di lingua, aggiornando tutti i testi visibili.
 */
function handleLanguageChange() {
    console.log(`Evento languageChanged rilevato. Nuova lingua: ${LocalizationManager.getCurrentLanguage()}`);
    // Aggiorna tutti i testi dell'UI che sono attualmente visibili
    // Questa è una funzione "costosa", quindi va usata con parsimonia o ottimizzata
    // per aggiornare solo ciò che è necessario.

    // Esempio: se il menu principale è visibile, aggiorna i suoi testi
    if (UIManager.mainMenuScreen && UIManager.mainMenuScreen.style.display !== 'none') {
        UIManager.updateText(UIManager.mainMenuTitle, 'main_menu_title');
        UIManager.updateText(UIManager.newGameButton, 'ui_new_game_button');
        // ... e così via per tutti i pulsanti/testi del menu
    }
    // Se la schermata di gioco è visibile
    if (UIManager.gameplayScreen && UIManager.gameplayScreen.style.display !== 'none') {
        renderGameScene(gameState.currentSceneId); // Ri-renderizza la scena corrente per aggiornare testi
    }
    // ... e così via per altre schermate (opzioni, crediti, ecc.)
    // Un approccio più robusto potrebbe essere avere una funzione `updateVisibleScreenTexts()`
    // che sa quale schermata è attiva e quali testi aggiornare.
    updateUI(); // Funzione generica per aggiornare elementi comuni
}


// --- GAME LOOP (Concettuale) ---
// Questo gioco è guidato dagli eventi, quindi non c'è un loop continuo in stile `requestAnimationFrame`
// per la logica di gioco principale. Tuttavia, l'inizializzazione è il punto di partenza.

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();

    // Gestione tasto ESC per menu di pausa (se il gioco è iniziato)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && gameState.gameStarted && UIManager.gameplayScreen.style.display !== 'none') {
            if (UIManager.pauseMenuScreen.style.display === 'none') {
                showPauseMenu();
            } else {
                // Se il menu di pausa è già aperto, ESC lo chiude
                if (UIManager.pauseMenuScreen) UIManager.pauseMenuScreen.style.display = 'none';
                AudioManager.resumeMusic();
            }
        }
    });
});

// --- FINE SCRIPT.JS ---
