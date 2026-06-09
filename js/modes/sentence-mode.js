(function initSentenceMode(window) {
  'use strict';

  var modes = window.English365Modes || {};

  function disabledAttr(enabled) {
    return enabled ? '' : ' disabled aria-disabled="true"';
  }

  function render(store, state) {
    var ui = window.English365UI;
    var sentence = store.getCurrentSentence();
    var progress = store.getSentenceProgress();
    if (!sentence) {
      return ui.backBar('Sentence Mode', state.scene) + '<section class="practice-card learning-question-card"><p>No sentences available.</p></section>';
    }

    return [
      ui.backBar('Sentence Mode', sentence.scene),
      ui.progressIndicator(progress.label, progress.current, progress.total),
      '<section class="section-block"><div class="pill-row">' + ui.scenePills(sentence.scene) + '</div></section>',
      '<section class="practice-card learning-question-card">',
      '<p class="eyebrow">Chinese Prompt</p>',
      '<h3>' + ui.escapeHtml(sentence.cn) + '</h3>',
      state.answerVisible ? '<div class="answer-panel answer-reveal-card"><p class="eyebrow">American English</p>' + ui.answerList(sentence.answers) + '</div>' : '<button class="primary-button full" type="button" data-action="show-answer">Show Answer</button>',
      window.English365UI.rateControl(state.prefs.speechRate),
      ui.primaryActions(),
      '<div class="nav-row">',
      '<button class="secondary-button" type="button" data-action="prev-sentence"' + disabledAttr(store.canPrevSentence()) + '>Previous</button>',
      '<button class="secondary-button" type="button" data-action="open-jump">Jump To</button>',
      '<button class="primary-button" type="button" data-action="next-sentence"' + disabledAttr(store.canNextSentence()) + '>Next</button>',
      '</div>',
      '</section>',
      state.jumpDialogOpen ? ui.jumpDialog(state.jumpValue, progress.total) : '',
    ].join('');
  }

  modes.sentence = { render: render };
  window.English365Modes = modes;
})(window);
