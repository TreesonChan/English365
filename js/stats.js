(function initStats(window) {
  'use strict';

  function toDateString(date) {
    var value = date || new Date();
    return value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0') + '-' + String(value.getDate()).padStart(2, '0');
  }

  function dayNumber(dateString) {
    var parts = dateString.split('-').map(Number);
    return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
  }

  function recordCompletion(stats, kind, date) {
    var today = toDateString(date);
    var next = Object.assign(window.English365Storage.createDefaultStats(), stats);

    if (next.lastStudyDate !== today) {
      if (next.lastStudyDate && dayNumber(today) - dayNumber(next.lastStudyDate) === 1) {
        next.streakDays += 1;
      } else {
        next.streakDays = 1;
      }
      next.todayCompleted = 0;
      next.lastStudyDate = today;
    }

    next.totalLearned += 1;
    next.todayCompleted += 1;

    if (kind === 'listening' || kind === 'listening-challenge') {
      next.listeningCount += 1;
    }
    if (kind === 'conversation') {
      next.conversationCount += 1;
    }

    return next;
  }

  function syncDerivedCounts(stats, favorites, mistakes) {
    var next = Object.assign({}, stats);
    next.favoriteCount = Object.keys(favorites || {}).length;
    next.mistakeCount = Object.keys(mistakes || {}).length;
    return next;
  }

  window.English365Stats = {
    toDateString: toDateString,
    recordCompletion: recordCompletion,
    syncDerivedCounts: syncDerivedCounts,
  };
})(window);
