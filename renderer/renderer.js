(() => {
  const body = document.body;
  const closeBtn = document.getElementById('closeBtn');
  const mouthEl = document.getElementById('mouth');
  const statsEl = document.getElementById('stats');
  const authNoticeEl = document.getElementById('authNotice');

  const sessionPctEl = document.getElementById('sessionPct');
  const sessionFillEl = document.getElementById('sessionFill');
  const sessionResetEl = document.getElementById('sessionReset');
  const weeklyPctEl = document.getElementById('weeklyPct');
  const weeklyFillEl = document.getElementById('weeklyFill');
  const weeklyResetEl = document.getElementById('weeklyReset');

  closeBtn.addEventListener('click', () => window.claudeUsage.hideWindow());

  let currentMode = 'wizard';
  let lastUsage = null;

  function moodFor(sessionPct) {
    if (sessionPct === null) return 'neutral';
    if (sessionPct > 50) return 'sad';
    if (sessionPct < 50) return 'happy';
    return 'neutral';
  }

  function updateMouth() {
    const sessionPct = lastUsage?.five_hour ? Math.round(lastUsage.five_hour.utilization) : null;
    const mood = moodFor(sessionPct);
    mouthEl.src = `assets/mouth-${currentMode}-${mood}.png`;
  }

  function formatCountdown(resetsAtIso, units) {
    if (!resetsAtIso) return '--';
    const ms = new Date(resetsAtIso).getTime() - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) return units === 'dh' ? '0D 0H' : '0H 0M';
    const totalMinutes = Math.floor(ms / 60000);
    if (units === 'dh') {
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      return `${days}D ${hours}H`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}H ${minutes}M`;
  }

  function render() {
    const sessionPct = lastUsage?.five_hour ? Math.round(lastUsage.five_hour.utilization) : null;
    const weeklyPct = lastUsage?.seven_day ? Math.round(lastUsage.seven_day.utilization) : null;

    updateMouth();

    sessionPctEl.textContent = sessionPct === null ? '--%' : `${sessionPct}%`;
    sessionFillEl.style.width = `${sessionPct ?? 0}%`;
    sessionResetEl.textContent = lastUsage?.five_hour ? formatCountdown(lastUsage.five_hour.resets_at, 'hm') : '--';

    weeklyPctEl.textContent = weeklyPct === null ? '--%' : `${weeklyPct}%`;
    weeklyFillEl.style.width = `${weeklyPct ?? 0}%`;
    weeklyResetEl.textContent = lastUsage?.seven_day ? formatCountdown(lastUsage.seven_day.resets_at, 'dh') : '--';
  }

  window.claudeUsage.onMode((mode) => {
    currentMode = mode;
    body.dataset.mode = mode;
    updateMouth();
  });

  window.claudeUsage.onAuth((ok) => {
    authNoticeEl.classList.toggle('hidden', ok);
    statsEl.classList.toggle('hidden', !ok);
  });

  window.claudeUsage.onUsage((usage) => {
    lastUsage = usage;
    render();
  });

  window.claudeUsage.getMode().then((mode) => {
    currentMode = mode;
    body.dataset.mode = mode;
    updateMouth();
  });

  authNoticeEl.classList.remove('hidden');
  statsEl.classList.add('hidden');
  updateMouth();

  setInterval(render, 60000);
})();
