// ============== SAVE SYSTEM MODULE ============== //

/**
 * @class SaveSystem
 * @description Handles the low-level saving and loading of game data to/from web storage (localStorage).
 */
class SaveSystem {
    /**
     * @constructor
     * @param {string} savePrefix - A prefix for localStorage keys to avoid conflicts.
     */
    constructor(savePrefix = 'interactiveGame_') {
        this.savePrefix = savePrefix;
        this.MAX_SLOTS = 10; // Default maximum number of save slots

        if (!this.isLocalStorageAvailable()) {
            console.warn("SaveSystem: localStorage is not available. Saving and loading will not work.");
            // Potentially show a persistent warning to the user via UIManager if localStorage is crucial.
        }
        console.log("SaveSystem initialized.");
    }

    /**
     * @method isLocalStorageAvailable
     * @description Checks if localStorage is available and writable.
     * @returns {boolean} True if localStorage is available, false otherwise.
     */
    isLocalStorageAvailable() {
        try {
            const testKey = '__localStorageTest__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * @method getSlotKey
     * @description Generates the localStorage key for a given slot ID.
     * @param {number | string} slotId - The ID of the save slot.
     * @returns {string} The localStorage key.
     */
    getSlotKey(slotId) {
        return `${this.savePrefix}slot_${slotId}`;
    }

    /**
     * @method save
     * @description Saves game data to a specific slot in localStorage.
     * @param {number | string} slotId - The ID of the save slot.
     * @param {object} gameState - The game state object to save.
     * @returns {boolean} True if saving was successful, false otherwise.
     */
    save(slotId, gameState) {
        if (!this.isLocalStorageAvailable()) {
            console.error("SaveSystem: Cannot save game, localStorage is not available.");
            // Consider notifying the user via UIManager
            // InteractiveAdventure.uiManager.showNotification("Error: Cannot save game. Storage is unavailable.", "error");
            return false;
        }

        if (slotId === null || slotId === undefined) {
            console.error("SaveSystem: Invalid slotId provided for saving.", slotId);
            return false;
        }

        try {
            const slotKey = this.getSlotKey(slotId);
            const dataToStore = JSON.stringify(gameState);
            localStorage.setItem(slotKey, dataToStore);
            console.log(`SaveSystem: Game state saved to slot ${slotId} (key: ${slotKey}). Size: ${dataToStore.length} bytes.`);
            return true;
        } catch (error) {
            console.error(`SaveSystem: Error saving game to slot ${slotId}:`, error);
            // Handle potential errors like QuotaExceededError
            if (error.name === 'QuotaExceededError') {
                // InteractiveAdventure.uiManager.showNotification("Error: Not enough space to save game. Try deleting old saves.", "error");
            } else {
                // InteractiveAdventure.uiManager.showNotification("Error: Could not save game.", "error");
            }
            return false;
        }
    }

    /**
     * @method load
     * @description Loads game data from a specific slot in localStorage.
     * @param {number | string} slotId - The ID of the save slot.
     * @returns {object | null} The loaded game state object, or null if no data or error.
     */
    load(slotId) {
        if (!this.isLocalStorageAvailable()) {
            console.error("SaveSystem: Cannot load game, localStorage is not available.");
            return null;
        }

        if (slotId === null || slotId === undefined) {
            console.error("SaveSystem: Invalid slotId provided for loading.", slotId);
            return null;
        }

        try {
            const slotKey = this.getSlotKey(slotId);
            const storedData = localStorage.getItem(slotKey);

            if (storedData) {
                const gameState = JSON.parse(storedData);
                console.log(`SaveSystem: Game state loaded from slot ${slotId} (key: ${slotKey}).`);
                return gameState;
            } else {
                console.log(`SaveSystem: No save data found for slot ${slotId} (key: ${slotKey}).`);
                return null;
            }
        } catch (error) {
            console.error(`SaveSystem: Error loading game from slot ${slotId}:`, error);
            // If JSON parsing fails, the save data might be corrupted.
            // InteractiveAdventure.uiManager.showNotification(`Error: Could not load save data from slot ${slotId}. It might be corrupted.`, "error");
            // Optionally, delete corrupted data: this.deleteSave(slotId);
            return null;
        }
    }

    /**
     * @method deleteSave
     * @description Deletes save data from a specific slot.
     * @param {number | string} slotId - The ID of the save slot to delete.
     */
    deleteSave(slotId) {
        if (!this.isLocalStorageAvailable()) {
            console.error("SaveSystem: Cannot delete save, localStorage is not available.");
            return;
        }

        if (slotId === null || slotId === undefined) {
            console.error("SaveSystem: Invalid slotId provided for deletion.", slotId);
            return;
        }

        try {
            const slotKey = this.getSlotKey(slotId);
            localStorage.removeItem(slotKey);
            console.log(`SaveSystem: Save data deleted from slot ${slotId} (key: ${slotKey}).`);
        } catch (error) {
            console.error(`SaveSystem: Error deleting save data from slot ${slotId}:`, error);
        }
    }

    /**
     * @method listSaves
     * @description Retrieves metadata for all existing save slots.
     *              Metadata typically includes slotId, timestamp, and playerName or scene name.
     * @returns {Array<object>} An array of save slot metadata objects.
     *                          Each object: { slotId: string, timestamp: string, playerName?: string, sceneId?: string, gameVersion?: string, isEmpty: boolean }
     */
    listSaves() {
        if (!this.isLocalStorageAvailable()) {
            return Array(this.MAX_SLOTS).fill(null).map((_, i) => ({ slotId: i, isEmpty: true, error: "localStorage unavailable" }));
        }

        const saves = [];
        // Assuming a fixed number of slots for now, or iterate localStorage keys matching prefix
        const maxSlotsToScan = this.MAX_SLOTS; // Or get from config

        for (let i = 0; i < maxSlotsToScan; i++) {
            const slotId = i.toString(); // Or a more complex ID scheme like 'autosave_0', 'manual_1'
            const slotKey = this.getSlotKey(slotId);
            const storedData = localStorage.getItem(slotKey);

            if (storedData) {
                try {
                    const gameState = JSON.parse(storedData);
                    saves.push({
                        slotId: slotId,
                        timestamp: gameState.saveTimestamp || new Date(0).toISOString(), // Fallback for old saves
                        playerName: gameState.playerName || "Unknown Player",
                        currentSceneId: gameState.currentSceneId || "Unknown Scene",
                        playTime: gameState.playTime || 0,
                        gameVersion: gameState.gameVersion || "N/A",
                        isEmpty: false
                    });
                } catch (e) {
                    // Corrupted save slot
                    saves.push({
                        slotId: slotId,
                        timestamp: new Date(0).toISOString(),
                        isEmpty: true, // Treat as empty or problematic
                        error: "Corrupted data"
                    });
                    console.warn(`SaveSystem: Slot ${slotId} (key: ${slotKey}) contains corrupted data.`, e);
                }
            } else {
                saves.push({
                    slotId: slotId,
                    isEmpty: true
                });
            }
        }
        // Sort saves by timestamp (most recent first) if needed, or by slotId
        saves.sort((a, b) => {
            if (a.isEmpty && !b.isEmpty) return 1;
            if (!a.isEmpty && b.isEmpty) return -1;
            if (a.isEmpty && b.isEmpty) return parseInt(a.slotId) - parseInt(b.slotId); // Keep empty slots ordered by ID
            return new Date(b.timestamp) - new Date(a.timestamp); // Most recent non-empty first
        });


        // Also check for specific named slots like 'autosave_0' if they are outside the numeric loop
        const autosaveSlotId = 'autosave_0'; // Example, get from config
        const autosaveKey = this.getSlotKey(autosaveSlotId);
        const autosaveData = localStorage.getItem(autosaveKey);
        if(autosaveData){
            try {
                const gameState = JSON.parse(autosaveData);
                // Check if this autosave is already in the list (if MAX_SLOTS is small and autosave is numeric)
                if (!saves.find(s => s.slotId === autosaveSlotId)) {
                    saves.unshift({ // Add autosave to the beginning
                        slotId: autosaveSlotId,
                        timestamp: gameState.saveTimestamp || new Date(0).toISOString(),
                        playerName: gameState.playerName || "Autosave",
                        currentSceneId: gameState.currentSceneId || "Unknown Scene",
                        playTime: gameState.playTime || 0,
                        gameVersion: gameState.gameVersion || "N/A",
                        isAutosave: true,
                        isEmpty: false
                    });
                }
            } catch (e) {
                 if (!saves.find(s => s.slotId === autosaveSlotId)) {
                    saves.unshift({ slotId: autosaveSlotId, isEmpty: true, error: "Corrupted autosave", isAutosave: true });
                 }
                console.warn(`SaveSystem: Autosave slot (key: ${autosaveKey}) contains corrupted data.`, e);
            }
        } else {
            if (!saves.find(s => s.slotId === autosaveSlotId)) {
                 saves.unshift({ slotId: autosaveSlotId, isEmpty: true, isAutosave: true });
            }
        }


        console.log("SaveSystem: Listed save slots.", saves);
        return saves;
    }

    /**
     * @method clearAllSaves
     * @description Deletes ALL save data associated with this game (use with caution!).
     */
    clearAllSaves() {
        if (!this.isLocalStorageAvailable()) {
            console.error("SaveSystem: Cannot clear saves, localStorage is not available.");
            return;
        }
        console.warn("SaveSystem: CLEARING ALL SAVE DATA for prefix:", this.savePrefix);
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.savePrefix)) {
                    localStorage.removeItem(key);
                    console.log(`SaveSystem: Removed ${key}`);
                    i--; // Adjust index because localStorage.length changes
                }
            }
            console.log("SaveSystem: All save data cleared.");
        } catch (error) {
            console.error("SaveSystem: Error clearing all save data:", error);
        }
    }
}

export default SaveSystem;
