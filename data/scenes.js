(function initScenes(window) {
  'use strict';

  var data = window.English365Data || {};
  data.scenes = [
    { id: 'daily-life', name: 'Daily Life' },
    { id: 'hotel', name: 'Hotel' },
    { id: 'travel', name: 'Travel' },
    { id: 'transportation', name: 'Transportation' },
    { id: 'restaurant', name: 'Restaurant' },
    { id: 'office', name: 'Office' },
    { id: 'meeting', name: 'Meeting' },
    { id: 'business', name: 'Business' },
    { id: 'sports', name: 'Sports' },
    { id: 'entertainment', name: 'Entertainment' },
  ];
  data.sentences = data.sentences || [];
  data.conversations = data.conversations || [];
  data.phrases = data.phrases || [];

  data.addSentences = function addSentences(scene, sentences) {
    sentences.forEach(function addScene(sentence) {
      data.sentences.push(Object.assign({ scene: scene }, sentence));
    });
  };

  data.addConversations = function addConversations(conversations) {
    conversations.forEach(function addConversation(conversation) {
      data.conversations.push(conversation);
    });
  };

  data.addPhrases = function addPhrases(phrases) {
    phrases.forEach(function addPhrase(phrase) {
      data.phrases.push(phrase);
    });
  };

  window.English365Data = data;
})(window);
