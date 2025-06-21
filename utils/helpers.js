// utils/helpers.js

/**
 * @fileoverview
 * Funzioni di utilità generiche come manipolazione DOM, generazione di numeri casuali,
 * formattazione di stringhe, ecc.
 */

/**
 * Seleziona un elemento DOM tramite il suo ID.
 * @param {string} id - L'ID dell'elemento da selezionare.
 * @returns {HTMLElement|null} L'elemento HTML o null se non trovato.
 * @example const myDiv = getElement('myDivId');
 */
function getElement(id) {
    return document.getElementById(id);
}

/**
 * Seleziona il primo elemento DOM che corrisponde a un selettore CSS.
 * @param {string} selector - Il selettore CSS.
 * @returns {HTMLElement|null} L'elemento HTML o null se non trovato.
 * @example const firstButton = querySelector('.my-button');
 */
function querySelector(selector) {
    return document.querySelector(selector);
}

/**
 * Seleziona tutti gli elementi DOM che corrispondono a un selettore CSS.
 * @param {string} selector - Il selettore CSS.
 * @returns {NodeListOf<HTMLElement>} Una NodeList degli elementi HTML trovati.
 * @example const allSections = querySelectorAll('section.collapsible');
 */
function querySelectorAll(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Crea un nuovo elemento DOM con tag, classi e attributi opzionali.
 * @param {string} tagName - Il tag HTML dell'elemento da creare (es. 'div', 'button').
 * @param {string|string[]} [classNames] - Una stringa o un array di stringhe per le classi CSS.
 * @param {Object<string, string>} [attributes] - Un oggetto con coppie chiave-valore per gli attributi.
 * @param {string} [textContent] - Testo da inserire nell'elemento.
 * @returns {HTMLElement} L'elemento HTML creato.
 * @example
 * const myButton = createElement('button', 'btn btn-primary', { type: 'button', 'data-id': 'submit' }, 'Click Me');
 * const myDiv = createElement('div', ['container', 'main-content']);
 */
function createElement(tagName, classNames = [], attributes = {}, textContent = '') {
    const element = document.createElement(tagName);
    if (classNames) {
        if (typeof classNames === 'string') {
            element.classList.add(classNames);
        } else if (Array.isArray(classNames)) {
            classNames.forEach(className => className && element.classList.add(className));
        }
    }
    for (const attr in attributes) {
        if (Object.hasOwnProperty.call(attributes, attr)) {
            element.setAttribute(attr, attributes[attr]);
        }
    }
    if (textContent) {
        element.textContent = textContent;
    }
    return element;
}


/**
 * Genera un numero intero casuale compreso tra min (incluso) e max (incluso).
 * @param {number} min - Il valore minimo.
 * @param {number} max - Il valore massimo.
 * @returns {number} Un numero intero casuale nell'intervallo specificato.
 * @example const diceRoll = getRandomInt(1, 6);
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Formatta un testo sostituendo placeholder come {key} con valori da un oggetto.
 * @param {string} templateString - La stringa template (es. "Benvenuto, {playerName}!").
 * @param {Object<string, string|number>} values - Un oggetto con i valori da sostituire (es. { playerName: "Mario" }).
 * @returns {string} La stringa formattata.
 * @example formatText("Punteggio: {score}", { score: 100 });
 */
function formatText(templateString, values) {
    if (!templateString) return "";
    let formattedString = templateString;
    for (const key in values) {
        if (Object.hasOwnProperty.call(values, key)) {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            formattedString = formattedString.replace(regex, String(values[key]));
        }
    }
    return formattedString;
}

/**
 * Mescola un array sul posto utilizzando l'algoritmo di Fisher-Yates.
 * @param {Array<any>} array - L'array da mescolare.
 * @returns {Array<any>} L'array mescolato (stesso riferimento).
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Funzione "debounce" per limitare la frequenza di esecuzione di una funzione.
 * Utile per eventi come resize della finestra o input utente.
 * @param {Function} func - La funzione da eseguire dopo il debounce.
 * @param {number} delay - Il ritardo in millisecondi.
 * @returns {Function} Una nuova funzione che può essere chiamata e che eseguirà `func` dopo `delay` ms dall'ultima chiamata.
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

/**
 * Converte una stringa in kebab-case.
 * Esempio: "helloWorld" -> "hello-world", "Hello World" -> "hello-world"
 * @param {string} str La stringa da convertire.
 * @returns {string} La stringa in kebab-case.
 */
function toKebabCase(str) {
    if (!str) return '';
    return str
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        .map(x => x.toLowerCase())
        .join('-');
}


// Esposizione globale per l'uso in vanilla JS (se necessario, altrimenti usare moduli)
// window.gameHelpers = {
//     getElement,
//     querySelector,
//     querySelectorAll,
//     createElement,
//     getRandomInt,
//     formatText,
//     shuffleArray,
//     debounce,
//     toKebabCase
// };
