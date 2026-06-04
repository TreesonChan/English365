(function initMistakesMode(window) {
  'use strict';

  var modes = window.English365Modes || {};

  function renderItem(key, ref) {
    var ui = window.English365UI;
    var item = window.English365Corpus.resolveRef(ref);
    if (!item) {
      return '';
    }
    var cn = item.cn || '';
    var en = item.en || (item.answers && item.answers[0]) || '';
    return [
      '<article class="list-card">',
      '<div><p class="eyebrow">' + ui.escapeHtml(ui.sceneName(ref.scene)) + ' · Wrong ' + ref.wrongCount + ' · Correct ' + ref.correctCount + '</p>',
      '<h3>' + ui.escapeHtml(cn) + '</h3>',
      '<p>' + ui.escapeHtml(en) + '</p></div>',
      '<div class="list-actions">',
      '<button class="secondary-button" type="button" data-action="practice-ref" data-ref-key="' + ui.escapeHtml(key) + '">Practice</button>',
      '<button class="success-button" type="button" data-action="correct-ref" data-ref-key="' + ui.escapeHtml(key) + '">Correct</button>',
      '<button class="danger-button" type="button" data-action="wrong-ref" data-ref-key="' + ui.escapeHtml(key) + '">Wrong</button>',
      '</div>',
      '</article>',
    ].join('');
  }

  function render(store, state) {
    var ui = window.English365UI;
    var keys = Object.keys(state.mistakes);
    var list = keys.length ? keys.map(function renderMistake(key) {
      return renderItem(key, state.mistakes[key]);
    }).join('') : '<section class="empty-state"><h3>No mistakes right now.</h3><p>Items graduate after three correct answers.</p></section>';

    return [
      ui.backBar('Mistakes Mode', state.scene),
      '<section class="list-stack">' + list + '</section>',
    ].join('');
  }

  modes.mistakes = { render: render };
  window.English365Modes = modes;
})(window);
