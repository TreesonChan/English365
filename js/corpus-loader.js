(function initCorpusLoader(window) {
  'use strict';

  var data = window.English365Data;

  function getScenes() {
    return data.scenes.slice();
  }

  function getScene(sceneId) {
    return data.scenes.find(function findScene(scene) {
      return scene.id === sceneId;
    }) || data.scenes[0];
  }

  function getSentences() {
    return data.sentences.slice();
  }

  function getSentencesByScene(sceneId) {
    return data.sentences.filter(function filterSentence(sentence) {
      return sentence.scene === sceneId;
    });
  }

  function getSentenceById(id) {
    return data.sentences.find(function findSentence(sentence) {
      return sentence.id === id;
    }) || null;
  }

  function getSentenceIndex(currentId) {
    return data.sentences.findIndex(function findIndex(sentence) {
      return sentence.id === currentId;
    });
  }

  function getSentencesBySceneIndex(sceneId, currentId) {
    return getSentencesByScene(sceneId).findIndex(function findIndex(sentence) {
      return sentence.id === currentId;
    });
  }

  function getConversations() {
    return data.conversations.slice();
  }

  function getConversationsByScene(sceneId) {
    return data.conversations.filter(function filterConversation(conversation) {
      return conversation.scene === sceneId;
    });
  }

  function getConversationById(id) {
    return data.conversations.find(function findConversation(conversation) {
      return conversation.id === id;
    }) || null;
  }

  function getConversationIndex(currentId) {
    return data.conversations.findIndex(function findIndex(conversation) {
      return conversation.id === currentId;
    });
  }

  function getPhrases() {
    return data.phrases.slice();
  }

  function getPhraseById(id) {
    return data.phrases.find(function findPhrase(phrase) {
      return phrase.id === id;
    }) || null;
  }

  function getPhraseIndex(currentId) {
    return data.phrases.findIndex(function findIndex(phrase) {
      return phrase.id === currentId;
    });
  }

  function getNextPhrase(currentId) {
    var phrases = getPhrases();
    var index = getPhraseIndex(currentId);
    return index >= 0 && index < phrases.length - 1 ? phrases[index + 1] : null;
  }

  function getPrevPhrase(currentId) {
    var phrases = getPhrases();
    var index = getPhraseIndex(currentId);
    return index > 0 ? phrases[index - 1] : null;
  }

  function searchPhrases(query) {
    var normalized = String(query || '').trim().toLowerCase();
    if (!normalized) {
      return [];
    }
    return data.phrases.filter(function filterPhrase(phrase) {
      return phrase.phrase.toLowerCase().indexOf(normalized) !== -1 ||
        phrase.meaning.toLowerCase().indexOf(normalized) !== -1;
    });
  }

  function getNextSentence(sceneOrId, maybeCurrentId) {
    var currentId = maybeCurrentId || sceneOrId;
    var sentences = getSentences();
    var index = getSentenceIndex(currentId);
    return index >= 0 && index < sentences.length - 1 ? sentences[index + 1] : null;
  }

  function getPrevSentence(sceneOrId, maybeCurrentId) {
    var currentId = maybeCurrentId || sceneOrId;
    var sentences = getSentences();
    var index = getSentenceIndex(currentId);
    return index > 0 ? sentences[index - 1] : null;
  }

  function getRandomSentence(sceneId, excludeId) {
    var sentences = getSentencesByScene(sceneId).filter(function excludeCurrent(sentence) {
      return sentence.id !== excludeId;
    });
    if (sentences.length === 0) {
      sentences = getSentencesByScene(sceneId);
    }
    return sentences[Math.floor(Math.random() * sentences.length)] || null;
  }

  function getPrimaryEnglishForSentence(sentence) {
    return sentence && sentence.answers && sentence.answers[0] ? sentence.answers[0] : '';
  }

  function getPrimaryEnglishForPhrase(phrase) {
    return phrase ? phrase.phrase : '';
  }

  function getTurnEnglish(turn) {
    if (!turn) {
      return '';
    }
    if (turn.en) {
      return turn.en;
    }
    return turn.answers && turn.answers[0] ? turn.answers[0] : '';
  }

  function refKey(ref) {
    if (!ref) {
      return '';
    }
    if (ref.type === 'conversationTurn') {
      return 'conversationTurn:' + ref.conversationId + ':' + ref.turnIndex;
    }
    return ref.type + ':' + ref.id;
  }

  function resolveRef(ref) {
    if (!ref) {
      return null;
    }
    if (ref.type === 'sentence') {
      return getSentenceById(ref.id);
    }
    if (ref.type === 'phrase') {
      return getPhraseById(ref.id);
    }
    if (ref.type === 'conversationTurn') {
      var conversation = getConversationById(ref.conversationId);
      if (!conversation) {
        return null;
      }
      return conversation.turns[ref.turnIndex] || null;
    }
    return null;
  }

  window.English365Corpus = {
    getScenes: getScenes,
    getScene: getScene,
    getSentences: getSentences,
    getSentencesByScene: getSentencesByScene,
    getSentenceById: getSentenceById,
    getSentenceIndex: getSentenceIndex,
    getSentencesBySceneIndex: getSentencesBySceneIndex,
    getConversations: getConversations,
    getConversationsByScene: getConversationsByScene,
    getConversationById: getConversationById,
    getConversationIndex: getConversationIndex,
    getPhrases: getPhrases,
    getPhraseById: getPhraseById,
    getPhraseIndex: getPhraseIndex,
    getNextPhrase: getNextPhrase,
    getPrevPhrase: getPrevPhrase,
    searchPhrases: searchPhrases,
    getNextSentence: getNextSentence,
    getPrevSentence: getPrevSentence,
    getRandomSentence: getRandomSentence,
    getPrimaryEnglishForSentence: getPrimaryEnglishForSentence,
    getPrimaryEnglishForPhrase: getPrimaryEnglishForPhrase,
    getTurnEnglish: getTurnEnglish,
    refKey: refKey,
    resolveRef: resolveRef,
  };
})(window);
