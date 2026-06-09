(function initMistakesMode(window) {
  'use strict';

  var modes = window.English365Modes || {};

  function disabledAttr(enabled) {
    return enabled ? '' : ' disabled aria-disabled="true"';
  }

  function sourceMode(ref) {
    if (ref.sourceMode) {
      return ref.sourceMode;
    }
    if (ref.type === 'phrase') {
      return 'phrase';
    }
    if (ref.type === 'conversationTurn') {
      return 'conversation';
    }
    return 'sentence';
  }

  function resolvedText(ref, item) {
    if (ref.type === 'phrase') {
      return {
        zh: ref.zh || (item && item.meaning) || '',
        en: ref.en || (item && item.phrase) || '',
        examples: item && item.examples ? item.examples : [],
        category: item && item.category ? item.category : 'Phrase',
      };
    }
    return {
      zh: ref.zh || (item && item.cn) || '',
      en: ref.en || (item && (item.en || (item.answers && item.answers[0]))) || '',
      examples: item && item.answers ? item.answers : [],
      category: sourceMode(ref),
    };
  }

  function renderExamples(ui, examples) {
    if (!examples.length) {
      return '';
    }
    return [
      '<div class="answer-panel answer-reveal-card phrase-examples-panel">',
      '<p class="eyebrow">Examples</p>',
      '<ol class="answer-list phrase-example-list">',
      examples.map(function renderExample(example, index) {
        return [
          '<li>',
          '<span>' + ui.escapeHtml(example) + '</span>',
          '<button class="secondary-button phrase-example-play" type="button" data-action="play-phrase-example" data-example-index="' + index + '">Play</button>',
          '</li>',
        ].join('');
      }).join(''),
      '</ol>',
      '</div>',
    ].join('');
  }

  function renderReviewActions() {
    return [
      '<div class="action-grid mistake-review-actions">',
      '<button class="success-button" type="button" data-action="mark-correct-current">✓ I Got It</button>',
      '<button class="danger-button" type="button" data-action="mark-wrong-current">✗ Still Need Practice</button>',
      '</div>',
    ].join('');
  }

  function renderAnswer(ui, state, ref, text) {
    if (sourceMode(ref) === 'phrase') {
      if (!state.answerVisible) {
        return '<button class="primary-button full" type="button" data-action="show-phrase">Show Phrase</button>';
      }
      return [
        '<div class="answer-panel answer-reveal-card phrase-english-panel">',
        '<p class="eyebrow">English Phrase</p>',
        '<h3>' + ui.escapeHtml(text.en) + '</h3>',
        '</div>',
        '<button class="secondary-button full" type="button" data-action="play-current">Play Audio</button>',
        state.examplesVisible ? renderExamples(ui, text.examples) : '<button class="primary-button full" type="button" data-action="show-examples">Show Examples</button>',
        renderReviewActions(),
      ].join('');
    }

    if (!state.answerVisible) {
      return '<button class="primary-button full" type="button" data-action="show-answer">Show Answer</button>';
    }
    return [
      '<div class="answer-panel answer-reveal-card">',
      '<p class="eyebrow">American English</p>',
      '<p>' + ui.escapeHtml(text.en) + '</p>',
      '</div>',
      renderReviewActions(),
    ].join('');
  }

  function renderNav(store) {
    return [
      '<div class="nav-row list-nav">',
      '<button class="secondary-button" type="button" data-action="prev-mistake"' + disabledAttr(store.canPrevMistake()) + '>Previous</button>',
      '<button class="secondary-button" type="button" data-action="open-jump">Jump To</button>',
      '<button class="primary-button" type="button" data-action="next-mistake"' + disabledAttr(store.canNextMistake()) + '>Next</button>',
      '</div>',
    ].join('');
  }

  function render(store, state) {
    var ui = window.English365UI;
    var keys = Object.keys(state.mistakes);
    if (!keys.length) {
      return ui.backBar('Mistakes Mode', state.scene) + '<section class="empty-state"><h3>No mistakes right now.</h3><p>Items graduate after three correct answers.</p></section>';
    }

    var key = state.currentMistakeKey && state.mistakes[state.currentMistakeKey] ? state.currentMistakeKey : keys[0];
    var ref = state.mistakes[key];
    var item = window.English365Corpus.resolveRef(ref);
    var text = resolvedText(ref, item);
    var progress = store.getMistakeProgress();
    var mode = sourceMode(ref);
    var audio = mode === 'listeningChallenge' ? '<button class="secondary-button full" type="button" data-action="play-current">Play Audio</button>' : '';

    return [
      ui.backBar('Mistakes Mode', state.scene),
      ui.progressIndicator(progress.label, progress.current, progress.total),
      renderNav(store),
      '<section class="practice-card learning-question-card mistake-review-card">',
      '<p class="eyebrow">' + ui.escapeHtml(mode) + '</p>',
      '<h3>' + ui.escapeHtml(text.zh) + '</h3>',
      audio,
      renderAnswer(ui, state, ref, text),
      '</section>',
      state.jumpDialogOpen ? ui.jumpDialog(state.jumpValue, progress.total) : '',
    ].join('');
  }

  modes.mistakes = { render: render };
  window.English365Modes = modes;
})(window);
