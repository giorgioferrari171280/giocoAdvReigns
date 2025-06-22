// ============== MAIN JAVASCRIPT FILE (ENTRY POINT) ============== //

// Import Core Modules (example, adjust paths and module types as needed)
import GameEngine from './game-engine.js';
import SceneManager from './scene-manager.js';
import StateManager from './state-manager.js';
import Config from './config.js';

// Import System Modules
import SaveSystem from '../systems/save-system.js';
import Localization from '../systems/localization.js';
import AudioManager from '../systems/audio-manager.js';
import UIManager from '../systems/ui-manager.js';
import InventorySystem from '../systems/inventory-system.js';
import StatsSystem from '../systems/stats-system.js';
import AchievementSystem from '../systems/achievement-system.js';
import ChoiceEngine from '../systems/choice-engine.js';

// Import Controllers
import MenuController from '../controllers/menu-controller.js';
import GameController from '../controllers/game-controller.js';
import OptionsController from '../controllers/options-controller.js';
import HallOfFameController from '../controllers/halloffame-controller.js';

// Import Narrative Modules
import CutscenePlayer from '../narrative/cutscene-player.js';
// import StoryParser from '../narrative/story-parser.js'; // If complex parsing is needed
import AnimationController from '../narrative/animation-controller.js';

// Import Utility Modules
import DataLoader from '../utils/data-loader.js';
import ErrorHandler from '../utils/error-handler.js';
// import Analytics from '../utils/analytics.js'; // Optional

// Global Game Object (Namespace)
const InteractiveAdventure = {
    // Core Instances
    config: null,
    gameEngine: null,
    sceneManager: null,
    stateManager: null,

    // System Instances
    saveSystem: null,
    localization: null,
    audioManager: null,
    uiManager: null,
    inventorySystem: null,
    statsSystem: null,
    achievementSystem: null,
    choiceEngine: null,

    // Controller Instances
    menuController: null,
    gameController: null,
    optionsController: null,
    hallOfFameController: null,

    // Narrative Instances
    cutscenePlayer: null,
    animationController: null,

    // Utility Instances
    dataLoader: null,
    errorHandler: null,
    // analytics: null, // Optional

    // --- Initialization Method ---
    async init() {
        console.log("Interactive Adventure Game: Initializing...");

        // Initialize Error Handler first
        this.errorHandler = new ErrorHandler();
        window.onerror = (message, source, lineno, colno, error) => {
            this.errorHandler.handle(error || { message, source, lineno, colno }, 'Global window.onerror');
            return true; // Prevents default browser error handling
        };
        window.onunhandledrejection = (event) => {
            this.errorHandler.handle(event.reason, 'Global unhandledrejection');
        };

        try {
            // 0. Data Loader
            this.dataLoader = new DataLoader();

            // 1. Configuration
            this.config = new Config(this.dataLoader);
            await this.config.loadConfigs();
            console.log("Config loaded:", this.config.getGameSetting('gameTitle') || 'Default Game Title');

            // 2. Localization
            this.localization = new Localization(this.dataLoader, this.config.getUserSetting('language') || this.config.getGameSetting('defaultLanguage') || 'en');
            await this.localization.loadLanguage();
            console.log("Localization initialized for language:", this.localization.getCurrentLanguage());

            // 3. UI Manager (needs localization for initial UI elements)
            this.uiManager = new UIManager(this.localization);
            this.uiManager.setGameContainer(document.getElementById('game-container'));
            this.uiManager.setInitialLoadingScreen(document.getElementById('initial-loading'));
            this.uiManager.showInitialLoadingScreen(true); // Show it if not already visible

            // 4. State Manager & Save System
            this.saveSystem = new SaveSystem(this.config.getGameSetting('savePrefix') || 'interactiveAdventure_');
            this.stateManager = new StateManager(this.saveSystem);
            // TODO: Load initial game state or default state
            // this.stateManager.loadGame(this.config.getUserSetting('lastSaveSlot') || 0);

            // 5. Audio Manager
            this.audioManager = new AudioManager(this.config);
            // this.audioManager.setMusicVolume(this.config.getUserSetting('musicVolume'));
            // this.audioManager.setSfxVolume(this.config.getUserSetting('sfxVolume'));

            // 6. Animation Controller
            this.animationController = new AnimationController();

            // 7. Inventory, Stats, Achievements Systems (might need data loading)
            this.inventorySystem = new InventorySystem(this.dataLoader, this.stateManager, this.uiManager);
            await this.inventorySystem.loadItemsData('data/game/items.json'); // Example path

            this.statsSystem = new StatsSystem(this.stateManager, this.uiManager);
            // Potentially load character base stats or templates

            this.achievementSystem = new AchievementSystem(this.dataLoader, this.stateManager, this.uiManager, this.audioManager);
            await this.achievementSystem.loadAchievementsData('data/game/achievements.json'); // Example path

            // 8. Scene Manager & Choice Engine (these are central to gameplay)
            this.sceneManager = new SceneManager(this.dataLoader, this.uiManager, this.stateManager, this.audioManager, this.animationController);
            await this.sceneManager.loadScenes('data/game/scenes.json'); // Example path

            this.choiceEngine = new ChoiceEngine(this.stateManager, this.sceneManager, this.inventorySystem, this.statsSystem, this.achievementSystem);
            this.sceneManager.setChoiceEngine(this.choiceEngine); // Link choice engine to scene manager

            // 9. Game Engine (main loop, state transitions)
            this.gameEngine = new GameEngine(this.uiManager, this.sceneManager, this.stateManager);

            // 10. Controllers
            this.menuController = new MenuController(this.uiManager, this.gameEngine, this.stateManager, this.optionsController, this.audioManager, this.saveSystem);
            this.optionsController = new OptionsController(this.uiManager, this.config, this.localization, this.audioManager, this.saveSystem);
            this.gameController = new GameController(this.uiManager, this.gameEngine, this.sceneManager, this.inventorySystem, this.statsSystem, this.optionsController, this.choiceEngine, this.audioManager, this.animationController);
            this.hallOfFameController = new HallOfFameController(this.uiManager, this.achievementSystem, this.stateManager); // Assuming state manager holds scores

            // 11. Cutscene Player
            this.cutscenePlayer = new CutscenePlayer(this.uiManager, this.audioManager, this.animationController, this.localization);

            // 12. (Optional) Analytics
            // this.analytics = new Analytics(this.config.getGameSetting('analyticsId'));
            // this.analytics.trackEvent('game_initialized');

            console.log("All modules initialized.");
            this.startGame();

        } catch (error) {
            console.error("Fatal error during game initialization:", error);
            this.errorHandler.showFatalError("Could not initialize the game. Please try refreshing the page or contact support if the problem persists.", error);
            this.uiManager.showInitialLoadingScreen(false); // Hide loading screen to show error
        }
    },

    // --- Start Game Method ---
    async startGame() {
        console.log("Starting game...");
        // Determine initial screen (e.g., pre-options, splash, or menu)
        const visitedBefore = this.config.getUserSetting('visitedBefore');

        if (!visitedBefore || this.config.getGameSetting('alwaysShowPreOptions')) {
            // TODO: Implement pre-options screen logic if needed
            // For now, assume it goes to splash or menu
            // this.uiManager.navigateTo('pre-options.html');
            // this.config.setUserSetting('visitedBefore', true);
            // this.config.saveUserSettings();
            console.log("First visit or pre-options required (not implemented, skipping to splash).");
        }

        // For now, let's assume we always go to the splash screen first
        // The UIManager will handle loading the actual HTML content for 'splash'
        this.uiManager.showInitialLoadingScreen(false); // Hide initial spinner from index.html
        this.uiManager.navigateToScreen('splash'); // Navigate to splash screen content

        // Example: To go directly to menu for testing
        // this.uiManager.showInitialLoadingScreen(false);
        // this.menuController.showMenu();

        // Example: To go directly to a game scene for testing
        // this.uiManager.showInitialLoadingScreen(false);
        // await this.uiManager.navigateToScreen('game'); // Load game.html structure
        // this.gameController.startGameAtScene('scene_001'); // Start game controller with a specific scene
    }
};

// --- DOMContentLoaded Listener ---
// Ensures the DOM is fully loaded before trying to initialize the game
document.addEventListener('DOMContentLoaded', () => {
    if (typeof GameEngine !== 'undefined') { // Simple check if classes are loaded
        InteractiveAdventure.init();
    } else {
        // Fallback or error message if scripts didn't load,
        // though Webpack usually handles this.
        console.error("Core game scripts not loaded!");
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.innerHTML = `
                <div style="color: red; text-align: center; padding: 20px;">
                    <h1>Error</h1>
                    <p>Failed to load game scripts. Please check the console for details and ensure JavaScript is enabled.</p>
                </div>`;
        }
        const loadingScreen = document.getElementById('initial-loading');
        if (loadingScreen) loadingScreen.classList.add('hidden');
    }
});

// Expose the main game object to the window for debugging or specific integrations (optional)
// window.InteractiveAdventure = InteractiveAdventure;

export default InteractiveAdventure; // If using ES modules and main.js is the entry for Webpack
