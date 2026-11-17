(function () {
  'use strict';

  const formatNumber = new Intl.NumberFormat('de-DE');

  function exerciseLog(plan, name, prescription, priorPlan) {
    const storageKey = planId => 'fitness-exercise-last-v1-' + planId + ':' + name;
    const key = storageKey(plan);
    const timed = name === 'Plank';
    const unit = timed ? 'Sekunden' : 'Wdh.';
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(key) ??
        (priorPlan ? localStorage.getItem(storageKey(priorPlan)) : null));
    } catch {
      saved = null;
    }

    const panel = document.createElement('details');
    panel.className = 'exercise-log';
    const summary = document.createElement('summary');
    function updateSummary() {
      summary.textContent = saved
        ? 'Zuletzt: ' + (saved.weight === null ? '' : formatNumber.format(saved.weight) + ' kg · ') + saved.amount + ' ' + unit
        : 'Trainingswert eintragen';
    }
    updateSummary();

    const form = document.createElement('form');
    form.setAttribute('aria-label', 'Trainingswert für ' + name);
    form.innerHTML = `
      <label>Gewicht in kg (optional)<input name="weight" type="number" min="0" step="any" inputmode="decimal"></label>
      <label>${timed ? 'Sekunden' : prescription.includes('je Seite') ? 'Wiederholungen je Seite' : 'Wiederholungen'}<input name="amount" type="number" min="1" step="1" inputmode="numeric" required></label>
      <button class="info" type="submit">Speichern</button>
      <span class="save-status" role="status"></span>`;
    const { weight, amount } = form.elements;
    const status = form.querySelector('[role="status"]');
    if (saved) {
      weight.value = saved.weight ?? '';
      amount.value = saved.amount;
    }
    form.addEventListener('input', () => { status.textContent = ''; });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const result = { weight: weight.value === '' ? null : weight.valueAsNumber, amount: amount.valueAsNumber };
      if (!Number.isSafeInteger(result.amount) || result.amount < 1 ||
          (result.weight !== null && (!Number.isFinite(result.weight) || result.weight < 0))) return;
      try {
        localStorage.setItem(key, JSON.stringify(result));
        saved = result;
        updateSummary();
        status.textContent = 'Gespeichert';
      } catch {
        status.textContent = 'Speichern in diesem Browser nicht möglich.';
      }
    });
    panel.append(summary, form);
    return panel;
  }

  function setupTimer() {
    const training = document.querySelector('#trainingView');
    const timer = document.querySelector('#timerView');
    const trainingButton = document.querySelector('#showTraining');
    const timerButton = document.querySelector('#showTimer');
    const clock = document.querySelector('#timerClock');
    const status = document.querySelector('#timerStatus');
    const pause = document.querySelector('#timerPause');
    const reset = document.querySelector('#timerReset');
    let deadline = 0;
    let remaining = 0;
    let tick;

    function showTimer(show) {
      training.hidden = show;
      timer.hidden = !show;
      trainingButton.setAttribute('aria-pressed', String(!show));
      timerButton.setAttribute('aria-pressed', String(show));
      if (show) window.scrollTo(0, 0);
      update();
    }

    function update() {
      if (deadline) {
        remaining = Math.max(0, deadline - Date.now());
        if (!remaining) {
          deadline = 0;
          clearInterval(tick);
          status.textContent = 'Pause vorbei.';
          timerButton.textContent = 'Pausentimer · fertig';
        }
      }
      const seconds = Math.ceil(remaining / 1000);
      clock.value = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' +
        String(seconds % 60).padStart(2, '0');
      pause.disabled = remaining === 0;
      pause.textContent = deadline || !remaining ? 'Pausieren' : 'Fortsetzen';
      reset.disabled = remaining === 0 && status.textContent !== 'Pause vorbei.';
    }

    function start(milliseconds) {
      clearInterval(tick);
      remaining = milliseconds;
      deadline = Date.now() + milliseconds;
      status.textContent = 'Pause läuft.';
      timerButton.textContent = 'Pausentimer';
      tick = setInterval(update, 200);
      update();
    }

    trainingButton.addEventListener('click', () => showTimer(false));
    timerButton.addEventListener('click', () => showTimer(true));
    timer.querySelectorAll('[data-seconds]').forEach((button) => {
      button.addEventListener('click', () => start(Number(button.dataset.seconds) * 1000));
    });
    pause.addEventListener('click', () => {
      update();
      if (!remaining) return;
      if (deadline) {
        clearInterval(tick);
        deadline = 0;
        status.textContent = 'Timer pausiert.';
        update();
      } else {
        start(remaining);
      }
    });
    reset.addEventListener('click', () => {
      clearInterval(tick);
      deadline = 0;
      remaining = 0;
      status.textContent = 'Wähle eine Dauer, um die Pause zu starten.';
      timerButton.textContent = 'Pausentimer';
      update();
    });
    document.addEventListener('visibilitychange', update);
  }

  function setupPlanSwipe() {
    const training = document.querySelector('#trainingView');
    const tabs = Array.from(training.querySelectorAll('.tab'));
    let start = null;

    function clearGesture() {
      start = null;
    }

    training.addEventListener('touchstart', (event) => {
      clearGesture();
      if (event.touches.length !== 1 ||
          event.target.closest('button, input, textarea, select, summary, a, [contenteditable]')) return;
      const touch = event.touches[0];
      // Leave screen-edge gestures to the phone.
      if (touch.clientX <= 24 || touch.clientX >= window.innerWidth - 24) return;
      start = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    training.addEventListener('touchmove', (event) => {
      if (!start) return;
      const touch = event.touches[0];
      if (event.touches.length !== 1 || touch.identifier !== start.id) {
        clearGesture();
        return;
      }
      const horizontal = Math.abs(touch.clientX - start.x);
      const vertical = Math.abs(touch.clientY - start.y);
      if (vertical > 14 && vertical >= horizontal) clearGesture();
    }, { passive: true });

    training.addEventListener('touchend', (event) => {
      const gesture = start;
      clearGesture();
      if (!gesture || event.touches.length) return;
      const touch = Array.from(event.changedTouches).find((item) => item.identifier === gesture.id);
      if (!touch) return;
      const horizontal = touch.clientX - gesture.x;
      const vertical = Math.abs(touch.clientY - gesture.y);
      if (Math.abs(horizontal) < 65 || Math.abs(horizontal) < vertical * 1.5) return;
      const current = tabs.findIndex((tab) => tab.classList.contains('active'));
      if (current < 0) return;
      tabs[current + (horizontal < 0 ? 1 : -1)]?.click();
    }, { passive: true });

    training.addEventListener('touchcancel', clearGesture, { passive: true });
  }

  window.TrainingTools = { exerciseLog, setupTimer, setupPlanSwipe };
})();
