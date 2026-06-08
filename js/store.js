(function initStore(window) {
  'use strict';

  function createStore() {
    var config = window.English365Config;
    var storage = window.English365Storage;
    var corpus = window.English365Corpus;
    var recent = storage.getRecent();
    var prefs = storage.getPrefs();
    var initialScene = recent.lastScene || prefs.lastScene || config.defaultScene;
    var initialMode = recent.lastMode || prefs.lastMode || config.defaultMode;
    var firstSentence = corpus.getSentenceById(recent.lastMode !== 'phrase' ? recent.lastItemId : null) || corpus.getSentencesByScene(initialScene)[0];
    var firstPhrase = corpus.getPhraseById(recent.lastMode === 'phrase' ? recent.lastItemId : null) || corpus.getPhrases()[0];
    var listeners = [];
    var state = {
      screen: 'home',
      mode: initialMode,
      scene: initialScene,
      currentItemId: firstSentence ? firstSentence.id : null,
      currentPhraseId: firstPhrase ? firstPhrase.id : null,
      currentConversationId: null,
      currentTurnIndex: 0,
      currentFavoriteKey: recent.lastMode === 'favorites' ? recent.lastItemId : null,
      currentMistakeKey: recent.lastMode === 'mistakes' ? recent.lastItemId : null,
      phraseSearchQuery: '',
      answerVisible: false,
      examplesVisible: false,
      transcriptVisible: false,
      chineseVisible: false,
      audioPlayed: false,
      prefs: prefs,
      stats: storage.getStats(),
      favorites: storage.getFavorites(),
      mistakes: storage.getMistakes(),
    };

    state.stats = window.English365Stats.syncDerivedCounts(state.stats, state.favorites, state.mistakes);
    ensureCollectionCursor('favorites');
    ensureCollectionCursor('mistakes');

    function notify() {
      listeners.forEach(function notifyListener(listener) {
        listener(getState());
      });
    }

    function getState() {
      return Object.assign({}, state, {
        prefs: Object.assign({}, state.prefs),
        stats: Object.assign({}, state.stats),
        favorites: Object.assign({}, state.favorites),
        mistakes: Object.assign({}, state.mistakes),
      });
    }

    function collectionFor(kind) {
      return kind === 'favorites' ? state.favorites : state.mistakes;
    }

    function cursorNameFor(kind) {
      return kind === 'favorites' ? 'currentFavoriteKey' : 'currentMistakeKey';
    }

    function collectionKeys(kind) {
      return Object.keys(collectionFor(kind));
    }

    function ensureCollectionCursor(kind) {
      var keys = collectionKeys(kind);
      var cursorName = cursorNameFor(kind);
      if (!keys.length) {
        state[cursorName] = null;
        return;
      }
      if (!state[cursorName] || keys.indexOf(state[cursorName]) === -1) {
        state[cursorName] = keys[0];
      }
    }

    function collectionIndex(kind) {
      ensureCollectionCursor(kind);
      return collectionKeys(kind).indexOf(state[cursorNameFor(kind)]);
    }

    function moveCollectionCursor(kind, delta) {
      var keys = collectionKeys(kind);
      var cursorName = cursorNameFor(kind);
      if (!keys.length) {
        state[cursorName] = null;
        notify();
        return;
      }
      var index = collectionIndex(kind);
      var nextIndex = Math.min(Math.max(index + delta, 0), keys.length - 1);
      state[cursorName] = keys[nextIndex];
      saveRecent(state[cursorName]);
      notify();
    }

    function savePrefs() {
      storage.savePrefs(state.prefs);
    }

    function saveStats() {
      state.stats = window.English365Stats.syncDerivedCounts(state.stats, state.favorites, state.mistakes);
      storage.saveStats(state.stats);
    }

    function currentRecentItemId() {
      if (state.mode === 'conversation') {
        return state.currentConversationId;
      }
      if (state.mode === 'phrase') {
        return state.currentPhraseId;
      }
      if (state.mode === 'favorites') {
        return state.currentFavoriteKey;
      }
      if (state.mode === 'mistakes') {
        return state.currentMistakeKey;
      }
      return state.currentItemId;
    }

    function itemIdFromRef(ref) {
      if (!ref) {
        return null;
      }
      if (ref.type === 'conversationTurn') {
        return ref.conversationId;
      }
      return ref.id;
    }

    function saveRecent(itemId) {
      var nextRecent = {
        lastMode: state.mode,
        lastScene: state.scene,
        lastItemId: itemId || currentRecentItemId(),
      };
      storage.saveRecent(nextRecent);
      state.prefs.lastMode = state.mode;
      state.prefs.lastScene = state.scene;
      savePrefs();
    }

    function resetVisibility() {
      state.answerVisible = false;
      state.examplesVisible = false;
      state.transcriptVisible = false;
      state.chineseVisible = false;
      state.audioPlayed = false;
    }

    function setMode(mode) {
      state.mode = mode;
      state.screen = 'mode';
      if (mode === 'favorites') {
        ensureCollectionCursor('favorites');
      }
      if (mode === 'mistakes') {
        ensureCollectionCursor('mistakes');
      }
      resetVisibility();
      saveRecent();
      notify();
    }

    function setScene(scene) {
      state.scene = scene;
      var sentence = corpus.getSentencesByScene(scene)[0];
      var conversation = corpus.getConversationsByScene(scene)[0];
      state.currentItemId = sentence ? sentence.id : null;
      state.currentConversationId = conversation ? conversation.id : null;
      state.currentTurnIndex = 0;
      resetVisibility();
      saveRecent();
      notify();
    }

    function goHome() {
      state.screen = 'home';
      notify();
    }

    function selectRandomSentenceForCurrentScene() {
      var sentence = corpus.getRandomSentence(state.scene, state.currentItemId);
      if (!sentence) {
        return;
      }
      state.currentItemId = sentence.id;
    }

    function openMode(mode) {
      if (mode === 'conversation' && !state.currentConversationId) {
        startConversation(state.scene, true);
      }
      if (mode === 'listening-challenge') {
        selectRandomSentenceForCurrentScene();
      }
      if (mode === 'phrase' && !state.currentPhraseId) {
        var phrase = corpus.getPhrases()[0];
        state.currentPhraseId = phrase ? phrase.id : null;
      }
      if (mode === 'favorites') {
        ensureCollectionCursor('favorites');
      }
      if (mode === 'mistakes') {
        ensureCollectionCursor('mistakes');
      }
      setMode(mode);
    }

    function continueLearning() {
      var saved = storage.getRecent();
      if (saved.lastMode) {
        state.mode = saved.lastMode;
      }
      if (saved.lastScene) {
        state.scene = saved.lastScene;
      }
      if (saved.lastItemId) {
        if (saved.lastMode === 'conversation') {
          state.currentConversationId = saved.lastItemId;
        } else if (saved.lastMode === 'phrase') {
          state.currentPhraseId = saved.lastItemId;
        } else if (saved.lastMode === 'favorites') {
          state.currentFavoriteKey = saved.lastItemId;
        } else if (saved.lastMode === 'mistakes') {
          state.currentMistakeKey = saved.lastItemId;
        } else {
          state.currentItemId = saved.lastItemId;
        }
      }
      ensureCollectionCursor('favorites');
      ensureCollectionCursor('mistakes');
      state.screen = 'mode';
      resetVisibility();
      notify();
    }

    function selectSentenceById(id) {
      var sentence = corpus.getSentenceById(id);
      if (!sentence) {
        return;
      }
      state.currentItemId = sentence.id;
      state.scene = sentence.scene;
      resetVisibility();
      saveRecent(sentence.id);
      notify();
    }

    function nextSentence(random) {
      var sentence = random ? corpus.getRandomSentence(state.scene, state.currentItemId) : corpus.getNextSentence(state.scene, state.currentItemId);
      if (!sentence) {
        return;
      }
      state.currentItemId = sentence.id;
      resetVisibility();
      saveRecent(sentence.id);
      notify();
    }

    function prevSentence() {
      var sentence = corpus.getPrevSentence(state.scene, state.currentItemId);
      if (!sentence) {
        return;
      }
      state.currentItemId = sentence.id;
      resetVisibility();
      saveRecent(sentence.id);
      notify();
    }

    function canPrevSentence() {
      return corpus.getSentenceIndex(state.scene, state.currentItemId) > 0;
    }

    function canNextSentence() {
      var sentences = corpus.getSentencesByScene(state.scene);
      var index = corpus.getSentenceIndex(state.scene, state.currentItemId);
      return index >= 0 && index < sentences.length - 1;
    }

    function selectPhraseById(id) {
      var phrase = corpus.getPhraseById(id);
      if (!phrase) {
        return;
      }
      state.currentPhraseId = phrase.id;
      resetVisibility();
      saveRecent(phrase.id);
      notify();
    }

    function nextPhrase() {
      var phrase = corpus.getNextPhrase(state.currentPhraseId);
      if (!phrase) {
        return;
      }
      state.currentPhraseId = phrase.id;
      resetVisibility();
      saveRecent(phrase.id);
      notify();
    }

    function prevPhrase() {
      var phrase = corpus.getPrevPhrase(state.currentPhraseId);
      if (!phrase) {
        return;
      }
      state.currentPhraseId = phrase.id;
      resetVisibility();
      saveRecent(phrase.id);
      notify();
    }

    function canPrevPhrase() {
      return corpus.getPhraseIndex(state.currentPhraseId) > 0;
    }

    function canNextPhrase() {
      var phrases = corpus.getPhrases();
      var index = corpus.getPhraseIndex(state.currentPhraseId);
      return index >= 0 && index < phrases.length - 1;
    }

    function setPhraseSearchQuery(query) {
      state.phraseSearchQuery = String(query || '');
      var matches = corpus.searchPhrases(state.phraseSearchQuery);
      if (matches.length) {
        state.currentPhraseId = matches[0].id;
      }
      resetVisibility();
      saveRecent(state.currentPhraseId);
      notify();
    }

    function startConversation(scene, silent) {
      var conversations = corpus.getConversationsByScene(scene || state.scene);
      if (!conversations.length) {
        return;
      }
      state.scene = scene || state.scene;
      state.currentConversationId = conversations[0].id;
      state.currentTurnIndex = 0;
      resetVisibility();
      saveRecent(state.currentConversationId);
      if (!silent) {
        notify();
      }
    }

    function selectConversation(id) {
      var conversation = corpus.getConversationById(id);
      if (!conversation) {
        return;
      }
      state.currentConversationId = id;
      state.scene = conversation.scene;
      state.currentTurnIndex = 0;
      resetVisibility();
      saveRecent(id);
      notify();
    }

    function nextTurn() {
      var conversation = corpus.getConversationById(state.currentConversationId);
      if (!conversation || state.currentTurnIndex >= conversation.turns.length - 1) {
        return;
      }
      state.currentTurnIndex += 1;
      resetVisibility();
      saveRecent(conversation.id);
      notify();
    }

    function prevTurn() {
      if (state.currentTurnIndex <= 0) {
        return;
      }
      state.currentTurnIndex -= 1;
      resetVisibility();
      saveRecent(state.currentConversationId);
      notify();
    }

    function canPrevTurn() {
      return state.currentTurnIndex > 0;
    }

    function canNextTurn() {
      var conversation = corpus.getConversationById(state.currentConversationId);
      return !!conversation && state.currentTurnIndex < conversation.turns.length - 1;
    }

    function getCurrentSentence() {
      return corpus.getSentenceById(state.currentItemId) || corpus.getSentencesByScene(state.scene)[0] || null;
    }

    function getCurrentPhrase() {
      return corpus.getPhraseById(state.currentPhraseId) || corpus.getPhrases()[0] || null;
    }

    function getCurrentConversation() {
      return corpus.getConversationById(state.currentConversationId) || corpus.getConversationsByScene(state.scene)[0] || null;
    }

    function getCurrentTurn() {
      var conversation = getCurrentConversation();
      return conversation ? conversation.turns[state.currentTurnIndex] : null;
    }

    function currentRef() {
      if (state.mode === 'favorites') {
        ensureCollectionCursor('favorites');
        return state.favorites[state.currentFavoriteKey] || null;
      }
      if (state.mode === 'mistakes') {
        ensureCollectionCursor('mistakes');
        return state.mistakes[state.currentMistakeKey] || null;
      }
      if (state.mode === 'conversation') {
        var conversation = getCurrentConversation();
        return conversation ? {
          type: 'conversationTurn',
          conversationId: conversation.id,
          id: conversation.id + ':' + state.currentTurnIndex,
          scene: conversation.scene,
          turnIndex: state.currentTurnIndex,
        } : null;
      }
      if (state.mode === 'phrase') {
        var phrase = getCurrentPhrase();
        return phrase ? { type: 'phrase', id: phrase.id, scene: state.scene } : null;
      }
      var sentence = getCurrentSentence();
      return sentence ? { type: 'sentence', id: sentence.id, scene: sentence.scene } : null;
    }

    function toggleFavorite(ref) {
      var target = ref || currentRef();
      var key = corpus.refKey(target);
      if (!key) {
        return;
      }
      if (state.favorites[key]) {
        delete state.favorites[key];
        ensureCollectionCursor('favorites');
      } else {
        state.favorites[key] = Object.assign({}, target, {
          addedAt: window.English365Stats.toDateString(),
        });
        state.currentFavoriteKey = state.currentFavoriteKey || key;
      }
      storage.saveFavorites(state.favorites);
      saveStats();
      notify();
    }

    function markWrong(ref) {
      var target = ref || currentRef();
      var key = corpus.refKey(target);
      if (!key) {
        return;
      }
      var existing = state.mistakes[key] || Object.assign({}, target, {
        wrongCount: 0,
        correctCount: 0,
      });
      existing.wrongCount += 1;
      existing.updatedAt = window.English365Stats.toDateString();
      state.mistakes[key] = existing;
      state.currentMistakeKey = state.currentMistakeKey || key;
      storage.saveMistakes(state.mistakes);
      state.stats = window.English365Stats.recordCompletion(state.stats, state.mode);
      saveStats();
      saveRecent(itemIdFromRef(target));
      notify();
    }

    function markCorrect(ref) {
      var target = ref || currentRef();
      var key = corpus.refKey(target);
      if (!key) {
        return;
      }
      if (state.mistakes[key]) {
        state.mistakes[key].correctCount += 1;
        state.mistakes[key].updatedAt = window.English365Stats.toDateString();
        if (state.mistakes[key].correctCount >= 3) {
          delete state.mistakes[key];
          ensureCollectionCursor('mistakes');
        }
        storage.saveMistakes(state.mistakes);
      }
      state.stats = window.English365Stats.recordCompletion(state.stats, state.mode);
      saveStats();
      saveRecent(itemIdFromRef(target));
      notify();
    }

    function setSpeechRate(rate) {
      var numericRate = Number(rate);
      if (window.English365Config.speechRates.indexOf(numericRate) === -1) {
        return;
      }
      state.prefs.speechRate = numericRate;
      savePrefs();
      notify();
    }

    function recordActiveTime(elapsedMs, date) {
      state.stats = window.English365Stats.recordActiveTime(state.stats, elapsedMs, date);
      saveStats();
      notify();
    }

    function showAnswer() {
      state.answerVisible = true;
      notify();
    }

    function showExamples() {
      state.examplesVisible = true;
      notify();
    }

    function markAudioPlayed() {
      state.audioPlayed = true;
      notify();
    }

    function showTranscript() {
      state.transcriptVisible = true;
      notify();
    }

    function showChinese() {
      state.chineseVisible = true;
      notify();
    }

    return {
      getState: getState,
      subscribe: function subscribe(listener) {
        listeners.push(listener);
        return function unsubscribe() {
          listeners = listeners.filter(function remove(current) {
            return current !== listener;
          });
        };
      },
      goHome: goHome,
      openMode: openMode,
      continueLearning: continueLearning,
      setMode: setMode,
      setScene: setScene,
      selectSentenceById: selectSentenceById,
      nextSentence: nextSentence,
      prevSentence: prevSentence,
      canPrevSentence: canPrevSentence,
      canNextSentence: canNextSentence,
      selectPhraseById: selectPhraseById,
      nextPhrase: nextPhrase,
      prevPhrase: prevPhrase,
      canPrevPhrase: canPrevPhrase,
      canNextPhrase: canNextPhrase,
      setPhraseSearchQuery: setPhraseSearchQuery,
      startConversation: startConversation,
      selectConversation: selectConversation,
      nextTurn: nextTurn,
      prevTurn: prevTurn,
      canPrevTurn: canPrevTurn,
      canNextTurn: canNextTurn,
      prevFavorite: function prevFavorite() { moveCollectionCursor('favorites', -1); },
      nextFavorite: function nextFavorite() { moveCollectionCursor('favorites', 1); },
      canPrevFavorite: function canPrevFavorite() { return collectionIndex('favorites') > 0; },
      canNextFavorite: function canNextFavorite() { var keys = collectionKeys('favorites'); var index = collectionIndex('favorites'); return index >= 0 && index < keys.length - 1; },
      prevMistake: function prevMistake() { moveCollectionCursor('mistakes', -1); },
      nextMistake: function nextMistake() { moveCollectionCursor('mistakes', 1); },
      canPrevMistake: function canPrevMistake() { return collectionIndex('mistakes') > 0; },
      canNextMistake: function canNextMistake() { var keys = collectionKeys('mistakes'); var index = collectionIndex('mistakes'); return index >= 0 && index < keys.length - 1; },
      getCurrentSentence: getCurrentSentence,
      getCurrentPhrase: getCurrentPhrase,
      getCurrentConversation: getCurrentConversation,
      getCurrentTurn: getCurrentTurn,
      currentRef: currentRef,
      toggleFavorite: toggleFavorite,
      markWrong: markWrong,
      markCorrect: markCorrect,
      setSpeechRate: setSpeechRate,
      recordActiveTime: recordActiveTime,
      showAnswer: showAnswer,
      showExamples: showExamples,
      markAudioPlayed: markAudioPlayed,
      showTranscript: showTranscript,
      showChinese: showChinese,
    };
  }

  window.English365Store = {
    createStore: createStore,
  };
})(window);
