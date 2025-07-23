// Ambil mode dari query string
function getModeFromURL() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  if (['easy', 'hard', 'master', 'practice'].includes(mode)) return mode;
  return 'easy';
}
const mode = getModeFromURL();

// DOM elements
const playerNameDisplay = document.getElementById('playerNameDisplay');
const modeInfoEl = document.querySelector('.mode-info');
const questionEl = document.getElementById('question');
const answerEl = document.getElementById('answer');
const explanationEl = document.getElementById('explanation');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const progressBar = document.getElementById('progress-bar');
const circle = document.getElementById('circle');
const timeText = document.getElementById('time-text');
const keypad = document.getElementById('keypad');
const backBtn = document.getElementById('back-btn');
const bestScoreEl = document.getElementById('best-score');
const leaderboardList = document.getElementById('leaderboard-list');

// Total soal tiap mode
const totalQuestionsMap = { easy: 15, hard: 30, master: 30, practice: 30 };
const totalQuestions = totalQuestionsMap[mode];

// Timer tiap mode
const timerMap = { easy: 10, hard: 8, master: 15, practice: 0 };
let timeLeft = timerMap[mode];

let currentQuestionIndex = 0;
let score = 0;
let currentAnswer = '';
let correctAnswer = null;
let timerInterval = null;

// Ambil nama pemain dari localStorage
const playerName = localStorage.getItem('playerName') || 'Anon';
playerNameDisplay.textContent = `Player: ${playerName}`;
modeInfoEl.textContent = `Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;

bestScoreEl.textContent = getBestScore();

// Fungsi cek jawaban dengan toleransi 0.1
function isAnswerCorrect(userAnswer, correctAnswer) {
  const userNum = parseFloat(userAnswer);
  if (isNaN(userNum)) return false;
  const tolerance = 0.1; // toleransi 0.1
  return Math.abs(userNum - correctAnswer) <= tolerance;
}

// Setup keypad buttons
function generateKeypad() {
  // Semua mode punya tombol '-' dan '.', serta '( )'
  let keys = ['1','2','3','4','5','6','7','8','9','-','0','.','Clear','( )','⌫'];

  keypad.innerHTML = '';
  keys.forEach(key => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = key;
    btn.addEventListener('click', () => handleInput(key));
    keypad.appendChild(btn);
  });
}

// Handle input dari keypad atau keyboard
function handleInput(key) {
  if (key === 'Clear') {
    currentAnswer = '';
  } else if (key === '⌫') {
    currentAnswer = currentAnswer.slice(0, -1);
  } else if (key === '-') {
    // Minus hanya boleh sekali dan hanya di awal input
    if (!currentAnswer.includes('-') && currentAnswer.length === 0) {
      currentAnswer += '-';
    }
  } else if (key === '.') {
    // Titik hanya boleh sekali
    if (!currentAnswer.includes('.')) {
      currentAnswer += '.';
    }
  } else if (key === '( )') {
    // Jika sudah ada '(' tanpa pasangan ')', tambahkan ')'
    // Jika tidak, tambahkan '('
    const openCount = (currentAnswer.match(/\(/g) || []).length;
    const closeCount = (currentAnswer.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      currentAnswer += ')';
    } else {
      currentAnswer += '(';
    }
  } else {
    if (currentAnswer.length < 15 && /[0-9]/.test(key)) {
      currentAnswer += key;
    }
  }
  updateAnswerDisplay();

  if (mode === 'practice') return; // tunggu submit

  if (currentAnswer.length > 0 && isAnswerCorrect(currentAnswer, correctAnswer)) {
    score++;
    scoreEl.textContent = `🏆 ${score}`;
    updateBestScore();
    showFeedback(true);
    clearTimer();
    setTimeout(nextQuestion, 700);
  } else if (currentAnswer.length > 0) {
    showFeedback(false);
  }
}

// Update tampilan jawaban saat ini
function updateAnswerDisplay() {
  answerEl.textContent = currentAnswer || '?';
}

// Generate soal sesuai mode
function generateQuestion() {
  currentAnswer = '';
  updateAnswerDisplay();

  if (mode === 'easy') generateEasyQuestion();
  else if (mode === 'hard') generateHardQuestion();
  else if (mode === 'master') generateMasterQuestion();
  else if (mode === 'practice') generateMasterQuestion();

  currentQuestionIndex++;
  updateProgress();
  resetTimer();
}

// Easy: tambah & kurang
function generateEasyQuestion() {
  const ops = ['+', '-'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = getRandomInt(1, 20);
  let b = getRandomInt(1, 20);
  if (op === '-' && a < b) [a,b] = [b,a];
  correctAnswer = op === '+' ? a + b : a - b;
  questionEl.textContent = `${a} ${op} ${b} =`;
}

// Hard: tambah, kurang, kali, bagi
function generateHardQuestion() {
  const ops = ['+', '-', '*', '/'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = getRandomInt(1, 20);
  let b = getRandomInt(1, 20);
  if (op === '/') a = a * b; // supaya hasil bagi bulat
  if (op === '-' && a < b) [a,b] = [b,a];
  switch(op) {
    case '+': correctAnswer = a + b; break;
    case '-': correctAnswer = a - b; break;
    case '*': correctAnswer = a * b; break;
    case '/': correctAnswer = a / b; break;
  }
  questionEl.textContent = `${a} ${op} ${b} =`;
}

// Master & Practice: perpangkatan, akar, tanda kurung, kali & bagi
function generateMasterQuestion() {
  const types = ['power', 'root', 'paren', 'muldiv'];
  const type = types[Math.floor(Math.random() * types.length)];
  let q = '';
  let ans = 0;

  switch(type) {
    case 'power':
      const a = getRandomInt(1,5);
      const b = getRandomInt(1,5);
      const c = getRandomInt(2,3);
      if (Math.random() < 0.5) {
        q = `(${a} + ${b})^${c}`;
        ans = Math.pow(a + b, c);
      } else {
        q = `${a}^${c}`;
        ans = Math.pow(a, c);
      }
      break;
    case 'root':
      const x = getRandomInt(1,20);
      const y = getRandomInt(1,5);
      if (Math.random() < 0.5) {
        q = `√(${x * y})`;
        ans = Math.sqrt(x * y);
      } else {
        q = `√${x * x}`;
        ans = x;
      }
      break;
    case 'paren':
      const m = getRandomInt(1,10);
      const n = getRandomInt(1,10);
      const o = getRandomInt(1,5);
      if (Math.random() < 0.5) {
        q = `(${m} + ${n}) * ${o}`;
        ans = (m + n) * o;
      } else {
        q = `(${m} - ${n}) / ${o}`;
        ans = (m - n) / o;
      }
      break;
    case 'muldiv':
      const p = getRandomInt(1,20);
      const q2 = getRandomInt(1,20);
      const op = Math.random() < 0.5 ? '*' : '/';
      if (op === '/') {
        q = `${p * q2} / ${q2}`;
        ans = p;
      } else {
        q = `${p} * ${q2}`;
        ans = p * q2;
      }
      break;
  }
  correctAnswer = Math.round(ans * 100) / 100;
  questionEl.textContent = `${q} =`;
}

// Utility
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max-min+1)) + min;
}

// Update progress & score display
function updateProgress() {
  levelEl.textContent = `Question ${currentQuestionIndex} / ${totalQuestions}`;
  scoreEl.textContent = `🏆 ${score}`;
  const percent = (currentQuestionIndex / totalQuestions) * 100;
  progressBar.style.width = `${percent}%`;
}

// Timer handling
function resetTimer() {
  clearTimer();
  if (timerMap[mode] === 0) {
    timeText.textContent = '-';
    circle.setAttribute('stroke-dasharray', '0, 100');
    return;
  }
  timeLeft = timerMap[mode];
  updateTimerCircle();
  startTimer();
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerCircle();
    if (timeLeft <= 0) {
      clearTimer();
      showFeedback(false, 'Waktu habis!');
      setTimeout(nextQuestion, 800);
    }
  }, 1000);
}

function updateTimerCircle() {
  const totalTime = timerMap[mode];
  const percent = (timeLeft / totalTime) * 100;
  circle.setAttribute('stroke-dasharray', `${percent}, 100`);
  timeText.textContent = timeLeft;
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Feedback visual
function showFeedback(isCorrect, message) {
  if (isCorrect) {
    answerEl.classList.add('correct');
    answerEl.classList.remove('wrong');
    explanationEl.textContent = '';
  } else {
    answerEl.classList.add('wrong');
    answerEl.classList.remove('correct');
    explanationEl.textContent = message || (mode === 'practice' ? 'Wrong answer, try again.' : '');
  }
}

// Next soal
function nextQuestion() {
  if (currentQuestionIndex >= totalQuestions) {
    finishGame();
  } else {
    generateQuestion();
  }
}

// Finish game
function finishGame() {
  clearTimer();
  alert(`Game over!\nYour score: ${score} / ${totalQuestions}`);
  updateLeaderboard(score);
  updateBestScore();
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}

// Best score dari localStorage
function getBestScore() {
  const best = localStorage.getItem(`bestScore-${mode}`);
  return best ? parseInt(best) : 0;
}

// Update best score di localStorage jika lebih tinggi
function updateBestScore() {
  const best = getBestScore();
  if (score > best) {
    localStorage.setItem(`bestScore-${mode}`, score);
    bestScoreEl.textContent = score;
  } else {
    bestScoreEl.textContent = best;
  }
}

// Leaderboard handling
function getLeaderboard() {
  try {
    const data = localStorage.getItem(`leaderboard-${mode}`);
    return data ? JSON.parse(data) : [];
  } catch(e) {
    console.error('Failed to parse leaderboard, reset data.', e);
    localStorage.removeItem(`leaderboard-${mode}`);
    return [];
  }
}

function updateLeaderboard(newScore) {
  const leaderboard = getLeaderboard();
  const date = new Date().toLocaleDateString();
  leaderboard.push({name: playerName, score: newScore, date});
  leaderboard.sort((a,b) => b.score - a.score);
  if (leaderboard.length > 5) leaderboard.length = 5;
  try {
    localStorage.setItem(`leaderboard-${mode}`, JSON.stringify(leaderboard));
    console.log('Leaderboard updated:', leaderboard);
  } catch(e) {
    console.error('Failed to save leaderboard:', e);
  }
  renderLeaderboard();
}

function renderLeaderboard() {
  const leaderboard = getLeaderboard();
  leaderboardList.innerHTML = '';
  if (leaderboard.length === 0) {
    leaderboardList.innerHTML = '<li>No score yet</li>';
    return;
  }
  leaderboard.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name} — ${item.score} / ${totalQuestions} (${item.date})`;
    leaderboardList.appendChild(li);
  });
}

// Setup tombol Kembali ke menu utama
backBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

// Setup keyboard input
document.addEventListener('keydown', e => {
  if (e.key >= '0' && e.key <= '9') {
    handleInput(e.key);
  } else if (e.key === 'Backspace') {
    handleInput('⌫');
  } else if (e.key.toLowerCase() === 'c') {
    handleInput('Clear');
  } else if (e.key === '.' || e.key === '-') {
    handleInput(e.key);
  } else if (e.key === '(' || e.key === ')') {
    handleInput('( )'); // tombol gabungan, kita arahkan ke handleInput ( )
  } else if (e.key === 'Enter' && mode === 'practice') {
    submitPracticeAnswer();
  }
});

// Practice mode: tombol Submit & Skip
function setupPracticeButtons() {
  if (mode !== 'practice') return;

  const buttonRow = document.querySelector('.button-row');

  const submitBtn = document.createElement('button');
  submitBtn.id = 'submit-btn';
  submitBtn.type = 'button';
  submitBtn.textContent = 'Submit';
  styleActionButton(submitBtn);
  submitBtn.addEventListener('click', submitPracticeAnswer);

  const skipBtn = document.createElement('button');
  skipBtn.id = 'skip-btn';
  skipBtn.type = 'button';
  skipBtn.textContent = 'Skip';
  styleActionButton(skipBtn);
  skipBtn.addEventListener('click', () => {
    showFeedback(false, 'Soal dilewati!');
    setTimeout(nextQuestion, 700);
  });

  // Sisipkan sebelum tombol back
  buttonRow.insertBefore(submitBtn, backBtn);
  buttonRow.insertBefore(skipBtn, backBtn);
}

// Submit jawaban practice mode
function submitPracticeAnswer() {
  if (currentAnswer.length === 0) return;
  if (isAnswerCorrect(currentAnswer, correctAnswer)) {
    score++;
    scoreEl.textContent = `🏆 ${score}`;
    updateBestScore();
    showFeedback(true);
    setTimeout(nextQuestion, 700);
  } else {
    showFeedback(false);
    explanationEl.textContent = `Jawaban benar adalah ${correctAnswer}`;
  }
}

function styleActionButton(btn) {
  btn.style.flex = '1 1 30%';
  btn.style.margin = '0 7px';
  btn.style.padding = '12px 0';
  btn.style.borderRadius = '10px';
  btn.style.border = 'none';
  btn.style.fontWeight = '600';
  btn.style.cursor = 'pointer';
  btn.style.color = 'white';
  btn.style.backgroundColor = '#fbbf24';
  btn.style.transition = 'background-color 0.3s';
  btn.style.userSelect = 'none';

  btn.onmouseover = () => btn.style.backgroundColor = '#f59e0b';
  btn.onmouseout = () => btn.style.backgroundColor = '#fbbf24';
}

// Init game
generateKeypad();
generateQuestion();
setupPracticeButtons();
renderLeaderboard();
