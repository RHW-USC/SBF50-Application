const storeKey = 'spinePlusDemo';

const defaults = {
  camera: false,
  test: null,
  score: 0,
  results: []
};

function state() {
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem(storeKey) || '{}')
    };
  } catch {
    return {
      ...defaults
    };
  }
}

function save(p) {
  const s = {
    ...state(),
    ...p
  };

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
            options.forEach(x =>
                x.classList.remove('active')
            );

            option.classList.add('active');

            save({
                test: option.dataset.test
            });
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
  let running = false;

  const totalTime = 30
  let remaining = totalTime;

  let timerPrep;
  let timer;
  
  const prepTime = 7
  let remainingPrep = prepTime;

  const timerText = document.querySelector('#timer');
  const timerLabel = document.querySelector('#timer-label')

  const scoreText = document.querySelector('#score');
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
        scoreText.textContent = points;

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

  document.querySelector('#final-score').textContent = s.score || 0;

  document.querySelector('#exportResult')?.addEventListener('click', () => {toast('Result saved');
    
  setTimeout(() => go('export'), 500);});
}

/* ----------------------------------------
   Export
---------------------------------------- */

function initExport() {
  const s = state();

  document
    .querySelector('#exportBtn')
    ?.addEventListener('click', () => {
      const blob = new Blob(
        [
          JSON.stringify(
            {
              test: s.test,
              score: s.score,
              exportedAt: new Date().toISOString()
            },
            null,
            2
          )
        ],
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