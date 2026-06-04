(function initCorpusIndex(window) {
  'use strict';

  var data = window.English365Data;
  var expected = {
    sceneCount: 10,
    sentencesPerScene: 100,
    conversationsPerScene: 10,
    sentenceCount: 1000,
    conversationCount: 100,
  };

  function countByScene(items) {
    return items.reduce(function reduceCounts(counts, item) {
      counts[item.scene] = (counts[item.scene] || 0) + 1;
      return counts;
    }, {});
  }

  function getSummary() {
    return {
      sceneCount: data.scenes.length,
      sentenceCount: data.sentences.length,
      conversationCount: data.conversations.length,
      sentencesByScene: countByScene(data.sentences),
      conversationsByScene: countByScene(data.conversations),
    };
  }

  function validateCorpus() {
    var summary = getSummary();
    var errors = [];
    var sentenceIds = {};
    var conversationIds = {};

    if (summary.sceneCount !== expected.sceneCount) {
      errors.push('Expected ' + expected.sceneCount + ' scenes, found ' + summary.sceneCount + '.');
    }
    if (summary.sentenceCount !== expected.sentenceCount) {
      errors.push('Expected ' + expected.sentenceCount + ' sentences, found ' + summary.sentenceCount + '.');
    }
    if (summary.conversationCount !== expected.conversationCount) {
      errors.push('Expected ' + expected.conversationCount + ' conversations, found ' + summary.conversationCount + '.');
    }

    data.scenes.forEach(function checkScene(scene) {
      if (summary.sentencesByScene[scene.id] !== expected.sentencesPerScene) {
        errors.push(scene.id + ' should have ' + expected.sentencesPerScene + ' sentences.');
      }
      if (summary.conversationsByScene[scene.id] !== expected.conversationsPerScene) {
        errors.push(scene.id + ' should have ' + expected.conversationsPerScene + ' conversations.');
      }
    });

    data.sentences.forEach(function checkSentence(sentence) {
      if (sentenceIds[sentence.id]) {
        errors.push('Duplicate sentence id: ' + sentence.id);
      }
      sentenceIds[sentence.id] = true;
      if (!sentence.scene || !sentence.cn || !Array.isArray(sentence.answers) || sentence.answers.length === 0) {
        errors.push('Invalid sentence: ' + sentence.id);
      }
    });

    data.conversations.forEach(function checkConversation(conversation) {
      if (conversationIds[conversation.id]) {
        errors.push('Duplicate conversation id: ' + conversation.id);
      }
      conversationIds[conversation.id] = true;
      if (!conversation.scene || !Array.isArray(conversation.turns) || conversation.turns.length === 0) {
        errors.push('Invalid conversation: ' + conversation.id);
      }
    });

    return errors;
  }

  window.English365CorpusIndex = {
    expected: expected,
    getSummary: getSummary,
    validateCorpus: validateCorpus,
  };
})(window);
