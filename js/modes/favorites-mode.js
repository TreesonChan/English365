(function initFavoritesMode(window) {
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
      '<div><p class="eyebrow">' + ui.escapeHtml(ui.sceneName(ref.scene)) + '</p>',
      '<h3>' + ui.escapeHtml(cn) + '</h3>',
      '<p>' + ui.escapeHtml(en) + '</p></div>',
      '<div class="list-actions">',
      '<button class="secondary-button" type="button" data-action="practice-ref" data-ref-key="' + ui.escapeHtml(key) + '">Practice</button>',
      '<button class="danger-button" type="button" data-action="remove-favorite" data-ref-key="' + ui.escapeHtml(key) + '">Remove</button>',
      '</div>',
      '</article>',
    ].join('');
  }

  function render(store, state) {
    var ui = window.English365UI;
    var keys = Object.keys(state.favorites);
    var list = keys.length ? keys.map(function renderFavorite(key) {
      return renderItem(key, state.favorites[key]);
    }).join('') : '<section class="empty-state"><h3>No favorites yet.</h3><p>Favorite useful lines while practicing.</p></section>';

    return [
      ui.backBar('Favorites Mode', state.scene),
      '<section class="list-stack">' + list + '</section>',
    ].join('');
  }

  modes.favorites = { render: render };
  window.English365Modes = modes;
})(window);
