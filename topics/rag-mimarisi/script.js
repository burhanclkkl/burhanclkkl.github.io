(function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const app = $('#app');
  const board = $('#knowledgeBoard');
  const notes = $('#notesDrawer');
  const notesToggle = $('#notesToggle');
  const scenes = $$('.scene');
  const TITLES = ['Soru', 'RAG nedir?', 'Bilgiyi hazırlama', 'Canlı RAG akışı', 'Kaynak kalitesi', 'İki mimari akış', 'Çıkarım'];
  const SECONDS = [20, 45, 50, 70, 60, 35, 20];
  // Ekran metni kısa tutulur; açıklamanın tamamı konuşmacı notlarında korunur.
  const SCRIPT = [
    'Bir modele, şirketimizin Atlas projesinin yedeklerini ne zaman aldığını soralım. Model bu iç belgeleri hiç görmemişse güvenilir bir cevap vermesini bekleyemeyiz. Peki onu yeniden eğitmeden ilgili bilgiyi yanıtın içine nasıl katabiliriz? RAG bu soruya bir mimari yaklaşım sunar.',
    'RAG, bilgi getirmeyle desteklenen üretim demektir. Bir kütüphanede bütün kitapları ezberlemek yerine, soruyla ilgili sayfayı bulup çalışma masamıza getirdiğimizi düşünün. Uygulama önce kaynaklarda arama yapar, seçilen parçaları kullanıcı sorusuyla birlikte modele sunar. Model bu bağlamdan yararlanarak yanıt üretir. Bu akış modelin ağırlıklarını değiştiren bir eğitim işlemi değildir. Ayrıca arama sonucunun doğru ve yeterli olduğunu kendiliğinden garanti etmez.',
    'Önce bilgi bulunabilir hâle getirilir. Bu yaygın örnekte belgeler, anlamını mümkün olduğunca koruyan parçalara ayrılır. Her parçanın embedding adı verilen sayısal temsili oluşturulur. Metin, kaynak kimliği, sürüm ve erişim bilgileriyle birlikte aranabilir bir indekste tutulur. Embedding metnin kendisi değildir; anlam benzerliğini aramada kullanabileceğimiz bir temsildir. Parçaları aşırı küçültmek gerekli bağlantıyı koparabilir. Aşırı büyütmekse ilgisiz içeriği ve bağlam maliyetini artırabilir.',
    'Şimdi aynı Atlas sorusunu adım adım izleyelim. Önce soru alınır. Ardından soru için uygun temsil ve arama yöntemiyle ilgili parçalar bulunur. Günlük saklama süresi değil, yedekleme belgesi bizim sorumuza karşılık gelir. Bu parçayı talimatlar ve soruyla birlikte bağlama ekleriz. Model, her gece saat ikide yedek alındığını söyleyebilir. Bir numaralı kaynak bağlantısı cevabın dayanağını görünür kılar; açıp metni karşılaştırabiliriz. Burada bütün metinler kurgusal, sonuçlar önceden tanımlıdır. Gerçek bir embedding ya da model çağrısı yapmıyoruz.',
    'Aynı akışın üç durumunu karşılaştıralım. Güncel ve ilgili kaynak varsa cevap desteklenebilir. Eski bir kayıt bulunursa kaynak sürümünü kontrol etmek gerekir; geçmişte doğru olan bilgi bugün geçerli olmayabilir. İlgili kaynak bulunamazsa sistem yeterli bilgi olmadığını belirtmeli veya açıklama istemelidir. Bu, RAG kurulduğunda otomatik kazanılan bir davranış değildir; talimat ve değerlendirme gerektirir. Kaynak göstermek de tek başına doğruluk kanıtı değildir: Cümle gerçekten o kaynakta destekleniyor mu diye bakmalıyız.',
    'Mimaride hazırlık ve sorgu olmak üzere iki akış vardır. Belgeler değiştikçe indeksin güncellenmesi gerekir. Her yeni soruda arama yeniden çalışır. Vektör aramada soru da belgelerle uyumlu bir embedding temsiline dönüştürülür. Vektör araması anlam yakınlığına, hibrit arama buna ek olarak anahtar kelime eşleşmelerine dayanabilir. Her RAG sistemi vektör veritabanı kullanmak zorunda değildir. Getirilen parçalar bağlam penceresini tüketir; yanıt için pay bırakılmalıdır. Kullanıcı yalnızca erişim izni olan belgelerden yararlanmalı, kalite arama ve yanıt aşamalarında ayrı değerlendirilmelidir.',
    'Akılda üç şey kalsın: İlgili bilgiyi bul, yanıtı o bilgiyle destekle, kaynağı ve belirsizliği görünür kıl. RAG, her şeyi modele yüklemek yerine doğru bilgiyi doğru anda getirme düzenidir.'
  ];
  const ACTIONS = [
    'Soruya kısa bir ara ver; sağdaki belgeyi işaret et.',
    'Arşiv ile çalışma masası arasındaki farkı aynı belge alanı üzerinden göster.',
    'Üç hazırlık adımını sırayla ilerlet; vektörlerin şematik olduğunu belirt.',
    'Dört adımı ileri ve geri dene. Yanıttaki [1] kaynağını açıp belgeyle karşılaştır.',
    'Üç kaynak durumunu seç. “Kaynak yok” durumunda kesin cevap üretilmemesini tartış.',
    'Vektör ve hibrit arama arasında geçiş yap; hazırlık ve sorgunun ayrımını göster.',
    'Üç çıkarımı oku; son sahneyi sabit bırak veya Context Window konusuna geç.'
  ];
  const PREP = [
    ['PARÇALAMA', 'Belgeler, anlamını koruyan küçük parçalara ayrılır.', 'Parça metni ve kaynak kimliği birlikte korunur.'],
    ['EMBEDDING', 'Parçalar, aramada kullanılabilen sayısal temsillere dönüştürülür.', 'Gösterilen vektörler şematiktir; gerçek embedding hesabı değildir.'],
    ['İNDEKS', 'Metin, vektör ve kaynak bilgileri aranabilir bir indekste tutulur.', 'Hazırlık tamamlandı. Güncellenen belgeler indekse de yansıtılmalı.']
  ];
  const QUALITY = {
    current: ['İlgili ve güncel kaynak, yanıtın dayanağını sağlar.', 'KAYNAKLI YANIT', 'Atlas yedekleri her gece 02.00’de alınır. [1]', 'Yanıtı kaynak metniyle karşılaştır.'],
    stale: ['Eski sürüm bugün geçerli olmayabilir; kaynağın güncelliğini doğrula.', 'GÜNCELLİK BELİRSİZ', 'Bu kayıt eski. Güncel yedekleme sıklığını doğrulayamıyorum.', 'Sürüm kontrolü gerekli; eski kayıt tek başına yeterli değil.'],
    missing: ['İlgili kaynak yoksa kesin bir yanıt vermek yerine belirsizliği belirt.', 'YETERLİ BİLGİ YOK', 'Bu kaynaklarda yedekleme saatini doğrulayacak yeterli bilgi yok.', 'İyi tasarlanan sistem, yanıt vermemeyi de seçebilir.']
  };
  let currentScene = 0;
  let prepStep = 0;
  let queryStep = 0;
  let quality = 'current';
  let searchMode = 'vector';
  let announcementFrame = 0;
  const setText = (selector, text) => { $(selector).textContent = text; };

  function announce(text) {
    cancelAnimationFrame(announcementFrame);
    setText('#announcer', '');
    announcementFrame = requestAnimationFrame(() => setText('#announcer', text));
  }
  function updateNotes() {
    setText('#notesSceneTitle', `${String(currentScene + 1).padStart(2, '0')} — ${TITLES[currentScene]}`);
    setText('#notesBody', SCRIPT[currentScene]);
    setText('#notesAction', `SUNUCU EYLEMİ: ${ACTIONS[currentScene]}`);
    setText('#notesDuration', `${SECONDS[currentScene]} SN / HEDEF`);
  }
  function updateBoard() {
    const scene = currentScene + 1;
    board.hidden = scene < 2 || scene > 5;
    board.className = 'knowledge-board';
    if (board.hidden) return;
    const querying = scene === 4;
    const comparing = scene === 5;
    const showPassage = querying && queryStep >= 2;
    const showAnswer = (querying && queryStep === 3) || comparing;
    const missing = comparing && quality === 'missing';
    const stale = comparing && quality === 'stale';
    if (scene === 3 && prepStep > 0) board.classList.add(prepStep === 1 ? 'is-embedded' : 'is-indexed');
    if (showAnswer) board.classList.add('is-answered');
    if (stale) board.classList.add('is-stale');
    if (missing) board.classList.add('is-missing');
    $$('.source-row').forEach((row, i) => {
      const selected = i === 0 && ((querying && queryStep >= 1) || (comparing && !missing));
      row.classList.toggle('is-selected', selected);
      row.querySelector('.source-badge').textContent = scene === 3 ? (prepStep === 2 ? 'İNDEKSLİ' : 'PARÇA') : selected ? 'İLGİLİ' : 'BELGE';
    });
    setText('#sourceTitle', missing ? 'İlgili kayıt bulunamadı' : stale ? 'Yedekleme / v1 · eski' : 'Yedekleme / v3');
    setText('#sourceText', missing ? 'Bu soru için erişilebilir bir dayanak yok.' : stale ? 'Eski kayıt: Atlas yedekleri pazar günleri alınır.' : 'Atlas yedekleri her gece 02.00’de alınır.');
    setText('#corpusLabel', scene === 3 ? (prepStep === 2 ? 'ARANABİLİR İNDEKS' : 'BELGE PARÇALARI') : 'ÖRNEK ARŞİV');
    setText('#corpusCaption', scene === 3 ? PREP[prepStep][2] : 'Yalnızca ilgili parçalar seçilir.');
    $('#retrievedPassage').hidden = !showPassage;
    $('#packetPlaceholder').hidden = showPassage || showAnswer;
    $('#answerBlock').hidden = !showAnswer;
    $('#evidence').hidden = missing;
    setText('#answerLabel', comparing ? QUALITY[quality][1] : 'KAYNAKLI YANIT');
    setText('#answerText', comparing ? QUALITY[quality][2] : 'Atlas yedekleri her gece 02.00’de alınır. [1]');
    setText('#evidenceText', stale ? 'Kurgusal Atlas ekip notları · Yedekleme / v1 (eski). Kaynak metni: “Atlas yedekleri pazar günleri alınır.” Güncel kayıt olduğu doğrulanmamıştır.' : 'Kurgusal Atlas ekip notları · Yedekleme / v3. Kaynak metni: “Atlas yedekleri her gece 02.00’de alınır.”');
    let phase = 'KAYNAK → YANIT';
    let status = 'BUL → BAĞLAMA EKLE → YANITLA';
    if (scene === 3) { phase = PREP[prepStep][0]; status = PREP[prepStep][2]; }
    if (querying) {
      phase = ['SORU ALINDI', 'İLGİLİ PARÇA BULUNDU', 'BAĞLAM HAZIR', 'YANIT OLUŞTU'][queryStep];
      status = ['Atlas yedekleri ne zaman alınır? → Arama bekleniyor.', 'Yedekleme belgesi seçildi. Benzerlik, tek başına doğruluk değildir.', 'Seçilen parça, talimat ve soruyla birlikte modele sunulur.', 'Yanıt hazır. [1] bağlantısını açıp kaynağı kontrol et.'][queryStep];
    }
    if (comparing) { phase = { current: 'GÜNCEL KAYNAK', stale: 'ESKİ KAYIT', missing: 'KAYNAK BULUNAMADI' }[quality]; status = QUALITY[quality][3]; }
    setText('#boardPhase', phase);
    setText('#boardStatus', status);
  }
  function render() {
    const number = currentScene + 1;
    app.dataset.scene = String(number);
    scenes.forEach((scene, i) => {
      const active = i === currentScene;
      scene.hidden = !active;
      scene.inert = !active;
      scene.classList.toggle('active', active);
    });
    setText('#currentSceneCount', String(number).padStart(2, '0'));
    $('#progressLine').style.width = `${number / scenes.length * 100}%`;
    $('#prevButton').disabled = currentScene === 0;
    $('#nextButton').disabled = currentScene === scenes.length - 1;
    $$('[data-prep]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.prep) === prepStep)));
    $$('[data-query]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.query) === queryStep)));
    $$('[data-quality]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.quality === quality)));
    $$('[data-search]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.search === searchMode)));
    setText('#prepExplanation', PREP[prepStep][1]);
    setText('#qualityExplanation', QUALITY[quality][0]);
    setText('#searchMethod', searchMode === 'vector' ? 'Vektör arama' : 'Hibrit arama');
    setText('#searchExplanation', searchMode === 'vector' ? 'Anlam yakınlığıyla ilgili parçaları ara.' : 'Anlam yakınlığını anahtar kelime eşleşmeleriyle birleştir.');
    updateBoard();
    updateNotes();
    const hash = `#${String(number).padStart(2, '0')}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }
  function navigate(direction) {
    $('#evidence').open = false;
    if (currentScene === 2 && ((direction > 0 && prepStep < 2) || (direction < 0 && prepStep > 0))) prepStep += direction;
    else if (currentScene === 3 && ((direction > 0 && queryStep < 3) || (direction < 0 && queryStep > 0))) queryStep += direction;
    else currentScene = Math.max(0, Math.min(scenes.length - 1, currentScene + direction));
    render();
    announce(`${currentScene + 1} / 7, ${TITLES[currentScene]}. ${!board.hidden ? $('#boardStatus').textContent : ''}`);
  }
  function directScene(index) {
    currentScene = index;
    $('#evidence').open = false;
    render();
    announce(`${index + 1} / 7, ${TITLES[index]}`);
  }
  function closeNotes() { if (notes.open) notes.close(); }
  notesToggle.addEventListener('click', () => {
    if (notes.open) closeNotes();
    else { updateNotes(); notes.showModal(); notesToggle.setAttribute('aria-expanded', 'true'); }
  });
  $('#notesClose').addEventListener('click', closeNotes);
  notes.addEventListener('close', () => { notesToggle.setAttribute('aria-expanded', 'false'); notesToggle.focus(); });
  notes.addEventListener('click', event => {
    const box = notes.getBoundingClientRect();
    if (event.target === notes && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) closeNotes();
  });
  $('#prevButton').addEventListener('click', () => navigate(-1));
  $('#nextButton').addEventListener('click', () => navigate(1));
  $$('[data-prep]').forEach(button => button.addEventListener('click', () => { prepStep = Number(button.dataset.prep); render(); }));
  $$('[data-query]').forEach(button => button.addEventListener('click', () => { queryStep = Number(button.dataset.query); $('#evidence').open = false; render(); }));
  $$('[data-quality]').forEach(button => button.addEventListener('click', () => { quality = button.dataset.quality; $('#evidence').open = false; render(); }));
  $$('[data-search]').forEach(button => button.addEventListener('click', () => { searchMode = button.dataset.search; render(); announce($('#searchExplanation').textContent); }));
  $('#resetQuery').addEventListener('click', () => { queryStep = 0; $('#evidence').open = false; render(); announce('RAG akışı başlangıca döndü.'); });
  $('#replayPresentation').addEventListener('click', () => { prepStep = 0; queryStep = 0; quality = 'current'; searchMode = 'vector'; directScene(0); $('#nextButton').focus(); });
  $('#fullscreenToggle').addEventListener('click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { announce('Tam ekran açılamadı. Sunum normal görünümde kullanılabilir.'); }
  });
  window.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
    const publication = $('#publicationDetails');
    if (publication.open) {
      if (event.key === 'Escape') { event.preventDefault(); publication.open = false; publication.querySelector('summary').focus(); }
      return;
    }
    if (event.key === 'Escape' && notes.open) { event.preventDefault(); closeNotes(); return; }
    const element = document.activeElement;
    if (element?.matches('input, textarea, select, summary, [contenteditable="true"]')) return;
    const key = event.key.toLowerCase();
    if (key === 'n') { event.preventDefault(); if (notes.open) closeNotes(); else notesToggle.click(); return; }
    if (key === 'f' && !notes.open) { event.preventDefault(); $('#fullscreenToggle').click(); return; }
    if (key === 'home' || key === 'end') { event.preventDefault(); directScene(key === 'home' ? 0 : scenes.length - 1); return; }
    if (event.code === 'Space' && element?.matches('button, a')) return;
    if (['ArrowRight', 'PageDown'].includes(event.key) || event.code === 'Space') { event.preventDefault(); navigate(1); }
    if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); navigate(-1); }
  });
  const fragment = location.hash.match(/^#0?([1-7])$/);
  if (fragment) currentScene = Number(fragment[1]) - 1;
  render();
}());
