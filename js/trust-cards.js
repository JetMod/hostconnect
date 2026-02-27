// ============================================================
// АНИМАЦИЯ КАРТОЧЕК TRUST — появление при скролле
// ============================================================

export function init() {
  const cards = document.querySelectorAll('.trust-card');
  if (!cards.length) return;

  if (!window.IntersectionObserver) {
    cards.forEach((c) => c.classList.add('trust-card--visible'));
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const idx = parseInt(card.getAttribute('data-trust-idx') || '0', 10);
        setTimeout(() => {
          card.classList.add('trust-card--visible');
        }, idx * 100);
        obs.unobserve(card);
      }
    });
  }, { threshold: 0.15 });

  cards.forEach((c) => obs.observe(c));
}
