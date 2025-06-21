// utils/uiManager.js

/**
 * @fileoverview
 * Gestione dinamica degli elementi dell'interfaccia utente (UI)
 * in base allo stato del gioco e alle scelte del giocatore.
 * Questo modulo si occupa di mostrare/nascondere schermate, aggiornare testi,
 * popolare liste dinamiche, ecc.
 */

const UIManager = {
    // Riferimenti agli elementi principali dell'UI (da popolare in initializeUI)
    gameContainer: null,
    // Schermate principali (div contenitori)
    preOptionsScreen: null,
    splashScreen: null,
    mainMenuScreen: null,
    gameplayScreen: null, // Schermata di gioco effettiva
    optionsScreen: null, // Schermata opzioni (in-game e pre-game)
    creditsScreen: null,
    hallOfFameScreen: null,
    saveLoadScreen: null, // Schermata per salvare/caricare
    cutsceneViewer: null, // Contenitore per le cutscene
    inventoryScreen: null,
    heroStatsScreen: null,
    pauseMenuScreen: null,

    // Elementi specifici dentro le schermate
    // Gameplay Screen elements
    gameImageElement: null,
    storyTextElement: null,
    actionButtonsContainer: null,
    moneyDisplayElement: null,
    playerStatsContainer: null, // Per visualizzare le stats tipo karma, forza etc.
    worldStatsContainer: null,  // Per visualizzare le stats del mondo tipo allarme, inquinamento etc.

    // PreOptions / Options elements
    languageSelect: null,
    audioToggleButton: null,
    volumeSlider: null,

    // Splash screen elements
    loadingBarElement: null,

    // Save/Load elements
    saveSlotsContainer: null,

    // Cutscene elements
    cutsceneImageElement: null,
    cutsceneVideoElement: null,
    cutsceneTextElement: null,
    cutsceneNextButton: null,

    // Altri elementi UI dinamici
    // ...

    /**
     * Inizializza il UIManager, ottenendo riferimenti agli elementi DOM.
     * Questa funzione dovrebbe essere chiamata dopo che il DOM è completamente caricato.
     * @param {object} elementIds - Un oggetto che mappa i nomi logici degli elementi ai loro ID HTML.
     * Esempio: { gameContainer: 'game-container', storyTextElement: 'story-text', ... }
     */
    initializeUI: function(elementIds) {
        console.log("UIManager: Initializing UI elements...");
        for (const key in elementIds) {
            if (Object.hasOwnProperty.call(elementIds, key)) {
                this[key] = getElement(elementIds[key]); // getElement da helpers.js
                if (!this[key] && (key.endsWith('Screen') || key === 'gameContainer')) { // Solo loggare errore per screen principali
                    console.warn(`UIManager: Elemento con ID '${elementIds[key]}' (per ${key}) non trovato.`);
                }
            }
        }

        // Verifica elementi essenziali
        if (!this.gameContainer) {
            console.error("UIManager: gameContainer non trovato! L'UI non funzionerà correttamente.");
            return;
        }
        // Inizializza lo stato di visibilità (tutte le schermate nascoste tranne quella iniziale se necessario)
        this.hideAllScreens();
        console.log("UIManager: UI elements initialized.");
    },

    /**
     * Nasconde tutte le schermate principali.
     */
    hideAllScreens: function() {
        const screens = [
            this.preOptionsScreen, this.splashScreen, this.mainMenuScreen,
            this.gameplayScreen, this.optionsScreen, this.creditsScreen,
            this.hallOfFameScreen, this.saveLoadScreen, this.cutsceneViewer,
            this.inventoryScreen, this.heroStatsScreen, this.pauseMenuScreen
        ];
        screens.forEach(screen => {
            if (screen) screen.style.display = 'none';
        });
        // console.log("UIManager: All screens hidden.");
    },

    /**
     * Mostra una schermata specifica e nasconde le altre.
     * @param {string} screenName - Il nome della proprietà della schermata da mostrare (es. 'mainMenuScreen').
     */
    showScreen: function(screenName) {
        this.hideAllScreens();
        if (this[screenName] && this[screenName].style) {
            this[screenName].style.display = 'block'; // o 'flex', a seconda del layout
            console.log(`UIManager: Showing screen - ${screenName}`);
        } else {
            console.error(`UIManager: Schermata '${screenName}' non trovata o non è un HTMLElement valido.`);
        }
    },

    /**
     * Aggiorna il testo di un elemento UI usando una chiave di localizzazione.
     * @param {HTMLElement} element - L'elemento HTML da aggiornare.
     * @param {string} localeKey - La chiave nel file locales.js.
     * @param {object} [vars] - Variabili opzionali per la formattazione del testo.
     */
    updateText: function(element, localeKey, vars) {
        if (element) {
            // Assumendo che LocalizationManager.getLocalizedString esista e funzioni
            element.textContent = LocalizationManager.getLocalizedString(localeKey, vars);
        } else {
            // console.warn(`UIManager.updateText: Elemento nullo fornito per la chiave ${localeKey}`);
        }
    },

    /**
     * Aggiorna l'attributo 'src' di un elemento immagine.
     * @param {HTMLImageElement} imgElement - L'elemento <img> da aggiornare.
     * @param {string} imagePath - Il percorso della nuova immagine.
     */
    updateImage: function(imgElement, imagePath) {
        if (imgElement && imagePath) {
            imgElement.src = imagePath;
            imgElement.style.display = 'block';
        } else if (imgElement) {
            imgElement.style.display = 'none';
        }
    },

    /**
     * Aggiorna la sorgente di un elemento video.
     * @param {HTMLVideoElement} videoElement - L'elemento <video> da aggiornare.
     * @param {string} videoPath - Il percorso del nuovo video.
     */
    updateVideo: function(videoElement, videoPath) {
        if (videoElement && videoPath) {
            videoElement.src = videoPath;
            videoElement.style.display = 'block';
        } else if (videoElement) {
            videoElement.style.display = 'none';
        }
    },

    /**
     * Crea e visualizza i pulsanti di azione per la scena corrente.
     * @param {Array<object>} choices - Array di oggetti scelta dalla configurazione della scena.
     *                                Ogni oggetto scelta dovrebbe avere { choiceTextKey: string, id: string, conditions?: [], effects?: [] }
     * @param {function(string)} choiceHandlerCallback - Callback da invocare quando un pulsante viene cliccato, passando l'ID della scelta.
     */
    renderActionButtons: function(choices, choiceHandlerCallback) {
        if (!this.actionButtonsContainer) return;
        this.actionButtonsContainer.innerHTML = ''; // Pulisce i pulsanti precedenti

        if (!choices || choices.length === 0) {
            // Potrebbe mostrare un pulsante "Continua" generico se non ci sono scelte
            // const continueButton = createElement('button', 'action-button default-continue', {}, LocalizationManager.getLocalizedString('ui_continue_button'));
            // continueButton.addEventListener('click', () => choiceHandlerCallback('default_continue'));
            // this.actionButtonsContainer.appendChild(continueButton);
            console.log("UIManager: No choices to render.");
            return;
        }

        choices.forEach(choice => {
            // Qui andrebbe la logica per verificare le `choice.conditions`
            // const conditionsMet = checkChoiceConditions(choice.conditions, gameState); // Funzione da implementare
            // if (!conditionsMet) return;

            const buttonText = LocalizationManager.getLocalizedString(choice.choiceTextKey);
            const button = createElement('button', 'action-button', { 'data-choice-id': choice.id }, buttonText); // createElement da helpers.js
            if (choice.tooltipTextKey) {
                button.title = LocalizationManager.getLocalizedString(choice.tooltipTextKey);
            }
            button.addEventListener('click', () => choiceHandlerCallback(choice.id));
            this.actionButtonsContainer.appendChild(button);
        });
    },

    /**
     * Aggiorna la visualizzazione del denaro del giocatore.
     * @param {number} amount - La quantità di denaro.
     * @param {string} currencyKey - Chiave per il simbolo/nome della valuta (es. 'game_money_label_coins').
     */
    updateMoneyDisplay: function(amount, currencyKey = "game_money_label") {
        if (this.moneyDisplayElement) {
            const currencyLabel = LocalizationManager.getLocalizedString(currencyKey);
            this.moneyDisplayElement.textContent = `${currencyLabel} ${amount}`;
        }
    },

    /**
     * Aggiorna la visualizzazione delle statistiche del giocatore e del mondo.
     * @param {object} playerStats - Oggetto con le statistiche del giocatore.
     * @param {object} worldStats - Oggetto con le statistiche del mondo.
     * @param {object} statsConfig - Configurazione che mappa gli ID delle stat alle chiavi di localizzazione per i nomi.
     *                              Esempio: { playerStats: { karma: "player_stat_karma" }, worldStats: { alarm: "world_stat_alarm" } }
     */
    updateStatsDisplay: function(playerStats, worldStats, statsConfig) {
        if (this.playerStatsContainer && playerStats && statsConfig.playerStats) {
            this.playerStatsContainer.innerHTML = ''; // Pulisce
            for (const statKey in playerStats) {
                if (Object.hasOwnProperty.call(playerStats, statKey) && statsConfig.playerStats[statKey]) {
                    const statName = LocalizationManager.getLocalizedString(statsConfig.playerStats[statKey]);
                    const statValue = playerStats[statKey];
                    const statElement = createElement('div', 'stat-display', {}, `${statName}: ${statValue}`);
                    this.playerStatsContainer.appendChild(statElement);
                    // Qui si potrebbe implementare una barra di progresso o una visualizzazione più complessa
                }
            }
        }

        if (this.worldStatsContainer && worldStats && statsConfig.worldStats) {
            this.worldStatsContainer.innerHTML = ''; // Pulisce
            for (const statKey in worldStats) {
                if (Object.hasOwnProperty.call(worldStats, statKey) && statsConfig.worldStats[statKey]) {
                    const statName = LocalizationManager.getLocalizedString(statsConfig.worldStats[statKey]);
                    const statValue = worldStats[statKey];
                    const statElement = createElement('div', 'stat-display', {}, `${statName}: ${statValue}`);
                    this.worldStatsContainer.appendChild(statElement);
                }
            }
        }
    },

    /**
     * Mostra un messaggio generico o un errore all'utente.
     * Potrebbe essere un modal, un toast, o un'area dedicata nell'UI.
     * @param {string} messageKey - Chiave di localizzazione per il messaggio.
     * @param {object} [vars] - Variabili per la formattazione.
     * @param {string} [type='info'] - Tipo di messaggio ('info', 'error', 'warning', 'success').
     */
    showMessage: function(messageKey, vars, type = 'info') {
        const message = LocalizationManager.getLocalizedString(messageKey, vars);
        // Implementazione base: alert
        alert(`[${type.toUpperCase()}] ${message}`);
        // Implementazione avanzata: creare un elemento modal/toast
        // const messageDiv = createElement('div', `game-message ${type}`, {}, message);
        // this.gameContainer.appendChild(messageDiv);
        // setTimeout(() => messageDiv.remove(), 5000); // Auto-dismiss
        console.log(`UIManager Message (${type}): ${message}`);
    },

    /**
     * Imposta il valore di una barra di caricamento.
     * @param {number} percentage - Valore da 0 a 100.
     */
    setLoadingBarProgress: function(percentage) {
        if (this.loadingBarElement) {
            const clampedPercentage = Math.max(0, Math.min(100, percentage));
            this.loadingBarElement.style.width = `${clampedPercentage}%`;
            this.updateText(this.loadingBarElement, 'ui_loading_percentage', {percent: clampedPercentage}); // Assumendo una chiave tipo "Loading... {percent}%"
        }
    },

    /**
     * Popola la select della lingua nelle opzioni.
     * @param {Array<{code: string, name: string}>} languages - Array di oggetti lingua.
     * @param {string} currentLanguageCode - Codice della lingua attualmente selezionata.
     */
    populateLanguageOptions: function(languages, currentLanguageCode) {
        if (!this.languageSelect) return;
        this.languageSelect.innerHTML = '';
        languages.forEach(lang => {
            const option = createElement('option', '', { value: lang.code }, lang.name);
            if (lang.code === currentLanguageCode) {
                option.selected = true;
            }
            this.languageSelect.appendChild(option);
        });
    }

    // Altre funzioni per popolare dinamicamente l'inventario, la hall of fame, gli slot di salvataggio, ecc.
    // verranno aggiunte qui. Esempio:
    // renderInventory(items) { ... }
    // renderHallOfFame(entries) { ... }
    // renderSaveSlots(slotsData, loadHandler, saveHandler, deleteHandler) { ... }
};

// Per l'uso in vanilla JS, UIManager sarà globale.
// window.UIManager = UIManager; // Opzionale.
// È importante che LocalizationManager sia disponibile globalmente se UIManager lo usa.
// E che `getElement` e `createElement` da helpers.js siano disponibili.
