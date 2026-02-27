// ============================================================
// СЛАЙДШОУ HERO — переключение фотографий справа
// ============================================================

export function init() {
  const slideshow = document.querySelector('.hero-slideshow');
  const dotsContainer = document.querySelector('.hero-slideshow-dots');
  if (!slideshow || !dotsContainer) return;

  const slides = slideshow.querySelectorAll('.hero-slide');
  let current = 0;
  const total = slides.length;
  const autoplayDelay = 5000; // интервал автопереключения (мс)

  function goTo(index) {
    current = (index + total) % total;
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === current);
    });
    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
    const counter = slideshow.querySelector('.hero-counter');
    if (counter) {
      const n = String(current + 1).padStart(2, '0');
      const t = String(total).padStart(2, '0');
      counter.textContent = n + ' / ' + t;
    }
  }

  // Генерация точек-навигаторов
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Slide ' + (i + 1));
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  const prevBtn = document.querySelector('.hero-arrow-prev');
  const nextBtn = document.querySelector('.hero-arrow-next');
  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  setInterval(() => goTo(current + 1), autoplayDelay);
}
