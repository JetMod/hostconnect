// ============================================================
// АНИМАЦИЯ СЧЁТЧИКОВ В СТАТИСТИКЕ HERO
// Запускается один раз при появлении элемента во viewport
// ============================================================

export function init() {
  const statNumbers = document.querySelectorAll('.hero-stat strong[data-count]');
  if (!statNumbers.length || !('IntersectionObserver' in window)) return;

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.getAttribute('data-count'));
      const suffix = el.getAttribute('data-suffix') || '';
      const isDecimal = String(target).indexOf('.') !== -1;
      const duration = 1600;
      let startTime = null;

      function tick(ts) {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = isDecimal
          ? (eased * target).toFixed(1)
          : Math.floor(eased * target);
        const suffixClass = suffix === '★' ? 'stat-suffix stat-suffix--star' : 'stat-suffix';
        el.innerHTML = current + '<span class="' + suffixClass + '">' + suffix + '</span>';
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.6 });

  statNumbers.forEach((el) => countObserver.observe(el));
}
