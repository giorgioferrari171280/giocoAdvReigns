// utils/audioManager.js

/**
 * @fileoverview
 * Gestione del caricamento, riproduzione e controllo del volume di musica ed effetti sonori.
 */

const AudioManager = {
    /** @type {Object<string, HTMLAudioElement>} */
    sounds: {}, // Cache per gli elementi audio caricati (sia sfx che musica)
    /** @type {HTMLAudioElement|null} */
    currentMusic: null,
    /** @type {string|null} */
    currentMusicId: null,
    isMuted: false,
    volume: 0.5, // Volume globale da 0.0 a 1.0

    /**
     * Inizializza l'AudioManager, caricando le preferenze audio da localStorage.
     */
    initialize: function() {
        const savedVolume = localStorage.getItem('gameAudioVolume');
        if (savedVolume !== null) {
            this.setVolume(parseFloat(savedVolume));
        }
        const savedMuteState = localStorage.getItem('gameAudioMuted');
        if (savedMuteState !== null) {
            this.isMuted = savedMuteState === 'true';
        }
        // Applica subito lo stato di mute/volume agli elementi audio esistenti (se ce ne fossero)
        // e futuri tramite i metodi playMusic/playSound.
        console.log(`AudioManager initialized. Volume: ${this.volume}, Muted: ${this.isMuted}`);
    },

    /**
     * Carica un file audio.
     * @param {string} id - Identificatore univoco per questo suono.
     * @param {string} src - Percorso del file audio.
     * @param {boolean} [isMusic=false] - Se true, indica che è una traccia musicale (per gestione loop).
     * @returns {Promise<HTMLAudioElement>} Promessa che si risolve quando l'audio è caricato.
     */
    loadSound: function(id, src, isMusic = false) {
        return new Promise((resolve, reject) => {
            if (this.sounds[id]) {
                resolve(this.sounds[id]);
                return;
            }
            const audio = new Audio(src);
            audio.loop = isMusic; // La musica di sottofondo di solito va in loop

            audio.addEventListener('canplaythrough', () => {
                this.sounds[id] = audio;
                console.log(`Audio loaded: ${id} from ${src}`);
                resolve(audio);
            });
            audio.addEventListener('error', (e) => {
                console.error(`Error loading audio: ${id} from ${src}`, e);
                reject(e);
            });
            audio.load(); // Inizia il caricamento
        });
    },

    /**
     * Riproduce un effetto sonoro.
     * @param {string} id - L'ID del suono precedentemente caricato.
     * @param {number} [volumeScale=1.0] - Scala del volume specifica per questo suono (0.0 a 1.0).
     */
    playSound: function(id, volumeScale = 1.0) {
        if (this.isMuted) return;

        const sound = this.sounds[id];
        if (sound) {
            // Permette di riprodurre lo stesso suono più volte sovrapponendolo
            // clonando l'elemento audio. Non adatto per musica.
            if (!sound.loop) { // Non clonare tracce musicali in loop
                const soundInstance = sound.cloneNode();
                soundInstance.volume = this.volume * volumeScale;
                soundInstance.play().catch(e => console.warn(`Error playing sound ${id}:`, e));
            } else { // Per suoni che potrebbero essere musica ma usati come SFX (improbabile)
                sound.currentTime = 0;
                sound.volume = this.volume * volumeScale;
                sound.play().catch(e => console.warn(`Error playing sound ${id}:`, e));
            }
        } else {
            console.warn(`Sound not found or not loaded: ${id}. Load it first with loadSound().`);
        }
    },

    /**
     * Riproduce una traccia musicale. Ferma la musica corrente se presente.
     * @param {string} id - L'ID della traccia musicale precedentemente caricata.
     * @param {boolean} [loop=true] - Se la musica deve andare in loop.
     * @param {number} [fadeInDuration=0] - Durata del fade-in in ms (non implementato in questa versione base).
     */
    playMusic: function(id, loop = true, fadeInDuration = 0) {
        if (this.currentMusicId === id && this.currentMusic && !this.currentMusic.paused) {
            // La musica richiesta è già in riproduzione
            return;
        }

        this.stopMusic(); // Ferma la musica corrente

        const music = this.sounds[id];
        if (music) {
            this.currentMusic = music;
            this.currentMusicId = id;
            this.currentMusic.loop = loop;
            this.currentMusic.volume = this.isMuted ? 0 : this.volume;
            this.currentMusic.currentTime = 0; // Riavvolgi sempre la musica
            this.currentMusic.play().catch(e => console.error(`Error playing music ${id}:`, e));
            console.log(`Playing music: ${id}`);
        } else {
            console.warn(`Music track not found or not loaded: ${id}. Load it first with loadSound(id, src, true).`);
        }
    },

    /**
     * Ferma la traccia musicale corrente.
     * @param {number} [fadeOutDuration=0] - Durata del fade-out in ms (non implementato in questa versione base).
     */
    stopMusic: function(fadeOutDuration = 0) {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0; // Opzionale: riavvolgi
            console.log(`Music stopped: ${this.currentMusicId}`);
        }
        this.currentMusic = null;
        this.currentMusicId = null;
    },

    /**
     * Imposta il volume globale per tutti i suoni e la musica.
     * @param {number} volumeLevel - Livello del volume da 0.0 (muto) a 1.0 (massimo).
     */
    setVolume: function(volumeLevel) {
        this.volume = Math.max(0, Math.min(1, volumeLevel)); // Clamp 0-1
        if (this.currentMusic && !this.isMuted) {
            this.currentMusic.volume = this.volume;
        }
        // Nota: gli SFX clonati al volo prenderanno il nuovo volume alla prossima riproduzione.
        // Se ci sono SFX in loop (non comune), andrebbero aggiornati qui.
        localStorage.setItem('gameAudioVolume', String(this.volume));
        console.log(`Global volume set to: ${this.volume}`);
    },

    /**
     * Attiva/disattiva il mute per tutti i suoni.
     */
    toggleMute: function() {
        this.isMuted = !this.isMuted;
        if (this.currentMusic) {
            this.currentMusic.volume = this.isMuted ? 0 : this.volume;
        }
        localStorage.setItem('gameAudioMuted', String(this.isMuted));
        console.log(`Audio Muted: ${this.isMuted}`);
        return this.isMuted;
    },

    /**
     * Imposta lo stato di mute.
     * @param {boolean} muteState - True per mutare, false per smutare.
     */
    setMute: function(muteState) {
        if (this.isMuted !== muteState) {
            this.toggleMute();
        }
    },

    /**
     * Precarica un elenco di file audio.
     * @param {Array<{id: string, src: string, isMusic?: boolean}>} audioFiles - Array di oggetti audio da caricare.
     * @returns {Promise<void[]>} Promessa che si risolve quando tutti i file sono caricati.
     */
    preloadAudioList: function(audioFiles) {
        const loadPromises = audioFiles.map(file =>
            this.loadSound(file.id, file.src, file.isMusic || false)
        );
        return Promise.all(loadPromises);
    }
};

// Inizializzazione al caricamento dello script (se non si usa ES6 module export)
// AudioManager.initialize();

// Esempio di utilizzo (da chiamare nel flusso principale del gioco, es. script.js):
//
// // All'inizio del gioco o durante una schermata di caricamento:
// AudioManager.initialize(); // Carica preferenze
// AudioManager.preloadAudioList([
//     { id: 'sfx_button_click', src: 'assets/audio/sfx/ui_click.wav' },
//     { id: 'music_main_theme', src: 'assets/audio/music/main_theme.mp3', isMusic: true },
//     { id: 'sfx_explosion', src: 'assets/audio/sfx/explosion.ogg' }
// ]).then(() => {
//     console.log("Audio precaricato con successo!");
//     // Ora puoi riprodurre i suoni
//     // AudioManager.playMusic('music_main_theme');
// }).catch(error => {
//     console.error("Errore nel precaricamento audio:", error);
// });
//
// // Quando un pulsante viene cliccato:
// // someButton.addEventListener('click', () => {
// //     AudioManager.playSound('sfx_button_click');
// // });
//
// // Per cambiare volume da un controllo UI:
// // volumeSlider.addEventListener('input', (event) => {
// //     AudioManager.setVolume(parseFloat(event.target.value));
// // });
//
// // Per un pulsante mute:
// // muteButton.addEventListener('click', () => {
// //     const isMuted = AudioManager.toggleMute();
// //     muteButton.textContent = isMuted ? "Unmute" : "Mute";
// // });

// Per l'uso in vanilla JS, AudioManager sarà globale.
// window.AudioManager = AudioManager; // Opzionale, per chiarezza.
