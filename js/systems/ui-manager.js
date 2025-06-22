// ============== UI MANAGER MODULE ============== //

import InteractiveAdventure from "../core/main.js"; // For Localization, AnimationController

/**
 * @class UIManager
 * @description Manages all Document Object Model (DOM) interactions and UI updates.
 *              Responsible for rendering scenes, choices, modals, notifications, etc.
 */
class UIManager {
    /**
     * @constructor
     * @param {Localization} localization - Instance of Localization for translating UI text.
     */
    constructor(localization) {
        this.localization = localization;

        // DOM element references (to be cached on initialization or page load)
        this.gameContainer = null; // Main container for all game content
        this.initialLoadingScreen = null; // The very first loading screen in index.html

        // Specific page/modal content containers (dynamically loaded)
        this.currentPageContainer = null; // Holds the currently active page (menu.html, game.html, etc.)

        // Elements within game.html (cached when game.html is loaded)
        this.locationNameElement = null;
        this.sceneImageElement = null;
        this.characterDisplayElement = null;
        this.sceneDescriptionElement = null;
        this.choicesContainerElement = null;
        this.notificationsAreaElement = null;

        // Modal elements (cached when their respective HTML is loaded/shown)
        this.inventoryModal = { overlay: null, panel: null, grid: null, details: null, closeBtn: null };
        this.statsModal = { overlay: null, panel: null, list: null, closeBtn: null };
        this.gameOptionsModal = { overlay: null, panel: null, closeBtn: null, resumeBtn: null };
        this.optionsPage = { /* elements for main options page */ }; // For options.html
        this.savesPage = { container: null, slotsContainer: null, title: null }; // For saves.html
        this.loadingScreenModal = null; // For the generic loading.html page/modal

        // Templates for dynamic content
        this.choiceButtonTemplate = null; // Store HTML string or template element
        this.inventoryItemTemplate = null;
        this.statItemTemplate = null;
        this.saveSlotTemplate = null;
        this.achievementCardTemplate = null;

        console.log("UIManager initialized.");
    }

    /**
     * @method setGameContainer
     * @description Sets the main game container element from index.html.
     * @param {HTMLElement} container - The main div where game content will be rendered.
     */
    setGameContainer(container) {
        this.gameContainer = container;
    }
    /**
     * @method setInitialLoadingScreen
     * @description Sets the initial loading screen element from index.html.
     * @param {HTMLElement} loadingScreen - The initial loading screen div.
     */
    setInitialLoadingScreen(loadingScreenElement) {
        this.initialLoadingScreen = loadingScreenElement;
    }


    // --- Screen & Page Navigation ---

    /**
     * @method showInitialLoadingScreen
     * @description Shows or hides the very first loading screen from index.html.
     * @param {boolean} show - True to show, false to hide.
     */
    showInitialLoadingScreen(show) {
        if (this.initialLoadingScreen) {
            if (show) {
                this.initialLoadingScreen.classList.remove('hidden');
                this.initialLoadingScreen.classList.add('active'); // If 'active' controls visibility/animation
            } else {
                this.initialLoadingScreen.classList.add('hidden');
                this.initialLoadingScreen.classList.remove('active');
            }
        }
    }


    /**
     * @method navigateToScreen
     * @description Loads and displays the content of a new "screen" (HTML page) into the game container.
     * @param {string} screenName - The name of the screen (e.g., 'menu', 'game', 'options').
     *                              This should correspond to an HTML file in the `pages/` directory.
     * @param {object} [options={}] - Options for navigation, e.g., { isModal: false, onLoaded: null }
     * @returns {Promise<HTMLElement | null>} The loaded page container element or null on error.
     */
    async navigateToScreen(screenName, options = {}) {
        if (!this.gameContainer) {
            console.error("UIManager: Game container is not set. Cannot navigate.");
            return null;
        }

        const filePath = `pages/${screenName}.html`;
        console.log(`UIManager: Navigating to screen "${screenName}" from ${filePath}`);

        try {
            const htmlContent = await InteractiveAdventure.dataLoader.loadHTML(filePath);
            if (!htmlContent) {
                throw new Error(`Failed to load HTML content for ${screenName}`);
            }

            // If it's not a modal, clear previous page content
            if (!options.isModal && this.currentPageContainer) {
                // Optional: Animate out current page
                // await InteractiveAdventure.animationController.runTransition(this.currentPageContainer, 'fadeOut', () => {
                // this.currentPageContainer.remove();
                // });
                this.currentPageContainer.remove();
                this.currentPageContainer = null;
            }

            // Create a new div to hold the page content
            const newPageContainer = document.createElement('div');
            newPageContainer.id = `${screenName}-page-container`; // Unique ID for the page
            newPageContainer.classList.add('page-content-wrapper'); // General class for styling
            newPageContainer.innerHTML = htmlContent;


            if (options.isModal) {
                // For modals, the HTML structure loaded should already include an overlay and panel.
                // We just append it and the specific controller will manage visibility.
                this.gameContainer.appendChild(newPageContainer.firstElementChild); // Append the actual modal structure
                this.currentPageContainer = newPageContainer.firstElementChild; // Reference the modal overlay
            } else {
                this.gameContainer.appendChild(newPageContainer);
                this.currentPageContainer = newPageContainer;
            }


            // Cache common elements for the newly loaded screen
            this._cacheCommonElementsForScreen(screenName, this.currentPageContainer);

            // Translate newly loaded content
            this.localization.translateDOM(this.currentPageContainer);

            // Optional: Animate in new page
            // await InteractiveAdventure.animationController.runTransition(this.currentPageContainer, 'fadeIn');

            // Call onLoaded callback if provided
            if (options.onLoaded && typeof options.onLoaded === 'function') {
                options.onLoaded(this.currentPageContainer);
            }

            console.log(`UIManager: Screen "${screenName}" loaded and displayed.`);
            return this.currentPageContainer;

        } catch (error) {
            console.error(`UIManager: Error navigating to screen "${screenName}":`, error);
            InteractiveAdventure.errorHandler.handle(error, `Failed to navigate to screen: ${screenName}`);
            // Display a fallback error message in the UI
            this.gameContainer.innerHTML = `<div class="error-message">Could not load '${screenName}'. Please try again.</div>`;
            return null;
        }
    }

    /**
     * @method _cacheCommonElementsForScreen
     * @description Caches frequently accessed DOM elements for a given screen.
     * @param {string} screenName - The name of the screen (e.g., 'game', 'inventory').
     * @param {HTMLElement} container - The main container element for the screen.
     * @private
     */
    _cacheCommonElementsForScreen(screenName, container) {
        if (!container) return;

        switch (screenName) {
            case 'game':
                this.locationNameElement = container.querySelector('#current-location-name');
                this.sceneImageElement = container.querySelector('#scene-image');
                this.characterDisplayElement = container.querySelector('#character-display');
                this.sceneDescriptionElement = container.querySelector('#scene-description');
                this.choicesContainerElement = container.querySelector('#choices-container');
                this.notificationsAreaElement = container.querySelector('#notifications-area') || this._createNotificationsArea(); // Ensure it exists
                break;
            case 'inventory': // Assuming inventory is loaded as a "screen" or its elements are within a known container
                this.inventoryModal.overlay = container.closest('.modal-overlay') || container.querySelector('#inventory-modal-overlay');
                if(this.inventoryModal.overlay){
                    this.inventoryModal.panel = this.inventoryModal.overlay.querySelector('.inventory-panel');
                    this.inventoryModal.grid = this.inventoryModal.overlay.querySelector('#inventory-grid');
                    this.inventoryModal.details = this.inventoryModal.overlay.querySelector('#item-details');
                    this.inventoryModal.closeBtn = this.inventoryModal.overlay.querySelector('#close-inventory-btn');
                }
                break;
            case 'stats':
                this.statsModal.overlay = container.closest('.modal-overlay') || container.querySelector('#stats-modal-overlay');
                 if(this.statsModal.overlay){
                    this.statsModal.panel = this.statsModal.overlay.querySelector('.stats-panel');
                    this.statsModal.list = this.statsModal.overlay.querySelector('#stats-list');
                    this.statsModal.closeBtn = this.statsModal.overlay.querySelector('#close-stats-btn');
                }
                break;
            case 'game-options':
                this.gameOptionsModal.overlay = container.closest('.modal-overlay') || container.querySelector('#game-options-modal-overlay');
                if(this.gameOptionsModal.overlay){
                    this.gameOptionsModal.panel = this.gameOptionsModal.overlay.querySelector('.options-panel');
                    this.gameOptionsModal.closeBtn = this.gameOptionsModal.overlay.querySelector('#close-game-options-btn');
                    this.gameOptionsModal.resumeBtn = this.gameOptionsModal.overlay.querySelector('#resume-game-btn');
                }
                break;
            case 'saves':
                this.savesPage.container = container.querySelector('.saves-container') || container;
                this.savesPage.slotsContainer = this.savesPage.container.querySelector('#save-slots-container');
                this.savesPage.title = this.savesPage.container.querySelector('#saves-title');
                break;
            // Add cases for other screens like 'options', 'menu', 'halloffame', etc.
        }
    }

    /**
     * @method getSceneContainerElement
     * @description Returns a reference to the main scene content area if on 'game' screen.
     * @returns {HTMLElement|null}
     */
    getSceneContainerElement() {
        if (this.currentPageContainer && this.currentPageContainer.id === 'game-page-container') {
            return this.currentPageContainer.querySelector('#game-main-content');
        }
        return this.currentPageContainer; // Fallback or general container
    }


    // --- Game Screen Updates (game.html) ---

    /**
     * @method renderScene
     * @description Updates the game UI with data from the current scene.
     * @param {object} sceneData - The data object for the scene to render.
     */
    renderScene(sceneData) {
        if (!this.sceneImageElement || !this.sceneDescriptionElement || !this.locationNameElement) {
            console.warn("UIManager: Game screen elements not cached. Cannot render scene effectively. Ensure 'game' screen is loaded.");
            // Attempt to query them now, might be slow if called repeatedly
            this._cacheCommonElementsForScreen('game', this.currentPageContainer || document);
            if (!this.sceneImageElement) { // Still not found
                console.error("UIManager: Critical game screen elements missing. Scene rendering aborted.");
                return;
            }
        }

        // Update location name
        this.locationNameElement.textContent = this.localization.getString(sceneData.locationKey) || sceneData.location || sceneData.title || this.localization.getString('unknown_location');

        // Update scene image
        if (sceneData.backgroundImage) {
            // Check if it's a full path or just a filename
            const imagePath = sceneData.backgroundImage.startsWith('assets/')
                ? sceneData.backgroundImage
                : `assets/images/scenes/${sceneData.backgroundImage}`;
            this.sceneImageElement.src = imagePath;
            this.sceneImageElement.alt = this.localization.getString(sceneData.imageAltKey) || sceneData.title || "Scene background";
            this.sceneImageElement.classList.remove('hidden');
        } else {
            this.sceneImageElement.classList.add('hidden'); // Hide if no image
        }

        // Update character display (if any)
        if (this.characterDisplayElement) {
            if (sceneData.characterImage) {
                const charImagePath = sceneData.characterImage.startsWith('assets/')
                    ? sceneData.characterImage
                    : `assets/images/characters/${sceneData.characterImage}`;
                // Assuming a single img tag inside characterDisplayElement for now
                let charImg = this.characterDisplayElement.querySelector('img');
                if (!charImg) {
                    charImg = document.createElement('img');
                    this.characterDisplayElement.appendChild(charImg);
                }
                charImg.src = charImagePath;
                charImg.alt = this.localization.getString(sceneData.characterAltKey) || sceneData.characterName || "Character";
                this.characterDisplayElement.classList.remove('hidden');
            } else {
                this.characterDisplayElement.innerHTML = ''; // Clear previous character
                this.characterDisplayElement.classList.add('hidden');
            }
        }


        // Update scene description (text)
        // Handle potential paragraphs or rich text if sceneData.text is complex
        const descriptionText = this.localization.getString(sceneData.textKey) || sceneData.text || "";
        if (this.sceneDescriptionElement) {
            if (sceneData.textEffect === 'typewriter' && InteractiveAdventure.animationController) {
                 InteractiveAdventure.animationController.typewriterEffect(this.sceneDescriptionElement, descriptionText, 50);
            } else {
                this.sceneDescriptionElement.innerHTML = ''; // Clear previous text
                // Simple paragraph creation, can be enhanced for markdown or basic HTML
                descriptionText.split('\n').forEach(paragraph => {
                    if (paragraph.trim() !== '') {
                        const pElem = document.createElement('p');
                        pElem.textContent = paragraph;
                        this.sceneDescriptionElement.appendChild(pElem);
                    }
                });
            }
        }

        // Choices are handled by `displayChoices`
    }

    /**
     * @method displayChoices
     * @description Renders the available choices for the current scene.
     * @param {Array<object>} choices - An array of choice objects.
     * @param {function} onChoiceSelectedCallback - Callback function when a choice is clicked.
     */
    displayChoices(choices, onChoiceSelectedCallback) {
        if (!this.choicesContainerElement) {
            console.warn("UIManager: Choices container not cached. Cannot display choices.");
            this._cacheCommonElementsForScreen('game', this.currentPageContainer || document);
            if (!this.choicesContainerElement) return;
        }

        this.choicesContainerElement.innerHTML = ''; // Clear previous choices

        if (!choices || choices.length === 0) {
            // Handle no choices (e.g., end of scene, or waiting for an event)
            // const noChoicesMessage = document.createElement('p');
            // noChoicesMessage.textContent = this.localization.getString('no_choices_available') || "No further actions available.";
            // noChoicesMessage.classList.add('no-choices-message');
            // this.choicesContainerElement.appendChild(noChoicesMessage);
            return;
        }

        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.classList.add('choice-button');
            // Use choice.id if available, otherwise use index. Ensure ID is unique for handler.
            const choiceIdentifier = choice.id || `choice_${index}`;
            button.dataset.choiceId = choiceIdentifier;

            let choiceText = this.localization.getString(choice.textKey) || choice.text || `Option ${index + 1}`;

            if (choice.disabled) {
                button.disabled = true;
                button.classList.add('disabled');
                if (choice.disabledTextKey || choice.disabledText) {
                    choiceText = this.localization.getString(choice.disabledTextKey) || choice.disabledText || `(Locked) ${choiceText}`;
                } else {
                    choiceText = `(${this.localization.getString('locked_choice_prefix') || 'Locked'}) ${choiceText}`;
                }
            }

            button.textContent = choiceText;

            button.addEventListener('click', () => {
                if (InteractiveAdventure.audioManager) {
                    InteractiveAdventure.audioManager.playSound('ui_click', 'sfx/ui/button_click.wav'); // Example path
                }
                onChoiceSelectedCallback(choiceIdentifier);
            });
            button.addEventListener('mouseenter', () => {
                 if (InteractiveAdventure.audioManager) {
                    InteractiveAdventure.audioManager.playSound('ui_hover', 'sfx/ui/button_hover.wav');
                }
            });

            this.choicesContainerElement.appendChild(button);
        });
    }


    // --- Modals & Popups ---

    /**
     * @method showModal
     * @description Generic method to show a modal by its ID (assumes HTML structure is loaded).
     * @param {string} modalId - The ID of the modal's overlay element.
     * @param {function} [onShowCallback] - Optional callback after modal is shown.
     */
    async showModal(modalId, onShowCallback) {
        // First, ensure the modal's HTML is loaded if it's not already part of the current page
        // This might involve calling navigateToScreen with isModal: true if modals are separate files.
        // For simplicity, assuming the modal HTML (e.g. inventory.html) is loaded via navigateToScreen
        // and the `modalId` refers to the overlay of that loaded content.

        const modalOverlay = document.getElementById(modalId) || (this.currentPageContainer && this.currentPageContainer.id === modalId ? this.currentPageContainer : null);

        if (modalOverlay) {
            modalOverlay.classList.remove('hidden');
            modalOverlay.classList.add('active'); // For CSS animations

            // Focus management: set focus to the modal panel or first focusable element
            const modalPanel = modalOverlay.querySelector('.modal-content');
            if (modalPanel) {
                modalPanel.setAttribute('tabindex', '-1'); // Make it focusable
                modalPanel.focus();
            }

            // Add event listener for Esc key to close modal
            modalOverlay.dataset.escapeListener = (event) => {
                if (event.key === 'Escape') {
                    this.hideModal(modalId);
                }
            };
            document.addEventListener('keydown', modalOverlay.dataset.escapeListener);


            if (onShowCallback) onShowCallback();
            console.log(`UIManager: Modal "${modalId}" shown.`);
        } else {
            console.error(`UIManager: Modal with ID "${modalId}" not found.`);
        }
    }

    /**
     * @method hideModal
     * @description Generic method to hide a modal by its ID.
     * @param {string} modalId - The ID of the modal's overlay element.
     * @param {function} [onHideCallback] - Optional callback after modal is hidden.
     */
    async hideModal(modalId, onHideCallback) {
        const modalOverlay = document.getElementById(modalId) || (this.currentPageContainer && this.currentPageContainer.id === modalId ? this.currentPageContainer : null);

        if (modalOverlay && modalOverlay.classList.contains('active')) {
            modalOverlay.classList.remove('active');
            modalOverlay.classList.add('hidden');

            // Remove escape listener
            if (modalOverlay.dataset.escapeListener) {
                document.removeEventListener('keydown', modalOverlay.dataset.escapeListener);
                delete modalOverlay.dataset.escapeListener;
            }

            // Optional: If modals loaded via navigateToScreen are to be removed from DOM when hidden
            // if (modalOverlay.parentElement === this.gameContainer && modalOverlay.classList.contains('page-content-wrapper')) {
            //     modalOverlay.remove();
            // }

            if (onHideCallback) onHideCallback();
            console.log(`UIManager: Modal "${modalId}" hidden.`);
        } else if (!modalOverlay) {
            console.warn(`UIManager: Modal with ID "${modalId}" not found to hide.`);
        }
    }

    // --- Notifications ---
    _createNotificationsArea() {
        if (document.getElementById('notifications-area')) {
            return document.getElementById('notifications-area');
        }
        const area = document.createElement('div');
        area.id = 'notifications-area';
        (this.gameContainer || document.body).appendChild(area);
        this.notificationsAreaElement = area;
        return area;
    }

    /**
     * @method showNotification
     * @description Displays a temporary notification message to the user.
     * @param {string} message - The message to display.
     * @param {'info' | 'success' | 'warning' | 'error'} [type='info'] - Type of notification for styling.
     * @param {number} [duration=3000] - How long the notification stays visible (in ms).
     */
    showNotification(message, type = 'info', duration = 3000) {
        if (!this.notificationsAreaElement) {
             this._createNotificationsArea();
        }
        if (!this.notificationsAreaElement) { // Still not available
            console.warn("UIManager: Notifications area not available. Cannot show notification:", message);
            alert(`${type.toUpperCase()}: ${message}`); // Fallback to alert
            return;
        }

        const notification = document.createElement('div');
        notification.classList.add('notification', type);
        notification.textContent = message;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', (type === 'error' || type === 'warning') ? 'assertive' : 'polite');


        this.notificationsAreaElement.appendChild(notification);

        // Trigger animation (slideInAndFadeOut is defined in global.css)
        // The animation itself handles removal or hiding. If not, use setTimeout.
        // The CSS animation `slideInAndFadeOut` is set to 5s total.
        // We need to ensure it's removed from DOM after animation.
        setTimeout(() => {
            notification.remove();
        }, duration + 500); // duration of visibility + fadeOut time
    }


    // --- Loading Screen (Generic for assets, etc.) ---

    /**
     * @method showLoadingScreen
     * @description Shows a generic loading screen/modal.
     * @param {string} [message] - Optional message to display on the loading screen.
     * @param {boolean} [showProgressBar=false] - Whether to show a progress bar.
     */
    async showLoadingScreen(message, showProgressBar = false) {
        // Check if loading.html is already loaded as the current page
        if (!this.loadingScreenModal || !document.body.contains(this.loadingScreenModal)) {
            const loadedContainer = await this.navigateToScreen('loading', { isModal: true }); // Assuming loading.html is a modal structure
            if (loadedContainer) {
                // navigateToScreen sets this.currentPageContainer to the modal overlay
                this.loadingScreenModal = loadedContainer.querySelector('.loading-page-container') || loadedContainer; // Get the actual content part
            } else {
                console.error("UIManager: Failed to load loading.html for loading screen.");
                this.showInitialLoadingScreen(true); // Fallback to initial spinner
                if (message && this.initialLoadingScreen) this.initialLoadingScreen.querySelector('p').textContent = message;
                return;
            }
        }

        if (this.loadingScreenModal.parentElement && this.loadingScreenModal.parentElement.classList.contains('modal-overlay')) {
             this.loadingScreenModal.parentElement.classList.remove('hidden');
             this.loadingScreenModal.parentElement.classList.add('active');
        } else { // If it's not in an overlay (e.g. loaded directly)
            this.loadingScreenModal.classList.remove('hidden');
            this.loadingScreenModal.classList.add('active');
        }


        const messageElement = this.loadingScreenModal.querySelector('#loading-message-text');
        if (messageElement && message) {
            messageElement.textContent = this.localization.getString(message) || message;
        }

        const progressBarContainer = this.loadingScreenModal.querySelector('.loading-progress-bar-container');
        if (progressBarContainer) {
            progressBarContainer.style.display = showProgressBar ? 'block' : 'none';
            if (showProgressBar) this.updateLoadingProgress(0); // Reset progress
        }
        console.log("UIManager: Generic loading screen shown.");
    }

    /**
     * @method updateLoadingProgress
     * @description Updates the progress bar on the generic loading screen.
     * @param {number} percentage - The progress percentage (0-100).
     */
    updateLoadingProgress(percentage) {
        if (this.loadingScreenModal) {
            const progressBarFill = this.loadingScreenModal.querySelector('#loading-progress-bar-fill');
            if (progressBarFill) {
                const clampedPercentage = Math.max(0, Math.min(100, percentage));
                progressBarFill.style.width = `${clampedPercentage}%`;
                // progressBarFill.textContent = `${Math.round(clampedPercentage)}%`; // Optional: text on bar
                // progressBarFill.dataset.progress = Math.round(clampedPercentage); // For ::after content
            }
        }
    }

    /**
     * @method hideLoadingScreen
     * @description Hides the generic loading screen/modal.
     */
    hideLoadingScreen() {
        if (this.loadingScreenModal) {
            if (this.loadingScreenModal.parentElement && this.loadingScreenModal.parentElement.classList.contains('modal-overlay')) {
                 this.loadingScreenModal.parentElement.classList.add('hidden');
                 this.loadingScreenModal.parentElement.classList.remove('active');
            } else {
                this.loadingScreenModal.classList.add('hidden');
                this.loadingScreenModal.classList.remove('active');
            }
            console.log("UIManager: Generic loading screen hidden.");
        }
        this.showInitialLoadingScreen(false); // Also ensure initial one is hidden
    }


    // --- Utility Methods ---

    /**
     * @method applyCurrentLanguageToDOM
     * @description Re-translates the current visible DOM content.
     */
    applyCurrentLanguageToDOM() {
        if (this.currentPageContainer) {
            this.localization.translateDOM(this.currentPageContainer);
        } else if (this.gameContainer) {
            this.localization.translateDOM(this.gameContainer);
        } else {
            this.localization.translateDOM(document.body);
        }
    }

    /**
     * @method clearGameContainer
     * @description Clears all dynamic content from the main game container.
     */
    clearGameContainer() {
        if (this.gameContainer) {
            // Clear all children except potentially the initial loading screen or notifications area
            Array.from(this.gameContainer.children).forEach(child => {
                if (child !== this.initialLoadingScreen && child.id !== 'notifications-area') {
                    child.remove();
                }
            });
            this.currentPageContainer = null;
        }
    }

    /**
     * @method getElement
     * @description Safely gets an element from the current page or document.
     * @param {string} selector - The CSS selector for the element.
     * @param {HTMLElement} [parent=this.currentPageContainer || document] - The parent element to search within.
     * @returns {HTMLElement | null}
     */
    getElement(selector, parent = this.currentPageContainer || document) {
        try {
            return parent.querySelector(selector);
        } catch (e) {
            return document.querySelector(selector); // Fallback to document if parent is weird
        }
    }
    /**
     * @method getAllElements
     * @description Safely gets all elements matching a selector from the current page or document.
     * @param {string} selector - The CSS selector for the elements.
     * @param {HTMLElement} [parent=this.currentPageContainer || document] - The parent element to search within.
     * @returns {NodeListOf<HTMLElement>}
     */
    getAllElements(selector, parent = this.currentPageContainer || document) {
         try {
            return parent.querySelectorAll(selector);
        } catch (e) {
            return document.querySelectorAll(selector); // Fallback to document
        }
    }

}

export default UIManager;
