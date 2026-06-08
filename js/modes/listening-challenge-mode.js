(function initListeningChallengeMode(window) {
  'use strict';

  var modes = window.English365Modes || {};

  function disabledAttr(enabled) {
    return enabled ? '' : ' disabled aria-disabled="true"';
  }

  function renderAnswerPanel(ui, sentence) {
    return [
      '<div class="answer-panel">',
      '<p class="eyebrow">Chinese</p>',
      '<p>' + ui.escapeHtml(sentence.cn) + '</p>',
      '</div>',
      '<div class="answer-panel">',
      '<p class="eyebrow">American English</p>',
      ui.answerList(sentence.answers),
      '</div>',
      '<div class="action-grid">',
      '<button class="success-button" type="button" data-action="mark-correct-current">Understood</button>',
      '<button class="danger-button" type="button" data-action="mark-wrong-current">Didn\'t Understand</button>',
      '</div>',
    ].join('');
  }

  function render(store, state) {
    var ui = window.English365UI;
    var sentence = store.getCurrentSentence();
    if (!sentence) {
      return ui.backBar('Listening Challenge Mode', state.scene) + '<section class="practice-card"><p>No listening challenge items available.</p></section>';
    }

    return [
      ui.backBar('Listening Challenge Mode', sentence.scene),
      '<section class="section-block"><div class="pill-row">' + ui.scenePills(sentence.scene) + '</div></section>',
      '<section class="practice-card listening-card listening-challenge-card">',
      '<p class="eyebrow">Listening Challenge</p>',
      '<div class="challenge-audio-row">',
      '<button class="primary-button challenge-audio-button" type="button" data-action="play-current">' + (state.audioPlayed ? '↻ Replay' : '▶ Play') + '</button>',
      '</div>',
      window.English365UI.rateControl(state.prefs.speechRate),
      state.answerVisible ? renderAnswerPanel(ui, sentence) : '<button class="primary-button full" type="button" data-action="show-answer">Show Answer</button>',
      '<div class="nav-row">',
      '<button class="secondary-button" type="button" data-action="prev-sentence"' + disabledAttr(store.canPrevSentence()) + '>Previous</button>',
      '<button class="primary-button" type="button" data-action="next-sentence"' + disabledAttr(store.canNextSentence()) + '>Next</button>',
      '</div>',
      '</section>',
    ].join('');
  }

  modes['listening-challenge'] = { render: render };
  window.English365Modes = modes;
})(window);
