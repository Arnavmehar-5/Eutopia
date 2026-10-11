/* petals.js — canvas petal layer (DESIGN.md §6)
   Faint layer behind the hero only, low opacity, cobalt colour.
   18 desktop / 8 mobile petals. Off when prefers-reduced-motion. */

(function () {
  'use strict';

  var canvas = document.getElementById('petal-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  // ── Config (DESIGN.md §6, dark system) ──
  var DESKTOP_COUNT = 18;
  var MOBILE_COUNT  = 8;
  var MOBILE_BP     = 640;
  var SIZE_MIN      = 8;
  var SIZE_MAX      = 16;
  var SPEED_MIN     = 20;   // px/s fall speed
  var SPEED_MAX     = 45;
  var SWAY_AMP_MIN  = 20;   // px sway amplitude
  var SWAY_AMP_MAX  = 50;
  var SWAY_PER_MIN  = 4;    // seconds per sway cycle
  var SWAY_PER_MAX  = 8;
  var ROT_SPEED_MAX = 45;   // degrees/s max rotation
  // why: cobalt primary at very low opacity for the dark theme
  var PETAL_COLOR   = [82, 102, 235]; // #5266eb rgb components
  var OPACITY_MIN   = 0.15;
  var OPACITY_MAX   = 0.3;

  // why: check reduced motion preference once; if set, don't animate at all
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // why: petals only render in the hero zone (top 100vh), not behind gallery content
  var heroHeight = window.innerHeight;

  var petals = [];
  var animId = null;
  var lastTime = 0;
  var scrollVelocity = 0;
  var lastScrollY = window.scrollY;
  var lastScrollTime = performance.now();
  var w, h;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function petalCount() {
    return window.innerWidth < MOBILE_BP ? MOBILE_COUNT : DESKTOP_COUNT;
  }

  function resize() {
    w = canvas.width  = window.innerWidth;
    h = canvas.height = window.innerHeight;
    heroHeight = window.innerHeight;
  }

  // why: each petal is a simple bezier-curve shape drawn on canvas
  function createPetal(startAbove) {
    return {
      x: rand(0, w),
      y: startAbove ? rand(-80, -20) : rand(0, heroHeight),
      size: rand(SIZE_MIN, SIZE_MAX),
      speed: rand(SPEED_MIN, SPEED_MAX),
      swayAmp: rand(SWAY_AMP_MIN, SWAY_AMP_MAX),
      swayPeriod: rand(SWAY_PER_MIN, SWAY_PER_MAX),
      swayOffset: rand(0, Math.PI * 2),
      rotation: rand(0, 360),
      rotSpeed: rand(-ROT_SPEED_MAX, ROT_SPEED_MAX),
      opacity: rand(OPACITY_MIN, OPACITY_MAX),
      baseX: 0,
    };
  }

  function initPetals() {
    var count = petalCount();
    petals = [];
    for (var i = 0; i < count; i++) {
      var p = createPetal(false);
      p.baseX = p.x;
      petals.push(p);
    }
  }

  // why: own simple petal shape per DESIGN.md §8
  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = 'rgb(' + PETAL_COLOR[0] + ',' + PETAL_COLOR[1] + ',' + PETAL_COLOR[2] + ')';

    var s = p.size;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.6, -s * 0.6, s * 0.5, s * 0.3, 0, s);
    ctx.bezierCurveTo(-s * 0.5, s * 0.3, -s * 0.6, -s * 0.6, 0, -s);
    ctx.fill();
    ctx.restore();
  }

  function updateAndDraw(timestamp) {
    if (!lastTime) lastTime = timestamp;
    var dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    ctx.clearRect(0, 0, w, h);

    // why: scroll speed multiplier per spec
    var scrollMul = 1 + Math.min(Math.abs(scrollVelocity) / 2000, 0.6);

    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];

      // Fall
      p.y += p.speed * dt * scrollMul;

      // Sway
      var elapsed = timestamp / 1000;
      p.x = p.baseX + Math.sin((elapsed / p.swayPeriod) * Math.PI * 2 + p.swayOffset) * p.swayAmp;

      // Rotation
      p.rotation += p.rotSpeed * dt;

      // why: recycle at the hero boundary so petals don't appear behind gallery content
      if (p.y > heroHeight + p.size * 2) {
        p.y = -p.size * 2;
        p.x = rand(0, w);
        p.baseX = p.x;
      }

      drawPetal(p);
    }

    animId = requestAnimationFrame(updateAndDraw);
  }

  // ── Scroll velocity tracking ──
  function onScroll() {
    var now = performance.now();
    var dtScroll = (now - lastScrollTime) / 1000;
    if (dtScroll > 0) {
      scrollVelocity = (window.scrollY - lastScrollY) / dtScroll;
    }
    lastScrollY = window.scrollY;
    lastScrollTime = now;
  }

  // why: decay scroll velocity when user stops scrolling
  setInterval(function () {
    scrollVelocity *= 0.9;
  }, 100);

  // ── Visibility API: pause when tab is hidden ──
  function onVisibilityChange() {
    if (document.hidden) {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    } else {
      if (!animId && !prefersReducedMotion) {
        lastTime = 0;
        animId = requestAnimationFrame(updateAndDraw);
      }
    }
  }

  // ── Init ──
  resize();
  window.addEventListener('resize', function () {
    resize();
    if (!prefersReducedMotion) {
      var desired = petalCount();
      if (petals.length !== desired) {
        initPetals();
      }
    }
  });

  if (prefersReducedMotion) {
    // why: no animation at all when reduced motion is preferred (DESIGN.md §6)
    // don't even draw static petals — keep it clean
  } else {
    initPetals();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    animId = requestAnimationFrame(updateAndDraw);
  }
})();
