// ============== VALIDATION UTILITY MODULE ============== //

/**
 * @class Validation
 * @description Provides utility functions for common validation tasks.
 *              This class can be instantiated or its methods used statically if preferred.
 */
class Validation {
    constructor() {
        console.log("Validation utility initialized.");
    }

    /**
     * @method isEmail
     * @description Validates if a string is a well-formed email address.
     * @param {string} emailString - The string to validate.
     * @returns {boolean} True if valid email format, false otherwise.
     */
    isEmail(emailString) {
        if (typeof emailString !== 'string' || emailString.trim() === '') {
            return false;
        }
        // Regular expression for basic email validation
        // This regex is a common one, but not 100% foolproof for all edge cases (RFC 5322).
        // For critical validation, server-side validation is always recommended.
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // A more comprehensive one, but can be complex:
        // const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return emailRegex.test(emailString.toLowerCase());
    }

    /**
     * @method isNotEmpty
     * @description Checks if a string is not empty after trimming whitespace.
     * @param {string} value - The string to check.
     * @returns {boolean} True if not empty, false otherwise.
     */
    isNotEmpty(value) {
        return typeof value === 'string' && value.trim() !== '';
    }

    /**
     * @method hasMinLength
     * @description Checks if a string meets a minimum length requirement.
     * @param {string} value - The string to check.
     * @param {number} minLength - The minimum required length.
     * @returns {boolean} True if length is sufficient, false otherwise.
     */
    hasMinLength(value, minLength) {
        if (typeof value !== 'string' || typeof minLength !== 'number' || minLength < 0) {
            return false;
        }
        return value.length >= minLength;
    }

    /**
     * @method hasMaxLength
     * @description Checks if a string does not exceed a maximum length requirement.
     * @param {string} value - The string to check.
     * @param {number} maxLength - The maximum allowed length.
     * @returns {boolean} True if length is within limit, false otherwise.
     */
    hasMaxLength(value, maxLength) {
        if (typeof value !== 'string' || typeof maxLength !== 'number' || maxLength < 0) {
            return false;
        }
        return value.length <= maxLength;
    }

    /**
     * @method isNumber
     * @description Checks if a value is a valid number (integer or float).
     * @param {any} value - The value to check.
     * @returns {boolean} True if it's a number, false otherwise.
     */
    isNumber(value) {
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            return false;
        }
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    /**
     * @method isInteger
     * @description Checks if a value is a valid integer.
     * @param {any} value - The value to check.
     * @returns {boolean} True if it's an integer, false otherwise.
     */
    isInteger(value) {
        if (!this.isNumber(value)) {
            return false;
        }
        return Number.isInteger(parseFloat(value)); // Or Number(value) % 1 === 0;
    }

    /**
     * @method isInRange
     * @description Checks if a number is within a specified range (inclusive).
     * @param {number} value - The number to check.
     * @param {number} min - The minimum allowed value.
     * @param {number} max - The maximum allowed value.
     * @returns {boolean} True if within range, false otherwise.
     */
    isInRange(value, min, max) {
        if (!this.isNumber(value) || !this.isNumber(min) || !this.isNumber(max)) {
            return false;
        }
        return parseFloat(value) >= parseFloat(min) && parseFloat(value) <= parseFloat(max);
    }

    /**
     * @method isAlphaNumeric
     * @description Checks if a string contains only alphanumeric characters.
     * @param {string} value - The string to check.
     * @param {boolean} [allowSpaces=false] - If true, spaces are also allowed.
     * @returns {boolean} True if alphanumeric, false otherwise.
     */
    isAlphaNumeric(value, allowSpaces = false) {
        if (typeof value !== 'string') {
            return false;
        }
        const pattern = allowSpaces ? /^[a-z0-9\s]+$/i : /^[a-z0-9]+$/i;
        return pattern.test(value);
    }

    /**
     * @method isURL
     * @description Validates if a string is a well-formed URL.
     * @param {string} urlString - The string to validate.
     * @returns {boolean} True if valid URL format, false otherwise.
     */
    isURL(urlString) {
        if (typeof urlString !== 'string' || urlString.trim() === '') {
            return false;
        }
        try {
            new URL(urlString);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * @method matchesRegex
     * @description Checks if a string matches a given regular expression.
     * @param {string} value - The string to check.
     * @param {RegExp} regex - The regular expression to match against.
     * @returns {boolean} True if it matches, false otherwise.
     */
    matchesRegex(value, regex) {
        if (typeof value !== 'string' || !(regex instanceof RegExp)) {
            return false;
        }
        return regex.test(value);
    }

    /**
     * @method sanitizeHTMLString
     * @description Basic HTML sanitization by escaping special characters.
     *              For robust sanitization against XSS, use a dedicated library like DOMPurify.
     * @param {string} unsafeString - The string to sanitize.
     * @returns {string} The sanitized string.
     */
    sanitizeHTMLString(unsafeString) {
        if (typeof unsafeString !== 'string') return '';
        return unsafeString
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * @method validateForm
     * @description A generic form validation helper.
     * @param {HTMLFormElement} formElement - The form element to validate.
     * @param {object} rules - An object defining validation rules for form fields.
     *                         Example: { fieldName: [{ type: 'isNotEmpty', message: 'Required' }, { type: 'isEmail', message: 'Invalid email' }] }
     * @returns {object} An object with `isValid` (boolean) and `errors` (object mapping field names to error messages).
     */
    validateForm(formElement, rules) {
        const errors = {};
        let isValid = true;

        for (const fieldName in rules) {
            if (Object.hasOwnProperty.call(rules, fieldName)) {
                const field = formElement.elements[fieldName];
                if (!field) {
                    console.warn(`Validation: Field "${fieldName}" not found in form.`);
                    continue;
                }

                const value = field.type === 'checkbox' ? field.checked : field.value;
                const fieldRules = rules[fieldName];

                for (const rule of fieldRules) {
                    let ruleValid = false;
                    switch (rule.type) {
                        case 'isNotEmpty':
                            ruleValid = typeof value === 'boolean' ? value : this.isNotEmpty(value); // For checkbox value is boolean
                            break;
                        case 'isEmail':
                            ruleValid = this.isEmail(value);
                            break;
                        case 'hasMinLength':
                            ruleValid = this.hasMinLength(value, rule.minLength);
                            break;
                        case 'hasMaxLength':
                            ruleValid = this.hasMaxLength(value, rule.maxLength);
                            break;
                        case 'isNumber':
                            ruleValid = this.isNumber(value);
                            break;
                        case 'isInteger':
                            ruleValid = this.isInteger(value);
                            break;
                        case 'isInRange':
                            ruleValid = this.isInRange(value, rule.min, rule.max);
                            break;
                        case 'matchesRegex':
                            ruleValid = this.matchesRegex(value, rule.regex);
                            break;
                        case 'custom': // For custom validation functions
                            if (typeof rule.validator === 'function') {
                                ruleValid = rule.validator(value, field, formElement);
                            } else {
                                console.warn(`Validation: Custom validator for "${fieldName}" is not a function.`);
                                ruleValid = true; // Assume valid if validator is broken
                            }
                            break;
                        default:
                            console.warn(`Validation: Unknown rule type "${rule.type}" for field "${fieldName}".`);
                            ruleValid = true; // Assume valid for unknown rules
                    }

                    if (!ruleValid) {
                        errors[fieldName] = rule.message || `Invalid input for ${fieldName}.`;
                        isValid = false;
                        break; // Stop validating this field after first error
                    }
                }
            }
        }
        return { isValid, errors };
    }
}

// Export an instance or the class itself depending on preferred usage
// export default new Validation(); // For singleton instance
export default Validation; // To allow multiple instances or static use
