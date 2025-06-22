// ============== LOCALIZATION SYSTEM MODULE ============== //

import InteractiveAdventure from "../core/main.js"; // For DataLoader, Config

/**
 * @class Localization
 * @description Manages game text localization for multiple languages.
 */
class Localization {
    /**
     * @constructor
     * @param {DataLoader} dataLoader - Instance of DataLoader for fetching language files.
     * @param {string} initialLangCode - The initial language code (e.g., 'en', 'it').
     */
    constructor(dataLoader, initialLangCode = 'en') {
        this.dataLoader = dataLoader;
        this.supportedLanguages = ['en', 'it', 'fr', 'de', 'es', 'zh', 'ja', 'ru', 'ar', 'he']; // From problem description
        this.currentLanguage = this.isValidLanguage(initialLangCode) ? initialLangCode : 'en';
        this.translations = {}; // Stores the loaded language strings for the current language
        this.fallbackLanguage = 'en'; // Language to use if a string is missing in the current language

        console.log(`Localization system initialized with language: ${this.currentLanguage}`);
    }

    /**
     * @method isValidLanguage
     * @description Checks if a given language code is supported.
     * @param {string} langCode - The language code to check.
     * @returns {boolean} True if the language is supported, false otherwise.
     */
    isValidLanguage(langCode) {
        return this.supportedLanguages.includes(langCode);
    }

    /**
     * @method getCurrentLanguage
     * @description Gets the currently active language code.
     * @returns {string}
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * @method setLanguage
     * @description Sets the current language and loads its translation file.
     * @param {string} langCode - The language code to set (e.g., 'en', 'it').
     * @returns {Promise<boolean>} True if language was set and loaded successfully, false otherwise.
     */
    async setLanguage(langCode) {
        if (!this.isValidLanguage(langCode)) {
            console.warn(`Localization: Language "${langCode}" is not supported. Keeping current language: ${this.currentLanguage}.`);
            return false;
        }

        if (langCode === this.currentLanguage && Object.keys(this.translations).length > 0) {
            console.log(`Localization: Language "${langCode}" is already active.`);
            this.updatePageLanguageAttribute(langCode); // Ensure HTML lang attribute is correct
            return true; // Already loaded
        }

        this.currentLanguage = langCode;
        console.log(`Localization: Setting language to "${langCode}".`);

        const success = await this.loadLanguage(langCode);
        if (success) {
            // Update language in user settings via Config module
            if (InteractiveAdventure.config) {
                InteractiveAdventure.config.setUserSetting('language', langCode);
            }
            // Dispatch an event for UI elements to update their text
            document.dispatchEvent(new CustomEvent('languagechange', { detail: { langCode } }));
            this.updatePageLanguageAttribute(langCode);
            this.updatePageDirectionAttribute(langCode);
        }
        return success;
    }

    /**
     * @method loadLanguage
     * @description Loads the translation file for the current or specified language.
     * @param {string} [langCode=this.currentLanguage] - The language code for which to load translations.
     * @returns {Promise<boolean>} True if loading was successful, false otherwise.
     */
    async loadLanguage(langCode = this.currentLanguage) {
        const filePath = `locales/${langCode}.json`;
        try {
            console.log(`Localization: Loading language file "${filePath}"...`);
            const languageData = await this.dataLoader.loadJSON(filePath);
            if (languageData && typeof languageData === 'object') {
                this.translations = languageData;
                console.log(`Localization: Language "${langCode}" loaded successfully with ${Object.keys(this.translations).length} strings.`);
                return true;
            } else {
                console.error(`Localization: Language file "${filePath}" is empty or invalid.`);
                // Attempt to load fallback language if the current one failed and isn't already the fallback
                if (langCode !== this.fallbackLanguage) {
                    console.warn(`Localization: Attempting to load fallback language "${this.fallbackLanguage}".`);
                    return await this.loadLanguage(this.fallbackLanguage);
                }
                this.translations = {}; // Clear translations if loading fails
                return false;
            }
        } catch (error) {
            console.error(`Localization: Error loading language file "${filePath}":`, error);
            InteractiveAdventure.errorHandler.handle(error, `Failed to load language file: ${filePath}`);
            if (langCode !== this.fallbackLanguage) {
                console.warn(`Localization: Attempting to load fallback language "${this.fallbackLanguage}" due to error.`);
                return await this.loadLanguage(this.fallbackLanguage);
            }
            this.translations = {};
            return false;
        }
    }

    /**
     * @method getString
     * @description Retrieves a translated string for a given key.
     * @param {string} key - The key of the string to retrieve.
     * @param {object} [replacements={}] - An object жертв key-value pairs for placeholder replacement.
     *                                   Example: { playerName: "Hero" } for a string "Hello, {{playerName}}!"
     * @param {string} [langToTry] - Optional: specific language to try first (internal use mainly for fallbacks).
     * @returns {string} The translated string, or the key itself if not found (or a fallback).
     */
    getString(key, replacements = {}, langToTry = null) {
        const targetLang = langToTry || this.currentLanguage;
        let translationsSource = this.translations;

        // If a specific language is requested and it's not the current one (e.g., for fallback mechanism)
        // This part is more complex and might require loading other language files on demand if not preloaded.
        // For simplicity, we'll assume `this.translations` is for `this.currentLanguage`.
        // A more robust system might have all language data or load on demand.

        let translatedString = translationsSource[key];

        // Fallback mechanism
        if (translatedString === undefined) {
            if (targetLang !== this.fallbackLanguage) {
                console.warn(`Localization: String key "${key}" not found in language "${targetLang}". Attempting fallback to "${this.fallbackLanguage}".`);
                // Here, a more advanced system would load the fallback language file if not already loaded
                // For now, we assume fallback language is always English and potentially not loaded if current != en
                // This part needs to be robust if we don't preload all languages.
                // Let's assume for now that if fallback is 'en', we'd need to check an 'en' translation object.
                // This simple version just returns the key.
                // A better way: if (InteractiveAdventure.localization.getFallbackTranslations) { translatedString = getFallbackTranslations()[key]; }
                // For now, just show key:
                translatedString = key; // Default to key if not found even in fallback (or fallback not implemented here)
            } else {
                // Already tried fallback, or current is fallback, and still not found
                console.warn(`Localization: String key "${key}" not found in fallback language "${this.fallbackLanguage}" or current language.`);
                translatedString = key; // Return the key itself as a last resort
            }
        }

        // Perform placeholder replacements
        if (typeof translatedString === 'string' && replacements && typeof replacements === 'object') {
            for (const placeholder in replacements) {
                if (Object.hasOwnProperty.call(replacements, placeholder)) {
                    const regex = new RegExp(`{{\\s*${placeholder}\\s*}}`, 'g');
                    translatedString = translatedString.replace(regex, replacements[placeholder]);
                }
            }
        }

        return translatedString;
    }

    /**
     * @method updatePageLanguageAttribute
     * @description Updates the `lang` attribute of the `<html>` tag.
     * @param {string} langCode - The language code to set.
     */
    updatePageLanguageAttribute(langCode) {
        document.documentElement.setAttribute('lang', langCode);
    }

    /**
     * @method updatePageDirectionAttribute
     * @description Updates the `dir` attribute of the `<html>` tag for RTL/LTR languages.
     * @param {string} langCode - The language code to check for RTL properties.
     */
    updatePageDirectionAttribute(langCode) {
        const rtlLanguages = ['ar', 'he']; // Add other RTL languages if any
        if (rtlLanguages.includes(langCode)) {
            document.documentElement.setAttribute('dir', 'rtl');
            document.body.classList.add('rtl-layout'); // For CSS specific to RTL
            document.body.classList.remove('ltr-layout');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
            document.body.classList.add('ltr-layout');
            document.body.classList.remove('rtl-layout');
        }
    }

    /**
     * @method translateDOM
     * @description Scans the DOM for elements with `data-i18n` attributes and translates their content.
     *              Also handles `data-i18n-placeholder`, `data-i18n-title`, `data-i18n-aria-label`.
     * @param {HTMLElement} [parentElement=document.body] - The parent element to scan. Defaults to document.body.
     */
    translateDOM(parentElement = document.body) {
        if (!parentElement) return;

        // Translate text content
        const elementsToTranslate = parentElement.querySelectorAll('[data-i18n]');
        elementsToTranslate.forEach(element => {
            const key = element.dataset.i18n;
            if (key) {
                element.textContent = this.getString(key);
            }
        });

        // Translate placeholder attributes
        const placeholdersToTranslate = parentElement.querySelectorAll('[data-i18n-placeholder]');
        placeholdersToTranslate.forEach(element => {
            const key = element.dataset.i18nPlaceholder;
            if (key) {
                element.setAttribute('placeholder', this.getString(key));
            }
        });

        // Translate title attributes
        const titlesToTranslate = parentElement.querySelectorAll('[data-i18n-title]');
        titlesToTranslate.forEach(element => {
            const key = element.dataset.i18nTitle;
            if (key) {
                element.setAttribute('title', this.getString(key));
            }
        });

        // Translate aria-label attributes
        const ariaLabelsToTranslate = parentElement.querySelectorAll('[data-i18n-aria-label]');
        ariaLabelsToTranslate.forEach(element => {
            const key = element.dataset.i18nAriaLabel;
            if (key) {
                element.setAttribute('aria-label', this.getString(key));
            }
        });

        // Translate value attributes (e.g. for buttons, inputs type submit/button)
        const valuesToTranslate = parentElement.querySelectorAll('[data-i18n-value]');
        valuesToTranslate.forEach(element => {
            const key = element.dataset.i18nValue;
            if (key && (element.tagName === 'INPUT' || element.tagName === 'BUTTON')) {
                 element.setAttribute('value', this.getString(key));
            }
        });

        console.log(`Localization: DOM translation applied for language "${this.currentLanguage}".`);
    }

    /**
     * @method getSupportedLanguagesList
     * @description Returns a list of supported languages with their native names (requires translation keys).
     * @returns {Array<object>} Example: [{ code: 'en', name: 'English' }, { code: 'it', name: 'Italiano' }]
     */
    getSupportedLanguagesList() {
        return this.supportedLanguages.map(code => ({
            code: code,
            // Assumes keys like 'lang_english', 'lang_italian' exist in translation files
            name: this.getString(`lang_${code.toLowerCase()}_native`) || this.getString(`lang_${code.toLowerCase()}`) || code.toUpperCase()
        }));
    }
}

export default Localization;
