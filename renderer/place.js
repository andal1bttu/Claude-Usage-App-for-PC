(() => {
  const ghost = document.getElementById('ghost');
  const params = new URLSearchParams(location.search);
  const w = Number(params.get('w'));
  const h = Number(params.get('h'));

  ghost.style.width = `${w}px`;
  ghost.style.height = `${h}px`;

  const clamp = (v, min, max) => Math.max(min, Math.min(v, max));

  // Same centering and clamping the main process applies on click.
  function moveGhost(e) {
    ghost.style.left = `${clamp(e.clientX - w / 2, 0, window.innerWidth - w)}px`;
    ghost.style.top = `${clamp(e.clientY - h / 2, 0, window.innerHeight - h)}px`;
    ghost.classList.remove('hidden');
  }

  document.addEventListener('mousemove', moveGhost);
  document.addEventListener('mouseleave', () => ghost.classList.add('hidden'));

  document.addEventListener('mousedown', (e) => {
    if (e.button === 0) window.claudeUsage.confirmPlacement({ x: e.clientX, y: e.clientY });
    else window.claudeUsage.cancelPlacement();
  });

  document.addEventListener('contextmenu', (e) => e.preventDefault());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.claudeUsage.cancelPlacement();
  });
})();
