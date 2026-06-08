(function initPhraseMode(window) {
  'use strict';

  var modes = window.English365Modes || {};

  function disabledAttr(enabled) {
    return enabled ? '' : ' disabled aria-disabled="true"';
  }

  function buildPrompt(phrase) {
    return phrase.replace('...', ' ...');
  }

  function renderSearchResults(ui, state) {
    var query = state.phraseSearchQuery.trim();
    if (!query) {
      return '';
    }
    var matches = window.English365Corpus.searchPhrases(query);
    if (!matches.length) {
      return '<div class="phrase-search-results"><p>No phrases found.</p></div>';
    }
    return [
      '<div class="phrase-search-results" aria-label="Phrase search results">',
      matches.slice(0, 8).map(function renderMatch(match) {
        var active = match.id === state.currentPhraseId ? ' is-active' : '';
        return [
          '<button class="phrase-result' + active + '" type="button" data-action="select-phrase" data-phrase-id="' + ui.escapeHtml(match.id) + '">',
          '<span>' + ui.escapeHtml(match.meaning) + '</span>',
          '<small>' + ui.escapeHtml(match.category) + '</small>',
          '</button>',
        ].join('');
      }).join(''),
      '</div>',
    ].join('');
  }

  function renderExamples(ui, phrase) {
    return [
      '<div class="answer-panel phrase-examples-panel">',
      '<p class="eyebrow">Examples</p>',
      '<ol class="answer-list phrase-example-list">',
      phrase.examples.map(function renderExample(example, index) {
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

  function renderPhraseReveal(ui, state, phrase) {
    if (!state.answerVisible) {
      return '<button class="primary-button full" type="button" data-action="show-phrase">Show Phrase</button>';
    }
    return [
      '<div class="answer-panel phrase-english-panel">',
      '<p class="eyebrow">English Phrase</p>',
      '<h3>' + ui.escapeHtml(phrase.phrase) + '</h3>',
      '</div>',
      window.English365UI.rateControl(state.prefs.speechRate),
      '<button class="secondary-button full" type="button" data-action="play-current">Play Audio</button>',
    ].join('');
  }

  function renderBuildCard(ui, state, phrase) {
    if (!state.answerVisible) {
      return '';
    }
    return [
      '<section class="practice-card phrase-build-card">',
      '<p class="eyebrow">Build a Sentence</p>',
      '<h3>' + ui.escapeHtml(buildPrompt(phrase.phrase)) + '</h3>',
      '<p class="phrase-coach-text">Think of a complete sentence before checking examples.</p>',
      state.examplesVisible ? renderExamples(ui, phrase) : '<button class="primary-button full" type="button" data-action="show-examples">Show Examples</button>',
      '</section>',
    ].join('');
  }

  function render(store, state) {
    var ui = window.English365UI;
    var phrase = store.getCurrentPhrase();
    if (!phrase) {
      return ui.backBar('Phrase Mode', state.scene) + '<section class="practice-card"><p>No phrases available.</p></section>';
    }

    return [
      ui.backBar('Phrase Mode', state.scene),
      '<section class="section-block phrase-search-card">',
      '<label class="eyebrow" for="phrase-search">Search Phrase</label>',
      '<input id="phrase-search" class="phrase-search-input" type="search" data-action="search-phrases" value="' + ui.escapeHtml(state.phraseSearchQuery) + '" placeholder="Search phrase or Chinese meaning" autocomplete="off">',
      renderSearchResults(ui, state),
      '</section>',
      '<section class="practice-card phrase-card">',
      '<p class="eyebrow">' + ui.escapeHtml(phrase.category) + '</p>',
      '<h3>' + ui.escapeHtml(phrase.meaning) + '</h3>',
      renderPhraseReveal(ui, state, phrase),
      '<div class="action-grid">',
      '<button class="secondary-button" type="button" data-action="toggle-favorite-current">Favorite</button>',
      '<button class="success-button" type="button" data-action="mark-correct-current">Mark as Known</button>',
      '<button class="danger-button" type="button" data-action="mark-wrong-current">Mark as Unknown</button>',
      '</div>',
      '<div class="nav-row">',
      '<button class="secondary-button" type="button" data-action="prev-phrase"' + disabledAttr(store.canPrevPhrase()) + '>Previous</button>',
      '<button class="primary-button" type="button" data-action="next-phrase"' + disabledAttr(store.canNextPhrase()) + '>Next</button>',
      '</div>',
      '</section>',
      renderBuildCard(ui, state, phrase),
    ].join('');
  }

  modes.phrase = { render: render };
  window.English365Modes = modes;
})(window);
