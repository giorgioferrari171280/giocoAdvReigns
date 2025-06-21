// data/chapters.js

/**
 * @fileoverview
 * Definizioni dei capitoli del gioco.
 * Ogni capitolo raggruppa una serie di scene e può avere cutscene introduttive/conclusive.
 */

/**
 * @typedef {import('../config/gameConfig.js').ChapterConfig} ChapterConfig
 */

/**
 * Array contenente le configurazioni di tutti i capitoli del gioco.
 * La struttura di ogni oggetto ChapterConfig è definita in gameConfig.js.
 *
 * @type {Array<ChapterConfig>}
 */
const gameChapters = [
    // Esempio di struttura di un capitolo:
    // {
    //     id: "chapter_01",
    //     titleKey: "chapter_01_title", // Chiave per la localizzazione del titolo
    //     sceneIds: [
    //         "scene_intro_01",
    //         "scene_intro_02",
    //         "scene_village_center",
    //         "scene_path_choice",
    //         // ... altri ID di scene principali del capitolo
    //     ],
    //     openingCutsceneId: "cutscene_ch01_intro", // ID opzionale della cutscene di apertura
    //     closingCutsceneId: "cutscene_ch01_outro", // ID opzionale della cutscene di chiusura
    //     unlockConditions: [], // Condizioni per sbloccare questo capitolo (es. completamento precedente)
    //     rewards: [] // Eventuali ricompense globali per il completamento del capitolo
    // }
    {
        id: "chapter_01_awakening",
        titleKey: "chapter_01_title",
        sceneIds: ["scene_01_start", "scene_02_explore", "scene_03_first_choice"],
        openingCutsceneId: "cutscene_intro_game", // Assumendo una cutscene di introduzione generale al gioco
        closingCutsceneId: "cutscene_ch01_end",
        unlockConditions: [], // Il primo capitolo non ha condizioni
    }
    // Aggiungere altri capitoli qui
];

// Per l'uso in vanilla JS, gameChapters sarà globale.
// window.gameChaptersData = gameChapters; // Opzionale, per chiarezza o namespacing futuro.
