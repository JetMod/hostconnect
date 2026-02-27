// ============================================================
// КАРУСЕЛЬ РЕКОМЕНДАЦИЙ — листание карточек объектов
// ============================================================

export function init() {
  const carousel = document.getElementById('rec-carousel');
  const prevBtn = document.getElementById('rec-prev');
  const nextBtn = document.getElementById('rec-next');
  if (!carousel || !prevBtn || !nextBtn) return;

  const totalCards = carousel.querySelectorAll('.rec-card').length;
  let currentIdx = 0;

  function visibleCount() {
    if (window.innerWidth <= 580) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function maxIndex() {
    return Math.max(0, totalCards - visibleCount());
  }

  function updateCarousel() {
    const vis = visibleCount();
    const gap = 24;
    const cardW = (carousel.parentElement.offsetWidth - gap * (vis - 1)) / vis;
    const offset = currentIdx * (cardW + gap);
    carousel.style.transform = 'translateX(-' + offset + 'px)';
    prevBtn.disabled = currentIdx === 0;
    nextBtn.disabled = currentIdx >= maxIndex();
  }

  prevBtn.addEventListener('click', () => {
    if (currentIdx > 0) { currentIdx--; updateCarousel(); }
  });
  nextBtn.addEventListener('click', () => {
    if (currentIdx < maxIndex()) { currentIdx++; updateCarousel(); }
  });

  window.addEventListener('resize', () => {
    currentIdx = Math.min(currentIdx, maxIndex());
    updateCarousel();
  });

  updateCarousel();
}
