// data/scenes.js

/**
 * @fileoverview
 * Specifiche di ogni singola schermata statica (scena) del gioco.
 * Include immagine, testo narrativo, opzioni di scelta, effetti su statistiche/inventario.
 */

/**
 * @typedef {import('../config/gameConfig.js').SceneConfig} SceneConfig
 */

/**
 * Oggetto contenente le configurazioni di tutte le scene del gioco, indicizzate per ID.
 * La struttura di ogni oggetto SceneConfig è definita in gameConfig.js.
 *
 * @type {Object<string, SceneConfig>}
 */
const gameScenes = {
    // Esempio di struttura di una scena:
    // "unique_scene_id": {
    //     id: "unique_scene_id",
    //     backgroundImage: "assets/images/locations/nome_location.jpg",
    //     narrativeTextKey: "scene_unique_id_text", // Chiave per il testo localizzato
    //     musicTrack: "music_ambient_theme.mp3", // Traccia musicale opzionale per questa scena
    //     choices: [
    //         {
    //             id: "choice_unique_001" // ID univoco per la scelta, se non fornito, generato da choiceTextKey
    //             choiceTextKey: "scene_unique_id_choice_1_text", // Chiave per il testo della scelta
    //             targetSceneId: "next_scene_id_option_1", // ID della scena a cui porta questa scelta
    //             effects: [ // Effetti di questa scelta (opzionale)
    //                 { type: "stat_change", playerStat: true, stat: "karma", value: 1 }, // playerStat default a true
    //                 { type: "item_add", itemId: "key_silver" }, // quantity default a 1
    //                 { type: "flag_set", flagName: "door_unlocked", value: true }
    //             ],
    //             conditions: [ // Condizioni per mostrare questa scelta (opzionale)
    //                 { type: "stat_check", stat: "strength", operator: ">=", value: 5 },
    //                 { type: "item_check", itemId: "rope", present: true }, // quantity default a 1
    //                 { type: "flag_check", flagName: "npc_met", value: true }
    //             ],
    //             tooltipTextKey: "scene_unique_id_choice_1_tooltip" // Testo di tooltip opzionale
    //         },
    //         // ... altre scelte
    //     ],
    //     onEnterEffects: [ // Effetti automatici all'entrata nella scena (opzionale)
    //         { type: "world_stat_change", stat: "alarmLevel", value: 1 }, // playerStat: false per worldState
    //         { type: "sfx_play", soundId: "sfx_door_creak" }
    //     ],
    //     onExitEffects: [], // Effetti automatici all'uscita dalla scena (opzionale, più rari)
    //     isPlayerControllable: true, // Se false, la scena potrebbe essere una transizione automatica o una cutscene testuale
    //                               // Se false e choices è vuoto, si passa a nextSceneDefault dopo onEnterEffects.
    //     nextSceneDefault: "fallback_scene_id", // Scena di default se nessuna scelta è valida o disponibile, o per scene non controllabili
    //     autoProceedDelay: 5000 // Se isPlayerControllable è false e c'è un delay, passa a nextSceneDefault dopo tot ms.
    // },
    "scene_01_start": {
        id: "scene_01_start",
        backgroundImage: "assets/images/locations/placeholder_location_01.jpg",
        narrativeTextKey: "scene_01_start_text", // "Ti svegli in un luogo strano..."
        musicTrack: "music_ambient_mysterious", // Placeholder per musica d'ambiente
        choices: [
            {
                id: "s1_choice1",
                choiceTextKey: "scene_01_choice_01", // "Guardati intorno."
                targetSceneId: "scene_02_explore",
                effects: [
                    { type: "flag_set", flagName: "looked_around_initial", value: true },
                    { type: "stat_change", stat: "sanity", value: -1 } // Esempio stat del giocatore
                ]
            },
            {
                id: "s1_choice2",
                choiceTextKey: "scene_01_choice_02", // "Urla per chiedere aiuto."
                targetSceneId: "scene_01_screamed",
                effects: [
                    { type: "stat_change", stat: "sanity", value: -5 },
                    { type: "world_stat_change", playerStat: false, stat: "suspicionLevel", value: 1}
                ]
            }
        ],
        onEnterEffects: [
            { type: "sfx_play", soundId: "sfx_ambient_cave_drip" }, // Placeholder
            { type: "flag_set", flagName: "game_started_properly", value: true } // Per achievement "First Step"
        ]
    },
    "scene_01_screamed": {
        id: "scene_01_screamed",
        backgroundImage: "assets/images/locations/placeholder_location_01_dim.jpg", // Leggermente diversa
        narrativeTextKey: "scene_01_screamed_text", // "Il tuo urlo riecheggia..."
        choices: [
            {
                id: "s1s_choice1",
                choiceTextKey: "scene_01_choice_01_after_scream", // "Guardati intorno (con cautela ora)."
                targetSceneId: "scene_02_explore",
                effects: [{ type: "flag_set", flagName: "looked_around_cautiously", value: true }]
            }
        ]
    },
    "scene_02_explore": {
        id: "scene_02_explore",
        backgroundImage: "assets/images/locations/placeholder_location_02.jpg",
        narrativeTextKey: "scene_02_explore_text", // "Trovi una leva arrugginita e una porta chiusa."
        choices: [
            {
                id: "s2_choice_lever",
                choiceTextKey: "scene_02_choice_pull_lever", // "Tira la leva arrugginita."
                targetSceneId: "scene_03_lever_pulled", // Scena successiva placeholder
                effects: [
                    { type: "item_add", itemId: "rusty_gear", quantity: 1 },
                    { type: "flag_set", flagName: "lever_pulled", value: true },
                    { type: "sfx_play", soundId: "sfx_lever_pull" }
                ]
            },
            {
                id: "s2_choice_door",
                choiceTextKey: "scene_02_choice_inspect_door", // "Ispeziona la porta chiusa."
                targetSceneId: "scene_03_door_inspected", // Scena successiva placeholder
                conditions: [
                    // Esempio: { type: "item_check", itemId: "key_01", present: true }
                ]
            }
        ]
    },
    "scene_03_lever_pulled": { // Placeholder per continuare il flusso
        id: "scene_03_lever_pulled",
        backgroundImage: "assets/images/locations/placeholder_location_03a.jpg",
        narrativeTextKey: "scene_03_lever_pulled_text", // "La leva scatta con un rumore metallico. Qualcosa sembra essere cambiato."
        nextSceneDefault: "scene_04_exit" // Esempio di scena che avanza automaticamente o con "Continua"
    },
    "scene_03_door_inspected": { // Placeholder
        id: "scene_03_door_inspected",
        backgroundImage: "assets/images/locations/placeholder_location_03b.jpg",
        narrativeTextKey: "scene_03_door_inspected_text", // "La porta è massiccia e non ha maniglie visibili. Sembra richiedere una chiave."
        nextSceneDefault: "scene_04_exit"
    },
    "scene_04_exit": { // Placeholder
        id: "scene_04_exit",
        backgroundImage: "assets/images/locations/placeholder_location_04_exit.jpg",
        narrativeTextKey: "scene_04_exit_text", // "Vedi un'uscita in lontananza."
        choices: [
            { choiceTextKey: "ui_continue_button", targetSceneId: "scene_END_OF_DEMO" } // Esempio di fine demo
        ]
    },
    "scene_END_OF_DEMO": {
        id: "scene_END_OF_DEMO",
        isPlayerControllable: false, // Non ci sono scelte, è una scena finale (per ora)
        backgroundImage: "assets/images/ui/placeholder_thankyou.png",
        narrativeTextKey: "scene_end_of_demo_text", // "Grazie per aver giocato alla demo!"
        onEnterEffects: [{type: "music_change", trackId: "music_credits_theme"}], // Esempio
        // Potrebbe triggerare un finale specifico o tornare al menu principale
        // nextSceneDefault: "trigger_ending_demo_complete" // Un ID che triggerEnding() può interpretare
        // Oppure, dopo un delay, torna al menu:
        autoProceedDelay: 7000, // 7 secondi
        nextSceneDefault: "action_show_main_menu" // Un ID speciale che script.js interpreta per mostrare il menu
    }
};

// Per l'uso in vanilla JS, gameScenes sarà globale.
//
// Nota sulla struttura degli effetti e condizioni:
// effects: [
//   { type: "stat_change", playerStat: true, stat: "karma", value: 1 }, // Modifica una statistica del giocatore
//   { type: "stat_change", playerStat: false, stat: "world_alarm", value: 1 }, // Modifica una statistica del mondo
//   { type: "item_add", itemId: "key_01", quantity: 1 },
//   { type: "item_remove", itemId: "food_ration", quantity: 1 },
//   { type: "flag_set", flagName: "npc_met_king", value: true },
//   { type: "sfx_play", soundId: "sfx_item_pickup" },
//   { type: "music_change", trackId: "music_tense_moment" },
//   { type: "variable_set", varName: "playerName", value: "input_value" }, // Per input utente
//   { type: "chapter_progress", chapterId: "chapter_02" }, // Avanza al capitolo
//   { type: "trigger_ending", endingId: "bad_ending_early" } // Termina il gioco
// ]
// conditions: [
//   { type: "stat_check", playerStat: true, stat: "strength", operator: ">=", value: 10 },
//   { type: "item_check", itemId: "rope", present: true, quantity: 1 }, // 'present: false' per verificare assenza
//   { type: "flag_check", flagName: "has_spoken_to_guard", value: true }, // 'value: false' per verificare non settato
//   { type: "money_check", amount: 100, operator: ">="},
//   { type: "random_chance", percentage: 50} // 50% di probabilità che la scelta sia disponibile
// ]
