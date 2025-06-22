// ============== CUTSCENE PLAYER MODULE ============== //

import InteractiveAdventure from "../core/main.js"; // For UIManager, AudioManager, AnimationController, Localization

/**
 * @class CutscenePlayer
 * @description Manages the playback of pre-defined cutscenes (e.g., intro, outro, story moments).
 */
class CutscenePlayer {
    /**
     * @constructor
     * @param {UIManager} uiManager - Instance of UIManager.
     * @param {AudioManager} audioManager - Instance of AudioManager.
     * @param {AnimationController} animationController - Instance of AnimationController.
     * @param {Localization} localization - Instance of Localization.
     */
    constructor(uiManager, audioManager, animationController, localization) {
        this.uiManager = uiManager;
        this.audioManager = audioManager;
        this.animationController = animationController;
        this.localization = localization;

        this.cutsceneContainer = null; // DOM element for the cutscene page (e.g., intro-cutscene.html)
        this.cutsceneData = null; // Data for the currently playing cutscene
        this.currentFrameIndex = 0;
        this.isPlaying = false;
        this.onCompleteCallback = null;

        // Cutscene definitions (could be loaded from a JSON file)
        this.cutscenes = {
            'intro_cutscene': { // Example ID, matches INITIAL_SCENE_ID in StateManager for intro
                type: 'sequential', // 'sequential' or 'video' or 'interactive'
                frames: [
                    { image: 'assets/images/scenes/placeholder-intro-1.png', textKey: 'intro_frame1_text', duration: 5000, audio: 'sfx/narrative/intro_narration_1.mp3', animationIn: 'fadeIn', animationOut: 'fadeOut' },
                    { image: 'assets/images/scenes/placeholder-intro-2.png', textKey: 'intro_frame2_text', duration: 5000, audio: 'sfx/narrative/intro_narration_2.mp3', animationIn: 'slideInRight', animationOut: 'slideOutLeft' },
                    { image: 'assets/images/scenes/placeholder-intro-3.png', textKey: 'intro_frame3_text', duration: 6000, animationIn: 'zoomIn', music: 'epic_intro_theme' }
                ],
                defaultNextScene: 'scene_001', // Scene to go to after cutscene if no specific callback overrides
                skippable: true,
                musicTrack: 'ambient_intro_music' // Overall music for the cutscene
            },
            'default_ending': {
                type: 'sequential',
                frames: [
                    { image: 'assets/images/scenes/placeholder-final-1.png', textKey: 'ending_default_frame1', duration: 7000, music: 'ending_theme_generic' },
                    { textKey: 'ending_credits_roll_trigger', customAction: 'showCredits' } // Special frame to trigger credits
                ],
                skippable: false, // Endings usually not skippable until credits
                musicTrack: 'ending_theme_generic'
            }
            // Add other cutscene definitions here
        };

        console.log("CutscenePlayer initialized.");
    }

    /**
     * @method loadCutsceneDefinitions
     * @description Loads cutscene definitions from a file (optional).
     * @param {string} filePath - Path to the JSON file with cutscene definitions.
     */
    async loadCutsceneDefinitions(filePath) {
        try {
            const data = await InteractiveAdventure.dataLoader.loadJSON(filePath);
            if (data && data.cutscenes) {
                this.cutscenes = { ...this.cutscenes, ...data.cutscenes }; // Merge, allowing overrides
                console.log("CutscenePlayer: Additional cutscene definitions loaded.");
            }
        } catch (error) {
            console.error("CutscenePlayer: Error loading cutscene definitions:", error);
            InteractiveAdventure.errorHandler.handle(error, "Failed to load cutscene definitions");
        }
    }


    /**
     * @method play
     * @description Starts playing a cutscene by its ID.
     * @param {string} cutsceneId - The ID of the cutscene to play.
     * @param {function} [onComplete] - Optional callback function when the cutscene finishes.
     */
    async play(cutsceneId, onComplete) {
        this.cutsceneData = this.cutscenes[cutsceneId];
        if (!this.cutsceneData) {
            console.error(`CutscenePlayer: Cutscene with ID "${cutsceneId}" not found.`);
            if (onComplete) onComplete();
            return;
        }

        console.log(`CutscenePlayer: Playing cutscene "${cutsceneId}".`);
        this.isPlaying = true;
        this.currentFrameIndex = 0;
        this.onCompleteCallback = onComplete || null;

        InteractiveAdventure.gameEngine.setState(InteractiveAdventure.gameEngine.GAME_STATES.CUTSCENE);

        // Determine which HTML page to load (intro, final, or generic)
        let pageName = 'cutscene'; // Generic cutscene page
        if (cutsceneId.includes('intro')) pageName = 'intro-cutscene';
        else if (cutsceneId.includes('final') || cutsceneId.includes('ending')) pageName = 'final-cutscene';

        this.cutsceneContainer = await this.uiManager.navigateToScreen(pageName);
        if (!this.cutsceneContainer) {
            console.error("CutscenePlayer: Failed to load cutscene screen content.");
            this.isPlaying = false;
            if (this.onCompleteCallback) this.onCompleteCallback();
            return;
        }

        this._setupCutsceneEventListeners();
        this._updateSkipButtonVisibility();

        if (this.cutsceneData.musicTrack) {
            this.audioManager.playMusic(this.cutsceneData.musicTrack, true, 1500);
        }

        this._playNextFrame();
    }

    /**
     * @method _playNextFrame
     * @description Plays the current frame of the cutscene and advances to the next.
     * @private
     */
    _playNextFrame() {
        if (!this.isPlaying || !this.cutsceneData || this.currentFrameIndex >= this.cutsceneData.frames.length) {
            this._finishCutscene();
            return;
        }

        const frame = this.cutsceneData.frames[this.currentFrameIndex];
        console.log(`CutscenePlayer: Playing frame ${this.currentFrameIndex + 1}/${this.cutsceneData.frames.length}`, frame);

        // Update UI elements (image, text)
        const imageElement = this.uiManager.getElement('#cutscene-image', this.cutsceneContainer) || this.uiManager.getElement('#final-cutscene-image', this.cutsceneContainer);
        const textElement = this.uiManager.getElement('#cutscene-text', this.cutsceneContainer) || this.uiManager.getElement('#final-cutscene-text', this.cutsceneContainer);
        const titleElement = this.uiManager.getElement('#ending-title', this.cutsceneContainer); // For final cutscenes

        // Clear previous frame animations/content if needed
        // this.animationController.clearAnimations(imageElement);
        // this.animationController.clearAnimations(textElement);


        if (imageElement) {
            if (frame.image) {
                imageElement.src = frame.image;
                imageElement.alt = this.localization.getString(frame.altTextKey) || "Cutscene image";
                imageElement.classList.remove('hidden');
                if (frame.animationIn) this.animationController.animateElement(imageElement, frame.animationIn);
            } else {
                // imageElement.classList.add('hidden'); // Or keep previous image if desired
            }
        }

        if (textElement) {
            if (frame.textKey) {
                const text = this.localization.getString(frame.textKey);
                if (frame.textEffect === 'typewriter') {
                    this.animationController.typewriterEffect(textElement, text, frame.typewriterSpeed || 70);
                } else {
                    textElement.textContent = text;
                }
                textElement.classList.remove('hidden');
                 if (frame.animationIn && frame.textEffect !== 'typewriter') this.animationController.animateElement(textElement, frame.animationIn);
            } else {
                textElement.textContent = ''; // Clear text if none for this frame
                // textElement.classList.add('hidden');
            }
        }

        if (titleElement && frame.titleKey) { // For final cutscenes with titles
            titleElement.textContent = this.localization.getString(frame.titleKey);
            if (frame.animationIn) this.animationController.animateElement(titleElement, frame.animationIn);
        }


        // Play frame-specific audio or music
        if (frame.audio && this.audioManager) {
            this.audioManager.playSound(frame.audioId || `frame_audio_${this.currentFrameIndex}`, frame.audio);
        }
        if (frame.music && this.audioManager) { // Override cutscene music for this frame
            this.audioManager.playMusic(frame.music, frame.musicLoop !== undefined ? frame.musicLoop : true);
        }

        // Handle custom actions
        if (frame.customAction) {
            this._handleCustomAction(frame.customAction, frame.actionParams);
        }


        // Set timeout for next frame or wait for interaction
        if (frame.waitForClick) {
            const nextButton = this.uiManager.getElement('#next-cutscene-frame-btn', this.cutsceneContainer);
            if (nextButton) {
                nextButton.classList.remove('hidden');
                nextButton.onclick = () => { // Use onclick to ensure it's fresh
                    nextButton.classList.add('hidden');
                    this.currentFrameIndex++;
                    this._playNextFrame();
                };
            }
        } else if (frame.duration && frame.duration > 0) {
            // Ensure previous timeouts are cleared if any (e.g., if skipped)
            if(this.frameTimeoutId) clearTimeout(this.frameTimeoutId);

            this.frameTimeoutId = setTimeout(async () => {
                // Animate out current elements before moving to next frame
                if(frame.animationOut && this.animationController){
                    if(imageElement && frame.image) await this.animationController.animateElement(imageElement, frame.animationOut, true);
                    if(textElement && frame.textKey) await this.animationController.animateElement(textElement, frame.animationOut, true);
                    if(titleElement && frame.titleKey) await this.animationController.animateElement(titleElement, frame.animationOut, true);
                }
                this.currentFrameIndex++;
                this._playNextFrame();
            }, frame.duration);
        } else { // No duration, no click wait -> advance immediately (or error/misconfiguration)
            console.warn("CutscenePlayer: Frame has no duration and is not set to wait for click. Advancing immediately or finishing.");
            this.currentFrameIndex++;
            this._playNextFrame();
        }
    }

    _handleCustomAction(actionName, params) {
        console.log(`CutscenePlayer: Handling custom action "${actionName}" with params:`, params);
        switch(actionName) {
            case 'showCredits':
                if (InteractiveAdventure.menuController) {
                    // Need to properly transition, not just navigate.
                    // For now, let's assume it ends the cutscene and menu controller takes over.
                    this._finishCutscene(true); // true to indicate special finish
                    InteractiveAdventure.menuController.handleCredits();
                }
                break;
            // Add other custom actions
        }
    }


    /**
     * @method _finishCutscene
     * @description Ends the cutscene playback and calls the onComplete callback.
     * @param {boolean} [suppressDefaultNext=false] - If true, don't proceed to defaultNextScene.
     * @private
     */
    _finishCutscene(suppressDefaultNext = false) {
        console.log("CutscenePlayer: Cutscene finished.");
        this.isPlaying = false;
        if(this.frameTimeoutId) clearTimeout(this.frameTimeoutId);
        this.frameTimeoutId = null;

        // Stop cutscene-specific music if it was different from main theme or next scene's music
        // This logic can be complex; for now, assume music transitions are handled by next scene or callback.
        // if (this.cutsceneData.musicTrack && this.audioManager.currentMusicTrack === this.cutsceneData.musicTrack) {
        // this.audioManager.stopMusic(1000);
        // }

        if (this.onCompleteCallback) {
            this.onCompleteCallback();
        } else if (this.cutsceneData.defaultNextScene && !suppressDefaultNext) {
            // Default behavior: transition to a specified game scene
            InteractiveAdventure.gameEngine.setState(InteractiveAdventure.gameEngine.GAME_STATES.PLAYING);
            // Ensure game screen is loaded before sceneManager tries to display
            this.uiManager.navigateToScreen('game').then(() => {
                 if (InteractiveAdventure.gameController && !InteractiveAdventure.gameController.gameScreenContainer) {
                    InteractiveAdventure.gameController.initializeGameScreen(this.uiManager.getElement('#game-page-container .game-screen-container')); // A bit hacky path
                 }
                this.sceneManager.loadAndDisplayScene(this.cutsceneData.defaultNextScene);
            });
        } else if (!suppressDefaultNext) {
            // Fallback: go to main menu if no callback and no default next scene
            InteractiveAdventure.gameEngine.setState(InteractiveAdventure.gameEngine.GAME_STATES.MENU);
            InteractiveAdventure.menuController.showMenu();
        }
        this.onCompleteCallback = null; // Clear callback
        this.cutsceneData = null;
    }

    /**
     * @method skip
     * @description Skips the current cutscene if skippable.
     */
    skip() {
        if (this.isPlaying && this.cutsceneData && this.cutsceneData.skippable) {
            console.log("CutscenePlayer: Skipping cutscene.");
            this.audioManager.playSound('ui_skip', 'sfx/ui/skip_action.wav');
            this._finishCutscene();
        }
    }

    _setupCutsceneEventListeners() {
        if (!this.cutsceneContainer) return;

        const skipButton = this.uiManager.getElement('#skip-cutscene-btn', this.cutsceneContainer) ||
                           this.uiManager.getElement('#skip-intro-btn', this.cutsceneContainer); // Support old ID
        if (skipButton) {
            skipButton.onclick = () => this.skip(); // Use onclick for easy replacement
        }

        // For final cutscenes with specific buttons
        const viewCreditsBtn = this.uiManager.getElement('#view-credits-btn', this.cutsceneContainer);
        if (viewCreditsBtn) {
            viewCreditsBtn.onclick = () => {
                this._finishCutscene(true); // Suppress default next, credits handler will navigate
                InteractiveAdventure.menuController.handleCredits();
            };
        }
        const returnToMenuBtn = this.uiManager.getElement('#return-to-main-menu-final-btn', this.cutsceneContainer);
        if (returnToMenuBtn) {
            returnToMenuBtn.onclick = () => {
                this._finishCutscene(true); // Suppress default next
                InteractiveAdventure.menuController.showMenu();
            };
        }
    }

    _updateSkipButtonVisibility() {
         if (!this.cutsceneContainer || !this.cutsceneData) return;
         const skipButton = this.uiManager.getElement('#skip-cutscene-btn', this.cutsceneContainer) ||
                            this.uiManager.getElement('#skip-intro-btn', this.cutsceneContainer);
         if (skipButton) {
             skipButton.classList.toggle('hidden', !this.cutsceneData.skippable);
         }
    }
}

export default CutscenePlayer;
