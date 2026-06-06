(function initConfig(window) {
  'use strict';

  window.English365Config = {
    appName: 'American English Trainer',
    version: 'V1.1.2',
    defaultMode: 'sentence',
    defaultScene: 'daily-life',
    speechRates: [0.8, 1, 1.2, 1.5, 2],
    storageKeys: {
      favorites: 'e365:v1:favorites',
      mistakes: 'e365:v1:mistakes',
      stats: 'e365:v1:stats',
      recent: 'e365:v1:recent',
      prefs: 'e365:v1:prefs',
    },
    modes: [
      { id: 'sentence', label: 'Sentence Mode' },
      { id: 'conversation', label: 'Conversation Mode' },
      { id: 'listening', label: 'Listening Mode' },
      { id: 'listening-challenge', label: 'Listening Challenge Mode' },
      { id: 'statistics', label: 'Learning Statistics' },
      { id: 'favorites', label: 'Favorites Mode' },
      { id: 'mistakes', label: 'Mistakes Mode' },
    ],
  };
})(window);
