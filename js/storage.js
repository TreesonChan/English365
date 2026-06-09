(function initStorage(window) {
  'use strict';

  var keys = window.English365Config.storageKeys;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readJson(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch (error) {
      return clone(fallback);
    }
  }

  function writeJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function createDefaultStats() {
    return {
      totalLearned: 0,
      todayCompleted: 0,
      listeningCount: 0,
      conversationCount: 0,
      favoriteCount: 0,
      mistakeCount: 0,
      streakDays: 0,
      lastStudyDate: null,
      totalLearningMs: 0,
      dailyLearningMs: {},
    };
  }

  function createDefaultPrefs() {
    return {
      speechRate: 1,
      lastMode: window.English365Config.defaultMode,
      lastScene: window.English365Config.defaultScene,
    };
  }

  function createDefaultRecent() {
    return {
      lastMode: null,
      lastScene: null,
      lastItemId: null,
    };
  }

  function createDefaultProgress() {
    return {
      sentenceCurrentIndex: 0,
      conversationCurrentIndex: 0,
      conversationTurnIndex: 0,
      listeningCurrentIndex: 0,
      listeningChallengeCurrentIndex: 0,
      phraseCurrentIndex: 0,
      favoritesCurrentIndex: 0,
      mistakesCurrentIndex: 0,
    };
  }

  var storage = {
    keys: keys,
    readJson: readJson,
    writeJson: writeJson,
    getFavorites: function getFavorites() {
      return readJson(keys.favorites, {});
    },
    saveFavorites: function saveFavorites(favorites) {
      writeJson(keys.favorites, favorites);
    },
    getMistakes: function getMistakes() {
      return readJson(keys.mistakes, {});
    },
    saveMistakes: function saveMistakes(mistakes) {
      writeJson(keys.mistakes, mistakes);
    },
    getStats: function getStats() {
      return Object.assign(createDefaultStats(), readJson(keys.stats, createDefaultStats()));
    },
    saveStats: function saveStats(stats) {
      writeJson(keys.stats, stats);
    },
    getRecent: function getRecent() {
      return Object.assign(createDefaultRecent(), readJson(keys.recent, createDefaultRecent()));
    },
    saveRecent: function saveRecent(recent) {
      writeJson(keys.recent, Object.assign(createDefaultRecent(), recent));
    },
    getPrefs: function getPrefs() {
      return Object.assign(createDefaultPrefs(), readJson(keys.prefs, createDefaultPrefs()));
    },
    savePrefs: function savePrefs(prefs) {
      writeJson(keys.prefs, Object.assign(createDefaultPrefs(), prefs));
    },
    getProgress: function getProgress() {
      return Object.assign(createDefaultProgress(), readJson(keys.progress, createDefaultProgress()));
    },
    saveProgress: function saveProgress(progress) {
      writeJson(keys.progress, Object.assign(createDefaultProgress(), progress));
    },
    createDefaultStats: createDefaultStats,
    createDefaultPrefs: createDefaultPrefs,
    createDefaultRecent: createDefaultRecent,
    createDefaultProgress: createDefaultProgress,
  };

  window.English365Storage = storage;
})(window);
