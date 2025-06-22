// ============== STATS SYSTEM MODULE ============== //

import InteractiveAdventure from "../core/main.js"; // For StateManager, UIManager

/**
 * @class StatsSystem
 * @description Manages player and potentially NPC statistics, including their modification and display.
 */
class StatsSystem {
    /**
     * @constructor
     * @param {StateManager} stateManager - Instance of StateManager to interact with game state.
     * @param {UIManager} uiManager - Instance of UIManager to update stats UI.
     */
    constructor(stateManager, uiManager) {
        this.stateManager = stateManager;
        this.uiManager = uiManager;

        this.playerStats = this.stateManager.getGameState().stats; // Direct reference to stats part of game state

        // Ensure playerStats structure exists in gameState
        if (!this.playerStats) {
            this.stateManager.getGameState().stats = this.getDefaultPlayerStats();
            this.playerStats = this.stateManager.getGameState().stats;
        }

        this.statDefinitions = this.getBaseStatDefinitions(); // Base definitions (name, min, max, description)

        console.log("StatsSystem initialized.");
        this.initializeStats(); // Ensure all defined stats exist in playerStats
    }

    /**
     * @method getBaseStatDefinitions
     * @description Defines the basic properties of all stats in the game.
     * @returns {object} An object where keys are stat IDs and values are their definitions.
     *                   Example: { health: { nameKey: "stat_health_name", descriptionKey: "stat_health_desc", base: 100, min: 0, max: 100, isPercentageBar: true } }
     */
    getBaseStatDefinitions() {
        // These would ideally be loaded from a config file (e.g., data/game/stats_definitions.json)
        return {
            health: { nameKey: "stat_health", descriptionKey: "stat_health_desc", baseValue: 100, minValue: 0, maxValue: 100, displayType: 'bar', color: 'var(--health-bar-color, #dc3545)' },
            mana: { nameKey: "stat_mana", descriptionKey: "stat_mana_desc", baseValue: 50, minValue: 0, maxValue: 50, displayType: 'bar', color: 'var(--mana-bar-color, #007bff)' },
            stamina: { nameKey: "stat_stamina", descriptionKey: "stat_stamina_desc", baseValue: 75, minValue: 0, maxValue: 75, displayType: 'bar', color: 'var(--success-color, #28a745)' },
            strength: { nameKey: "stat_strength", descriptionKey: "stat_strength_desc", baseValue: 10, minValue: 1, maxValue: 99, displayType: 'value' },
            dexterity: { nameKey: "stat_dexterity", descriptionKey: "stat_dexterity_desc", baseValue: 10, minValue: 1, maxValue: 99, displayType: 'value' },
            intelligence: { nameKey: "stat_intelligence", descriptionKey: "stat_intelligence_desc", baseValue: 10, minValue: 1, maxValue: 99, displayType: 'value' },
            charisma: { nameKey: "stat_charisma", descriptionKey: "stat_charisma_desc", baseValue: 10, minValue: 1, maxValue: 99, displayType: 'value' },
            luck: { nameKey: "stat_luck", descriptionKey: "stat_luck_desc", baseValue: 5, minValue: 1, maxValue: 20, displayType: 'value' },
            score: { nameKey: "stat_score", descriptionKey: "stat_score_desc", baseValue: 0, minValue: 0, displayType: 'value' },
            // Add more stats as needed: perception, constitution, wisdom, level, xp, etc.
            level: { nameKey: "stat_level", descriptionKey: "stat_level_desc", baseValue: 1, minValue:1, displayType: 'value'},
            xp: { nameKey: "stat_xp", descriptionKey: "stat_xp_desc", baseValue: 0, minValue:0, nextLevelXp: 100, displayType: 'xp_bar', color: 'var(--xp-bar-color, #ffc107)'},
        };
    }

    /**
     * @method getDefaultPlayerStats
     * @description Returns a player stats object initialized with base values from definitions.
     * @returns {object}
     */
    getDefaultPlayerStats() {
        const defaultStats = {};
        const definitions = this.getBaseStatDefinitions(); // Call it here as this.statDefinitions might not be set yet
        for (const statId in definitions) {
            if (Object.hasOwnProperty.call(definitions, statId)) {
                const def = definitions[statId];
                defaultStats[statId] = {
                    current: def.baseValue,
                    max: def.maxValue !== undefined ? def.maxValue : def.baseValue, // If no max, current is max
                    min: def.minValue !== undefined ? def.minValue : 0,
                    // Modifiers can be added later (e.g., from equipment, buffs)
                    // modifiers: [] // { source: 'item_xyz', value: 5, type: 'add'/'multiply' }
                };
                if (statId === 'xp' && def.nextLevelXp) {
                    defaultStats[statId].nextLevelXp = def.nextLevelXp;
                }
            }
        }
        return defaultStats;
    }


    /**
     * @method initializeStats
     * @description Ensures all stats defined in `statDefinitions` exist in `this.playerStats`
     *              and initializes them with default values if they are missing.
     *              This is useful for when new stats are added to an existing game/save.
     */
    initializeStats() {
        for (const statId in this.statDefinitions) {
            if (!this.playerStats.hasOwnProperty(statId)) {
                const def = this.statDefinitions[statId];
                this.playerStats[statId] = {
                    current: def.baseValue,
                    max: def.maxValue !== undefined ? def.maxValue : def.baseValue,
                    min: def.minValue !== undefined ? def.minValue : 0,
                };
                 if (statId === 'xp' && def.nextLevelXp) {
                    this.playerStats[statId].nextLevelXp = def.nextLevelXp;
                }
                console.log(`StatsSystem: Initialized missing stat "${statId}" to base value.`);
            } else {
                // Ensure existing stats have min/max if definitions provide them
                const def = this.statDefinitions[statId];
                if (this.playerStats[statId].max === undefined && def.maxValue !== undefined) {
                    this.playerStats[statId].max = def.maxValue;
                }
                if (this.playerStats[statId].min === undefined && def.minValue !== undefined) {
                    this.playerStats[statId].min = def.minValue;
                }
                if (statId === 'xp' && this.playerStats[statId].nextLevelXp === undefined && def.nextLevelXp) {
                     this.playerStats[statId].nextLevelXp = def.nextLevelXp;
                }
            }
        }
    }


    /**
     * @method getStatValue
     * @description Gets the current value of a specific player stat.
     * @param {string} statId - The ID of the stat (e.g., 'health', 'strength').
     * @returns {number | undefined} The current value of the stat, or undefined if not found.
     */
    getStatValue(statId) {
        return this.playerStats[statId] ? this.playerStats[statId].current : undefined;
    }

    /**
     * @method getStatMax
     * @description Gets the maximum value of a specific player stat (if applicable).
     * @param {string} statId - The ID of the stat.
     * @returns {number | undefined} The maximum value, or undefined.
     */
    getStatMax(statId) {
        return this.playerStats[statId] ? this.playerStats[statId].max : undefined;
    }
    /**
     * @method getStatMin
     * @description Gets the minimum value of a specific player stat (if applicable).
     * @param {string} statId - The ID of the stat.
     * @returns {number | undefined} The minimum value, or undefined.
     */
    getStatMin(statId) {
        return this.playerStats[statId] ? this.playerStats[statId].min : undefined;
    }

    /**
     * @method setStatValue
     * @description Sets the current value of a player stat, clamping it between min/max if defined.
     * @param {string} statId - The ID of the stat.
     * @param {number} value - The new value for the stat.
     * @param {boolean} [allowOverMax=false] - Whether to allow setting value over defined max (e.g. temporary buff).
     * @param {boolean} [allowUnderMin=false] - Whether to allow setting value under defined min.
     */
    setStatValue(statId, value, allowOverMax = false, allowUnderMin = false) {
        if (!this.playerStats[statId]) {
            console.warn(`StatsSystem: Stat "${statId}" not found. Cannot set value.`);
            // Option: Initialize the stat if it's in definitions but not in playerStats
            if (this.statDefinitions[statId]) {
                this.initializeStats(); // Re-check and initialize if needed
                if (!this.playerStats[statId]) return; // Still not there, bail
            } else {
                return;
            }
        }

        let finalValue = value;
        const statDef = this.statDefinitions[statId];
        const statObj = this.playerStats[statId];

        const min = allowUnderMin ? -Infinity : (statObj.min !== undefined ? statObj.min : (statDef.minValue !== undefined ? statDef.minValue : -Infinity));
        const max = allowOverMax ? Infinity : (statObj.max !== undefined ? statObj.max : (statDef.maxValue !== undefined ? statDef.maxValue : Infinity));

        finalValue = Math.max(min, Math.min(max, finalValue));

        if (statObj.current !== finalValue) {
            const oldValue = statObj.current;
            statObj.current = finalValue;
            console.log(`StatsSystem: Stat "${statId}" changed from ${oldValue} to ${statObj.current}.`);
            this.updateStatsUI();
            InteractiveAdventure.achievementSystem.triggerEvent('stat_changed', { statId, newValue: statObj.current, oldValue });

            // Specific stat change events
            if (statId === 'health' && statObj.current <= (statObj.min || 0)) {
                InteractiveAdventure.achievementSystem.triggerEvent('player_defeated');
                // Handle player death/defeat logic (e.g., game over, load last save)
                // This might be better handled by the GameEngine or a specific controller listening to this event.
                console.log("StatsSystem: Player health reached zero or below!");
            }
            if (statId === 'xp') this.checkLevelUp();
        }
    }

    /**
     * @method modifyStatValue
     * @description Modifies a stat by a certain amount (e.g., +10 strength, -5 health).
     * @param {string} statId - The ID of the stat to modify.
     * @param {number} amount - The amount to add (can be negative).
     */
    modifyStatValue(statId, amount) {
        const currentValue = this.getStatValue(statId);
        if (currentValue !== undefined) {
            this.setStatValue(statId, currentValue + amount);
        } else {
            // If stat doesn't exist but is in definitions, initialize it with amount as base (or def.base + amount)
            if (this.statDefinitions[statId]) {
                this.initializeStats(); // Ensure it's created if missing
                if (this.playerStats[statId]) {
                     this.setStatValue(statId, this.playerStats[statId].current + amount);
                } else {
                     console.warn(`StatsSystem: Stat "${statId}" could not be initialized to modify.`);
                }
            } else {
                console.warn(`StatsSystem: Stat "${statId}" not found. Cannot modify.`);
            }
        }
    }

    /**
     * @method setStatMax
     * @description Sets the maximum value for a stat.
     * @param {string} statId - The ID of the stat.
     * @param {number} newMax - The new maximum value.
     */
    setStatMax(statId, newMax) {
        if (this.playerStats[statId]) {
            this.playerStats[statId].max = newMax;
            // Optionally, clamp current value if it exceeds new max (unless intended for temp buffs)
            // if (this.playerStats[statId].current > newMax) {
            // this.playerStats[statId].current = newMax;
            // }
            console.log(`StatsSystem: Max for stat "${statId}" set to ${newMax}.`);
            this.updateStatsUI();
        }
    }

    /**
     * @method checkLevelUp
     * @description Checks if the player has enough XP to level up.
     */
    checkLevelUp() {
        const xpStat = this.playerStats.xp;
        const levelStat = this.playerStats.level;
        if (!xpStat || !levelStat) return;

        let currentLevel = levelStat.current;
        let currentXP = xpStat.current;
        let xpForNextLevel = xpStat.nextLevelXp || (this.statDefinitions.xp.nextLevelXp * Math.pow(1.5, currentLevel -1)); // Example formula

        while (currentXP >= xpForNextLevel) {
            currentLevel++;
            currentXP -= xpForNextLevel;

            // Update level and XP
            levelStat.current = currentLevel;
            xpStat.current = currentXP;

            // Calculate XP for the new next level
            // This formula can be complex: e.g., 100, 250, 500, 1000 or (level^1.5 * 100)
            xpForNextLevel = Math.floor((this.statDefinitions.xp.nextLevelXp || 100) * Math.pow(1.5, currentLevel -1)); // Update for new level
            xpStat.nextLevelXp = xpForNextLevel;


            console.log(`StatsSystem: Player leveled up to Level ${currentLevel}!`);
            this.uiManager.showNotification(InteractiveAdventure.localization.getString('player_level_up', { level: currentLevel }), 'success');
            InteractiveAdventure.achievementSystem.triggerEvent('player_level_up', { newLevel: currentLevel });

            // TODO: Apply level up benefits (e.g., increase max health, grant stat points)
            // this.applyLevelUpBonuses(currentLevel);
            this.modifyStatValue('health', 10 * (currentLevel - (levelStat.current-1))); // example: +10 max health
            this.setStatMax('health', this.getStatMax('health') + 10 * (currentLevel - (levelStat.current-1)));
            this.setStatValue('health', this.getStatMax('health')); // Heal to full on level up
        }
        this.updateStatsUI();
    }


    /**
     * @method getFormattedStats
     * @description Returns an array of player stats formatted for display in the UI.
     * @returns {Array<object>} Array of { id, name, value, max, min, displayType, color, nextLevelXp? }
     */
    getFormattedStats() {
        const formatted = [];
        for (const statId in this.playerStats) {
            if (Object.hasOwnProperty.call(this.playerStats, statId) && this.statDefinitions[statId]) {
                const statData = this.playerStats[statId];
                const statDef = this.statDefinitions[statId];
                formatted.push({
                    id: statId,
                    name: InteractiveAdventure.localization.getString(statDef.nameKey) || statId,
                    description: InteractiveAdventure.localization.getString(statDef.descriptionKey) || "",
                    value: statData.current,
                    max: statData.max,
                    min: statData.min,
                    displayType: statDef.displayType || 'value',
                    color: statDef.color, // For bars
                    nextLevelXp: statId === 'xp' ? statData.nextLevelXp : undefined
                });
            }
        }
        // Sort stats for display (optional, based on an order property in definitions)
        // formatted.sort((a,b) => (this.statDefinitions[a.id].order || 0) - (this.statDefinitions[b.id].order || 0));
        return formatted;
    }

    /**
     * @method updateStatsUI
     * @description Signals the UIManager to refresh the stats display.
     */
    updateStatsUI() {
        if (this.uiManager && typeof this.uiManager.renderStats === 'function') {
            this.uiManager.renderStats(this.getFormattedStats());
        } else if (this.uiManager && InteractiveAdventure.gameController && typeof InteractiveAdventure.gameController.refreshStatsDisplay === 'function') {
            InteractiveAdventure.gameController.refreshStatsDisplay();
        }
    }


    /**
     * @method applyEquipmentEffects
     * @description Applies stat modifications from equipping an item. (Placeholder)
     * @param {object} itemDef - The definition of the equipped item.
     */
    applyEquipmentEffects(itemDef) {
        if (itemDef.equipmentEffects) {
            // itemDef.equipmentEffects might be an object like: { strength: 5, healthMax: 20 }
            for (const statId in itemDef.equipmentEffects) {
                const value = itemDef.equipmentEffects[statId];
                // This needs a more robust system for modifiers (additive, multiplicative, temporary vs permanent)
                // For now, a simple addition for 'max' stats and current stats.
                if (statId.endsWith('Max') || statId.endsWith('MAX')) { // e.g. healthMax
                    const baseStatId = statId.slice(0, -3);
                    this.setStatMax(baseStatId, (this.getStatMax(baseStatId) || this.statDefinitions[baseStatId].maxValue || 0) + value);
                } else {
                    this.modifyStatValue(statId, value);
                }
            }
            console.log(`StatsSystem: Applied equipment effects from ${itemDef.name}.`);
            this.updateStatsUI();
        }
    }
    /**
     * @method removeEquipmentEffects
     * @description Removes stat modifications from unequipping an item. (Placeholder)
     * @param {object} itemDef - The definition of the unequipped item.
     */
    removeEquipmentEffects(itemDef) {
        if (itemDef.equipmentEffects) {
            for (const statId in itemDef.equipmentEffects) {
                const value = itemDef.equipmentEffects[statId];
                 if (statId.endsWith('Max') || statId.endsWith('MAX')) {
                    const baseStatId = statId.slice(0, -3);
                    this.setStatMax(baseStatId, (this.getStatMax(baseStatId) || 0) - value);
                } else {
                    this.modifyStatValue(statId, -value); // Subtract the effect
                }
            }
            console.log(`StatsSystem: Removed equipment effects from ${itemDef.name}.`);
            this.updateStatsUI();
        }
    }


    /**
     * @method initializeFromState
     * @description Re-initializes the stats system based on loaded game state.
     * @param {object} gameState - The loaded game state.
     */
    initializeFromState(gameState) {
        if (gameState && gameState.stats) {
            this.playerStats = gameState.stats;
            this.initializeStats(); // Ensure new stats are added if save is old
            console.log("StatsSystem: Re-initialized from loaded game state.");
        } else {
            console.warn("StatsSystem: Could not re-initialize from state, stats data missing.");
            this.playerStats = this.stateManager.getGameState().stats; // Fallback
        }
        this.updateStatsUI();
    }

    /**
     * @method updateGameStateBeforeSave
     * @description Ensures the stats part of the main gameState object is up-to-date.
     * @param {object} gameStateRef - Reference to the main game state object.
     */
    updateGameStateBeforeSave(gameStateRef) {
        // this.playerStats is a direct reference, so it should be current.
        // gameStateRef.stats = this.playerStats; // Usually not needed
        console.log("StatsSystem: State prepared for saving.", this.playerStats);
    }
}

export default StatsSystem;
