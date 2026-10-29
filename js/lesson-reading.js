(() => {
  'use strict';
  const app = document.getElementById('app');
  const reading = document.getElementById('lesson-reading');
  const stage = document.getElementById('lesson-stage');
  const articles = [...document.querySelectorAll('[data-lesson-scene]')];
  if (!app || !reading || !stage || !articles.length) return;
  const narrow = matchMedia('(max-width:1100px)');
  const summary = document.createElement('div');
  summary.className = 'lesson-summary';
  const definition = document.createElement('p');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = 'Açıklama';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'lesson-panel');
  summary.append(definition, toggle);
  stage.before(summary);
  if (!document.body.hasAttribute('data-classic-part')) {
    const viewport = document.createElement('div');
    viewport.className = 'lesson-viewport';
    stage.before(viewport);
    viewport.append(stage);
  }
  const panel = document.createElement('aside');
  panel.id = 'lesson-panel';
  panel.className = 'lesson-panel';
  panel.hidden = true;
  panel.setAttribute('aria-labelledby', 'lesson-panel-label');
  const header = document.createElement('div');
  header.className = 'lesson-panel-header';
  const label = document.createElement('span');
  label.id = 'lesson-panel-label';
  label.textContent = 'SAHNENİN AÇIKLAMASI';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'lesson-panel-close';
  close.textContent = 'Kapat ×';
  header.append(label, close);
  panel.append(header, reading);
  const backdrop = document.createElement('div');
  backdrop.className = 'lesson-backdrop';
  backdrop.hidden = true;
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.append(backdrop, panel);
  document.body.classList.add('lesson-enhanced');
  let opened = false;
  let previous = null;
  let oldOverflow = '';
  let locked = false;
  const inertState = new Map();
  function modalState() {
    const modal = opened && narrow.matches;
    panel.setAttribute('role', modal ? 'dialog' : 'complementary');
    if (modal) panel.setAttribute('aria-modal', 'true');
    else panel.removeAttribute('aria-modal');
    backdrop.hidden = !modal;
    if (modal && !locked) {
      oldOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      for (const child of document.body.children) {
        if (child === panel || child === backdrop || child.tagName === 'SCRIPT') continue;
        inertState.set(child, child.inert);
        child.inert = true;
      }
      locked = true;
    } else if (!modal && locked) {
      document.body.style.overflow = oldOverflow;
      for (const [child, value] of inertState) child.inert = value;
      inertState.clear();
      locked = false;
    }
  }
  function setOpen(value, restore = true) {
    opened = value;
    panel.hidden = !value;
    toggle.setAttribute('aria-expanded', String(value));
    document.body.classList.toggle('lesson-explanation-open', value);
    modalState();
    if (value) close.focus({preventScroll:true});
    else if (restore) toggle.focus({preventScroll:true});
  }
  function sync() {
    const number = Number(app.dataset.scene);
    if (number === previous) return;
    const current = articles.find(article => Number(article.dataset.lessonScene) === number);
    if (!current) return;
    for (const article of articles) {
      const active = article === current;
      article.hidden = !active;
      article.inert = !active;
    }
    const text = current.querySelector('.lesson-explanation-step p')?.textContent.trim() || '';
    // Kısa tanım özgün metinden gelir; ayrıntıların tamamı panelde korunur.
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    definition.textContent = sentences.slice(0, 2).join('').trim();
    panel.scrollTop = 0;
    const viewport = app.querySelector('.lesson-viewport');
    if (viewport) viewport.scrollTop = 0;
    if (document.body.hasAttribute('data-classic-part')) {
      // Yeni sahne baştan açılır; aynı deneydeki kontroller kaydırmayı bozmaz.
      const scene = app.querySelector('.scene.active');
      const bench = document.getElementById('classicBench');
      if (scene) scene.scrollTop = 0;
      if (bench) bench.scrollTop = 0;
    }
    previous = number;
  }
  toggle.addEventListener('click', () => setOpen(!opened));
  close.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));
  narrow.addEventListener('change', modalState);
  window.addEventListener('keydown', event => {
    // Diyalog içindeki oklar sayfayı okur; arka plandaki sunumu ilerletmez.
    if (document.querySelector('dialog[open]')) {
      if ([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','Home','End','f','F'].includes(event.key)) event.stopImmediatePropagation();
      return;
    }
    if (!opened || app.classList.contains('notes-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(false);
      return;
    }
    if (narrow.matches && event.key === 'Tab') {
      const focusable = [...panel.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(el => !el.closest('[hidden],[inert]') && !el.disabled && el.tabIndex >= 0 && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    // Okurken boşluk ve ok tuşları sunumu ilerletmez.
    if (panel.contains(event.target) && [' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','Home','End','n','N','f','F'].includes(event.key)) event.stopImmediatePropagation();
  }, true);
  new MutationObserver(sync).observe(app, {attributes:true, attributeFilter:['data-scene']});
  sync();
})();
