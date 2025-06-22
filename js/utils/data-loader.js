// ============== DATA LOADER UTILITY MODULE ============== //

import InteractiveAdventure from "../core/main.js"; // For ErrorHandler

/**
 * @class DataLoader
 * @description Utility class for loading external data files (JSON, HTML, etc.).
 */
class DataLoader {
    constructor() {
        this.cache = new Map(); // Simple cache for fetched data
        this.enableCache = true; // Set to false to disable caching for debugging

        console.log("DataLoader initialized.");
    }

    /**
     * @method loadJSON
     * @description Fetches and parses a JSON file.
     * @param {string} filePath - The path to the JSON file.
     * @param {boolean} [forceNoCache=false] - If true, bypasses cache for this request.
     * @returns {Promise<object | null>} A promise that resolves with the parsed JSON object, or null on error.
     */
    async loadJSON(filePath, forceNoCache = false) {
        if (this.enableCache && !forceNoCache && this.cache.has(filePath)) {
            console.log(`DataLoader: Serving JSON from cache: ${filePath}`);
            return Promise.resolve(this.cache.get(filePath)); // Return a new promise to match async signature
        }

        try {
            const response = await fetch(filePath, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status} while fetching ${filePath}`);
            }

            const data = await response.json();
            if (this.enableCache && !forceNoCache) {
                this.cache.set(filePath, data);
            }
            console.log(`DataLoader: JSON loaded successfully: ${filePath}`);
            return data;

        } catch (error) {
            console.error(`DataLoader: Error loading JSON from ${filePath}:`, error);
            if (InteractiveAdventure && InteractiveAdventure.errorHandler) { // Check if errorHandler is available
                InteractiveAdventure.errorHandler.handle(error, `Failed to load JSON: ${filePath}`);
            }
            return null; // Or throw error to be caught by caller
        }
    }

    /**
     * @method loadHTML
     * @description Fetches HTML content as a string.
     * @param {string} filePath - The path to the HTML file.
     * @param {boolean} [forceNoCache=false] - If true, bypasses cache for this request.
     * @returns {Promise<string | null>} A promise that resolves with the HTML string, or null on error.
     */
    async loadHTML(filePath, forceNoCache = false) {
        if (this.enableCache && !forceNoCache && this.cache.has(filePath)) {
            console.log(`DataLoader: Serving HTML from cache: ${filePath}`);
            return Promise.resolve(this.cache.get(filePath));
        }

        try {
            const response = await fetch(filePath, {
                headers: {
                    'Accept': 'text/html'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status} while fetching ${filePath}`);
            }

            const htmlString = await response.text();
            if (this.enableCache && !forceNoCache) {
                this.cache.set(filePath, htmlString);
            }
            console.log(`DataLoader: HTML loaded successfully: ${filePath}`);
            return htmlString;

        } catch (error) {
            console.error(`DataLoader: Error loading HTML from ${filePath}:`, error);
             if (InteractiveAdventure && InteractiveAdventure.errorHandler) {
                InteractiveAdventure.errorHandler.handle(error, `Failed to load HTML: ${filePath}`);
            }
            return null;
        }
    }

    /**
     * @method loadImage
     * @description Loads an image element.
     * @param {string} imagePath - The path to the image file.
     * @returns {Promise<HTMLImageElement | null>} A promise that resolves with the HTMLImageElement, or null on error.
     */
    loadImage(imagePath) {
        // Caching for images is typically handled by the browser itself,
        // but we could implement a simple check or use `<link rel="preload">` for critical images.
        // For this loader, we'll just load it directly.

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`DataLoader: Image loaded: ${imagePath}`);
                resolve(img);
            };
            img.onerror = (error) => {
                console.error(`DataLoader: Error loading image ${imagePath}:`, error);
                if (InteractiveAdventure && InteractiveAdventure.errorHandler) {
                    InteractiveAdventure.errorHandler.handle(new Error(`Image load failed for ${imagePath}`), `Failed to load image: ${imagePath}`);
                }
                // Resolve with null instead of rejecting to allow graceful degradation if an image is missing
                resolve(null);
            };
            img.src = imagePath;
        });
    }

    /**
     * @method loadAudio
     * @description Creates an HTMLAudioElement for a given audio file.
     *              Note: Actual playback and full loading are handled by AudioManager.
     *              This just prepares the element or checks if source is valid.
     * @param {string} audioPath - The path to the audio file.
     * @param {boolean} [preload='auto'] - Browser's preload hint ('auto', 'metadata', 'none').
     * @returns {Promise<HTMLAudioElement | null>} A promise that resolves with the HTMLAudioElement, or null on error.
     */
    loadAudio(audioPath, preload = 'auto') {
        // Similar to images, browser handles caching. AudioManager handles actual loading states.
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.preload = preload;

            // Event listener for when the browser can play through the audio
            const canPlayHandler = () => {
                console.log(`DataLoader: Audio can play through: ${audioPath}`);
                audio.removeEventListener('canplaythrough', canPlayHandler);
                audio.removeEventListener('error', errorHandler);
                resolve(audio);
            };

            // Event listener for errors during loading
            const errorHandler = (event) => {
                console.error(`DataLoader: Error loading audio ${audioPath}:`, event.target.error);
                 if (InteractiveAdventure && InteractiveAdventure.errorHandler) {
                    InteractiveAdventure.errorHandler.handle(event.target.error || new Error(`Audio load failed for ${audioPath}`), `Failed to load audio: ${audioPath}`);
                }
                audio.removeEventListener('canplaythrough', canPlayHandler);
                audio.removeEventListener('error', errorHandler);
                resolve(null); // Resolve with null on error
            };

            audio.addEventListener('canplaythrough', canPlayHandler, { once: true });
            audio.addEventListener('error', errorHandler, { once: true });

            audio.src = audioPath;
            if (preload !== 'none') {
                audio.load(); // Explicitly call load if preload is 'auto' or 'metadata'
            } else {
                // If preload is 'none', 'canplaythrough' might not fire until play() is called.
                // For just creating the element, this is okay. AudioManager will handle more.
                // We can resolve earlier if just creating the element is the goal.
                // However, to confirm it's a valid source, waiting for 'canplaythrough' or 'loadedmetadata' is better.
                // For simplicity, we'll keep this structure. If preload is 'none', it might take longer to resolve or resolve on error.
            }
        });
    }


    /**
     * @method loadFile
     * @description Generic method to load any file as text (e.g., for custom script formats).
     * @param {string} filePath - The path to the file.
     * @param {boolean} [forceNoCache=false] - If true, bypasses cache for this request.
     * @returns {Promise<string | null>} A promise that resolves with the file content as a string, or null on error.
     */
    async loadFile(filePath, forceNoCache = false) {
        if (this.enableCache && !forceNoCache && this.cache.has(filePath)) {
            console.log(`DataLoader: Serving file content from cache: ${filePath}`);
            return Promise.resolve(this.cache.get(filePath));
        }

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status} while fetching ${filePath}`);
            }
            const textContent = await response.text();
            if (this.enableCache && !forceNoCache) {
                this.cache.set(filePath, textContent);
            }
            console.log(`DataLoader: File content loaded successfully: ${filePath}`);
            return textContent;
        } catch (error) {
            console.error(`DataLoader: Error loading file ${filePath}:`, error);
            if (InteractiveAdventure && InteractiveAdventure.errorHandler) {
                InteractiveAdventure.errorHandler.handle(error, `Failed to load file: ${filePath}`);
            }
            return null;
        }
    }


    /**
     * @method clearCache
     * @description Clears the internal cache.
     * @param {string} [filePath] - Optional: if provided, only clears this specific file from cache.
     */
    clearCache(filePath) {
        if (filePath) {
            if (this.cache.has(filePath)) {
                this.cache.delete(filePath);
                console.log(`DataLoader: Cache cleared for ${filePath}`);
            }
        } else {
            this.cache.clear();
            console.log("DataLoader: All cache cleared.");
        }
    }

    /**
     * @method setCacheEnabled
     * @description Enables or disables the caching mechanism.
     * @param {boolean} enabled - True to enable cache, false to disable.
     */
    setCacheEnabled(enabled) {
        this.enableCache = !!enabled;
        console.log(`DataLoader: Cache ${this.enableCache ? 'enabled' : 'disabled'}.`);
        if (!this.enableCache) {
            this.clearCache(); // Clear existing cache if disabling
        }
    }
}

export default DataLoader;
