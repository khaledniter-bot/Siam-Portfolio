/**
 * =========================================================
 *  particles.js — Interactive Canvas Particle Background
 *  Portfolio of Khaladur Rahman Siam
 * =========================================================
 */

(function () {
  'use strict';

  /* ── Configuration ────────────────────────────────────── */
  const CONFIG = {
    particleCount:      100,   // 80–120 particles
    particleSize:       2.5,   // base radius in px
    speed:              0.55,  // base velocity magnitude
    interactionRadius:  130,   // px – mouse attraction zone
    attractionStrength: 0.045, // easing factor (0 = no pull, 1 = instant snap)
    connectionRadius:   110,   // px – max distance to draw a line
    maxLineOpacity:     0.18,  // subtlety of connection lines
    glowBlur:           8,     // canvas shadow blur for glow effect
  };

  /* ── Colour helpers (reads CSS variables) ─────────────── */
  function cssVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name).trim();
  }

  /* ── Canvas setup ─────────────────────────────────────── */
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;                   // guard: element must exist
  const ctx    = canvas.getContext('2d');

  /* ── State ────────────────────────────────────────────── */
  let W, H;
  const particles = [];
  const mouse     = { x: -9999, y: -9999 };

  /* ── Resize handler ───────────────────────────────────── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* ── Particle class ───────────────────────────────────── */
  class Particle {
    constructor() { this.reset(true); }

    reset(init = false) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : (Math.random() < 0.5 ? -5 : H + 5);
      // Random velocity: speed ±50 %
      const speed    = CONFIG.speed * (0.5 + Math.random());
      const angle    = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      // Slightly varied size
      this.radius = CONFIG.particleSize * (0.6 + Math.random() * 0.8);
      // Opacity pulse parameters
      this.baseAlpha = 0.4 + Math.random() * 0.45;
      this.alpha     = this.baseAlpha;
      this.alphaDelta = (Math.random() - 0.5) * 0.005;
    }

    update() {
      /* Mouse attraction with smooth easing */
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONFIG.interactionRadius && dist > 0) {
        // Ramp attraction by proximity — stronger when closer
        const force = (1 - dist / CONFIG.interactionRadius) * CONFIG.attractionStrength;
        this.vx += dx * force;
        this.vy += dy * force;
      }

      /* Speed cap so particles don't fly away */
      const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const maxSpd = CONFIG.speed * 4;
      if (spd > maxSpd) {
        this.vx = (this.vx / spd) * maxSpd;
        this.vy = (this.vy / spd) * maxSpd;
      }

      /* Gently dampen to drift back to base speed */
      this.vx *= 0.994;
      this.vy *= 0.994;

      this.x += this.vx;
      this.y += this.vy;

      /* Wrap particles at edges (toroidal) */
      if (this.x < -10) this.x = W + 10;
      if (this.x > W + 10) this.x = -10;
      if (this.y < -10) this.y = H + 10;
      if (this.y > H + 10) this.y = -10;

      /* Pulsate opacity */
      this.alpha += this.alphaDelta;
      if (this.alpha > this.baseAlpha + 0.15 || this.alpha < this.baseAlpha - 0.2) {
        this.alphaDelta *= -1;
      }
    }

    draw(accentColor, glowColor) {
      ctx.save();
      ctx.globalAlpha    = Math.max(0, Math.min(1, this.alpha));
      ctx.shadowBlur     = CONFIG.glowBlur;
      ctx.shadowColor    = glowColor;
      ctx.fillStyle      = accentColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ── Initialise particles ─────────────────────────────── */
  function init() {
    resize();
    particles.length = 0;
    for (let i = 0; i < CONFIG.particleCount; i++) {
      particles.push(new Particle());
    }
  }

  /* ── Draw connection lines ────────────────────────────── */
  function drawConnections(lineColor) {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a  = particles[i];
        const b  = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.connectionRadius) {
          const opacity = CONFIG.maxLineOpacity * (1 - dist / CONFIG.connectionRadius);
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.strokeStyle = lineColor;
          ctx.lineWidth   = 0.8;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  /* ── Animation loop ───────────────────────────────────── */
  function animate() {
    requestAnimationFrame(animate);

    ctx.clearRect(0, 0, W, H);

    /* Re-read CSS vars each frame – handles theme switches */
    const accent    = cssVar('--primary-color')    || '#E50914';
    const lineColor = cssVar('--text-secondary')   || '#aaaaaa';
    const glowColor = cssVar('--primary-color')    || '#E50914';

    drawConnections(lineColor);

    for (const p of particles) {
      p.update();
      p.draw(accent, glowColor);
    }
  }

  /* ── Mouse tracking ───────────────────────────────────── */
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  /* ── Responsive resize ────────────────────────────────── */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      // Re-clamp particles that are now off-screen
      for (const p of particles) {
        if (p.x > W) p.x = Math.random() * W;
        if (p.y > H) p.y = Math.random() * H;
      }
    }, 150);
  });

  /* ── Kickoff ──────────────────────────────────────────── */
  init();
  animate();

})();
