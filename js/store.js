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
    var firstSentence = corpus.getSentenceById(recent.lastMode !== 'phrase' ? recent.lastItemId : null) || corpus.getSentencesByScene(initialScene)[0] || corpus.getSentences()[0] || null;
    var firstPhrase = corpus.getPhraseById(recent.lastMode === 'phrase' ? recent.lastItemId : null) || corpus.getPhrases()[0] || null;
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
      jumpDialogOpen: false,
      jumpValue: '',
      prefs: prefs,
      stats: storage.getStats(),
      favorites: storage.getFavorites(),
      mistakes: storage.getMistakes(),
      progress: storage.getProgress(),
    };

    state.stats = window.English365Stats.syncDerivedCounts(state.stats, state.favorites, state.mistakes);
    migrateRecentProgress();
    ensureCollectionCursor('favorites');
    ensureCollectionCursor('mistakes');
    applyProgressForMode(initialMode);

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
        progress: Object.assign({}, state.progress),
      });
    }

    function hasStoredProgress() {
      try {
        return !!window.localStorage.getItem(config.storageKeys.progress);
      } catch (error) {
        return false;
      }
    }

    function clampIndex(index, total) {
      var safeTotal = Math.max(0, Number(total) || 0);
      if (!safeTotal) {
        return -1;
      }
      var numeric = Number(index);
      if (!Number.isFinite(numeric)) {
        numeric = 0;
      }
      return Math.min(Math.max(Math.floor(numeric), 0), safeTotal - 1);
    }

    function clampItemNumber(value, total) {
      var safeTotal = Math.max(0, Number(total) || 0);
      if (!safeTotal) {
        return 0;
      }
      var numeric = parseInt(value, 10);
      if (!Number.isFinite(numeric)) {
        numeric = 1;
      }
      return Math.min(Math.max(numeric, 1), safeTotal);
    }

    function progress(label, index, total) {
      return { label: label, current: total ? clampIndex(index, total) + 1 : 0, total: total };
    }

    function collectionFor(kind) {
      return kind === 'favorites' ? state.favorites : state.mistakes;
    }

    function cursorNameFor(kind) {
      return kind === 'favorites' ? 'currentFavoriteKey' : 'currentMistakeKey';
    }

    function progressKeyForCollection(kind) {
      return kind === 'favorites' ? 'favoritesCurrentIndex' : 'mistakesCurrentIndex';
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
        state[cursorName] = keys[clampIndex(state.progress[progressKeyForCollection(kind)], keys.length)] || keys[0];
      }
    }

    function collectionIndex(kind) {
      ensureCollectionCursor(kind);
      return collectionKeys(kind).indexOf(state[cursorNameFor(kind)]);
    }

    function setCollectionIndex(kind, index) {
      var keys = collectionKeys(kind);
      state[cursorNameFor(kind)] = keys[clampIndex(index, keys.length)] || null;
    }

    function moveCollectionCursor(kind, delta) {
      var keys = collectionKeys(kind);
      var cursorName = cursorNameFor(kind);
      if (!keys.length) {
        state[cursorName] = null;
        saveProgressForMode(kind === 'favorites' ? 'favorites' : 'mistakes');
        notify();
        return;
      }
      var index = collectionIndex(kind);
      var nextIndex = Math.min(Math.max(index + delta, 0), keys.length - 1);
      state[cursorName] = keys[nextIndex];
      resetVisibility();
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

    function saveProgress() {
      storage.saveProgress(state.progress);
    }

    function progressKeyForMode(mode) {
      if (mode === 'listening') {
        return 'listeningCurrentIndex';
      }
      if (mode === 'listening-challenge') {
        return 'listeningChallengeCurrentIndex';
      }
      if (mode === 'phrase') {
        return 'phraseCurrentIndex';
      }
      if (mode === 'conversation') {
        return 'conversationCurrentIndex';
      }
      if (mode === 'favorites') {
        return 'favoritesCurrentIndex';
      }
      if (mode === 'mistakes') {
        return 'mistakesCurrentIndex';
      }
      return 'sentenceCurrentIndex';
    }

    function isSentenceMode(mode) {
      return mode === 'sentence' || mode === 'listening' || mode === 'listening-challenge';
    }

    function isTrackedMode(mode) {
      return isSentenceMode(mode) ||
        mode === 'phrase' ||
        mode === 'conversation' ||
        mode === 'favorites' ||
        mode === 'mistakes';
    }

    function setSentenceByIndex(index) {
      var sentences = corpus.getSentences();
      var sentence = sentences[clampIndex(index, sentences.length)] || null;
      if (sentence) {
        state.currentItemId = sentence.id;
        state.scene = sentence.scene;
      }
    }

    function setPhraseByIndex(index) {
      var phrases = corpus.getPhrases();
      var phrase = phrases[clampIndex(index, phrases.length)] || null;
      if (phrase) {
        state.currentPhraseId = phrase.id;
      }
    }

    function setConversationByIndex(index) {
      var conversations = corpus.getConversations();
      var conversation = conversations[clampIndex(index, conversations.length)] || null;
      if (conversation) {
        state.currentConversationId = conversation.id;
        state.scene = conversation.scene;
        state.currentTurnIndex = clampIndex(state.progress.conversationTurnIndex, conversation.turns.length);
        if (state.currentTurnIndex < 0) {
          state.currentTurnIndex = 0;
        }
      }
    }

    function applyProgressForMode(mode) {
      if (isSentenceMode(mode)) {
        setSentenceByIndex(state.progress[progressKeyForMode(mode)]);
      } else if (mode === 'phrase') {
        setPhraseByIndex(state.progress.phraseCurrentIndex);
      } else if (mode === 'conversation') {
        setConversationByIndex(state.progress.conversationCurrentIndex);
      } else if (mode === 'favorites') {
        setCollectionIndex('favorites', state.progress.favoritesCurrentIndex);
      } else if (mode === 'mistakes') {
        setCollectionIndex('mistakes', state.progress.mistakesCurrentIndex);
      }
    }

    function saveProgressForMode(mode) {
      if (!isTrackedMode(mode)) {
        return;
      }
      var key = progressKeyForMode(mode);
      if (isSentenceMode(mode)) {
        state.progress[key] = clampIndex(corpus.getSentenceIndex(state.currentItemId), corpus.getSentences().length);
      } else if (mode === 'phrase') {
        state.progress.phraseCurrentIndex = clampIndex(corpus.getPhraseIndex(state.currentPhraseId), corpus.getPhrases().length);
      } else if (mode === 'conversation') {
        var conversation = getCurrentConversation();
        state.progress.conversationCurrentIndex = clampIndex(corpus.getConversationIndex(state.currentConversationId), corpus.getConversations().length);
        state.progress.conversationTurnIndex = conversation ? clampIndex(state.currentTurnIndex, conversation.turns.length) : 0;
      } else if (mode === 'favorites') {
        state.progress.favoritesCurrentIndex = clampIndex(collectionIndex('favorites'), collectionKeys('favorites').length);
      } else if (mode === 'mistakes') {
        state.progress.mistakesCurrentIndex = clampIndex(collectionIndex('mistakes'), collectionKeys('mistakes').length);
      }
      saveProgress();
    }

    function migrateRecentProgress() {
      if (hasStoredProgress() || !recent.lastMode || !recent.lastItemId) {
        return;
      }
      if (isSentenceMode(recent.lastMode)) {
        var sentenceIndex = corpus.getSentenceIndex(recent.lastItemId);
        if (sentenceIndex >= 0) {
          state.progress[progressKeyForMode(recent.lastMode)] = sentenceIndex;
        }
      } else if (recent.lastMode === 'phrase') {
        var phraseIndex = corpus.getPhraseIndex(recent.lastItemId);
        if (phraseIndex >= 0) {
          state.progress.phraseCurrentIndex = phraseIndex;
        }
      } else if (recent.lastMode === 'conversation') {
        var conversationIndex = corpus.getConversationIndex(recent.lastItemId);
        if (conversationIndex >= 0) {
          state.progress.conversationCurrentIndex = conversationIndex;
        }
      } else if (recent.lastMode === 'favorites') {
        var favoriteIndex = collectionKeys('favorites').indexOf(recent.lastItemId);
        if (favoriteIndex >= 0) {
          state.progress.favoritesCurrentIndex = favoriteIndex;
        }
      } else if (recent.lastMode === 'mistakes') {
        var mistakeIndex = collectionKeys('mistakes').indexOf(recent.lastItemId);
        if (mistakeIndex >= 0) {
          state.progress.mistakesCurrentIndex = mistakeIndex;
        }
      }
      saveProgress();
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
      state.prefs.lastMode = state.mode;
      state.prefs.lastScene = state.scene;
      savePrefs();
      if (!isTrackedMode(state.mode)) {
        return;
      }
      saveProgressForMode(state.mode);
      var nextRecent = {
        lastMode: state.mode,
        lastScene: state.scene,
        lastItemId: itemId || currentRecentItemId(),
      };
      storage.saveRecent(nextRecent);
    }

    function resetVisibility() {
      state.answerVisible = false;
      state.examplesVisible = false;
      state.transcriptVisible = false;
      state.chineseVisible = false;
      state.audioPlayed = false;
      state.jumpDialogOpen = false;
      state.jumpValue = '';
    }

    function setMode(mode) {
      saveProgressForMode(state.mode);
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
      if (isSentenceMode(state.mode)) {
        var sentence = corpus.getSentencesByScene(scene)[0];
        state.currentItemId = sentence ? sentence.id : null;
      }
      if (state.mode === 'conversation') {
        var conversation = corpus.getConversationsByScene(scene)[0];
        state.currentConversationId = conversation ? conversation.id : null;
        state.currentTurnIndex = 0;
      }
      resetVisibility();
      saveRecent();
      notify();
    }

    function goHome() {
      state.screen = 'home';
      notify();
    }

    function openMode(mode) {
      saveProgressForMode(state.mode);
      state.mode = mode;
      applyProgressForMode(mode);
      if (mode === 'conversation' && !state.currentConversationId) {
        startConversation(state.scene, true);
      }
      if (mode === 'phrase' && !state.currentPhraseId) {
        setPhraseByIndex(0);
      }
      if (mode === 'favorites') {
        ensureCollectionCursor('favorites');
      }
      if (mode === 'mistakes') {
        ensureCollectionCursor('mistakes');
      }
      state.screen = 'mode';
      resetVisibility();
      saveRecent();
      notify();
    }

    function continueLearning() {
      var saved = storage.getRecent();
      if (saved.lastScene) {
        state.scene = saved.lastScene;
      }
      if (saved.lastMode) {
        state.mode = saved.lastMode;
        applyProgressForMode(saved.lastMode);
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
      if (isSentenceMode(state.mode)) {
        saveRecent(sentence.id);
      }
      notify();
    }

    function nextSentence(random) {
      var sentence = random ? corpus.getRandomSentence(state.scene, state.currentItemId) : corpus.getNextSentence(state.currentItemId);
      if (!sentence) {
        return;
      }
      state.currentItemId = sentence.id;
      state.scene = sentence.scene;
      resetVisibility();
      saveRecent(sentence.id);
      notify();
    }

    function prevSentence() {
      var sentence = corpus.getPrevSentence(state.currentItemId);
      if (!sentence) {
        return;
      }
      state.currentItemId = sentence.id;
      state.scene = sentence.scene;
      resetVisibility();
      saveRecent(sentence.id);
      notify();
    }

    function canPrevSentence() {
      return corpus.getSentenceIndex(state.currentItemId) > 0;
    }

    function canNextSentence() {
      var sentences = corpus.getSentences();
      var index = corpus.getSentenceIndex(state.currentItemId);
      return index >= 0 && index < sentences.length - 1;
    }

    function selectPhraseById(id) {
      var phrase = corpus.getPhraseById(id);
      if (!phrase) {
        return;
      }
      state.currentPhraseId = phrase.id;
      resetVisibility();
      if (state.mode === 'phrase') {
        saveRecent(phrase.id);
      }
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
      if (state.mode === 'conversation') {
        saveRecent(id);
      }
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

    function progressForSavedMode(mode) {
      if (isSentenceMode(mode)) {
        return progress('Sentence', state.progress[progressKeyForMode(mode)], corpus.getSentences().length);
      }
      if (mode === 'phrase') {
        return progress('Phrase', state.progress.phraseCurrentIndex, corpus.getPhrases().length);
      }
      if (mode === 'conversation') {
        return progress('Conversation', state.progress.conversationCurrentIndex, corpus.getConversations().length);
      }
      if (mode === 'favorites') {
        return getFavoriteProgress();
      }
      if (mode === 'mistakes') {
        return getMistakeProgress();
      }
      return progress('Sentence', state.progress.sentenceCurrentIndex, corpus.getSentences().length);
    }

    function getSentenceProgress() {
      return progress('Sentence', corpus.getSentenceIndex(state.currentItemId), corpus.getSentences().length);
    }

    function getPhraseProgress() {
      return progress('Phrase', corpus.getPhraseIndex(state.currentPhraseId), corpus.getPhrases().length);
    }

    function getConversationProgress() {
      return progress('Conversation', corpus.getConversationIndex(state.currentConversationId), corpus.getConversations().length);
    }

    function getFavoriteProgress() {
      var keys = collectionKeys('favorites');
      var index = collectionIndex('favorites');
      var ref = keys[index] ? state.favorites[keys[index]] : null;
      var label = ref && ref.type === 'phrase' ? 'Phrase' : (ref && ref.type === 'conversationTurn' ? 'Conversation' : 'Sentence');
      return progress(label, index, keys.length);
    }

    function getMistakeProgress() {
      return progress('Mistake', collectionIndex('mistakes'), collectionKeys('mistakes').length);
    }

    function getCurrentProgress() {
      if (state.mode === 'phrase') {
        return getPhraseProgress();
      }
      if (state.mode === 'conversation') {
        return getConversationProgress();
      }
      if (state.mode === 'favorites') {
        return getFavoriteProgress();
      }
      if (state.mode === 'mistakes') {
        return getMistakeProgress();
      }
      return getSentenceProgress();
    }

    function getProgressForMode(mode) {
      var item = progressForSavedMode(mode);
      return Object.assign({ mode: mode, modeLabel: modeLabel(mode) }, item);
    }

    function getRecentProgress() {
      var saved = storage.getRecent();
      if (!saved.lastMode) {
        return null;
      }
      return getProgressForMode(saved.lastMode);
    }

    function getDashboardProgress() {
      return ['sentence', 'phrase', 'conversation'].map(function mapMode(mode) {
        return getProgressForMode(mode);
      });
    }

    function modeLabel(modeId) {
      var mode = config.modes.find(function findMode(item) {
        return item.id === modeId;
      });
      return mode ? mode.label : modeId;
    }

    function openJumpDialog() {
      var current = getCurrentProgress();
      state.jumpDialogOpen = true;
      state.jumpValue = current.current ? String(current.current) : '1';
      notify();
    }

    function closeJumpDialog() {
      state.jumpDialogOpen = false;
      state.jumpValue = '';
      notify();
    }

    function setJumpValue(value) {
      state.jumpValue = String(value || '');
    }

    function jumpToCurrentMode(value) {
      var current = getCurrentProgress();
      var itemNumber = clampItemNumber(value === undefined ? state.jumpValue : value, current.total);
      var index = itemNumber ? itemNumber - 1 : -1;
      if (state.mode === 'phrase') {
        setPhraseByIndex(index);
      } else if (state.mode === 'conversation') {
        setConversationByIndex(index);
        state.currentTurnIndex = 0;
      } else if (state.mode === 'favorites') {
        setCollectionIndex('favorites', index);
      } else if (state.mode === 'mistakes') {
        setCollectionIndex('mistakes', index);
      } else {
        setSentenceByIndex(index);
      }
      resetVisibility();
      saveRecent();
      notify();
    }

    function getCurrentSentence() {
      return corpus.getSentenceById(state.currentItemId) || corpus.getSentencesByScene(state.scene)[0] || corpus.getSentences()[0] || null;
    }

    function getCurrentPhrase() {
      return corpus.getPhraseById(state.currentPhraseId) || corpus.getPhrases()[0] || null;
    }

    function getCurrentConversation() {
      return corpus.getConversationById(state.currentConversationId) || corpus.getConversationsByScene(state.scene)[0] || corpus.getConversations()[0] || null;
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
      if (state.mode === 'favorites') {
        saveRecent(state.currentFavoriteKey);
      }
      notify();
    }

    function sourceModeForCurrentMode() {
      if (state.mode === 'listening-challenge') {
        return 'listeningChallenge';
      }
      if (state.mode === 'conversation') {
        return 'conversation';
      }
      if (state.mode === 'listening') {
        return 'listening';
      }
      if (state.mode === 'phrase') {
        return 'phrase';
      }
      return 'sentence';
    }

    function sourceModeForRef(ref, existing) {
      if (existing && existing.sourceMode) {
        return existing.sourceMode;
      }
      if (ref && ref.sourceMode) {
        return ref.sourceMode;
      }
      if (ref && ref.type === 'phrase') {
        return 'phrase';
      }
      if (ref && ref.type === 'conversationTurn') {
        return 'conversation';
      }
      return sourceModeForCurrentMode();
    }

    function textForRef(ref) {
      var item = corpus.resolveRef(ref);
      if (!item) {
        return { zh: ref && ref.zh ? ref.zh : '', en: ref && ref.en ? ref.en : '' };
      }
      if (ref.type === 'phrase') {
        return { zh: item.meaning, en: item.phrase };
      }
      return {
        zh: item.cn || ref.zh || '',
        en: item.en || (item.answers && item.answers[0]) || ref.en || '',
      };
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
      var text = textForRef(target);
      existing.sourceMode = sourceModeForRef(target, existing);
      existing.zh = existing.zh || text.zh;
      existing.en = existing.en || text.en;
      existing.wrongCount += 1;
      existing.updatedAt = window.English365Stats.toDateString();
      state.mistakes[key] = existing;
      state.currentMistakeKey = state.currentMistakeKey || key;
      storage.saveMistakes(state.mistakes);
      state.stats = window.English365Stats.recordCompletion(state.stats, state.mode);
      saveStats();
      if (state.mode === 'mistakes') {
        saveRecent(key);
      } else {
        saveRecent(itemIdFromRef(target));
      }
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
      if (state.mode === 'mistakes') {
        saveRecent(state.currentMistakeKey || key);
      } else {
        saveRecent(itemIdFromRef(target));
      }
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
      getSentenceProgress: getSentenceProgress,
      getPhraseProgress: getPhraseProgress,
      getConversationProgress: getConversationProgress,
      getFavoriteProgress: getFavoriteProgress,
      getMistakeProgress: getMistakeProgress,
      getCurrentProgress: getCurrentProgress,
      getProgressForMode: getProgressForMode,
      getRecentProgress: getRecentProgress,
      getDashboardProgress: getDashboardProgress,
      openJumpDialog: openJumpDialog,
      closeJumpDialog: closeJumpDialog,
      setJumpValue: setJumpValue,
      jumpToCurrentMode: jumpToCurrentMode,
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
