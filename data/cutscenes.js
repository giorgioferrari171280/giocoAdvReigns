// data/cutscenes.js

/**
 * @fileoverview
 * Definizioni per le cutscene del gioco.
 * Una cutscene è una sequenza di schermate (immagini + testo).
 */

/**
 * @typedef {Object} CutsceneScreen
 * @property {string} [imageId] - ID o percorso dell'immagine di sfondo per questa schermata della cutscene. (es. "assets/images/cutscenes/intro_01.jpg")
 * @property {string} [videoId] - ID o percorso del video per questa schermata (alternativa o sovrapposizione all'immagine). (es. "assets/videos/intro_loop.mp4")
 * @property {string} textKey - Chiave per il testo narrativo localizzato (in locales.js).
 * @property {string} [soundtrackId] - ID della traccia musicale da suonare durante questa schermata.
 * @property {Array<Object>} [sfx] - Effetti sonori da riprodurre (es. [{ soundId: "sfx_thunder", delay: 1000 }]).
 * @property {number} [duration] - Durata in millisecondi prima di passare automaticamente alla schermata successiva (se non c'è interazione).
 *                                 Se non presente, si attende un input del giocatore (es. pulsante "Avanti").
 */

/**
 * @typedef {Object} Cutscene
 * @property {string} id - Identificatore univoco della cutscene.
 * @property {CutsceneScreen[]} screens - Array di schermate che compongono la cutscene.
 * @property {string} [nextSceneAfterEnd] - ID della scena di gioco a cui passare dopo la fine della cutscene.
 * @property {string} [nextCutsceneIdAfterEnd] - ID della prossima cutscene da riprodurre in sequenza.
 *                                            (Usato se una cutscene è divisa in più parti logiche ma deve fluire).
 */

/**
 * Oggetto contenente le definizioni di tutte le cutscene del gioco, indicizzate per ID.
 *
 * @type {Object<string, Cutscene>}
 */
const gameCutscenes = {
    // Esempio di una cutscene introduttiva:
    "cutscene_intro_game": { // ID usato in gameConfig.js -> introCutsceneId
        id: "cutscene_intro_game",
        screens: [
            {
                imageId: "assets/images/cutscenes/placeholder_intro_01.jpg",
                textKey: "cutscene_intro_game_screen_01_text", // Definito in locales.js
                soundtrackId: "music_intro_theme", // Placeholder ID, da definire e precaricare
                sfx: [{ soundId: "sfx_wind_howling", delay: 500 }]
            },
            {
                imageId: "assets/images/cutscenes/placeholder_intro_02.jpg",
                textKey: "cutscene_intro_game_screen_02_text",
                // La musica continua dalla schermata precedente se non specificato diversamente
            },
            {
                // Esempio con video e testo sovrapposto (CSS gestirà il layout)
                videoId: "assets/videos/placeholder_title_reveal.mp4", // Video di rivelazione titolo
                textKey: "cutscene_intro_game_screen_03_text", // "Il suo destino è ancora da scrivere."
                duration: 4000 // Esempio: auto-avanza dopo 4 secondi
            }
        ],
        nextSceneAfterEnd: "scene_01_start" // Definito in gameConfig.js -> initialSceneId
    },
    // Esempio di cutscene di fine capitolo
    "cutscene_ch01_outro": {
        id: "cutscene_ch01_outro",
        screens: [
            {
                imageId: "assets/images/cutscenes/placeholder_ch01_end_01.jpg",
                textKey: "cutscene_ch01_end_screen_01_text",
                soundtrackId: "music_suspense_resolved" // Placeholder ID
            },
            {
                textKey: "cutscene_ch01_end_screen_02_text"
            }
        ],
        nextCutsceneIdAfterEnd: "cutscene_ch02_intro" // Esempio: passa a intro capitolo successivo
        // Oppure: nextSceneAfterEnd: "scene_ch02_start"
    },
    // Esempio di sequenza per un finale
    "ending_neutral_part1": {
        id: "ending_neutral_part1",
        screens: [{ imageId: "assets/images/cutscenes/placeholder_ending_neutral_a.jpg", textKey: "ending_neutral_scene1_text" }],
        nextCutsceneIdAfterEnd: "ending_neutral_part2"
    },
    "ending_neutral_part2": {
        id: "ending_neutral_part2",
        screens: [{ imageId: "assets/images/cutscenes/placeholder_ending_neutral_b.jpg", textKey: "ending_neutral_scene2_text" }],
        // Dopo questa, solitamente si va alla Hall of Fame o ai crediti finali
        // nextSceneAfterEnd: "action_show_hall_of_fame" // Azione speciale gestita da script.js
    }
    // Altre cutscene verranno aggiunte qui...
};

// Per l'uso in vanilla JS, gameCutscenes sarà globale.
// Le chiavi di testo (es. "cutscene_intro_game_screen_01_text") devono essere definite in config/locales.js
// Le risorse (immagini, video, audio) devono esistere nei percorsi specificati.
