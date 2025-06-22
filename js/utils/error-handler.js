// ============== ERROR HANDLER UTILITY MODULE ============== //

/**
 * @class ErrorHandler
 * @description Centralized error handling for the game.
 *              Logs errors and can display user-friendly messages for critical failures.
 */
class ErrorHandler {
    constructor() {
        this.errorLog = []; // Stores a log of errors for the current session (optional)
        this.maxLogSize = 100; // Max number of errors to keep in the log
        this.showUserErrors = true; // Whether to display critical errors to the user

        // Attempt to get debug mode status early, might not be available if Config isn't loaded
        // It will be checked again within the handle method.
        this.debugMode = false;
        try {
            if (typeof InteractiveAdventure !== 'undefined' && InteractiveAdventure.config) {
                this.debugMode = InteractiveAdventure.config.isDebugMode();
            }
        } catch (e) { /* Config might not be ready */ }


        console.log("ErrorHandler initialized.");
    }

    /**
     * @method handle
     * @description Handles an error: logs it and optionally displays a message to the user.
     * @param {Error | any} error - The error object or error information.
     * @param {string} [context="General"] - Contextual information about where the error occurred.
     * @param {boolean} [isFatal=false] - If true, indicates a critical error that might stop the game.
     */
    handle(error, context = "General", isFatal = false) {
        // Update debugMode in case Config was loaded after ErrorHandler instantiation
        if (typeof InteractiveAdventure !== 'undefined' && InteractiveAdventure.config) {
            this.debugMode = InteractiveAdventure.config.isDebugMode();
        }

        const timestamp = new Date().toISOString();
        let errorMessage = "An unknown error occurred.";
        let errorStack = null;

        if (error instanceof Error) {
            errorMessage = error.message;
            errorStack = error.stack;
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else if (typeof error === 'object' && error !== null && error.message) {
            // For error-like objects (e.g., from Promise rejections)
            errorMessage = error.message;
            if (error.stack) errorStack = error.stack;
            if (error.source && error.lineno && error.colno) { // From window.onerror
                errorMessage += ` (Source: ${error.source}, Line: ${error.lineno}, Col: ${error.colno})`;
            }
        }

        const errorDetails = {
            timestamp,
            message: errorMessage,
            context,
            isFatal,
            stack: errorStack,
            originalError: error // Keep the original error object if available
        };

        // Log to console
        if (this.debugMode || isFatal) {
            console.error(`[ERROR HANDLER - ${context}] Timestamp: ${timestamp}`);
            console.error("Message:", errorMessage);
            if (errorStack) {
                console.error("Stack Trace:", errorStack);
            }
            if (this.debugMode && error !== errorDetails.originalError) { // If we wrapped it
                console.error("Original Error Object:", error);
            }
        } else {
            // For non-fatal errors in non-debug mode, a simpler log might be sufficient
            console.warn(`[Game Warning - ${context}] ${errorMessage}`);
        }


        // Store in internal log (optional)
        this.errorLog.push(errorDetails);
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift(); // Keep log size manageable
        }

        // Send to analytics/error reporting service (if implemented)
        if (typeof InteractiveAdventure !== 'undefined' && InteractiveAdventure.analytics) {
            InteractiveAdventure.analytics.trackEvent('error_occurred', {
                error_message: errorMessage.substring(0, 100), // Limit length for analytics
                error_context: context,
                is_fatal: isFatal,
                // error_stack_preview: errorStack ? errorStack.substring(0, 200) : undefined
            });
        }


        // Display to user if fatal or configured to show errors
        if (isFatal && this.showUserErrors) {
            this.showFatalError(
                `A critical error occurred in "${context}": ${errorMessage}`,
                errorDetails // Pass full details for potential display in debug mode
            );
        } else if (this.debugMode && this.showUserErrors && !isFatal) {
            // In debug mode, maybe show non-fatal errors as notifications
            if (typeof InteractiveAdventure !== 'undefined' && InteractiveAdventure.uiManager) {
                InteractiveAdventure.uiManager.showNotification(`Debug Error (${context}): ${errorMessage}`, 'error', 10000);
            }
        }
    }

    /**
     * @method showFatalError
     * @description Displays a fatal error message to the user, potentially halting the game.
     * @param {string} userMessage - The user-friendly message to display.
     * @param {object} [errorDetails] - Optional: The detailed error object for more info (e.g., in debug).
     */
    showFatalError(userMessage, errorDetails) {
        console.error("FATAL ERROR DISPLAYED TO USER:", userMessage, errorDetails || "");

        // Attempt to use UIManager if available
        if (typeof InteractiveAdventure !== 'undefined' && InteractiveAdventure.uiManager) {
            InteractiveAdventure.uiManager.hideLoadingScreen(); // Hide any loading screens
            InteractiveAdventure.uiManager.clearGameContainer(); // Clear current game content

            let detailedInfo = "";
            if (this.debugMode && errorDetails) {
                detailedInfo = `
                    <p style="font-size: 0.8em; color: #ccc; margin-top: 15px; text-align: left; max-height: 200px; overflow-y: auto; background: #222; padding: 10px; border-radius: 5px;">
                        <strong>Debug Info:</strong><br>
                        Context: ${errorDetails.context}<br>
                        Message: ${errorDetails.message}<br>
                        ${errorDetails.stack ? `Stack:<br><pre style="white-space: pre-wrap; word-break: break-all;">${errorDetails.stack}</pre>` : ''}
                    </p>`;
            }

            const gameContainer = InteractiveAdventure.uiManager.gameContainer || document.getElementById('game-container') || document.body;
            gameContainer.innerHTML = `
                <div style="color: #ffdddd; background-color: #300; border: 2px solid #800; padding: 20px; margin: 20px; text-align: center; font-family: sans-serif;">
                    <h1 style="color: #ff8888; font-size: 1.5em;">${InteractiveAdventure.localization ? InteractiveAdventure.localization.getString('fatal_error_title') : 'Critical Error'}</h1>
                    <p>${userMessage}</p>
                    <p>${InteractiveAdventure.localization ? InteractiveAdventure.localization.getString('fatal_error_suggestion') : 'Please try refreshing the page. If the problem persists, contact support.'}</p>
                    ${detailedInfo}
                    <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 15px; background: #800; color: white; border: 1px solid #c00; cursor: pointer;">
                        ${InteractiveAdventure.localization ? InteractiveAdventure.localization.getString('fatal_error_refresh_button') : 'Refresh Page'}
                    </button>
                </div>
            `;
        } else {
            // Fallback if UIManager is not available (very early error or UIManager itself failed)
            alert(`CRITICAL ERROR:\n${userMessage}\nPlease try refreshing the page.`);
        }

        // Optionally, try to stop any ongoing game processes
        if (typeof InteractiveAdventure !== 'undefined' && InteractiveAdventure.gameEngine) {
            InteractiveAdventure.gameEngine.stopGameLoop(); // If a game loop is running
            InteractiveAdventure.gameEngine.setState(InteractiveAdventure.gameEngine.GAME_STATES.ERROR);
        }
        if (typeof InteractiveAdventure !== 'undefined' && InteractiveAdventure.audioManager) {
            InteractiveAdventure.audioManager.stopAllSounds();
        }
    }

    /**
     * @method getErrorLog
     * @description Returns the current session's error log.
     * @returns {Array<object>}
     */
    getErrorLog() {
        return [...this.errorLog]; // Return a copy
    }

    /**
     * @method clearErrorLog
     * @description Clears the internal error log.
     */
    clearErrorLog() {
        this.errorLog = [];
        console.log("ErrorHandler: Session error log cleared.");
    }

    /**
     * @method setShowUserErrors
     * @description Configures whether to display critical errors to the user.
     * @param {boolean} show - True to display, false to suppress (only log).
     */
    setShowUserErrors(show) {
        this.showUserErrors = !!show;
    }
}

// Export an instance or the class itself
// export default new ErrorHandler();
export default ErrorHandler;
