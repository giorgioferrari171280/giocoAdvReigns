// ============== MENU CONTROLLER MODULE ============== //

import InteractiveAdventure from "../core/main.js"; // To access UIManager, GameEngine, etc.

/**
 * @class MenuController
 * @description Handles the logic and interactions for the main menu screen.
 */
class MenuController {
    /**
     * @constructor
     * @param {UIManager} uiManager - Instance of UIManager.
     * @param {GameEngine} gameEngine - Instance of GameEngine.
     * @param {StateManager} stateManager - Instance of StateManager.
     * @param {OptionsController} optionsController - Instance of OptionsController.
     * @param {AudioManager} audioManager - Instance of AudioManager.
     * @param {SaveSystem} saveSystem - Instance of SaveSystem.
     */
    constructor(uiManager, gameEngine, stateManager, optionsController, audioManager, saveSystem) {
        this.uiManager = uiManager;
        this.gameEngine = gameEngine;
        this.stateManager = stateManager;
        this.optionsController = optionsController; // To navigate to options screen
        this.audioManager = audioManager;
        this.saveSystem = saveSystem; // To check if load game should be enabled

        this.menuContainer = null; // Will hold the menu DOM element once loaded

        console.log("MenuController initialized.");
    }

    /**
     * @method showMenu
     * @description Loads and displays the main menu screen.
     */
    async showMenu() {
        console.log("MenuController: Showing main menu...");
        this.gameEngine.setState(this.gameEngine.GAME_STATES.MENU);

        // Play menu music (if not already playing or if different)
        this.audioManager.playMusic('main_theme', true, 1000); // Example trackId

        // Load menu.html content
        this.menuContainer = await this.uiManager.navigateToScreen('menu');
        if (!this.menuContainer) {
            console.error("MenuController: Failed to load menu screen content.");
            // Fallback or error display
            return;
        }

        this._setupEventListeners();
        this._updateMenuState(); // Enable/disable buttons like "Load Game"
    }

    /**
     * @method _setupEventListeners
     * @description Sets up event listeners for the menu buttons.
     * @private
     */
    _setupEventListeners() {
        if (!this.menuContainer) return;

        const newGameBtn = this.uiManager.getElement('#new-game-btn', this.menuContainer);
        if (newGameBtn) newGameBtn.addEventListener('click', () => this.handleNewGame());

        const loadGameBtn = this.uiManager.getElement('#load-game-btn', this.menuContainer);
        if (loadGameBtn) loadGameBtn.addEventListener('click', () => this.handleLoadGame());

        const optionsBtn = this.uiManager.getElement('#options-btn', this.menuContainer);
        if (optionsBtn) optionsBtn.addEventListener('click', () => this.handleOptions());

        const hallOfFameBtn = this.uiManager.getElement('#hall-of-fame-btn', this.menuContainer);
        if (hallOfFameBtn) hallOfFameBtn.addEventListener('click', () => this.handleHallOfFame());

        const creditsBtn = this.uiManager.getElement('#credits-btn', this.menuContainer);
        if (creditsBtn) creditsBtn.addEventListener('click', () => this.handleCredits());

        const exitGameBtn = this.uiManager.getElement('#exit-game-btn', this.menuContainer);
        if (exitGameBtn) exitGameBtn.addEventListener('click', () => this.handleExitGame());

        // Add hover sounds to all menu buttons
        const menuButtons = this.uiManager.getAllElements('.menu-button', this.menuContainer);
        menuButtons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                this.audioManager.playSound('ui_hover', 'sfx/ui/button_hover.wav');
            });
        });
    }

    /**
     * @method _updateMenuState
     * @description Updates the state of menu items, e.g., enables/disables "Load Game".
     * @private
     */
    _updateMenuState() {
        if (!this.menuContainer) return;

        const loadGameBtn = this.uiManager.getElement('#load-game-btn', this.menuContainer);
        if (loadGameBtn) {
            const saves = this.saveSystem.listSaves();
            const hasSaveGames = saves.some(s => !s.isEmpty && !s.error);
            loadGameBtn.disabled = !hasSaveGames;
            if (!hasSaveGames) {
                loadGameBtn.setAttribute('title', InteractiveAdventure.localization.getString('no_saved_games_tooltip') || 'No saved games available');
            } else {
                loadGameBtn.removeAttribute('title');
            }
        }

        // Update game version display
        const versionElement = this.uiManager.getElement('#game-version .version-number', this.menuContainer);
        if (versionElement) {
            versionElement.textContent = InteractiveAdventure.config.getGameSetting('version', '1.0.0');
        }
    }


    // --- Button Handlers ---

    /**
     * @method handleNewGame
     * @description Handler for the "New Game" button.
     */
    async handleNewGame() {
        this.audioManager.playSound('ui_confirm', 'sfx/ui/confirm_action.wav'); // Example path
        console.log("MenuController: New Game selected.");

        // Confirmation step (optional)
        // const confirmed = await this.uiManager.showConfirmation("Start a new adventure? Any unsaved progress will be lost if you were in a game.");
        // if (!confirmed) return;

        this.gameEngine.startNewGame(); // Resets state

        // Navigate to the game screen and start the actual game via GameController
        await this.uiManager.navigateToScreen('game');
        // The GameController will then be responsible for loading the initial scene or intro cutscene
        InteractiveAdventure.gameController.startNewGame(); // This method in GameController will load initial scene/cutscene
    }

    /**
     * @method handleLoadGame
     * @description Handler for the "Load Game" button.
     */
    handleLoadGame() {
        this.audioManager.playSound('ui_click', 'sfx/ui/button_click.wav');
        console.log("MenuController: Load Game selected.");
        this.gameEngine.setState(this.gameEngine.GAME_STATES.SAVES);
        this.uiManager.navigateToScreen('saves', {
            onLoaded: (savesContainer) => {
                // Pass control to a potential SavesController or manage here
                if (InteractiveAdventure.optionsController && typeof InteractiveAdventure.optionsController.showSavesScreen === 'function') {
                     InteractiveAdventure.optionsController.showSavesScreen('load'); // Assuming OptionsController handles saves screen logic
                } else {
                    console.warn("MenuController: Saves screen logic handler not found in OptionsController or dedicated SavesController.");
                }
            }
        });
    }

    /**
     * @method handleOptions
     * @description Handler for the "Options" button.
     */
    handleOptions() {
        this.audioManager.playSound('ui_click', 'sfx/ui/button_click.wav');
        console.log("MenuController: Options selected.");
        // this.gameEngine.setState(this.gameEngine.GAME_STATES.OPTIONS); // State set by OptionsController
        if (this.optionsController && typeof this.optionsController.showOptionsScreen === 'function') {
            this.optionsController.showOptionsScreen();
        } else {
            console.error("MenuController: OptionsController or showOptionsScreen method not available.");
            this.uiManager.navigateToScreen('options'); // Fallback if controller method is missing
        }
    }

    /**
     * @method handleHallOfFame
     * @description Handler for the "Hall of Fame" button.
     */
    handleHallOfFame() {
        this.audioManager.playSound('ui_click', 'sfx/ui/button_click.wav');
        console.log("MenuController: Hall of Fame selected.");
        // this.gameEngine.setState(this.gameEngine.GAME_STATES.HALL_OF_FAME); // State set by HoFController
        if (InteractiveAdventure.hallOfFameController && typeof InteractiveAdventure.hallOfFameController.showHallOfFameScreen === 'function') {
            InteractiveAdventure.hallOfFameController.showHallOfFameScreen();
        } else {
            console.error("MenuController: HallOfFameController or its show method not available.");
            this.uiManager.navigateToScreen('halloffame'); // Fallback
        }
    }

    /**
     * @method handleCredits
     * @description Handler for the "Credits" button.
     */
    handleCredits() {
        this.audioManager.playSound('ui_click', 'sfx/ui/button_click.wav');
        console.log("MenuController: Credits selected.");
        this.gameEngine.setState(this.gameEngine.GAME_STATES.CUTSCENE); // Or a specific CREDITS state
        this.uiManager.navigateToScreen('credits');
        // Optionally, CutscenePlayer could handle scrolling credits if they are animated
    }

    /**
     * @method handleExitGame
     * @description Handler for the "Exit Game" button.
     *              Note: Closing browser tabs/windows programmatically is restricted.
     *              This might just show a "Thanks for playing" message or navigate to a blank page.
     */
    handleExitGame() {
        this.audioManager.playSound('ui_click', 'sfx/ui/button_click.wav');
        console.log("MenuController: Exit Game selected.");

        // Standard browser behavior: cannot close window/tab opened by user.
        // We can try, but it likely won't work unless it's a window opened by script.
        // window.close();

        // Alternative: Show a "Thanks for playing" message or navigate to a safe page.
        this.uiManager.clearGameContainer();
        this.uiManager.gameContainer.innerHTML = `
            <div style="text-align: center; padding: 50px; font-size: 1.5em;">
                <p>${InteractiveAdventure.localization.getString('thanks_for_playing') || 'Thanks for playing!'}</p>
                <p><small>${InteractiveAdventure.localization.getString('you_can_close_tab') || 'You can now close this browser tab.'}</small></p>
            </div>
        `;
        this.audioManager.stopMusic(1000);
        this.audioManager.stopAmbientSound(500);

        // Or, if on a platform like Electron, send a quit command:
        // if (typeof window.electronAPI !== 'undefined' && typeof window.electronAPI.quitApp === 'function') {
        //     window.electronAPI.quitApp();
        // }
    }
}

export default MenuController;
