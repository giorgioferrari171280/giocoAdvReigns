// ============== ACHIEVEMENT SYSTEM MODULE ============== //

import InteractiveAdventure from "../core/main.js"; // For StateManager, UIManager, AudioManager, DataLoader

/**
 * @class AchievementSystem
 * @description Manages game achievements, including unlocking, tracking, and displaying them.
 */
class AchievementSystem {
    /**
     * @constructor
     * @param {DataLoader} dataLoader - Instance of DataLoader for fetching achievement definitions.
     * @param {StateManager} stateManager - Instance of StateManager to interact with game state.
     * @param {UIManager} uiManager - Instance of UIManager to display notifications/UI.
     * @param {AudioManager} audioManager - Instance of AudioManager to play unlock sounds.
     */
    constructor(dataLoader, stateManager, uiManager, audioManager) {
        this.dataLoader = dataLoader;
        this.stateManager = stateManager;
        this.uiManager = uiManager;
        this.audioManager = audioManager;

        this.achievementsData = {}; // Stores definitions of all available achievements, keyed by achievementId
        this.playerAchievements = this.stateManager.getGameState().achievements; // Ref to achievements in game state

        // Ensure playerAchievements structure exists
        if (!this.playerAchievements) {
            this.stateManager.getGameState().achievements = {};
            this.playerAchievements = this.stateManager.getGameState().achievements;
        }

        this.eventListeners = {}; // For listening to game events that might trigger achievements

        console.log("AchievementSystem initialized.");
    }

    /**
     * @method loadAchievementsData
     * @description Loads achievement definitions from a JSON file.
     * @param {string} filePath - The path to the JSON file containing achievement data.
     * @returns {Promise<void>}
     */
    async loadAchievementsData(filePath) {
        try {
            console.log(`AchievementSystem: Loading achievement definitions from ${filePath}...`);
            const rawData = await this.dataLoader.loadJSON(filePath);
            if (rawData && Array.isArray(rawData.achievements)) {
                rawData.achievements.forEach(achDef => {
                    this.achievementsData[achDef.id] = achDef;
                    // Initialize in playerAchievements if not present
                    if (!this.playerAchievements[achDef.id]) {
                        this.playerAchievements[achDef.id] = {
                            unlocked: false,
                            unlockDate: null,
                            progress: 0, // For multi-step achievements
                            // targetProgress: achDef.targetProgress || 1 // if needed
                        };
                    }
                });
                console.log(`AchievementSystem: ${Object.keys(this.achievementsData).length} achievement definitions loaded.`);
            } else {
                console.error("AchievementSystem: Achievement data is not in the expected format.", rawData);
                throw new Error("Invalid achievement data format.");
            }
        } catch (error) {
            console.error(`AchievementSystem: Error loading achievement definitions from ${filePath}:`, error);
            InteractiveAdventure.errorHandler.handle(error, `Failed to load achievement definitions: ${filePath}`);
        }
    }

    /**
     * @method getAchievementDefinition
     * @description Retrieves the definition for a specific achievement.
     * @param {string} achievementId - The ID of the achievement.
     * @returns {object | null} The achievement definition object, or null if not found.
     */
    getAchievementDefinition(achievementId) {
        return this.achievementsData[achievementId] || null;
    }

    /**
     * @method isUnlocked
     * @description Checks if a specific achievement is unlocked.
     * @param {string} achievementId - The ID of the achievement.
     * @returns {boolean} True if unlocked, false otherwise.
     */
    isUnlocked(achievementId) {
        return this.playerAchievements[achievementId] ? this.playerAchievements[achievementId].unlocked : false;
    }

    /**
     * @method unlockAchievement
     * @description Unlocks an achievement if it's not already unlocked.
     * @param {string} achievementId - The ID of the achievement to unlock.
     * @param {boolean} [forceUnlock=false] - If true, unlocks even if conditions aren't met (for debugging/testing).
     * @returns {boolean} True if the achievement was newly unlocked, false otherwise.
     */
    unlockAchievement(achievementId, forceUnlock = false) {
        if (!this.achievementsData[achievementId]) {
            console.warn(`AchievementSystem: Attempted to unlock unknown achievement "${achievementId}".`);
            return false;
        }

        if (this.isUnlocked(achievementId) && !forceUnlock) {
            // console.log(`AchievementSystem: Achievement "${achievementId}" is already unlocked.`);
            return false; // Already unlocked
        }

        // Additional condition checks could go here if not handled by triggerEvent logic
        // For example, if unlockAchievement is called directly.

        const achievementDef = this.achievementsData[achievementId];
        this.playerAchievements[achievementId] = {
            ...this.playerAchievements[achievementId], // Preserve existing progress if any
            unlocked: true,
            unlockDate: new Date().toISOString()
        };

        console.log(`AchievementSystem: Achievement UNLOCKED! "${achievementDef.name}" (ID: ${achievementId})`);

        // Notify UI
        this.uiManager.showNotification(
            InteractiveAdventure.localization.getString('achievement_unlocked_notify', { achievementName: achievementDef.name }),
            'success', // Or a special 'achievement' type
            5000 // Longer duration for achievement popups
        );

        // Play sound effect
        if (this.audioManager) {
            this.audioManager.playSound('achievement_unlocked', 'sfx/ui/achievement_unlock.wav'); // Example path
        }

        // Update any UI displaying achievements (e.g., Hall of Fame, Achievement Grid)
        if (typeof InteractiveAdventure.hallOfFameController?.refreshAchievementsDisplay === 'function') {
            InteractiveAdventure.hallOfFameController.refreshAchievementsDisplay();
        }
        if (InteractiveAdventure.gameEngine?.currentState === InteractiveAdventure.gameEngine?.GAME_STATES.ACHIEVEMENTS_GRID) {
            // Refresh grid if currently viewing it
        }

        // Trigger a game event for other systems if needed
        document.dispatchEvent(new CustomEvent('achievementunlocked', { detail: { achievementId, definition: achievementDef } }));

        return true;
    }


    /**
     * @method updateAchievementProgress
     * @description Updates progress for a multi-step or counter-based achievement.
     * @param {string} achievementId - The ID of the achievement.
     * @param {number} [incrementAmount=1] - The amount to increment the progress by.
     *                                      Can also be used to set absolute progress if `setAbsolute` is true.
     * @param {boolean} [setAbsolute=false] - If true, `incrementAmount` is treated as the new absolute progress.
     */
    updateAchievementProgress(achievementId, incrementAmount = 1, setAbsolute = false) {
        if (this.isUnlocked(achievementId)) return; // No need to update progress if already unlocked

        const achDef = this.getAchievementDefinition(achievementId);
        if (!achDef || achDef.type !== 'progress') { // Assuming a 'type' field in definition
            // console.warn(`AchievementSystem: Achievement "${achievementId}" is not progress-based or doesn't exist.`);
            return;
        }

        if (!this.playerAchievements[achievementId]) {
             this.playerAchievements[achievementId] = { unlocked: false, unlockDate: null, progress: 0 };
        }
        const playerAch = this.playerAchievements[achievementId];

        if (setAbsolute) {
            playerAch.progress = incrementAmount;
        } else {
            playerAch.progress = (playerAch.progress || 0) + incrementAmount;
        }

        const targetProgress = achDef.targetProgress || 1; // Default target if not specified
        playerAch.progress = Math.min(playerAch.progress, targetProgress); // Cap at target

        console.log(`AchievementSystem: Progress for "${achievementId}" updated to ${playerAch.progress}/${targetProgress}.`);

        // Check for unlock
        if (playerAch.progress >= targetProgress) {
            this.unlockAchievement(achievementId);
        } else {
            // Optionally, notify about progress
            // this.uiManager.showNotification(`Progress for ${achDef.name}: ${playerAch.progress}/${targetProgress}`, 'info', 2000);
        }
    }


    /**
     * @method triggerEvent
     * @description Called by other game systems when a relevant event occurs.
     *              This method checks if any achievements are triggered by this event.
     * @param {string} eventType - The type of event (e.g., 'scene_visited', 'item_acquired', 'stat_changed', 'enemy_defeated').
     * @param {object} eventData - Data associated with the event (e.g., { sceneId: '...', itemId: '...' }).
     */
    triggerEvent(eventType, eventData) {
        // console.debug(`AchievementSystem: Event triggered - Type: ${eventType}, Data:`, eventData);

        for (const achId in this.achievementsData) {
            if (this.isUnlocked(achId)) continue; // Skip already unlocked achievements

            const achDef = this.achievementsData[achId];
            if (achDef.trigger && achDef.trigger.type === eventType) {
                let conditionsMet = true;
                if (achDef.trigger.conditions) {
                    // Check specific conditions from eventData against achDef.trigger.conditions
                    // Example: achDef.trigger.conditions = { itemId: "sword_of_legend", sceneId: "final_boss_room" }
                    for (const key in achDef.trigger.conditions) {
                        if (eventData[key] !== achDef.trigger.conditions[key]) {
                            conditionsMet = false;
                            break;
                        }
                    }
                }

                // More complex condition checking using StateManager if needed
                if (conditionsMet && achDef.trigger.gameStateConditions && InteractiveAdventure.choiceEngine) {
                    if (!InteractiveAdventure.choiceEngine.areConditionsMet(achDef.trigger.gameStateConditions)) {
                        conditionsMet = false;
                    }
                }


                if (conditionsMet) {
                    if (achDef.type === 'progress') {
                        const increment = achDef.trigger.progressIncrement || 1;
                        this.updateAchievementProgress(achId, increment);
                    } else { // Simple event trigger
                        this.unlockAchievement(achId);
                    }
                }
            }
        }
    }

    /**
     * @method getPlayerAchievementsStatus
     * @description Returns a list of all achievements with their status for the current player.
     * @returns {Array<object>} Array of { definition: object, unlocked: boolean, unlockDate: string|null, progress?: number, targetProgress?: number }
     */
    getPlayerAchievementsStatus() {
        const statuses = [];
        for (const achId in this.achievementsData) {
            const definition = this.achievementsData[achId];
            const playerAch = this.playerAchievements[achId] || { unlocked: false, unlockDate: null, progress: 0 };
            statuses.push({
                id: achId,
                definition: definition,
                name: InteractiveAdventure.localization.getString(definition.nameKey) || definition.name,
                description: InteractiveAdventure.localization.getString(definition.descriptionKey) || definition.description,
                icon: definition.icon || 'assets/images/ui/achievements/placeholder-ach.png', // Default icon
                unlocked: playerAch.unlocked,
                unlockDate: playerAch.unlockDate,
                progress: playerAch.progress,
                targetProgress: definition.targetProgress,
                rarity: definition.rarity || 'common', // common, uncommon, rare, epic, legendary
                hidden: definition.hiddenUntilUnlocked || false, // If true, details are obscured until unlocked
            });
        }
        // Sort for display (e.g., by unlocked status, then by name or defined order)
        statuses.sort((a, b) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            // Add more sorting criteria if needed (e.g., rarity, date)
            return (a.definition.order || 0) - (b.definition.order || 0) || a.name.localeCompare(b.name);
        });
        return statuses;
    }

    /**
     * @method getTotalAchievements
     * @description Returns the total number of defined achievements.
     * @returns {number}
     */
    getTotalAchievements() {
        return Object.keys(this.achievementsData).length;
    }

    /**
     * @method getUnlockedAchievementsCount
     * @description Returns the number of achievements unlocked by the player.
     * @returns {number}
     */
    getUnlockedAchievementsCount() {
        let count = 0;
        for (const achId in this.playerAchievements) {
            if (this.playerAchievements[achId].unlocked) {
                count++;
            }
        }
        return count;
    }

    /**
     * @method resetAllAchievements // For debugging or complete game reset
     * @description Resets all player achievement progress.
     */
    resetAllAchievements() {
        console.warn("AchievementSystem: Resetting ALL achievement progress for player.");
        for (const achId in this.achievementsData) {
             this.playerAchievements[achId] = {
                unlocked: false,
                unlockDate: null,
                progress: 0
            };
        }
        // Update UI if necessary
    }


    /**
     * @method initializeFromState
     * @description Re-initializes from loaded game state.
     * @param {object} gameState - The loaded game state.
     */
    initializeFromState(gameState) {
        if (gameState && gameState.achievements) {
            this.playerAchievements = gameState.achievements;
            // Ensure all defined achievements have an entry in playerAchievements
            // This handles cases where new achievements were added after a save was made
            for (const achId in this.achievementsData) {
                if (!this.playerAchievements[achId]) {
                    this.playerAchievements[achId] = {
                        unlocked: false,
                        unlockDate: null,
                        progress: 0,
                    };
                }
            }
            console.log("AchievementSystem: Re-initialized from loaded game state.");
        } else {
            console.warn("AchievementSystem: Could not re-initialize, achievements data missing in loaded state.");
            this.playerAchievements = this.stateManager.getGameState().achievements; // Fallback
        }
    }

    /**
     * @method updateGameStateBeforeSave
     * @description Ensures the achievements part of the main gameState object is up-to-date.
     * @param {object} gameStateRef - Reference to the main game state object.
     */
    updateGameStateBeforeSave(gameStateRef) {
        // this.playerAchievements is a direct reference, so it should be current.
        // gameStateRef.achievements = this.playerAchievements; // Usually not needed
        console.log("AchievementSystem: State prepared for saving.", this.playerAchievements);
    }
}

export default AchievementSystem;
