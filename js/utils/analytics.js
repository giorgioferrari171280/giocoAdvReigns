// ============== ANALYTICS UTILITY MODULE ============== //

import InteractiveAdventure from "../core/main.js"; // For Config

/**
 * @class Analytics
 * @description Provides a simple wrapper for sending analytics events.
 *              This is a placeholder and would need to be integrated with a specific
 *              analytics service (e.g., Google Analytics, Mixpanel, or a custom backend).
 */
class Analytics {
    /**
     * @constructor
     * @param {string} [trackingId] - Optional tracking ID for the analytics service.
     *                                Usually provided by the Config module.
     */
    constructor(trackingId) {
        this.trackingId = trackingId || (InteractiveAdventure.config ? InteractiveAdventure.config.getGameSetting('analyticsTrackingId') : null);
        this.isInitialized = false;
        this.isEnabled = InteractiveAdventure.config ? !!InteractiveAdventure.config.getGameSetting('enableAnalytics', false) : false; // Default to false

        if (this.isEnabled && this.trackingId) {
            this._initializeService();
        } else if (this.isEnabled && !this.trackingId) {
            console.warn("Analytics: Analytics is enabled but no Tracking ID is provided. Events will not be sent.");
            this.isEnabled = false;
        } else {
            console.log("Analytics: Analytics is disabled.");
        }
    }

    /**
     * @method _initializeService
     * @description Initializes the connection to the analytics service.
     *              This is where you would put service-specific initialization code.
     * @private
     */
    _initializeService() {
        // Placeholder for actual analytics service initialization
        // Example for Google Analytics (gtag.js):
        /*
        if (typeof gtag === 'function') {
            // gtag('config', this.trackingId, { 'send_page_view': false }); // Configure without initial page view
            console.log(`Analytics: Initialized with Google Analytics (Tracking ID: ${this.trackingId}).`);
            this.isInitialized = true;
        } else {
            console.warn(`Analytics: Google Analytics (gtag.js) not found. Tracking ID: ${this.trackingId}. Events will not be sent.`);
            // You might load the gtag script dynamically here if needed
            // this._loadGoogleAnalyticsScript();
            this.isEnabled = false; // Disable if service cannot be initialized
        }
        */

        // For a custom backend or other services, the implementation would differ.
        console.log(`Analytics: Service initialization for tracking ID "${this.trackingId}" (Placeholder).`);
        this.isInitialized = true; // Assume success for placeholder
    }

    /**
     * @method _loadGoogleAnalyticsScript (Example)
     * @description Dynamically loads the Google Analytics gtag.js script.
     * @private
     */
    // _loadGoogleAnalyticsScript() {
    //     if (!this.trackingId || document.getElementById('ga-gtag-script')) return;
    //     const script = document.createElement('script');
    //     script.id = 'ga-gtag-script';
    //     script.async = true;
    //     script.src = `https://www.googletagmanager.com/gtag/js?id=${this.trackingId}`;
    //     document.head.appendChild(script);

    //     script.onload = () => {
    //         window.dataLayer = window.dataLayer || [];
    //         function gtag(){dataLayer.push(arguments);}
    //         gtag('js', new Date());
    //         // gtag('config', this.trackingId, { 'send_page_view': false });
    //         console.log("Analytics: Google Analytics script loaded and configured.");
    //         this.isInitialized = true;
    //     };
    //     script.onerror = () => {
    //         console.error("Analytics: Failed to load Google Analytics script.");
    //         this.isEnabled = false;
    //     };
    // }


    /**
     * @method trackEvent
     * @description Tracks a custom event.
     * @param {string} eventName - The name of the event (e.g., 'level_complete', 'item_used').
     *                             Often uses 'category_action_label' format for GA (e.g., 'gameplay_choiceMade_scene01').
     * @param {object} [eventData={}] - An object containing additional data for the event.
     *                                  Keys and values depend on the analytics service.
     */
    trackEvent(eventName, eventData = {}) {
        if (!this.isEnabled || !this.isInitialized) {
            // console.log(`Analytics (disabled/not init): Event "${eventName}", Data:`, eventData);
            return;
        }

        console.log(`Analytics: Tracking event "${eventName}", Data:`, eventData);

        // Placeholder for sending data to an analytics service
        // Example for Google Analytics (gtag.js):
        /*
        if (typeof gtag === 'function') {
            // GA4 event structure:
            // gtag('event', eventName, eventData);

            // Universal Analytics event structure (if using that version of GA):
            // gtag('event', eventData.event_action || eventName, { // Action
            //   'event_category': eventData.event_category || 'general', // Category
            //   'event_label': eventData.event_label, // Label (optional)
            //   'value': eventData.value // Value (optional, numeric)
            //   // ... other custom dimensions/metrics
            // });
        } else {
            console.warn("Analytics: Analytics service (e.g., gtag) not available to send event.");
        }
        */

        // For a custom backend:
        // fetch('/api/analytics/track', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         eventName,
        //         timestamp: new Date().toISOString(),
        //         userId: InteractiveAdventure.config.getUserSetting('userId') || 'anonymous', // Example user ID
        //         sessionId: InteractiveAdventure.config.getUserSetting('sessionId'), // Example session ID
        //         gameVersion: InteractiveAdventure.config.getGameSetting('version'),
        //         ...eventData
        //     })
        // }).catch(error => console.error("Analytics: Error sending event to custom backend:", error));

        // Simulate sending data
        if (InteractiveAdventure.config.isDebugMode()) {
            console.info(`[DEBUG ANALYTICS] Event: ${eventName}`, eventData);
        }
    }

    /**
     * @method trackPageView
     * @description Tracks a page view or screen view.
     * @param {string} screenName - The name of the screen or page being viewed (e.g., 'MainMenu', 'GameScreen/Scene01').
     * @param {string} [path] - Optional path for the screen (e.g., '/menu', '/game/scene01').
     */
    trackPageView(screenName, path) {
        if (!this.isEnabled || !this.isInitialized) {
            // console.log(`Analytics (disabled/not init): PageView "${screenName}"`);
            return;
        }

        path = path || `/${screenName.toLowerCase().replace(/\s+/g, '-')}`;
        console.log(`Analytics: Tracking PageView "${screenName}", Path: "${path}"`);

        // Example for Google Analytics (gtag.js) - for single page apps
        /*
        if (typeof gtag === 'function') {
            // For GA4, screen_view event is often used:
            // gtag('event', 'screen_view', {
            //    screen_name: screenName,
            //    app_name: InteractiveAdventure.config.getGameSetting('gameTitle') || 'InteractiveAdventure',
            //    // content_group: 'primary_navigation' // Example
            // });

            // Or, if using traditional page_view for SPA:
            // gtag('event', 'page_view', {
            //    page_title: screenName,
            //    page_location: window.location.origin + path, // Full URL
            //    page_path: path
            //    // send_to: this.trackingId // If multiple trackers
            // });
        }
        */
        if (InteractiveAdventure.config.isDebugMode()) {
            console.info(`[DEBUG ANALYTICS] PageView: ${screenName}, Path: ${path}`);
        }
    }

    /**
     * @method setUserProperties
     * @description Sets user-specific properties for analytics (e.g., user ID, language).
     * @param {object} properties - An object of user properties.
     */
    setUserProperties(properties) {
        if (!this.isEnabled || !this.isInitialized || !properties || typeof properties !== 'object') {
            return;
        }
        console.log("Analytics: Setting user properties:", properties);

        // Example for Google Analytics (gtag.js)
        /*
        if (typeof gtag === 'function') {
            // gtag('set', 'user_properties', properties); // For GA4
            // For Universal Analytics, you might set custom dimensions or user ID
            // if (properties.userId) {
            //    gtag('config', this.trackingId, { 'user_id': properties.userId });
            // }
        }
        */
        if (InteractiveAdventure.config.isDebugMode()) {
            console.info(`[DEBUG ANALYTICS] User Properties Set:`, properties);
        }
    }

    /**
     * @method setEnabled
     * @description Enables or disables analytics tracking.
     * @param {boolean} enabled - True to enable, false to disable.
     */
    setEnabled(enabled) {
        this.isEnabled = !!enabled;
        console.log(`Analytics: Tracking ${this.isEnabled ? 'enabled' : 'disabled'}.`);
        if (this.isEnabled && !this.isInitialized && this.trackingId) {
            this._initializeService(); // Try to initialize if enabled now
        }
        // Persist this choice if it's a user setting
        // InteractiveAdventure.config.setUserSetting('analyticsEnabledUserChoice', this.isEnabled);
    }
}

// Export an instance or the class itself
// export default new Analytics(); // If initialized early with config
export default Analytics;
