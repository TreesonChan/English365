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
  'js/modes/listening-challenge-mode.js',
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
  'js/modes/listening-challenge-mode.js',
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
  assertEqual(context.English365Config.version, 'V1.1.0', 'configured app version');

  const runtimeFiles = ['index.html', 'app.js', 'style.css', 'service-worker.js']
    .concat(walkFiles('js'))
    .concat(walkFiles('data'))
    .concat(['manifest.json']);
  const versionOccurrences = [];
  for (const file of runtimeFiles) {
    const matches = read(file).match(/V1.1.0/g) || [];
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
  assertEqual(versionRoot.textContent, appContext.English365Config.version, 'footer renders configured version');
});

test('Listening Challenge Mode is registered in app entry points', () => {
  const modeIds = context.English365Config.modes.map((mode) => mode.id);
  assert(modeIds.includes('listening-challenge'), 'config registers listening-challenge mode');
  const html = read('index.html');
  assert(html.includes('src="js/modes/listening-challenge-mode.js"'), 'index.html loads listening challenge mode');
  assert(read('service-worker.js').includes('./js/modes/listening-challenge-mode.js'), 'service worker caches listening challenge mode');
});

test('localStorage keys keep the confirmed v1 contract', () => {
  const keys = context.English365Config.storageKeys;
  assertEqual(keys.favorites, 'e365:v1:favorites', 'favorites key');
  assertEqual(keys.mistakes, 'e365:v1:mistakes', 'mistakes key');
  assertEqual(keys.stats, 'e365:v1:stats', 'stats key');
  assertEqual(keys.recent, 'e365:v1:recent', 'recent key');
  assertEqual(keys.prefs, 'e365:v1:prefs', 'prefs key');
});

test('corpus contains 10 scenes, 1000 sentences, and 100 conversations', () => {
  const summary = context.English365CorpusIndex.getSummary();
  assertEqual(summary.sceneCount, 10, 'scene count');
  assertEqual(summary.sentenceCount, 1000, 'sentence count');
  assertEqual(summary.conversationCount, 100, 'conversation count');
  assertEqual(context.English365CorpusIndex.expected.sentencesPerScene, 100, 'expected sentences per scene');
  assertEqual(context.English365CorpusIndex.expected.conversationsPerScene, 10, 'expected conversations per scene');
  assertEqual(context.English365CorpusIndex.expected.sentenceCount, 1000, 'expected sentence count');
  assertEqual(context.English365CorpusIndex.expected.conversationCount, 100, 'expected conversation count');
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
});

test('Listening Challenge hides prompts until answer and can add mistakes', () => {
  assert(fs.existsSync(path('js/modes/listening-challenge-mode.js')), 'listening challenge mode file exists');
  const challengeContext = createContext();
  loadScripts(challengeContext, coreFiles.concat(uiModeFiles));
  const store = challengeContext.English365Store.createStore();

  store.setScene('hotel');
  store.selectSentenceById('hotel-001');
  store.openMode('listening-challenge');

  let state = store.getState();
  assertEqual(state.mode, 'listening-challenge', 'challenge mode selected');
  assert(state.currentItemId !== 'hotel-001', 'challenge selects a random sentence on entry');

  const sentence = store.getCurrentSentence();
  const renderer = challengeContext.English365Modes['listening-challenge'];
  const initialHtml = renderer.render(store, state);
  assert(initialHtml.includes('Play'), 'challenge shows Play');
  assert(initialHtml.includes('Replay'), 'challenge shows Replay');
  assert(initialHtml.includes('Show Answer'), 'challenge shows Show Answer');
  assert(initialHtml.includes('Next'), 'challenge shows Next');
  assert(!initialHtml.includes(challengeContext.English365UI.escapeHtml(sentence.cn)), 'initial challenge hides Chinese');
  for (const answer of sentence.answers) {
    assert(!initialHtml.includes(challengeContext.English365UI.escapeHtml(answer)), 'initial challenge hides English answer');
  }

  store.showAnswer();
  state = store.getState();
  const answerHtml = renderer.render(store, state);
  assert(answerHtml.includes(challengeContext.English365UI.escapeHtml(sentence.cn)), 'answer view shows Chinese');
  assert(answerHtml.includes(challengeContext.English365UI.escapeHtml(sentence.answers[0])), 'answer view shows English');
  assert(answerHtml.includes('Understood'), 'answer view shows Understood');
  assert(answerHtml.includes("Didn't Understand"), 'answer view shows Did not understand');

  const ref = store.currentRef();
  store.markWrong();
  const mistake = challengeContext.English365Storage.getMistakes()[challengeContext.English365Corpus.refKey(ref)];
  assert(mistake, 'Did not understand adds current sentence to mistakes');
  assertEqual(mistake.wrongCount, 1, 'challenge mistake wrong count');
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

