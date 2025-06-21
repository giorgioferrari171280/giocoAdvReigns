// data/items.js

/**
 * @fileoverview
 * Descrizione degli oggetti collezionabili nel gioco.
 * Include nome, descrizione, immagine, proprietà.
 */

/**
 * @typedef {Object} Item
 * @property {string} id - Identificatore univoco dell'oggetto.
 * @property {string} nameKey - Chiave per il nome localizzato dell'oggetto (in locales.js).
 * @property {string} descriptionKey - Chiave per la descrizione localizzata dell'oggetto.
 * @property {string} icon - Percorso dell'immagine/icona dell'oggetto (es. `assets/images/items/nome_oggetto.png`).
 * @property {string} [type] - Tipo di oggetto (es. 'consumable', 'key_item', 'weapon', 'armor', 'collectible').
 * @property {boolean} [stackable=false] - Se l'oggetto può essere accumulato (es. pozioni).
 * @property {number} [maxStack=1] - Numero massimo se stackable.
 * @property {Object} [properties] - Proprietà specifiche dell'oggetto (es. { "damage": 10 } per un'arma).
 * @property {Array<Object>} [onUseEffects] - Effetti quando l'oggetto viene "usato" (se applicabile, raro per questo tipo di gioco).
 * @property {boolean} [questItem=false] - Indica se è un oggetto di missione che non può essere scartato/venduto.
 */

/**
 * Oggetto contenente le definizioni di tutti gli oggetti del gioco, indicizzati per ID.
 *
 * @type {Object<string, Item>}
 */
const gameItems = {
    // Esempio di struttura di un oggetto:
    // "key_silver": {
    //     id: "key_silver",
    //     nameKey: "item_key_silver_name",
    //     descriptionKey: "item_key_silver_description",
    //     icon: "assets/images/items/key_silver.png",
    //     type: "key_item", // Oggetto chiave
    //     stackable: false,
    //     questItem: true,
    //     properties: {
    //         unlocks: "prison_door_01" // Esempio di proprietà custom
    //     }
    // },
    // "health_potion_small": {
    //     id: "health_potion_small",
    //     nameKey: "item_health_potion_small_name",
    //     descriptionKey: "item_health_potion_small_description",
    //     icon: "assets/images/items/health_potion_small.png",
    //     type: "consumable",
    //     stackable: true,
    //     maxStack: 5,
    //     onUseEffects: [ // In questo gioco, l'uso potrebbe essere implicito o tramite scelte
    //         { type: "stat_change", playerStat: true, stat: "health", value: 20 }
    //     ]
    // },
    "rusty_gear": {
        id: "rusty_gear",
        nameKey: "item_rusty_gear_name", // Da aggiungere in locales.js: "Rusty Gear" / "Ingranaggio Arrugginito"
        descriptionKey: "item_rusty_gear_description", // "An old, rusty gear. It might be useful for something." / "Un vecchio ingranaggio arrugginito. Potrebbe servire a qualcosa."
        icon: "assets/images/items/placeholder_item_gear.png", // Placeholder
        type: "collectible", // O "component" se usato per crafting/riparazioni
        stackable: true,
        maxStack: 10, // Esempio
        questItem: false
    },
    "tesserino_riconoscimento": {
        id: "tesserino_riconoscimento",
        nameKey: "item_id_card_name", // "ID Card" / "Tesserino di Riconoscimento"
        descriptionKey: "item_id_card_desc", // "A standard issue identification card. Seems to grant access to some areas." / "Un tesserino di riconoscimento standard. Sembra garantire l'accesso ad alcune aree."
        icon: "assets/images/items/placeholder_item_id_card.png",
        type: "key_item",
        questItem: true
    },
    "pistola_laser": {
        id: "pistola_laser",
        nameKey: "item_laser_pistol_name", // "Laser Pistol" / "Pistola Laser"
        descriptionKey: "item_laser_pistol_desc", // "A compact energy weapon. Handle with care." / "Un'arma ad energia compatta. Maneggiare con cura."
        icon: "assets/images/items/placeholder_item_laser_pistol.png",
        type: "weapon", // Anche se non c'è combattimento, può sbloccare opzioni
        properties: {
            can_disintegrate_robots: true // Proprietà custom per logica di gioco
        }
    },
    "opuscolo_setta_atomo": {
        id: "opuscolo_setta_atomo",
        nameKey: "item_cult_pamphlet_name", // "Cult Pamphlet" / "Opuscolo della Setta"
        descriptionKey: "item_cult_pamphlet_desc", // "A strange pamphlet talking about the 'Children of the Atom' and their beliefs." / "Uno strano opuscolo che parla dei 'Figli dell'Atomo' e delle loro credenze."
        icon: "assets/images/items/placeholder_item_pamphlet.png",
        type: "collectible", // Potrebbe sbloccare dialoghi o lore
        questItem: false
    }
    // Aggiungere altri oggetti qui
};

// Per l'uso in vanilla JS, gameItems sarà globale.
// window.gameItemsData = gameItems; // Opzionale
//
// Localizzazione per gli esempi sopra:
// en: {
//   item_rusty_gear_name: "Rusty Gear",
//   item_rusty_gear_description: "An old, rusty gear. It might be useful for something.",
//   item_id_card_name: "ID Card",
//   item_id_card_desc: "A standard issue identification card. Seems to grant access to some areas.",
//   item_laser_pistol_name: "Laser Pistol",
//   item_laser_pistol_desc: "A compact energy weapon. Handle with care.",
//   item_cult_pamphlet_name: "Cult Pamphlet",
//   item_cult_pamphlet_desc: "A strange pamphlet talking about the 'Children of the Atom' and their beliefs."
// },
// it: {
//   item_rusty_gear_name: "Ingranaggio Arrugginito",
//   item_rusty_gear_description: "Un vecchio ingranaggio arrugginito. Potrebbe servire a qualcosa.",
//   item_id_card_name: "Tesserino di Riconoscimento",
//   item_id_card_desc: "Un tesserino di riconoscimento standard. Sembra garantire l'accesso ad alcune aree.",
//   item_laser_pistol_name: "Pistola Laser",
//   item_laser_pistol_desc: "Un'arma ad energia compatta. Maneggiare con cura.",
//   item_cult_pamphlet_name: "Opuscolo della Setta",
//   item_cult_pamphlet_desc: "Uno strano opuscolo che parla dei 'Figli dell'Atomo' e delle loro credenze."
// }
