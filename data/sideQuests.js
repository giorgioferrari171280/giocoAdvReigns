// data/sideQuests.js

/**
 * @fileoverview
 * Definizioni delle missioni secondarie (side quests).
 * Strutturate in modo simile alle scene principali ma con indicatori di rientro nella trama.
 */

/**
 * @typedef {import('../config/gameConfig.js').SideQuestConfig} SideQuestConfig
 * @typedef {import('./scenes.js').gameScenes} gameScenes // Per referenziare le scene della side quest
 */

/**
 * Oggetto contenente le configurazioni di tutte le missioni secondarie, indicizzate per ID.
 * La struttura di ogni oggetto SideQuestConfig è definita in gameConfig.js.
 * Le scene specifiche per le side quest dovrebbero essere definite in `data/scenes.js`
 * e i loro ID referenziati qui.
 *
 * @type {Object<string, SideQuestConfig>}
 */
const gameSideQuests = {
    // Esempio di struttura di una side quest:
    // "sq_lost_kitten": {
    //     id: "sq_lost_kitten",
    //     titleKey: "side_quest_lost_kitten_title", // Chiave per il titolo localizzato
    //     descriptionKey: "side_quest_lost_kitten_desc", // Descrizione breve della quest
    //     startingSceneId: "scene_village_notice_board", // ID della scena principale da cui si può avviare questa quest (tramite una scelta)
    //     startingChoiceTextKey: "side_quest_lost_kitten_accept_choice", // Testo della scelta che avvia la quest
    //
    //     // Le scene della side quest sono normali scene definite in data/scenes.js
    //     // ma raggruppate qui per definire la quest.
    //     sceneSequence: [ // Sequenza di ID di scene che compongono la quest
    //         "sq_lost_kitten_scene_01_start",
    //         "sq_lost_kitten_scene_02_follow_tracks",
    //         "sq_lost_kitten_scene_03_found_kitten"
    //     ],
    //
    //     // Come la quest si collega di nuovo alla storia principale
    //     returnPoint: {
    //         // Dopo aver completato l'ultima scena in `sceneSequence`,
    //         // il gioco passerà a `returnSceneIdIfCompleted` se la quest è "completata con successo".
    //         // Altrimenti, potrebbe passare a `returnSceneIdIfFailed` o una generica.
    //         // La logica di "completamento" dipende dai flag settati durante le scene della quest.
    //         flagForCompletion: "sq_lost_kitten_completed_successfully",
    //         returnSceneIdIfCompleted: "scene_village_notice_board_after_kitten", // Scena di ritorno se completata
    //         returnSceneIdIfFailed: "scene_village_notice_board_after_kitten_fail", // Scena di ritorno se fallita (opzionale)
    //         returnSceneIdDefault: "scene_village_notice_board" // Ritorno generico se non specificato
    //     },
    //
    //     rewardsOnCompletion: [ // Ricompense se `flagForCompletion` è true
    //         { type: "item_add", itemId: "cat_food", quantity: 3 },
    //         { type: "stat_change", playerStat: true, stat: "reputation_village", value: 5 },
    //         { type: "money_add", amount: 50 }
    //     ],
    //
    //     isRepeatable: false, // La quest può essere fatta una sola volta?
    //     availabilityConditions: [ // Condizioni per cui la scelta di avviare la quest appare
    //         { type: "chapter_check", chapterId: "chapter_02", status: "started" },
    //         { type: "flag_check", flagName: "sq_lost_kitten_already_done", value: false }
    //     ]
    // },
    "sq_example_fetch": {
        id: "sq_example_fetch",
        titleKey: "sq_example_fetch_title", // "The Missing Artifact" / "L'Artefatto Mancante"
        descriptionKey: "sq_example_fetch_desc", // "Someone in the village lost a precious artifact. Can you find it?"
        startingSceneId: "scene_main_hub_01", // ID di una scena principale dove la quest può essere offerta
        startingChoiceTextKey: "sq_example_fetch_accept_choice", // "Accetta di cercare l'artefatto"

        sceneSequence: [
            "sq_fetch_01_talk_to_npc", // Definite in data/scenes.js
            "sq_fetch_02_search_area",
            "sq_fetch_03_find_artifact"
        ],

        returnPoint: {
            flagForCompletion: "sq_fetch_artifact_found",
            returnSceneIdIfCompleted: "scene_main_hub_01_quest_done", // Una versione della scena hub con dialogo di completamento
            returnSceneIdDefault: "scene_main_hub_01" // Ritorna allo hub se la quest non è finita o abbandonata
        },

        rewardsOnCompletion: [
            { type: "money_add", amount: 100 },
            { type: "item_add", itemId: "ancient_coin", quantity: 1 }
        ],
        isRepeatable: false,
        availabilityConditions: [
            { type: "flag_check", flagName: "met_quest_giver_npc", value: true },
            { type: "flag_check", flagName: "sq_example_fetch_completed", value: false }
        ]
    }
    // Aggiungere altre side quest qui
};

// Per l'uso in vanilla JS, gameSideQuests sarà globale.
// window.gameSideQuestsData = gameSideQuests; // Opzionale

// Le scene per le side quest (es. "sq_fetch_01_talk_to_npc") devono essere definite in data/scenes.js
// Esempio per data/scenes.js:
// "sq_fetch_01_talk_to_npc": {
//     id: "sq_fetch_01_talk_to_npc",
//     backgroundImage: "assets/images/locations/village_npc_house.jpg",
//     narrativeTextKey: "sq_fetch_01_dialogue",
//     choices: [
//         { choiceTextKey: "sq_fetch_01_choice_agree", targetSceneId: "sq_fetch_02_search_area" },
//         { choiceTextKey: "sq_fetch_01_choice_ask_more", targetSceneId: "sq_fetch_01_talk_to_npc_more_info" }
//     ]
// },
// "sq_fetch_03_find_artifact": {
//     id: "sq_fetch_03_find_artifact",
//     backgroundImage: "assets/images/locations/ruins_hidden_spot.jpg",
//     narrativeTextKey: "sq_fetch_03_found_text",
//     choices: [
//         {
//             choiceTextKey: "sq_fetch_03_choice_take_artifact",
//             targetSceneId: gameSideQuests.sq_example_fetch.returnPoint.returnSceneIdIfCompleted, // Torna alla scena principale post-completamento
//             effects: [
//                 { type: "item_add", itemId: "lost_artifact_item" }, // Oggetto della quest
//                 { type: "flag_set", flagName: "sq_fetch_artifact_found", value: true },
//                 { type: "flag_set", flagName: "sq_example_fetch_completed", value: true }
//             ]
//         }
//     ]
// }

// Localizzazione per gli esempi:
// en: {
//   sq_example_fetch_title: "The Missing Artifact",
//   sq_example_fetch_desc: "Someone in the village lost a precious artifact. Can you find it?",
//   sq_example_fetch_accept_choice: "Agree to search for the artifact",
//   // ... testi per le scene della side quest
// },
// it: {
//   sq_example_fetch_title: "L'Artefatto Mancante",
//   sq_example_fetch_desc: "Qualcuno nel villaggio ha perso un artefatto prezioso. Riesci a trovarlo?",
//   sq_example_fetch_accept_choice: "Accetta di cercare l'artefatto",
//   // ...
// }
