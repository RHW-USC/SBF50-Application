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
    scoreType: "",
  }
}

const defaults = {
  camera: false,
  test: null,
  score: 0,
  results: []
};

function state() {
  try {
    return {...defaults, ...JSON.parse(localStorage.getItem(storeKey) || '{}')
    };
  } catch {
    return {...defaults};
  }
}

function save(p) {
  const s = {...state(), ...p};

  localStorage.setItem(storeKey, JSON.stringify(s));

  return s;
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
   Choose Test
---------------------------------------- */

function initChoose() {
  const options = document.querySelectorAll('.test-option');

  options.forEach(option => {
    if (!option.classList.contains("unavailable")){
        option.addEventListener('click', () => {
            options.forEach(x => x.classList.remove('active'));

            option.classList.add('active');
            console.log(option.dataset.test);
            save({test: option.dataset.test});
        });
    }
  });

  document.querySelector('#startTest')?.addEventListener('click', () => go('test'));
}

/* ----------------------------------------
   Test
---------------------------------------- */

let startTest = false;

function initTest() {
  const s = state();
  const selectedTest = s.test;
  const test = testDetails[selectedTest];

  let running = false;

  const testLabel = document.getElementById("test-label")
  testLabel.innerHTML = test.name;

  const totalTime = test['duration']
  let remaining = totalTime;

  let timerPrep;
  let timer;
  
  var _points = points;
  if (_points == Infinity) points = 0;

  const prepTime = test['prepTime']
  let remainingPrep = prepTime;

  const timerText = document.querySelector('#timer');
  const timerLabel = document.querySelector('#timer-label')

  const scoreText = document.querySelector('#score');
  scoreText.innerHTML = points + test['scoreType'];

  const startText = document.querySelector('#runTest');
  const progressBar = document.querySelector('#testProgress');

  timerText.textContent = totalTime + 's';

  startText.onclick = () => {
    if (running) {
      return;
    }

    timerText.innerHTML = remainingPrep;
    timerLabel.innerHTML = 'Get Ready!';
    startText.innerHTML = 'Move into position!'

    if(!startTest){
      timerPrep = setInterval(() => {
        remainingPrep--;
        timerText.innerHTML = remainingPrep;
        timerLabel.innerHTML = 'Get Ready!';
        startText.innerHTML = 'Move Into Position!'

        if (remainingPrep <= 0){
          startTest = true;
          clearInterval(timerPrep);
          initTest();
        }
      }, 1000)
    }
  };

    if (startTest){
      isTestActive = true;

      running = true;

      timerLabel.innerHTML = "Remaining Time";
      startText.textContent = 'Testing…';

      timer = setInterval(() => {
        remaining--;

        timerText.textContent = remaining + 's';
        scoreText.textContent = points + test['scoreType'];

        progressBar.style.width = ((totalTime - remaining) / totalTime * 100) + '%';

        if (remaining <= 0) {
          startTest = false;
          isTestActive = false;

          clearInterval(timer);

          const s = save({score: points});

          s.results = [(s.results || []),
            {
              date: new Date().toLocaleDateString('en-AU'),
              test: s.test,
              score: s.score
            }];

          save({results: s.results});

          go('results');
        }
      }, 1000);  
    }
}

/* ----------------------------------------
   Results
---------------------------------------- */

function initResults() {
  const s = state();

  document.querySelector('.score-label').textContent = s.test;

  document.querySelector('#final-score').textContent = s.score + testDetails[s.test]['scoreType'] || 0;

  document.querySelector('#exportResult')?.addEventListener('click', () => {toast('Result saved');
    
  setTimeout(() => go('export'), 500);});
}

/* ----------------------------------------
   Export
---------------------------------------- */

function initExport() {
  const s = state();

  document.querySelector('#exportBtn')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({test: s.test, score: s.score, exportedAt: new Date().toISOString()}, null, 2)],
      {
        type: 'application/json'
      }
    );

    const a = document.createElement('a');

    a.href = URL.createObjectURL(blob);
    a.download = 'spine-plus-result.json';

    a.click();

    URL.revokeObjectURL(a.href);

    toast('Results exported');
  });
}

/* ----------------------------------------
   Past Results
---------------------------------------- */

function initPast() {
  const s = state();
  const box = document.querySelector('#pastList');

  let results = s.results || [];

  if (results.length > 0) {
    results = [
      {
        date: 'Today',
        test: s.test || 'Single Leg Stand',
        score: s.score || 0
      }
    ];
  }

  box.innerHTML = results.slice().reverse().map(
      r => `<div class="past-item">
              <span class="past-score">${r.score}</span>
              <div class="past-date">${r.date}</div>
              <div class="past-title">${r.test || 'Spine Plus Assessment'}</div>
            </div>`).join('');
}