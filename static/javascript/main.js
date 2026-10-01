const storeKey = 'spinePlusDemo';

const defaults = {
  height: '',
  camera: false,
  location: false,
  calibrated: false,
  test: 'single-leg',
  score: 32,
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

function initTest() {
  let remaining = 30;
  let running = false;
  let timer;

  const time = document.querySelector('#timer');
  const start = document.querySelector('#runTest');
  const bar = document.querySelector('#testProgress');

  start.onclick = () => {
    if (running) {
      return;
    }

    running = true;
    start.textContent = 'Testing…';

    let step = 0;

    timer = setInterval(() => {
      remaining--;
      step++;

      time.textContent = remaining + 's';

      bar.style.width =
        ((30 - remaining) / 30 * 100) + '%';

      if (remaining <= 0) {
        clearInterval(timer);

        const s = save({
          score: 32 + Math.floor(Math.random() * 8)
        });

        s.results = [
          ...(s.results || []),
          {
            date: new Date().toLocaleDateString('en-AU'),
            test: s.test,
            score: s.score
          }
        ];

        save({
          results: s.results
        });

        go('results');
      }
    }, 1000);
  };
}

/* ----------------------------------------
   Results
---------------------------------------- */

function initResults() {
  const s = state();

  document.querySelector('#score').textContent =
    s.score || 32;

  document
    .querySelector('#saveResult')
    ?.addEventListener('click', () => {
      toast('Result saved');

      setTimeout(() => go('export'), 500);
    });
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
              height: s.height,
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

  if (!results.length) {
    results = [
      {
        date: 'Today',
        test: s.test || 'Single Leg Stand',
        score: s.score || 32
      }
    ];
  }

  box.innerHTML = results
    .slice()
    .reverse()
    .map(
      r => `
        <div class="past-item">
          <span class="past-score">${r.score}</span>
          <div class="past-date">${r.date}</div>
          <div class="past-title">${r.test || 'Spine Plus assessment'}</div>
        </div>
      `
    )
    .join('');
}