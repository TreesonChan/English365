(function initCards(window) {
  'use strict';

  var ui = window.English365UI || {};

  function escapeHtml(value) {
    return String(value || '')
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

  function modeLabel(modeId) {
    var mode = window.English365Config.modes.find(function findMode(item) {
      return item.id === modeId;
    });
    return mode ? mode.label : modeId;
  }

  function statCard(stats) {
    return [
      '<section class="stats-grid" aria-label="Learning statistics">',
      statItem('累计学习', stats.totalLearned),
      statItem('今日完成', stats.todayCompleted),
      statItem('连续学习', stats.streakDays),
      statItem('收藏数量', stats.favoriteCount),
      statItem('错题数量', stats.mistakeCount),
      '</section>',
    ].join('');
  }

  function statItem(label, value) {
    return '<div class="stat-card"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>';
  }

  function backBar(title, sceneId) {
    return [
      '<div class="top-bar">',
      '<button class="icon-button" type="button" data-action="go-home" aria-label="Home">‹</button>',
      '<div><p class="eyebrow">' + escapeHtml(sceneName(sceneId)) + '</p><h2>' + escapeHtml(title) + '</h2></div>',
      '</div>',
    ].join('');
  }

  function scenePills(activeScene) {
    return window.English365Corpus.getScenes().map(function renderScene(scene) {
      var active = scene.id === activeScene ? ' is-active' : '';
      return '<button class="pill' + active + '" type="button" data-action="select-scene" data-scene="' + escapeHtml(scene.id) + '">' + escapeHtml(scene.name) + '</button>';
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
      '<div class="action-grid">',
      '<button class="secondary-button" type="button" data-action="play-current">Play Audio</button>',
      '<button class="secondary-button" type="button" data-action="toggle-favorite-current">Favorite</button>',
      '<button class="success-button" type="button" data-action="mark-correct-current">Correct</button>',
      '<button class="danger-button" type="button" data-action="mark-wrong-current">Wrong</button>',
      '</div>',
    ].join('');
  }

  ui.escapeHtml = escapeHtml;
  ui.sceneName = sceneName;
  ui.modeLabel = modeLabel;
  ui.statCard = statCard;
  ui.backBar = backBar;
  ui.scenePills = scenePills;
  ui.rateControl = rateControl;
  ui.answerList = answerList;
  ui.primaryActions = primaryActions;

  window.English365UI = ui;
})(window);
