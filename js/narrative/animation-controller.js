// ============== ANIMATION CONTROLLER MODULE ============== //

import InteractiveAdventure from "../core/main.js"; // For access to UIManager if needed

/**
 * @class AnimationController
 * @description Manages DOM element animations (CSS-based or simple JS animations).
 *              Works with classes defined in animations.css or performs direct style manipulation.
 */
class AnimationController {
    constructor() {
        this.activeAnimations = new Map(); // To keep track of ongoing JS-driven animations if any
        console.log("AnimationController initialized.");
    }

    /**
     * @method animateElement
     * @description Applies a CSS animation class to an element.
     *              Assumes animation classes are defined in `animations.css`.
     * @param {HTMLElement} element - The DOM element to animate.
     * @param {string} animationName - The name of the animation (CSS class, e.g., 'fadeIn', 'slideInLeft').
     * @param {boolean} [removeAfter=true] - Whether to remove the animation class after it completes.
     * @param {number} [duration] - Optional: if provided, sets a timeout to remove class. Otherwise, relies on CSS animation duration.
     * @returns {Promise<void>} A promise that resolves when the animation is considered complete.
     */
    animateElement(element, animationName, removeAfter = true, duration) {
        return new Promise((resolve) => {
            if (!element || !animationName) {
                console.warn("AnimationController: Element or animationName missing.", element, animationName);
                resolve();
                return;
            }

            // Clean up previous animation classes of the same type (if any pattern exists)
            // This is a simple cleanup; more robust would be to track specific classes.
            // element.className = element.className.replace(/\banimate-\S+/g, '');

            element.classList.add(animationName); // Add the animation class

            const onAnimationEnd = () => {
                if (removeAfter) {
                    element.classList.remove(animationName);
                }
                element.removeEventListener('animationend', onAnimationEnd);
                resolve();
            };

            if (duration && typeof duration === 'number' && duration > 0) {
                // If a specific duration is provided, use a timeout.
                // This overrides waiting for 'animationend' which might be better for CSS-defined durations.
                setTimeout(() => {
                    if (removeAfter) {
                        element.classList.remove(animationName);
                    }
                    resolve();
                }, duration);
            } else {
                // Listen for the CSS animation to end
                element.addEventListener('animationend', onAnimationEnd, { once: true });
            }
        });
    }


    /**
     * @method typewriterEffect
     * @description Displays text with a typewriter effect on a given element.
     * @param {HTMLElement} element - The DOM element where text will be displayed.
     * @param {string} text - The text to display.
     * @param {number} [speed=50] - Speed of typing in milliseconds per character.
     * @returns {Promise<void>} A promise that resolves when typing is complete.
     */
    typewriterEffect(element, text, speed = 50) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }

            element.innerHTML = ''; // Clear previous content
            let i = 0;
            const currentText = text || ''; // Ensure text is not null/undefined

            // Stop any previous typewriter animation on this element
            const existingIntervalId = element.dataset.typewriterIntervalId;
            if (existingIntervalId) {
                clearInterval(parseInt(existingIntervalId));
            }

            if (currentText.length === 0) {
                resolve();
                return;
            }

            element.classList.add('typing-effect'); // For the blinking caret (CSS)

            const intervalId = setInterval(() => {
                if (i < currentText.length) {
                    // Preserve newlines by appending character by character
                    // For HTML content, this needs to be smarter or use innerHTML +=, but be wary of XSS if text is not sanitized.
                    // Assuming plain text for now.
                    element.textContent += currentText.charAt(i);
                    i++;
                    // Optional: Play typing sound
                    // InteractiveAdventure.audioManager.playSound('typing_char', 'sfx/ui/type_char.wav', true);
                } else {
                    clearInterval(intervalId);
                    element.dataset.typewriterIntervalId = '';
                    element.classList.remove('typing-effect'); // Remove caret
                    resolve();
                }
            }, speed);
            element.dataset.typewriterIntervalId = intervalId.toString();
        });
    }

    /**
     * @method stopTypewriterEffect
     * @description Stops an ongoing typewriter effect on an element and displays the full text immediately.
     * @param {HTMLElement} element - The element with the typewriter effect.
     * @param {string} fullText - The full text that should be displayed.
     */
    stopTypewriterEffect(element, fullText) {
        if (!element) return;
        const intervalId = element.dataset.typewriterIntervalId;
        if (intervalId) {
            clearInterval(parseInt(intervalId));
            element.dataset.typewriterIntervalId = '';
        }
        element.textContent = fullText;
        element.classList.remove('typing-effect');
    }


    // --- Pre-defined common animations as methods ---

    fadeIn(element, duration = 300, displayType = 'block') {
        if (!element) return Promise.resolve();
        element.style.opacity = '0';
        element.style.display = displayType; // Ensure it's visible before fading
        return this._jsFade(element, 0, 1, duration);
    }

    fadeOut(element, duration = 300) {
        if (!element) return Promise.resolve();
        return this._jsFade(element, parseFloat(getComputedStyle(element).opacity) || 1, 0, duration).then(() => {
            element.style.display = 'none';
        });
    }

    _jsFade(element, startOpacity, endOpacity, duration) {
        return new Promise(resolve => {
            let startTime = null;
            const animate = (currentTime) => {
                if (!startTime) startTime = currentTime;
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                element.style.opacity = startOpacity + (endOpacity - startOpacity) * progress;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.opacity = endOpacity; // Ensure final value
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }


    slideIn(element, direction = 'left', duration = 500, displayType = 'block') {
        // Basic JS slide - more complex would use CSS transitions/animations for performance
        if (!element) return Promise.resolve();
        element.style.display = displayType;
        // This is a simplified example; robust sliding is better with CSS classes
        // For now, relies on CSS classes like 'animate-slide-in-left'
        let animationClass = 'animate-slide-in-left'; // Default
        if (direction === 'right') animationClass = 'animate-slide-in-right';
        if (direction === 'top') animationClass = 'animate-slide-in-top';
        if (direction === 'bottom') animationClass = 'animate-slide-in-bottom';

        return this.animateElement(element, animationClass, true, duration);
    }

    slideOut(element, direction = 'left', duration = 500) {
        if (!element) return Promise.resolve();
        let animationClass = 'animate-slide-out-left'; // Default
        if (direction === 'right') animationClass = 'animate-slide-out-right';
        // Add top/bottom if needed

        return this.animateElement(element, animationClass, true, duration).then(() => {
            element.style.display = 'none';
        });
    }


    /**
     * @method runTransition
     * @description Runs a more complex transition, e.g., fade out old content, then fade in new.
     * @param {HTMLElement} container - The container whose content will be transitioned.
     * @param {string} effectName - Name of the transition effect (e.g., 'crossfade', 'slide').
     * @param {function} contentUpdateCallback - A function that updates the container's content.
     *                                           This function should be async if it involves loading.
     * @returns {Promise<void>}
     */
    async runTransition(container, effectName = 'crossfade', contentUpdateCallback) {
        if (!container || typeof contentUpdateCallback !== 'function') return;

        switch (effectName.toLowerCase()) {
            case 'crossfade':
                await this.fadeOut(container, 250);
                await contentUpdateCallback();
                await this.fadeIn(container, 250);
                break;
            case 'slide': // Example: slide out left, then slide in new from right
                await this.slideOut(container, 'left', 300);
                await contentUpdateCallback();
                await this.slideIn(container, 'right', 300);
                break;
            case 'none': // No visual transition, just update content
            default:
                await contentUpdateCallback();
                break;
        }
    }

    /**
     * @method clearAnimations
     * @description Removes all known animation classes from an element or stops JS animations.
     * @param {HTMLElement} element - The element to clear animations from.
     */
    clearAnimations(element) {
        if (!element) return;
        // Remove CSS animation classes (example pattern)
        const classList = Array.from(element.classList);
        classList.forEach(cls => {
            if (cls.startsWith('animate-') || ['fadeIn', 'fadeOut', 'slideInLeft', 'slideInRight', /* add others */].includes(cls)) {
                element.classList.remove(cls);
            }
        });

        // Stop JS-driven typewriter effect if active
        const typewriterIntervalId = element.dataset.typewriterIntervalId;
        if (typewriterIntervalId) {
            clearInterval(parseInt(typewriterIntervalId));
            element.dataset.typewriterIntervalId = '';
            element.classList.remove('typing-effect');
        }

        // Stop other JS animations if tracked in this.activeAnimations
        // (This example class doesn't implement tracking for _jsFade yet)
    }

     /**
     * @method pulseElement
     * @description Applies a pulsing animation to an element (useful for highlighting).
     * @param {HTMLElement} element - The DOM element to animate.
     * @param {number} [count=3] - Number of pulses.
     * @param {number} [durationPerPulse=500] - Duration of one pulse cycle in ms.
     */
    async pulseElement(element, count = 3, durationPerPulse = 500) {
        if (!element) return;
        const originalBoxShadow = element.style.boxShadow;
        const pulseShadow = `0 0 10px 5px ${InteractiveAdventure.config.getGameSetting('colors.primaryFocus', 'rgba(74,144,226,0.5)')}`;

        for (let i = 0; i < count; i++) {
            element.style.transition = `box-shadow ${durationPerPulse / 2}ms ease-in-out`;
            element.style.boxShadow = pulseShadow;
            await new Promise(r => setTimeout(r, durationPerPulse / 2));
            element.style.boxShadow = originalBoxShadow || 'none';
            if (i < count - 1) {
                await new Promise(r => setTimeout(r, durationPerPulse / 2));
            }
        }
        element.style.transition = ''; // Reset transition
    }
}

export default AnimationController;
