// data/achievements.js

/**
 * @fileoverview
 * Definizioni degli achievement del gioco.
 * Include nome, descrizione, requisiti per lo sblocco.
 */

/**
 * @typedef {import('../config/gameConfig.js').AchievementConfig} AchievementConfig
 */

/**
 * Oggetto contenente le configurazioni di tutti gli achievement, indicizzati per ID.
 * La struttura di ogni oggetto AchievementConfig è definita in gameConfig.js.
 *
 * @type {Object<string, AchievementConfig>}
 */
const gameAchievements = {
    // Esempio di struttura di un achievement:
    // "ach_001_first_step": {
    //     id: "ach_001_first_step",
    //     nameKey: "achievement_first_step_name", // Chiave per il nome localizzato
    //     descriptionKey: "achievement_first_step_desc", // Chiave per la descrizione localizzata
    //     icon: "assets/images/ui/achievements/first_step.png", // Icona dell'achievement
    //     points: 10, // Punteggio opzionale per l'achievement
    //     hidden: false, // Se l'achievement è nascosto finché non sbloccato
    //     conditions: [ // Condizioni per sbloccare (array, tutte devono essere vere)
    //         { type: "flag_check", flagName: "game_started", value: true },
    //         { type: "scene_visited", sceneId: "scene_01_start" }
    //     ],
    //     rewards: [ // Ricompense opzionali per lo sblocco (rare per gli achievement)
    //         // { type: "unlock_cosmetic", cosmeticId: "hat_of_achievement" }
    //     ]
    // },
    "ach_first_step": {
        id: "ach_first_step",
        nameKey: "ach_first_step_name", // Già in locales.js
        descriptionKey: "ach_first_step_desc", // Già in locales.js
        icon: "assets/images/ui/achievements/placeholder_ach_first_step.png", // Placeholder
        points: 5,
        hidden: false,
        conditions: [
            { type: "flag_check", flagName: "game_started_properly", value: true } // Un flag che viene settato dopo la prima scena
        ]
    },
    "ach_chapter_01_completed": {
        id: "ach_chapter_01_completed",
        nameKey: "ach_chapter_01_completed_name", // "Chapter 1 Complete" / "Capitolo 1 Completato"
        descriptionKey: "ach_chapter_01_completed_desc", // "You have successfully completed the first chapter." / "Hai completato con successo il primo capitolo."
        icon: "assets/images/ui/achievements/placeholder_ach_chapter_01.png", // Placeholder
        points: 20,
        hidden: false,
        conditions: [
            { type: "chapter_completed", chapterId: "chapter_01_awakening" }
        ]
    },
    "ach_collector_gears": {
        id: "ach_collector_gears",
        nameKey: "ach_collector_gears_name", // "Gear Collector" / "Collezionista di Ingranaggi"
        descriptionKey: "ach_collector_gears_desc", // "You collected 5 rusty gears." / "Hai raccolto 5 ingranaggi arrugginiti."
        icon: "assets/images/ui/achievements/placeholder_ach_gears.png", // Placeholder
        points: 10,
        hidden: true, // Potrebbe essere nascosto
        conditions: [
            { type: "item_check", itemId: "rusty_gear", quantity: 5, operator: ">=" }
        ]
    }
    // Aggiungere altri achievement qui
};

// Per l'uso in vanilla JS, gameAchievements sarà globale.
// window.gameAchievementsData = gameAchievements; // Opzionale

// Localizzazione per gli esempi sopra (se non già in locales.js):
// en: {
//   ach_chapter_01_completed_name: "Chapter 1 Complete",
//   ach_chapter_01_completed_desc: "You have successfully completed the first chapter.",
//   ach_collector_gears_name: "Gear Collector",
//   ach_collector_gears_desc: "You collected 5 rusty gears."
// },
// it: {
//   ach_chapter_01_completed_name: "Capitolo 1 Completato",
//   ach_chapter_01_completed_desc: "Hai completato con successo il primo capitolo.",
//   ach_collector_gears_name: "Collezionista di Ingranaggi",
//   ach_collector_gears_desc: "Hai raccolto 5 ingranaggi arrugginiti."
// }
