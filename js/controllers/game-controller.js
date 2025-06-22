// ============== GAME CONTROLLER MODULE ============== //

import InteractiveAdventure from "../core/main.js"; // To access UIManager, GameEngine, SceneManager, etc.

/**
 * @class GameController
 * @description Handles the logic for the main gameplay screen, including scene display,
 *              player choices, and interaction with game systems during play.
 */
class GameController {
    /**
     * @constructor
     * @param {UIManager} uiManager - Instance of UIManager.
     * @param {GameEngine} gameEngine - Instance of GameEngine.
     * @param {SceneManager} sceneManager - Instance of SceneManager.
     * @param {InventorySystem} inventorySystem - Instance of InventorySystem.
     * @param {StatsSystem} statsSystem - Instance of StatsSystem.
     * @param {OptionsController} optionsController - Instance of OptionsController (for in-game options).
     * @param {ChoiceEngine} choiceEngine - Instance of ChoiceEngine.
     * @param {AudioManager} audioManager - Instance of AudioManager.
     * @param {AnimationController} animationController - Instance of AnimationController.
     */
    constructor(uiManager, gameEngine, sceneManager, inventorySystem, statsSystem, optionsController, choiceEngine, audioManager, animationController) {
        this.uiManager = uiManager;
        this.gameEngine = gameEngine;
        this.sceneManager = sceneManager;
        this.inventorySystem = inventorySystem;
        this.statsSystem = statsSystem;
        this.optionsController = optionsController;
        this.choiceEngine = choiceEngine; // SceneManager now uses this for choice processing
        this.audioManager = audioManager;
        this.animationController = animationController;

        this.gameScreenContainer = null; // DOM element for the game screen (game.html content)

        console.log("GameController initialized.");
    }

    /**
     * @method initializeGameScreen
     * @description Sets up the game screen after its HTML content is loaded.
     *              Called by UIManager.navigateToScreen or when starting a new game.
     * @param {HTMLElement} container - The main container element for the game screen.
     */
    initializeGameScreen(container) {
        this.gameScreenContainer = container;
        if (!this.gameScreenContainer) {
            console.error("GameController: Game screen container not provided for initialization.");
            return;
        }
        this.uiManager._cacheCommonElementsForScreen('game', this.gameScreenContainer); // Ensure UIManager caches game elements
        this._setupGameEventListeners();
        console.log("GameController: Game screen initialized and event listeners set up.");
    }

    /**
     * @method _setupGameEventListeners
     * @description Sets up event listeners for interactive elements on the game screen.
     * @private
     */
    _setupGameEventListeners() {
        if (!this.gameScreenContainer) return;

        // Inventory Button
        const inventoryBtn = this.uiManager.getElement('#open-inventory-btn', this.gameScreenContainer);
        if (inventoryBtn) inventoryBtn.addEventListener('click', () => this.showInventory());

        // Stats Button
        const statsBtn = this.uiManager.getElement('#open-stats-btn', this.gameScreenContainer);
        if (statsBtn) statsBtn.addEventListener('click', () => this.showStats());

        // Game Options Button
        const gameOptionsBtn = this.uiManager.getElement('#open-game-options-btn', this.gameScreenContainer);
        if (gameOptionsBtn) gameOptionsBtn.addEventListener('click', () => this.showGameOptions());

        // Choice buttons are dynamically added by UIManager.displayChoices,
        // and their event listeners are set up there, calling sceneManager.handlePlayerChoice.
    }


    /**
     * @method startNewGame
     * @description Starts a new game, loading the initial scene or intro cutscene.
     *              This is called after the game screen HTML is loaded.
     */
    startNewGame() {
        console.log("GameController: Starting new game flow...");
        this.gameEngine.setState(this.gameEngine.GAME_STATES.PLAYING); // Or CUTSCENE if intro exists
        InteractiveAdventure.stateManager.resetGameState(); // Ensure state is fresh

        // Initialize systems with the (now reset) game state
        this.inventorySystem.initializeFromState(InteractiveAdventure.stateManager.getGameState());
        this.statsSystem.initializeFromState(InteractiveAdventure.stateManager.getGameState());
        this.statsSystem.updateStatsUI(); // Display initial stats
        InteractiveAdventure.achievementSystem.initializeFromState(InteractiveAdventure.stateManager.getGameState());


        const initialSceneId = InteractiveAdventure.stateManager.getGameConstants().INITIAL_SCENE_ID || 'scene_001';

        if (initialSceneId.includes('cutscene')) { // Convention for cutscene IDs
            this.gameEngine.setState(this.gameEngine.GAME_STATES.CUTSCENE);
            InteractiveAdventure.cutscenePlayer.play(initialSceneId, () => {
                // Callback after cutscene: transition to the first playable scene
                this.gameEngine.setState(this.gameEngine.GAME_STATES.PLAYING);
                const firstPlayableScene = InteractiveAdventure.config.getGameSetting('firstPlayableSceneAfterIntro') || 'scene_001';
                this.sceneManager.loadAndDisplayScene(firstPlayableScene);
            });
        } else {
            this.sceneManager.loadAndDisplayScene(initialSceneId);
        }
    }

    /**
     * @method loadSavedGame
     * @description Loads a game from state and displays the current scene.
     *              Called after StateManager has loaded the game state.
     */
    loadSavedGame() {
        console.log("GameController: Continuing from loaded game...");
        this.gameEngine.setState(this.gameEngine.GAME_STATES.PLAYING);

        // Systems should re-initialize based on the loaded state
        this.inventorySystem.initializeFromState(InteractiveAdventure.stateManager.getGameState());
        this.statsSystem.initializeFromState(InteractiveAdventure.stateManager.getGameState());
        this.statsSystem.updateStatsUI();
        InteractiveAdventure.achievementSystem.initializeFromState(InteractiveAdventure.stateManager.getGameState());


        const currentSceneId = InteractiveAdventure.stateManager.getCurrentSceneId();
        if (currentSceneId) {
            this.sceneManager.loadAndDisplayScene(currentSceneId, 'none'); // Load with no transition initially
        } else {
            console.error("GameController: No currentSceneId found in loaded game state. Defaulting to initial scene.");
            this.startNewGame(); // Fallback if something is wrong with the save's scene ID
        }
    }

    /**
     * @method startGameAtScene // For testing/debugging
     * @description Directly starts the game at a specific scene.
     * @param {string} sceneId - The ID of the scene to start at.
     */
    startGameAtScene(sceneId) {
        console.log(`GameController: Starting game directly at scene "${sceneId}" (Debug Mode).`);
        this.gameEngine.setState(this.gameEngine.GAME_STATES.PLAYING);
        // Reset or setup a minimal viable state for testing this scene
        // For full testing, a proper save state might be better.
        InteractiveAdventure.stateManager.resetGameState(); // Or a specific test state
        this.inventorySystem.initializeFromState(InteractiveAdventure.stateManager.getGameState());
        this.statsSystem.initializeFromState(InteractiveAdventure.stateManager.getGameState());
        this.statsSystem.updateStatsUI();
        InteractiveAdventure.achievementSystem.initializeFromState(InteractiveAdventure.stateManager.getGameState());

        this.sceneManager.loadAndDisplayScene(sceneId);
    }


    // --- UI Interaction Handlers (Modals) ---

    /**
     * @method showInventory
     * @description Displays the player's inventory.
     */
    async showInventory() {
        if (this.gameEngine.getCurrentState() !== this.gameEngine.GAME_STATES.PLAYING) return; // Only from game screen

        this.audioManager.playSound('ui_open_panel', 'sfx/ui/panel_open.wav');
        console.log("GameController: Showing inventory.");
        this.gameEngine.pauseGame(); // Or set a specific INVENTORY state
        this.gameEngine.setState(this.gameEngine.GAME_STATES.INVENTORY);


        // Load inventory.html if not already loaded, then show modal
        await this.uiManager.navigateToScreen('inventory', {
            isModal: true,
            onLoaded: (modalOverlay) => {
                this.uiManager.showModal(modalOverlay.id); // inventory-modal-overlay
                this.refreshInventoryDisplay(); // Populate with items

                // Setup close button listener for this specific modal instance
                const closeBtn = this.uiManager.inventoryModal.closeBtn;
                if (closeBtn) {
                    closeBtn.onclick = () => this.hideInventory(); // Use onclick to easily replace if modal reloaded
                }
                // Add event listener for clicks on the overlay itself to close
                if (modalOverlay) {
                    modalOverlay.onclick = (event) => {
                        if (event.target === modalOverlay) { // Clicked on overlay, not panel
                            this.hideInventory();
                        }
                    };
                }
            }
        });
    }

    /**
     * @method hideInventory
     * @description Hides the inventory display.
     */
    hideInventory() {
        this.audioManager.playSound('ui_close_panel', 'sfx/ui/panel_close.wav');
        this.uiManager.hideModal('inventory-modal-overlay'); // ID of the inventory modal overlay
        this.gameEngine.resumeGame(); // Return to PLAYING state
        console.log("GameController: Inventory hidden.");
    }

    /**
     * @method refreshInventoryDisplay
     * @description Updates the inventory UI with current items.
     *              Called by InventorySystem or when inventory modal is shown.
     */
    refreshInventoryDisplay() {
        if (this.uiManager.inventoryModal.grid) {
            this.uiManager.inventoryModal.grid.innerHTML = ''; // Clear existing items
            const playerItems = this.inventorySystem.getPlayerItems();

            if (!this.uiManager.inventoryItemTemplate) {
                // Create a simple template string if not defined
                // Ideally, this would be loaded from a template file or defined more robustly
                this.uiManager.inventoryItemTemplate = (item) => `
                    <div class="inventory-item" data-item-id="${item.itemId}" tabindex="0" role="button" aria-label="${InteractiveAdventure.localization.getString(item.definition.nameKey) || item.definition.name}">
                        <img src="${item.definition.image || 'assets/images/items/placeholder-item.png'}" alt="${InteractiveAdventure.localization.getString(item.definition.nameKey) || item.definition.name}">
                        ${item.definition.stackable !== false && item.quantity > 1 ? `<span class="item-quantity">x${item.quantity}</span>` : ''}
                    </div>`;
            }

            playerItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.innerHTML = this.uiManager.inventoryItemTemplate(item).trim();
                const finalItemElement = itemElement.firstChild;

                finalItemElement.addEventListener('click', () => this.displayItemDetails(item.itemId));
                finalItemElement.addEventListener('keypress', (e) => { if(e.key === 'Enter' || e.key === ' ') this.displayItemDetails(item.itemId); });

                this.uiManager.inventoryModal.grid.appendChild(finalItemElement);
            });

            // Update capacity display
            const capacityDisplay = this.uiManager.getElement('#inventory-capacity', this.uiManager.inventoryModal.panel);
            if (capacityDisplay) {
                const currentSize = playerItems.reduce((sum, item) => sum + (item.definition.stackable === false ? item.quantity : 1), 0); // Count stacks or individual non-stackables
                const capText = InteractiveAdventure.localization.getString('inventory_capacity_display', {
                    current: currentSize, // Or this.inventorySystem.getCurrentInventorySize() for unique stacks
                    max: this.inventorySystem.getInventoryCapacity()
                });
                capacityDisplay.innerHTML = capText; // Using innerHTML for potential formatting from localization
            }

            // Clear details if no item is selected or if inventory is empty
            if(playerItems.length === 0 || !this.uiManager.inventoryModal.details.dataset.selectedItemId){
                this.clearItemDetails();
            }

        } else {
            console.warn("UIManager: Inventory grid element not found, cannot refresh display.");
        }
    }

    /**
     * @method displayItemDetails
     * @description Shows details for a selected item in the inventory panel.
     * @param {string} itemId - The ID of the item to display.
     */
    displayItemDetails(itemId) {
        const item = this.inventorySystem.getPlayerItems().find(i => i.itemId === itemId);
        const itemDef = item ? item.definition : null;
        const detailsPanel = this.uiManager.inventoryModal.details;

        if (!itemDef || !detailsPanel) {
            this.clearItemDetails();
            return;
        }
        detailsPanel.dataset.selectedItemId = itemId; // Store for context

        const loc = InteractiveAdventure.localization;
        detailsPanel.querySelector('#selected-item-name').textContent = loc.getString(itemDef.nameKey) || itemDef.name;
        detailsPanel.querySelector('#selected-item-image').src = itemDef.image || 'assets/images/items/placeholder-item.png';
        detailsPanel.querySelector('#selected-item-image').alt = loc.getString(itemDef.nameKey) || itemDef.name;
        detailsPanel.querySelector('#selected-item-description').textContent = loc.getString(itemDef.descriptionKey) || itemDef.description;

        // Item Actions (Use, Equip, Drop etc.)
        const actionsContainer = detailsPanel.querySelector('#item-actions');
        actionsContainer.innerHTML = ''; // Clear previous actions

        if (itemDef.usable || itemDef.effects?.onUse) {
            const useButton = document.createElement('button');
            useButton.classList.add('button', 'action-button');
            useButton.id = 'use-item-btn';
            useButton.textContent = loc.getString('use_item_button') || 'Use';
            useButton.onclick = async () => {
                const used = await this.inventorySystem.useItem(itemId);
                if (used) {
                    // If item was consumed and no longer exists, or if details need refresh
                    const stillExists = this.inventorySystem.hasItem(itemId);
                    if (!stillExists) this.clearItemDetails();
                    else this.displayItemDetails(itemId); // Refresh details (e.g. quantity changed)
                }
            };
            actionsContainer.appendChild(useButton);
        }
        // Add other buttons like Equip, Drop here if implemented

        detailsPanel.classList.remove('hidden');

        // Highlight selected item in grid
        this.uiManager.inventoryModal.grid.querySelectorAll('.inventory-item').forEach(el => {
            el.classList.remove('selected');
            if (el.dataset.itemId === itemId) {
                el.classList.add('selected');
            }
        });
    }

    clearItemDetails() {
        const detailsPanel = this.uiManager.inventoryModal.details;
        if (detailsPanel) {
            detailsPanel.classList.add('hidden');
            detailsPanel.dataset.selectedItemId = "";
            detailsPanel.querySelector('#selected-item-name').textContent = "";
            detailsPanel.querySelector('#selected-item-image').src = "#";
            detailsPanel.querySelector('#selected-item-image').alt = "";
            detailsPanel.querySelector('#selected-item-description').textContent = "";
            detailsPanel.querySelector('#item-actions').innerHTML = "";
        }
        if(this.uiManager.inventoryModal.grid) {
            this.uiManager.inventoryModal.grid.querySelectorAll('.inventory-item.selected').forEach(el => el.classList.remove('selected'));
        }
    }


    /**
     * @method showStats
     * @description Displays the player's statistics.
     */
    async showStats() {
        if (this.gameEngine.getCurrentState() !== this.gameEngine.GAME_STATES.PLAYING) return;

        this.audioManager.playSound('ui_open_panel', 'sfx/ui/panel_open.wav');
        console.log("GameController: Showing stats.");
        this.gameEngine.pauseGame();
        this.gameEngine.setState(this.gameEngine.GAME_STATES.STATS);

        await this.uiManager.navigateToScreen('stats', {
            isModal: true,
            onLoaded: (modalOverlay) => {
                this.uiManager.showModal(modalOverlay.id); // stats-modal-overlay
                this.refreshStatsDisplay();

                const closeBtn = this.uiManager.statsModal.closeBtn;
                if (closeBtn) closeBtn.onclick = () => this.hideStats();
                if (modalOverlay) modalOverlay.onclick = (e) => { if(e.target === modalOverlay) this.hideStats(); };
            }
        });
    }

    /**
     * @method hideStats
     * @description Hides the statistics display.
     */
    hideStats() {
        this.audioManager.playSound('ui_close_panel', 'sfx/ui/panel_close.wav');
        this.uiManager.hideModal('stats-modal-overlay');
        this.gameEngine.resumeGame();
        console.log("GameController: Stats hidden.");
    }

    /**
     * @method refreshStatsDisplay
     * @description Updates the stats UI with current values.
     */
    refreshStatsDisplay() {
        const statsListElement = this.uiManager.statsModal.list;
        if (statsListElement) {
            statsListElement.innerHTML = ''; // Clear
            const formattedStats = this.statsSystem.getFormattedStats();

            // Update player avatar and name (if these elements exist in stats.html)
            const playerNameEl = this.uiManager.getElement('#player-name-stats', this.uiManager.statsModal.panel);
            if (playerNameEl) playerNameEl.textContent = InteractiveAdventure.stateManager.getPlayerName();
            // const playerAvatarEl = this.uiManager.getElement('#player-avatar', this.uiManager.statsModal.panel);
            // if (playerAvatarEl) playerAvatarEl.src = InteractiveAdventure.stateManager.getGameStateVar('playerAvatarUrl') || 'assets/images/characters/player-avatar-placeholder.png';


            if (!this.uiManager.statItemTemplate) {
                this.uiManager.statItemTemplate = (stat) => {
                    let valueDisplay = `${stat.value}`;
                    if (stat.displayType === 'bar' || stat.displayType === 'xp_bar') {
                        valueDisplay = `${stat.value} / ${stat.max !== undefined ? stat.max : (stat.nextLevelXp || 'N/A')}`;
                    }
                    const percentage = (stat.max !== undefined && stat.max > 0)
                        ? (stat.value / stat.max) * 100
                        : (stat.nextLevelXp && stat.nextLevelXp > 0 ? (stat.value / stat.nextLevelXp) * 100 : (stat.value > 0 ? 100 : 0));

                    return `
                        <li class="stat-item" data-stat-id="${stat.id}">
                            <span class="stat-name">${stat.name}:</span>
                            <span class="stat-value">${valueDisplay}</span>
                            ${(stat.displayType === 'bar' || stat.displayType === 'xp_bar') ? `
                                <div class="stat-bar-container">
                                    <div class="stat-bar ${stat.id}-bar" title="${Math.round(percentage)}%">
                                        <div style="width: ${Math.max(0, Math.min(100, percentage))}%; background-color: ${stat.color || 'var(--primary-color)'};"></div>
                                    </div>
                                </div>
                            ` : ''}
                        </li>`;
                };
            }

            formattedStats.forEach(stat => {
                const statElement = document.createElement('div'); // Wrapper to parse li
                statElement.innerHTML = this.uiManager.statItemTemplate(stat).trim();
                statsListElement.appendChild(statElement.firstChild);
            });

            // TODO: Update active effects list
            // const effectsListEl = this.uiManager.getElement('#effects-list', this.uiManager.statsModal.panel);
            // if(effectsListEl) { ... }

        } else {
            console.warn("UIManager: Stats list element not found, cannot refresh display.");
        }
    }


    /**
     * @method showGameOptions
     * @description Displays the in-game options menu.
     */
    async showGameOptions() {
        if (this.gameEngine.getCurrentState() !== this.gameEngine.GAME_STATES.PLAYING) return;

        this.audioManager.playSound('ui_open_panel', 'sfx/ui/panel_open.wav');
        console.log("GameController: Showing game options.");
        this.gameEngine.pauseGame(); // Set to PAUSED
        this.gameEngine.setState(this.gameEngine.GAME_STATES.GAME_OPTIONS);


        await this.uiManager.navigateToScreen('game-options', {
            isModal: true,
            onLoaded: (modalOverlay) => {
                this.uiManager.showModal(modalOverlay.id); // game-options-modal-overlay
                // OptionsController will handle populating and managing this modal's content
                if (this.optionsController && typeof this.optionsController.initializeInGameOptions === 'function') {
                    this.optionsController.initializeInGameOptions(this.uiManager.gameOptionsModal.panel, () => this.hideGameOptions());
                }

                const closeBtn = this.uiManager.gameOptionsModal.closeBtn;
                const resumeBtn = this.uiManager.gameOptionsModal.resumeBtn;
                if (closeBtn) closeBtn.onclick = () => this.hideGameOptions();
                if (resumeBtn) resumeBtn.onclick = () => this.hideGameOptions(); // Resume is same as close for now
                if (modalOverlay) modalOverlay.onclick = (e) => { if(e.target === modalOverlay) this.hideGameOptions(); };
            }
        });
    }

    /**
     * @method hideGameOptions
     * @description Hides the in-game options menu.
     */
    hideGameOptions() {
        this.audioManager.playSound('ui_close_panel', 'sfx/ui/panel_close.wav');
        this.uiManager.hideModal('game-options-modal-overlay');
        this.gameEngine.resumeGame(); // Return to PLAYING state
        console.log("GameController: Game options hidden.");
    }
}

export default GameController;
