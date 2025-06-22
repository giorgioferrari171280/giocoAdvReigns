// ============== PERFORMANCE UTILITY MODULE ============== //

/**
 * @class Performance
 * @description Provides utility functions for measuring and logging performance metrics.
 *              Useful for identifying bottlenecks during development.
 */
class Performance {
    constructor() {
        this.marks = new Map(); // Stores start times for named benchmarks
        this.measurements = {}; // Stores results of performance measurements

        // Check for Performance API support
        this.hasPerformanceAPI = typeof window.performance !== 'undefined' &&
                                 typeof window.performance.now === 'function' &&
                                 typeof window.performance.mark === 'function' &&
                                 typeof window.performance.measure === 'function';

        if (this.hasPerformanceAPI) {
            console.log("Performance utility initialized (using Performance API).");
        } else {
            console.warn("Performance utility: window.performance API not fully available. Using Date.now() fallback for timing.");
            // Fallback for `performance.now()` if not available
            this.now = () => Date.now();
        }
    }

    /**
     * @method now
     * @description Returns a high-resolution timestamp in milliseconds.
     *              Uses `performance.now()` if available, otherwise `Date.now()`.
     * @returns {number} Timestamp in milliseconds.
     */
    now() {
        return this.hasPerformanceAPI ? window.performance.now() : Date.now();
    }

    /**
     * @method start
     * @description Starts a performance measurement by recording the current time.
     * @param {string} markName - A unique name for this performance mark.
     */
    start(markName) {
        if (this.hasPerformanceAPI) {
            try {
                window.performance.mark(`mark_${markName}_start`);
            } catch (e) {
                // Some environments might restrict custom marks, fallback
                this.marks.set(markName, this.now());
            }
        } else {
            this.marks.set(markName, this.now());
        }
        // console.log(`Performance: Mark started - ${markName}`);
    }

    /**
     * @method end
     * @description Ends a performance measurement and logs the duration.
     * @param {string} markName - The name of the performance mark started with `start()`.
     * @param {string} [measureName] - Optional: A name for the measurement (if different from markName).
     * @param {boolean} [logToConsole=true] - Whether to log the result to the console.
     * @returns {number | null} The duration in milliseconds, or null if the start mark was not found.
     */
    end(markName, measureName, logToConsole = true) {
        let duration;
        measureName = measureName || markName; // Default measureName to markName

        if (this.hasPerformanceAPI) {
            try {
                window.performance.mark(`mark_${markName}_end`);
                window.performance.measure(
                    `measure_${measureName}`,
                    `mark_${markName}_start`,
                    `mark_${markName}_end`
                );
                const measures = window.performance.getEntriesByName(`measure_${measureName}`, 'measure');
                if (measures.length > 0) {
                    duration = measures[measures.length - 1].duration; // Get the last one if multiple
                    this.measurements[measureName] = duration;
                    // Clean up marks and measures to avoid filling up the buffer
                    window.performance.clearMarks(`mark_${markName}_start`);
                    window.performance.clearMarks(`mark_${markName}_end`);
                    window.performance.clearMeasures(`measure_${measureName}`);
                } else {
                     // Fallback if measure somehow failed but marks exist
                    const startTime = this.marks.get(markName) || this._getMarkTime(`mark_${markName}_start`);
                    if (startTime !== null) {
                        duration = this.now() - startTime;
                        this.measurements[measureName] = duration;
                    } else {
                        console.warn(`Performance: Start mark "${markName}" not found for measurement "${measureName}".`);
                        return null;
                    }
                }
            } catch (e) {
                // Fallback if Performance API calls fail
                const startTime = this.marks.get(markName);
                if (startTime !== undefined) {
                    duration = this.now() - startTime;
                    this.measurements[measureName] = duration;
                    this.marks.delete(markName); // Clean up our internal mark
                } else {
                    console.warn(`Performance: Start mark "${markName}" not found (fallback).`);
                    return null;
                }
            }
        } else {
            // Fallback for environments without Performance API
            const startTime = this.marks.get(markName);
            if (startTime !== undefined) {
                duration = this.now() - startTime;
                this.measurements[measureName] = duration;
                this.marks.delete(markName); // Clean up
            } else {
                console.warn(`Performance: Start mark "${markName}" not found (fallback).`);
                return null;
            }
        }

        if (logToConsole && duration !== undefined) {
            console.log(`Performance: "${measureName}" took ${duration.toFixed(2)} ms.`);
        }
        return duration;
    }

    _getMarkTime(performanceMarkName) {
        const entries = window.performance.getEntriesByName(performanceMarkName, 'mark');
        if (entries.length > 0) {
            return entries[entries.length - 1].startTime;
        }
        return null;
    }


    /**
     * @method getMeasurement
     * @description Retrieves a stored performance measurement.
     * @param {string} measureName - The name of the measurement.
     * @returns {number | undefined} The duration in milliseconds, or undefined if not found.
     */
    getMeasurement(measureName) {
        return this.measurements[measureName];
    }

    /**
     * @method getAllMeasurements
     * @description Retrieves all stored performance measurements.
     * @returns {object} An object with all measurement names and their durations.
     */
    getAllMeasurements() {
        return { ...this.measurements };
    }

    /**
     * @method clearMeasurements
     * @description Clears all stored performance measurements.
     * @param {string} [measureName] - Optional: if provided, only clears this specific measurement.
     */
    clearMeasurements(measureName) {
        if (measureName) {
            delete this.measurements[measureName];
        } else {
            this.measurements = {};
        }
        if (this.hasPerformanceAPI) {
            // Also clear from browser's performance entry buffer if needed, though `end()` does some cleanup.
            // window.performance.clearMeasures(); // Clears ALL measures
        }
        console.log(measureName ? `Performance: Measurement "${measureName}" cleared.` : "Performance: All measurements cleared.");
    }


    // --- FPS Counter (Example for continuous monitoring) ---
    /**
     * @method startFpsCounter
     * @description Starts a simple FPS counter that logs to console.
     * @param {number} [logInterval=2000] - Interval in ms to log FPS.
     * @param {function} [onFpsUpdate] - Optional callback function that receives the FPS value.
     */
    startFpsCounter(logInterval = 2000, onFpsUpdate) {
        if (this.fpsCounterActive) return;
        this.fpsCounterActive = true;

        let lastTime = this.now();
        let frameCount = 0;

        const fpsLoop = () => {
            if (!this.fpsCounterActive) return;

            frameCount++;
            const currentTime = this.now();
            const deltaTime = currentTime - lastTime;

            if (deltaTime >= logInterval) {
                const fps = (frameCount / (deltaTime / 1000)).toFixed(1);
                console.log(`Performance: FPS = ${fps}`);
                if (onFpsUpdate && typeof onFpsUpdate === 'function') {
                    onFpsUpdate(parseFloat(fps));
                }
                frameCount = 0;
                lastTime = currentTime;
            }
            requestAnimationFrame(fpsLoop);
        };
        requestAnimationFrame(fpsLoop);
        console.log("Performance: FPS counter started.");
    }

    /**
     * @method stopFpsCounter
     * @description Stops the FPS counter.
     */
    stopFpsCounter() {
        this.fpsCounterActive = false;
        console.log("Performance: FPS counter stopped.");
    }


    /**
     * @method benchmarkFunction
     * @description Measures the execution time of a given function.
     * @param {string} benchmarkName - A name for this benchmark.
     * @param {function} funcToBenchmark - The function to execute and measure.
     * @param {Array} [args=[]] - Arguments to pass to the function.
     * @returns {Promise<any>} A promise that resolves with the return value of the benchmarked function.
     *                         The execution time is logged and stored.
     */
    async benchmarkFunction(benchmarkName, funcToBenchmark, args = []) {
        if (typeof funcToBenchmark !== 'function') {
            console.error("Performance: `funcToBenchmark` must be a function.");
            return Promise.reject(new Error("Invalid function for benchmark."));
        }

        this.start(benchmarkName);
        let result;
        try {
            result = await funcToBenchmark(...args); // Handle async functions
        } catch (error) {
            this.end(benchmarkName); // End even if error
            console.error(`Performance: Error during benchmark "${benchmarkName}":`, error);
            return Promise.reject(error);
        }
        this.end(benchmarkName);
        return result;
    }
}

// Export an instance or the class itself
// export default new Performance();
export default Performance;
