// storage.js - LocalStorage management for Sudoku PWA

const Storage = {
    keys: {
        CURRENT_GAME: 'sudoku_current_game',
        COMPLETED_LEVELS: 'sudoku_completed_levels',
        SETTINGS: 'sudoku_settings',
        CLOUD_META: 'sudoku_cloud_meta'
    },

    // Save current game state
    saveCurrentGame(gameState) {
        try {
            localStorage.setItem(this.keys.CURRENT_GAME, JSON.stringify(gameState));
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    },

    // Load current game state
    loadCurrentGame() {
        try {
            const data = localStorage.getItem(this.keys.CURRENT_GAME);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load game:', e);
            return null;
        }
    },

    // Clear current game
    clearCurrentGame() {
        try {
            localStorage.removeItem(this.keys.CURRENT_GAME);
            return true;
        } catch (e) {
            console.error('Failed to clear game:', e);
            return false;
        }
    },

    // Mark level as completed
    markLevelCompleted(difficulty, levelNumber, time, mistakes) {
        try {
            const completed = this.getCompletedLevels();
            const key = `${difficulty}_${levelNumber}`;
            
            if (!completed[key] || completed[key].time > time) {
                completed[key] = { time, mistakes, completedAt: Date.now() };
            }
            
            localStorage.setItem(this.keys.COMPLETED_LEVELS, JSON.stringify(completed));
            return true;
        } catch (e) {
            console.error('Failed to mark level completed:', e);
            return false;
        }
    },

    // Get all completed levels
    getCompletedLevels() {
        try {
            const data = localStorage.getItem(this.keys.COMPLETED_LEVELS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Failed to get completed levels:', e);
            return {};
        }
    },

    // Replace all completed levels (used for cloud sync/restore)
    saveCompletedLevels(completedMap) {
        try {
            localStorage.setItem(this.keys.COMPLETED_LEVELS, JSON.stringify(completedMap || {}));
            return true;
        } catch (e) {
            console.error('Failed to save completed levels:', e);
            return false;
        }
    },

    // Check if level is completed
    isLevelCompleted(difficulty, levelNumber) {
        const completed = this.getCompletedLevels();
        return !!completed[`${difficulty}_${levelNumber}`];
    },

    // Save settings
    saveSettings(settings) {
        try {
            localStorage.setItem(this.keys.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Failed to save settings:', e);
            return false;
        }
    },

    // Load settings
    loadSettings() {
        try {
            const data = localStorage.getItem(this.keys.SETTINGS);
            return data ? JSON.parse(data) : {
                soundEnabled: true,
                highlightEnabled: true
            };
        } catch (e) {
            console.error('Failed to load settings:', e);
            return { soundEnabled: true, highlightEnabled: true };
        }
    }
    ,

    // Cloud meta (last sync time, updatedAt)
    saveCloudMeta(meta) {
        try {
            localStorage.setItem(this.keys.CLOUD_META, JSON.stringify(meta));
            return true;
        } catch (e) {
            console.error('Failed to save cloud meta:', e);
            return false;
        }
    },

    loadCloudMeta() {
        try {
            const data = localStorage.getItem(this.keys.CLOUD_META);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load cloud meta:', e);
            return null;
        }
    }
};
