(function () {
  'use strict';

  // ============================================================
  // СЛАЙДШОУ HERO — переключение фотографий справа
  // ============================================================
  var slideshow = document.querySelector('.hero-slideshow');
  var dotsContainer = document.querySelector('.hero-slideshow-dots');
  if (slideshow && dotsContainer) {
    var slides = slideshow.querySelectorAll('.hero-slide');
    var current = 0;
    var total = slides.length;
    var autoplayDelay = 5000; // интервал автопереключения (мс)

    // Переход на слайд по индексу
    function goTo(index) {
      current = (index + total) % total;
      // Переключение активного класса на слайдах
      slides.forEach(function (s, i) {
        s.classList.toggle('active', i === current);
      });
      // Обновление активной точки-навигатора
      var dots = dotsContainer.querySelectorAll('.dot');
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === current);
      });
      // Обновление счётчика «01 / 05»
      var counter = slideshow.querySelector('.hero-counter');
      if (counter) {
        var n = String(current + 1).padStart(2, '0');
        var t = String(total).padStart(2, '0');
        counter.textContent = n + ' / ' + t;
      }
    }

    // Генерация точек-навигаторов по числу слайдов
    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      dot.addEventListener('click', function () {
        goTo(i);
      });
      dotsContainer.appendChild(dot);
    });

    // Стрелки «назад» / «вперёд»
    var prevBtn = document.querySelector('.hero-arrow-prev');
    var nextBtn = document.querySelector('.hero-arrow-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        goTo(current - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        goTo(current + 1);
      });
    }

    // Автоматическое переключение слайдов
    setInterval(function () {
      goTo(current + 1);
    }, autoplayDelay);
  }

  // ============================================================
  // АНИМАЦИЯ СЧЁТЧИКОВ В СТАТИСТИКЕ HERO
  // Запускается один раз при появлении элемента во viewport
  // ============================================================
  var statNumbers = document.querySelectorAll('.hero-stat strong[data-count]');
  if (statNumbers.length && 'IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        var isDecimal = String(target).indexOf('.') !== -1;
        var duration = 1600; // длительность анимации (мс)
        var startTime = null;

        // Анимация через requestAnimationFrame с easing
        function tick(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          var current = isDecimal
            ? (eased * target).toFixed(1)
            : Math.floor(eased * target);
          var suffixClass = suffix === '★' ? 'stat-suffix stat-suffix--star' : 'stat-suffix';
          el.innerHTML = current + '<span class="' + suffixClass + '">' + suffix + '</span>';
          if (progress < 1) {
            requestAnimationFrame(tick);
          }
        }

        requestAnimationFrame(tick);
        countObserver.unobserve(el); // запускаем анимацию только один раз
      });
    }, { threshold: 0.6 });

    statNumbers.forEach(function (el) {
      countObserver.observe(el);
    });
  }

  // ============================================================
  // ВИДЖЕТ БРОНИРОВАНИЯ — город, даты, гости
  // ============================================================
  (function () {
    var widget = document.getElementById('booking-widget');
    if (!widget) return;

    // Названия месяцев и дней недели
    var MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var DAYS_SHORT   = ['Mo','Tu','We','Th','Fr','Sa','Su'];

    // Глобальное состояние виджета
    var state = {
      city: '',                              // выбранный район
      rangeStart: null, rangeEnd: null,      // начало и конец диапазона дат
      selecting: false, hovered: null,       // флаг выбора и hover-дата для превью
      adults: 1, children: 0, pets: 0,      // количество гостей
      calYear: new Date().getFullYear(),     // год отображаемого календаря
      calMonth: new Date().getMonth()        // месяц отображаемого календаря
    };

    // Активная открытая панель (city | dates | guests | null)
    var activePanel = null;

    // Вспомогательные функции для сравнения дат
    function dv(d)        { return d ? d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate() : 0; }
    function same(a, b)   { return a && b && dv(a) === dv(b); }
    function before(a, b) { return dv(a) < dv(b); }
    function fmt(d)       { return d ? MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate() : ''; }

    /* ---- Управление панелями: открыть / закрыть все ---- */
    function openPanel(name) {
      closeAll();
      activePanel = name;
      var f = document.getElementById('bw-' + name + '-field');
      var d = document.getElementById('bw-' + name + '-dropdown');
      var t = document.getElementById('bw-' + name + '-trigger');
      if (f) f.classList.add('bw-field--open');
      if (d) d.classList.add('bw-dropdown--open');
      if (t) t.setAttribute('aria-expanded', 'true');
    }
    function closeAll() {
      activePanel = null;
      widget.querySelectorAll('.bw-field--open').forEach(function (el) { el.classList.remove('bw-field--open'); });
      widget.querySelectorAll('.bw-dropdown--open').forEach(function (el) { el.classList.remove('bw-dropdown--open'); });
      widget.querySelectorAll('[aria-expanded]').forEach(function (el) { el.setAttribute('aria-expanded', 'false'); });
    }

    // Клик вне виджета — закрываем все панели
    // composedPath() используется для надёжности при динамических DOM-изменениях
    document.addEventListener('click', function (e) {
      if (!activePanel) return;
      var path = e.composedPath ? e.composedPath() : [];
      if (path.indexOf(widget) === -1 && !widget.contains(e.target)) closeAll();
    });

    /* ---- Логика выбора района ---- */
    var cityTrig = document.getElementById('bw-city-trigger');
    var cityDrop = document.getElementById('bw-city-dropdown');
    var cityValEl = document.getElementById('bw-city-value');

    // Открытие/закрытие дропдауна районов
    if (cityTrig) cityTrig.addEventListener('click', function (e) {
      e.stopPropagation();
      activePanel === 'city' ? closeAll() : openPanel('city');
    });

    // Выбор района: обновляем state и сразу открываем календарь
    if (cityDrop) cityDrop.querySelectorAll('.bw-city-opt').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        state.city = btn.getAttribute('data-value');
        cityValEl.textContent = btn.textContent.trim();
        // Убираем активный класс у всех опций и ставим на выбранную
        cityDrop.querySelectorAll('.bw-city-opt').forEach(function (b) { b.classList.remove('bw-city-opt--active'); });
        btn.classList.add('bw-city-opt--active');
        closeAll();
        openPanel('dates');
        renderCalendar();
      });
    });

    /* ---- Календарь — построение и управление ---- */
    var calMonthsEl = document.getElementById('bw-cal-months');
    var calPrevBtn  = document.getElementById('bw-cal-prev');
    var calNextBtn  = document.getElementById('bw-cal-next');
    var calClearBtn = document.getElementById('bw-cal-clear');
    var datesTrig   = document.getElementById('bw-dates-trigger');
    var datesValEl  = document.getElementById('bw-dates-value');

    // Полная перестройка DOM календаря — вызывается при смене месяца или открытии
    function renderCalendar() {
      if (!calMonthsEl) return;
      calMonthsEl.innerHTML = '';
      for (var m = 0; m < 2; m++) {
        var mo = (state.calMonth + m) % 12;
        var yr = state.calYear + Math.floor((state.calMonth + m) / 12);
        calMonthsEl.appendChild(buildMonth(yr, mo));
      }
    }

    // Построение DOM одного месяца (заголовок + метки дней + сетка дат)
    function buildMonth(year, month) {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var wrap  = document.createElement('div'); wrap.className = 'bw-cal-month';

      // Заголовок месяца
      var hdr = document.createElement('div');
      hdr.className = 'bw-cal-header';
      hdr.textContent = MONTHS_LONG[month] + ' ' + year;
      wrap.appendChild(hdr);

      // Метки дней недели
      var lbls = document.createElement('div'); lbls.className = 'bw-cal-labels';
      DAYS_SHORT.forEach(function (d) { var s = document.createElement('span'); s.textContent = d; lbls.appendChild(s); });
      wrap.appendChild(lbls);

      // Сетка дат месяца
      var grid = document.createElement('div'); grid.className = 'bw-cal-grid';
      var offset = (new Date(year, month, 1).getDay() + 6) % 7; // отступ первого дня (пн = 0)
      var total  = new Date(year, month + 1, 0).getDate();       // количество дней в месяце

      // Пустые ячейки для выравнивания сетки
      for (var i = 0; i < offset; i++) {
        var sp = document.createElement('span'); sp.className = 'bw-day bw-day--empty'; grid.appendChild(sp);
      }
      // Кнопки дат
      for (var d = 1; d <= total; d++) {
        var date = new Date(year, month, d); date.setHours(0, 0, 0, 0);
        var btn  = document.createElement('button');
        btn.type = 'button'; btn.className = 'bw-day';
        btn.textContent = d;
        btn.setAttribute('data-ts', String(date.getTime())); // метка времени для идентификации
        if (date < today) { btn.classList.add('bw-day--past'); btn.disabled = true; }
        if (same(date, today)) btn.classList.add('bw-day--today');
        grid.appendChild(btn);
      }
      wrap.appendChild(grid);
      return wrap;
    }

    // Обновление CSS-классов диапазона без перестройки DOM (для hover-превью)
    function applyRangeClasses() {
      if (!calMonthsEl) return;
      var es = state.rangeStart;
      // Если идёт выбор — применяем hover как временный конец диапазона
      var ee = state.rangeEnd || (state.selecting && state.hovered ? state.hovered : null);
      // Гарантируем, что es <= ee
      if (es && ee && before(ee, es)) { var tmp = es; es = ee; ee = tmp; }

      calMonthsEl.querySelectorAll('.bw-day[data-ts]').forEach(function (btn) {
        var d = new Date(parseInt(btn.getAttribute('data-ts'), 10));
        btn.classList.toggle('bw-day--start',    !!(es && same(d, es)));
        btn.classList.toggle('bw-day--end',      !!(ee && same(d, ee)));
        btn.classList.toggle('bw-day--in-range', !!(es && ee && dv(d) > dv(es) && dv(d) < dv(ee)));
      });
    }

    // Обновление текста в поле дат
    function updateDatesVal() {
      if (!datesValEl) return;
      if (state.rangeStart && state.rangeEnd) {
        datesValEl.textContent = fmt(state.rangeStart) + ' — ' + fmt(state.rangeEnd);
      } else if (state.rangeStart) {
        datesValEl.textContent = fmt(state.rangeStart) + ' — ?';
      } else {
        datesValEl.textContent = 'Add dates';
      }
    }

    /* Делегирование событий на контейнер месяцев —
       один обработчик работает для всех дат без привязки к конкретным кнопкам */
    if (calMonthsEl) {
      // Клик по дате: устанавливаем начало или конец диапазона
      calMonthsEl.addEventListener('click', function (e) {
        e.stopPropagation();
        var btn = e.target.closest ? e.target.closest('.bw-day') : null;
        if (!btn || btn.disabled || btn.classList.contains('bw-day--empty')) return;
        var clicked = new Date(parseInt(btn.getAttribute('data-ts'), 10));

        if (!state.rangeStart || (state.rangeStart && state.rangeEnd)) {
          // Начинаем новый диапазон
          state.rangeStart = clicked; state.rangeEnd = null;
          state.selecting = true; state.hovered = null;
        } else {
          // Завершаем диапазон (меняем местами, если нужно)
          if (before(clicked, state.rangeStart)) {
            state.rangeEnd = state.rangeStart; state.rangeStart = clicked;
          } else {
            state.rangeEnd = clicked;
          }
          state.selecting = false; state.hovered = null;
          updateDatesVal();
          setTimeout(closeAll, 350); // небольшая задержка перед закрытием
        }
        applyRangeClasses();
      });

      // Hover по дате: показываем превью диапазона во время выбора
      calMonthsEl.addEventListener('mouseover', function (e) {
        if (!state.selecting) return;
        var btn = e.target.closest ? e.target.closest('.bw-day') : null;
        if (!btn || btn.disabled || btn.classList.contains('bw-day--empty')) return;
        var d = new Date(parseInt(btn.getAttribute('data-ts'), 10));
        if (state.hovered && same(d, state.hovered)) return; // оптимизация: пропускаем повторы
        state.hovered = d;
        applyRangeClasses();
      });

      // Уход курсора из календаря — сбрасываем hover-превью
      calMonthsEl.addEventListener('mouseleave', function () {
        if (!state.selecting || !state.hovered) return;
        state.hovered = null;
        applyRangeClasses();
      });
    }

    // Кнопка-триггер дат: открыть/закрыть календарь
    if (datesTrig) datesTrig.addEventListener('click', function (e) {
      e.stopPropagation();
      if (activePanel === 'dates') { closeAll(); } else { openPanel('dates'); renderCalendar(); applyRangeClasses(); }
    });

    // Кнопка «предыдущий месяц»
    if (calPrevBtn) calPrevBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      state.calMonth--; if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
      renderCalendar(); applyRangeClasses();
    });

    // Кнопка «следующий месяц»
    if (calNextBtn) calNextBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      state.calMonth++; if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
      renderCalendar(); applyRangeClasses();
    });

    // Кнопка сброса дат
    if (calClearBtn) calClearBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      state.rangeStart = null; state.rangeEnd = null; state.selecting = false; state.hovered = null;
      updateDatesVal(); applyRangeClasses();
    });

    /* ---- Логика выбора гостей ---- */
    var guestsTrig  = document.getElementById('bw-guests-trigger');
    var guestsValEl = document.getElementById('bw-guests-value');

    // Обновление текста в поле гостей (формирует строку вида «2 adults, 1 child»)
    function updateGuestsVal() {
      var p = [];
      if (state.adults   > 0) p.push(state.adults   + (state.adults   === 1 ? ' adult'    : ' adults'));
      if (state.children > 0) p.push(state.children + (state.children === 1 ? ' child'    : ' children'));
      if (state.pets     > 0) p.push(state.pets     + (state.pets     === 1 ? ' pet'      : ' pets'));
      if (guestsValEl) guestsValEl.textContent = p.length ? p.join(', ') : 'Add guests';
    }

    // Фабричная функция счётчика: создаёт логику +/- для одной категории гостей
    function setupCnt(decId, incId, numId, key, min, max) {
      var dec = document.getElementById(decId);
      var inc = document.getElementById(incId);
      var num = document.getElementById(numId);
      if (!dec || !inc || !num) return;
      function upd(n) {
        state[key] = Math.max(min, Math.min(max, n)); // ограничиваем значение [min, max]
        num.textContent = state[key];
        dec.disabled = state[key] <= min; // блокируем кнопку на минимуме
        inc.disabled = state[key] >= max; // блокируем кнопку на максимуме
        updateGuestsVal();
      }
      dec.addEventListener('click', function (e) { e.stopPropagation(); upd(state[key] - 1); });
      inc.addEventListener('click', function (e) { e.stopPropagation(); upd(state[key] + 1); });
      upd(state[key]); // инициализация при запуске
    }

    // Инициализация счётчиков: Adults (мин 1), Children, Pets
    setupCnt('adults-dec',   'adults-inc',   'adults-num',   'adults',   1, 10);
    setupCnt('children-dec', 'children-inc', 'children-num', 'children', 0, 10);
    setupCnt('pets-dec',     'pets-inc',     'pets-num',     'pets',     0, 5);

    // Открытие/закрытие дропдауна гостей
    if (guestsTrig) guestsTrig.addEventListener('click', function (e) {
      e.stopPropagation();
      activePanel === 'guests' ? closeAll() : openPanel('guests');
    });

    /* ---- Кнопка поиска — скролл к форме бронирования ---- */
    var searchBtn = document.getElementById('bw-search-btn');
    if (searchBtn) searchBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAll();
      var t = document.getElementById('search');
      if (t) t.scrollIntoView({ behavior: 'smooth' });
    });

    // Инициализация отображения значений при загрузке
    updateDatesVal();
    updateGuestsVal();
  })();

  // ============================================================
  // КАРУСЕЛЬ РЕКОМЕНДАЦИЙ — листание карточек объектов
  // ============================================================
  (function () {
    var carousel  = document.getElementById('rec-carousel');
    var prevBtn   = document.getElementById('rec-prev');
    var nextBtn   = document.getElementById('rec-next');
    if (!carousel || !prevBtn || !nextBtn) return;

    var totalCards = carousel.querySelectorAll('.rec-card').length;
    var currentIdx = 0;

    // Число видимых карточек зависит от ширины экрана
    function visibleCount() {
      if (window.innerWidth <= 580) return 1;
      if (window.innerWidth <= 900) return 2;
      return 3;
    }

    function maxIndex() {
      return Math.max(0, totalCards - visibleCount());
    }

    function updateCarousel() {
      var vis = visibleCount();
      var gap = 24; // 1.5rem = 24px
      // Ширина одной карточки = (100% outer - gaps) / vis
      var cardW = (carousel.parentElement.offsetWidth - gap * (vis - 1)) / vis;
      var offset = currentIdx * (cardW + gap);
      carousel.style.transform = 'translateX(-' + offset + 'px)';
      prevBtn.disabled = currentIdx === 0;
      nextBtn.disabled = currentIdx >= maxIndex();
    }

    prevBtn.addEventListener('click', function () {
      if (currentIdx > 0) { currentIdx--; updateCarousel(); }
    });
    nextBtn.addEventListener('click', function () {
      if (currentIdx < maxIndex()) { currentIdx++; updateCarousel(); }
    });

    // Пересчитываем при изменении размера окна
    window.addEventListener('resize', function () {
      currentIdx = Math.min(currentIdx, maxIndex());
      updateCarousel();
    });

    updateCarousel();
  })();

  // ============================================================
  // МОБИЛЬНОЕ МЕНЮ — бургер-кнопка
  // ============================================================
  var menuToggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
      nav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-label',
        document.body.classList.contains('nav-open') ? 'Close menu' : 'Open menu');
    });
  }

  // ============================================================
  // АНИМАЦИЯ КАРТОЧЕК TRUST — появление при скролле
  // ============================================================
  (function () {
    var cards = document.querySelectorAll('.trust-card');
    if (!cards.length || !window.IntersectionObserver) {
      cards.forEach(function (c) { c.classList.add('trust-card--visible'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var card = entry.target;
          var idx = parseInt(card.getAttribute('data-trust-idx') || '0', 10);
          setTimeout(function () {
            card.classList.add('trust-card--visible');
          }, idx * 100);
          obs.unobserve(card);
        }
      });
    }, { threshold: 0.15 });
    cards.forEach(function (c) { obs.observe(c); });
  })();
})();
