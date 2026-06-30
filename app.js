const STORAGE_KEYS = {
  today: 'vocabAppToday',
  history: 'vocabAppHistory',
  dictionaryCache: 'vocabAppDictionary',
  theme: 'vocabAppTheme'
};

const todayWord = document.getElementById('today-word');
const todayDefinition = document.getElementById('today-definition');
const todayDate = document.getElementById('today-date');
const historyList = document.getElementById('history-list');
const randomBtn = document.getElementById('random-btn');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');
const installBtn = document.getElementById('install-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const categoryList = document.getElementById('category-list');
const categoryResults = document.getElementById('category-results');
const quizPrompt = document.getElementById('quiz-prompt');
const quizOptions = document.getElementById('quiz-options');
const quizFeedback = document.getElementById('quiz-feedback');
const nextQuestionBtn = document.getElementById('next-question-btn');
const tabButtons = document.querySelectorAll('.tab-button');
const sections = document.querySelectorAll('.app-section');

let deferredInstallPrompt = null;
let currentQuizQuestion = null;
let selectedCategory = null;
let WORDS = [];

// Load the bundled word list so the app can be hosted on GitHub without the
// large dictionary HTML file that exceeds GitHub's upload size limit.
async function parseDictionaryFile() {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.dictionaryCache);
    if (cached) {
      try {
        WORDS = JSON.parse(cached);
        console.log(`Loaded ${WORDS.length} words from cache`);
        return;
      } catch (e) {
        console.log('Cache corrupted, reloading bundled words');
      }
    }

    loadDefaultWords();
    localStorage.setItem(STORAGE_KEYS.dictionaryCache, JSON.stringify(WORDS));
    console.log(`Loaded ${WORDS.length} bundled words`);
  } catch (error) {
    console.error('Error loading bundled dictionary:', error);
    loadDefaultWords();
  }
}

// Load default words if dictionary parsing fails
function loadDefaultWords() {
  WORDS = [
    { word: 'abstruse', definition: 'Hard to understand; recondite.' },
    { word: 'acumen', definition: 'Quickness and accuracy in judgment or insight.' },
    { word: 'alacrity', definition: 'Eager readiness; cheerful willingness.' },
    { word: 'apocryphal', definition: 'Of doubtful authenticity or origin.' },
    { word: 'assiduous', definition: 'Showing great care, attention, and effort.' },
    { word: 'cogent', definition: 'Clear, logical, and convincing.' },
    { word: 'contumacious', definition: 'Stubbornly disobedient or rebellious.' },
    { word: 'deleterious', definition: 'Causing harm or damage.' },
    { word: 'desultory', definition: 'Lacking a plan, purpose, or enthusiasm.' },
    { word: 'diaphanous', definition: 'Light, delicate, and translucent.' },
    { word: 'ebullient', definition: 'Overflowing with enthusiasm or excitement.' },
    { word: 'efficacious', definition: 'Effective in producing a desired result.' },
    { word: 'enervate', definition: 'To weaken or drain of energy.' },
    { word: 'esoteric', definition: 'Intended for or understood by only a few.' },
    { word: 'fastidious', definition: 'Very attentive to detail and accuracy.' },
    { word: 'germane', definition: 'Relevant to a subject or situation.' },
    { word: 'impecunious', definition: 'Having little or no money.' },
    { word: 'indefatigable', definition: 'Unable to be tired out; persistent.' },
    { word: 'insipid', definition: 'Lacking flavor, interest, or excitement.' },
    { word: 'laconic', definition: 'Using very few words.' },
    { word: 'lugubrious', definition: 'Looking or sounding sad and dismal.' },
    { word: 'mellifluous', definition: 'Sweet or musical; pleasant to hear.' },
    { word: 'mendacious', definition: 'Not telling the truth; lying.' },
    { word: 'nefarious', definition: 'Wicked or criminal.' },
    { word: 'obfuscate', definition: 'To make something unclear or confusing.' },
    { word: 'panacea', definition: 'A solution or remedy for all problems.' },
    { word: 'perspicacious', definition: 'Having keen insight and understanding.' },
    { word: 'punctilious', definition: 'Paying strict attention to detail.' },
    { word: 'quixotic', definition: 'Unrealistic and impractical, especially in a noble way.' },
    { word: 'sagacious', definition: 'Wise and shrewd; having sound judgment.' },
    { word: 'sanguine', definition: 'Optimistic or positive, especially in bad situations.' },
    { word: 'sententious', definition: 'Given to moralizing in a pompous manner.' },
    { word: 'tantamount', definition: 'Equivalent in value or meaning.' },
    { word: 'ubiquitous', definition: 'Present everywhere at once.' },
    { word: 'vacillate', definition: 'To waver between different opinions or choices.' },
    { word: 'vicissitude', definition: 'A change of circumstances or fortune.' },
    { word: 'vicarious', definition: 'Experienced through another person rather than directly.' },
    { word: 'aardvark', definition: 'An edentate mammal of Africa resembling a pig, that burrows in the ground and feeds on ants.' },
    { word: 'aardwolf', definition: 'A carnivorous quadruped of South Africa resembling the fox and hyena.' },
    { word: 'aaronic', definition: 'Pertaining to Aaron, the first high priest of the Jews.' },
    { word: 'ardent', definition: 'Showing strong enthusiasm, energy, or devotion.' },
    { word: 'austere', definition: 'Severe or strict in appearance or manner; without decoration.' },
    { word: 'bibulous', definition: 'Fond of or addicted to drinking alcohol.' },
    { word: 'cacophony', definition: 'A harsh mixture of discordant sounds.' },
    { word: 'categorical', definition: 'Relating to or belonging to a category; absolute.' },
    { word: 'ephemeral', definition: 'Lasting for a very short time; temporary.' },
    { word: 'flagrant', definition: 'Conspicuously or outrageously bad; glaring.' },
  ];
}

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getDailyIndex(date = new Date()) {
  const epoch = new Date(Date.UTC(2026, 0, 1));
  const diffDays = Math.floor((date - epoch) / (1000 * 60 * 60 * 24));
  if (WORDS.length === 0) return 0;
  return ((diffDays % WORDS.length) + WORDS.length) % WORDS.length;
}

function getStoredHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || '[]');
  } catch (error) {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
}

function renderHistory() {
  const history = getStoredHistory();
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.innerHTML = '<li>No saved words yet.</li>';
    return;
  }

  history.slice().reverse().forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${item.word}</strong>
      <p>${item.definition}</p>
      <small>${formatDate(item.date)}</small>
    `;
    historyList.appendChild(li);
  });
}

function renderSearchResults(results) {
  searchResults.innerHTML = '';
  if (results.length === 0) {
    searchResults.innerHTML = '<li>No matches found.</li>';
    return;
  }
  results.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${item.word}</strong>
      <p>${item.definition}</p>
    `;
    searchResults.appendChild(li);
  });
}

function getCategories() {
  return {
    meaning: 'Words useful for strong writing',
    emotion: 'Words that describe feelings or tone',
    manner: 'Words about style and behavior',
    thinking: 'Words about thought, clarity, and ideas'
  };
}

function renderCategoryChips() {
  const categories = getCategories();
  categoryList.innerHTML = '';
  Object.keys(categories).forEach(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chip${selectedCategory === category ? ' active' : ''}`;
    button.textContent = category;
    button.addEventListener('click', () => selectCategory(category));
    categoryList.appendChild(button);
  });
}

function getCategoryWords(category) {
  const map = {
    meaning: ['abstruse', 'cogent', 'esoteric', 'obfuscate', 'perspicacious', 'ubiquitous'],
    emotion: ['ebullient', 'lugubrious', 'mendacious', 'sanguine', 'nefarious'],
    manner: ['assiduous', 'fastidious', 'laconic', 'punctilious', 'sententious', 'quixotic'],
    thinking: ['acumen', 'indefatigable', 'panacea', 'vacillate', 'vicissitude', 'vicarious']
  };
  return (map[category] || []).map(word => WORDS.find(entry => entry.word === word)).filter(Boolean);
}

function renderCategoryResults(category) {
  const results = getCategoryWords(category);
  categoryResults.innerHTML = '';
  if (results.length === 0) {
    categoryResults.innerHTML = '<li>No words available.</li>';
    return;
  }
  results.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${item.word}</strong>
      <p>${item.definition}</p>
      <button type="button" class="secondary-btn" data-word="${item.word}">Save</button>
    `;
    categoryResults.appendChild(li);
  });
  categoryResults.querySelectorAll('button[data-word]').forEach(button => {
    button.addEventListener('click', () => {
      const word = button.dataset.word;
      const entry = WORDS.find(item => item.word === word);
      if (entry) {
        storeToday(entry);
        saveCurrentWord();
        switchSection('home-section');
      }
    });
  });
}

function selectCategory(category) {
  selectedCategory = category;
  renderCategoryChips();
  renderCategoryResults(category);
}

function renderQuizQuestion() {
  if (WORDS.length === 0) return;
  
  // Get 4 unique random words, or fewer if dictionary is smaller
  const count = Math.min(4, WORDS.length);
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
  const options = shuffled.slice(0, count);
  
  const correct = options[Math.floor(Math.random() * options.length)];
  currentQuizQuestion = correct;
  quizPrompt.textContent = `Which choice matches “${correct.word}”?`;
  quizOptions.innerHTML = '';
  options.sort(() => Math.random() - 0.5).forEach(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quiz-option-btn';
    button.textContent = option.definition;
    button.addEventListener('click', () => handleQuizAnswer(option));
    quizOptions.appendChild(button);
  });
  quizFeedback.textContent = '';
}

function handleQuizAnswer(option) {
  const correct = option.word === currentQuizQuestion.word;
  quizOptions.querySelectorAll('button').forEach(button => {
    button.disabled = true;
    if (button.textContent === currentQuizQuestion.definition) {
      button.classList.add('correct');
    } else if (button.textContent === option.definition && !correct) {
      button.classList.add('incorrect');
    }
  });
  quizFeedback.textContent = correct ? 'Correct! Great choice.' : `Not quite. The correct answer is: ${currentQuizQuestion.definition}`;
}

function switchSection(sectionId) {
  sections.forEach(section => {
    section.classList.toggle('hidden', section.id !== sectionId);
  });
  tabButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.section === sectionId);
  });
}

function updateSearch() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    renderSearchResults(WORDS.slice(0, 8));
    return;
  }
  const matches = WORDS.filter(item => {
    const text = `${item.word} ${item.definition}`.toLowerCase();
    return text.includes(query);
  });
  renderSearchResults(matches);
}

function storeToday(wordEntry) {
  const today = {
    word: wordEntry.word,
    definition: wordEntry.definition,
    date: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEYS.today, JSON.stringify(today));
  displayWord(today);
}

function displayWord(wordInfo) {
  todayWord.textContent = wordInfo.word;
  todayDefinition.textContent = wordInfo.definition;
  todayDate.textContent = `Date: ${formatDate(wordInfo.date)}`;
}

function loadToday() {
  const stored = localStorage.getItem(STORAGE_KEYS.today);
  if (stored) {
    try {
      const today = JSON.parse(stored);
      if (today && today.word && today.definition) {
        displayWord(today);
        return;
      }
    } catch (error) {
      // ignore invalid storage
    }
  }

  const word = WORDS[getDailyIndex()];
  storeToday(word);
}

function pickRandomWord() {
  if (WORDS.length === 0) return;
  
  const current = todayWord.textContent;
  let index;
  
  if (WORDS.length > 1) {
    do {
      // Use cryptographically secure random if available
      const randomBytes = new Uint32Array(1);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(randomBytes);
        index = randomBytes[0] % WORDS.length;
      } else {
        index = Math.floor(Math.random() * WORDS.length);
      }
    } while (WORDS[index].word === current);
  } else {
    index = 0;
  }
  
  storeToday(WORDS[index]);
}

function saveCurrentWord() {
  const history = getStoredHistory();
  const word = todayWord.textContent;
  const definition = todayDefinition.textContent;

  if (!word || !definition) {
    return;
  }

  if (history.some(item => item.word === word)) {
    return;
  }

  history.push({ word, definition, date: new Date().toISOString() });
  saveHistory(history);
  renderHistory();
  alert(`${word} saved to review.`);
}

function clearHistory() {
  if (!confirm('Clear all saved words?')) {
    return;
  }
  localStorage.removeItem(STORAGE_KEYS.history);
  renderHistory();
}

function showInstallButton() {
  installBtn.classList.remove('hidden');
}

function hideInstallButton() {
  installBtn.classList.add('hidden');
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  showInstallButton();
});

installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) {
    return;
  }
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  if (choice.outcome === 'accepted') {
    console.log('App install accepted');
  }
  deferredInstallPrompt = null;
  hideInstallButton();
});

randomBtn.addEventListener('click', pickRandomWord);
saveBtn.addEventListener('click', saveCurrentWord);
clearBtn.addEventListener('click', clearHistory);
searchBtn.addEventListener('click', updateSearch);
searchInput.addEventListener('input', updateSearch);
nextQuestionBtn.addEventListener('click', renderQuizQuestion);

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    switchSection(button.dataset.section);
  });
});

// Add touch event support for better mobile responsiveness
document.addEventListener('touchstart', function() {}, { passive: true });

// Improve button feedback on touch devices
if ('ontouchstart' in window) {
  document.addEventListener('touchend', function(e) {
    if (e.target.tagName === 'BUTTON') {
      e.target.click();
    }
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(error => {
      console.warn('Service worker registration failed:', error);
    });
  });
}

// Force and persist the dark theme as default
function applyTheme() {
  // Always use dark theme - no other options
  document.documentElement.style.colorScheme = 'dark';
  localStorage.setItem(STORAGE_KEYS.theme, 'dark');
  
  // Update meta theme-color to match palette
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', '#030712');
  }
}

// Initialize app with dictionary data
async function initializeApp() {
  // Apply theme first
  applyTheme();
  
  // Load dictionary from file or cache
  await parseDictionaryFile();
  
  // Initialize UI with loaded words
  loadToday();
  renderHistory();
  renderSearchResults(WORDS.slice(0, Math.min(8, WORDS.length)));
  renderCategoryChips();
  selectCategory('meaning');
  renderQuizQuestion();
  
  console.log(`App initialized with ${WORDS.length} words`);
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
