// ============== HALL OF FAME CONTROLLER MODULE ============== //

import InteractiveAdventure from "../core/main.js"; // To access UIManager, AchievementSystem, StateManager

/**
 * @class HallOfFameController
 * @description Handles the logic for the Hall of Fame and Achievements Grid screens.
 */
class HallOfFameController {
    /**
     * @constructor
     * @param {UIManager} uiManager - Instance of UIManager.
     * @param {AchievementSystem} achievementSystem - Instance of AchievementSystem.
     * @param {StateManager} stateManager - Instance of StateManager (for high scores, game stats).
     */
    constructor(uiManager, achievementSystem, stateManager) {
        this.uiManager = uiManager;
        this.achievementSystem = achievementSystem;
        this.stateManager = stateManager; // For high scores, game completion stats

        this.hallOfFameContainer = null;
        this.achievementGridContainer = null;

        console.log("HallOfFameController initialized.");
    }

    // --- Hall of Fame Screen (halloffame.html) ---

    /**
     * @method showHallOfFameScreen
     * @description Loads and displays the Hall of Fame screen.
     */
    async showHallOfFameScreen() {
        console.log("HallOfFameController: Showing Hall of Fame screen...");
        InteractiveAdventure.gameEngine.setState(InteractiveAdventure.gameEngine.GAME_STATES.HALL_OF_FAME);
        this.audioManager.playSound('ui_screen_transition', 'sfx/ui/transition_alt.wav');

        this.hallOfFameContainer = await this.uiManager.navigateToScreen('halloffame');
        if (!this.hallOfFameContainer) {
            console.error("HallOfFameController: Failed to load Hall of Fame screen content.");
            return;
        }

        this._populateHallOfFame();
        this._setupHallOfFameEventListeners();
    }

    _populateHallOfFame() {
        if (!this.hallOfFameContainer) return;
        const loc = InteractiveAdventure.localization;

        // 1. High Scores (Example - assuming scores are stored in StateManager's game variables or a dedicated list)
        const highScoresListEl = this.uiManager.getElement('#high-scores-list', this.hallOfFameContainer);
        if (highScoresListEl) {
            highScoresListEl.innerHTML = ''; // Clear
            const highScores = this.stateManager.getGameStateVar('highScores') || []; // Example structure: [{name: "Player", score: 1000, date: "ISO_DATE_STRING"}]
            highScores.sort((a, b) => b.score - a.score); // Sort descending

            if (highScores.length === 0) {
                highScoresListEl.innerHTML = `<li data-i18n="no_scores_yet_placeholder">${loc.getString('no_scores_yet_placeholder') || '(No high scores recorded yet)'}</li>`;
            } else {
                highScores.slice(0, 10).forEach((entry, index) => { // Display top 10
                    const li = document.createElement('li');
                    const dateStr = entry.date ? new Date(entry.date).toLocaleDateString() : "";
                    li.innerHTML = `
                        <span class="player-name-hof">${index + 1}. ${entry.name || loc.getString('unknown_player')}</span>
                        <span class="score-hof">${entry.score} ${loc.getString('points_suffix') || 'pts'}</span>
                        ${dateStr ? `<span class="date-hof">(${dateStr})</span>` : ''}
                    `;
                    highScoresListEl.appendChild(li);
                });
            }
        }

        // 2. Achievements Summary
        const unlockedCountEl = this.uiManager.getElement('#unlocked-achievements-count', this.hallOfFameContainer);
        const totalCountEl = this.uiManager.getElement('#total-achievements-count', this.hallOfFameContainer);
        const percentageEl = this.uiManager.getElement('#completion-percentage-value', this.hallOfFameContainer);

        if (unlockedCountEl && totalCountEl && percentageEl) {
            const unlocked = this.achievementSystem.getUnlockedAchievementsCount();
            const total = this.achievementSystem.getTotalAchievements();
            unlockedCountEl.textContent = unlocked;
            totalCountEl.textContent = total;
            const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
            percentageEl.textContent = `${percentage}%`;
        }

        // 3. Game Statistics Summary (Example)
        const totalPlaytimeEl = this.uiManager.getElement('#total-playtime', this.hallOfFameContainer);
        if (totalPlaytimeEl) {
            const totalSeconds = this.stateManager.getGameStateVar('totalPlayTimeOverall') || 0; // Assuming this is tracked globally
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            totalPlaytimeEl.textContent = loc.getString('playtime_format', { hours, minutes }) || `${hours}h ${minutes}m`;
        }
        const gamesCompletedEl = this.uiManager.getElement('#total-completions', this.hallOfFameContainer);
        if (gamesCompletedEl) {
            gamesCompletedEl.textContent = this.stateManager.getGameStateVar('gamesCompletedCount') || 0;
        }
    }

    _setupHallOfFameEventListeners() {
        if (!this.hallOfFameContainer) return;

        const viewAchievementsBtn = this.uiManager.getElement('#view-all-achievements-link', this.hallOfFameContainer);
        if (viewAchievementsBtn) viewAchievementsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAchievementGridScreen();
        });

        const backBtn = this.uiManager.getElement('#back-to-menu-hof-btn', this.hallOfFameContainer);
        if (backBtn) backBtn.addEventListener('click', () => {
            this.audioManager.playSound('ui_cancel', 'sfx/ui/cancel_action.wav');
            InteractiveAdventure.menuController.showMenu();
        });
    }

    // --- Achievements Grid Screen (achievement-grid.html) ---

    /**
     * @method showAchievementGridScreen
     * @description Loads and displays the detailed achievements grid.
     */
    async showAchievementGridScreen() {
        console.log("HallOfFameController: Showing Achievement Grid screen...");
        InteractiveAdventure.gameEngine.setState(InteractiveAdventure.gameEngine.GAME_STATES.ACHIEVEMENTS_GRID);
        this.audioManager.playSound('ui_screen_transition', 'sfx/ui/transition_alt.wav');

        this.achievementGridContainer = await this.uiManager.navigateToScreen('achievement-grid');
        if (!this.achievementGridContainer) {
            console.error("HallOfFameController: Failed to load Achievement Grid screen content.");
            return;
        }

        this._populateAchievementGrid();
        this._setupAchievementGridEventListeners();
    }

    _populateAchievementGrid(filter = 'all', sort = 'name') {
        if (!this.achievementGridContainer) return;
        const loc = InteractiveAdventure.localization;

        const gridEl = this.uiManager.getElement('#achievements-listing', this.achievementGridContainer);
        if (!gridEl) return;
        gridEl.innerHTML = ''; // Clear

        let achievements = this.achievementSystem.getPlayerAchievementsStatus(); // Gets all, { definition, unlocked, unlockDate, ... }

        // Filter
        if (filter === 'unlocked') {
            achievements = achievements.filter(a => a.unlocked);
        } else if (filter === 'locked') {
            achievements = achievements.filter(a => !a.unlocked);
        }

        // Sort
        switch (sort) {
            case 'rarity': // Rarest first (legendary > epic > rare > uncommon > common), then by name
                const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
                achievements.sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0) || a.name.localeCompare(b.name));
                break;
            case 'unlocked_date': // Most recent first
                achievements.sort((a, b) => {
                    if (a.unlocked && !b.unlocked) return -1;
                    if (!a.unlocked && b.unlocked) return 1;
                    if (!a.unlocked && !b.unlocked) return a.name.localeCompare(b.name); // Unlocked same, sort by name
                    return new Date(b.unlockDate) - new Date(a.unlockDate);
                });
                break;
            case 'name':
            default:
                achievements.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        // Update summary counts in header
        const unlocked = this.achievementSystem.getUnlockedAchievementsCount();
        const total = this.achievementSystem.getTotalAchievements();
        this.uiManager.getElement('#grid-unlocked-count', this.achievementGridContainer).textContent = unlocked;
        this.uiManager.getElement('#grid-total-count', this.achievementGridContainer).textContent = total;
        this.uiManager.getElement('#grid-percentage', this.achievementGridContainer).textContent = `${total > 0 ? Math.round((unlocked/total)*100) : 0}%`;


        const noAchievementsMsg = this.uiManager.getElement('#no-achievements-message', this.achievementGridContainer);
        if (achievements.length === 0) {
            if(noAchievementsMsg) noAchievementsMsg.classList.remove('hidden');
            return;
        } else {
            if(noAchievementsMsg) noAchievementsMsg.classList.add('hidden');
        }


        if (!this.uiManager.achievementCardTemplate) {
            this.uiManager.achievementCardTemplate = (ach) => {
                const isLocked = !ach.unlocked;
                const name = (isLocked && ach.hidden) ? (loc.getString('hidden_achievement_name') || '???') : ach.name;
                const description = (isLocked && ach.hidden) ? (loc.getString('hidden_achievement_desc') || 'Unlock to reveal.') : ach.description;
                const icon = (isLocked && ach.hidden) ? (ach.definition.hiddenIcon || 'assets/images/ui/achievements/placeholder-hidden.png') : ach.icon;
                const date = ach.unlockDate ? new Date(ach.unlockDate).toLocaleDateString() : '';
                const rarityText = loc.getString(`rarity_${ach.rarity}`) || ach.rarity.charAt(0).toUpperCase() + ach.rarity.slice(1);

                let progressText = '';
                if (ach.definition.type === 'progress' && ach.targetProgress && ach.targetProgress > 1 && !isLocked) {
                    progressText = `(${ach.progress || 0} / ${ach.targetProgress})`;
                } else if (ach.definition.type === 'progress' && isLocked && ach.targetProgress > 1 && !ach.hidden) {
                     progressText = `(${(ach.progress || 0)} / ${ach.targetProgress})`; // Show progress even if locked but not hidden
                }


                return `
                <div class="achievement-card ${isLocked ? 'locked' : 'unlocked'}" data-achievement-id="${ach.id}">
                    <div class="achievement-icon-container">
                        <img src="${icon}" alt="${name}" class="achievement-icon">
                        ${isLocked ? `<span class="locked-overlay">${loc.getString('locked_overlay_text') || 'Locked'}</span>` : ''}
                    </div>
                    <div class="achievement-details">
                        <h3 class="achievement-name">${name} ${progressText}</h3>
                        <p class="achievement-description">${description}</p>
                        ${ach.unlocked && date ? `<p class="achievement-unlock-date">${loc.getString('unlocked_on_date', { date })}</p>` : ''}
                        <p class="achievement-rarity">${loc.getString('rarity_label') || 'Rarity'}: <span class="rarity-${ach.rarity}">${rarityText}</span></p>
                    </div>
                </div>`;
            };
        }

        achievements.forEach(ach => {
            const cardWrapper = document.createElement('div'); // Wrapper for innerHTML parsing
            cardWrapper.innerHTML = this.uiManager.achievementCardTemplate(ach).trim();
            gridEl.appendChild(cardWrapper.firstChild);
        });
    }

    _setupAchievementGridEventListeners() {
        if (!this.achievementGridContainer) return;

        const filterSelect = this.uiManager.getElement('#achievement-filter', this.achievementGridContainer);
        if (filterSelect) filterSelect.addEventListener('change', (e) => {
            const sortSelect = this.uiManager.getElement('#achievement-sort', this.achievementGridContainer);
            this._populateAchievementGrid(e.target.value, sortSelect ? sortSelect.value : 'name');
        });

        const sortSelect = this.uiManager.getElement('#achievement-sort', this.achievementGridContainer);
        if (sortSelect) sortSelect.addEventListener('change', (e) => {
            const filterSelectCtrl = this.uiManager.getElement('#achievement-filter', this.achievementGridContainer);
            this._populateAchievementGrid(filterSelectCtrl ? filterSelectCtrl.value : 'all', e.target.value);
        });

        const backToHofBtn = this.uiManager.getElement('#back-to-hof-btn', this.achievementGridContainer);
        if (backToHofBtn) backToHofBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showHallOfFameScreen();
        });

        const backToMenuBtn = this.uiManager.getElement('#back-to-menu-achievements-btn', this.achievementGridContainer);
        if (backToMenuBtn) backToMenuBtn.addEventListener('click', () => {
            this.audioManager.playSound('ui_cancel', 'sfx/ui/cancel_action.wav');
            InteractiveAdventure.menuController.showMenu();
        });
    }

    /**
     * @method refreshAchievementsDisplay
     * @description Called by AchievementSystem when an achievement is unlocked to update relevant views.
     */
    refreshAchievementsDisplay() {
        const currentState = InteractiveAdventure.gameEngine.getCurrentState();
        if (currentState === InteractiveAdventure.gameEngine.GAME_STATES.HALL_OF_FAME && this.hallOfFameContainer) {
            this._populateHallOfFame();
        } else if (currentState === InteractiveAdventure.gameEngine.GAME_STATES.ACHIEVEMENTS_GRID && this.achievementGridContainer) {
            const filterSelect = this.uiManager.getElement('#achievement-filter', this.achievementGridContainer);
            const sortSelect = this.uiManager.getElement('#achievement-sort', this.achievementGridContainer);
            this._populateAchievementGrid(
                filterSelect ? filterSelect.value : 'all',
                sortSelect ? sortSelect.value : 'name'
            );
        }
    }
}

// Make sure AudioManager is accessible if not passed directly
Object.defineProperty(HallOfFameController.prototype, 'audioManager', {
    get: function() {
        return InteractiveAdventure.audioManager;
    }
});


export default HallOfFameController;
