(function initMistakesMode(window) {
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
      '<div><p class="eyebrow">' + ui.escapeHtml(item.category) + ' · Wrong ' + ref.wrongCount + ' · Correct ' + ref.correctCount + '</p>',
      '<h3>' + ui.escapeHtml(item.phrase) + '</h3>',
      '<p>' + ui.escapeHtml(item.meaning) + '</p></div>',
      '<div class="list-actions">',
      '<button class="secondary-button" type="button" data-action="practice-ref" data-ref-key="' + ui.escapeHtml(key) + '">Practice</button>',
      '<button class="success-button" type="button" data-action="correct-ref" data-ref-key="' + ui.escapeHtml(key) + '">Correct</button>',
      '<button class="danger-button" type="button" data-action="wrong-ref" data-ref-key="' + ui.escapeHtml(key) + '">Wrong</button>',
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
      '<div><p class="eyebrow">' + ui.escapeHtml(conversation ? conversation.title : 'Conversation') + ' · Wrong ' + ref.wrongCount + ' · Correct ' + ref.correctCount + '</p>',
      '<h3>' + ui.escapeHtml(item.cn || en) + '</h3>',
      '<p>' + ui.escapeHtml(en) + '</p></div>',
      '<div class="list-actions">',
      '<button class="secondary-button" type="button" data-action="practice-ref" data-ref-key="' + ui.escapeHtml(key) + '">Practice</button>',
      '<button class="success-button" type="button" data-action="correct-ref" data-ref-key="' + ui.escapeHtml(key) + '">Correct</button>',
      '<button class="danger-button" type="button" data-action="wrong-ref" data-ref-key="' + ui.escapeHtml(key) + '">Wrong</button>',
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

  function renderNav(store) {
    return [
      '<div class="nav-row list-nav">',
      '<button class="secondary-button" type="button" data-action="prev-mistake"' + disabledAttr(store.canPrevMistake()) + '>Previous</button>',
      '<button class="primary-button" type="button" data-action="next-mistake"' + disabledAttr(store.canNextMistake()) + '>Next</button>',
      '</div>',
    ].join('');
  }

  function render(store, state) {
    var ui = window.English365UI;
    var keys = Object.keys(state.mistakes);
    var list = keys.length ? [
      renderNav(store),
      '<section class="list-stack">',
      keys.map(function renderMistake(key) {
        return renderItem(key, state.mistakes[key], state.currentMistakeKey);
      }).join(''),
      '</section>',
    ].join('') : '<section class="empty-state"><h3>No mistakes right now.</h3><p>Items graduate after three correct answers.</p></section>';

    return [
      ui.backBar('Mistakes Mode', state.scene),
      list,
    ].join('');
  }

  modes.mistakes = { render: render };
  window.English365Modes = modes;
})(window);
