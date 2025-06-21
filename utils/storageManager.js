// utils/storageManager.js

/**
 * @fileoverview
 * Interazione con localStorage o sessionStorage per il salvataggio e caricamento
 * dello stato del gioco e delle preferenze.
 */

const StorageManager = {
    prefix: 'myReignsGame_', // Prefisso per evitare collisioni con altri dati in localStorage

    /**
     * Verifica se localStorage è disponibile e utilizzabile.
     * @returns {boolean} True se localStorage è supportato, altrimenti false.
     */
    isLocalStorageSupported: function() {
        try {
            const testKey = '__testLocalStorageSupport__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn("localStorage non è supportato o è disabilitato.");
            return false;
        }
    },

    /**
     * Salva dati in localStorage. I dati vengono serializzati in JSON.
     * @param {string} key - La chiave sotto cui salvare i dati (verrà prefissata).
     * @param {any} value - Il valore da salvare (può essere un oggetto, array, stringa, numero, ecc.).
     * @returns {boolean} True se il salvataggio è riuscito, altrimenti false.
     */
    saveData: function(key, value) {
        if (!this.isLocalStorageSupported()) {
            return false;
        }
        try {
            const fullKey = this.prefix + key;
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(fullKey, serializedValue);
            // console.log(`Dati salvati in localStorage con chiave ${fullKey}:`, value);
            return true;
        } catch (e) {
            console.error(`Errore durante il salvataggio dati in localStorage (chiave: ${key}):`, e);
            // Potrebbe essere dovuto a QuotaExceededError
            if (e.name === 'QuotaExceededError') {
                alert("Errore: Spazio di archiviazione locale pieno. Impossibile salvare la partita.");
                // Qui si potrebbe implementare una logica per liberare spazio o avvisare meglio l'utente.
            }
            return false;
        }
    },

    /**
     * Carica dati da localStorage. I dati vengono deserializzati da JSON.
     * @param {string} key - La chiave da cui caricare i dati (verrà prefissata).
     * @param {any} [defaultValue=null] - Il valore da restituire se la chiave non esiste o si verifica un errore.
     * @returns {any} Il valore deserializzato o defaultValue.
     */
    loadData: function(key, defaultValue = null) {
        if (!this.isLocalStorageSupported()) {
            return defaultValue;
        }
        try {
            const fullKey = this.prefix + key;
            const serializedValue = localStorage.getItem(fullKey);
            if (serializedValue === null) {
                // console.log(`Nessun dato trovato in localStorage per la chiave ${fullKey}. Restituisco defaultValue.`);
                return defaultValue;
            }
            const value = JSON.parse(serializedValue);
            // console.log(`Dati caricati da localStorage con chiave ${fullKey}:`, value);
            return value;
        } catch (e) {
            console.error(`Errore durante il caricamento dati da localStorage (chiave: ${key}):`, e);
            return defaultValue;
        }
    },

    /**
     * Rimuove dati da localStorage.
     * @param {string} key - La chiave dei dati da rimuovere (verrà prefissata).
     * @returns {boolean} True se la rimozione è riuscita o la chiave non esisteva, altrimenti false.
     */
    removeData: function(key) {
        if (!this.isLocalStorageSupported()) {
            return false;
        }
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            // console.log(`Dati rimossi da localStorage per la chiave ${fullKey}.`);
            return true;
        } catch (e) {
            console.error(`Errore durante la rimozione dati da localStorage (chiave: ${key}):`, e);
            return false;
        }
    },

    /**
     * Pulisce tutti i dati del gioco da localStorage (quelli con il prefisso specificato).
     * ATTENZIONE: Questa operazione è distruttiva.
     * @returns {boolean} True se la pulizia è riuscita, altrimenti false.
     */
    clearAllGameData: function() {
        if (!this.isLocalStorageSupported()) {
            return false;
        }
        try {
            let keyRemoved = false;
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                    keyRemoved = true;
                    // console.log(`Rimosso dalla pulizia: ${key}`);
                }
            }
            if (keyRemoved) console.log("Tutti i dati del gioco sono stati rimossi da localStorage.");
            else console.log("Nessun dato del gioco da rimuovere trovato in localStorage.");
            return true;
        } catch (e) {
            console.error("Errore durante la pulizia di tutti i dati del gioco da localStorage:", e);
            return false;
        }
    },

    // --- Funzioni specifiche per il gioco ---

    /**
     * Salva lo stato di un singolo slot di gioco.
     * @param {string|number} slotId - Identificatore dello slot (es. 'slot_1', 1).
     * @param {object} gameStateData - L'oggetto completo dello stato del gioco da salvare.
     */
    saveGameSlot: function(slotId, gameStateData) {
        const timestamp = new Date().toISOString();
        const saveData = {
            timestamp: timestamp,
            data: gameStateData,
            // Potrebbe includere un'immagine thumbnail o altre info riassuntive
            // preview: { chapter: gameStateData.currentChapter, scene: gameStateData.currentSceneId }
        };
        return this.saveData(`saveSlot_${slotId}`, saveData);
    },

    /**
     * Carica lo stato di un singolo slot di gioco.
     * @param {string|number} slotId - Identificatore dello slot.
     * @returns {object|null} L'oggetto dello stato del gioco salvato, o null se non trovato/errore.
     *                        La struttura restituita è { timestamp: "...", data: {...} }.
     */
    loadGameSlot: function(slotId) {
        return this.loadData(`saveSlot_${slotId}`, null);
    },

    /**
     * Rimuove i dati di un singolo slot di gioco.
     * @param {string|number} slotId - Identificatore dello slot.
     */
    deleteGameSlot: function(slotId) {
        return this.removeData(`saveSlot_${slotId}`);
    },

    /**
     * Ottiene informazioni su tutti gli slot di salvataggio disponibili.
     * @param {number} maxSlots - Il numero massimo di slot da controllare (da gameConfig.js).
     * @returns {Array<object|null>} Un array dove ogni elemento è l'anteprima dello slot
     *                               o null se lo slot è vuoto.
     *                               Esempio: [{slotId: 1, timestamp: "...", data: {...} (o solo preview)}, null, ...]
     */
    getAllSaveSlotsInfo: function(maxSlots) {
        const slots = [];
        for (let i = 1; i <= maxSlots; i++) {
            const slotData = this.loadGameSlot(`slot_${i}`);
            if (slotData) {
                slots.push({
                    slotId: `slot_${i}`,
                    name: slotData.data.saveName || `Salvataggio ${i}`, // Assumendo che saveName sia in gameStateData
                    timestamp: slotData.timestamp,
                    // Aggiungere qui altri dati per l'anteprima se necessario
                    // previewText: `Cap. ${slotData.data.currentChapterId}, Scena: ${slotData.data.currentSceneId}`
                });
            } else {
                slots.push(null); // Slot vuoto
            }
        }
        return slots;
    },

    /**
     * Salva le preferenze utente (es. lingua, volume).
     * @param {object} preferences - Oggetto con le preferenze.
     */
    saveUserPreferences: function(preferences) {
        return this.saveData('userPreferences', preferences);
    },

    /**
     * Carica le preferenze utente.
     * @param {object} [defaultPreferences={}] - Preferenze di default se non trovate.
     * @returns {object} Oggetto con le preferenze.
     */
    loadUserPreferences: function(defaultPreferences = {}) {
        return this.loadData('userPreferences', defaultPreferences);
    },

    /**
     * Salva i dati della Hall of Fame.
     * @param {Array<object>} hallOfFameData - Array di oggetti PlayerHallOfFameEntry.
     */
    saveHallOfFame: function(hallOfFameData) {
        return this.saveData('hallOfFame', hallOfFameData);
    },

    /**
     * Carica i dati della Hall of Fame.
     * @returns {Array<object>} Array di oggetti PlayerHallOfFameEntry, o array vuoto.
     */
    loadHallOfFame: function() {
        return this.loadData('hallOfFame', []);
    }
};

// Verifica supporto all'avvio dello script
// if (!StorageManager.isLocalStorageSupported()) {
//     alert("Attenzione: il tuo browser non supporta localStorage o è disabilitato. " +
//           "Il salvataggio e il caricamento delle partite non funzioneranno.");
// }

// Per l'uso in vanilla JS, StorageManager sarà globale.
// window.StorageManager = StorageManager; // Opzionale.
