(function initFavoritesMode(window) {
  'use strict';

  var modes = window.English365Modes || {};

  function disabledAttr(enabled) {
    return enabled ? '' : ' disabled aria-disabled="true"';
  }

  function activeClass(key, currentKey) {
    return key === currentKey ? ' is-active' : '';
  }

  function renderPhraseItem(key, ref, item, currentKey) {
    var ui = window.English365UI;
    return [
      '<article class="list-card' + activeClass(key, currentKey) + '">',
      '<div><p class="eyebrow">' + ui.escapeHtml(item.category) + '</p>',
      '<h3>' + ui.escapeHtml(item.phrase) + '</h3>',
      '<p>' + ui.escapeHtml(item.meaning) + '</p></div>',
      '<div class="list-actions">',
      '<button class="secondary-button" type="button" data-action="practice-ref" data-ref-key="' + ui.escapeHtml(key) + '">Practice</button>',
      '<button class="danger-button" type="button" data-action="remove-favorite" data-ref-key="' + ui.escapeHtml(key) + '">Remove</button>',
      '</div>',
      '</article>',
    ].join('');
  }

  function renderConversationItem(key, ref, item, currentKey) {
    var ui = window.English365UI;
    var conversation = window.English365Corpus.getConversationById(ref.conversationId);
    var en = item.en || (item.answers && item.answers[0]) || '';
    return [
      '<article class="list-card' + activeClass(key, currentKey) + '">',
      '<div><p class="eyebrow">' + ui.escapeHtml(conversation ? conversation.title : 'Conversation') + '</p>',
      '<h3>' + ui.escapeHtml(item.cn || en) + '</h3>',
      '<p>' + ui.escapeHtml(en) + '</p></div>',
      '<div class="list-actions">',
      '<button class="secondary-button" type="button" data-action="practice-ref" data-ref-key="' + ui.escapeHtml(key) + '">Practice</button>',
      '<button class="danger-button" type="button" data-action="remove-favorite" data-ref-key="' + ui.escapeHtml(key) + '">Remove</button>',
      '</div>',
      '</article>',
    ].join('');
  }

  function renderSentenceItem(key, ref, item, currentKey) {
    var ui = window.English365UI;
    var cn = item.cn || '';
    var en = item.en || (item.answers && item.answers[0]) || '';
    return [
      '<article class="list-card' + activeClass(key, currentKey) + '">',
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

  function renderItem(key, ref, currentKey) {
    var item = window.English365Corpus.resolveRef(ref);
    if (!item) {
      return '';
    }
    if (ref.type === 'phrase') {
      return renderPhraseItem(key, ref, item, currentKey);
    }
    if (ref.type === 'conversationTurn') {
      return renderConversationItem(key, ref, item, currentKey);
    }
    return renderSentenceItem(key, ref, item, currentKey);
  }

  function renderGroup(title, keys, favorites, currentKey, emptyText) {
    var content = keys.length ? [
      '<div class="list-stack">',
      keys.map(function renderFavorite(key) {
        return renderItem(key, favorites[key], currentKey);
      }).join(''),
      '</div>',
    ].join('') : '<p class="favorite-empty">' + window.English365UI.escapeHtml(emptyText) + '</p>';
    return [
      '<section class="favorite-group">',
      '<h3>' + window.English365UI.escapeHtml(title) + '</h3>',
      content,
      '</section>',
    ].join('');
  }

  function renderNav(store) {
    return [
      '<div class="nav-row list-nav">',
      '<button class="secondary-button" type="button" data-action="prev-favorite"' + disabledAttr(store.canPrevFavorite()) + '>Previous</button>',
      '<button class="primary-button" type="button" data-action="next-favorite"' + disabledAttr(store.canNextFavorite()) + '>Next</button>',
      '</div>',
    ].join('');
  }

  function render(store, state) {
    var ui = window.English365UI;
    var keys = Object.keys(state.favorites);
    var phraseKeys = keys.filter(function isPhrase(key) {
      return state.favorites[key].type === 'phrase';
    });
    var conversationKeys = keys.filter(function isConversation(key) {
      return state.favorites[key].type === 'conversationTurn';
    });
    var sentenceKeys = keys.filter(function isSentence(key) {
      return state.favorites[key].type === 'sentence';
    });
    var list = keys.length ? [
      renderNav(store),
      renderGroup('Favorite Sentences', sentenceKeys, state.favorites, state.currentFavoriteKey, 'No favorite sentences yet.'),
      renderGroup('Favorite Conversations', conversationKeys, state.favorites, state.currentFavoriteKey, 'No favorite conversations yet.'),
      renderGroup('Favorite Phrases', phraseKeys, state.favorites, state.currentFavoriteKey, 'No favorite phrases yet.'),
    ].join('') : '<section class="empty-state"><h3>No favorites yet.</h3><p>Favorite useful lines while practicing.</p></section>';

    return [
      ui.backBar('Favorites Mode', state.scene),
      list,
    ].join('');
  }

  modes.favorites = { render: render };
  window.English365Modes = modes;
})(window);
