(function initStats(window) {
  'use strict';

  var MS_PER_MINUTE = 60000;
  var HEATMAP_DAYS = 365;

  function toDateString(date) {
    var value = date || new Date();
    return value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0') + '-' + String(value.getDate()).padStart(2, '0');
  }

  function dayNumber(dateString) {
    var parts = dateString.split('-').map(Number);
    return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
  }

  function dateStringFromDayNumber(value) {
    var date = new Date(value * 86400000);
    return toDateString(date);
  }

  function normalizeStats(stats) {
    var next = Object.assign(window.English365Storage.createDefaultStats(), stats || {});
    next.totalLearningMs = Number(next.totalLearningMs) || 0;
    next.dailyLearningMs = Object.assign({}, next.dailyLearningMs || {});
    return next;
  }

  function minutesFromMs(ms) {
    var value = Number(ms) || 0;
    return value > 0 ? Math.ceil(value / MS_PER_MINUTE) : 0;
  }

  function recordCompletion(stats, kind, date) {
    var today = toDateString(date);
    var next = normalizeStats(stats);

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

  function recordActiveTime(stats, elapsedMs, date) {
    var duration = Math.max(0, Number(elapsedMs) || 0);
    var next = normalizeStats(stats);
    if (!duration) {
      return next;
    }
    var dateKey = toDateString(date);
    next.totalLearningMs += duration;
    next.dailyLearningMs[dateKey] = (Number(next.dailyLearningMs[dateKey]) || 0) + duration;
    return next;
  }

  function getTodayLearningMinutes(stats, date) {
    var next = normalizeStats(stats);
    return minutesFromMs(next.dailyLearningMs[toDateString(date)] || 0);
  }

  function getTotalLearningMinutes(stats) {
    return minutesFromMs(normalizeStats(stats).totalLearningMs);
  }

  function getLearningHeatmap(stats, date) {
    var next = normalizeStats(stats);
    var endDay = dayNumber(toDateString(date));
    var days = [];
    var maxMinutes = 0;
    var index;

    for (index = HEATMAP_DAYS - 1; index >= 0; index -= 1) {
      var dateKey = dateStringFromDayNumber(endDay - index);
      var minutes = minutesFromMs(next.dailyLearningMs[dateKey] || 0);
      maxMinutes = Math.max(maxMinutes, minutes);
      days.push({ date: dateKey, minutes: minutes, level: 0 });
    }

    days.forEach(function assignLevel(day) {
      if (day.minutes === 0) {
        day.level = 0;
      } else if (maxMinutes <= 4) {
        day.level = Math.min(4, day.minutes);
      } else {
        day.level = Math.max(1, Math.ceil((day.minutes / maxMinutes) * 4));
      }
    });

    return days;
  }

  function syncDerivedCounts(stats, favorites, mistakes) {
    var next = normalizeStats(stats);
    next.favoriteCount = Object.keys(favorites || {}).length;
    next.mistakeCount = Object.keys(mistakes || {}).length;
    return next;
  }

  window.English365Stats = {
    toDateString: toDateString,
    dayNumber: dayNumber,
    minutesFromMs: minutesFromMs,
    recordCompletion: recordCompletion,
    recordActiveTime: recordActiveTime,
    getTodayLearningMinutes: getTodayLearningMinutes,
    getTotalLearningMinutes: getTotalLearningMinutes,
    getLearningHeatmap: getLearningHeatmap,
    syncDerivedCounts: syncDerivedCounts,
  };
})(window);
