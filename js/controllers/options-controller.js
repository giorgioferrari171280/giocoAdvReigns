// ============== OPTIONS CONTROLLER MODULE ============== //

import InteractiveAdventure from "../core/main.js"; // To access UIManager, Config, Localization, AudioManager, SaveSystem

/**
 * @class OptionsController
 * @description Handles the logic for both the main options screen and the in-game options modal.
 */
class OptionsController {
    /**
     * @constructor
     * @param {UIManager} uiManager - Instance of UIManager.
     * @param {Config} config - Instance of Config.
     * @param {Localization} localization - Instance of Localization.
     * @param {AudioManager} audioManager - Instance of AudioManager.
     * @param {SaveSystem} saveSystem - Instance of SaveSystem.
     */
    constructor(uiManager, config, localization, audioManager, saveSystem) {
        this.uiManager = uiManager;
        this.config = config;
        this.localization = localization;
        this.audioManager = audioManager;
        this.saveSystem = saveSystem;

        this.optionsScreenContainer = null; // For main options page (options.html)
        this.gameOptionsModalPanel = null; // For in-game options modal (game-options.html)

        // Store current settings temporarily before applying, to allow cancel/reset
        this.tempSettings = {};

        console.log("OptionsController initialized.");
    }

    // --- Main Options Screen (options.html) ---

    /**
     * @method showOptionsScreen
     * @description Loads and displays the main options screen.
     */
    async showOptionsScreen() {
        console.log("OptionsController: Showing main options screen...");
        InteractiveAdventure.gameEngine.setState(InteractiveAdventure.gameEngine.GAME_STATES.OPTIONS);
        this.audioManager.playSound('ui_screen_transition', 'sfx/ui/transition_alt.wav');

        this.optionsScreenContainer = await this.uiManager.navigateToScreen('options');
        if (!this.optionsScreenContainer) {
            console.error("OptionsController: Failed to load options screen content.");
            return;
        }

        this._loadCurrentSettingsToTemp();
        this._populateMainOptionsForm();
        this._setupMainOptionsEventListeners();
        this._setupTabNavigation();
    }

    _loadCurrentSettingsToTemp() {
        this.tempSettings = {
            masterVolume: this.audioManager.getMasterVolume(),
            musicVolume: this.audioManager.getMusicVolume(),
            sfxVolume: this.audioManager.getSfxVolume(),
            // ambientVolume: this.audioManager.getAmbientVolume(), // If ambient has its own slider
            // brightness: this.config.getUserSetting('brightness', 100), // Assuming brightness is a %
            textSpeed: this.config.getUserSetting('textSpeed', 'normal'),
            skipReadText: this.config.getUserSetting('skipReadTextMain', false), // From options.html
            enableAutosave: this.config.getUserSetting('enableAutosave', true),
            language: this.localization.getCurrentLanguage(),
            textToSpeech: this.config.getUserSetting('textToSpeech', false),
            fontSize: this.config.getUserSetting('fontSize', 'medium'),
            highContrast: this.config.getUserSetting('highContrast', false),
            reduceMotion: this.config.getUserSetting('reduceMotion', false),
        };
    }

    _populateMainOptionsForm() {
        if (!this.optionsScreenContainer) return;

        // Audio/Video Tab
        this.uiManager.getElement('#master-volume', this.optionsScreenContainer).value = this.tempSettings.masterVolume * 100;
        this.uiManager.getElement('#master-volume-value', this.optionsScreenContainer).textContent = `${Math.round(this.tempSettings.masterVolume * 100)}%`;
        this.uiManager.getElement('#music-volume', this.optionsScreenContainer).value = this.tempSettings.musicVolume * 100;
        this.uiManager.getElement('#music-volume-value', this.optionsScreenContainer).textContent = `${Math.round(this.tempSettings.musicVolume * 100)}%`;
        this.uiManager.getElement('#sfx-volume', this.optionsScreenContainer).value = this.tempSettings.sfxVolume * 100;
        this.uiManager.getElement('#sfx-volume-value', this.optionsScreenContainer).textContent = `${Math.round(this.tempSettings.sfxVolume * 100)}%`;
        // this.uiManager.getElement('#brightness', this.optionsScreenContainer).value = this.tempSettings.brightness;
        // this.uiManager.getElement('#brightness-value', this.optionsScreenContainer).textContent = `${this.tempSettings.brightness}%`;

        // Gameplay Tab
        this.uiManager.getElement('#text-speed-main', this.optionsScreenContainer).value = this.tempSettings.textSpeed;
        this.uiManager.getElement('#skip-read-text-main', this.optionsScreenContainer).checked = this.tempSettings.skipReadText;
        this.uiManager.getElement('#enable-autosave', this.optionsScreenContainer).checked = this.tempSettings.enableAutosave;

        // Language Tab
        const langSelector = this.uiManager.getElement('#language-selector-main', this.optionsScreenContainer);
        langSelector.innerHTML = ''; // Clear existing options
        this.localization.getSupportedLanguagesList().forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = lang.name; // Already localized by getSupportedLanguagesList
            if (lang.code === this.tempSettings.language) option.selected = true;
            langSelector.appendChild(option);
        });

        // Accessibility Tab
        this.uiManager.getElement('#text-to-speech-main', this.optionsScreenContainer).checked = this.tempSettings.textToSpeech;
        this.uiManager.getElement('#font-size-main', this.optionsScreenContainer).value = this.tempSettings.fontSize;
        this.uiManager.getElement('#high-contrast-main', this.optionsScreenContainer).checked = this.tempSettings.highContrast;
        this.uiManager.getElement('#reduce-motion', this.optionsScreenContainer).checked = this.tempSettings.reduceMotion;
    }

    _setupMainOptionsEventListeners() {
        if (!this.optionsScreenContainer) return;

        // Volume Sliders
        ['master', 'music', 'sfx'].forEach(type => {
            const slider = this.uiManager.getElement(`#${type}-volume`, this.optionsScreenContainer);
            const valueDisplay = this.uiManager.getElement(`#${type}-volume-value`, this.optionsScreenContainer);
            if (slider && valueDisplay) {
                slider.addEventListener('input', () => {
                    this.tempSettings[`${type}Volume`] = parseFloat(slider.value) / 100;
                    valueDisplay.textContent = `${slider.value}%`;
                    // Optionally apply live preview for audio
                    if (type === 'master') this.audioManager.setMasterVolume(this.tempSettings.masterVolume, false); // false = don't save yet
                    if (type === 'music') this.audioManager.setMusicVolume(this.tempSettings.musicVolume, false);
                    if (type === 'sfx') {
                        this.audioManager.setSfxVolume(this.tempSettings.sfxVolume, false);
                        // Play a test sound on SFX change if desired
                        // this.audioManager.playSound('ui_test_sfx', 'sfx/ui/test_sound.wav');
                    }
                });
            }
        });
        // Brightness (if implemented)
        // const brightnessSlider = this.uiManager.getElement('#brightness', this.optionsScreenContainer);
        // if (brightnessSlider) { ... }

        // Gameplay Checkboxes & Selects
        const textSpeedSelect = this.uiManager.getElement('#text-speed-main', this.optionsScreenContainer);
        if (textSpeedSelect) textSpeedSelect.addEventListener('change', (e) => this.tempSettings.textSpeed = e.target.value);
        const skipReadCheckbox = this.uiManager.getElement('#skip-read-text-main', this.optionsScreenContainer);
        if (skipReadCheckbox) skipReadCheckbox.addEventListener('change', (e) => this.tempSettings.skipReadText = e.target.checked);
        const autosaveCheckbox = this.uiManager.getElement('#enable-autosave', this.optionsScreenContainer);
        if (autosaveCheckbox) autosaveCheckbox.addEventListener('change', (e) => this.tempSettings.enableAutosave = e.target.checked);

        // Language Selector
        const langSelector = this.uiManager.getElement('#language-selector-main', this.optionsScreenContainer);
        if (langSelector) langSelector.addEventListener('change', (e) => this.tempSettings.language = e.target.value);

        // Accessibility
        const ttsCheckbox = this.uiManager.getElement('#text-to-speech-main', this.optionsScreenContainer);
        if (ttsCheckbox) ttsCheckbox.addEventListener('change', (e) => this.tempSettings.textToSpeech = e.target.checked);
        const fontSizeSelect = this.uiManager.getElement('#font-size-main', this.optionsScreenContainer);
        if (fontSizeSelect) fontSizeSelect.addEventListener('change', (e) => this.tempSettings.fontSize = e.target.value);
        const highContrastCheckbox = this.uiManager.getElement('#high-contrast-main', this.optionsScreenContainer);
        if (highContrastCheckbox) highContrastCheckbox.addEventListener('change', (e) => this.tempSettings.highContrast = e.target.checked);
        const reduceMotionCheckbox = this.uiManager.getElement('#reduce-motion', this.optionsScreenContainer);
        if (reduceMotionCheckbox) reduceMotionCheckbox.addEventListener('change', (e) => this.tempSettings.reduceMotion = e.target.checked);


        // Action Buttons
        const saveBtn = this.uiManager.getElement('#save-options-btn', this.optionsScreenContainer);
        if (saveBtn) saveBtn.addEventListener('click', () => this._applyAndSaveMainOptions());

        const resetBtn = this.uiManager.getElement('#reset-options-btn', this.optionsScreenContainer);
        if (resetBtn) resetBtn.addEventListener('click', () => this._resetMainOptionsToDefault());

        const backBtn = this.uiManager.getElement('#back-to-menu-options-btn', this.optionsScreenContainer);
        if (backBtn) backBtn.addEventListener('click', () => this._exitMainOptions());

        // Add hover sounds
        this.uiManager.getAllElements('.button', this.optionsScreenContainer).forEach(b => {
            b.addEventListener('mouseenter', () => this.audioManager.playSound('ui_hover', 'sfx/ui/button_hover.wav'));
        });
    }

    _setupTabNavigation() {
        const tabLinks = this.uiManager.getAllElements('.tab-link', this.optionsScreenContainer);
        const tabContents = this.uiManager.getAllElements('.tab-content', this.optionsScreenContainer);

        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                const tabId = link.dataset.tab;

                tabLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === tabId) {
                        content.classList.add('active');
                    }
                });
                this.audioManager.playSound('ui_tab_switch', 'sfx/ui/tab_switch.wav');
            });
        });
        // Activate the first tab by default if none are active
        if (this.uiManager.getElement('.tab-link.active', this.optionsScreenContainer) === null && tabLinks.length > 0) {
            tabLinks[0].click();
        }
    }

    async _applyAndSaveMainOptions() {
        this.audioManager.playSound('ui_confirm', 'sfx/ui/confirm_action.wav');
        console.log("OptionsController: Applying and saving main options...", this.tempSettings);

        // Apply Audio settings (already partially applied via live preview)
        this.audioManager.setMasterVolume(this.tempSettings.masterVolume);
        this.audioManager.setMusicVolume(this.tempSettings.musicVolume);
        this.audioManager.setSfxVolume(this.tempSettings.sfxVolume);

        // Apply other settings via Config
        this.config.setUserSetting('textSpeed', this.tempSettings.textSpeed);
        this.config.setUserSetting('skipReadTextMain', this.tempSettings.skipReadText);
        this.config.setUserSetting('enableAutosave', this.tempSettings.enableAutosave);

        // Language - this might trigger a UI refresh
        if (this.localization.getCurrentLanguage() !== this.tempSettings.language) {
            await this.localization.setLanguage(this.tempSettings.language);
            // UIManager needs to re-translate current screen (options screen itself)
            this.uiManager.applyCurrentLanguageToDOM(); // Re-translate the options screen
            this._populateMainOptionsForm(); // Re-populate to reflect new language in dropdowns etc.
        }

        // Accessibility
        this.config.setUserSetting('textToSpeech', this.tempSettings.textToSpeech);
        this.config.setUserSetting('fontSize', this.tempSettings.fontSize);
        document.body.className = document.body.className.replace(/text-size-\w+/, ''); // Remove old font size class
        if(this.tempSettings.fontSize !== 'medium') document.body.classList.add(`text-size-${this.tempSettings.fontSize}`);

        this.config.setUserSetting('highContrast', this.tempSettings.highContrast);
        document.body.classList.toggle('high-contrast-enabled', this.tempSettings.highContrast);

        this.config.setUserSetting('reduceMotion', this.tempSettings.reduceMotion);
        document.body.classList.toggle('reduce-motion-enabled', this.tempSettings.reduceMotion);


        this.uiManager.showNotification(this.localization.getString('settings_saved_notify') || 'Settings Saved!', 'success');
        // No need to call config.saveUserSettings() for each, as setUserSetting does it.
    }

    async _resetMainOptionsToDefault() {
        this.audioManager.playSound('ui_warning', 'sfx/ui/warning_alert.wav');
        const confirmed = await this.uiManager.showConfirmation( // Assuming UIManager has a confirmation modal method
            this.localization.getString('confirm_reset_settings_title') || "Reset Settings?",
            this.localization.getString('confirm_reset_settings_text') || "Are you sure you want to reset all settings to their default values?"
        );
        if (confirmed) {
            console.log("OptionsController: Resetting main options to default.");
            await this.config.resetUserSettings(); // Resets and saves defaults
            this._loadCurrentSettingsToTemp(); // Reload defaults into temp
            this._populateMainOptionsForm();   // Update UI to show defaults

            // Re-apply visual body classes based on new defaults
            document.body.className = document.body.className.replace(/text-size-\w+/, '');
            if(this.tempSettings.fontSize !== 'medium') document.body.classList.add(`text-size-${this.tempSettings.fontSize}`);
            document.body.classList.toggle('high-contrast-enabled', this.tempSettings.highContrast);
            document.body.classList.toggle('reduce-motion-enabled', this.tempSettings.reduceMotion);
            // Re-apply audio volumes
            this.audioManager.setMasterVolume(this.tempSettings.masterVolume);
            this.audioManager.setMusicVolume(this.tempSettings.musicVolume);
            this.audioManager.setSfxVolume(this.tempSettings.sfxVolume);
            // Re-apply language if it changed
            if (this.localization.getCurrentLanguage() !== this.tempSettings.language) {
                await this.localization.setLanguage(this.tempSettings.language);
                this.uiManager.applyCurrentLanguageToDOM();
                this._populateMainOptionsForm();
            }

            this.uiManager.showNotification(this.localization.getString('settings_reset_notify') || 'Settings Reset to Default.', 'info');
        }
    }

    _exitMainOptions() {
        this.audioManager.playSound('ui_cancel', 'sfx/ui/cancel_action.wav');
        console.log("OptionsController: Exiting main options screen.");
        // Revert any unsaved changes by reloading current settings from Config/AudioManager
        // This is important if live preview changed things that weren't saved.
        this.audioManager.setMasterVolume(this.config.getUserSetting('masterVolume'));
        this.audioManager.setMusicVolume(this.config.getUserSetting('musicVolume'));
        this.audioManager.setSfxVolume(this.config.getUserSetting('sfxVolume'));
        // Add similar reverts for other live-previewed settings if any.

        InteractiveAdventure.menuController.showMenu(); // Navigate back to main menu
    }


    // --- In-Game Options Modal (game-options.html) ---

    /**
     * @method initializeInGameOptions
     * @description Populates and sets up listeners for the in-game options modal.
     * @param {HTMLElement} modalPanel - The DOM element of the in-game options modal panel.
     * @param {function} closeCallback - Callback function to close the modal (usually GameController.hideGameOptions).
     */
    initializeInGameOptions(modalPanel, closeCallback) {
        this.gameOptionsModalPanel = modalPanel;
        if (!this.gameOptionsModalPanel) {
            console.error("OptionsController: In-game options modal panel not provided.");
            return;
        }
        this.closeGameOptionsCallback = closeCallback;

        this._loadCurrentSettingsToTemp(); // Load current global settings
        this._populateInGameOptionsForm();
        this._setupInGameOptionsEventListeners();
    }

    _populateInGameOptionsForm() {
        if (!this.gameOptionsModalPanel) return;
        // Gameplay (subset of main options, or specific in-game ones)
        const textSpeedSelect = this.uiManager.getElement('#text-speed', this.gameOptionsModalPanel); // Different ID from main options
        if (textSpeedSelect) textSpeedSelect.value = this.tempSettings.textSpeed;
        const skipReadCheckbox = this.uiManager.getElement('#skip-read-text', this.gameOptionsModalPanel);
        if (skipReadCheckbox) skipReadCheckbox.checked = this.config.getUserSetting('skipReadTextInGame', false); // Could be a different setting

        // Audio (often same as main options)
        const masterVolSlider = this.uiManager.getElement('#master-volume-ingame', this.gameOptionsModalPanel);
        if(masterVolSlider) masterVolSlider.value = this.tempSettings.masterVolume * 100;
        const masterValDisplay = this.uiManager.getElement('#master-volume-value-ingame', this.gameOptionsModalPanel);
        if(masterValDisplay) masterValDisplay.textContent = `${Math.round(this.tempSettings.masterVolume * 100)}%`;

        const musicVolSlider = this.uiManager.getElement('#music-volume-ingame', this.gameOptionsModalPanel);
        if(musicVolSlider) musicVolSlider.value = this.tempSettings.musicVolume * 100;
        const musicValDisplay = this.uiManager.getElement('#music-volume-value-ingame', this.gameOptionsModalPanel);
        if(musicValDisplay) musicValDisplay.textContent = `${Math.round(this.tempSettings.musicVolume * 100)}%`;

        const sfxVolSlider = this.uiManager.getElement('#sfx-volume-ingame', this.gameOptionsModalPanel);
        if(sfxVolSlider) sfxVolSlider.value = this.tempSettings.sfxVolume * 100;
        const sfxValDisplay = this.uiManager.getElement('#sfx-volume-value-ingame', this.gameOptionsModalPanel);
        if(sfxValDisplay) sfxValDisplay.textContent = `${Math.round(this.tempSettings.sfxVolume * 100)}%`;
    }

    _setupInGameOptionsEventListeners() {
        if (!this.gameOptionsModalPanel) return;

        // Gameplay
        const textSpeedSelect = this.uiManager.getElement('#text-speed', this.gameOptionsModalPanel);
        if (textSpeedSelect) textSpeedSelect.addEventListener('change', (e) => this.tempSettings.textSpeed = e.target.value);
        const skipReadCheckbox = this.uiManager.getElement('#skip-read-text', this.gameOptionsModalPanel);
        if (skipReadCheckbox) skipReadCheckbox.addEventListener('change', (e) => this.config.setUserSetting('skipReadTextInGame', e.target.checked)); // Apply directly for this one

        // Audio Sliders (similar to main options, but might use different temp vars if needed)
        ['master', 'music', 'sfx'].forEach(type => {
            const slider = this.uiManager.getElement(`#${type}-volume-ingame`, this.gameOptionsModalPanel);
            const valueDisplay = this.uiManager.getElement(`#${type}-volume-value-ingame`, this.gameOptionsModalPanel);
            if (slider && valueDisplay) {
                slider.addEventListener('input', () => {
                    this.tempSettings[`${type}Volume`] = parseFloat(slider.value) / 100;
                    valueDisplay.textContent = `${slider.value}%`;
                    if (type === 'master') this.audioManager.setMasterVolume(this.tempSettings.masterVolume, false);
                    if (type === 'music') this.audioManager.setMusicVolume(this.tempSettings.musicVolume, false);
                    if (type === 'sfx') this.audioManager.setSfxVolume(this.tempSettings.sfxVolume, false);
                });
            }
        });

        // Action Buttons
        const applyBtn = this.uiManager.getElement('#apply-game-options-btn', this.gameOptionsModalPanel);
        if (applyBtn) applyBtn.addEventListener('click', () => this._applyInGameOptions());

        const saveGameBtn = this.uiManager.getElement('#save-game-ingame-btn', this.gameOptionsModalPanel);
        if (saveGameBtn) saveGameBtn.addEventListener('click', () => this.showSavesScreen('save'));

        const loadGameBtn = this.uiManager.getElement('#load-game-ingame-btn', this.gameOptionsModalPanel);
        if (loadGameBtn) loadGameBtn.addEventListener('click', () => this.showSavesScreen('load'));

        const exitToMenuBtn = this.uiManager.getElement('#exit-to-main-menu-btn', this.gameOptionsModalPanel);
        if (exitToMenuBtn) exitToMenuBtn.addEventListener('click', async () => {
            this.audioManager.playSound('ui_warning', 'sfx/ui/warning_alert.wav');
            const confirmed = await this.uiManager.showConfirmation(
                this.localization.getString('confirm_exit_to_menu_title') || "Exit to Main Menu?",
                this.localization.getString('confirm_exit_to_menu_text') || "Any unsaved progress will be lost. Are you sure?"
            );
            if (confirmed) {
                if (this.closeGameOptionsCallback) this.closeGameOptionsCallback(); // Close options modal first
                InteractiveAdventure.gameEngine.quitGame(); // Handles state change and navigation
                InteractiveAdventure.menuController.showMenu();
            }
        });

        // Resume button is handled by GameController (via closeCallback or specific resume btn listener)
        // Close button (X) is also handled by GameController typically
    }

    _applyInGameOptions() {
        this.audioManager.playSound('ui_confirm', 'sfx/ui/confirm_action.wav');
        console.log("OptionsController: Applying in-game options...", this.tempSettings);

        this.audioManager.setMasterVolume(this.tempSettings.masterVolume);
        this.audioManager.setMusicVolume(this.tempSettings.musicVolume);
        this.audioManager.setSfxVolume(this.tempSettings.sfxVolume);
        this.config.setUserSetting('textSpeed', this.tempSettings.textSpeed);
        // skipReadTextInGame is applied directly on change

        this.uiManager.showNotification(this.localization.getString('settings_applied_notify') || 'Settings Applied!', 'success');
        if (this.closeGameOptionsCallback) this.closeGameOptionsCallback(); // Close modal after applying
    }


    // --- Saves Screen (Load/Save) ---
    /**
     * @method showSavesScreen
     * @description Displays the load/save game screen.
     * @param {'load' | 'save'} mode - Determines if the screen is for loading or saving.
     */
    async showSavesScreen(mode = 'load') {
        const currentGameState = InteractiveAdventure.gameEngine.getCurrentState();
        const fromGame = currentGameState === InteractiveAdventure.gameEngine.GAME_STATES.PLAYING ||
                         currentGameState === InteractiveAdventure.gameEngine.GAME_STATES.GAME_OPTIONS ||
                         currentGameState === InteractiveAdventure.gameEngine.GAME_STATES.PAUSED;

        InteractiveAdventure.gameEngine.setState(InteractiveAdventure.gameEngine.GAME_STATES.SAVES);
        this.audioManager.playSound('ui_screen_transition', 'sfx/ui/transition_alt.wav');

        const savesContainer = await this.uiManager.navigateToScreen('saves');
        if (!savesContainer) return;

        this.uiManager.savesPage.title.textContent = mode === 'load'
            ? this.localization.getString('load_game_title') || 'Load Game'
            : this.localization.getString('save_game_title') || 'Save Game';

        this._populateSaveSlots(mode);
        this._setupSavesScreenEventListeners(mode, fromGame);
    }

    _populateSaveSlots(mode) {
        const slotsContainer = this.uiManager.savesPage.slotsContainer;
        if (!slotsContainer) return;
        slotsContainer.innerHTML = ''; // Clear existing slots

        const saves = this.saveSystem.listSaves();

        if (!this.uiManager.saveSlotTemplate) {
            this.uiManager.saveSlotTemplate = (slot, currentMode) => {
                const loc = this.localization;
                let nameText, timestampText;
                if (slot.isEmpty) {
                    nameText = slot.isAutosave ? loc.getString('autosave_slot_empty') || 'Autosave Slot (Empty)' : loc.getString('save_slot_empty', { slotId: slot.slotId }) || `Slot ${slot.slotId}: Empty`;
                    timestampText = '--/--/---- --:--';
                } else if (slot.error) {
                    nameText = slot.isAutosave ? loc.getString('autosave_slot_corrupted') || 'Autosave (Corrupted)' : loc.getString('save_slot_corrupted', { slotId: slot.slotId }) || `Slot ${slot.slotId}: Corrupted`;
                    timestampText = loc.getString('corrupted_data_label') || 'Corrupted';
                } else {
                    const date = new Date(slot.timestamp);
                    nameText = slot.isAutosave ? `${loc.getString('autosave_slot_label')|| 'Autosave'}: ${slot.playerName} - ${loc.getString(slot.currentSceneId) || slot.currentSceneId}`
                                           : `${loc.getString('slot_label', {slotId: slot.slotId}) || `Slot ${slot.slotId}`}: ${slot.playerName} - ${loc.getString(slot.currentSceneId) || slot.currentSceneId}`;
                    timestampText = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                }

                return `
                <div class="save-slot ${slot.isEmpty ? 'empty' : ''} ${slot.error ? 'corrupted' : ''} ${slot.isAutosave ? 'autosave' : ''}" data-slot-id="${slot.slotId}">
                    <span class="slot-name">${nameText}</span>
                    <span class="slot-timestamp">${timestampText}</span>
                    <div class="slot-actions">
                        ${currentMode === 'save' ? `<button class="button action-button save-action" ${slot.error ? 'disabled' : ''}>${loc.getString('save_button') || 'Save'}</button>` : ''}
                        <button class="button action-button load-action" ${slot.isEmpty || slot.error ? 'disabled' : ''}>${loc.getString('load_button') || 'Load'}</button>
                        <button class="button action-button delete-action" ${slot.isEmpty || slot.error ? 'disabled' : ''}>${loc.getString('delete_button') || 'Delete'}</button>
                    </div>
                </div>`;
            };
        }

        saves.forEach(slot => {
            const slotElementWrapper = document.createElement('div');
            slotElementWrapper.innerHTML = this.uiManager.saveSlotTemplate(slot, mode).trim();
            const slotElement = slotElementWrapper.firstChild;
            slotsContainer.appendChild(slotElement);

            const saveBtn = slotElement.querySelector('.save-action');
            const loadBtn = slotElement.querySelector('.load-action');
            const deleteBtn = slotElement.querySelector('.delete-action');

            if (saveBtn) saveBtn.addEventListener('click', async () => {
                this.audioManager.playSound('ui_confirm', 'sfx/ui/confirm_action.wav');
                if (!slot.isEmpty && !slot.error) { // Overwriting
                    const confirmed = await this.uiManager.showConfirmation(
                        this.localization.getString('confirm_overwrite_save_title') || "Overwrite Save?",
                        this.localization.getString('confirm_overwrite_save_text', {slotName: nameText}) || `Are you sure you want to overwrite this save?`
                    );
                    if (!confirmed) return;
                }
                InteractiveAdventure.gameEngine.saveGame(slot.slotId);
                this._populateSaveSlots(mode); // Refresh list
            });
            if (loadBtn) loadBtn.addEventListener('click', async () => {
                this.audioManager.playSound('ui_confirm', 'sfx/ui/confirm_action.wav');
                // If currently in a game, confirm loading
                const currentGameState = InteractiveAdventure.gameEngine.getCurrentState();
                 if (currentGameState === InteractiveAdventure.gameEngine.GAME_STATES.SAVES && InteractiveAdventure.gameEngine.previousState !== InteractiveAdventure.gameEngine.GAME_STATES.MENU) {
                     const confirmed = await this.uiManager.showConfirmation(
                        this.localization.getString('confirm_load_ingame_title') || "Load Game?",
                        this.localization.getString('confirm_load_ingame_text') || "Loading will discard any unsaved progress in your current game. Continue?"
                    );
                    if (!confirmed) return;
                 }

                if (InteractiveAdventure.gameEngine.loadGame(slot.slotId)) {
                    // Navigate to game screen and let GameController handle display
                    await this.uiManager.navigateToScreen('game');
                    InteractiveAdventure.gameController.loadSavedGame();
                }
            });
            if (deleteBtn) deleteBtn.addEventListener('click', async () => {
                this.audioManager.playSound('ui_warning', 'sfx/ui/warning_alert.wav');
                 const confirmed = await this.uiManager.showConfirmation(
                    this.localization.getString('confirm_delete_save_title') || "Delete Save?",
                    this.localization.getString('confirm_delete_save_text', {slotName: nameText}) || `Are you sure you want to delete this save? This action cannot be undone.`
                );
                if (confirmed) {
                    this.saveSystem.deleteSave(slot.slotId);
                    this._populateSaveSlots(mode); // Refresh list
                    this.audioManager.playSound('ui_delete', 'sfx/ui/delete_action.wav');
                }
            });
        });
    }

    _setupSavesScreenEventListeners(mode, fromGame) {
        const backBtn = this.uiManager.getElement('#back-to-menu-btn', this.uiManager.savesPage.container); // Assuming one back button
        if (backBtn) {
            backBtn.onclick = () => { // Use onclick to override potential previous listeners
                this.audioManager.playSound('ui_cancel', 'sfx/ui/cancel_action.wav');
                if (fromGame && InteractiveAdventure.gameOptionsModal.panel) { // If came from in-game options
                    // Re-show in-game options modal
                    this.uiManager.showModal('game-options-modal-overlay');
                    InteractiveAdventure.gameEngine.setState(InteractiveAdventure.gameEngine.GAME_STATES.GAME_OPTIONS);
                } else { // Came from main menu
                    InteractiveAdventure.menuController.showMenu();
                }
            };
        }
    }
}

export default OptionsController;
