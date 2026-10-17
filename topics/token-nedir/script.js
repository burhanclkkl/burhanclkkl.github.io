(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const notes = [
    ['Bir soru',20,'Bir kelime her zaman bir token mıdır? Kitaplarımızdan sözcüğünü düşünelim. Biz bunu tek kelime olarak okuruz; bir tokenizer ise birkaç parçaya ayırabilir. Başka bir sözlük aynı kelimeyi tek parçada temsil edebilir. Bugün bu farkı görünür hale getireceğiz. Amacımız belirli bir modelin sayılarını ezberlemek değil, modelle konuşurken metnin hangi birimlerle işlendiğini anlamak.','Kelimeyi göster; parça sayısının sözlüğe bağlı olduğunu vurgula.'],
    ['Bir yapı taşı',45,'Token, metni işlerken kullanılan ve sözlükte bir kimliği bulunan parçadır. Yapı taşları benzetmesi burada işe yarar: aynı yapıyı büyük ya da küçük taşlarla kurabiliriz. Bir token tam bir kelime, kelimenin bir bölümü, noktalama işareti veya byte dizisi olabilir. Token kimliği, parçanın sözlükteki numarasıdır. Büyük bir kimlik daha önemli bir anlam taşımaz; yalnızca farklı bir kaydı gösterir.','Sağdaki metin, parçalar ve sayaçları birlikte göster.'],
    ['Metinden sayıya',50,'Tokenizer önce kendi sözlüğü ve kurallarıyla metni parçalara ayırır, ardından bu parçalara karşılık gelen kimlikleri verir. Model tarafında kimliklerden sayısal temsiller elde edilir. Burada kullandığımız BPE örneği byte düzeyinden başlar ve belirlenmiş sıradaki birleştirmeleri uygular. Bu kuralları sunum için biz hazırladık; gerçek bir modelin eğitiminden gelmiyorlar. Bir token tek başına okunabilir bir harf bile olmayabilir. Birleştirilen byte dizisi yeniden metne çevrilebilir.','Ok tuşuyla metin → parçalar → kimlikler adımlarını ilerlet.'],
    ['Kendin dene',70,'Şimdi kısa bir cümle yazalım. Boşlukları ve noktalama işaretlerini de inceleyelim; bunlar da temsilin bir parçası. Ekli sözcük örneğinde kelime sayısı ile token sayısını karşılaştıralım. Emoji seçince tek görünen karakterin birkaç byte tokenına ayrılabildiğini görüyoruz. Bu, her modelin emojileri aynı şekilde böldüğü anlamına gelmez. Deney küçük, öğretici bir sözlük kullanıyor ve metni yalnızca bu sayfada işliyor. Gerçek bir servis için kesin sayıyı o modelin tokenizerından almalıyız.','Cümle, ekli sözcük ve emoji örneklerini dene; kimlikleri aç.'],
    ['Sözlük farkı',60,'Metni sabit tutup yalnızca sözlüğü değiştirelim. A sözlüğü bu kelimeyi üç parçayla, B sözlüğü tek parçayla temsil ediyor. Kelime aynı, görünen karakterler aynı; token sayısı farklı. Demek ki bütün diller ve modeller için geçerli sabit bir kelime dönüşümü kullanamayız. Dil, büyük küçük harf, boşluklar ve sözlüğün kapsadığı parçalar sonucu etkileyebilir. Daha az token da tek başına daha iyi bir model anlamına gelmez.','A ve B arasında geçiş yap; değişmeyen metni işaret et.'],
    ['Bağlama bağla',35,'Token sayısı yalnızca sorumuz için önemli değil. Talimatlar, sohbet geçmişi, eklenen belgeler ve üretilecek yanıt da planladığımız alanı etkiler. Bu şema yirmi tokenlık temsili bir alan gösteriyor. Yanıta daha fazla pay ayırınca toplam bütçe sınırı aşabiliyor. Burada cevap üretmiyoruz, yalnızca yer ayırıyoruz. Gerçek girdi ve çıktı sınırları modele göre değişir; ücret hesabında da kullanılan modelin sayacı ve geçerli tarifesi dikkate alınır.','Uzun yanıt payını seç ve aşımı göster.'],
    ['Aklında kalsın',20,'Üç fikirle bitirelim: token kelimeyle aynı şey değildir; parçalama kullanılan sözlüğe bağlıdır; bağlamı planlarken gerçek modelin token sayısı gerekir. Bu küçük deney, mekanizmayı görmek içindi. Şimdi Context Window anlatımına geçerek bu parçaların sınırlı bir bağlam alanını nasıl doldurduğunu inceleyebiliriz.','Özeti oku; ilgili sunum bağlantısını göster.']
  ];
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8', { fatal:true });
  function encode(text, vocabulary) {
    let tokens = Array.from(encoder.encode(text), byte => vocabulary.tokens[byte]);
    while (tokens.length > 1) {
      let best;
      for (let i=0;i<tokens.length-1;i++) {
        const rule=vocabulary.rules.get(`${tokens[i].id}:${tokens[i+1].id}`);
        if (rule && (!best || rule.rank<best.rank)) best=rule;
      }
      if (!best) break;
      const result=[];
      for (let i=0;i<tokens.length;i++) {
        const rule=i+1<tokens.length ? vocabulary.rules.get(`${tokens[i].id}:${tokens[i+1].id}`) : null;
        if (rule===best) { result.push(rule.token); i++; } else result.push(tokens[i]);
      }
      tokens=result;
    }
    return tokens;
  }
  function addPiece(vocabulary, text) {
    const parts=encode(text,vocabulary);
    let left=parts[0];
    for (const right of parts.slice(1)) {
      const key=`${left.id}:${right.id}`;
      if (!vocabulary.rules.has(key)) {
        const token={id:vocabulary.tokens.length,bytes:[...left.bytes,...right.bytes]};
        vocabulary.tokens.push(token);
        vocabulary.rules.set(key,{rank:vocabulary.rules.size,token});
      }
      left=vocabulary.rules.get(key).token;
    }
  }
  const vocabularyA={tokens:Array.from({length:256},(_,byte)=>({id:byte,bytes:[byte]})),rules:new Map()};
  ['Merhaba',' dünya','Kitap','larımız','dan','Token','token',' bir',' örnek'].forEach(piece=>addPiece(vocabularyA,piece));
  const vocabularyB={tokens:[...vocabularyA.tokens],rules:new Map(vocabularyA.rules)};
  addPiece(vocabularyB,'Kitaplarımızdan');
  const graphemes=typeof Intl.Segmenter==='function' ? new Intl.Segmenter('tr',{granularity:'grapheme'}) : null;
  const words=typeof Intl.Segmenter==='function' ? new Intl.Segmenter('tr',{granularity:'word'}) : null;
  let scene=Number(location.hash.slice(1));
  if (!Number.isInteger(scene)||scene<1||scene>7) scene=1;
  let step=0, vocabulary='a', responseBudget=8;
  const samples={sentence:'Merhaba dünya!',compound:'Kitaplarımızdan',emoji:'🙂'};
  function renderWorkbench() {
    const text=scene===4 ? $('tokenInput').value : scene===5 ? samples.compound : samples.sentence;
    const chosen=scene===5&&vocabulary==='b' ? vocabularyB : vocabularyA;
    const tokens=encode(text,chosen);
    $('rawText').textContent=text||'—';
    $('tokenPieces').replaceChildren(...tokens.map(token=>{
      const chip=document.createElement('span'); chip.className='token-chip'; chip.setAttribute('role','listitem');
      chip.dataset.bytes=token.bytes.join(','); chip.dataset.tokenId=token.id;
      const label=document.createElement('span'); label.className='token-label';
      try { label.textContent=decoder.decode(new Uint8Array(token.bytes)).replace(/ /g,'␠').replace(/\n/g,'↵').replace(/\t/g,'⇥'); }
      catch { label.textContent=token.bytes.map(byte=>`0x${byte.toString(16).toUpperCase().padStart(2,'0')}`).join(' '); }
      const id=document.createElement('small'); id.className='token-id'; id.textContent=`ID ${token.id}`;
      chip.append(label,id); return chip;
    }));
    $('tokenPieces').classList.toggle('show-ids',scene===3&&step===2 || scene===4&&$('showTokenIds').checked);
    const rawOnly=scene===3&&step===0;
    $('tokenPieces').hidden=rawOnly;
    document.querySelector('.token-direction').hidden=rawOnly;
    document.querySelector('.token-stats').hidden=rawOnly;
    $('emptyTokens').hidden=rawOnly||text.length>0;
    $('characterCount').textContent=graphemes ? [...graphemes.segment(text)].length : Array.from(text).length;
    $('characterLabel').textContent=graphemes?'GÖRÜNÜR KARAKTER':'KOD NOKTASI';
    $('wordCount').textContent=words ? [...words.segment(text)].filter(part=>part.isWordLike).length : (text.match(/[\p{L}\p{N}]+/gu)||[]).length;
    $('tokenCount').textContent=tokens.length;
    $('workbenchPhase').textContent=scene===5?`ÖĞRETİCİ SÖZLÜK ${vocabulary.toUpperCase()}`:'ÖĞRETİCİ SÖZLÜK A';
    $('pipelineNote').textContent=['Başlangıçta okunabilir bir metin var.','Sözlük ve birleştirme kuralları, parçaları belirler.','Her parçanın sözlükte bir sayısal kimliği var.'][step];
    document.querySelectorAll('[data-step]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.step)===step)));
    document.querySelectorAll('[data-vocab]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.vocab===vocabulary)));
    $('vocabularyNote').textContent=vocabulary==='a'?'Aynı kelime, A sözlüğünde üç parçayla temsil ediliyor.':'Aynı kelime, B sözlüğünde tek parçayla temsil ediliyor.';
  }
  function renderBudget() {
    const total=7+responseBudget, overflow=Math.max(0,total-20);
    $('responseBudgetLabel').textContent=`${responseBudget} yanıt payı`;
    $('responseBudgetFill').style.width=`${Math.min(responseBudget,13)/20*100}%`;
    $('budgetMeter').classList.toggle('overflow',overflow>0);
    $('budgetMeter').setAttribute('aria-valuenow',Math.min(total,20));
    const result=overflow?`${total} / 20 token istendi. ${overflow} token aşım.`:`${total} / 20 token ayrıldı. ${20-total} token boş.`;
    $('budgetMeter').setAttribute('aria-valuetext',result); $('budgetResult').textContent=result;
    document.querySelectorAll('[data-budget]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.budget)===responseBudget)));
  }
  function renderNotes() {
    const [title,duration,body,action]=notes[scene-1];
    $('notesSceneTitle').textContent=`0${scene} — ${title}`; $('notesDuration').textContent=`${duration} SN / HEDEF`;
    $('notesBody').textContent=body; $('notesAction').textContent=action;
  }
  function render() {
    document.querySelectorAll('.scene').forEach(section=>{
      const active=Number(section.dataset.index)===scene;
      section.hidden=!active; section.inert=!active; section.classList.toggle('active',active);
    });
    $('app').dataset.scene=scene; $('tokenWorkbench').hidden=scene<2||scene>5;
    $('currentSceneCount').textContent=`0${scene}`; $('progressLine').style.width=`${scene/7*100}%`;
    $('prevButton').disabled=scene===1; $('nextButton').disabled=scene===7;
    history.replaceState(null,'',`#0${scene}`);
    renderWorkbench(); renderBudget(); renderNotes();
    $('announcer').textContent=`Sahne ${scene}: ${notes[scene-1][0]}`;
  }
  function navigate(direction) {
    if (scene===3 && (direction>0&&step<2 || direction<0&&step>0)) step+=direction;
    else { scene=Math.max(1,Math.min(7,scene+direction)); if(scene===3) step=direction>0?0:2; }
    render();
  }
  $('nextButton').addEventListener('click',()=>navigate(1)); $('prevButton').addEventListener('click',()=>navigate(-1));
  document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{step=Number(button.dataset.step);render();}));
  document.querySelectorAll('[data-vocab]').forEach(button=>button.addEventListener('click',()=>{vocabulary=button.dataset.vocab;render();}));
  document.querySelectorAll('[data-budget]').forEach(button=>button.addEventListener('click',()=>{responseBudget=Number(button.dataset.budget);renderBudget();}));
  document.querySelectorAll('[data-sample]').forEach(button=>button.addEventListener('click',()=>{$('tokenInput').value=samples[button.dataset.sample];renderWorkbench();}));
  $('tokenInput').addEventListener('input',renderWorkbench); $('showTokenIds').addEventListener('change',renderWorkbench);
  $('resetTokens').addEventListener('click',()=>{$('tokenInput').value=samples.sentence;$('showTokenIds').checked=false;renderWorkbench();});
  $('replayPresentation').addEventListener('click',()=>{scene=1;step=0;vocabulary='a';responseBudget=8;$('tokenInput').value=samples.sentence;$('showTokenIds').checked=false;render();$('nextButton').focus();});
  function toggleNotes() { if($('notesDrawer').open) $('notesDrawer').close(); else { $('publicationDetails').open=false; $('notesDrawer').showModal(); $('notesToggle').setAttribute('aria-expanded','true'); } }
  $('notesToggle').addEventListener('click',toggleNotes); $('notesClose').addEventListener('click',()=>$('notesDrawer').close());
  $('notesDrawer').addEventListener('close',()=>$('notesToggle').setAttribute('aria-expanded','false'));
  async function fullscreen() { try { if(document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { $('announcer').textContent='Bu tarayıcıda tam ekran açılamadı.'; } }
  $('fullscreenToggle').addEventListener('click',fullscreen);
  document.addEventListener('fullscreenchange',()=>$('fullscreenToggle').setAttribute('aria-label',document.fullscreenElement?'Tam ekrandan çık (F)':'Tam ekran modunu aç (F)'));
  window.addEventListener('keydown',event=>{
    const target=event.target instanceof Element ? event.target : document.activeElement;
    if(event.key==='Escape'&&$('publicationDetails').open) { $('publicationDetails').open=false;$('publicationDetails').querySelector('summary').focus();return; }
    if(event.altKey||event.ctrlKey||event.metaKey||target.closest('input,textarea,select,summary,[contenteditable="true"]')) return;
    if($('publicationDetails').open) return;
    const key=event.key.toLowerCase();
    if(key===' '&&target.closest('button,a')) return;
    if(['arrowright','pagedown',' ','arrowleft','pageup','home','end','n','f'].includes(key)) event.preventDefault();
    if(['arrowright','pagedown',' '].includes(key)) { if(target.closest('button,a')&&key===' ') return; navigate(1); }
    else if(['arrowleft','pageup'].includes(key)) navigate(-1);
    else if(key==='home'||key==='end') {scene=key==='home'?1:7;render();}
    else if(key==='n') toggleNotes(); else if(key==='f') fullscreen();
  });
  render();
})();
