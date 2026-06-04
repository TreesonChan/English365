(function initApp(window, document) {
  'use strict';

  var store;
  var root;

  function canRegisterServiceWorker() {
    return window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
  }

  function registerServiceWorker() {
    if ('serviceWorker' in window.navigator && canRegisterServiceWorker()) {
      window.navigator.serviceWorker.register('service-worker.js').catch(function logSwError(error) {
        console.warn('Service worker registration failed:', error);
      });
    }
  }

  function render() {
    var state = store.getState();
    var html;
    if (state.screen === 'home') {
      html = window.English365Home.render(store, state);
    } else {
      var mode = window.English365Modes[state.mode] || window.English365Modes.sentence;
      html = mode.render(store, state);
    }
    root.innerHTML = html;
  }

  function speakCurrent() {
    var state = store.getState();
    var text = '';
    if (state.mode === 'conversation') {
      text = window.English365Corpus.getTurnEnglish(store.getCurrentTurn());
    } else {
      text = window.English365Corpus.getPrimaryEnglishForSentence(store.getCurrentSentence());
    }
    window.English365TTS.speak(text, state.prefs.speechRate);
  }

  function refFromKey(key) {
    var state = store.getState();
    return state.favorites[key] || state.mistakes[key] || null;
  }

  function practiceRef(ref) {
    if (!ref) {
      return;
    }
    if (ref.type === 'conversationTurn') {
      store.selectConversation(ref.conversationId);
      store.setMode('conversation');
    } else {
      store.selectSentenceById(ref.id);
      store.setMode('sentence');
    }
  }

  function selectNextConversation() {
    var state = store.getState();
    var conversations = window.English365Corpus.getConversationsByScene(state.scene);
    if (!conversations.length) {
      return;
    }
    var index = conversations.findIndex(function findCurrent(conversation) {
      return conversation.id === state.currentConversationId;
    });
    var next = conversations[(index + 1 + conversations.length) % conversations.length];
    store.selectConversation(next.id);
  }

  function handleClick(event) {
    var target = event.target.closest('[data-action]');
    if (!target) {
      return;
    }
    var action = target.dataset.action;

    if (action === 'go-home') {
      store.goHome();
    } else if (action === 'continue-learning') {
      store.continueLearning();
    } else if (action === 'open-mode') {
      store.openMode(target.dataset.mode);
    } else if (action === 'select-scene') {
      store.setScene(target.dataset.scene);
    } else if (action === 'select-conversation') {
      store.selectConversation(target.dataset.conversationId);
    } else if (action === 'next-conversation') {
      selectNextConversation();
    } else if (action === 'show-answer') {
      store.showAnswer();
    } else if (action === 'show-transcript') {
      store.showTranscript();
    } else if (action === 'show-chinese') {
      store.showChinese();
    } else if (action === 'play-current') {
      speakCurrent();
    } else if (action === 'toggle-favorite-current') {
      store.toggleFavorite();
    } else if (action === 'mark-correct-current') {
      store.markCorrect();
      window.English365Toast.show('Marked correct');
    } else if (action === 'mark-wrong-current') {
      store.markWrong();
      window.English365Toast.show('Added to mistakes');
    } else if (action === 'next-sentence') {
      store.nextSentence(true);
    } else if (action === 'prev-turn') {
      store.prevTurn();
    } else if (action === 'next-turn') {
      store.nextTurn();
    } else if (action === 'set-rate') {
      store.setSpeechRate(target.dataset.rate);
    } else if (action === 'practice-ref') {
      practiceRef(refFromKey(target.dataset.refKey));
    } else if (action === 'remove-favorite') {
      store.toggleFavorite(refFromKey(target.dataset.refKey));
      window.English365Toast.show('Removed from favorites');
    } else if (action === 'correct-ref') {
      store.markCorrect(refFromKey(target.dataset.refKey));
    } else if (action === 'wrong-ref') {
      store.markWrong(refFromKey(target.dataset.refKey));
    }
  }

  function init() {
    var errors = window.English365CorpusIndex.validateCorpus();
    if (errors.length) {
      console.warn('Corpus validation warnings:', errors);
    }
    root = document.getElementById('app-root');
    store = window.English365Store.createStore();
    window.English365AppStore = store;
    root.addEventListener('click', handleClick);
    store.subscribe(render);
    render();
    registerServiceWorker();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window, document);
