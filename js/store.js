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
    var firstSentence = corpus.getSentenceById(recent.lastItemId) || corpus.getSentencesByScene(initialScene)[0];
    var listeners = [];
    var state = {
      screen: 'home',
      mode: initialMode,
      scene: initialScene,
      currentItemId: firstSentence ? firstSentence.id : null,
      currentConversationId: null,
      currentTurnIndex: 0,
      answerVisible: false,
      transcriptVisible: false,
      chineseVisible: false,
      audioPlayed: false,
      prefs: prefs,
      stats: storage.getStats(),
      favorites: storage.getFavorites(),
      mistakes: storage.getMistakes(),
    };

    state.stats = window.English365Stats.syncDerivedCounts(state.stats, state.favorites, state.mistakes);

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

    function savePrefs() {
      storage.savePrefs(state.prefs);
    }

    function saveStats() {
      state.stats = window.English365Stats.syncDerivedCounts(state.stats, state.favorites, state.mistakes);
      storage.saveStats(state.stats);
    }

    function saveRecent(itemId) {
      var nextRecent = {
        lastMode: state.mode,
        lastScene: state.scene,
        lastItemId: itemId || state.currentItemId,
      };
      storage.saveRecent(nextRecent);
      state.prefs.lastMode = state.mode;
      state.prefs.lastScene = state.scene;
      savePrefs();
    }

    function resetVisibility() {
      state.answerVisible = false;
      state.transcriptVisible = false;
      state.chineseVisible = false;
      state.audioPlayed = false;
    }

    function setMode(mode) {
      state.mode = mode;
      state.screen = 'mode';
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
        } else {
          state.currentItemId = saved.lastItemId;
        }
      }
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
      if (!conversation) {
        return;
      }
      state.currentTurnIndex = Math.min(state.currentTurnIndex + 1, conversation.turns.length - 1);
      resetVisibility();
      saveRecent(conversation.id);
      notify();
    }

    function prevTurn() {
      state.currentTurnIndex = Math.max(state.currentTurnIndex - 1, 0);
      resetVisibility();
      saveRecent(state.currentConversationId);
      notify();
    }

    function getCurrentSentence() {
      return corpus.getSentenceById(state.currentItemId) || corpus.getSentencesByScene(state.scene)[0] || null;
    }

    function getCurrentConversation() {
      return corpus.getConversationById(state.currentConversationId) || corpus.getConversationsByScene(state.scene)[0] || null;
    }

    function getCurrentTurn() {
      var conversation = getCurrentConversation();
      return conversation ? conversation.turns[state.currentTurnIndex] : null;
    }

    function currentRef() {
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
      } else {
        state.favorites[key] = Object.assign({}, target, {
          addedAt: window.English365Stats.toDateString(),
        });
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
      storage.saveMistakes(state.mistakes);
      state.stats = window.English365Stats.recordCompletion(state.stats, state.mode);
      saveStats();
      saveRecent(target.type === 'sentence' ? target.id : target.conversationId);
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
        }
        storage.saveMistakes(state.mistakes);
      }
      state.stats = window.English365Stats.recordCompletion(state.stats, state.mode);
      saveStats();
      saveRecent(target.type === 'sentence' ? target.id : target.conversationId);
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
      startConversation: startConversation,
      selectConversation: selectConversation,
      nextTurn: nextTurn,
      prevTurn: prevTurn,
      getCurrentSentence: getCurrentSentence,
      getCurrentConversation: getCurrentConversation,
      getCurrentTurn: getCurrentTurn,
      currentRef: currentRef,
      toggleFavorite: toggleFavorite,
      markWrong: markWrong,
      markCorrect: markCorrect,
      setSpeechRate: setSpeechRate,
      recordActiveTime: recordActiveTime,
      showAnswer: showAnswer,
      markAudioPlayed: markAudioPlayed,
      showTranscript: showTranscript,
      showChinese: showChinese,
    };
  }

  window.English365Store = {
    createStore: createStore,
  };
})(window);
