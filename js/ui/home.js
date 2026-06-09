(function initHome(window) {
  'use strict';

  var modeMeta = {
    phrase: { icon: '🧩', shortLabel: 'Phrase', description: 'Speaking patterns' },
    sentence: { icon: '📝', shortLabel: 'Sentence', description: 'Practical sentences' },
    conversation: { icon: '💬', shortLabel: 'Conversation', description: 'Real dialogues' },
    listening: { icon: '🎧', shortLabel: 'Listening', description: 'Listen and repeat' },
    'listening-challenge': { icon: '🎯', shortLabel: 'Challenge', description: 'Audio challenge' },
    statistics: { icon: '📈', shortLabel: 'Stats', description: 'Progress' },
    favorites: { icon: '❤️', shortLabel: 'Favorites', description: 'Saved' },
    mistakes: { icon: '🔁', shortLabel: 'Mistakes', description: 'Review' },
  };

  var sceneLabels = {
    'daily-life': 'Daily',
    hotel: 'Hotel',
    travel: 'Travel',
    transportation: 'Transit',
    restaurant: 'Food',
    office: 'Office',
    meeting: 'Meeting',
    business: 'Business',
    sports: 'Sports',
    entertainment: 'Fun',
  };

  var primaryModes = ['sentence', 'phrase', 'conversation', 'listening'];
  var utilityModes = ['listening-challenge', 'favorites', 'mistakes', 'statistics'];

  function progressLine(progress) {
    return progress.current + ' / ' + progress.total;
  }

  function percent(progress) {
    return progress.total ? (progress.current / progress.total) * 100 : 0;
  }

  function compactPercent(progress) {
    return Math.round(percent(progress)) + '%';
  }

  function renderProgressBar(ui, progress, className) {
    var value = percent(progress).toFixed(1);
    return '<div class="' + ui.escapeHtml(className) + '" aria-hidden="true"><i style="width: ' + ui.escapeHtml(value) + '%;"></i></div>';
  }

  function defaultProgress(store) {
    return store.getRecentProgress() || store.getProgressForMode(window.English365Config.defaultMode);
  }

  function renderContinueCard(store, ui) {
    var recentProgress = defaultProgress(store);
    if (!recentProgress || !recentProgress.total) {
      return '';
    }
    return [
      '<section class="continue-hero-card ultra-compact-continue-card">',
      '<div class="continue-compact-copy">',
      '<p class="eyebrow">Continue Learning</p>',
      '<h1>' + ui.escapeHtml(recentProgress.modeLabel) + '</h1>',
      '<div class="continue-compact-meta">',
      '<strong>' + ui.escapeHtml(progressLine(recentProgress)) + '</strong>',
      '<span>' + ui.escapeHtml(compactPercent(recentProgress)) + '</span>',
      '</div>',
      renderProgressBar(ui, recentProgress, 'continue-progress-bar compact-progress-bar'),
      '</div>',
      '<button class="primary-button continue-cta compact-continue-button" type="button" data-action="continue-learning">Continue</button>',
      '</section>',
    ].join('');
  }

  function renderTodaySummary(ui, state) {
    return [
      '<section class="today-summary-section compact-today-section">',
      '<div class="today-stat-strip" aria-label="Today learning summary">',
      renderTodayStat(ui, '⏱', window.English365Stats.getTodayLearningMinutes(state.stats) + 'm'),
      renderTodayStat(ui, '🎯', state.stats.todayCompleted),
      '</div>',
      '</section>',
    ].join('');
  }

  function renderTodayStat(ui, icon, value) {
    return '<span class="today-stat"><span aria-hidden="true">' + ui.escapeHtml(icon) + '</span><strong>' + ui.escapeHtml(value) + '</strong></span>';
  }

  function findMode(modeId) {
    return window.English365Config.modes.find(function find(item) {
      return item.id === modeId;
    });
  }

  function renderModeButton(ui, modeId, compact) {
    var mode = findMode(modeId);
    if (!mode) {
      return '';
    }
    var meta = modeMeta[mode.id] || { icon: '✨', shortLabel: mode.label, description: 'Practice' };
    var className = compact ? 'utility-mode-button' : 'mode-card learning-mode-card compact-learning-mode-card';
    return [
      '<button class="' + className + '" type="button" data-action="open-mode" data-mode="' + ui.escapeHtml(mode.id) + '">',
      '<span class="mode-icon" aria-hidden="true">' + ui.escapeHtml(meta.icon) + '</span>',
      '<span class="mode-copy"><strong>' + ui.escapeHtml(compact ? mode.label : meta.shortLabel) + '</strong>',
      compact ? '<small>' + ui.escapeHtml(meta.description) + '</small>' : '',
      '</span>',
      '</button>',
    ].join('');
  }

  function renderPrimaryModes(ui) {
    return [
      '<section class="section-block mode-section compact-mode-section">',
      '<h2>Start Learning</h2>',
      '<div class="mode-grid primary-mode-grid">' + primaryModes.map(function render(modeId) {
        return renderModeButton(ui, modeId, false);
      }).join('') + '</div>',
      '</section>',
    ].join('');
  }

  function renderUtilities(ui) {
    return [
      '<details class="utility-section more-modes-drawer">',
      '<summary>More Modes</summary>',
      '<div class="utility-grid">' + utilityModes.map(function render(modeId) {
        return renderModeButton(ui, modeId, true);
      }).join('') + '</div>',
      '</details>',
    ].join('');
  }

  function renderScenes(ui, state) {
    return [
      '<section class="home-scene-section">',
      '<div class="home-scene-strip" aria-label="Practice scenes">',
      window.English365Corpus.getScenes().map(function renderScene(scene) {
        var active = scene.id === state.scene ? ' is-active' : '';
        var label = sceneLabels[scene.id] || scene.name;
        return '<button class="home-scene-chip' + active + '" type="button" data-action="select-scene" data-scene="' + ui.escapeHtml(scene.id) + '">' + ui.escapeHtml(label) + '</button>';
      }).join(''),
      '</div>',
      '</section>',
    ].join('');
  }

  function renderProgressDrawer(store, ui) {
    var rows = store.getDashboardProgress().map(function renderRow(item) {
      var value = Math.round(percent(item));
      return [
        '<article class="journey-row compact-journey-row">',
        '<div class="journey-row-header">',
        '<span>' + ui.escapeHtml(item.modeLabel) + '</span>',
        '<strong>' + ui.escapeHtml(value) + '%</strong>',
        '</div>',
        '<div class="journey-progress" aria-hidden="true"><i class="journey-progress-fill" style="width: ' + ui.escapeHtml(value) + '%;"></i></div>',
        '</article>',
      ].join('');
    }).join('');
    return [
      '<details class="progress-drawer">',
      '<summary>Show Progress</summary>',
      '<div class="journey-list compact-journey-list">' + rows + '</div>',
      '</details>',
    ].join('');
  }

  function renderHome(store, state) {
    var ui = window.English365UI;
    return [
      '<div class="learning-center mobile-learning-home">',
      renderContinueCard(store, ui),
      renderTodaySummary(ui, state),
      renderPrimaryModes(ui),
      renderUtilities(ui),
      renderScenes(ui, state),
      renderProgressDrawer(store, ui),
      '</div>',
    ].join('');
  }

  window.English365Home = {
    render: renderHome,
  };
})(window);
