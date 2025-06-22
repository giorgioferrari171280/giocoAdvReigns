// ============== STATE MANAGER MODULE ============== //

import InteractiveAdventure from "./main.js"; // For potential access to SaveSystem, Config

/**
 * @class StateManager
 * @description Manages the overall game state, including player progress,
 * inventory, stats, game flags, and settings. Handles saving and loading game state.
 */
class StateManager {
    /**
     * @constructor
     * @param {SaveSystem} saveSystem - Instance of SaveSystem for data persistence.
     */
    constructor(saveSystem) {
        this.saveSystem = saveSystem;

        // Initialize with a default game state structure
        this.gameState = this.getDefaultGameState();

        // Game constants or configurations that don't change often but are part of state
        this.gameConstants = {
            MAX_INVENTORY_SLOTS: 20,
            INITIAL_SCENE_ID: 'intro_cutscene', // Or the actual first playable scene
            // Add other constants like max stats, version numbers, etc.
        };

        console.log("StateManager initialized.");
    }

    /**
     * @method getDefaultGameState
     * @description Returns the structure for a new or reset game state.
     * @returns {object} The default game state object.
     */
    getDefaultGameState() {
        return {
            // Player Info & Progress
            playerName: "Player",
            currentSceneId: null, // Will be set by SceneManager or loaded game
            previousSceneId: null,
            playTime: 0, // In seconds or milliseconds
            gameVersion: "1.0.0", // Version of the game this save was made with

            // Player Stats (examples, to be expanded by StatsSystem)
            stats: {
                // health: 100,
                // maxHealth: 100,
                // score: 0,
                // Add other stats like strength, intelligence, charisma, etc.
            },

            // Inventory (managed by InventorySystem, but basic structure here)
            inventory: {
                items: [], // Array of { itemId: string, quantity: number, equipped?: boolean }
                // gold: 0,
            },

            // Game Flags & Variables (for tracking story progress, events, conditions)
            flags: {
                // example_event_triggered: false,
                // met_npc_A: false,
            },
            variables: { // For numerical or string variables in the game
                // karma_score: 0,
                // current_quest_step: 1,
                // currentLocationName: "Unknown" // Updated by SceneManager
            },

            // Achievements Progress (managed by AchievementSystem)
            achievements: {
                // achievement_id_001: { unlocked: false, unlockDate: null },
            },

            // User Settings (persisted with game state, though some might be global via Config)
            // These are settings that might be specific to a playthrough,
            // or if userSettings aren't saved globally.
            userSettingsInSave: {
                // textSpeed: 'normal',
                // difficulty: 'medium',
            },

            // Save metadata
            saveSlotId: null,
            saveTimestamp: null,
        };
    }

    /**
     * @method resetGameState
     * @description Resets the current game state to its default values.
     *              Typically called when starting a new game.
     */
    resetGameState() {
        console.log("StateManager: Resetting game state to default.");
        this.gameState = this.getDefaultGameState();
        // Potentially re-apply some persistent user settings if they are not part of this reset
        // For example, if global user settings (like volume) should persist across new games.
        // This depends on how `Config.js` and `userSettings` are handled.
    }

    /**
     * @method getGameState
     * @description Returns the entire current game state object.
     * @returns {object} The current game state.
     */
    getGameState() {
        return this.gameState;
    }

    /**
     * @method setGameState
     * @description Overwrites the current game state with a new one.
     *              Used primarily during loading a game.
     * @param {object} newState - The game state object to load.
     */
    setGameState(newState) {
        // Basic validation or merging could be done here
        if (typeof newState === 'object' && newState !== null) {
            this.gameState = newState;
            console.log("StateManager: Game state updated.");
        } else {
            console.error("StateManager: Attempted to set invalid game state.", newState);
        }
    }

    // --- Getters and Setters for specific parts of the state ---

    getPlayerName() { return this.gameState.playerName; }
    setPlayerName(name) { this.gameState.playerName = name; }

    getCurrentSceneId() { return this.gameState.currentSceneId; }
    setCurrentSceneId(sceneId) {
        this.gameState.previousSceneId = this.gameState.currentSceneId;
        this.gameState.currentSceneId = sceneId;
    }

    getPlayTime() { return this.gameState.playTime; }
    increasePlayTime(seconds) { this.gameState.playTime += seconds; }


    /**
     * @method getFlag
     * @description Gets the value of a game flag.
     * @param {string} flagName - The name of the flag.
     * @returns {boolean | undefined} The value of the flag, or undefined if not set.
     */
    getFlag(flagName) {
        return this.gameState.flags[flagName];
    }

    /**
     * @method setFlag
     * @description Sets the value of a game flag.
     * @param {string} flagName - The name of the flag.
     * @param {boolean} value - The value to set (true or false).
     */
    setFlag(flagName, value) {
        this.gameState.flags[flagName] = !!value; // Ensure boolean
        console.log(`StateManager: Flag "${flagName}" set to ${this.gameState.flags[flagName]}`);
    }

    /**
     * @method getGameStateVar
     * @description Gets the value of a game variable.
     * @param {string} varName - The name of the variable.
     * @returns {any} The value of the variable, or undefined if not set.
     */
    getGameStateVar(varName) {
        return this.gameState.variables[varName];
    }

    /**
     * @method setGameStateVar
     * @description Sets the value of a game variable.
     * @param {string} varName - The name of the variable.
     * @param {any} value - The value to set.
     */
    setGameStateVar(varName, value) {
        this.gameState.variables[varName] = value;
        console.log(`StateManager: Variable "${varName}" set to:`, value);
    }

    /**
     * @method modifyGameStateVar
     * @description Modifies a numerical game variable by a certain amount.
     * @param {string} varName - The name of the numerical variable.
     * @param {number} amount - The amount to add (can be negative to subtract).
     */
    modifyGameStateVar(varName, amount) {
        if (typeof this.gameState.variables[varName] === 'number') {
            this.gameState.variables[varName] += amount;
        } else if (this.gameState.variables[varName] === undefined && typeof amount === 'number') {
            this.gameState.variables[varName] = amount; // Initialize if not set
        } else {
            console.warn(`StateManager: Attempted to modify non-numerical or uninitialized variable "${varName}". Current value:`, this.gameState.variables[varName]);
            return; // Do nothing if not a number or not sensible to initialize
        }
        console.log(`StateManager: Variable "${varName}" modified by ${amount}. New value: ${this.gameState.variables[varName]}`);
    }


    // --- Game Constants ---
    getGameConstants() {
        return this.gameConstants;
    }


    // --- Save and Load Operations ---

    /**
     * @method saveGame
     * @description Saves the current game state to the specified slot.
     * @param {number | string} slotId - The ID of the save slot.
     * @returns {boolean} True if successful, false otherwise.
     */
    saveGame(slotId) {
        if (!this.saveSystem) {
            console.error("StateManager: SaveSystem not available.");
            return false;
        }
        try {
            this.gameState.saveSlotId = slotId;
            this.gameState.saveTimestamp = new Date().toISOString();
            this.gameState.gameVersion = InteractiveAdventure.config.getGameSetting('version') || this.gameConstants.gameVersion; // Ensure current game version

            // Before saving, ensure systems have updated their relevant parts of gameState
            // Example: InteractiveAdventure.inventorySystem.updateGameState(this.gameState);
            // Example: InteractiveAdventure.statsSystem.updateGameState(this.gameState);
            // Example: InteractiveAdventure.achievementSystem.updateGameStateForSave(this.gameState);

            this.saveSystem.save(slotId, this.gameState);
            console.log(`StateManager: Game saved to slot ${slotId} at ${this.gameState.saveTimestamp}`);
            // Update last save slot in global user settings
            if (InteractiveAdventure.config) {
                InteractiveAdventure.config.setUserSetting('lastSaveSlot', slotId);
                InteractiveAdventure.config.saveUserSettings();
            }
            return true;
        } catch (error) {
            console.error(`StateManager: Error saving game to slot ${slotId}:`, error);
            InteractiveAdventure.errorHandler.handle(error, `Failed to save game to slot ${slotId}`);
            return false;
        }
    }

    /**
     * @method autoSaveGame
     * @description Performs an autosave if enabled and conditions are met.
     *              Typically called on scene changes or significant events.
     */
    autoSaveGame() {
        if (InteractiveAdventure.config && InteractiveAdventure.config.getGameSetting('enableAutosave')) {
            const autosaveSlotId = InteractiveAdventure.config.getGameSetting('autosaveSlotId') || 'autosave_0';
            console.log("StateManager: Performing autosave...");
            this.saveGame(autosaveSlotId);
        }
    }

    /**
     * @method loadGame
     * @description Loads game state from the specified slot.
     * @param {number | string} slotId - The ID of the save slot.
     * @returns {boolean} True if successful, false otherwise.
     */
    loadGame(slotId) {
        if (!this.saveSystem) {
            console.error("StateManager: SaveSystem not available.");
            return false;
        }
        try {
            const loadedData = this.saveSystem.load(slotId);
            if (loadedData) {
                // TODO: Version compatibility check
                // if (loadedData.gameVersion !== this.gameConstants.gameVersion) {
                //     console.warn(`StateManager: Save game version (${loadedData.gameVersion}) differs from current game version (${this.gameConstants.gameVersion}). Attempting to migrate or load anyway.`);
                //     // Implement migration logic if necessary
                // }

                this.setGameState(loadedData);
                console.log(`StateManager: Game loaded from slot ${slotId}. Scene: ${this.gameState.currentSceneId}`);

                // After loading, systems might need to re-initialize based on the new state
                // Example: InteractiveAdventure.inventorySystem.initializeFromState(this.gameState);
                // Example: InteractiveAdventure.statsSystem.initializeFromState(this.gameState);
                // Example: InteractiveAdventure.achievementSystem.initializeFromState(this.gameState);

                // Update last save slot in global user settings
                if (InteractiveAdventure.config) {
                    InteractiveAdventure.config.setUserSetting('lastSaveSlot', slotId);
                    InteractiveAdventure.config.saveUserSettings();
                }
                return true;
            } else {
                console.warn(`StateManager: No save data found for slot ${slotId}.`);
                return false; // No data found or failed to parse
            }
        } catch (error) {
            console.error(`StateManager: Error loading game from slot ${slotId}:`, error);
            InteractiveAdventure.errorHandler.handle(error, `Failed to load game from slot ${slotId}`);
            return false;
        }
    }

    /**
     * @method listSaveSlots
     * @description Retrieves metadata for all available save slots.
     * @returns {Array<object>} An array of save slot metadata objects.
     */
    listSaveSlots() {
        if (!this.saveSystem) {
            console.error("StateManager: SaveSystem not available.");
            return [];
        }
        return this.saveSystem.listSaves();
    }

    /**
     * @method deleteSaveSlot
     * @description Deletes a save slot.
     * @param {number | string} slotId - The ID of the save slot to delete.
     */
    deleteSaveSlot(slotId) {
        if (!this.saveSystem) {
            console.error("StateManager: SaveSystem not available.");
            return;
        }
        this.saveSystem.deleteSave(slotId);
        console.log(`StateManager: Save slot ${slotId} deleted.`);
    }

}

export default StateManager;
