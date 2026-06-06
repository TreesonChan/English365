(function initStatisticsMode(window) {
  'use strict';

  var modes = window.English365Modes || {};

  function renderSummaryCard(label, value) {
    var ui = window.English365UI;
    return [
      '<article class="learning-time-card">',
      '<span>' + ui.escapeHtml(label) + '</span>',
      '<strong>' + ui.escapeHtml(value) + '</strong>',
      '<small>minutes</small>',
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

  function render(store, state) {
    var ui = window.English365UI;
    var stats = state.stats;
    var todayMinutes = window.English365Stats.getTodayLearningMinutes(stats);
    var totalMinutes = window.English365Stats.getTotalLearningMinutes(stats);
    var days = window.English365Stats.getLearningHeatmap(stats);
    var heatmap = days.map(renderHeatmapDay).join('');

    return [
      ui.backBar('Learning Statistics', state.scene),
      '<section class="learning-time-grid">',
      renderSummaryCard("Today's Learning Time", todayMinutes),
      renderSummaryCard('Total Learning Time', totalMinutes),
      '</section>',
      '<section class="practice-card statistics-card">',
      '<div class="statistics-header">',
      '<div>',
      '<p class="eyebrow">Past 1 Year</p>',
      '<h3>Daily Learning Time</h3>',
      '</div>',
      '<span>tap a day for minutes</span>',
      '</div>',
      '<div class="heatmap-scroll" role="region" aria-label="Daily learning time for past 1 year">',
      '<div class="heatmap-grid">' + heatmap + '</div>',
      '</div>',
      '<p id="heatmap-day-detail" class="heatmap-day-detail" aria-live="polite">Tap a day to see exact minutes.</p>',
      '<div class="heatmap-legend"><span>Less</span><i class="level-0"></i><i class="level-1"></i><i class="level-2"></i><i class="level-3"></i><i class="level-4"></i><span>More</span></div>',
      '</section>',
    ].join('');
  }

  modes.statistics = { render: render };
  window.English365Modes = modes;
})(window);
