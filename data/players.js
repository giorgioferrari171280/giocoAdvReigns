// data/players.js

/**
 * @fileoverview
 * Struttura dei dati dei giocatori per la Hall of Fame.
 * Contiene informazioni sui giocatori che hanno completato il gioco.
 */

/**
 * @typedef {Object} PlayerHallOfFameEntry
 * @property {string} playerName - Nome del giocatore (o del salvataggio).
 * @property {string} endingId - ID del finale raggiunto.
 * @property {string} dateCompleted - Data di completamento (es. "YYYY-MM-DD HH:MM").
 * @property {number} achievementsUnlocked - Numero di achievement sbloccati.
 * @property {string[]} unlockedAchievementIds - Array degli ID degli achievement sbloccati.
 * @property {number} score - Punteggio totale (potrebbe essere basato sugli achievement o altro).
 * @property {string} [saveSlotId] - ID dello slot di salvataggio da cui è stato generato questo record.
 */

/**
 * Array che memorizza i dati dei giocatori per la Hall of Fame.
 * Questo array verrà gestito (letto e scritto) tramite storageManager.js (es. localStorage).
 * Qui viene solo definita la struttura attesa per un elemento.
 *
 * @type {Array<PlayerHallOfFameEntry>}
 */
const hallOfFameData = [
    // Esempio di entry (questo array sarà vuoto all'inizio e popolato dal gioco):
    // {
    //     playerName: "Legendary Hero",
    //     endingId: "ending_pirate_king",
    //     dateCompleted: "2024-07-28 10:30",
    //     achievementsUnlocked: 15,
    //     unlockedAchievementIds: ["ach_first_step", "ach_chapter_01_completed", "ach_pirate_legend", ...],
    //     score: 150, // Ad esempio, 10 punti per achievement
    //     saveSlotId: "slot_1"
    // },
    // {
    //     playerName: "Sir Reginald",
    //     endingId: "ending_loyal_servant",
    //     dateCompleted: "2024-07-27 15:00",
    //     achievementsUnlocked: 12,
    //     unlockedAchievementIds: ["ach_first_step", "ach_chapter_01_completed", "ach_crown_hero", ...],
    //     score: 120,
    //     saveSlotId: "slot_2"
    // }
];

// Questa variabile di solito non è resa globale direttamente,
// ma gestita da storageManager o da una parte dello stato del gioco.
// Per ora, la sua esistenza documenta la struttura.
// Se si desidera inizializzare da localStorage all'avvio, si farà in script.js o storageManager.js.
