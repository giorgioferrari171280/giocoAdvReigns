// data/endings.js

/**
 * @fileoverview
 * Definizioni dei finali possibili del gioco.
 * Include condizioni, cutscene e testi associati.
 */

/**
 * @typedef {import('../config/gameConfig.js').EndingConfig} EndingConfig
 */

/**
 * Oggetto contenente le configurazioni di tutti i finali del gioco, indicizzati per ID.
 * La struttura di ogni oggetto EndingConfig è definita in gameConfig.js.
 *
 * @type {Object<string, EndingConfig>}
 */
const gameEndings = {
    // Esempio di struttura di un finale:
    // "ending_good_karma_high_peace": {
    //     id: "ending_good_karma_high_peace",
    //     titleKey: "ending_good_karma_title", // Chiave per il titolo localizzato
    //     descriptionKey: "ending_good_karma_desc", // Chiave per una breve descrizione (opzionale, per riepiloghi)
    //     cutsceneSequenceIds: [ // Sequenza di ID di cutscene per questo finale
    //         "cutscene_final_good_01",
    //         "cutscene_final_good_02",
    //         "cutscene_final_credits_roll" // Potrebbe essere una cutscene generica per i crediti
    //     ],
    //     conditions: [ // Array di condizioni, tutte devono essere vere (AND logico)
    //                   // O un oggetto con una logica più complessa se necessario (es. OR)
    //         { type: "player_stat_check", stat: "karma", operator: ">=", value: 10 },
    //         { type: "world_stat_check", stat: "peace", operator: ">=", value: 5 },
    //         { type: "flag_check", flagName: "main_villain_defeated", value: true }
    //     ],
    //     priority: 1, // Priorità per determinare quale finale scegliere se più condizioni sono soddisfatte (più basso = più prioritario)
    //     unlocksAchievementId: "ach_true_ending" // Achievement sbloccato da questo finale (opzionale)
    // },
    "ending_default_neutral": {
        id: "ending_default_neutral",
        titleKey: "ending_neutral_title", // "A Neutral End" / "Un Finale Neutro"
        descriptionKey: "ending_neutral_desc", // "The world continues, changed by your actions, but the future remains uncertain." / "Il mondo continua, cambiato dalle tue azioni, ma il futuro resta incerto."
        cutsceneSequenceIds: ["cutscene_ending_neutral_01", "cutscene_ending_neutral_02"], // Placeholder IDs
        conditions: [], // Nessuna condizione specifica, è il fallback
        priority: 100, // Priorità bassa, usato se nessun altro finale è valido
        unlocksAchievementId: null
    },
    "ending_pirate_king": {
        id: "ending_pirate_king",
        titleKey: "ending_pirate_king_title", // "The Pirate King" / "Il Re dei Pirati"
        descriptionKey: "ending_pirate_king_desc", // "You united the pirate clans and now rule the seas!" / "Hai unito i clan pirata e ora domini i mari!"
        cutsceneSequenceIds: ["cutscene_ending_pirate_01", "cutscene_ending_pirate_02", "cutscene_ending_pirate_03"],
        conditions: [
            { type: "player_stat_check", stat: "player_stat_reputation_pirate", operator: ">=", value: 15 },
            { type: "player_stat_check", stat: "player_stat_reputation_crown", operator: "<", value: 5 },
            { type: "flag_check", flagName: "defeated_naval_commander", value: true } // Esempio di flag
        ],
        priority: 10,
        unlocksAchievementId: "ach_pirate_legend" // Placeholder
    },
    "ending_loyal_servant": {
        id: "ending_loyal_servant",
        titleKey: "ending_loyal_servant_title", // "Loyal Servant of the Crown" / "Leale Servitore della Corona"
        descriptionKey: "ending_loyal_servant_desc", // "Your unwavering loyalty to the Crown has been rewarded with a high position." / "La tua incrollabile lealtà alla Corona è stata premiata con un'alta posizione."
        cutsceneSequenceIds: ["cutscene_ending_crown_01", "cutscene_ending_crown_02"],
        conditions: [
            { type: "player_stat_check", stat: "player_stat_reputation_crown", operator: ">=", value: 15 },
            { type: "player_stat_check", stat: "player_stat_reputation_pirate", operator: "<", value: 5 },
            { type: "flag_check", flagName: "exposed_pirate_conspiracy", value: true } // Esempio di flag
        ],
        priority: 10,
        unlocksAchievementId: "ach_crown_hero" // Placeholder
    }
    // Aggiungere altri finali qui
};

// Per l'uso in vanilla JS, gameEndings sarà globale.
// window.gameEndingsData = gameEndings; // Opzionale

// Localizzazione per gli esempi sopra:
// en: {
//   ending_neutral_title: "A Neutral End",
//   ending_neutral_desc: "The world continues, changed by your actions, but the future remains uncertain.",
//   ending_pirate_king_title: "The Pirate King",
//   ending_pirate_king_desc: "You united the pirate clans and now rule the seas!",
//   ending_loyal_servant_title: "Loyal Servant of the Crown",
//   ending_loyal_servant_desc: "Your unwavering loyalty to the Crown has been rewarded with a high position."
// },
// it: {
//   ending_neutral_title: "Un Finale Neutro",
//   ending_neutral_desc: "Il mondo continua, cambiato dalle tue azioni, ma il futuro resta incerto.",
//   ending_pirate_king_title: "Il Re dei Pirati",
//   ending_pirate_king_desc: "Hai unito i clan pirata e ora domini i mari!",
//   ending_loyal_servant_title: "Leale Servitore della Corona",
//   ending_loyal_servant_desc: "La tua incrollabile lealtà alla Corona è stata premiata con un'alta posizione."
// }
