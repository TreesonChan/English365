(function initTts(window) {
  'use strict';

  function pickAmericanVoice() {
    if (!window.speechSynthesis || !window.speechSynthesis.getVoices) {
      return null;
    }
    var voices = window.speechSynthesis.getVoices();
    return voices.find(function findVoice(voice) {
      return voice.lang === 'en-US';
    }) || null;
  }

  function speak(text, rate) {
    if (!text || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      return;
    }
    var utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = Number(rate) || 1;
    utterance.pitch = 1;
    var voice = pickAmericanVoice();
    if (voice) {
      utterance.voice = voice;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  window.English365TTS = {
    speak: speak,
  };
})(window);
