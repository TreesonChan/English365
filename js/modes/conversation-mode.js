(function initConversationMode(window) {
  'use strict';

  var modes = window.English365Modes || {};

  function disabledAttr(enabled) {
    return enabled ? '' : ' disabled aria-disabled="true"';
  }

  function renderConversationChoices(state) {
    var ui = window.English365UI;
    return window.English365Corpus.getConversationsByScene(state.scene).map(function renderChoice(conversation) {
      var active = conversation.id === state.currentConversationId ? ' is-active' : '';
      return '<button class="pill' + active + '" type="button" data-action="select-conversation" data-conversation-id="' + ui.escapeHtml(conversation.id) + '">' + ui.escapeHtml(conversation.title) + '</button>';
    }).join('');
  }

  function render(store, state) {
    var ui = window.English365UI;
    var conversation = store.getCurrentConversation();
    if (!conversation) {
      return ui.backBar('Conversation Mode', state.scene) + '<section class="practice-card"><p>No conversations available.</p></section>';
    }
    var turn = conversation.turns[state.currentTurnIndex];
    var isUserPrompt = Array.isArray(turn.answers);
    var progress = state.currentTurnIndex + 1 + ' / ' + conversation.turns.length;
    var reveal = isUserPrompt
      ? (state.answerVisible ? '<div class="answer-panel"><p class="eyebrow">Your Line</p>' + ui.answerList(turn.answers) + '</div>' : '<button class="primary-button full" type="button" data-action="show-answer">Show Answer</button>')
      : (state.chineseVisible ? '<div class="answer-panel"><p class="eyebrow">Chinese</p><p>' + ui.escapeHtml(turn.cn) + '</p></div>' : '<button class="primary-button full" type="button" data-action="show-chinese">Show Chinese</button>');
    var prompt = isUserPrompt
      ? '<p class="eyebrow">' + ui.escapeHtml(turn.role) + '</p><h3>' + ui.escapeHtml(turn.cn) + '</h3>'
      : '<p class="eyebrow">' + ui.escapeHtml(turn.role) + '</p><h3>' + ui.escapeHtml(turn.en) + '</h3>';

    return [
      ui.backBar('Conversation Mode', conversation.scene),
      '<section class="section-block"><div class="pill-row">' + renderConversationChoices(state) + '</div></section>',
      '<section class="practice-card">',
      '<div class="card-header"><div><p class="eyebrow">' + ui.escapeHtml(conversation.title) + '</p><strong>' + ui.escapeHtml(progress) + '</strong></div></div>',
      prompt,
      reveal,
      window.English365UI.rateControl(state.prefs.speechRate),
      ui.primaryActions(),
      '<div class="nav-row">',
      '<button class="secondary-button" type="button" data-action="prev-turn"' + disabledAttr(store.canPrevTurn()) + '>Previous</button>',
      '<button class="primary-button" type="button" data-action="next-turn"' + disabledAttr(store.canNextTurn()) + '>Next</button>',
      '</div>',
      '</section>',
    ].join('');
  }

  modes.conversation = { render: render };
  window.English365Modes = modes;
})(window);
