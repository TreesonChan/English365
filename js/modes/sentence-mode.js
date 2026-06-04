(function initSentenceMode(window) {
  'use strict';

  var modes = window.English365Modes || {};

  function render(store, state) {
    var ui = window.English365UI;
    var sentence = store.getCurrentSentence();
    if (!sentence) {
      return ui.backBar('Sentence Mode', state.scene) + '<section class="practice-card"><p>No sentences available.</p></section>';
    }

    return [
      ui.backBar('Sentence Mode', sentence.scene),
      '<section class="section-block"><div class="pill-row">' + ui.scenePills(sentence.scene) + '</div></section>',
      '<section class="practice-card">',
      '<p class="eyebrow">Chinese Prompt</p>',
      '<h3>' + ui.escapeHtml(sentence.cn) + '</h3>',
      state.answerVisible ? '<div class="answer-panel"><p class="eyebrow">American English</p>' + ui.answerList(sentence.answers) + '</div>' : '<button class="primary-button full" type="button" data-action="show-answer">Show Answer</button>',
      window.English365UI.rateControl(state.prefs.speechRate),
      ui.primaryActions(),
      '<button class="primary-button full" type="button" data-action="next-sentence">Next</button>',
      '</section>',
    ].join('');
  }

  modes.sentence = { render: render };
  window.English365Modes = modes;
})(window);
