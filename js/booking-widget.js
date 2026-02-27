// ============================================================
// ВИДЖЕТ БРОНИРОВАНИЯ — город, даты, гости
// ============================================================

const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT = ['Mo','Tu','We','Th','Fr','Sa','Su'];

function dv(d) { return d ? d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate() : 0; }
function same(a, b) { return a && b && dv(a) === dv(b); }
function before(a, b) { return dv(a) < dv(b); }
function fmt(d) { return d ? MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate() : ''; }

export function init() {
  const widget = document.getElementById('booking-widget');
  if (!widget) return;

  const state = {
    city: '',
    rangeStart: null,
    rangeEnd: null,
    selecting: false,
    hovered: null,
    adults: 1,
    children: 0,
    pets: 0,
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth()
  };

  let activePanel = null;

  function openPanel(name) {
    closeAll();
    activePanel = name;
    const f = document.getElementById('bw-' + name + '-field');
    const d = document.getElementById('bw-' + name + '-dropdown');
    const t = document.getElementById('bw-' + name + '-trigger');
    if (f) f.classList.add('bw-field--open');
    if (d) d.classList.add('bw-dropdown--open');
    if (t) t.setAttribute('aria-expanded', 'true');
  }

  function closeAll() {
    activePanel = null;
    widget.querySelectorAll('.bw-field--open').forEach((el) => el.classList.remove('bw-field--open'));
    widget.querySelectorAll('.bw-dropdown--open').forEach((el) => el.classList.remove('bw-dropdown--open'));
    widget.querySelectorAll('[aria-expanded]').forEach((el) => el.setAttribute('aria-expanded', 'false'));
  }

  document.addEventListener('click', (e) => {
    if (!activePanel) return;
    const path = e.composedPath ? e.composedPath() : [];
    if (path.indexOf(widget) === -1 && !widget.contains(e.target)) closeAll();
  });

  // Город
  const cityTrig = document.getElementById('bw-city-trigger');
  const cityDrop = document.getElementById('bw-city-dropdown');
  const cityValEl = document.getElementById('bw-city-value');

  if (cityTrig) {
    cityTrig.addEventListener('click', (e) => {
      e.stopPropagation();
      activePanel === 'city' ? closeAll() : openPanel('city');
    });
  }

  if (cityDrop) {
    cityDrop.querySelectorAll('.bw-city-opt').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.city = btn.getAttribute('data-value');
        cityValEl.textContent = btn.textContent.trim();
        cityDrop.querySelectorAll('.bw-city-opt').forEach((b) => b.classList.remove('bw-city-opt--active'));
        btn.classList.add('bw-city-opt--active');
        closeAll();
        openPanel('dates');
        renderCalendar();
      });
    });
  }

  // Календарь
  const calMonthsEl = document.getElementById('bw-cal-months');
  const calPrevBtn = document.getElementById('bw-cal-prev');
  const calNextBtn = document.getElementById('bw-cal-next');
  const calClearBtn = document.getElementById('bw-cal-clear');
  const datesTrig = document.getElementById('bw-dates-trigger');
  const datesValEl = document.getElementById('bw-dates-value');

  function buildMonth(year, month) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const wrap = document.createElement('div');
    wrap.className = 'bw-cal-month';

    const hdr = document.createElement('div');
    hdr.className = 'bw-cal-header';
    hdr.textContent = MONTHS_LONG[month] + ' ' + year;
    wrap.appendChild(hdr);

    const lbls = document.createElement('div');
    lbls.className = 'bw-cal-labels';
    DAYS_SHORT.forEach((d) => {
      const s = document.createElement('span');
      s.textContent = d;
      lbls.appendChild(s);
    });
    wrap.appendChild(lbls);

    const grid = document.createElement('div');
    grid.className = 'bw-cal-grid';
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < offset; i++) {
      const sp = document.createElement('span');
      sp.className = 'bw-day bw-day--empty';
      grid.appendChild(sp);
    }
    for (let d = 1; d <= total; d++) {
      const date = new Date(year, month, d);
      date.setHours(0, 0, 0, 0);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bw-day';
      btn.textContent = d;
      btn.setAttribute('data-ts', String(date.getTime()));
      if (date < today) {
        btn.classList.add('bw-day--past');
        btn.disabled = true;
      }
      if (same(date, today)) btn.classList.add('bw-day--today');
      grid.appendChild(btn);
    }
    wrap.appendChild(grid);
    return wrap;
  }

  function renderCalendar() {
    if (!calMonthsEl) return;
    calMonthsEl.innerHTML = '';
    for (let m = 0; m < 2; m++) {
      const mo = (state.calMonth + m) % 12;
      const yr = state.calYear + Math.floor((state.calMonth + m) / 12);
      calMonthsEl.appendChild(buildMonth(yr, mo));
    }
  }

  function applyRangeClasses() {
    if (!calMonthsEl) return;
    let es = state.rangeStart;
    let ee = state.rangeEnd || (state.selecting && state.hovered ? state.hovered : null);
    if (es && ee && before(ee, es)) {
      const tmp = es;
      es = ee;
      ee = tmp;
    }

    calMonthsEl.querySelectorAll('.bw-day[data-ts]').forEach((btn) => {
      const d = new Date(parseInt(btn.getAttribute('data-ts'), 10));
      btn.classList.toggle('bw-day--start', !!(es && same(d, es)));
      btn.classList.toggle('bw-day--end', !!(ee && same(d, ee)));
      btn.classList.toggle('bw-day--in-range', !!(es && ee && dv(d) > dv(es) && dv(d) < dv(ee)));
    });
  }

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

  if (calMonthsEl) {
    calMonthsEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.target.closest ? e.target.closest('.bw-day') : null;
      if (!btn || btn.disabled || btn.classList.contains('bw-day--empty')) return;
      const clicked = new Date(parseInt(btn.getAttribute('data-ts'), 10));

      if (!state.rangeStart || (state.rangeStart && state.rangeEnd)) {
        state.rangeStart = clicked;
        state.rangeEnd = null;
        state.selecting = true;
        state.hovered = null;
      } else {
        if (before(clicked, state.rangeStart)) {
          state.rangeEnd = state.rangeStart;
          state.rangeStart = clicked;
        } else {
          state.rangeEnd = clicked;
        }
        state.selecting = false;
        state.hovered = null;
        updateDatesVal();
        setTimeout(closeAll, 350);
      }
      applyRangeClasses();
    });

    calMonthsEl.addEventListener('mouseover', (e) => {
      if (!state.selecting) return;
      const btn = e.target.closest ? e.target.closest('.bw-day') : null;
      if (!btn || btn.disabled || btn.classList.contains('bw-day--empty')) return;
      const d = new Date(parseInt(btn.getAttribute('data-ts'), 10));
      if (state.hovered && same(d, state.hovered)) return;
      state.hovered = d;
      applyRangeClasses();
    });

    calMonthsEl.addEventListener('mouseleave', () => {
      if (!state.selecting || !state.hovered) return;
      state.hovered = null;
      applyRangeClasses();
    });
  }

  if (datesTrig) {
    datesTrig.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activePanel === 'dates') {
        closeAll();
      } else {
        openPanel('dates');
        renderCalendar();
        applyRangeClasses();
      }
    });
  }

  if (calPrevBtn) {
    calPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.calMonth--;
      if (state.calMonth < 0) {
        state.calMonth = 11;
        state.calYear--;
      }
      renderCalendar();
      applyRangeClasses();
    });
  }

  if (calNextBtn) {
    calNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.calMonth++;
      if (state.calMonth > 11) {
        state.calMonth = 0;
        state.calYear++;
      }
      renderCalendar();
      applyRangeClasses();
    });
  }

  if (calClearBtn) {
    calClearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.rangeStart = null;
      state.rangeEnd = null;
      state.selecting = false;
      state.hovered = null;
      updateDatesVal();
      applyRangeClasses();
    });
  }

  // Гости
  const guestsTrig = document.getElementById('bw-guests-trigger');
  const guestsValEl = document.getElementById('bw-guests-value');

  function updateGuestsVal() {
    const p = [];
    if (state.adults > 0) p.push(state.adults + (state.adults === 1 ? ' adult' : ' adults'));
    if (state.children > 0) p.push(state.children + (state.children === 1 ? ' child' : ' children'));
    if (state.pets > 0) p.push(state.pets + (state.pets === 1 ? ' pet' : ' pets'));
    if (guestsValEl) guestsValEl.textContent = p.length ? p.join(', ') : 'Add guests';
  }

  function setupCnt(decId, incId, numId, key, min, max) {
    const dec = document.getElementById(decId);
    const inc = document.getElementById(incId);
    const num = document.getElementById(numId);
    if (!dec || !inc || !num) return;

    function upd(n) {
      state[key] = Math.max(min, Math.min(max, n));
      num.textContent = state[key];
      dec.disabled = state[key] <= min;
      inc.disabled = state[key] >= max;
      updateGuestsVal();
    }
    dec.addEventListener('click', (e) => {
      e.stopPropagation();
      upd(state[key] - 1);
    });
    inc.addEventListener('click', (e) => {
      e.stopPropagation();
      upd(state[key] + 1);
    });
    upd(state[key]);
  }

  setupCnt('adults-dec', 'adults-inc', 'adults-num', 'adults', 1, 10);
  setupCnt('children-dec', 'children-inc', 'children-num', 'children', 0, 10);
  setupCnt('pets-dec', 'pets-inc', 'pets-num', 'pets', 0, 5);

  if (guestsTrig) {
    guestsTrig.addEventListener('click', (e) => {
      e.stopPropagation();
      activePanel === 'guests' ? closeAll() : openPanel('guests');
    });
  }

  const searchBtn = document.getElementById('bw-search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAll();
      const t = document.getElementById('search');
      if (t) t.scrollIntoView({ behavior: 'smooth' });
    });
  }

  updateDatesVal();
  updateGuestsVal();
}
