(function initStatisticsMode(window) {
  'use strict';

  var modes = window.English365Modes || {};

  function renderSummaryCard(icon, label, value, unit) {
    var ui = window.English365UI;
    return [
      '<article class="learning-time-card statistics-metric-card">',
      '<span class="metric-icon" aria-hidden="true">' + ui.escapeHtml(icon) + '</span>',
      '<small>' + ui.escapeHtml(label) + '</small>',
      '<strong>' + ui.escapeHtml(value) + '</strong>',
      unit ? '<span>' + ui.escapeHtml(unit) + '</span>' : '',
      '</article>',
    ].join('');
  }

  function renderHeatmapDay(day) {
    var ui = window.English365UI;
    var label = day.date + ': ' + day.minutes + ' minute' + (day.minutes === 1 ? '' : 's');
    return [
      '<button class="heatmap-day level-' + day.level + '" type="button" ',
      'data-action="select-heatmap-day" ',
      'data-date="' + ui.escapeHtml(day.date) + '" ',
      'data-minutes="' + day.minutes + '" ',
      'title="' + ui.escapeHtml(label) + '" ',
      'aria-label="' + ui.escapeHtml(label) + '"></button>',
    ].join('');
  }

  function renderModeProgress(store) {
    var ui = window.English365UI;
    return store.getDashboardProgress().map(function renderRow(item) {
      var percent = item.total ? Math.round((item.current / item.total) * 100) : 0;
      return [
        '<article class="journey-row statistics-progress-row">',
        '<div class="journey-row-header">',
        '<span>' + ui.escapeHtml(item.modeLabel) + '</span>',
        '<strong>' + ui.escapeHtml(percent) + '%</strong>',
        '</div>',
        '<div class="journey-progress" aria-hidden="true"><i class="journey-progress-fill" style="width: ' + ui.escapeHtml(percent) + '%;"></i></div>',
        '</article>',
      ].join('');
    }).join('');
  }

  function render(store, state) {
    var ui = window.English365UI;
    var stats = state.stats;
    var todayMinutes = window.English365Stats.getTodayLearningMinutes(stats);
    var totalMinutes = window.English365Stats.getTotalLearningMinutes(stats);
    var days = window.English365Stats.getLearningHeatmap(stats);
    var heatmap = days.map(renderHeatmapDay).join('');

    return [
      ui.backBar('Learning Statistics', state.scene),
      '<section class="statistics-overview-grid">',
      renderSummaryCard('⏱', "Today's Learning Time", todayMinutes, 'minutes'),
      renderSummaryCard('📚', 'Total Learning Time', totalMinutes, 'minutes'),
      renderSummaryCard('❤️', 'Favorites', stats.favoriteCount, 'saved'),
      renderSummaryCard('❌', 'Mistakes', stats.mistakeCount, 'to review'),
      '</section>',
      '<section class="practice-card statistics-card learning-time-panel">',
      '<div class="statistics-header">',
      '<div><p class="eyebrow">Learning Time</p><h3>Daily Activity</h3></div>',
      '<span>local only</span>',
      '</div>',
      '<div class="learning-time-grid compact-time-grid">',
      renderSummaryCard('🎯', "Today's Learning Time", todayMinutes, 'minutes'),
      renderSummaryCard('🏁', 'Total Learning Time', totalMinutes, 'minutes'),
      '</div>',
      '</section>',
      '<section class="practice-card statistics-card year-heatmap-card">',
      '<div class="statistics-header">',
      '<div>',
      '<p class="eyebrow">Year Heatmap</p>',
      '<h3>Daily Activity</h3>',
      '</div>',
      '<span>tap a day for minutes</span>',
      '</div>',
      '<div class="heatmap-scroll" role="region" aria-label="Daily learning time for past 1 year">',
      '<div class="heatmap-grid">' + heatmap + '</div>',
      '</div>',
      '<p id="heatmap-day-detail" class="heatmap-day-detail" aria-live="polite">Tap a day to see exact minutes.</p>',
      '<div class="heatmap-legend"><span>Less</span><i class="level-0"></i><i class="level-1"></i><i class="level-2"></i><i class="level-3"></i><i class="level-4"></i><span>More</span></div>',
      '</section>',
      '<section class="practice-card statistics-card mode-progress-card">',
      '<div class="statistics-header">',
      '<div><p class="eyebrow">Mode Progress</p><h3>Learning Journey</h3></div>',
      '</div>',
      '<div class="journey-list">' + renderModeProgress(store) + '</div>',
      '</section>',
    ].join('');
  }

  modes.statistics = { render: render };
  window.English365Modes = modes;
})(window);
