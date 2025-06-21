// utils/localizationManager.js

/**
 * @fileoverview
 * Gestione della logica di caricamento e cambio della lingua dei testi.
 * Interagisce con `config/locales.js`.
 */

const LocalizationManager = {
    /** @type {object} */
    locales: null, // Verrà popolato con l'oggetto da config/locales.js
    /** @type {string} */
    currentLanguage: 'en', // Lingua predefinita
    /** @type {string} */
    fallbackLanguage: 'en', // Lingua di fallback se una traduzione non è trovata

    /**
     * Inizializza il LocalizationManager.
     * @param {object} loadedLocales - L'oggetto `locales` importato da `config/locales.js`.
     * @param {string} [defaultLanguage='en'] - La lingua da impostare inizialmente.
     *                                          Potrebbe essere presa da `gameConfig.js` o `localStorage`.
     */
    initialize: function(loadedLocales, defaultLanguage = 'en') {
        if (!loadedLocales) {
            console.error("LocalizationManager: `loadedLocales` non fornito. Impossibile inizializzare.");
            this.locales = { [this.fallbackLanguage]: { "error_locales_not_loaded": "Localization data not loaded." } };
            this.currentLanguage = this.fallbackLanguage;
            return;
        }
        this.locales = loadedLocales;
        this.setLanguage(defaultLanguage);
        console.log(`LocalizationManager initialized. Current language: ${this.currentLanguage}`);
    },

    /**
     * Imposta la lingua corrente del gioco.
     * @param {string} languageCode - Il codice della lingua (es. 'en', 'it', 'fr').
     *                                 Deve corrispondere a una chiave nell'oggetto `locales`.
     * @returns {boolean} True se la lingua è stata impostata con successo, false altrimenti.
     */
    setLanguage: function(languageCode) {
        if (this.locales && this.locales[languageCode]) {
            this.currentLanguage = languageCode;
            console.log(`Lingua impostata a: ${languageCode}`);
            // Salva la preferenza della lingua (opzionale, potrebbe essere gestito esternamente)
            // StorageManager.saveUserPreferences({ ...StorageManager.loadUserPreferences(), language: languageCode });

            // Emetti un evento o chiama un callback per notificare all'UI di aggiornarsi
            document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: languageCode } }));
            return true;
        } else {
            console.warn(`LocalizationManager: Lingua '${languageCode}' non trovata. Si mantiene '${this.currentLanguage}'.`);
            if (this.currentLanguage !== this.fallbackLanguage && this.locales && this.locales[this.fallbackLanguage]) {
                this.currentLanguage = this.fallbackLanguage;
                console.warn(`LocalizationManager: Ripiegato sulla lingua di fallback '${this.fallbackLanguage}'.`);
                document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: this.fallbackLanguage } }));
                return false;
            }
            // Se anche il fallback non è disponibile (improbabile se inizializzato correttamente)
            console.error(`LocalizationManager: Lingua di fallback '${this.fallbackLanguage}' non trovata!`);
            return false;
        }
    },

    /**
     * Ottiene la stringa localizzata per una data chiave.
     * @param {string} key - La chiave della stringa di testo (es. 'ui_play_button').
     * @param {Object<string, string|number>} [vars] - Un oggetto opzionale con variabili da sostituire
     *                                                  nella stringa (es. { playerName: "Mario" } per "Ciao, {playerName}!").
     * @returns {string} La stringa tradotta, o la chiave stessa (o un messaggio di errore) se non trovata.
     */
    getLocalizedString: function(key, vars) {
        if (!this.locales) {
            return `[Locales not loaded: ${key}]`;
        }
        let stringSet = this.locales[this.currentLanguage];

        if (!stringSet || typeof stringSet[key] === 'undefined') {
            // console.warn(`LocalizationManager: Chiave '${key}' non trovata per la lingua '${this.currentLanguage}'. Tentativo con fallback.`);
            stringSet = this.locales[this.fallbackLanguage];
            if (!stringSet || typeof stringSet[key] === 'undefined') {
                // console.error(`LocalizationManager: Chiave '${key}' non trovata anche nella lingua di fallback '${this.fallbackLanguage}'.`);
                return `[${key}]`; // Restituisce la chiave come fallback finale
            }
        }

        let localizedString = stringSet[key];

        if (vars && typeof localizedString === 'string') {
            // Sostituzione delle variabili usando la funzione helper formatText
            // Assumendo che `formatText` sia disponibile globalmente o importata.
            if (typeof formatText === 'function') {
                localizedString = formatText(localizedString, vars);
            } else {
                // Fallback semplice se formatText non è disponibile
                for (const varKey in vars) {
                    if (Object.hasOwnProperty.call(vars, varKey)) {
                        const regex = new RegExp(`\\{${varKey}\\}`, 'g');
                        localizedString = localizedString.replace(regex, String(vars[varKey]));
                    }
                }
            }
        }
        return localizedString;
    },

    /**
     * Restituisce l'elenco delle lingue disponibili.
     * @returns {Array<{code: string, name: string}>} Un array di oggetti,
     *          dove `code` è il codice della lingua e `name` è il nome della lingua
     *          (potrebbe essere localizzato o preso da una mappatura interna).
     */
    getAvailableLanguages: function() {
        if (!this.locales) return [];
        return Object.keys(this.locales).map(code => {
            // Per il nome, potremmo avere una chiave speciale tipo "language_name_en", "language_name_it"
            // o una mappatura statica qui.
            // Esempio di mappatura statica:
            const langNames = {
                en: "English",
                it: "Italiano",
                fr: "Français",
                de: "Deutsch",
                es: "Español",
                zh: "中文 (简体)", // Cinese Semplificato
                ja: "日本語", // Giapponese
                ru: "Русский", // Russo
                ar: "العربية", // Arabo
                he: "עברית" // Ebraico
            };
            return {
                code: code,
                name: langNames[code] || code // Nome localizzato o codice se non mappato
            };
        });
    },

    /**
     * Ottiene la lingua corrente.
     * @returns {string} Il codice della lingua corrente.
     */
    getCurrentLanguage: function() {
        return this.currentLanguage;
    }
};

// Per l'uso in vanilla JS, LocalizationManager sarà globale.
// window.LocalizationManager = LocalizationManager; // Opzionale.

// Esempio di inizializzazione in script.js:
// (Assumendo che `locales` da config/locales.js sia già caricato e disponibile globalmente)
//
// document.addEventListener('DOMContentLoaded', () => {
//     // Carica le preferenze utente per la lingua, o usa quella di default dal config
//     const userPrefs = StorageManager.loadUserPreferences({ language: gameSettings.defaultLanguage });
//     LocalizationManager.initialize(locales, userPrefs.language);
//
//     // Esempio di aggiornamento di un elemento UI
//     const playButton = getElement('play-button');
//     if (playButton) {
//         playButton.textContent = LocalizationManager.getLocalizedString('ui_play_button');
//     }
//
//     // Ascolta i cambi di lingua per aggiornare l'UI
//     document.addEventListener('languageChanged', (event) => {
//         console.log("Evento languageChanged ricevuto:", event.detail.lang);
//         // Qui si dovrebbe chiamare una funzione che ri-renderizza tutti i testi dell'UI
//         // updateAllUITexts();
//     });
// });

// Assicurarsi che la funzione `formatText` da `helpers.js` sia disponibile se usata.
// Se helpers.js non è ancora caricato, la sostituzione di variabili sarà più semplice.
// Per questo progetto, si assume che `helpers.js` sia caricato prima e `formatText` sia globale.
