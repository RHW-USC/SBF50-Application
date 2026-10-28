const storeKey = 'SBF50 Demo';

const testDetails = {
  "sit-to-stand": {
    name: "30 Second Sit-to-Stand",
    prepTime: 7,
    duration: 30,
    scoreType: "",
  },

  "finger-to-floor": {
    name: "Finger-to-Floor",
    prepTime: 7,
    duration: 10,
    scoreType: "cm",
  },

  "core-endurance": {
    name: "McGill 60-Second Core Endurance",
    prepTime: 7,
    duration: 60,
    scoreType: "s",
  }
};

const testInstructions = {
  "sit-to-stand": {
    info: "Sit on a sturdy chair with your feet flat on the floor and your arms crossed over your chest. Keep your arms in this position throughout the entire test.\n\nOnce you start the test, you will have 7 seconds to get into the correct starting position. Use this time to sit comfortably on the chair, position your feet securely on the floor, and cross your arms over your chest.\n\nWhen the countdown finishes, begin standing up fully and sitting back down on the chair repeatedly. Complete as many repetitions as possible before the timer reaches zero. Make sure you stand upright each time and return to a seated position before starting the next repetition.\n\nKeep your arms crossed over your chest at all times, and avoid using your hands to push yourself up from the chair or assist with the movement.\n\nTry to maintain a steady pace while ensuring each repetition is performed safely and correctly. The test will end automatically when the timer reaches zero.",
    image: "static/images/SitToStand Example.png"
  },

  "finger-to-floor": {
    info: "Stand upright with your feet flat on the floor and your legs straight. Keep your knees extended throughout the test without bending them.\n\nBefore starting, place your device at floor level, positioned near your feet. Have the camera face towards the front of your body.\n\nEnsure the camera has a clear view of your entire body, including your feet, legs, torso, and hands. This will help provide the best possible angle for tracking your movement.\n\nOnce the test begins, you will have 10 seconds to bend forward at your waist and lower your arms towards the ground. Keep your legs straight and attempt to bring your fingertips as close to the floor as possible without bending your knees. Hold the lowest comfortable position you can reach until the timer finishes.\n\nMove slowly and avoid bouncing or forcing yourself further than is comfortable. Your result will be based on how close your fingertips get to the floor.",
    image: "static/images/FingerToFloor Example.png"
  },

  "core-endurance": {
    info: "Sit on the floor with your legs extended in front of you and your arms crossed over your chest. Keep your knees slightly bent. They do not need to be bent to an exact angle.\n\nBefore starting, place your phone on the floor at approximately the same height as your seated body, facing towards your left side. Ensure the camera has a clear view of your entire upper body and legs so your position can be tracked accurately.\n\nOnce the test begins, lean your upper body backwards to approximately 50 degrees from the upright position. Hold this position for as long as you can while keeping your arms crossed over your chest and maintaining a steady posture.\n\nTry to avoid leaning further backwards or returning to an upright position during the test. The test will end when you can no longer maintain the required position, or if you maintain the position for 60 seconds.",
    image: "static/images/McGill Example.png"
  }
};


const defaults = {
  camera: false,
  test: null,
  score: 0,
  results: [],
  height: null
};


/* ----------------------------------------
   Storage
---------------------------------------- */

// Load saved results and flatten any older nested result arrays.
function state() {
  try {
    const saved = JSON.parse(localStorage.getItem(storeKey) || '{}');
    const results = (Array.isArray(saved.results) ? saved.results.flat(Infinity) : [])
      .filter(result => result && typeof result.test === 'string')
      .map((result, index) => ({
        id: String(result.id ?? `legacy-${result.test}-${result.date}-${index}`),
        test: result.test,
        score: Number(result.score),
        date: result.date || new Date().toLocaleDateString('en-AU'),
        completedAt: result.completedAt || null
      }))
      .filter(result => Number.isFinite(result.score));

    return { ...defaults, ...saved, results };
  } catch {
    return { ...defaults };
  }
}

function save(patch) {
  const updated = { ...state(), ...patch };

  try {
    localStorage.setItem(storeKey, JSON.stringify(updated));
  } catch (error) {
    console.error('Unable to save results:', error);
    toast('Unable to save results');
  }

  return updated;
}

// Return the IDs of every test that has been completed.
function getCompletedTests() {
  return new Set(
    state().results
      .map(result => result.test)
      .filter(test => testDetails[test])
  );
}

// Find each test's personal best.
function getBestResults() {
  const best = {};

  state().results.forEach(result => {
    if (!testDetails[result.test]) return;

    const previous = best[result.test];
    const lowerIsBetter = result.test === 'finger-to-floor';

    if (!previous || (lowerIsBetter
      ? result.score < previous.score
      : result.score > previous.score)) {
      best[result.test] = result;
    }
  });

  return best;
}

function formatScore(test, score) {
  return `${score}${testDetails[test]?.scoreType || ''}`;
}

// Prevent saved text from being interpreted as HTML.
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function toast(msg) {
  let t = document.querySelector('.toast');

  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }

  t.textContent = msg;
  t.classList.add('show');

  setTimeout(() => t.classList.remove('show'), 1800);
}

function go(url) {
  location.href = url;
}


/* ----------------------------------------
   Height
---------------------------------------- */

// Retrieve the user's saved height in centimetres.
function getHeight() {
  const height = state().height;

  return Number.isFinite(height) && height > 0
    ? height
    : null;
}

// Reset the saved height without affecting test results.
function resetHeight() {
  save({ height: null });
}

// Initialise the height page.
function initHeight() {
  const form = document.getElementById('heightForm');
  const heightInput = document.getElementById('heightInput');
  const heightMessage = document.getElementById('heightMessage');
  const heightButton = document.getElementById('submitHeight');

  if (!form || !heightInput || !heightButton) return;

  // Display the previously saved height, if available.
  const savedHeight = getHeight();

  if (savedHeight !== null) {
    heightInput.value = savedHeight;
  }

  heightButton.addEventListener('click', event => {
    event.preventDefault();

    const height = Number(heightInput.value);

    // Validate the height before saving it.
    if (heightInput.value.trim() === '' || !Number.isFinite(height) || height < 500 || height > 2500) {
      heightInput.setCustomValidity('Please enter a height (cm) between 500 and 2500 cm.');
      heightInput.reportValidity();
      heightInput.setCustomValidity('');
      return;
    }

    // Save the height in browser storage.
    save({ height });

    if (heightMessage) {
      heightMessage.textContent = 'Height saved successfully.';
    }

    // Return to the Choose Test page.
    go('choose-test');
  });
}



/* ----------------------------------------
   Choose Test
---------------------------------------- */

function renderChooseProgress(options) {
  const available = [...options].filter(option => !option.classList.contains('unavailable') && testDetails[option.dataset.test]);
  const completed = getCompletedTests();
  const count = available.filter(option => completed.has(option.dataset.test)).length;

  // Use the IDs when available, or the original page elements.
  const countText = document.querySelector('#completionCount') || document.querySelector('.micro');
  const progressBar = document.querySelector('#completionProgress') || document.querySelector('.progress span');

  if (countText) {
    countText.textContent = `${count} of ${available.length} completed`;
  }

  if (progressBar) {
    progressBar.style.width = `${count / Math.max(available.length, 1) * 100}%`;
  }

  // Add a completion label to each completed test.
  options.forEach(option => {
    const isCompleted = completed.has(option.dataset.test);
    option.classList.toggle('completed', isCompleted);

    const content = option.querySelector(':scope > div');
    let status = content?.querySelector('.completion-status');

    if (isCompleted && content && !status) {
      status = document.createElement('span');
      status.className = 'completion-status';
      content.appendChild(status);
    }

    if (status) {
      if (isCompleted) {
        status.textContent = 'Completed';
      } else {
        status.remove();
      }
    }
  });
}

function initChoose() {
  const options = document.querySelectorAll('.test-option');
  const savedTest = state().test;
  const firstAvailable = [...options].find(option =>
    !option.classList.contains('unavailable') && testDetails[option.dataset.test]
  );

  const selected = testDetails[savedTest] ? savedTest : firstAvailable?.dataset.test || 'sit-to-stand';

  save({ test: selected });

  options.forEach(option => {
    option.classList.toggle('active', option.dataset.test === selected);

    if (option.classList.contains('unavailable') || !testDetails[option.dataset.test]) {
      return;
    }

    option.addEventListener('click', () => {
      options.forEach(item => item.classList.remove('active'));
      option.classList.add('active');
      save({ test: option.dataset.test });
    });
  });

  renderChooseProgress(options);

  document.querySelector('#startTest')?.addEventListener('click', event => {
    event.preventDefault();
    go('instructions');
  });
}

/* ----------------------------------------
   Instructions
---------------------------------------- */

function initInstructions() {
  const selected = testDetails[state().test] ? state().test : 'sit-to-stand';
  const instructions = testInstructions[selected];

  const instructionText = document.getElementById('instructions');
  const instructionImage = document.getElementById('instructionImg');

  if (instructionText) {
    instructionText.innerHTML = instructions.info.replace(/\n\n/g, '<br><br>');
  }

  if (instructionImage) {
    instructionImage.src = instructions.image;
  }

  document.querySelector('#startTest')?.addEventListener('click', () => go('test'));
}

/* ----------------------------------------
   Test
---------------------------------------- */

function initTest() {
  const selected = testDetails[state().test] ? state().test : 'sit-to-stand';
  const test = testDetails[selected];

  let remaining = test.duration;
  let remainingPrep = test.prepTime;
  let preparing = false;
  let running = false;
  let timerPrep;
  let timer;

  // Reset the score when a new test begins.
  points = 0;
  isTestActive = false;

  const testLabel = document.getElementById('test-label');
  const timerText = document.getElementById('timer');
  const timerLabel = document.getElementById('timer-label');
  const scoreText = document.getElementById('score');
  const startButton = document.getElementById('runTest');
  const progressBar = document.getElementById('testProgress');

  testLabel.textContent = test.name;
  timerText.textContent = `${test.duration}s`;
  scoreText.textContent = formatScore(selected, points);
  progressBar.style.width = '0%';

  // Save the result and move to the results page.
  function finishTest() {
    if (!running) return;

    running = false;
    isTestActive = false;
    clearInterval(timer);

    const completedAt = new Date();
    const result = {
      id: `${completedAt.getTime()}-${Math.random().toString(16).slice(2)}`,
      test: selected,
      score: Number(points) || 0,
      date: completedAt.toLocaleDateString('en-AU'),
      completedAt: completedAt.toISOString()
    };

    if (selected !== 'finger-to-floor' || result.score !== 0) {
        save({ score: result.score, results: [...state().results, result] });
    }

    go('results');
  }

  // Start the actual test after the preparation countdown.
  function beginTest() {
    running = true;
    isTestActive = true;
    remaining = test.duration;

    timerLabel.textContent = 'Remaining Time';
    startButton.textContent = 'Testing…';
    startButton.disabled = true;

    timer = setInterval(() => {
      remaining--;

      timerText.textContent = `${Math.max(remaining, 0)}s`;
      scoreText.textContent = formatScore(selected, Number(points) || 0);
      progressBar.style.width = `${(test.duration - Math.max(remaining, 0)) / test.duration * 100}%`;

      if (remaining <= 0) {
        progressBar.style.width = '100%';
        finishTest();
      }
    }, 1000);
  }

  startButton.onclick = () => {
    if (preparing || running) return;

    preparing = true;
    remainingPrep = test.prepTime;

    timerText.textContent = `${remainingPrep}s`;
    timerLabel.textContent = 'Get Ready!';
    startButton.textContent = 'Move into position!';

    timerPrep = setInterval(() => {
      remainingPrep--;

      timerText.textContent = `${Math.max(remainingPrep, 0)}s`;

      if (remainingPrep <= 0) {
        clearInterval(timerPrep);
        preparing = false;
        beginTest();
      }
    }, 1000);
  };
}

/* ----------------------------------------
   Results
---------------------------------------- */

function renderBestResults() {
  const box = document.querySelector('#bestResults') || document.querySelector('.metric-list');

  if (!box) return;

  const best = getBestResults();

  box.innerHTML = Object.keys(testDetails).map(test => {
    const result = best[test];
    const score = result
      ? `<span>${escapeHTML(formatScore(test, result.score))}</span>`
      : '<span class="not-completed">Not Available</span>';

    const date = result
      ? `Best result: ${escapeHTML(result.date)}`
      : 'Complete this test to save a result.';

    return `<div class="metric">
              <div>
                <span>${escapeHTML(testDetails[test].name)}</span>
                <small class="result-date">${date}</small>
              </div>
              ${score}
            </div>`;
  }).join('');
}

function initResults() {
  renderBestResults();

  document.querySelector('#exportResult')?.addEventListener('click', downloadJSON);
  document.querySelector('#deleteResults')?.addEventListener('click', deleteAllResults);
}

/* ----------------------------------------
   Export
---------------------------------------- */

function downloadJSON() {
  const best = getBestResults();

  const data = Object.keys(testDetails)
    .filter(test => best[test])
    .map(test => ({
      test: testDetails[test].name,
      score: best[test].score,
      unit: testDetails[test].scoreType,
      date: best[test].date
    }));

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: 'application/json' }
  );

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'best-results.json';
  link.click();

  URL.revokeObjectURL(link.href);
}


function deleteAllResults() {
  if (!confirm('Delete all saved assessment results and completion progress? This cannot be undone.')) {
    return;
  }

  save({ results: [], score: 0 });

  // Refresh whichever results display is currently open.
  renderBestResults();

  const finalScore = document.querySelector('#final-score');
  if (finalScore) finalScore.textContent = '0';

  toast('Saved results deleted');
}

function initExport() {
  document.querySelector('#exportBtn')?.addEventListener('click', downloadJSON);
}


function initPast() {
  document.querySelector('#deleteAllResults')?.addEventListener('click', deleteAllResults);
}