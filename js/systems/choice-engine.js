// ============== CHOICE ENGINE MODULE ============== //

import InteractiveAdventure from "../core/main.js"; // For StateManager, SceneManager, etc.

/**
 * @class ChoiceEngine
 * @description Processes player choices, evaluates conditions, and applies effects.
 */
class ChoiceEngine {
    /**
     * @constructor
     * @param {StateManager} stateManager - Instance of StateManager.
     * @param {SceneManager} sceneManager - Instance of SceneManager.
     * @param {InventorySystem} inventorySystem - Instance of InventorySystem.
     * @param {StatsSystem} statsSystem - Instance of StatsSystem.
     * @param {AchievementSystem} achievementSystem - Instance of AchievementSystem.
     */
    constructor(stateManager, sceneManager, inventorySystem, statsSystem, achievementSystem) {
        this.stateManager = stateManager;
        this.sceneManager = sceneManager; // To determine next scene
        this.inventorySystem = inventorySystem;
        this.statsSystem = statsSystem;
        this.achievementSystem = achievementSystem;

        console.log("ChoiceEngine initialized.");
    }

    /**
     * @method processChoice
     * @description Processes a player's choice, applies its effects, and determines the outcome.
     * @param {object} choiceObject - The choice object selected by the player.
     *                                 Example: { text: "Go left", targetSceneId: "forest_path", effects: [...], conditions: [...] }
     * @returns {Promise<object>} An outcome object, e.g., { nextSceneId: string, message?: string, effectsAppliedCount?: number, refreshScene?: boolean, endGame?: boolean, finalCutsceneId?: string }
     */
    async processChoice(choiceObject) {
        console.log("ChoiceEngine: Processing choice:", choiceObject);
        const outcome = {
            nextSceneId: null,
            message: null,
            messageType: 'info',
            effectsAppliedCount: 0,
            refreshScene: false,
            endGame: false,
            finalCutsceneId: null
        };

        // 1. Verify conditions again (though usually pre-filtered by SceneManager)
        if (!this.areConditionsMet(choiceObject.conditions)) {
            console.warn("ChoiceEngine: Conditions for choice not met upon processing. This shouldn't happen if pre-filtered.");
            outcome.message = InteractiveAdventure.localization.getString('choice_no_longer_valid') || "This option is no longer valid.";
            outcome.messageType = 'warning';
            outcome.refreshScene = true; // Refresh to update available choices
            return outcome;
        }

        // 2. Apply effects
        if (choiceObject.effects && Array.isArray(choiceObject.effects)) {
            const effectsResult = await this.executeEffects(choiceObject.effects, "choiceSelection", {choice: choiceObject});
            outcome.effectsAppliedCount = effectsResult.effectsAppliedCount;
            if(effectsResult.message) outcome.message = effectsResult.message; // Effects might have a message
            if(effectsResult.messageType) outcome.messageType = effectsResult.messageType;
        }

        // 3. Determine next step based on choice properties
        if (choiceObject.targetSceneId) {
            outcome.nextSceneId = choiceObject.targetSceneId;
            outcome.transitionEffect = choiceObject.transitionEffect; // Pass along transition effect
        } else if (choiceObject.endsGame) {
            outcome.endGame = true;
            outcome.finalCutsceneId = choiceObject.finalCutsceneId || 'default_ending'; // Specify which ending
        } else {
            // If no targetSceneId and doesn't end game, it might just modify current state
            // or refresh the current scene to show updated choices/text.
            outcome.refreshScene = true; // Default to refresh if no explicit next scene
            if (!outcome.message && outcome.effectsAppliedCount > 0) {
                // outcome.message = InteractiveAdventure.localization.getString('action_taken') || "Action taken.";
            }
        }

        // Trigger achievement for making a choice if relevant
        if (choiceObject.id) { // Assuming choices have unique IDs for tracking
            this.achievementSystem.triggerEvent('choice_made', { choiceId: choiceObject.id, sceneId: this.sceneManager.getCurrentSceneId() });
        }


        console.log("ChoiceEngine: Choice processed. Outcome:", outcome);
        return outcome;
    }

    /**
     * @method executeEffects
     * @description Executes a list of effect objects.
     * @param {Array<object>} effects - Array of effect objects.
     *                                  Example: [{ type: "SET_FLAG", flag: "key_found", value: true },
     *                                            { type: "ADD_ITEM", itemId: "gold_coin", quantity: 10 },
     *                                            { type: "MODIFY_STAT", statId: "health", amount: -5 },
     *                                            { type: "ADD_XP", amount: 50 }]
     * @param {string} [source="unknown"] - Source of the effects (e.g., "choice", "itemUse", "sceneEnter").
     * @param {object} [context={}] - Additional context for the effects (e.g., {item, targetCharacter}).
     * @returns {Promise<object>} Result of effects execution, e.g. { effectsAppliedCount: number, message?: string, messageType?: string }
     */
    async executeEffects(effects, source = "unknown", context = {}) {
        const result = { effectsAppliedCount: 0, message: null, messageType: 'info' };
        if (!effects || !Array.isArray(effects)) {
            return result;
        }

        console.log(`ChoiceEngine: Executing ${effects.length} effects from source "${source}". Context:`, context);

        for (const effect of effects) {
            // First, check if this specific effect has its own conditions
            if (effect.conditions && !this.areConditionsMet(effect.conditions)) {
                console.log("ChoiceEngine: Skipped effect due to unmet conditions:", effect);
                continue; // Skip this effect
            }

            let effectAppliedThisIteration = true; // Assume true unless a system reports failure

            switch (effect.type) {
                case 'SET_FLAG': // { type: "SET_FLAG", flag: "flagName", value: true/false }
                    this.stateManager.setFlag(effect.flag, effect.value);
                    break;
                case 'SET_VARIABLE': // { type: "SET_VARIABLE", variable: "varName", value: any }
                    this.stateManager.setGameStateVar(effect.variable, effect.value);
                    break;
                case 'MODIFY_VARIABLE': // { type: "MODIFY_VARIABLE", variable: "varName", amount: number }
                    this.stateManager.modifyGameStateVar(effect.variable, effect.amount);
                    break;
                case 'ADD_ITEM': // { type: "ADD_ITEM", itemId: "itemId", quantity: 1 }
                    if (!this.inventorySystem.addItem(effect.itemId, effect.quantity || 1)) {
                        // Item not added (e.g. inventory full)
                        effectAppliedThisIteration = false;
                        // UIManager notification is handled by InventorySystem
                    }
                    break;
                case 'REMOVE_ITEM': // { type: "REMOVE_ITEM", itemId: "itemId", quantity: 1 }
                    if (!this.inventorySystem.removeItem(effect.itemId, effect.quantity || 1)) {
                        // Item not removed (e.g. not found)
                        effectAppliedThisIteration = false;
                    }
                    break;
                case 'MODIFY_STAT': // { type: "MODIFY_STAT", statId: "health", amount: -10 }
                    this.statsSystem.modifyStatValue(effect.statId, effect.amount);
                    break;
                case 'SET_STAT': // { type: "SET_STAT", statId: "health", value: 100 }
                    this.statsSystem.setStatValue(effect.statId, effect.value);
                    break;
                case 'UNLOCK_ACHIEVEMENT': // { type: "UNLOCK_ACHIEVEMENT", achievementId: "ach_001" }
                    this.achievementSystem.unlockAchievement(effect.achievementId);
                    break;
                case 'UPDATE_ACH_PROGRESS': // { type: "UPDATE_ACH_PROGRESS", achievementId: "ach_collect", amount: 1 }
                    this.achievementSystem.updateAchievementProgress(effect.achievementId, effect.amount || 1);
                    break;
                case 'PLAY_SOUND': // { type: "PLAY_SOUND", soundId: "door_creak", filePath?: "sfx/..." }
                    InteractiveAdventure.audioManager.playSound(effect.soundId, effect.filePath);
                    break;
                case 'PLAY_MUSIC': // { type: "PLAY_MUSIC", trackId: "boss_theme", loop?: true }
                    InteractiveAdventure.audioManager.playMusic(effect.trackId, effect.loop !== undefined ? effect.loop : true);
                    break;
                case 'STOP_MUSIC': // { type: "STOP_MUSIC" }
                    InteractiveAdventure.audioManager.stopMusic();
                    break;
                case 'SHOW_NOTIFICATION': // { type: "SHOW_NOTIFICATION", messageKey: "some_message_key", messageType: "success" }
                    const message = InteractiveAdventure.localization.getString(effect.messageKey || effect.message, effect.replacements || {});
                    InteractiveAdventure.uiManager.showNotification(message, effect.messageType || 'info');
                    // This type of effect might not count towards "game state changing" effects
                    // but we'll count it for now.
                    break;
                case 'LOAD_SCENE': // { type: "LOAD_SCENE", sceneId: "other_scene", transition?: "fade"}
                    // This is a powerful effect, essentially a redirect.
                    // It should typically be the last effect or handled carefully.
                    // For now, assume it's handled by the choice's targetSceneId.
                    // If used in onEnter of a scene, it could create loops if not careful.
                    console.warn("ChoiceEngine: LOAD_SCENE effect type should be used cautiously within effects lists. Prefer targetSceneId on choices.");
                    // To implement: this.sceneManager.loadAndDisplayScene(effect.sceneId, effect.transition);
                    // This would likely terminate further effect processing for the current chain.
                    break;
                // TODO: Add more effect types:
                // - START_CUTSCENE
                // - ADD_QUEST / UPDATE_QUEST_STEP
                // - SPAWN_NPC / REMOVE_NPC
                // - CHANGE_SCENE_IMAGE / TEXT (if current scene can be dynamically altered)
                default:
                    console.warn(`ChoiceEngine: Unknown effect type "${effect.type}" from source "${source}".`);
                    effectAppliedThisIteration = false;
                    break;
            }
            if(effectAppliedThisIteration) result.effectsAppliedCount++;
        }
        return result;
    }


    /**
     * @method areConditionsMet
     * @description Checks if a set of conditions are met based on the current game state.
     * @param {Array<object> | object} conditions - An array of condition objects or a single condition object.
     *                                  Example: [{ type: "FLAG_IS_SET", flag: "key_found" },
     *                                            { type: "HAS_ITEM", itemId: "gold_coin", quantity: 5 },
     *                                            { type: "STAT_GREATER_THAN", statId: "strength", value: 10 }]
     *                                  Can also be a single condition object.
     *                                  Conditions in an array are ANDed by default. Use { operator: "OR", conditions: [...] } for OR.
     * @returns {boolean} True if all conditions are met, false otherwise.
     */
    areConditionsMet(conditions) {
        if (!conditions) {
            return true; // No conditions means always met
        }

        const conditionList = Array.isArray(conditions) ? conditions : [conditions];

        if (conditionList.length === 0) {
            return true;
        }

        // Handle logical operators (AND, OR, NOT) if the root is an operator object
        if (conditionList.length === 1 && conditionList[0].operator) {
            const opCondition = conditionList[0];
            switch (opCondition.operator.toUpperCase()) {
                case 'OR':
                    return opCondition.conditions.some(cond => this.evaluateSingleCondition(cond));
                case 'AND': // AND is default for array, but can be explicit
                    return opCondition.conditions.every(cond => this.evaluateSingleCondition(cond));
                case 'NOT':
                    return !this.areConditionsMet(opCondition.conditions); // Recursive call for NOT's sub-conditions
                default:
                    console.warn(`ChoiceEngine: Unknown operator "${opCondition.operator}" in conditions.`);
                    return false;
            }
        }

        // Default: All conditions in the array must be true (AND logic)
        return conditionList.every(condition => this.evaluateSingleCondition(condition));
    }

    /**
     * @method evaluateSingleCondition
     * @description Evaluates a single condition object.
     * @param {object} condition - A single condition object.
     * @returns {boolean} True if the condition is met.
     * @private
     */
    evaluateSingleCondition(condition) {
        if (!condition || !condition.type) {
            console.warn("ChoiceEngine: Invalid or missing condition type.", condition);
            return false; // Or true, depending on desired behavior for malformed conditions
        }

        // Handle nested logical operators within a single condition object (if not already handled by areConditionsMet)
        if (condition.operator) {
            return this.areConditionsMet(condition); // Let areConditionsMet handle the operator logic
        }

        switch (condition.type.toUpperCase()) {
            case 'FLAG_IS_SET': // { type: "FLAG_IS_SET", flag: "flagName", value?: boolean (defaults to true) }
                return this.stateManager.getFlag(condition.flag) === (condition.value !== undefined ? condition.value : true);
            case 'HAS_ITEM': // { type: "HAS_ITEM", itemId: "itemId", quantity?: 1 }
                return this.inventorySystem.hasItem(condition.itemId, condition.quantity || 1);
            case 'STAT_EQUALS': // { type: "STAT_EQUALS", statId: "level", value: 5 }
                return this.statsSystem.getStatValue(condition.statId) === condition.value;
            case 'STAT_GREATER_THAN': // { type: "STAT_GREATER_THAN", statId: "strength", value: 10 }
                return (this.statsSystem.getStatValue(condition.statId) || 0) > condition.value;
            case 'STAT_LESS_THAN': // { type: "STAT_LESS_THAN", statId: "health", value: 25 }
                return (this.statsSystem.getStatValue(condition.statId) || 0) < condition.value;
            case 'STAT_GTE': // Greater Than or Equal
                return (this.statsSystem.getStatValue(condition.statId) || 0) >= condition.value;
            case 'STAT_LTE': // Less Than or Equal
                return (this.statsSystem.getStatValue(condition.statId) || 0) <= condition.value;
            case 'VARIABLE_EQUALS': // { type: "VARIABLE_EQUALS", variable: "varName", value: any }
                return this.stateManager.getGameStateVar(condition.variable) === condition.value;
            case 'VARIABLE_GREATER_THAN':
                return (this.stateManager.getGameStateVar(condition.variable) || 0) > condition.value;
            case 'VARIABLE_LESS_THAN':
                return (this.stateManager.getGameStateVar(condition.variable) || 0) < condition.value;
            case 'CURRENT_SCENE_IS': // { type: "CURRENT_SCENE_IS", sceneId: "some_scene" }
                return this.sceneManager.getCurrentSceneId() === condition.sceneId;
            case 'ACHIEVEMENT_UNLOCKED': // { type: "ACHIEVEMENT_UNLOCKED", achievementId: "ach_001" }
                return this.achievementSystem.isUnlocked(condition.achievementId);
            // TODO: Add more condition types:
            // - RANDOM_CHANCE: { type: "RANDOM_CHANCE", probability: 0.5 } (for 50% chance)
            // - NPC_STATUS: { type: "NPC_STATUS", npcId: "guard", status: "hostile" }
            // - QUEST_STATUS: { type: "QUEST_STATUS", questId: "main_quest", status: "active", step?: 3 }
            default:
                console.warn(`ChoiceEngine: Unknown condition type "${condition.type}".`);
                return false;
        }
    }
}

export default ChoiceEngine;
