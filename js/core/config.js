// ============== CONFIG MODULE ============== //

import InteractiveAdventure from "./main.js"; // For DataLoader, if not passed in constructor

/**
 * @class Config
 * @description Manages game configuration and user settings.
 *              Loads global game settings from `data/config/config.json`
 *              and user-specific preferences from `localStorage` (via `data/config/settings.json` as default).
 */
class Config {
    /**
     * @constructor
     * @param {DataLoader} dataLoader - Instance of DataLoader for fetching config files.
     */
    constructor(dataLoader) {
        this.dataLoader = dataLoader;

        this.gameConfig = {}; // Stores data from config.json
        this.userSettings = {}; // Stores user preferences (loaded from localStorage or default)

        this.userSettingsKey = 'interactiveAdventure_userSettings'; // Key for localStorage

        console.log("Config module initialized.");
    }

    /**
     * @method loadConfigs
     * @description Loads both the global game configuration and user settings.
     * @returns {Promise<void>}
     */
    async loadConfigs() {
        try {
            // Load global game configuration
            const globalConfigPath = 'data/config/config.json';
            this.gameConfig = await this.dataLoader.loadJSON(globalConfigPath);
            if (!this.gameConfig) {
                console.warn(`Config: Global game config at ${globalConfigPath} could not be loaded or is empty. Using defaults.`);
                this.gameConfig = this.getDefaultGameConfig();
            } else {
                console.log("Config: Global game configuration loaded.", this.gameConfig);
            }

            // Load default user settings structure (from settings.json)
            const defaultSettingsPath = 'data/config/settings.json';
            const defaultUserSettings = await this.dataLoader.loadJSON(defaultSettingsPath) || this.getDefaultUserSettings();

            // Load user settings from localStorage
            const storedUserSettings = localStorage.getItem(this.userSettingsKey);
            if (storedUserSettings) {
                try {
                    this.userSettings = JSON.parse(storedUserSettings);
                    // Merge with defaults to ensure all keys are present if new settings were added
                    this.userSettings = { ...defaultUserSettings, ...this.userSettings };
                    console.log("Config: User settings loaded from localStorage.", this.userSettings);
                } catch (e) {
                    console.error("Config: Error parsing user settings from localStorage. Using defaults.", e);
                    InteractiveAdventure.errorHandler.handle(e, "Error parsing user settings from localStorage");
                    this.userSettings = defaultUserSettings;
                    this.saveUserSettings(); // Save defaults if parsing failed
                }
            } else {
                this.userSettings = defaultUserSettings;
                console.log("Config: No user settings found in localStorage. Using defaults.", this.userSettings);
                this.saveUserSettings(); // Save defaults for the first time
            }

        } catch (error) {
            console.error("Config: Error loading configurations:", error);
            InteractiveAdventure.errorHandler.handle(error, "Fatal error loading game configurations.");
            // Fallback to safe defaults if critical files are missing
            if (Object.keys(this.gameConfig).length === 0) this.gameConfig = this.getDefaultGameConfig();
            if (Object.keys(this.userSettings).length === 0) this.userSettings = this.getDefaultUserSettings();
            // This might be a fatal error scenario, consider how main.js handles it.
            throw error; // Re-throw to be caught by main.js initializer
        }
    }

    /**
     * @method getDefaultGameConfig
     * @description Provides a fallback default global game configuration.
     * @returns {object}
     */
    getDefaultGameConfig() {
        return {
            gameTitle: "Interactive Adventure",
            version: "1.0.0",
            defaultLanguage: "en",
            debugMode: false,
            logLevel: "info", // 'debug', 'info', 'warn', 'error'
            savePrefix: "interactiveAdventure_",
            autosaveSlotId: "autosave_0",
            enableAutosave: true,
            enableAutosaveOnSceneChange: true,
            // Add other game-wide settings
        };
    }

    /**
     * @method getDefaultUserSettings
     * @description Provides a fallback default user settings structure.
     * @returns {object}
     */
    getDefaultUserSettings() {
        return {
            language: this.getGameSetting('defaultLanguage') || "en",
            musicVolume: 0.7, // 0.0 to 1.0
            sfxVolume: 0.9,
            textSize: "medium", // 'small', 'medium', 'large'
            textSpeed: "normal", // 'slow', 'normal', 'fast'
            highContrast: false,
            reduceMotion: false,
            textToSpeech: false,
            visitedBefore: false, // For tracking if user has run the game before (e.g., for pre-options)
            lastSaveSlot: null, // ID of the last slot used by the player
            // Add other user-configurable settings
        };
    }

    /**
     * @method getGameSetting
     * @description Retrieves a specific global game setting.
     * @param {string} key - The key of the setting to retrieve.
     * @param {any} defaultValue - Optional default value if key not found.
     * @returns {any} The value of the setting, or defaultValue/undefined.
     */
    getGameSetting(key, defaultValue = undefined) {
        return this.gameConfig.hasOwnProperty(key) ? this.gameConfig[key] : defaultValue;
    }

    /**
     * @method getUserSetting
     * @description Retrieves a specific user preference.
     * @param {string} key - The key of the user setting to retrieve.
     * @param {any} defaultValue - Optional default value if key not found.
     * @returns {any} The value of the user setting, or defaultValue/undefined.
     */
    getUserSetting(key, defaultValue = undefined) {
        return this.userSettings.hasOwnProperty(key) ? this.userSettings[key] : defaultValue;
    }

    /**
     * @method setUserSetting
     * @description Sets a specific user preference and saves all user settings.
     * @param {string} key - The key of the user setting to set.
     * @param {any} value - The value to set for the user preference.
     */
    setUserSetting(key, value) {
        this.userSettings[key] = value;
        console.log(`Config: User setting "${key}" set to`, value);
        this.saveUserSettings();
    }

    /**
     * @method saveUserSettings
     * @description Saves the current user settings to localStorage.
     */
    saveUserSettings() {
        try {
            localStorage.setItem(this.userSettingsKey, JSON.stringify(this.userSettings));
            console.log("Config: User settings saved to localStorage.");
        } catch (error) {
            console.error("Config: Error saving user settings to localStorage:", error);
            InteractiveAdventure.errorHandler.handle(error, "Could not save user settings.");
            // Potentially notify the user if localStorage is full or unavailable
        }
    }

    /**
     * @method resetUserSettings
     * @description Resets all user settings to their default values.
     * @param {boolean} saveAfterReset - Whether to immediately save the reset settings. Default true.
     */
    async resetUserSettings(saveAfterReset = true) {
        console.log("Config: Resetting user settings to defaults...");
        // Need to reload default structure as it might depend on gameConfig (like defaultLanguage)
        const defaultSettingsPath = 'data/config/settings.json';
        const defaultUserSettings = await this.dataLoader.loadJSON(defaultSettingsPath) || this.getDefaultUserSettings();
        this.userSettings = defaultUserSettings;

        if (saveAfterReset) {
            this.saveUserSettings();
        }
        // Notify other modules that settings have been reset so they can update
        document.dispatchEvent(new CustomEvent('usersettingsreset'));
    }

    /**
     * @method isDebugMode
     * @description Checks if the game is currently in debug mode.
     * @returns {boolean}
     */
    isDebugMode() {
        return !!this.getGameSetting('debugMode', false);
    }
}

export default Config;
