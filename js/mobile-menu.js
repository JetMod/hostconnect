// ============================================================
// МОБИЛЬНОЕ МЕНЮ — бургер-кнопка
// ============================================================

export function init() {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (!menuToggle || !nav) return;

  menuToggle.addEventListener('click', () => {
    document.body.classList.toggle('nav-open');
    nav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-label',
      document.body.classList.contains('nav-open') ? 'Close menu' : 'Open menu');
  });
}
