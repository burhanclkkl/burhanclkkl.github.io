'use strict';

// Context Window — 7 scenes / 5 minutes.
// No framework, build step, backend, analytics, external images or personal data.
const LIMIT = 32768;
const DEMO_VALUES = [2500, 8000, 18000, 12000];
const DEMO_TOTALS = [2500, 10500, 28500, 40500];
const TITLES = ['Soru', 'Tanım', 'İçerik', 'Canlı simülasyon', 'Sınırın sonucu', 'GPU belleği', 'Kapanış'];
const SECONDS = [20, 45, 50, 70, 60, 35, 20];
const SCRIPT = [
  'Size basit bir soru: Yapay zekâ az önce yazdıklarımızı kullanabiliyor, peki yüz mesaj önce söylediklerimizi de her zaman görebiliyor mu? Her zaman değil. Bunun nedeni mutlaka bir “unutma” sorunu değil. Modelin her cevapta kullanabildiği bilgi alanının bir sınırı var.',
  'Bu sınırlı alanın adı Context Window, yani bağlam penceresi. Bunu bir çalışma masası gibi düşünün: Önünüze ne kadar çok belge koyarsanız, masada o kadar az boşluk kalır. Yapay zekâ da bir cevap oluştururken önüne verilen bilgileri bu sınır içinde işler. Ekrandaki 32K yalnızca bir örnek kapasite. Burada ölçü birimimiz token: Bir kelime tek token olabileceği gibi birkaç tokena da ayrılabilir. Ve önemli bir ayrım var: Bu pencere modelin öğrendiği her şey veya kalıcı hafızası değildir; o an erişebildiği çalışma alanıdır.',
  'Peki bu alanı ne dolduruyor? Yalnızca sizin yazdığınız son soru değil. Sistemin talimatları, önceki konuşmalar, RAG üzerinden gelen doküman parçaları ve araçların döndürdüğü sonuçlar da bu alanın içinde yer alabilir. Örneğin tek cümlelik bir soru sorarsınız ama uygulama arka planda uzun bir yönetmelik ve eski mesajları modele gönderir. Ekranda kısa bir soru görseniz de modelin önündeki metin çok daha uzun olabilir. Üstelik yeni soruya ve üretilen cevaba da uygun kapasite ayırmamız gerekir.',
  'Şimdi 32.768 tokenlık temsili bir pencereyi dolduralım. Başlangıçta 2.500 token kullanılıyor. Konuşma geçmişini ekleyince 10.500’e çıkıyoruz. RAG dokümanlarını eklediğimizde 28.500’e ulaşıyoruz; artık cevap için fazla alanımız kalmadı. Son olarak agent çıktıları eklenirse toplam 40.500 token oluyor. Yani sınırı 7.732 token aşıyoruz. Buradaki sayılar örnek, ancak problem gerçek: İçeriği seçmeden her şeyi göndermek, modelin işleyebileceği bağlamı aşabilir. Kullanıcının sorusu kısa olsa da bunun yaşanabileceğini görüyoruz.',
  'Peki pencere dolduğunda ne olur? Tek bir cevap yok; bu, modeli kullanan uygulamanın davranışına bağlı. Bir uygulama eski mesajların bir kısmını bağlamdan çıkarabilir. Bir başkası uzun konuşmayı özetleyerek yer açabilir; fakat bu sırada bazı ayrıntılar kaybolabilir. Bazı sistemler ise sınırı aşan isteği doğrudan reddedebilir. Burada önemli olan şu: Context Window doldu diye modelin eğitildiği bütün bilgileri kaybettiğini düşünmeyin. Sadece o isteğe sunulan çalışma alanının sınırına ulaşıyoruz. İyi tasarlanan sistemler hangi bilgiyi tutacağını akıllıca seçer.',
  'Bu sınırın bir de donanım tarafı var. Modelin ağırlıkları bellek kullanır; ayrıca işlenen tokenlara ilişkin ara verileri tutan KV Cache gibi yapılar da bellek tüketir. Çoğu klasik attention mimarisinde daha uzun bağlam daha fazla cache ihtiyacı doğurabilir. Ancak bunu her model için sabit bir gigabayt hesabına çeviremeyiz: Mimari, veri türü ve sunucu ayarları sonucu değiştirir. Yani daha geniş pencere tasarlarken yalnızca token sayısını değil, bellek maliyetini de düşünürüz.',
  'Üç şeyi hatırlayın: Birincisi, Context Window sınırlıdır. İkincisi, modele gönderdiğimiz her ek bilgi bu alanı kullanabilir. Üçüncüsü, önemli olan her zaman en geniş pencere değildir; doğru bilgiyi doğru zamanda önüne koyabilmektir. Kısacası mesele sadece kapasite değil, bağlamı iyi yönetmektir.'
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const format = value => Math.round(value).toLocaleString('tr-TR');
const app = $('#app');
const board = $('#contextBoard');
const boardRows = $$('.board-row');
const segmentElements = [0,1,2,3].map(i => $(`#segment${i}`));
const notesDrawer = $('#notesDrawer');
const notesToggle = $('#notesToggle');
const visualMotionReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

let currentScene = 0; // 0..6
let sourcesStep = 0;  // 0..3
let simulationStep = 0; // 0..3
let strategy = null;
let gpuLong = false;
let notesOpen = false;
let lastFocus = null;
let animationHandle = 0;
let displayedCount = DEMO_TOTALS[0];

// Different per-row shapes, not randomized: consistent even on backward navigation.
const tokenCounts = [13, 19, 24, 16];
boardRows.forEach((row, index) => {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < tokenCounts[index]; i++) {
    const token = document.createElement('i');
    token.className = 'token';
    if (i % 7 === 5) token.style.opacity = '.7';
    fragment.appendChild(token);
  }
  $('.tokens', row).appendChild(fragment);
});

function announce(message) {
  $('#announcer').textContent = '';
  requestAnimationFrame(() => { $('#announcer').textContent = message; });
}

function animateCounter(target) {
  cancelAnimationFrame(animationHandle);
  const counter = $('#bigTokenCount');
  const from = displayedCount;
  const reduce = visualMotionReduced.matches;
  const startedAt = performance.now();
  const duration = reduce ? 1 : 570;
  function paint(now) {
    const t = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    displayedCount = from + (target - from) * eased;
    counter.textContent = format(displayedCount);
    if (t < 1) animationHandle = requestAnimationFrame(paint);
    else { displayedCount = target; counter.textContent = format(target); }
  }
  animationHandle = requestAnimationFrame(paint);
}

function setSegments(amounts, { overflow = false, visualOnly = false } = {}) {
  let used = 0;
  const planned = amounts.map(amount => {
    const inside = Math.max(0, Math.min(amount, LIMIT - used));
    const left = Math.min(used, LIMIT) / LIMIT * 100;
    used += amount;
    return { left, width: inside / LIMIT * 100 };
  });
  planned.forEach(({left,width},index) => {
    segmentElements[index].style.left = left.toFixed(3) + '%';
    segmentElements[index].style.width = width.toFixed(3) + '%';
  });
  board.classList.toggle('is-overflow', overflow);
  $('#boardMeter').setAttribute('aria-valuenow', String(Math.min(LIMIT, Math.round(used))));
  $('#boardMeter').setAttribute('aria-valuetext', visualOnly ? 'Temsili düzenlenmiş bağlam' : `${format(used)} token kullanılıyor; kapasite ${format(LIMIT)}`);
}

function drawBoard() {
  board.classList.remove('is-remove','is-summarize','is-reject');
  boardRows.forEach(row => row.classList.remove('is-removed','is-summarized'));
  $('#boardDecision').setAttribute('aria-hidden','true');
  const scene = currentScene + 1;
  if (scene < 2 || scene > 5) return;

  let amounts;
  let visibleRows;
  let label;
  let status;
  let state;
  let overflow = false;
  let visualOnly = false;

  if (scene === 2) {
    amounts = [2500,0,0,0]; visibleRows = 1;
    label = '2.500 / 32.768';status = 'ALAN KULLANIMDA';state = '07,6%';
  } else if (scene === 3) {
    // Relative illustrations, not measured token quantities; no invented counts displayed.
    const visualAmounts = [
      [4000,0,0,0],
      [4000,6500,0,0],
      [4000,6500,9000,0],
      [4000,6500,9000,7000]
    ];
    amounts = visualAmounts[sourcesStep];
    visibleRows = sourcesStep + 1;
    label = 'TEMSİLİ DOLUM';status = 'ORTAK ÇALIŞMA ALANI';state = `${sourcesStep+1} / 4 KAYNAK`;
    visualOnly = true;
  } else if (scene === 4) {
    amounts = DEMO_VALUES.map((value,index) => index <= simulationStep ? value : 0);
    visibleRows = simulationStep + 1;
    const sum = DEMO_TOTALS[simulationStep];
    label = `${format(sum)} / ${format(LIMIT)}`;
    overflow = sum > LIMIT;
    status = overflow ? 'KAPASİTE AŞILDI' : sum > LIMIT * .8 ? 'SINIRA YAKLAŞIYOR' : 'KAPASİTE UYGUN';
    state = overflow ? `+${format(sum-LIMIT)} TOKEN` : `${(sum/LIMIT*100).toFixed(1).replace('.',',')}%`;
  } else {
    visibleRows = 4;
    visualOnly = !!strategy && strategy !== 'reject';
    if (strategy === 'remove') {
      // Qualitative illustration of trimming; values are not advertised as measurements.
      amounts = [0,6000,13000,7000];
      label = 'TEMSİLİ DÜZENLEME';status = 'ESKİ İÇERİK ÇIKARILDI';state = 'YER AÇILDI';
      board.classList.add('is-remove');
      boardRows[0].classList.add('is-removed');
    } else if (strategy === 'summarize') {
      amounts = [2500,4000,8500,7000];
      label = 'TEMSİLİ ÖZETLEME';status = 'BAĞLAM KISALTILDI';state = 'AYRINTI AZALABİLİR';
      board.classList.add('is-summarize');
      boardRows[1].classList.add('is-summarized');
      boardRows[2].classList.add('is-summarized');
    } else {
      amounts = DEMO_VALUES;
      label = '40.500 / 32.768';status = 'KAPASİTE AŞILDI';state = '+7.732 TOKEN';
      overflow = true;
      if (strategy === 'reject') {
        board.classList.add('is-reject');
        $('#decisionIcon').textContent = '×';
        $('#decisionText').textContent = 'İSTEK REDDEDİLDİ';
        $('#decisionHelp').textContent = 'Bağlam limiti aşıldı.';
        $('#boardDecision').setAttribute('aria-hidden','false');
      }
    }
  }

  boardRows.forEach((row,index) => row.classList.toggle('is-visible',index < visibleRows));
  $('#boardMeterLabel').textContent = label;
  $('#boardStatus').textContent = status;
  $('#boardState').textContent = state;
  setSegments(amounts,{overflow,visualOnly});
}

function updateSimulation() {
  const sum = DEMO_TOTALS[simulationStep];
  animateCounter(sum);
  const over = sum > LIMIT;
  const remaining = $('#tokenRemaining');
  $('#bigTokenCount').classList.toggle('is-overflow',over);
  remaining.classList.toggle('is-overflow',over);
  remaining.textContent = over ? `SINIR AŞILDI. +${format(sum-LIMIT)} TOKEN` : `${format(LIMIT-sum)} TOKEN BOŞ`;
  $$('.step-item').forEach((button, index) => {
    button.classList.toggle('is-active',index === simulationStep);
    button.classList.toggle('is-done',index < simulationStep);
    button.setAttribute('aria-pressed',String(index === simulationStep));
  });
  $('#advanceSimulation').innerHTML = simulationStep === 3
    ? 'YENİDEN BAŞLAT <span>↺</span>'
    : 'SONRAKİ ADIM <span>↗</span>';
}

const descriptions = {
  remove: 'Eski mesajların bir kısmı bağlamdan çıkarılır. Hangi kısmın çıkarılacağı bu görselde temsilidir.',
  summarize: 'Uzun bilgi daha kısa bir özetle değiştirilir; bazı ayrıntılar kaybolabilir.',
  reject: 'Sistem, sınırı aşan isteği hata ile durdurur. Her uygulama bu yolu seçmez.'
};
function setStrategy(next) {
  strategy = next;
  $$('.strategy-button').forEach(button => {
    const selected = button.dataset.strategy === next;
    button.classList.toggle('is-active',selected);
    button.setAttribute('aria-pressed',String(selected));
  });
  $('#strategyDescription').textContent = descriptions[next] || 'Bir seçenek seçin ve aynı bağlam alanının nasıl değiştiğini görün.';
  drawBoard();
  announce(`Strateji: ${next === 'remove' ? 'Eski içeriği çıkar' : next === 'summarize' ? 'Özetle' : 'İsteği reddet'}`);
}

function setGpu(isLong) {
  gpuLong = isLong;
  $('#memoryCache').classList.toggle('is-large',gpuLong);
  $('#gpu8k').classList.toggle('is-selected',!gpuLong);
  $('#gpu32k').classList.toggle('is-selected',gpuLong);
  $('#gpu8k').setAttribute('aria-pressed',String(!gpuLong));
  $('#gpu32k').setAttribute('aria-pressed',String(gpuLong));
}

function updateNotes() {
  $('#notesSceneTitle').textContent = `${String(currentScene+1).padStart(2,'0')} — ${TITLES[currentScene]}`;
  $('#notesBody').textContent = SCRIPT[currentScene];
  $('#notesDuration').textContent = `${SECONDS[currentScene]} SN / HEDEF`;
}
function showNotes(open) {
  if (open === notesOpen) return;
  notesOpen = open;
  if (open) lastFocus = document.activeElement;
  app.classList.toggle('notes-open',open);
  notesToggle.setAttribute('aria-expanded',String(open));
  notesToggle.setAttribute('aria-label',open ? 'Konuşmacı notlarını kapat (N)' : 'Konuşmacı notlarını aç (N)');
  notesDrawer.setAttribute('aria-hidden',String(!open));
  notesDrawer.inert = !open;
  updateNotes();
  if (open) $('#notesClose').focus();
  else if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
}

function render() {
  const sceneNumber = currentScene + 1;
  app.dataset.scene = String(sceneNumber);
  $$('.scene').forEach((section,index) => {
    const active = index === currentScene;
    section.hidden = !active;
    section.classList.toggle('active',active);
    section.setAttribute('aria-hidden',String(!active));
  });
  $('#currentSceneCount').textContent = String(sceneNumber).padStart(2,'0');
  $('#progressLine').style.width = `${sceneNumber / 7 * 100}%`;
  $('#prevButton').disabled = currentScene === 0;
  $('#nextButton').disabled = currentScene === 6;
  $$('.source-entry').forEach((item,index) => item.classList.toggle('is-filled',index <= sourcesStep));
  $('#sourcesAdded').textContent = `${String(sourcesStep+1).padStart(2,'0')} / 04`;
  updateSimulation();
  drawBoard();
  setGpu(gpuLong);
  updateNotes();
  // Direct URL to a scene works on static hosting without a router or network.
  const hash = `#${sceneNumber.toString().padStart(2,'0')}`;
  if (window.location.hash !== hash) history.replaceState(null,'',hash);
}

function navigate(direction) {
  if (direction > 0) {
    if (currentScene === 2 && sourcesStep < 3) { sourcesStep++; render(); announce(`Kaynak eklendi: ${$('.source-entry.is-filled:last-of-type')?.textContent || 'Yeni kaynak'}`); return; }
    if (currentScene === 3 && simulationStep < 3) { simulationStep++; render(); announce(`${format(DEMO_TOTALS[simulationStep])} token kullanılıyor.`); return; }
    if (currentScene >= 6) return;
    currentScene++;
  } else {
    if (currentScene === 2 && sourcesStep > 0) { sourcesStep--; render(); return; }
    if (currentScene === 3 && simulationStep > 0) { simulationStep--; render(); return; }
    if (currentScene <= 0) return;
    currentScene--;
  }
  render();
  announce(`${sceneNumber()} / 07, ${TITLES[currentScene]} sahnesi`);
}
function sceneNumber() { return String(currentScene + 1).padStart(2,'0'); }
function directScene(scene) {
  currentScene = Math.max(0,Math.min(6,scene));
  render();
  announce(`${sceneNumber()} / 07, ${TITLES[currentScene]} sahnesi`);
}
function restart() {
  sourcesStep = 0;
  simulationStep = 0;
  strategy = null;
  displayedCount = DEMO_TOTALS[0];
  setGpu(false);
  $$('.strategy-button').forEach(button => {button.classList.remove('is-active');button.setAttribute('aria-pressed','false');});
  $('#strategyDescription').textContent = 'Bir seçenek seçin ve aynı bağlam alanının nasıl değiştiğini görün.';
  directScene(0);
}

$('#prevButton').addEventListener('click',() => navigate(-1));
$('#nextButton').addEventListener('click',() => navigate(1));
$$('.step-item').forEach(button => button.addEventListener('click',() => {
  simulationStep = Number(button.dataset.step);
  render();
  announce(`${format(DEMO_TOTALS[simulationStep])} token kullanılıyor.`);
}));
$('#advanceSimulation').addEventListener('click',() => {
  simulationStep = (simulationStep + 1) % 4;
  render();
  announce(`${format(DEMO_TOTALS[simulationStep])} token kullanılıyor.`);
});
$('#resetSimulation').addEventListener('click',() => {
  simulationStep = 0;
  render();
  announce('Simülasyon baştan başladı.');
});
$$('.strategy-button').forEach(button => button.addEventListener('click',() => setStrategy(button.dataset.strategy)));
$('#gpu8k').addEventListener('click',() => setGpu(false));
$('#gpu32k').addEventListener('click',() => setGpu(true));
$('#replayPresentation').addEventListener('click',restart);
notesToggle.addEventListener('click',() => showNotes(!notesOpen));
$('#notesClose').addEventListener('click',() => showNotes(false));
$('#drawerShade').addEventListener('click',() => showNotes(false));
$('#fullscreenToggle').addEventListener('click',async() => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch (_) { announce('Bu tarayıcıda tam ekran kullanılamıyor.'); }
});

window.addEventListener('keydown',event => {
  if ($('#contextExperiment').open) return;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const publication = $('#publicationDetails');
  if (publication?.open) {
    if (event.key === 'Escape') { publication.open = false; publication.querySelector('summary').focus(); }
    return;
  }
  const tag = document.activeElement?.tagName || '';
  if (['INPUT','TEXTAREA','SELECT','SUMMARY'].includes(tag)) return;
  if (['BUTTON','A'].includes(tag) && event.code === 'Space') return;
  if (event.key === 'Escape') { if (notesOpen) showNotes(false); return; }
  const key = event.key.toLowerCase();
  if (key === 'n') {event.preventDefault();showNotes(!notesOpen);return;}
  if (key === 'f') {event.preventDefault();$('#fullscreenToggle').click();return;}
  if (key === 'home') {event.preventDefault();directScene(0);return;}
  if (key === 'end') {event.preventDefault();directScene(6);return;}
  if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.code === 'Space') {
    event.preventDefault();navigate(1);
  } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault();navigate(-1);
  }
}, { capture: true });

// Accept linkable scenes such as index.html#04. Ignore unrelated anchors.
const fragment = window.location.hash.match(/^#0?([1-7])$/);
if (fragment) currentScene = Number(fragment[1]) - 1;
render();


// Bağımsız deney, kanonik sunumun limitini veya adımlarını değiştirmez.
const experiment = $('#contextExperiment');
const experimentCapacity = $('#experimentCapacity');
const experimentLength = $('#experimentLength');
const experimentRange = $('#experimentLengthRange');
const EXPERIMENT_BASE = 2500;
let experimentMessages = 3;
let experimentTokens = 2000;
function renderExperiment() {
  const capacity = Number(experimentCapacity.value);
  const used = EXPERIMENT_BASE + experimentMessages * experimentTokens;
  const remaining = Math.max(0, capacity - used);
  const overflow = Math.max(0, used - capacity);
  const baseWidth = Math.min(EXPERIMENT_BASE, capacity) / capacity * 100;
  const messageWidth = Math.min(experimentMessages * experimentTokens, Math.max(0, capacity - EXPERIMENT_BASE)) / capacity * 100;
  $('#experimentMessageCount').textContent = String(experimentMessages);
  $('#experimentUsed').textContent = format(used);
  $('#experimentRemaining').textContent = format(remaining);
  $('#experimentOverflow').textContent = format(overflow);
  $('#experimentBaseFill').style.width = `${baseWidth}%`;
  $('#experimentMessageFill').style.width = `${messageWidth}%`;
  $('#experimentMeter').setAttribute('aria-valuemax', String(capacity));
  $('#experimentMeter').setAttribute('aria-valuenow', String(Math.min(used, capacity)));
  $('#experimentMeter').setAttribute('aria-valuetext', `${format(used)} token kullanılıyor; kapasite ${format(capacity)}, kalan ${format(remaining)}, aşım ${format(overflow)} token.`);
  $('#experimentCalculation').textContent = `${format(EXPERIMENT_BASE)} başlangıç + ${experimentMessages} × ${format(experimentTokens)} mesaj = ${format(used)} token`;
  experiment.classList.toggle('is-overflow', overflow > 0);
  $('#experimentStatus').textContent = overflow > 0 ? `Sınır aşıldı: ${format(overflow)} token kapasitenin dışında.` : remaining === 0 ? 'Pencere tam dolu. Yeni mesaj kapasiteyi aşacak.' : `Kapasite uygun. ${format(remaining)} token boş alan var.`;
  $('#removeExperimentMessage').disabled = experimentMessages === 0;
  $('#addExperimentMessage').disabled = experimentMessages >= 1000;
}
function updateExperimentLength(value, commit = false) {
  // Boş veya geçersiz ara girişler mevcut hesabı bozmaz.
  if (value === '' || !Number.isFinite(Number(value))) {
    if (commit) experimentLength.value = String(experimentTokens);
    return;
  }
  experimentTokens = Math.min(32768, Math.max(1, Math.round(Number(value))));
  experimentLength.value = String(experimentTokens);
  experimentRange.value = String(experimentTokens);
  renderExperiment();
}
$('#openExperiment').addEventListener('click', () => { renderExperiment(); experiment.showModal(); });
experimentCapacity.addEventListener('change', renderExperiment);
experimentLength.addEventListener('input', () => updateExperimentLength(experimentLength.value));
experimentLength.addEventListener('change', () => updateExperimentLength(experimentLength.value, true));
experimentRange.addEventListener('input', () => updateExperimentLength(experimentRange.value));
$('#addExperimentMessage').addEventListener('click', () => { experimentMessages = Math.min(1000, experimentMessages + 1); renderExperiment(); });
$('#removeExperimentMessage').addEventListener('click', () => { experimentMessages = Math.max(0, experimentMessages - 1); renderExperiment(); });
$('#clearExperimentMessages').addEventListener('click', () => { experimentMessages = 0; renderExperiment(); });
$('#returnOriginalExample').addEventListener('click', () => experiment.close());
$('#closeExperiment').addEventListener('click', () => experiment.close());
