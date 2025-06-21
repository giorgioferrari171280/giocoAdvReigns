// config/gameConfig.js

/**
 * @fileoverview
 * File di configurazione globale per il gioco.
 * Contiene impostazioni come dimensioni dello schermo, frame rate concettuale,
 * livelli di difficoltà, e costanti di gioco.
 */

/**
 * @typedef {Object} GameScreenConfig
 * @property {number} width - Larghezza base del gioco in pixel.
 * @property {number} height - Altezza base del gioco in pixel.
 */

/**
 * @typedef {Object} GameSettings
 * @property {GameScreenConfig} screen - Configurazione delle dimensioni dello schermo.
 * @property {number} conceptualFrameRate - Frame rate concettuale per aggiornamenti UI (non per animazioni fluide).
 * @property {string[]} difficultyLevels - Array dei livelli di difficoltà (es. ['easy', 'normal', 'hard']).
 * @property {string} defaultDifficulty - Livello di difficoltà predefinito.
 * @property {string} defaultLanguage - Lingua predefinita del gioco (codice ISO 639-1, es. "en").
 * @property {number} maxSaveSlots - Numero massimo di slot di salvataggio.
 */

/**
 * @type {GameSettings}
 */
const gameSettings = {
    screen: {
        width: 1280,
        height: 720,
    },
    conceptualFrameRate: 10, // Ad esempio, per aggiornare l'UI ogni 100ms se necessario
    difficultyLevels: ['normal'], // Esempio, può essere esteso
    defaultDifficulty: 'normal',
    defaultLanguage: 'en',
    maxSaveSlots: 5,
    initialPlayerMoney: 100,
    defaultBackgroundImage: "assets/images/locations/placeholder_default.jpg", // Immagine di fallback per scene
    initialSceneId: "scene_01_start", // Scena iniziale dopo l'intro
    introCutsceneId: "cutscene_intro_game", // Cutscene introduttiva
    muteMusicDuringCutscenes: false, // Se la musica di gioco deve fermarsi durante le cutscene non musicali
    defaultAmbientMusic: "music_ambient_default", // Musica ambientale di fallback (placeholder ID)
    maxHallOfFameEntries: 20,
    playerStatMaxValues: { // Esempio di valori massimi per le barre di progresso
        karma: 10,
        strength: 10,
        reputation_pirate: 20,
        reputation_crown: 20,
        sanity: 100,
    },
    worldStatMaxValues: { // Esempio
        alarmLevel: 3,
        suspicionLevel: 10,
    },
    initialPlayerStats: { // Valori iniziali per una nuova partita
        money: 100,
        karma: 0,
        strength: 5,
        // Aggiungere altre stats iniziali come definite in playerStats in script.js
    },
    initialWorldState: { // Stato iniziale del mondo per una nuova partita
        alarmLevel: 0,
        // Aggiungere altri stati iniziali
    }
};

/**
 * @typedef {Object} SceneConfig
 * @property {string} id - Identificatore univoco della scena.
 * @property {string} backgroundImage - Percorso dell'immagine di sfondo.
 * @property {string} narrativeTextKey - Chiave per il testo narrativo in locales.js.
 * @property {Array<Object>} choices - Array delle scelte disponibili in questa scena.
 * @property {string} [musicTrack] - Traccia musicale per questa scena.
 * @property {Object} [nextSceneDefault] - Scena di default a cui passare se non ci sono scelte o condizioni specifiche.
 * @property {Array<Object>} [onEnterEffects] - Effetti da applicare all'entrata nella scena (es. modifica stats).
 * @property {Array<Object>} [onExitEffects] - Effetti da applicare all'uscita dalla scena.
 */

/**
 * Contenitore per le configurazioni delle scene.
 * Verrà popolato da data/scenes.js o gestito dinamicamente.
 * @type {Object<string, SceneConfig>}
 */
const scenesConfig = {
    // Esempio:
    // "scene_01_start": {
    //     id: "scene_01_start",
    //     backgroundImage: "assets/images/locations/start_location.jpg",
    //     narrativeTextKey: "scene_01_start_text",
    //     choices: [
    //         { choiceTextKey: "scene_01_choice_01", targetSceneId: "scene_02_path_a", effects: [{stat: "karma", value: 1}] },
    //         { choiceTextKey: "scene_01_choice_02", targetSceneId: "scene_02_path_b", conditions: [{itemRequired: "key_01"}] }
    //     ],
    //     musicTrack: "music_ спокойная_тема.mp3"
    // }
};

/**
 * @typedef {Object} ChapterConfig
 * @property {string} id - Identificatore univoco del capitolo.
 * @property {string} titleKey - Chiave per il titolo del capitolo in locales.js.
 * @property {string[]} sceneIds - Array ordinato degli ID delle scene principali del capitolo.
 * @property {string} [openingCutsceneId] - ID della cutscene di apertura del capitolo.
 * @property {string} [closingCutsceneId] - ID della cutscene di chiusura del capitolo.
 */

/**
 * Contenitore per le configurazioni dei capitoli.
 * Verrà popolato da data/chapters.js.
 * @type {Object<string, ChapterConfig>}
 */
const chaptersConfig = {
    // Esempio:
    // "chapter_01": {
    //     id: "chapter_01",
    //     titleKey: "chapter_01_title",
    //     sceneIds: ["scene_01_start", "scene_02_path_a", "scene_03_conclusion_a"],
    //     openingCutsceneId: "cutscene_intro_ch01",
    //     closingCutsceneId: "cutscene_outro_ch01"
    // }
};

/**
 * @typedef {Object} EndingConfig
 * @property {string} id - Identificatore univoco del finale.
 * @property {string} titleKey - Chiave per il titolo del finale in locales.js.
 * @property {string} descriptionKey - Chiave per la descrizione del finale.
 * @property {string[]} cutsceneSequenceIds - Array di ID delle cutscene per questo finale.
 * @property {Object} conditions - Condizioni per raggiungere questo finale (es. stats, world state).
 */

/**
 * Contenitore per le configurazioni dei finali.
 * Verrà popolato da data/endings.js.
 * @type {Object<string, EndingConfig>}
 */
const endingsConfig = {
    // Esempio:
    // "ending_good": {
    //     id: "ending_good",
    //     titleKey: "ending_good_title",
    //     descriptionKey: "ending_good_description",
    //     cutsceneSequenceIds: ["cutscene_final_good_01", "cutscene_final_good_02"],
    //     conditions: { playerStats: { karma: 10 }, worldState: { peace: 5 } }
    // }
};

/**
 * @typedef {Object} AchievementConfig
 * @property {string} id - Identificatore univoco dell'achievement.
 * @property {string} nameKey - Chiave per il nome dell'achievement in locales.js.
 * @property {string} descriptionKey - Chiave per la descrizione.
 * @property {string} icon - Percorso dell'icona dell'achievement.
 * @property {Object} conditions - Condizioni per sbloccare l'achievement.
 */

/**
 * Contenitore per le configurazioni degli achievement.
 * Verrà popolato da data/achievements.js.
 * @type {Object<string, AchievementConfig>}
 */
const achievementsConfig = {
    // Esempio:
    // "ach_first_step": {
    //     id: "ach_first_step",
    //     nameKey: "ach_first_step_name",
    //     descriptionKey: "ach_first_step_desc",
    //     icon: "assets/images/ui/ach_first_step_icon.png",
    //     conditions: { sceneVisited: "scene_01_start" }
    // }
};

/**
 * @typedef {Object} SideQuestConfig
 * @property {string} id - Identificatore univoco della side quest.
 * @property {string} titleKey - Chiave per il titolo della side quest.
 * @property {string} startingSceneId - ID della scena che avvia la side quest.
 * @property {string[]} sceneIds - Array di ID delle scene che compongono la side quest.
 * @property {string} returnSceneId - ID della scena principale a cui tornare dopo aver completato la side quest.
 * @property {Object} [rewards] - Ricompense per il completamento.
 */

/**
 * Contenitore per le configurazioni delle missioni secondarie.
 * Verrà popolato da data/sideQuests.js.
 * @type {Object<string, SideQuestConfig>}
 */
const sideQuestsConfig = {
    // Esempio:
    // "sq_lost_cat": {
    //     id: "sq_lost_cat",
    //     titleKey: "sq_lost_cat_title",
    //     startingSceneId: "scene_05_village", // La side quest parte da una scelta in questa scena
    //     sceneIds: ["sq_cat_scene_01", "sq_cat_scene_02"],
    //     returnSceneId: "scene_05_village", // O "scene_06_next_main"
    //     rewards: { items: ["cat_collar"], playerStats: { reputation: 1 } }
    // }
};

// Esporta le configurazioni per l'utilizzo in altri moduli (se si usano moduli ES6, altrimenti saranno globali)
// Per questo progetto vanilla JS, queste costanti saranno disponibili globalmente se gameConfig.js è incluso prima di script.js
// window.gameSettings = gameSettings;
// window.scenesConfig = scenesConfig;
// window.chaptersConfig = chaptersConfig;
// ... e così via per gli altri. Tuttavia, è meglio accedere tramite un oggetto globale del gioco se possibile.
// Ad esempio, game.config.settings, game.config.scenes, ecc.
// Per ora, li lasciamo così, assumendo che verranno gestiti in script.js.
