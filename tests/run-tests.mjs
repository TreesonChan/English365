import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url);
const path = (name) => new URL(name, root);
const read = (name) => fs.readFileSync(path(name), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
  };
}

function createDocumentStub() {
  const noop = () => {};
  return {
    addEventListener: noop,
    querySelector() {
      return null;
    },
    getElementById() {
      return null;
    },
    createElement() {
      return {
        setAttribute: noop,
        appendChild: noop,
        classList: { add: noop, remove: noop, toggle: noop },
      };
    },
    body: {
      classList: { add: noop, remove: noop, toggle: noop },
      appendChild: noop,
    },
  };
}

function createContext() {
  const context = {
    console,
    localStorage: createMemoryStorage(),
    navigator: {},
    document: createDocumentStub(),
    SpeechSynthesisUtterance: function SpeechSynthesisUtterance(text) {
      this.text = text;
    },
    speechSynthesis: {
      cancel() {},
      speak() {},
      getVoices() {
        return [];
      },
    },
    location: { protocol: 'file:', hostname: '' },
    addEventListener() {},
    removeEventListener() {},
  };
  context.window = context;
  context.self = context;
  return context;
}

function loadScripts(context, files) {
  vm.createContext(context);
  for (const file of files) {
    vm.runInContext(read(file), context, { filename: file });
  }
}

function walkFiles(dir, list = []) {
  for (const entry of fs.readdirSync(path(dir), { withFileTypes: true })) {
    const name = dir + '/' + entry.name;
    if (entry.isDirectory()) {
      walkFiles(name, list);
    } else {
      list.push(name);
    }
  }
  return list;
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.message);
    process.exitCode = 1;
  }
}

const coreFiles = [
  'js/config.js',
  'data/scenes.js',
  'data/phrases.js',
  'data/daily-life.js',
  'data/daily-life-v2.js',
  'data/hotel.js',
  'data/hotel-v2.js',
  'data/travel.js',
  'data/travel-v2.js',
  'data/transportation.js',
  'data/transportation-v2.js',
  'data/restaurant.js',
  'data/restaurant-v2.js',
  'data/office.js',
  'data/office-v2.js',
  'data/meeting.js',
  'data/meeting-v2.js',
  'data/business.js',
  'data/business-v2.js',
  'data/sports.js',
  'data/sports-v2.js',
  'data/entertainment.js',
  'data/entertainment-v2.js',
  'data/conversations.js',
  'data/conversations-v2.js',
  'data/index.js',
  'js/storage.js',
  'js/corpus-loader.js',
  'js/stats.js',
  'js/store.js',
];

const uiModeFiles = [
  'js/ui/cards.js',
  'js/ui/buttons.js',
  'js/modes/phrase-mode.js',
  'js/modes/listening-challenge-mode.js',
  'js/modes/statistics-mode.js',
];

const fullAppFiles = coreFiles.concat([
  'js/tts.js',
  'js/ui/cards.js',
  'js/ui/buttons.js',
  'js/ui/toast.js',
  'js/ui/home.js',
  'js/modes/sentence-mode.js',
  'js/modes/conversation-mode.js',
  'js/modes/listening-mode.js',
  'js/modes/phrase-mode.js',
  'js/modes/listening-challenge-mode.js',
  'js/modes/statistics-mode.js',
  'js/modes/favorites-mode.js',
  'js/modes/mistakes-mode.js',
  'app.js',
]);

const context = createContext();
loadScripts(context, coreFiles);

test('project uses the confirmed static structure without router.js', () => {
  assert(fs.existsSync(path('index.html')), 'index.html exists');
  assert(fs.existsSync(path('style.css')), 'style.css exists');
  assert(fs.existsSync(path('app.js')), 'app.js exists');
  assert(!fs.existsSync(path('js/router.js')), 'router.js must not exist');
  assert(!read('index.html').includes('router.js'), 'index.html must not reference router.js');
});

test('root layout is centered and mobile-safe', () => {
  const css = read('style.css');
  assert(css.includes('max-width: 1200px'), 'root content container has 1200px max width');
  assert(css.includes('margin: 0 auto'), 'root content container centers itself');
  assert(css.includes('overflow-x: hidden'), 'body prevents horizontal page scrolling');
  assert(css.includes('grid-template-columns: repeat(2, minmax(0, 1fr))'), 'mobile primary mode grid uses two columns');
});

test('index.html loads every v2 corpus data pack before the corpus index', () => {
  const html = read('index.html');
  const expectedDataFiles = coreFiles.filter((file) => file.startsWith('data/'));
  for (const file of expectedDataFiles) {
    assert(html.includes('src="' + file + '"'), 'index.html references ' + file);
  }
  assert(
    html.indexOf('src="data/conversations-v2.js"') < html.indexOf('src="data/index.js"'),
    'v2 conversations load before the corpus index'
  );
});

test('version is centralized and rendered in the footer', () => {
  assertEqual(context.English365Config.version, 'V1.4.0', 'configured app version');

  const runtimeFiles = ['index.html', 'app.js', 'style.css', 'service-worker.js']
    .concat(walkFiles('js'))
    .concat(walkFiles('data'))
    .concat(['manifest.json']);
  const versionOccurrences = [];
  for (const file of runtimeFiles) {
    const matches = read(file).match(/V1.4.0/g) || [];
    for (let index = 0; index < matches.length; index += 1) {
      versionOccurrences.push(file);
    }
  }
  assertEqual(versionOccurrences.length, 1, 'single runtime version literal');
  assertEqual(versionOccurrences[0], 'js/config.js', 'runtime version literal lives in config');

  const html = read('index.html');
  assert(html.includes('<footer'), 'index.html has a footer element');
  assert(html.includes('id="app-version"'), 'footer has app-version id');

  const appRoot = { innerHTML: '', addEventListener() {} };
  const versionRoot = { textContent: '' };
  const appContext = createContext();
  appContext.document = {
    addEventListener(event, callback) {
      if (event === 'DOMContentLoaded') {
        callback();
      }
    },
    getElementById(id) {
      if (id === 'app-root') {
        return appRoot;
      }
      if (id === 'app-version') {
        return versionRoot;
      }
      return null;
    },
    querySelector() { return null; },
    createElement() {
      return { setAttribute() {}, appendChild() {}, classList: { add() {}, remove() {}, toggle() {} } };
    },
    body: { classList: { add() {}, remove() {}, toggle() {} }, appendChild() {} },
  };
  loadScripts(appContext, fullAppFiles);
  assertEqual(versionRoot.textContent, 'Version ' + appContext.English365Config.version, 'footer renders configured version');
});

test('Listening Challenge Mode is registered in app entry points', () => {
  const modeIds = context.English365Config.modes.map((mode) => mode.id);
  assert(modeIds.includes('listening-challenge'), 'config registers listening-challenge mode');
  const html = read('index.html');
  assert(html.includes('src="js/modes/listening-challenge-mode.js"'), 'index.html loads listening challenge mode');
  assert(read('service-worker.js').includes('./js/modes/listening-challenge-mode.js'), 'service worker caches listening challenge mode');
});

test('Statistics Mode is registered in app entry points', () => {
  const modeIds = context.English365Config.modes.map((mode) => mode.id);
  assert(modeIds.includes('statistics'), 'config registers statistics mode');
  const html = read('index.html');
  assert(html.includes('src="js/modes/statistics-mode.js"'), 'index.html loads statistics mode');
  assert(read('service-worker.js').includes('./js/modes/statistics-mode.js'), 'service worker caches statistics mode');
});

test('Phrase Mode is registered in app entry points', () => {
  const modeIds = context.English365Config.modes.map((mode) => mode.id);
  assertEqual(modeIds[0], 'phrase', 'phrase mode is first');
  assert(modeIds.includes('phrase'), 'config registers phrase mode');
  const html = read('index.html');
  assert(html.includes('src="data/phrases.js"'), 'index.html loads phrase data');
  assert(html.includes('src="js/modes/phrase-mode.js"'), 'index.html loads phrase mode');
  assert(read('service-worker.js').includes('./data/phrases.js'), 'service worker caches phrase data');
  assert(read('service-worker.js').includes('./js/modes/phrase-mode.js'), 'service worker caches phrase mode');
});

test('localStorage keys keep the confirmed v1 contract', () => {
  const keys = context.English365Config.storageKeys;
  assertEqual(keys.favorites, 'e365:v1:favorites', 'favorites key');
  assertEqual(keys.mistakes, 'e365:v1:mistakes', 'mistakes key');
  assertEqual(keys.stats, 'e365:v1:stats', 'stats key');
  assertEqual(keys.recent, 'e365:v1:recent', 'recent key');
  assertEqual(keys.prefs, 'e365:v1:prefs', 'prefs key');
  assertEqual(keys.progress, 'e365:v1:progress', 'progress key');
});

test('corpus contains 10 scenes, 1000 sentences, and 100 conversations', () => {
  const summary = context.English365CorpusIndex.getSummary();
  assertEqual(summary.sceneCount, 10, 'scene count');
  assertEqual(summary.sentenceCount, 1000, 'sentence count');
  assertEqual(summary.conversationCount, 100, 'conversation count');
  assertEqual(summary.phraseCount, 100, 'phrase count');
  assertEqual(context.English365CorpusIndex.expected.sentencesPerScene, 100, 'expected sentences per scene');
  assertEqual(context.English365CorpusIndex.expected.conversationsPerScene, 10, 'expected conversations per scene');
  assertEqual(context.English365CorpusIndex.expected.sentenceCount, 1000, 'expected sentence count');
  assertEqual(context.English365CorpusIndex.expected.conversationCount, 100, 'expected conversation count');
  assertEqual(context.English365CorpusIndex.expected.phraseCount, 100, 'expected phrase count');
  assertEqual(context.English365CorpusIndex.validateCorpus().length, 0, 'corpus validation errors');

  for (const scene of context.English365Data.scenes) {
    assertEqual(summary.sentencesByScene[scene.id], 100, `${scene.id} sentence count`);
    assertEqual(summary.conversationsByScene[scene.id], 10, `${scene.id} conversation count`);
  }
});

test('corpus ids are unique and every training item has real text', () => {
  const sentenceIds = new Set();
  for (const sentence of context.English365Data.sentences) {
    assert(!sentenceIds.has(sentence.id), `duplicate sentence id ${sentence.id}`);
    sentenceIds.add(sentence.id);
    assert(sentence.scene, `${sentence.id} has scene`);
    assert(sentence.cn && sentence.cn.length >= 3, `${sentence.id} has Chinese prompt`);
    assert(Array.isArray(sentence.answers) && sentence.answers.length > 0, `${sentence.id} has answers`);
    assert(sentence.answers.every((answer) => answer.includes(' ') && !answer.includes('PLACEHOLDER')), `${sentence.id} answers are real text`);
  }

  const conversationIds = new Set();
  for (const conversation of context.English365Data.conversations) {
    assert(!conversationIds.has(conversation.id), `duplicate conversation id ${conversation.id}`);
    conversationIds.add(conversation.id);
    assert(conversation.turns.length >= 4, `${conversation.id} has enough turns`);
    for (const turn of conversation.turns) {
      assert(turn.role, `${conversation.id} turn has role`);
      assert(turn.cn, `${conversation.id} turn has Chinese`);
      assert(turn.en || (Array.isArray(turn.answers) && turn.answers.length > 0), `${conversation.id} turn has English`);
    }
  }

  const phraseIds = new Set();
  for (const phrase of context.English365Data.phrases) {
    assert(!phraseIds.has(phrase.id), 'duplicate phrase id ' + phrase.id);
    phraseIds.add(phrase.id);
    assert(phrase.phrase && phrase.phrase.length >= 2, phrase.id + ' has phrase text');
    assert(phrase.meaning && phrase.meaning.length >= 2, phrase.id + ' has Chinese meaning');
    assert(phrase.category, phrase.id + ' has category');
    assert(Array.isArray(phrase.examples) && phrase.examples.length >= 3, phrase.id + ' has examples');
  }
});

test('Phrase Mode renders Chinese-first recall, search, and phrase refs', () => {
  assert(fs.existsSync(path('js/modes/phrase-mode.js')), 'phrase mode file exists');
  const phraseContext = createContext();
  loadScripts(phraseContext, coreFiles.concat([
    'js/ui/cards.js',
    'js/ui/buttons.js',
    'js/modes/phrase-mode.js',
    'js/modes/favorites-mode.js',
    'js/modes/mistakes-mode.js',
  ]));
  const store = phraseContext.English365Store.createStore();
  store.openMode('phrase');

  let state = store.getState();
  const renderer = phraseContext.English365Modes.phrase;
  let html = renderer.render(store, state);
  assertEqual(state.mode, 'phrase', 'phrase mode selected');
  assert(html.includes('Phrase Mode'), 'phrase page title');
  assert(html.includes('Search Phrase'), 'phrase search rendered');
  assert(html.includes('Requests'), 'phrase category rendered');
  assert(html.includes('我想要'), 'phrase meaning rendered');
  assert(html.includes('Show Phrase'), 'show phrase button rendered');
  assert(!html.includes('I&#39;d like to...'), 'English phrase hidden initially');
  assert(!html.includes('Play Audio'), 'audio hidden initially');
  assert(!html.includes('Build a Sentence'), 'build sentence hidden until phrase reveal');
  assert(!html.includes('I&#39;d like to book a room.'), 'examples hidden initially');
  assert(html.includes('data-action="prev-phrase" disabled'), 'previous is disabled at first phrase');

  store.showAnswer();
  html = renderer.render(store, store.getState());
  assert(html.includes('I&#39;d like to...'), 'English phrase reveals after Show Phrase');
  assert(html.includes('Play Audio'), 'audio appears after phrase reveal');
  assert(html.includes('Build a Sentence'), 'build sentence appears after phrase reveal');
  assert(html.includes('Show Examples'), 'examples have separate reveal button');
  assert(!html.includes('I&#39;d like to book a room.'), 'examples still hidden after phrase reveal');

  store.showExamples();
  html = renderer.render(store, store.getState());
  assert(html.includes('I&#39;d like to book a room.'), 'examples reveal after Show Examples');
  assert(html.includes('data-action="play-phrase-example"'), 'example sentences are playable');

  store.setPhraseSearchQuery("I'm looking");
  assertEqual(store.getState().currentPhraseId, 'phrase-003', 'English search locates phrase');
  store.setPhraseSearchQuery('我想要');
  assertEqual(store.getState().currentPhraseId, 'phrase-001', 'Chinese search locates phrase');
  store.setPhraseSearchQuery('你能不能');
  assertEqual(store.getState().currentPhraseId, 'phrase-005', 'Chinese request search locates phrase');

  const ref = store.currentRef();
  store.toggleFavorite();
  let favorites = phraseContext.English365Storage.getFavorites();
  assert(favorites['phrase:phrase-005'], 'phrase favorite saved');
  const favoritesHtml = phraseContext.English365Modes.favorites.render(store, store.getState());
  assert(favoritesHtml.includes('Favorite Sentences'), 'favorites show sentence group');
  assert(favoritesHtml.includes('Favorite Conversations'), 'favorites show conversation group');
  assert(favoritesHtml.includes('Favorite Phrases'), 'favorites show phrase group');
  assert(favoritesHtml.includes('Could you...?'), 'favorites render phrase text');

  store.markWrong(ref);
  const mistake = phraseContext.English365Storage.getMistakes()['phrase:phrase-005'];
  assert(mistake, 'unknown phrase saved to mistakes');
  assertEqual(mistake.sourceMode, 'phrase', 'phrase mistake stores source mode');
  assertEqual(mistake.zh, '你能不能……？', 'phrase mistake stores Chinese meaning');
  assertEqual(mistake.en, 'Could you...?', 'phrase mistake stores English phrase');
  assertEqual(store.getState().stats.totalLearned, 1, 'phrase unknown counts as learning activity');
  store.setMode('mistakes');
  let mistakesHtml = phraseContext.English365Modes.mistakes.render(store, store.getState());
  assert(mistakesHtml.includes('你能不能'), 'phrase mistake starts with Chinese meaning');
  assert(mistakesHtml.includes('Show Phrase'), 'phrase mistake uses Show Phrase');
  assert(!mistakesHtml.includes('Could you...?'), 'phrase mistake hides English initially');
  store.showAnswer();
  mistakesHtml = phraseContext.English365Modes.mistakes.render(store, store.getState());
  assert(mistakesHtml.includes('Could you...?'), 'phrase mistake reveals phrase after Show Phrase');
  assert(mistakesHtml.includes('Show Examples'), 'phrase mistake keeps examples behind a separate button');
});

test('Listening Challenge hides prompts until answer and can add mistakes', () => {
  assert(fs.existsSync(path('js/modes/listening-challenge-mode.js')), 'listening challenge mode file exists');
  const challengeContext = createContext();
  loadScripts(challengeContext, coreFiles.concat(uiModeFiles));
  const store = challengeContext.English365Store.createStore();

  store.setScene('daily-life');
  store.selectSentenceById('daily-life-001');
  store.openMode('listening-challenge');

  let state = store.getState();
  assertEqual(state.mode, 'listening-challenge', 'challenge mode selected');
  assertEqual(state.currentItemId, 'daily-life-001', 'challenge resumes the saved sentence on entry');

  const sentence = store.getCurrentSentence();
  const renderer = challengeContext.English365Modes['listening-challenge'];
  const initialHtml = renderer.render(store, state);
  assert(initialHtml.includes('▶ Play'), 'challenge starts with one Play button');
  assert(!initialHtml.includes('>Replay<'), 'challenge does not render a separate Replay button');
  assert(!initialHtml.includes('class="play-button"'), 'challenge does not use oversized circular play button');
  assertEqual((initialHtml.match(/data-action="play-current"/g) || []).length, 1, 'challenge has one audio control');
  assert(initialHtml.includes('Show Answer'), 'challenge shows Show Answer');
  assert(initialHtml.includes('Next'), 'challenge shows Next');

  store.markAudioPlayed();
  state = store.getState();
  const replayHtml = renderer.render(store, state);
  assert(replayHtml.includes('↻ Replay'), 'same audio button becomes Replay after first play');
  assertEqual((replayHtml.match(/data-action="play-current"/g) || []).length, 1, 'replay state still has one audio control');
  assert(!initialHtml.includes(challengeContext.English365UI.escapeHtml(sentence.cn)), 'initial challenge hides Chinese');
  for (const answer of sentence.answers) {
    assert(!initialHtml.includes(challengeContext.English365UI.escapeHtml(answer)), 'initial challenge hides English answer');
  }

  store.showAnswer();
  state = store.getState();
  const answerHtml = renderer.render(store, state);
  assert(answerHtml.includes(challengeContext.English365UI.escapeHtml(sentence.cn)), 'answer view shows Chinese');
  assert(answerHtml.includes(challengeContext.English365UI.escapeHtml(sentence.answers[0])), 'answer view shows English');
  assert(answerHtml.includes('✓ I Got It'), 'answer view shows got it');
  assert(answerHtml.includes('✗ Still Need Practice'), 'answer view shows still need practice');

  const ref = store.currentRef();
  store.markWrong();
  const mistake = challengeContext.English365Storage.getMistakes()[challengeContext.English365Corpus.refKey(ref)];
  assert(mistake, 'Did not understand adds current sentence to mistakes');
  assertEqual(mistake.sourceMode, 'listeningChallenge', 'challenge mistake stores source mode');
  assertEqual(mistake.wrongCount, 1, 'challenge mistake wrong count');
});

test('learning time statistics round minutes and build a one-year heatmap', () => {
  let stats = context.English365Storage.createDefaultStats();
  assertEqual(stats.totalLearningMs, 0, 'default total learning ms');
  assertEqual(Object.keys(stats.dailyLearningMs).length, 0, 'default daily learning ms');

  stats = context.English365Stats.recordActiveTime(stats, 61000, new Date('2026-06-05T08:00:00Z'));
  stats = context.English365Stats.recordActiveTime(stats, 1000, new Date('2026-06-05T08:02:00Z'));
  stats = context.English365Stats.recordActiveTime(stats, 60000, new Date('2026-06-04T08:00:00Z'));

  assertEqual(context.English365Stats.getTodayLearningMinutes(stats, new Date('2026-06-05T10:00:00Z')), 2, 'today learning minutes round up');
  assertEqual(context.English365Stats.getTotalLearningMinutes(stats), 3, 'total learning minutes round up');

  const heatmap = context.English365Stats.getLearningHeatmap(stats, new Date('2026-06-05T10:00:00Z'));
  assertEqual(heatmap.length, 365, 'heatmap has 365 days');
  assertEqual(heatmap[heatmap.length - 1].date, '2026-06-05', 'heatmap ends today');
  assertEqual(heatmap[heatmap.length - 1].minutes, 2, 'heatmap today minutes');
  assert(heatmap.some((day) => day.date === '2026-06-04' && day.minutes === 1), 'heatmap includes previous day minutes');
});

test('Statistics Mode renders summary cards and heatmap days', () => {
  assert(fs.existsSync(path('js/modes/statistics-mode.js')), 'statistics mode file exists');
  const statisticsContext = createContext();
  loadScripts(statisticsContext, coreFiles.concat([
    'js/ui/cards.js',
    'js/ui/buttons.js',
    'js/modes/statistics-mode.js',
  ]));
  const store = statisticsContext.English365Store.createStore();
  let stats = store.getState().stats;
  stats = statisticsContext.English365Stats.recordActiveTime(stats, 61000, new Date('2026-06-05T08:00:00Z'));
  statisticsContext.English365Storage.saveStats(stats);
  const updatedStore = statisticsContext.English365Store.createStore();
  updatedStore.setMode('statistics');
  const html = statisticsContext.English365Modes.statistics.render(updatedStore, updatedStore.getState());

  assert(html.includes('Learning Statistics'), 'statistics page title');
  assert(html.includes('statistics-overview-grid'), 'statistics overview grid rendered');
  assert(html.includes('Learning Time'), 'learning time section rendered');
  assert(html.includes('Daily Activity'), 'daily activity section rendered');
  assert(html.includes('Year Heatmap'), 'year heatmap section rendered');
  assert(html.includes('Mode Progress'), 'mode progress section rendered');
  assert(html.includes('Favorites'), 'favorites metric rendered');
  assert(html.includes('Mistakes'), 'mistakes metric rendered');
  assert(html.includes('Today&#39;s Learning Time'), 'today learning time card');
  assert(html.includes('Total Learning Time'), 'total learning time card');
  assert(html.includes('heatmap-grid'), 'heatmap grid rendered');
  assert(html.includes('data-minutes="2"'), 'heatmap day includes exact minutes');
  assert(html.includes('data-action="select-heatmap-day"'), 'heatmap day is clickable');
  assert(html.includes('heatmap-day-detail'), 'heatmap day detail rendered');
});

test('all learning modes expose consistent Previous and Next navigation', () => {
  const navContext = createContext();
  loadScripts(navContext, coreFiles.concat([
    'js/ui/cards.js',
    'js/ui/buttons.js',
    'js/modes/phrase-mode.js',
    'js/modes/sentence-mode.js',
    'js/modes/conversation-mode.js',
    'js/modes/listening-mode.js',
    'js/modes/listening-challenge-mode.js',
    'js/modes/favorites-mode.js',
    'js/modes/mistakes-mode.js',
  ]));
  const store = navContext.English365Store.createStore();

  store.setScene('daily-life');
  store.selectSentenceById('daily-life-001');
  store.setMode('sentence');
  let html = navContext.English365Modes.sentence.render(store, store.getState());
  assert(html.includes('data-action="prev-sentence" disabled'), 'sentence previous disabled at first item');
  assert(html.includes('data-action="next-sentence"'), 'sentence next rendered');
  store.nextSentence(false);
  html = navContext.English365Modes.sentence.render(store, store.getState());
  assert(!html.includes('data-action="prev-sentence" disabled'), 'sentence previous enabled after moving forward');

  store.setMode('listening');
  html = navContext.English365Modes.listening.render(store, store.getState());
  assert(html.includes('data-action="prev-sentence"'), 'listening previous rendered');
  assert(html.includes('data-action="next-sentence"'), 'listening next rendered');

  store.selectSentenceById('daily-life-001');
  store.setMode('listening-challenge');
  html = navContext.English365Modes['listening-challenge'].render(store, store.getState());
  assert(html.includes('data-action="prev-sentence" disabled'), 'listening challenge previous disabled at first item');
  assert(html.includes('data-action="next-sentence"'), 'listening challenge next rendered');

  store.startConversation('hotel');
  store.setMode('conversation');
  html = navContext.English365Modes.conversation.render(store, store.getState());
  assert(html.includes('data-action="prev-turn" disabled'), 'conversation previous disabled at first turn');
  assert(html.includes('data-action="next-turn"'), 'conversation next rendered');
  store.nextTurn();
  html = navContext.English365Modes.conversation.render(store, store.getState());
  assert(!html.includes('data-action="prev-turn" disabled'), 'conversation previous enabled after moving forward');

  store.openMode('phrase');
  html = navContext.English365Modes.phrase.render(store, store.getState());
  assert(html.includes('data-action="prev-phrase" disabled'), 'phrase previous disabled at first phrase');
  assert(html.includes('data-action="next-phrase"'), 'phrase next rendered');
  store.nextPhrase();
  html = navContext.English365Modes.phrase.render(store, store.getState());
  assert(!html.includes('data-action="prev-phrase" disabled'), 'phrase previous enabled after moving forward');

  store.toggleFavorite({ type: 'sentence', id: 'hotel-001', scene: 'hotel' });
  store.toggleFavorite({ type: 'conversationTurn', conversationId: 'hotel-conv-001', id: 'hotel-conv-001:0', scene: 'hotel', turnIndex: 0 });
  store.toggleFavorite({ type: 'phrase', id: 'phrase-001', scene: 'hotel' });
  store.setMode('favorites');
  html = navContext.English365Modes.favorites.render(store, store.getState());
  assert(html.includes('Favorite Conversations'), 'favorites include conversation group');
  assert(html.includes('data-action="prev-favorite" disabled'), 'favorites previous disabled at first item');
  assert(html.includes('data-action="next-favorite"'), 'favorites next rendered');
  store.nextFavorite();
  html = navContext.English365Modes.favorites.render(store, store.getState());
  assert(!html.includes('data-action="prev-favorite" disabled'), 'favorites previous enabled after moving forward');
  const restoredFavorites = navContext.English365Store.createStore();
  assertEqual(restoredFavorites.getState().currentFavoriteKey, store.getState().currentFavoriteKey, 'favorite cursor restores after refresh');

  store.markWrong({ type: 'sentence', id: 'hotel-002', scene: 'hotel' });
  store.markWrong({ type: 'phrase', id: 'phrase-002', scene: 'hotel' });
  store.setMode('mistakes');
  html = navContext.English365Modes.mistakes.render(store, store.getState());
  assert(html.includes('data-action="prev-mistake" disabled'), 'mistakes previous disabled at first item');
  assert(html.includes('data-action="next-mistake"'), 'mistakes next rendered');
  store.nextMistake();
  html = navContext.English365Modes.mistakes.render(store, store.getState());
  assert(!html.includes('data-action="prev-mistake" disabled'), 'mistakes previous enabled after moving forward');
  const restoredMistakes = navContext.English365Store.createStore();
  assertEqual(restoredMistakes.getState().currentMistakeKey, store.getState().currentMistakeKey, 'mistake cursor restores after refresh');
});

test('learning modes render live progress indicators and active mistake recall', () => {
  const progressContext = createContext();
  loadScripts(progressContext, coreFiles.concat([
    'js/ui/cards.js',
    'js/ui/buttons.js',
    'js/modes/phrase-mode.js',
    'js/modes/sentence-mode.js',
    'js/modes/conversation-mode.js',
    'js/modes/listening-mode.js',
    'js/modes/listening-challenge-mode.js',
    'js/modes/favorites-mode.js',
    'js/modes/mistakes-mode.js',
  ]));
  const store = progressContext.English365Store.createStore();

  store.selectSentenceById('daily-life-001');
  store.setMode('sentence');
  let html = progressContext.English365Modes.sentence.render(store, store.getState());
  assert(html.includes('Sentence 1 / 1000'), 'sentence mode shows global progress');
  store.nextSentence(false);
  html = progressContext.English365Modes.sentence.render(store, store.getState());
  assert(html.includes('Sentence 2 / 1000'), 'sentence progress updates after next');

  store.setMode('listening');
  html = progressContext.English365Modes.listening.render(store, store.getState());
  assert(html.includes('Sentence 2 / 1000'), 'listening mode shows sentence progress');

  store.setMode('listening-challenge');
  html = progressContext.English365Modes['listening-challenge'].render(store, store.getState());
  assert(html.includes('Sentence 2 / 1000'), 'listening challenge shows sentence progress');

  store.startConversation('hotel');
  store.setMode('conversation');
  const conversationProgress = store.getConversationProgress();
  html = progressContext.English365Modes.conversation.render(store, store.getState());
  assert(html.includes('Conversation ' + conversationProgress.current + ' / 100'), 'conversation mode shows conversation progress');

  store.openMode('phrase');
  html = progressContext.English365Modes.phrase.render(store, store.getState());
  assert(html.includes('Phrase 1 / 100'), 'phrase mode shows phrase progress');

  store.toggleFavorite({ type: 'sentence', id: 'hotel-001', scene: 'hotel' });
  store.toggleFavorite({ type: 'conversationTurn', conversationId: 'hotel-conv-001', id: 'hotel-conv-001:0', scene: 'hotel', turnIndex: 0 });
  store.toggleFavorite({ type: 'phrase', id: 'phrase-001', scene: 'hotel' });
  store.setMode('favorites');
  html = progressContext.English365Modes.favorites.render(store, store.getState());
  assert(html.includes('Sentence 1 / 3'), 'favorites show current collection position');
  store.nextFavorite();
  html = progressContext.English365Modes.favorites.render(store, store.getState());
  assert(html.includes('Conversation 2 / 3'), 'favorites progress updates by current item type');

  store.setMode('sentence');
  store.selectSentenceById('hotel-001');
  store.markWrong();
  let mistake = progressContext.English365Storage.getMistakes()['sentence:hotel-001'];
  assertEqual(mistake.sourceMode, 'sentence', 'sentence mistake stores source mode');
  assert(mistake.zh && mistake.en, 'sentence mistake stores review text');
  store.setMode('listening-challenge');
  store.selectSentenceById('hotel-002');
  store.markWrong();
  mistake = progressContext.English365Storage.getMistakes()['sentence:hotel-002'];
  assertEqual(mistake.sourceMode, 'listeningChallenge', 'listening challenge mistake stores source mode');

  store.setMode('mistakes');
  html = progressContext.English365Modes.mistakes.render(store, store.getState());
  assert(html.includes('Mistake 1 / 2'), 'mistakes show collection progress');
  assert(html.includes('Show Answer'), 'sentence mistake starts with show answer');
  assert(!html.includes(progressContext.English365UI.escapeHtml(progressContext.English365Storage.getMistakes()['sentence:hotel-001'].en)), 'sentence mistake hides English initially');
  store.showAnswer();
  html = progressContext.English365Modes.mistakes.render(store, store.getState());
  assert(html.includes('✓ I Got It'), 'mistake review shows got it after reveal');
  assert(html.includes('✗ Still Need Practice'), 'mistake review shows still need practice after reveal');
  store.nextMistake();
  html = progressContext.English365Modes.mistakes.render(store, store.getState());
  assert(html.includes('Mistake 2 / 2'), 'mistake progress updates after next');
  assert(html.includes('Play Audio'), 'listening challenge mistake keeps audio available');
});

test('V2 learning pages use focused cards and learner-friendly evaluation labels', () => {
  const visualContext = createContext();
  loadScripts(visualContext, coreFiles.concat([
    'js/ui/cards.js',
    'js/ui/buttons.js',
    'js/modes/sentence-mode.js',
    'js/modes/phrase-mode.js',
    'js/modes/listening-challenge-mode.js',
  ]));
  const store = visualContext.English365Store.createStore();

  store.setMode('sentence');
  let html = visualContext.English365Modes.sentence.render(store, store.getState());
  assert(html.includes('learning-question-card'), 'sentence mode uses focused question card');
  assert(html.includes('progress-bar-fill'), 'learning mode shows visual progress bar');
  assert(html.includes('✓ I Got It'), 'correct action uses learner-friendly label');
  assert(html.includes('✗ Still Need Practice'), 'wrong action uses learner-friendly label');
  assert(!html.includes('>Correct<'), 'old Correct label removed');
  assert(!html.includes('>Wrong<'), 'old Wrong label removed');

  store.showAnswer();
  html = visualContext.English365Modes.sentence.render(store, store.getState());
  assert(html.includes('answer-reveal-card'), 'answer reveal uses dedicated card');

  store.setMode('listening-challenge');
  html = visualContext.English365Modes['listening-challenge'].render(store, store.getState());
  assert(html.includes('learning-question-card'), 'listening challenge uses focused card');
  store.showAnswer();
  html = visualContext.English365Modes['listening-challenge'].render(store, store.getState());
  assert(html.includes('✓ I Got It'), 'challenge understood label updated');
  assert(html.includes('✗ Still Need Practice'), 'challenge wrong label updated');
});

test('Continue Learning saves lastMode, lastScene, and lastItemId', () => {
  const store = context.English365Store.createStore();
  store.setMode('listening');
  store.setScene('hotel');
  store.selectSentenceById('hotel-001');

  const recent = context.English365Storage.getRecent();
  assertEqual(recent.lastMode, 'listening', 'recent mode');
  assertEqual(recent.lastScene, 'hotel', 'recent scene');
  assertEqual(recent.lastItemId, 'hotel-001', 'recent item');

  const restored = context.English365Store.createStore();
  assertEqual(restored.getState().mode, 'listening', 'restored mode');
  assertEqual(restored.getState().scene, 'hotel', 'restored scene');
  assertEqual(restored.getState().currentItemId, 'hotel-001', 'restored item');
});

test('Continue Learning stores independent mode progress and restores exact positions', () => {
  const progressContext = createContext();
  loadScripts(progressContext, fullAppFiles);
  const store = progressContext.English365Store.createStore();

  store.openMode('sentence');
  store.jumpToCurrentMode(358);
  assertEqual(store.getState().currentItemId, 'transportation-058', 'sentence jumps to global item 358');

  store.openMode('phrase');
  store.jumpToCurrentMode(42);
  assertEqual(store.getState().currentPhraseId, 'phrase-042', 'phrase jumps to item 42');

  store.openMode('conversation');
  store.jumpToCurrentMode(15);
  assertEqual(store.getState().currentConversationId, 'business-conv-001', 'conversation jumps to item 15');

  const progress = progressContext.English365Storage.getProgress();
  assertEqual(progress.sentenceCurrentIndex, 357, 'sentence progress stored independently');
  assertEqual(progress.phraseCurrentIndex, 41, 'phrase progress stored independently');
  assertEqual(progress.conversationCurrentIndex, 14, 'conversation progress stored independently');

  const restored = progressContext.English365Store.createStore();
  restored.openMode('sentence');
  assertEqual(restored.getState().currentItemId, 'transportation-058', 'sentence mode resumes last item');
  restored.openMode('phrase');
  assertEqual(restored.getState().currentPhraseId, 'phrase-042', 'phrase mode resumes last item');
  restored.openMode('conversation');
  assertEqual(restored.getState().currentConversationId, 'business-conv-001', 'conversation mode resumes last item');

  const recentProgress = restored.getRecentProgress();
  assertEqual(recentProgress.mode, 'conversation', 'recent progress tracks most recent mode');
  assertEqual(recentProgress.label, 'Conversation', 'recent progress label');
  assertEqual(recentProgress.current, 15, 'recent progress item number');
  assertEqual(recentProgress.total, 100, 'recent progress total');

  restored.openMode('sentence');
  restored.jumpToCurrentMode(358);
  restored.openMode('listening');
  restored.jumpToCurrentMode(10);
  restored.openMode('statistics');
  assertEqual(progressContext.English365Storage.getProgress().sentenceCurrentIndex, 357, 'statistics mode does not overwrite sentence progress');
});

test('Jump To dialog clamps values and progress displays percentage and bar', () => {
  const jumpContext = createContext();
  loadScripts(jumpContext, coreFiles.concat([
    'js/ui/cards.js',
    'js/ui/buttons.js',
    'js/modes/sentence-mode.js',
    'js/modes/phrase-mode.js',
    'js/modes/favorites-mode.js',
    'js/modes/mistakes-mode.js',
  ]));
  const store = jumpContext.English365Store.createStore();

  store.openMode('sentence');
  store.openJumpDialog();
  let html = jumpContext.English365Modes.sentence.render(store, store.getState());
  assert(html.includes('data-action="open-jump"'), 'jump button rendered');
  assert(html.includes('Jump to item number'), 'jump dialog rendered');
  assert(html.includes('Valid range: 1 - 1000'), 'jump dialog shows range');
  assert(html.includes('0.1% Complete'), 'progress percentage rendered');
  assert(html.includes('progress-bar-fill'), 'progress bar rendered');

  store.jumpToCurrentMode(1500);
  assertEqual(store.getState().currentItemId, 'entertainment-100', 'jump clamps above max to last sentence');
  html = jumpContext.English365Modes.sentence.render(store, store.getState());
  assert(html.includes('Sentence 1000 / 1000'), 'clamped max progress displayed');
  assert(html.includes('100.0% Complete'), 'max percentage displayed');

  store.jumpToCurrentMode(0);
  assertEqual(store.getState().currentItemId, 'daily-life-001', 'jump clamps below min to first sentence');

  store.openMode('phrase');
  store.jumpToCurrentMode(101);
  assertEqual(store.getState().currentPhraseId, 'phrase-100', 'phrase jump clamps to last phrase');

  store.toggleFavorite({ type: 'sentence', id: 'hotel-001', scene: 'hotel' });
  store.toggleFavorite({ type: 'phrase', id: 'phrase-001', scene: 'hotel' });
  store.openMode('favorites');
  store.jumpToCurrentMode(2);
  assertEqual(store.getState().currentFavoriteKey, 'phrase:phrase-001', 'favorites jump uses collection index');
});

test('V1.4 home is compressed for iPhone first-screen use', () => {
  const homeContext = createContext();
  loadScripts(homeContext, fullAppFiles);
  const store = homeContext.English365Store.createStore();

  store.openMode('sentence');
  store.jumpToCurrentMode(358);
  store.openMode('phrase');
  store.jumpToCurrentMode(42);

  const html = homeContext.English365Home.render(store, store.getState());
  assert(html.includes('class="learning-center mobile-learning-home"'), 'home uses compact mobile learning layout');
  assert(html.includes('class="continue-hero-card ultra-compact-continue-card"'), 'continue card uses ultra compact layout');
  assert(html.includes('Continue Learning'), 'continue card rendered');
  assert(html.includes('Phrase Mode'), 'continue card shows recent mode');
  assert(html.includes('42 / 100'), 'continue card shows exact position');
  assert(html.includes('42%'), 'continue card shows compact percent');
  assert(!html.includes('phrases remaining'), 'continue card omits remaining text');
  assert(!html.includes('% Complete'), 'continue card omits verbose complete text');
  assert(html.includes('class="today-stat-strip"'), 'today renders as compact stat strip');
  assert(html.includes('⏱'), 'today learning time icon rendered');
  assert(html.includes('🎯'), 'today completed icon rendered');
  assert(!html.includes('Today&#39;s Learning Time'), 'today strip omits long metric label');
  assertEqual((html.match(/class="today-stat"/g) || []).length, 2, 'home renders only two compact today stats');
  assert(html.includes('class="mode-grid primary-mode-grid"'), 'primary mode grid rendered');
  assertEqual((html.match(/compact-learning-mode-card/g) || []).length, 4, 'home renders four primary learning cards');
  assert(html.includes('>Sentence<'), 'sentence card uses short label');
  assert(html.includes('>Phrase<'), 'phrase card uses short label');
  assert(html.includes('>Conversation<'), 'conversation card uses short label');
  assert(html.includes('>Listening<'), 'listening card uses short label');
  assert(!html.includes('Practical sentences'), 'primary cards omit descriptions');
  assert(html.includes('<summary>More Modes</summary>'), 'more modes drawer rendered');
  assert(html.includes('class="utility-section more-modes-drawer"'), 'secondary utility drawer rendered');
  assert(!html.includes('class="utility-section more-modes-drawer" open'), 'more modes drawer is collapsed by default');
  assert(html.includes('Listening Challenge Mode'), 'listening challenge remains reachable');
  assert(html.includes('Learning Statistics'), 'statistics remains reachable');
  assert(html.includes('Favorites Mode'), 'favorites remains reachable');
  assert(html.includes('Mistakes Mode'), 'mistakes remains reachable');
  assert(html.includes('class="home-scene-section"'), 'compact scene selector is on home');
  assert(html.includes('>Daily<'), 'daily scene chip rendered');
  assert(html.includes('>Hotel<'), 'hotel scene chip rendered');
  assert(html.includes('>Travel<'), 'travel scene chip rendered');
  assert(html.includes('>Office<'), 'office scene chip rendered');
  assert(html.includes('<summary>Show Progress</summary>'), 'learning journey drawer is at bottom');
  assert(!html.includes('class="progress-drawer" open'), 'learning journey is collapsed by default');
});

test('mistakes increment wrong and graduate after three correct answers', () => {
  const store = context.English365Store.createStore();
  const ref = { type: 'sentence', id: 'hotel-001', scene: 'hotel' };

  store.markWrong(ref);
  let mistake = context.English365Storage.getMistakes()['sentence:hotel-001'];
  assertEqual(mistake.wrongCount, 1, 'wrong count increments');
  assertEqual(mistake.correctCount, 0, 'correct count starts at zero');

  store.markCorrect(ref);
  store.markCorrect(ref);
  store.markCorrect(ref);
  mistake = context.English365Storage.getMistakes()['sentence:hotel-001'];
  assertEqual(mistake, undefined, 'mistake graduates after three correct answers');
});

test('service worker and manifest keep PWA assets local', () => {
  assert(fs.existsSync(path('manifest.json')), 'manifest exists');
  assert(fs.existsSync(path('service-worker.js')), 'service worker exists');
  const manifest = JSON.parse(read('manifest.json'));
  assertEqual(manifest.display, 'standalone', 'manifest display');
  assert(manifest.start_url.includes('index.html'), 'manifest starts at index.html');
  const serviceWorker = read('service-worker.js');
  assert(serviceWorker.includes('CACHE_VERSION'), 'service worker has cache version');
  for (const file of coreFiles.filter((item) => item.startsWith('data/'))) {
    assert(serviceWorker.includes('./' + file), 'service worker caches ' + file);
  }
});

