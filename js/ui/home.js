(function initHome(window) {
  'use strict';

  function renderHome(store, state) {
    var ui = window.English365UI;
    var recent = window.English365Storage.getRecent();
    var hasRecent = recent.lastMode && recent.lastScene && recent.lastItemId;
    var continueHtml = hasRecent ? [
      '<section class="continue-card">',
      '<div>',
      '<p class="eyebrow">Continue Learning</p>',
      '<h2>' + ui.escapeHtml(ui.modeLabel(recent.lastMode)) + '</h2>',
      '<p>' + ui.escapeHtml(ui.sceneName(recent.lastScene)) + ' · ' + ui.escapeHtml(recent.lastItemId) + '</p>',
      '</div>',
      '<button class="primary-button" type="button" data-action="continue-learning">Continue</button>',
      '</section>',
    ].join('') : '';

    var modeButtons = window.English365Config.modes.map(function renderMode(mode) {
      return '<button class="mode-card" type="button" data-action="open-mode" data-mode="' + ui.escapeHtml(mode.id) + '"><span>' + ui.escapeHtml(mode.label) + '</span></button>';
    }).join('');

    return [
      '<header class="hero">',
      '<h1>American English Trainer</h1>',
      '<p>Speak American English Naturally</p>',
      '</header>',
      ui.statCard(state.stats),
      continueHtml,
      '<section class="section-block"><h2>Mode</h2><div class="mode-grid">' + modeButtons + '</div></section>',
      '<section class="section-block"><h2>Scene</h2><div class="pill-row">' + ui.scenePills(state.scene) + '</div></section>',
    ].join('');
  }

  window.English365Home = {
    render: renderHome,
  };
})(window);
