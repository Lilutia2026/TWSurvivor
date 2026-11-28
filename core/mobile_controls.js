// 觸控輸入只提供方向與強度，移動仍由城鎮及戰鬥迴圈處理。
const MobileControls = (() => {
  const coarse = matchMedia('(pointer: coarse)');
  const portraitQuery = matchMedia('(orientation: portrait)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const movement = { active: false, x: 0, y: 0 };
  const angles = Array.from({ length: 56 }, (_, index) => index * Math.PI * 2 / 56);
  const arc = angles.map(() => 0);
  const overlay = document.getElementById('mobile-joystick');
  const context = overlay.getContext('2d');
  const orientation = document.getElementById('mobile-orientation');
  const interact = document.getElementById('mobile-town-interact');
  let portrait = false, pointerId = null, surface = null;
  let originX = 0, originY = 0, thumbX = 0, thumbY = 0, puck = 0;
  let animation = null, lastFrame = null;

  function fade(value, target, dt) {
    if (reducedMotion.matches) return target;
    const duration = target > value ? 0.08 : 0.15;
    return value + Math.sign(target - value) * Math.min(Math.abs(target - value), dt / duration);
  }

  function draw(now) {
    animation = null;
    const dt = lastFrame === null ? 1 / 60 : Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    context.clearRect(0, 0, overlay.width, overlay.height);
    puck = fade(puck, movement.active ? 1 : 0, dt);
    const strength = Math.hypot(movement.x, movement.y);
    const direction = Math.atan2(movement.y, movement.x);
    for (let i = 0; i < angles.length; i++) {
      const angle = angles[i], difference = angle - direction;
      const offset = Math.abs(Math.atan2(Math.sin(difference), Math.cos(difference)));
      const target = strength > 0 ? Math.max(0, Math.min(1, (0.90 - offset) / 0.30)) : 0;
      arc[i] = fade(arc[i], target, dt);
      if (arc[i] <= 0) continue;
      context.globalAlpha = arc[i] * 0.88;
      context.fillStyle = '#c9e4f2';
      const x = Math.round((originX + Math.cos(angle) * 45) / 2) * 2;
      const y = Math.round((originY + Math.sin(angle) * 45) / 2) * 2;
      context.fillRect(x - 2, y - 2, 4, 4);
    }
    if (puck > 0) {
      const x = Math.round((originX + thumbX) / 2) * 2;
      const y = Math.round((originY + thumbY) / 2) * 2;
      context.globalAlpha = puck * 0.82;
      context.fillStyle = '#a6c7d9';
      context.fillRect(x - 10, y - 14, 20, 28);
      context.fillRect(x - 14, y - 10, 28, 20);
      context.fillStyle = '#496b7a';
      context.fillRect(x - 8, y - 10, 16, 20);
      context.fillRect(x - 10, y - 8, 20, 16);
    }
    context.globalAlpha = 1;
    if (movement.active || puck > 0 || arc.some(alpha => alpha > 0)) animation = requestAnimationFrame(draw);
    else { overlay.hidden = true; lastFrame = null; }
  }

  function clear(immediate = false) {
    const previous = surface, captured = pointerId;
    surface = null;
    pointerId = null;
    movement.active = false;
    movement.x = movement.y = 0;
    if (previous?.hasPointerCapture(captured)) previous.releasePointerCapture(captured);
    if (immediate) {
      if (animation !== null) cancelAnimationFrame(animation);
      animation = lastFrame = null;
      puck = 0;
      arc.fill(0);
      context.clearRect(0, 0, overlay.width, overlay.height);
      overlay.hidden = true;
    }
  }

  function start(event, canStart) {
    if (!coarse.matches || event.pointerType !== 'touch' || event.button !== 0 || portrait || movement.active || !canStart()) return;
    event.preventDefault();
    surface = event.currentTarget;
    pointerId = event.pointerId;
    surface.setPointerCapture(pointerId);
    originX = event.clientX;
    originY = event.clientY;
    thumbX = thumbY = puck = 0;
    arc.fill(0);
    movement.active = true;
    overlay.hidden = false;
    if (animation === null) animation = requestAnimationFrame(draw);
  }

  function move(event) {
    if (event.pointerId !== pointerId) return;
    event.preventDefault();
    const dx = event.clientX - originX, dy = event.clientY - originY;
    const distance = Math.hypot(dx, dy);
    const cap = distance ? Math.min(1, 34 / distance) : 0;
    const amount = Math.max(0, Math.min(1, (distance - 6) / 32));
    thumbX = dx * cap;
    thumbY = dy * cap;
    movement.x = distance ? dx / distance * amount : 0;
    movement.y = distance ? dy / distance * amount : 0;
  }

  function bindCanvas(id, canStart) {
    const target = document.getElementById(id);
    target.addEventListener('pointerdown', event => start(event, canStart));
    target.addEventListener('pointermove', move);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      target.addEventListener(type, event => { if (event.pointerId === pointerId) clear(); });
    }
  }

  function syncLayout() {
    const mobile = coarse.matches;
    document.documentElement.classList.toggle('mobile-layout', mobile);
    const nextPortrait = mobile && portraitQuery.matches;
    orientation.hidden = !nextPortrait;
    if (nextPortrait && !portrait) {
      if (TOWN_STATE.active) {
        TOWN_STATE.isMouseDown = false;
        TOWN_STATE.keys = {};
        TOWN_STATE.player.targetX = TOWN_STATE.player.targetY = null;
        TOWN_STATE.player.walkTime = 0;
      }
      if (battleSceneActive && !isPaused && !gameOver) togglePause();
    }
    const width = document.documentElement.clientWidth, height = window.innerHeight;
    if (nextPortrait !== portrait || !mobile || width !== overlay.width || height !== overlay.height) clear(true);
    portrait = nextPortrait;
    if (overlay.width !== width) overlay.width = width;
    if (overlay.height !== height) overlay.height = height;
  }

  function setTownTarget(target) {
    interact.hidden = !target;
    if (!target) return;
    const text = target.type === 'portal' ? '進入傳送門' : `與${target.name}交談`;
    if (interact.textContent !== text) interact.textContent = text;
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindCanvas('town-canvas', () => TOWN_STATE.active && TOWN_STATE.bgLoaded && !isAnyTownModalOpen());
    bindCanvas('gameCanvas', () => battleSceneActive && !isPaused && !gameOver);
    interact.addEventListener('click', () => {
      if (!portrait && TOWN_STATE.active && !isAnyTownModalOpen()) triggerTownInteractable(TOWN_STATE.activeTarget);
    });
    coarse.addEventListener('change', () => {
      syncLayout();
      resize();
      if (TOWN_STATE.active) syncTownViewportSize();
    });
    portraitQuery.addEventListener('change', syncLayout);
    window.addEventListener('resize', syncLayout);
    window.visualViewport?.addEventListener('resize', syncLayout);
    window.addEventListener('blur', () => clear(true));
    document.addEventListener('visibilitychange', () => { if (document.hidden) clear(true); });
    syncLayout();
    if (coarse.matches) resize();
  });

  return { get enabled() { return coarse.matches; }, get portrait() { return portrait; }, movement, clear, setTownTarget };
})();
