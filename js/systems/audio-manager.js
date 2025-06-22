// ============== AUDIO MANAGER MODULE ============== //

import InteractiveAdventure from "../core/main.js"; // For Config

/**
 * @class AudioManager
 * @description Manages playback of music and sound effects.
 */
class AudioManager {
    /**
     * @constructor
     * @param {Config} config - Instance of the Config module to get volume settings.
     */
    constructor(config) {
        this.config = config; // To access user volume settings

        this.musicAudio = null; // HTMLAudioElement for background music
        this.sfxAudio = {};     // Object to hold multiple HTMLAudioElements for SFX, keyed by id
        this.ambientAudio = null; // HTMLAudioElement for ambient sounds

        this.currentMusicTrack = null;
        this.currentAmbientSound = null;

        // Initial volume settings (will be updated from config)
        this.masterVolume = this.config.getUserSetting('masterVolume', 1.0); // Overall volume
        this.musicVolume = this.config.getUserSetting('musicVolume', 0.7);
        this.sfxVolume = this.config.getUserSetting('sfxVolume', 0.9);
        this.ambientVolume = this.config.getUserSetting('ambientVolume', 0.5); // Separate volume for ambient

        this.isMuted = this.config.getUserSetting('isMuted', false); // Global mute state

        this.soundAssetsPath = 'assets/audio/'; // Base path for audio assets

        // Preload common sounds or important music tracks if necessary
        // this.preloadSound('ui_click', 'sfx/ui/click.mp3');
        // this.preloadSound('ui_hover', 'sfx/ui/hover.ogg');

        console.log("AudioManager initialized.");
        this._applyAllVolumes(); // Apply initial volumes
    }

    /**
     * @method _createAudioElement
     * @description Helper to create an HTMLAudioElement.
     * @param {string} src - The source URL of the audio file.
     * @param {boolean} loop - Whether the audio should loop.
     * @returns {HTMLAudioElement}
     * @private
     */
    _createAudioElement(src, loop = false) {
        const audio = new Audio(src);
        audio.loop = loop;
        audio.onerror = (e) => {
            console.error(`AudioManager: Error loading audio source "${src}"`, e);
            InteractiveAdventure.errorHandler.handle(e.target.error, `Failed to load audio: ${src}`);
        };
        return audio;
    }

    /**
     * @method _getEffectiveVolume
     * @description Calculates the effective volume considering master volume and mute state.
     * @param {number} specificVolume - The volume for a specific type (music, sfx, ambient).
     * @returns {number} The calculated effective volume (0.0 to 1.0).
     * @private
     */
    _getEffectiveVolume(specificVolume) {
        if (this.isMuted) return 0;
        return Math.max(0, Math.min(1, specificVolume * this.masterVolume));
    }

    /**
     * @method _applyAllVolumes
     * @description Applies current volume settings to all active audio elements.
     * @private
     */
    _applyAllVolumes() {
        if (this.musicAudio) {
            this.musicAudio.volume = this._getEffectiveVolume(this.musicVolume);
        }
        if (this.ambientAudio) {
            this.ambientAudio.volume = this._getEffectiveVolume(this.ambientVolume);
        }
        Object.values(this.sfxAudio).forEach(audioObj => {
            if (audioObj.element) {
                audioObj.element.volume = this._getEffectiveVolume(this.sfxVolume);
            }
        });
    }

    // --- Music Controls ---

    /**
     * @method playMusic
     * @description Plays or resumes background music.
     * @param {string} trackId - Identifier for the music track (e.g., 'main_theme', 'forest_ambience').
     *                           This will be mapped to an actual file path.
     * @param {boolean} [loop=true] - Whether the music should loop.
     * @param {number} [fadeDuration=1000] - Duration for fade-in/fade-out in milliseconds.
     */
    async playMusic(trackId, loop = true, fadeDuration = 1000) {
        if (this.currentMusicTrack === trackId && this.musicAudio && !this.musicAudio.paused) {
            console.log(`AudioManager: Music track "${trackId}" is already playing.`);
            return;
        }

        const trackPath = `${this.soundAssetsPath}music/${trackId}.mp3`; // Assuming .mp3, adjust as needed

        // Stop and fade out current music if any
        if (this.musicAudio) {
            await this.fadeOut(this.musicAudio, fadeDuration / 2);
            this.musicAudio.pause();
            this.musicAudio.currentTime = 0; // Reset time
        }

        this.currentMusicTrack = trackId;
        this.musicAudio = this._createAudioElement(trackPath, loop);
        this.musicAudio.volume = 0; // Start at 0 for fade-in

        try {
            await this.musicAudio.play();
            console.log(`AudioManager: Playing music "${trackId}".`);
            await this.fadeIn(this.musicAudio, this._getEffectiveVolume(this.musicVolume), fadeDuration);
        } catch (error) {
            console.error(`AudioManager: Error playing music "${trackId}":`, error);
            InteractiveAdventure.errorHandler.handle(error, `Error playing music: ${trackId}`);
            this.currentMusicTrack = null;
            this.musicAudio = null;
        }
    }

    /**
     * @method stopMusic
     * @description Stops the currently playing background music with a fade-out.
     * @param {number} [fadeDuration=1000] - Duration for fade-out in milliseconds.
     */
    async stopMusic(fadeDuration = 1000) {
        if (this.musicAudio && !this.musicAudio.paused) {
            console.log("AudioManager: Stopping music.");
            await this.fadeOut(this.musicAudio, fadeDuration);
            this.musicAudio.pause();
            this.musicAudio.currentTime = 0;
            this.currentMusicTrack = null;
            // this.musicAudio = null; // Or keep it for potential replay
        }
    }

    /**
     * @method pauseMusic
     * @description Pauses the current music.
     * @param {number} [fadeDuration=500] - Duration for fade-out in milliseconds.
     */
    async pauseMusic(fadeDuration = 500) {
        if (this.musicAudio && !this.musicAudio.paused) {
            await this.fadeOut(this.musicAudio, fadeDuration, this.musicAudio.volume / 2); // Fade to half for quicker pause feel
            this.musicAudio.pause();
            console.log("AudioManager: Music paused.");
        }
    }

    /**
     * @method resumeMusic
     * @description Resumes paused music.
     * @param {number} [fadeDuration=500] - Duration for fade-in in milliseconds.
     */
    async resumeMusic(fadeDuration = 500) {
        if (this.musicAudio && this.musicAudio.paused && this.currentMusicTrack) {
            try {
                await this.musicAudio.play();
                await this.fadeIn(this.musicAudio, this._getEffectiveVolume(this.musicVolume), fadeDuration);
                console.log("AudioManager: Music resumed.");
            } catch (error) {
                console.error(`AudioManager: Error resuming music:`, error);
            }
        }
    }


    // --- Sound Effects (SFX) Controls ---

    /**
     * @method preloadSound
     * @description Preloads a sound effect.
     * @param {string} sfxId - A unique identifier for the sound effect.
     * @param {string} filePath - The relative path to the sound file from `soundAssetsPath`.
     */
    preloadSound(sfxId, filePath) {
        if (this.sfxAudio[sfxId]) {
            // console.log(`AudioManager: SFX "${sfxId}" already preloaded or being loaded.`);
            return;
        }
        const fullPath = `${this.soundAssetsPath}${filePath}`;
        const audio = this._createAudioElement(fullPath, false);
        audio.volume = this._getEffectiveVolume(this.sfxVolume);
        this.sfxAudio[sfxId] = { element: audio, path: fullPath, loaded: false };

        // Attempt to load it by trying to play and immediately pause, or use 'canplaythrough'
        audio.addEventListener('canplaythrough', () => {
            this.sfxAudio[sfxId].loaded = true;
            // console.log(`AudioManager: SFX "${sfxId}" preloaded successfully.`);
        }, { once: true });
        audio.load(); // Important to actually trigger loading
    }


    /**
     * @method playSound
     * @description Plays a sound effect.
     * @param {string} sfxId - The identifier of the sound effect (must be preloaded or path provided).
     * @param {string} [filePath] - Optional: path to the sound file if not preloaded.
     *                              It's better to preload sounds for performance.
     * @param {boolean} [allowOverlap=true] - If false, stops previous instance of this SFX before playing.
     */
    playSound(sfxId, filePath = null, allowOverlap = true) {
        let audioObj = this.sfxAudio[sfxId];

        if (!audioObj && filePath) {
            this.preloadSound(sfxId, filePath); // Preload on the fly if path provided
            audioObj = this.sfxAudio[sfxId];
        } else if (!audioObj) {
            console.error(`AudioManager: SFX "${sfxId}" not found and no filePath provided.`);
            return;
        }

        const soundElement = audioObj.element;
        if (!soundElement) {
            console.error(`AudioManager: Audio element for SFX "${sfxId}" is missing.`);
            return;
        }

        soundElement.volume = this._getEffectiveVolume(this.sfxVolume);

        if (soundElement.paused || soundElement.ended || allowOverlap) {
            if (!allowOverlap && (!soundElement.paused && !soundElement.ended)) {
                soundElement.pause();
                soundElement.currentTime = 0;
            }
            // If allowOverlap is true, we might need to clone the node to play multiple instances
            if (allowOverlap && (!soundElement.paused && !soundElement.ended)) {
                const newInstance = soundElement.cloneNode(true);
                newInstance.volume = this._getEffectiveVolume(this.sfxVolume);
                newInstance.play().catch(e => console.warn(`AudioManager: Error playing overlapped SFX "${sfxId}":`, e));
            } else {
                soundElement.currentTime = 0; // Restart if playing the same instance
                soundElement.play().catch(e => console.warn(`AudioManager: Error playing SFX "${sfxId}":`, e));
            }
            // console.log(`AudioManager: Playing SFX "${sfxId}".`);
        } else {
             // If !allowOverlap and it's currently playing, do nothing or queue it.
             // For simplicity, we'll just log it for now.
            // console.log(`AudioManager: SFX "${sfxId}" is already playing and overlap is not allowed.`);
        }
    }

    /**
     * @method stopSound
     * @description Stops a specific sound effect.
     * @param {string} sfxId - The identifier of the sound effect.
     */
    stopSound(sfxId) {
        const audioObj = this.sfxAudio[sfxId];
        if (audioObj && audioObj.element && !audioObj.element.paused) {
            audioObj.element.pause();
            audioObj.element.currentTime = 0;
            console.log(`AudioManager: Stopped SFX "${sfxId}".`);
        }
    }

    // --- Ambient Sound Controls ---
    // Similar to music, but for continuous background environmental sounds

    /**
     * @method playAmbientSound
     * @description Plays an ambient sound.
     * @param {string} soundId - Identifier for the ambient sound.
     * @param {boolean} [loop=true] - Whether the sound should loop.
     * @param {number} [fadeDuration=2000] - Duration for fade-in.
     */
    async playAmbientSound(soundId, loop = true, fadeDuration = 2000) {
        if (this.currentAmbientSound === soundId && this.ambientAudio && !this.ambientAudio.paused) {
            return;
        }
        const soundPath = `${this.soundAssetsPath}sfx/ambient/${soundId}.mp3`; // Example path

        if (this.ambientAudio) {
            await this.fadeOut(this.ambientAudio, fadeDuration / 2);
            this.ambientAudio.pause();
            this.ambientAudio.currentTime = 0;
        }

        this.currentAmbientSound = soundId;
        this.ambientAudio = this._createAudioElement(soundPath, loop);
        this.ambientAudio.volume = 0;

        try {
            await this.ambientAudio.play();
            console.log(`AudioManager: Playing ambient sound "${soundId}".`);
            await this.fadeIn(this.ambientAudio, this._getEffectiveVolume(this.ambientVolume), fadeDuration);
        } catch (error) {
            console.error(`AudioManager: Error playing ambient sound "${soundId}":`, error);
            this.currentAmbientSound = null;
            this.ambientAudio = null;
        }
    }

    /**
     * @method stopAmbientSound
     * @description Stops the currently playing ambient sound.
     * @param {number} [fadeDuration=2000] - Duration for fade-out.
     */
    async stopAmbientSound(fadeDuration = 2000) {
        if (this.ambientAudio && !this.ambientAudio.paused) {
            console.log("AudioManager: Stopping ambient sound.");
            await this.fadeOut(this.ambientAudio, fadeDuration);
            this.ambientAudio.pause();
            this.ambientAudio.currentTime = 0;
            this.currentAmbientSound = null;
        }
    }


    // --- Volume and Mute Controls ---

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, parseFloat(volume)));
        this.config.setUserSetting('masterVolume', this.masterVolume);
        this._applyAllVolumes();
        console.log(`AudioManager: Master volume set to ${this.masterVolume * 100}%`);
    }
    getMasterVolume() { return this.masterVolume; }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, parseFloat(volume)));
        this.config.setUserSetting('musicVolume', this.musicVolume);
        if (this.musicAudio) {
            this.musicAudio.volume = this._getEffectiveVolume(this.musicVolume);
        }
        console.log(`AudioManager: Music volume set to ${this.musicVolume * 100}%`);
    }
    getMusicVolume() { return this.musicVolume; }

    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, parseFloat(volume)));
        this.config.setUserSetting('sfxVolume', this.sfxVolume);
        Object.values(this.sfxAudio).forEach(audioObj => {
            if (audioObj.element) {
                audioObj.element.volume = this._getEffectiveVolume(this.sfxVolume);
            }
        });
        console.log(`AudioManager: SFX volume set to ${this.sfxVolume * 100}%`);
    }
    getSfxVolume() { return this.sfxVolume; }

    setAmbientVolume(volume) {
        this.ambientVolume = Math.max(0, Math.min(1, parseFloat(volume)));
        this.config.setUserSetting('ambientVolume', this.ambientVolume);
        if (this.ambientAudio) {
            this.ambientAudio.volume = this._getEffectiveVolume(this.ambientVolume);
        }
        console.log(`AudioManager: Ambient volume set to ${this.ambientVolume * 100}%`);
    }
    getAmbientVolume() { return this.ambientVolume; }


    toggleMute() {
        this.isMuted = !this.isMuted;
        this.config.setUserSetting('isMuted', this.isMuted);
        this._applyAllVolumes();
        console.log(`AudioManager: Mute toggled. Is muted: ${this.isMuted}`);
        return this.isMuted;
    }
    getMuteState() { return this.isMuted; }


    // --- Fade In/Out Helpers ---
    /**
     * @method fadeIn
     * @description Fades in an audio element.
     * @param {HTMLAudioElement} audioElement - The audio element to fade.
     * @param {number} targetVolume - The final volume level.
     * @param {number} duration - Duration of the fade in milliseconds.
     * @returns {Promise<void>}
     */
    fadeIn(audioElement, targetVolume, duration) {
        return new Promise((resolve) => {
            if (!audioElement) { resolve(); return; }
            audioElement.volume = 0;
            let currentVolume = 0;
            const stepTime = 50; // Update volume every 50ms
            const steps = duration / stepTime;
            const volumeStep = targetVolume / steps;

            const interval = setInterval(() => {
                currentVolume += volumeStep;
                if (currentVolume >= targetVolume) {
                    audioElement.volume = targetVolume;
                    clearInterval(interval);
                    resolve();
                } else {
                    audioElement.volume = currentVolume;
                }
            }, stepTime);
        });
    }

    /**
     * @method fadeOut
     * @description Fades out an audio element.
     * @param {HTMLAudioElement} audioElement - The audio element to fade.
     * @param {number} duration - Duration of the fade in milliseconds.
     * @param {number} [targetVolume=0] - The volume to fade to (usually 0).
     * @returns {Promise<void>}
     */
    fadeOut(audioElement, duration, targetVolume = 0) {
        return new Promise((resolve) => {
            if (!audioElement || audioElement.volume === targetVolume) { resolve(); return; }
            const initialVolume = audioElement.volume;
            let currentVolume = initialVolume;
            const stepTime = 50;
            const steps = duration / stepTime;
            const volumeStep = (initialVolume - targetVolume) / steps;

            const interval = setInterval(() => {
                currentVolume -= volumeStep;
                if (currentVolume <= targetVolume) {
                    audioElement.volume = targetVolume;
                    clearInterval(interval);
                    resolve();
                } else {
                    audioElement.volume = currentVolume;
                }
            }, stepTime);
        });
    }

    /**
     * @method stopAllSounds
     * @description Stops all currently playing music, SFX, and ambient sounds immediately.
     *              Useful for transitions or when exiting the game.
     */
    stopAllSounds() {
        console.log("AudioManager: Stopping all sounds.");
        if (this.musicAudio) {
            this.musicAudio.pause();
            this.musicAudio.currentTime = 0;
            this.currentMusicTrack = null;
        }
        if (this.ambientAudio) {
            this.ambientAudio.pause();
            this.ambientAudio.currentTime = 0;
            this.currentAmbientSound = null;
        }
        Object.values(this.sfxAudio).forEach(audioObj => {
            if (audioObj.element && !audioObj.element.paused) {
                audioObj.element.pause();
                audioObj.element.currentTime = 0;
            }
        });
    }
}

export default AudioManager;
