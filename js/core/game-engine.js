// ============== GAME ENGINE MODULE ============== //

/**
 * @class GameEngine
 * @description Manages the main game loop (if needed), game states (MENU, PLAYING, PAUSED, etc.),
 * and coordinates high-level interactions between different game systems.
 */
class GameEngine {
    /**
     * @constructor
     * @param {UIManager} uiManager - Instance of UIManager for UI interactions.
     * @param {SceneManager} sceneManager - Instance of SceneManager for scene handling.
     * @param {StateManager} stateManager - Instance of StateManager for game state.
     */
    constructor(uiManager, sceneManager, stateManager) {
        this.uiManager = uiManager;
        this.sceneManager = sceneManager;
        this.stateManager = stateManager;

        this.GAME_STATES = {
            INITIALIZING: 'INITIALIZING',
            PRE_OPTIONS: 'PRE_OPTIONS', // Optional screen for first-time setup
            SPLASH: 'SPLASH',
            MENU: 'MENU',
            OPTIONS: 'OPTIONS', // Main options screen
            GAME_OPTIONS: 'GAME_OPTIONS', // In-game options
            SAVES: 'SAVES', // Load/Save screen
            PLAYING: 'PLAYING',
            PAUSED: 'PAUSED', // Could be same as GAME_OPTIONS
            CUTSCENE: 'CUTSCENE', // For intro, outro, or in-game cutscenes
            INVENTORY: 'INVENTORY', // Viewing inventory
            STATS: 'STATS', // Viewing player stats
            HALL_OF_FAME: 'HALL_OF_FAME',
            ACHIEVEMENTS_GRID: 'ACHIEVEMENTS_GRID',
            LOADING: 'LOADING', // General loading state for assets or scenes
            GAME_OVER: 'GAME_OVER', // If there's a specific game over screen before final cutscene/credits
            ERROR: 'ERROR'
        };

        this.currentState = this.GAME_STATES.INITIALIZING;
        this.previousState = null;

        // For a potential game loop (more relevant for real-time games)
        this.lastFrameTime = 0;
        this.isRunning = false;
        this.rafId = null; // requestAnimationFrame ID

        console.log("GameEngine initialized.");
    }

    /**
     * @method setState
     * @description Sets the current game state and logs the transition.
     * @param {string} newState - The new state to transition to (must be one of GAME_STATES).
     */
    setState(newState) {
        if (this.GAME_STATES[newState]) {
            this.previousState = this.currentState;
            this.currentState = newState;
            console.log(`GameEngine: State changed from ${this.previousState} to ${this.currentState}`);
            // Emit an event or call a handler for state changes if needed
            // document.dispatchEvent(new CustomEvent('gamestatechange', { detail: { newState, oldState: this.previousState } }));
        } else {
            console.error(`GameEngine: Attempted to set an invalid state: ${newState}`);
        }
    }

    /**
     * @method getCurrentState
     * @description Returns the current game state.
     * @returns {string} The current game state.
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * @method startNewGame
     * @description Initiates a new game, resetting state and starting the intro/first scene.
     */
    startNewGame() {
        console.log("GameEngine: Starting new game...");
        this.setState(this.GAME_STATES.LOADING);
        this.uiManager.showLoadingScreen("Starting New Adventure..."); // Show a specific loading message

        // Reset game state (player stats, inventory, flags, etc.)
        this.stateManager.resetGameState();
        // TODO: Potentially reset achievement progress for a "new playthrough" if desired, or keep them persistent.
        // this.achievementSystem.resetProgress(); // If achievements are per-playthrough

        // Load intro cutscene or first game scene
        // This will be handled by a controller, e.g., MenuController calling GameController
        // For now, just set state, actual navigation will be elsewhere
        // this.setState(this.GAME_STATES.CUTSCENE); // e.g., for an intro
        // this.sceneManager.loadScene(this.stateManager.getGameConstants().INITIAL_SCENE_ID || 'scene_001');

        // The actual navigation to game.html and scene loading will be
        // triggered by the controller that calls this method (e.g., MenuController)
        // after this method returns.
    }

    /**
     * @method loadGame
     * @description Loads a game from a specified save slot.
     * @param {number | string} slotId - The ID of the save slot to load.
     * @returns {boolean} True if loading was successful, false otherwise.
     */
    loadGame(slotId) {
        console.log(`GameEngine: Attempting to load game from slot ${slotId}...`);
        this.setState(this.GAME_STATES.LOADING);
        this.uiManager.showLoadingScreen(`Loading Game from Slot ${slotId}...`);

        const success = this.stateManager.loadGame(slotId);
        if (success) {
            console.log("GameEngine: Game loaded successfully.");
            // The UI and scene should be updated by the StateManager's load or by a controller
            // This might involve navigating to the game screen and loading the current scene from the loaded state.
            // this.setState(this.GAME_STATES.PLAYING);
            // this.sceneManager.loadScene(this.stateManager.getCurrentSceneId()); // Example
            return true;
        } else {
            console.error(`GameEngine: Failed to load game from slot ${slotId}.`);
            this.uiManager.showNotification(`Failed to load game from slot ${slotId}.`, 'error');
            this.setState(this.previousState || this.GAME_STATES.MENU); // Revert to previous state or menu
            this.uiManager.hideLoadingScreen();
            return false;
        }
    }

    /**
     * @method saveGame
     * @description Saves the current game state to a specified slot.
     * @param {number | string} slotId - The ID of the save slot to save to.
     * @returns {boolean} True if saving was successful, false otherwise.
     */
    saveGame(slotId) {
        console.log(`GameEngine: Attempting to save game to slot ${slotId}...`);
        // Optionally, update current scene ID in state before saving
        this.stateManager.setCurrentSceneId(this.sceneManager.getCurrentSceneId());

        const success = this.stateManager.saveGame(slotId);
        if (success) {
            console.log("GameEngine: Game saved successfully.");
            this.uiManager.showNotification(`Game saved to slot ${slotId}.`, 'success');
            // Potentially update the save slot UI if visible
            if (this.currentState === this.GAME_STATES.SAVES) {
                // Refresh save slots UI, will be handled by SavesController or UIManager
            }
            return true;
        } else {
            console.error(`GameEngine: Failed to save game to slot ${slotId}.`);
            this.uiManager.showNotification(`Failed to save game to slot ${slotId}.`, 'error');
            return false;
        }
    }

    /**
     * @method pauseGame
     * @description Pauses the game (e.g., to show in-game options).
     */
    pauseGame() {
        if (this.currentState === this.GAME_STATES.PLAYING) {
            this.setState(this.GAME_STATES.PAUSED);
            // Stop game time, animations, etc. if applicable
            console.log("GameEngine: Game paused.");
            // Typically, UIManager would show the game options modal here
        }
    }

    /**
     * @method resumeGame
     * @description Resumes the game from a paused state.
     */
    resumeGame() {
        if (this.currentState === this.GAME_STATES.PAUSED || this.currentState === this.GAME_STATES.GAME_OPTIONS) {
            this.setState(this.GAME_STATES.PLAYING);
            // Resume game time, animations, etc.
            console.log("GameEngine: Game resumed.");
            // UIManager would hide the game options modal
        }
    }

    /**
     * @method quitGame
     * @description Quits the current game session and returns to the main menu.
     */
    quitGame() {
        console.log("GameEngine: Quitting game to main menu...");
        // Perform any cleanup for the current game session
        // this.stateManager.clearCurrentGameProgress(); // Optional: clear non-saved progress
        this.setState(this.GAME_STATES.MENU);
        // UIManager will navigate to the menu screen
    }


    // --- Game Loop (Optional, for real-time updates or animations not handled by CSS/CutscenePlayer) ---

    /**
     * @method startGameLoop
     * @description Starts the game loop.
     */
    startGameLoop() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.rafId = requestAnimationFrame(this.gameLoop.bind(this));
        console.log("GameEngine: Game loop started.");
    }

    /**
     * @method stopGameLoop
     * @description Stops the game loop.
     */
    stopGameLoop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
        console.log("GameEngine: Game loop stopped.");
    }

    /**
     * @method gameLoop
     * @description The main game loop function.
     * @param {DOMHighResTimeStamp} timestamp - The current time provided by requestAnimationFrame.
     */
    gameLoop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = (timestamp - this.lastFrameTime) / 1000; // Delta time in seconds
        this.lastFrameTime = timestamp;

        this.update(deltaTime);
        // this.render(); // Rendering is mostly handled by UIManager based on state

        this.rafId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * @method update
     * @description Updates the game state based on delta time.
     *              Called by the game loop.
     * @param {number} deltaTime - The time elapsed since the last frame, in seconds.
     */
    update(deltaTime) {
        // This is where real-time game logic would go.
        // For a text adventure, this might not be heavily used unless there are timed events or animations.
        // - Update animations (if not CSS based)
        // - Check for timed events
        // - Update AI (if any)

        if (this.currentState === this.GAME_STATES.PLAYING) {
            // Example: this.sceneManager.update(deltaTime);
            // Example: this.animationController.update(deltaTime);
        }
    }

    /**
     * @method render
     * @description Renders the current game view.
     *              Called by the game loop. (Often handled by UIManager in this structure)
     */
    // render() {
    //     // Most rendering is event-driven and handled by UIManager updating the DOM.
    //     // This would be for canvas rendering or other custom rendering logic.
    //     // this.uiManager.render(); // If UIManager had a batch render method
    // }

    /**
     * @method processInput
     * @description Processes player input.
     * @param {string} inputType - Type of input (e.g., 'choice', 'button_click', 'key_press').
     * @param {any} inputValue - Value of the input (e.g., choice ID, button ID, key code).
     */
    processInput(inputType, inputValue) {
        console.log(`GameEngine: Processing input - Type: ${inputType}, Value: ${inputValue}`);

        // Input handling logic will largely be in specific controllers (MenuController, GameController)
        // This engine method could be a central dispatcher if needed, or controllers can handle directly.

        switch (this.currentState) {
            case this.GAME_STATES.MENU:
                // Delegate to MenuController
                // this.menuController.handleInput(inputType, inputValue);
                break;
            case this.GAME_STATES.PLAYING:
                // Delegate to GameController
                // this.gameController.handleInput(inputType, inputValue);
                break;
            // Add other states as needed
        }
    }
}

export default GameEngine;
