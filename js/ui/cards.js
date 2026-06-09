(function initCards(window) {
  'use strict';

  var ui = window.English365UI || {};

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sceneName(sceneId) {
    var scene = window.English365Corpus.getScene(sceneId);
    return scene ? scene.name : sceneId;
  }

  function sceneIcon(sceneId) {
    var icons = {
      'daily-life': '🏠',
      hotel: '🏨',
      travel: '✈️',
      transportation: '🚇',
      restaurant: '🍽',
      office: '🏢',
      meeting: '👥',
      business: '💼',
      sports: '🏃',
      entertainment: '🎬',
    };
    return icons[sceneId] || '📍';
  }

  function modeLabel(modeId) {
    var mode = window.English365Config.modes.find(function findMode(item) {
      return item.id === modeId;
    });
    return mode ? mode.label : modeId;
  }

  function learningMinutes(stats) {
    return Math.ceil((Number(stats.totalLearningMs) || 0) / 60000);
  }

  function statCard(stats) {
    return [
      '<section class="stats-grid metrics-grid" aria-label="Learning statistics">',
      statItem('📚', 'Total Learned', stats.totalLearned),
      statItem('⏱', 'Learning Time', learningMinutes(stats) + 'm'),
      statItem('🎯', 'Today Completed', stats.todayCompleted),
      statItem('🔥', 'Learning Streak', stats.streakDays),
      statItem('❤️', 'Favorites', stats.favoriteCount),
      statItem('❌', 'Mistakes', stats.mistakeCount),
      '</section>',
    ].join('');
  }

  function statItem(icon, label, value) {
    return [
      '<div class="stat-card metric-card">',
      '<span class="metric-icon" aria-hidden="true">' + escapeHtml(icon) + '</span>',
      '<strong>' + escapeHtml(value) + '</strong>',
      '<span>' + escapeHtml(label) + '</span>',
      '</div>',
    ].join('');
  }

  function backBar(title, sceneId) {
    return [
      '<div class="top-bar">',
      '<button class="icon-button" type="button" data-action="go-home" aria-label="Home">‹</button>',
      '<div><p class="eyebrow">' + escapeHtml(sceneName(sceneId)) + '</p><h2>' + escapeHtml(title) + '</h2></div>',
      '</div>',
    ].join('');
  }

  function progressIndicator(label, current, total) {
    var safeTotal = Math.max(0, Number(total) || 0);
    var safeCurrent = safeTotal ? Math.min(Math.max(Number(current) || 1, 1), safeTotal) : 0;
    var remaining = Math.max(safeTotal - safeCurrent, 0);
    var percent = safeTotal ? (safeCurrent / safeTotal) * 100 : 0;
    var percentText = percent.toFixed(1);
    return [
      '<section class="progress-strip" aria-label="Learning progress">',
      '<div class="progress-strip-header">',
      '<div class="progress-copy">',
      '<strong>' + escapeHtml(label) + ' ' + escapeHtml(safeCurrent) + ' / ' + escapeHtml(safeTotal) + '</strong>',
      '<span>' + escapeHtml(percentText) + '% Complete</span>',
      '</div>',
      '<span class="progress-remaining">' + escapeHtml(remaining) + ' remaining</span>',
      '</div>',
      '<div class="progress-bar" aria-hidden="true"><i class="progress-bar-fill" style="width: ' + escapeHtml(percentText) + '%;"></i></div>',
      '</section>',
    ].join('');
  }

  function jumpDialog(value, total) {
    var safeTotal = Math.max(0, Number(total) || 0);
    var safeValue = value || '1';
    return [
      '<div class="jump-modal-backdrop">',
      '<section class="jump-modal" role="dialog" aria-modal="true" aria-labelledby="jump-title">',
      '<h3 id="jump-title">Jump to item number</h3>',
      '<p>Valid range: 1 - ' + escapeHtml(safeTotal) + '</p>',
      '<input class="jump-input" type="number" inputmode="numeric" min="1" max="' + escapeHtml(safeTotal) + '" value="' + escapeHtml(safeValue) + '" data-action="jump-to-input" aria-label="Jump to item number">',
      '<div class="jump-modal-actions">',
      '<button class="secondary-button" type="button" data-action="close-jump">Cancel</button>',
      '<button class="primary-button" type="button" data-action="submit-jump">Go</button>',
      '</div>',
      '</section>',
      '</div>',
    ].join('');
  }

  function scenePills(activeScene) {
    return window.English365Corpus.getScenes().map(function renderScene(scene) {
      var active = scene.id === activeScene ? ' is-active' : '';
      return '<button class="pill scene-pill' + active + '" type="button" data-action="select-scene" data-scene="' + escapeHtml(scene.id) + '">' + escapeHtml(sceneIcon(scene.id) + ' ' + scene.name) + '</button>';
    }).join('');
  }

  function rateControl(currentRate) {
    return [
      '<div class="rate-control" aria-label="Speech rate">',
      window.English365Config.speechRates.map(function renderRate(rate) {
        var active = Number(currentRate) === rate ? ' is-active' : '';
        return '<button class="rate-button' + active + '" type="button" data-action="set-rate" data-rate="' + rate + '">' + rate + 'x</button>';
      }).join(''),
      '</div>',
    ].join('');
  }

  function answerList(answers) {
    return '<ol class="answer-list">' + answers.map(function renderAnswer(answer) {
      return '<li>' + escapeHtml(answer) + '</li>';
    }).join('') + '</ol>';
  }

  function primaryActions() {
    return [
      '<div class="action-grid evaluation-grid">',
      '<button class="secondary-button" type="button" data-action="play-current">Play Audio</button>',
      '<button class="secondary-button" type="button" data-action="toggle-favorite-current">Favorite</button>',
      '<button class="success-button" type="button" data-action="mark-correct-current">✓ I Got It</button>',
      '<button class="danger-button" type="button" data-action="mark-wrong-current">✗ Still Need Practice</button>',
      '</div>',
    ].join('');
  }

  ui.escapeHtml = escapeHtml;
  ui.sceneName = sceneName;
  ui.sceneIcon = sceneIcon;
  ui.modeLabel = modeLabel;
  ui.statCard = statCard;
  ui.backBar = backBar;
  ui.progressIndicator = progressIndicator;
  ui.jumpDialog = jumpDialog;
  ui.scenePills = scenePills;
  ui.rateControl = rateControl;
  ui.answerList = answerList;
  ui.primaryActions = primaryActions;

  window.English365UI = ui;
})(window);
