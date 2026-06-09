(function initListeningMode(window) {
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
      return ui.backBar('Listening Mode', state.scene) + '<section class="practice-card"><p>No listening items available.</p></section>';
    }

    return [
      ui.backBar('Listening Mode', sentence.scene),
      ui.progressIndicator(progress.label, progress.current, progress.total),
      '<section class="section-block"><div class="pill-row">' + ui.scenePills(sentence.scene) + '</div></section>',
      '<section class="practice-card learning-question-card listening-card">',
      '<p class="eyebrow">Listen First</p>',
      '<button class="play-button" type="button" data-action="play-current">Play</button>',
      window.English365UI.rateControl(state.prefs.speechRate),
      state.transcriptVisible ? '<div class="answer-panel answer-reveal-card"><p class="eyebrow">Transcript</p>' + ui.answerList(sentence.answers) + '</div>' : '<button class="primary-button full" type="button" data-action="show-transcript">Show Transcript</button>',
      state.chineseVisible ? '<div class="answer-panel answer-reveal-card"><p class="eyebrow">Chinese</p><p>' + ui.escapeHtml(sentence.cn) + '</p></div>' : '<button class="secondary-button full" type="button" data-action="show-chinese">Show Chinese</button>',
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

  modes.listening = { render: render };
  window.English365Modes = modes;
})(window);
