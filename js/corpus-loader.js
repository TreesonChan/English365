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

  function getNextSentence(sceneId, currentId) {
    var sentences = getSentencesByScene(sceneId);
    if (sentences.length === 0) {
      return null;
    }
    var index = sentences.findIndex(function findIndex(sentence) {
      return sentence.id === currentId;
    });
    return sentences[(index + 1 + sentences.length) % sentences.length];
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
    getSentencesByScene: getSentencesByScene,
    getSentenceById: getSentenceById,
    getConversationsByScene: getConversationsByScene,
    getConversationById: getConversationById,
    getNextSentence: getNextSentence,
    getRandomSentence: getRandomSentence,
    getPrimaryEnglishForSentence: getPrimaryEnglishForSentence,
    getTurnEnglish: getTurnEnglish,
    refKey: refKey,
    resolveRef: resolveRef,
  };
})(window);
