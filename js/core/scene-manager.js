// ============== SCENE MANAGER MODULE ============== //

import InteractiveAdventure from "./main.js"; // To access other modules if needed, or pass them in constructor

/**
 * @class SceneManager
 * @description Manages the loading, display, and transitions of game scenes.
 */
class SceneManager {
    /**
     * @constructor
     * @param {DataLoader} dataLoader - Instance of DataLoader for fetching scene data.
     * @param {UIManager} uiManager - Instance of UIManager for updating the UI.
     * @param {StateManager} stateManager - Instance of StateManager for accessing game state.
     * @param {AudioManager} audioManager - Instance of AudioManager for scene-specific audio.
     * @param {AnimationController} animationController - Instance of AnimationController for scene transitions/effects.
     */
    constructor(dataLoader, uiManager, stateManager, audioManager, animationController) {
        this.dataLoader = dataLoader;
        this.uiManager = uiManager;
        this.stateManager = stateManager;
        this.audioManager = audioManager;
        this.animationController = animationController; // For scene transitions or in-scene animations

        this.scenes = {}; // Stores all loaded scene data, indexed by sceneId
        this.currentSceneId = null;
        this.currentSceneData = null;
        this.choiceEngine = null; // To be set via setChoiceEngine

        console.log("SceneManager initialized.");
    }

    /**
     * @method setChoiceEngine
     * @description Sets the choice engine instance. Called from main.js after ChoiceEngine is initialized.
     * @param {ChoiceEngine} choiceEngine - The choice engine instance.
     */
    setChoiceEngine(choiceEngine) {
        this.choiceEngine = choiceEngine;
    }

    /**
     * @method loadScenes
     * @description Loads scene data from a JSON file.
     * @param {string} filePath - The path to the JSON file containing scene data.
     * @returns {Promise<void>}
     */
    async loadScenes(filePath) {
        try {
            console.log(`SceneManager: Loading scenes from ${filePath}...`);
            const rawScenesData = await this.dataLoader.loadJSON(filePath);
            if (rawScenesData && Array.isArray(rawScenesData.scenes)) {
                rawScenesData.scenes.forEach(scene => {
                    this.scenes[scene.id] = scene;
                });
                console.log(`SceneManager: ${Object.keys(this.scenes).length} scenes loaded successfully.`);
            } else {
                console.error("SceneManager: Scene data is not in the expected format (array of scenes).", rawScenesData);
                throw new Error("Invalid scene data format.");
            }
        } catch (error) {
            console.error(`SceneManager: Error loading scenes from ${filePath}:`, error);
            InteractiveAdventure.errorHandler.handle(error, `Failed to load scenes from ${filePath}`);
            // Potentially throw the error инфекционно to be caught by main.js init
            throw error;
        }
    }

    /**
     * @method getSceneData
     * @description Retrieves data for a specific scene by its ID.
     * @param {string} sceneId - The ID of the scene to retrieve.
     * @returns {object | null} The scene data object, or null if not found.
     */
    getSceneData(sceneId) {
        return this.scenes[sceneId] || null;
    }

    /**
     * @method getCurrentSceneId
     * @description Gets the ID of the currently active scene.
     * @returns {string | null}
     */
    getCurrentSceneId() {
        return this.currentSceneId;
    }

    /**
     * @method getCurrentSceneData
     * @description Gets the data of the currently active scene.
     * @returns {object | null}
     */
    getCurrentSceneData() {
        return this.currentSceneData;
    }

    /**
     * @method loadAndDisplayScene
     * @description Loads a scene by its ID and displays it.
     * @param {string} sceneId - The ID of the scene to load and display.
     * @param {string} transitionEffect - Optional transition effect name (e.g., 'fadeIn', 'slideLeft').
     * @returns {Promise<void>}
     */
    async loadAndDisplayScene(sceneId, transitionEffect = 'fadeIn') {
        const sceneData = this.getSceneData(sceneId);

        if (!sceneData) {
            console.error(`SceneManager: Scene with ID "${sceneId}" not found.`);
            // Fallback: load a default error scene or go to menu
            // For now, log error and potentially stop or show an error message via UIManager
            this.uiManager.showNotification(`Error: Scene "${sceneId}" could not be loaded.`, 'error');
            // Potentially navigate to a safe state, e.g., main menu
            // InteractiveAdventure.gameEngine.setState(InteractiveAdventure.gameEngine.GAME_STATES.MENU);
            // InteractiveAdventure.menuController.showMenu();
            return;
        }

        console.log(`SceneManager: Loading scene "${sceneId}" - ${sceneData.title || 'Untitled Scene'}`);
        this.currentSceneId = sceneId;
        this.currentSceneData = sceneData;

        // Update game state with current scene
        this.stateManager.setCurrentSceneId(sceneId);
        this.stateManager.setGameStateVar('currentLocationName', sceneData.location || sceneData.title || 'Unknown Location');


        // Pre-scene actions (e.g., run scripts, update state based on scene entry)
        if (sceneData.onEnter) {
            // TODO: Implement a script runner or event system for onEnter actions
            // For example, this.choiceEngine.executeEffects(sceneData.onEnter);
            console.log(`SceneManager: Executing onEnter actions for scene ${sceneId}`);
            await this.choiceEngine.executeEffects(sceneData.onEnter.effects, "onEnter");
        }


        // Update UI (handle transition effects)
        if (transitionEffect && this.animationController) {
            // Example: Fade out old scene content if any
            // await this.animationController.fadeOut(this.uiManager.getSceneContentElement(), 300);
        }

        this.uiManager.renderScene(sceneData);
        this.displayChoices(sceneData.choices);

        if (transitionEffect && this.animationController) {
            // Example: Fade in new scene content
            // await this.animationController.fadeIn(this.uiManager.getSceneContentElement(), 500);
        }

        // Play scene-specific music or ambient sound
        if (sceneData.musicTrack && this.audioManager) {
            this.audioManager.playMusic(sceneData.musicTrack, true); // Loop scene music
        } else if (this.audioManager && !sceneData.musicTrack) {
            // If no specific music, maybe play default ambient or stop current music
            // this.audioManager.stopMusic(); // Or play a default track
        }
        if (sceneData.ambientSound && this.audioManager) {
            this.audioManager.playAmbientSound(sceneData.ambientSound, true);
        }


        // Post-scene actions (e.g., trigger achievements for visiting a scene)
        if (this.stateManager && InteractiveAdventure.achievementSystem) {
             InteractiveAdventure.achievementSystem.triggerEvent('scene_visited', { sceneId: sceneId });
        }

        // Auto-save if enabled
        if (this.stateManager && InteractiveAdventure.config.getGameSetting('enableAutosaveOnSceneChange')) {
            this.stateManager.autoSaveGame();
        }
    }


    /**
     * @method displayChoices
     * @description Filters choices based on conditions and displays them.
     * @param {Array<object>} choices - An array of choice objects from the scene data.
     */
    displayChoices(choices) {
        if (!this.choiceEngine) {
            console.error("SceneManager: ChoiceEngine is not set. Cannot display choices.");
            this.uiManager.displayChoices([]); // Display no choices
            return;
        }

        const availableChoices = [];
        if (choices && Array.isArray(choices)) {
            choices.forEach(choice => {
                if (this.choiceEngine.areConditionsMet(choice.conditions)) {
                    // Check if choice should be hidden but selectable (e.g., for skill checks later)
                    // Or if it's completely unavailable.
                    // For now, assume if conditions met, it's visible.
                    availableChoices.push(choice);
                } else if (choice.showIfConditionFalse) {
                    // Handle choices that are visible but disabled or have different text
                    const disabledChoice = { ...choice, disabled: true };
                    // Optionally, change text:
                    // disabledChoice.text = choice.disabledText || `(Locked) ${choice.text}`;
                    availableChoices.push(disabledChoice);
                }
            });
        }

        this.uiManager.displayChoices(availableChoices, (choiceId) => {
            this.handlePlayerChoice(choiceId);
        });
    }

    /**
     * @method handlePlayerChoice
     * @description Processes the player's selected choice.
     * @param {string | number} choiceId - The ID of the choice selected by the player.
     *                     (Note: choices are usually identified by their index or a unique ID if provided in data)
     */
    async handlePlayerChoice(choiceId) {
        if (!this.currentSceneData || !this.currentSceneData.choices) {
            console.error("SceneManager: No current scene data or choices to handle.");
            return;
        }

        // Find the selected choice object.
        // Choices might be identified by an 'id' field or by their index.
        // For this example, assume choiceId directly maps to a choice object or an identifier
        // that ChoiceEngine can resolve from currentSceneData.choices.
        const selectedChoiceObject = this.currentSceneData.choices.find(c => c.id === choiceId || c.text === choiceId); // Simple lookup

        if (!selectedChoiceObject) {
            console.error(`SceneManager: Could not find choice with ID/text: ${choiceId}`);
            return;
        }

        if (selectedChoiceObject.disabled) {
            console.log(`SceneManager: Player selected a disabled choice: ${choiceId}. No action taken.`);
            this.uiManager.showNotification(InteractiveAdventure.localization.getString('choice_locked_message') || "This option is currently unavailable.", "info");
            return;
        }

        console.log(`SceneManager: Player selected choice: ${selectedChoiceObject.text}`);

        if (this.choiceEngine) {
            const outcome = await this.choiceEngine.processChoice(selectedChoiceObject);

            if (outcome && outcome.nextSceneId) {
                this.loadAndDisplayScene(outcome.nextSceneId, outcome.transitionEffect || 'fadeIn');
            } else if (outcome && outcome.endGame) {
                // Handle game ending
                console.log("SceneManager: Choice leads to game end.");
                InteractiveAdventure.gameEngine.setState(InteractiveAdventure.gameEngine.GAME_STATES.CUTSCENE); // Or GAME_OVER
                InteractiveAdventure.cutscenePlayer.play(outcome.finalCutsceneId || 'default_ending');
            } else if (outcome && outcome.refreshScene) {
                // If the choice modifies the current scene's state without changing scenes
                console.log("SceneManager: Refreshing current scene due to choice outcome.");
                this.loadAndDisplayScene(this.currentSceneId, 'none'); // Reload with no transition
            } else if (outcome && outcome.message) {
                this.uiManager.showNotification(outcome.message, outcome.messageType || 'info');
                // If no next scene, might need to re-evaluate choices on current scene
                this.displayChoices(this.currentSceneData.choices);
            }
            // If no specific outcome, the choice might have just triggered effects,
            // and the scene might need to be re-evaluated or stay as is.
            // The ChoiceEngine should ideally always return a clear next step.
        } else {
            console.error("SceneManager: ChoiceEngine not available to process choice.");
        }
    }

    /**
     * @method transitionToScene
     * @description Handles the visual transition to a new scene (basic implementation).
     * @param {string} nextSceneId - The ID of the next scene.
     * @param {string} [effect='fadeIn'] - The transition effect to use.
     */
    async transitionToScene(nextSceneId, effect = 'fadeIn') {
        // This is a simplified version; loadAndDisplayScene incorporates transitions.
        // This method could be used for more complex, multi-stage transitions if needed.
        console.log(`SceneManager: Transitioning to scene ${nextSceneId} with effect ${effect}`);

        // Example using AnimationController (if available)
        if (this.animationController) {
            const sceneContainer = this.uiManager.getSceneContainerElement(); // Assume UIManager provides this
            if (sceneContainer) {
                await this.animationController.runTransition(sceneContainer, effect, async () => {
                    await this.loadAndDisplayScene(nextSceneId, 'none'); // Load new scene without its own transition
                });
            } else {
                await this.loadAndDisplayScene(nextSceneId, effect); // Fallback if container not found
            }
        } else {
            await this.loadAndDisplayScene(nextSceneId, effect); // No animation controller, just load
        }
    }
}

export default SceneManager;
