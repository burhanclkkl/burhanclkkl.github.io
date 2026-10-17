(function () {
  'use strict';
  const config = window.SITE_CONFIG || {};
  const topics = window.SITE_TOPICS || [];
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const themeButton = document.getElementById('theme-toggle');

  function setTheme(mode, save) {
    root.dataset.theme = mode;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = mode === 'dark' ? '#17161A' : '#FAF9F7';
    if (themeButton) {
      themeButton.setAttribute('aria-label', mode === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç');
      themeButton.setAttribute('title', mode === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç');
    }
    if (save) { try { localStorage.setItem('open-notes-theme', mode); } catch (e) {} }
  }
  setTheme(root.dataset.theme || 'light', false);
  themeButton?.addEventListener('click', () => setTheme(root.dataset.theme === 'light' ? 'dark' : 'light', true));
  prefersDark.addEventListener?.('change', (event) => {
    let saved;
    try { saved = localStorage.getItem('open-notes-theme'); } catch (e) {}
    if (!saved) setTheme(event.matches ? 'dark' : 'light', false);
  });

  // Yıldızlar sabit başlangıç noktalarından itilir; sürekli çalışan bir animasyon yoktur.
  const hero = document.querySelector('.hero');
  const solar = document.querySelector('.hero-graphic');
  if (hero && solar) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const stars = [...solar.querySelectorAll('.solar-star')].map((element, index) => ({
      element,
      x: parseFloat(element.style.getPropertyValue('--x')) / 100,
      y: parseFloat(element.style.getPropertyValue('--y')) / 100,
      angle: index * 2.399963
    }));
    let pointer = null;
    let frame = 0;
    let displaced = false;
    function resetStars() {
      cancelAnimationFrame(frame);
      frame = 0;
      pointer = null;
      if (!displaced) return;
      stars.forEach(({ element }) => {
        element.style.removeProperty('--push-x');
        element.style.removeProperty('--push-y');
      });
      displaced = false;
    }
    function repelStars() {
      frame = 0;
      if (!pointer) return;
      if (reducedMotion.matches || !finePointer.matches) { resetStars(); return; }
      const rect = solar.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const width = solar.offsetWidth;
      const height = solar.offsetHeight;
      const px = (pointer.x - rect.left) * width / rect.width;
      const py = (pointer.y - rect.top) * height / rect.height;
      stars.forEach(({ element, x, y, angle }) => {
        const dx = x * width - px;
        const dy = y * height - py;
        const distance = Math.hypot(dx, dy);
        const force = Math.max(0, 1 - distance / 105) ** 2 * 42;
        const pushX = force * (distance > .1 ? dx / distance : Math.cos(angle));
        const pushY = force * (distance > .1 ? dy / distance : Math.sin(angle));
        element.style.setProperty('--push-x', `${pushX.toFixed(2)}px`);
        element.style.setProperty('--push-y', `${pushY.toFixed(2)}px`);
      });
      displaced = true;
    }
    hero.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || reducedMotion.matches || !finePointer.matches) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(repelStars);
    }, { passive: true });
    hero.addEventListener('pointerleave', resetStars);
    window.addEventListener('blur', resetStars);
    window.addEventListener('scroll', resetStars, { passive: true });
    reducedMotion.addEventListener?.('change', resetStars);
    finePointer.addEventListener?.('change', resetStars);
  }

  const search = document.getElementById('topic-search');
  const list = document.getElementById('topic-list');
  const empty = document.getElementById('topic-empty');
  const count = document.getElementById('filtered-count');
  const total = document.getElementById('total-count');
  let selectedFilter = 'all';

  function createTopic(topic) {
    const ready = topic.status === 'published' && !!topic.href;
    const outer = document.createElement(ready ? 'a' : 'div');
    outer.className = `topic-row ${topic.featured ? 'featured' : ''} ${ready ? 'ready' : 'planned'} accent-${topic.accent}`;
    if (ready) {
      outer.href = topic.href;
      outer.setAttribute('aria-label', `${topic.title}: anlatımı aç`);
    }
    const number = document.createElement('span');
    number.className = 'topic-number'; number.textContent = topic.id;
    const content = document.createElement('div'); content.className = 'topic-info';
    const label = document.createElement('div'); label.className = 'topic-type'; label.textContent = topic.categoryLabel;
    const heading = document.createElement('h3'); heading.textContent = topic.title;
    const desc = document.createElement('p'); desc.textContent = topic.description;
    content.append(label, heading, desc);
    const side = document.createElement('div'); side.className = 'topic-side';
    const badge = document.createElement('span'); badge.className = `topic-status ${ready ? 'published' : 'coming'}`;
    badge.textContent = ready ? 'İNCELE' : 'YAKINDA';
    const arrow = document.createElement('span'); arrow.className = 'topic-arrow';
    arrow.textContent = ready ? '↗' : '·'; arrow.setAttribute('aria-hidden', 'true');
    side.append(badge, arrow);
    outer.append(number, content, side);
    return outer;
  }
  function normalize(value) { return String(value).toLocaleLowerCase('tr-TR'); }
  function render() {
    if (!list) return;
    const query = normalize(search?.value || '').trim();
    const visible = topics.filter((topic) => {
      const categoryMatches = selectedFilter === 'all' || topic.category === selectedFilter;
      const termMatches = normalize(`${topic.title} ${topic.description} ${topic.categoryLabel}`).includes(query);
      return categoryMatches && termMatches;
    });
    if (!topics.length) return; // Veri betiği yüklenemezse başlangıç HTML'ini koru.
    list.replaceChildren(...visible.map(createTopic));
    if (empty) empty.hidden = visible.length !== 0;
    if (count) count.textContent = String(visible.length).padStart(2, '0');
    if (total) total.textContent = String(topics.length).padStart(2, '0');
  }
  search?.addEventListener('input', render);
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    selectedFilter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b => {
      const active = b === button;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    render();
  }));
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {
      event.preventDefault(); search?.focus();
    }
    if (event.key === 'Escape' && document.activeElement === search) { search.value = ''; render(); search.blur(); }
  });
  render();
  // Arama araçları ancak etkileşim hazır olduğunda görünür.
  const topicTools = document.querySelector('.topic-tools');
  if (list && topics.length && topicTools) topicTools.hidden = false;

  document.querySelectorAll('[data-social]').forEach(link => {
    const id = link.dataset.social;
    const url = config[id];
    const allowedDomain = id === 'github' ? 'github.com' : 'linkedin.com';
    let valid = false;
    try { const parsed = new URL(url); valid = parsed.protocol === 'https:' && (parsed.hostname === allowedDomain || parsed.hostname === `www.${allowedDomain}`) && parsed.pathname !== '/'; } catch (e) {}
    if (valid) { link.href = url; }
    else {
      link.classList.add('unconfigured');
      link.removeAttribute('href'); link.removeAttribute('target');
      link.title = 'Profil bağlantısını js/config.js dosyasına ekleyin';
      link.setAttribute('aria-disabled', 'true');
    }
  });
  document.getElementById('year')?.replaceChildren(String(new Date().getFullYear()));

  const eminem = document.getElementById('eminem-photo');
  if (eminem && config.eminemImage) {
    eminem.onerror = () => { eminem.closest('.easter-egg-photo')?.classList.add('image-missing'); };
    // Adresi config.js dosyasına göre çözmek, iç içe konu sayfalarında da doğru dosyayı bulur.
    const configScript = [...document.scripts].find(s => s.src.endsWith('/js/config.js'));
    eminem.src = configScript ? new URL(config.eminemImage, configScript.src).href : config.eminemImage;
  }

  // GoatCounter yalnızca kullanıcı site kodunu girdikten ve site yayına alındıktan sonra çalışır.
  const code = String(config.goatcounterCode || '').trim();
  const isPreview = ['localhost', '127.0.0.1', ''].includes(location.hostname) || location.protocol === 'file:';
  if (/^[a-z0-9-]+$/i.test(code) && !isPreview) {
    const script = document.createElement('script');
    script.src = 'https://gc.zgo.at/count.js';
    script.async = true;
    script.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
    document.body.append(script);
    const el = document.getElementById('visitor-count');
    // TOTAL sayacı tüm yolları birleştirir. Sunucu önbelleği nedeniyle gecikme olabilir.
    fetch(`https://${code}.goatcounter.com/counter/TOTAL.json`)
      .then(response => { if (!response.ok) throw new Error('count unavailable'); return response.json(); })
      .then(data => { if (el && typeof data.count === 'string') el.textContent = data.count; })
      .catch(() => { if (el) el.title = 'Ziyaret bilgisi şu an alınamıyor'; });
  }
}());
