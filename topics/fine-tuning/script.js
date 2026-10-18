(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const notes = [
    ['Bir soru',20,'Aynı dil modeli bazen uzun bir açıklama, bazen yalnızca istenen etiketi üretir. Bu davranışı nasıl daha tutarlı hale getiririz? Örneğimiz bir destek talebini uygun kategoriye ayırmak. Önce iyi bir talimat ve birkaç örnek yeterli olabilir. Ancak tekrarlanan bir görevde ölçülmüş bir ihtiyaç varsa, modeli örneklerle eğitmeye devam etmek de bir seçenektir. Buna fine-tuning denir.','Genel yanıtla hedef çıktıyı karşılaştır; bunun hazırlanmış bir örnek olduğunu söyle.'],
    ['Hazır beceriyi uyarla',45,'Fine-tuning, önceden eğitilmiş bir modeli belirli bir görev veya alan için eğitmeye devam etmektir. Müzisyenin yeni bir parçaya çalışması gibi, mevcut becerinin üzerine kurulur. Sıfırdan bir model üretmekten farklıdır. Parametreler, modelin davranışını belirleyen öğrenilmiş sayılardır. Sohbete örnek koyduğumuzda genellikle bu sayılar değişmez; eğitimde ise temel ağırlıklar veya eklenen eğitilebilir parametreler güncellenir. Sonuç bir model sürümü ya da uyarlayıcı olarak saklanabilir.','Ağırlık çizgilerini göster; sağdaki küçük modelin bir LLM olmadığını belirt.'],
    ['Öğrenme döngüsü',50,'Gözetimli eğitimde modele bir girdi ve hedef çıktı gösterilir. Model tahmin yapar; kayıp fonksiyonu tahminin hedefle uyuşmazlığını sayıya çevirir. Gradyanlar ve optimizasyon yöntemi, eğitilebilir parametrelerin nasıl değişeceğini belirler. Buradaki üç adım bu döngüyü açar. Dil modeli eğitiminde hedef, örneğin yanıtın sonraki tokenları olabilir. Sağdaki öğretici sınıflandırıcı yalnızca iki kelime özelliği kullanır. Başlangıç ağırlıkları elle seçilmiştir; bir ön eğitimli dil modeli değildir.','Tahmin, kayıp ve güncelleme adımlarını ilerlet; ağırlıkların değişimini göster.'],
    ['Veriyle deney',70,'Deneyde aynı başlangıçtan iki farklı veri kümesiyle çalışıyoruz. Çeşitli örneklerde acil ve normal talepler her iki kategoride de var. Tek yönlü örneklerde ise ödeme taleplerinin tamamı acil; model yanlış bir ilişki öğrenebilir. Eğitim turunu artırıp eğitim doğrularını ve ayrı kontrol örneklerini karşılaştıralım. Bu kontrol metinleri eğitimde kullanılmıyor; yine de yalnızca iki özellik taşıyan çok küçük bir deney. Sonuçlar gerçek bir modelin kalite ölçümü değildir. Veri seçiminin neden önemli olduğunu görünür kılar.','İki veri kümesini aynı tur sayısında dene; sıfırla ve geri al kontrollerini kullan.'],
    ['Tam eğitim ve LoRA',60,'Bütün temel ağırlıkları güncellemek tek yol değildir. LoRA, temel ağırlıkları sabit tutar; güncellemeyi temsil eden iki küçük matrisi öğrenir. Şemada sabit kalan alanla eğitilen alanı ayırt ediyoruz. Bu, eğitilebilir parametre sayısını ve bellek ihtiyacını azaltabilir. Ancak model, görev ve ayarlar sonucu etkiler. Daha çok tur da otomatik olarak daha iyi sonuç getirmez: aşırı uyum ve önceki becerilerin zayıflaması gibi etkiler ayrı değerlendirmeyle izlenmelidir.','Tam fine-tuning ile LoRA arasında geçiş yap; matris boyutlarının şematik olduğunu açıkla.'],
    ['Prompt, RAG, fine-tuning',35,'Prompt, o isteğin talimatını değiştirir. RAG, yanıt sırasında dış kaynaklardan bulunan bilgiyi bağlama ekler. Fine-tuning ise eğitim yoluyla parametreleri ve davranışı uyarlar. Tutarlı çıktı biçimi için önce talimatı denemek, güncel belgelere dayanmak için bilgi erişimini düşünmek iyi bir başlangıçtır. Yöntemler birlikte kullanılabilir. Fine-tuning bilgi de öğretebilir, fakat güncel bir bilgi tabanı veya hatasızlık garantisi değildir.','Üç yaklaşımda müdahalenin nerede olduğunu karşılaştır.'],
    ['Ayrı değerlendir',20,'Özetimiz şu: hazır bir beceriyi hedefe uygun örneklerle uyarlarız; eğitimdeki başarı yeni örneklere taşınmak zorunda değildir. Veriyi temizle, tekrarları ayıkla ve değerlendirme verisini eğitimden ayrı tut. Test sonuçlarına sürekli bakarak ayar yaptıysan, son kontrol için ayrıca dokunulmamış bir küme kullan. Model sürümünü ancak görev kalitesini ve istenmeyen etkilerini ölçerek seç.','Üç çıkarımı oku; RAG anlatımına geçişi göster.']
  ];
  // Basit lojistik model: [ödeme özelliği, acil özelliği, sabit terim].
  // Bu başlangıç elle seçilmiştir; ön eğitimli bir LLM yüklenmez.
  const INITIAL = [0.25, 0.65, -0.1];
  const examples = {
    diverse: [
      {text:'Ödeme tamamlanmadı.',y:1}, {text:'Acil, ödeme alınmadı.',y:1},
      {text:'Ekran donuyor.',y:0}, {text:'Acil, uygulama açılmıyor.',y:0}
    ],
    biased: [
      {text:'Acil, ödeme hatası var.',y:1}, {text:'Ödeme geçmedi, acil.',y:1},
      {text:'Ekran donuyor.',y:0}, {text:'Uygulama açılmıyor.',y:0}
    ]
  };
  const checks = [{text:'Ödeme henüz görünmüyor.',y:1},{text:'Acil, ekran açılmıyor.',y:0}];
  const category = value => value ? 'ödeme' : 'teknik';
  function features(text) { const lower=text.toLocaleLowerCase('tr-TR'); return [Number(lower.includes('ödeme')),Number(lower.includes('acil')),1]; }
  function probability(weights, sample) { const x=features(sample.text); return 1/(1+Math.exp(-weights.reduce((sum,w,i)=>sum+w*x[i],0))); }
  function loss(weights,data) { return data.reduce((sum,sample)=>{const p=Math.max(1e-9,Math.min(1-1e-9,probability(weights,sample)));return sum-sample.y*Math.log(p)-(1-sample.y)*Math.log(1-p);},0)/data.length; }
  function update(weights,data) {
    const gradient=[0,0,0];
    for(const sample of data) { const error=probability(weights,sample)-sample.y;const x=features(sample.text);gradient.forEach((_,i)=>gradient[i]+=error*x[i]/data.length); }
    return weights.map((value,i)=>value-0.8*gradient[i]);
  }
  function train(data,epochs) { let weights=[...INITIAL];for(let i=0;i<epochs;i++)weights=update(weights,data);return weights; }
  function correct(weights,data) { return data.filter(sample=>Number(probability(weights,sample)>=0.5)===sample.y).length; }
  const format = value => value.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2});
  let scene=Number(location.hash.slice(1));if(!Number.isInteger(scene)||scene<1||scene>7)scene=1;
  let step=0,dataset='diverse',epochs=0,method='full',approach='prompt';
  const approachContent={
    prompt:{place:'MÜDAHALE / O İSTEĞİN BAĞLAMI',title:'Talimatı ve örneği değiştir.',description:'“Yalnızca kategori döndür” gibi bir talimat ve örnekler verirsin. Tipik kullanımda model ağırlıkları değişmez.',flow:['Talimat + örnek','Model','Yanıt']},
    rag:{place:'MÜDAHALE / YANIT ANINDA BİLGİ ERİŞİMİ',title:'Gerekli belgeyi getir.',description:'Güncel bir prosedürü arayıp ilgili parçaları bağlama eklersin. Getirilen bilgi ağırlıklara yazılmak zorunda değildir.',flow:['Sorgu','Belge erişimi','Model + kaynak']},
    tune:{place:'MÜDAHALE / EĞİTİMDE PARAMETRELER',title:'Örneklerle davranışı uyarla.',description:'Tekrarlanan bir görev, çıktı biçimi veya alan için eğitim yaparsın. Temel ağırlıklar ya da uyarlayıcı parametreleri değişir.',flow:['Eğitim örnekleri','Güncelleme','Uyarlanmış model']}
  };
  function renderWeights(weights) {
    if (!$('weightRows').children.length) {
      for (const label of ['“ödeme”','“acil”','sabit']) {
        const row=document.createElement('div');row.className='weight-row';
        const name=document.createElement('span');name.textContent=label;
        const track=document.createElement('span');track.className='weight-track';track.setAttribute('aria-hidden','true');
        const fill=document.createElement('span');fill.className='weight-fill';track.append(fill);
        const value=document.createElement('span');value.className='weight-value';
        row.append(name,track,value);$('weightRows').append(row);
      }
    }
    [...$('weightRows').children].forEach((row,i)=>{
      const fill=row.querySelector('.weight-fill');const extent=Math.min(Math.abs(weights[i])/3,1)*50;
      fill.style.width=`${extent}%`;fill.style.left=`${weights[i]>=0?50:50-extent}%`;
      const value=row.querySelector('.weight-value');value.textContent=format(weights[i]);value.dataset.value=weights[i];
    });
  }
  function renderData() {
    const target=$('datasetExamples');target.replaceChildren();
    for(const [title,data] of [['Eğitim / 4 örnek',examples[dataset]],['Ayrı kontrol / 2 örnek',checks]]) {
      const heading=document.createElement('h3');heading.textContent=title;const list=document.createElement('ul');
      for(const sample of data){const item=document.createElement('li');item.textContent=`${sample.text} → ${category(sample.y)}`;list.append(item);}
      target.append(heading,list);
    }
    const note=document.createElement('p');note.textContent='Özellikler yalnızca “ödeme” ve “acil” sözcüklerinin varlığıdır. Ayrı metinler aynı özellikleri paylaşabilir; kapsamlı bir genelleme testi değildir.';target.append(note);
  }
  function renderTraining() {
    const weights=train(examples[dataset],epochs);
    $('epochCount').textContent=epochs;$('trainScore').textContent=`${correct(weights,examples[dataset])}/4`;$('testScore').textContent=`${correct(weights,checks)}/2`;
    $('testPredictions').replaceChildren(...checks.map(sample=>{
      const predicted=Number(probability(weights,sample)>=0.5);const row=document.createElement('div');row.className=`test-prediction${predicted===sample.y?'':' is-wrong'}`;
      const text=document.createElement('span');text.textContent=sample.text;const result=document.createElement('strong');result.textContent=`Tahmin: ${category(predicted)} · Hedef: ${category(sample.y)} · ${predicted===sample.y?'Doğru':'Yanlış'}`;
      row.append(text,result);return row;
    }));
    $('trainingStatus').textContent=`${epochs} tur · Eğitim kaybı: ${format(loss(weights,examples[dataset]))}. Bu küçük kümenin sonucu; LLM performansı değildir.`;
    $('trainOne').disabled=$('trainFive').disabled=epochs>=30;$('trainBack').disabled=epochs===0;
    $('datasetDescription').textContent=dataset==='diverse'?'Her kategoride hem acil hem normal örnekler var. Modelin asıl ayrımı öğrenmesini dene.':'Ödeme örneklerinin hepsi acil; teknik örnekler normal. “Acil” sözcüğü yanlış bir ipucu olabilir.';
    document.querySelectorAll('[data-dataset]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.dataset===dataset)));
    renderData();return weights;
  }
  function renderBench() {
    $('modelBench').hidden=scene<2||scene>5;$('classifierView').hidden=scene===5;$('adapterView').hidden=scene!==5;
    $('trainingResult').hidden=scene!==4;$('loopResult').hidden=scene!==3;
    const trained=renderTraining();const loopWeights=step===2?update(INITIAL,[examples.diverse[0]]):INITIAL;
    renderWeights(scene===4?trained:scene===3?loopWeights:INITIAL);
    $('modelBench').classList.toggle('is-updated',scene===3&&step===2||scene===4&&epochs>0);
    $('benchPhase').textContent=scene===4?`TUR ${epochs} / 30`:scene===3?['TAHMİN','KAYIP','GÜNCELLEME'][step]:scene===5?(method==='lora'?'LoRA':'TAM FINE-TUNING'):'BAŞLANGIÇ';
    $('benchCaption').textContent=scene===3?'TEK ÖRNEK / “ÖDEME TAMAMLANMADI.”':'ÖĞRETİCİ MODEL · ELLE SEÇİLMİŞ BAŞLANGIÇ';
    $('benchFooter').textContent=scene===5?'Matrisler şematiktir; yöntem seçimi canlı deneyi eğitmez.':'Öğretici lojistik sınıflandırıcı; LLM eğitimi veya benchmark değildir.';
    $('loopExplanation').textContent=['Model önce bir tahmin üretir. Henüz hiçbir ağırlık güncellenmedi.','Hedef “ödeme”. Kayıp, doğru sınıfa verilen olasılığa göre hesaplanır.','Bir gradyan adımı, ağırlıkları bu örnekteki kaybı azaltacak yönde değiştirir.'][step];
    const p=probability(step===2?loopWeights:INITIAL,examples.diverse[0]);
    $('loopResult').replaceChildren();const result=document.createElement('strong');result.textContent=step===1?`Kayıp: ${format(loss(INITIAL,[examples.diverse[0]]))}`:`Ödeme olasılığı: ${format(p)}`;
    const detail=document.createElement('small');detail.textContent=step===2?'Tek güncelleme uygulandı. Geri dönünce başlangıç ağırlıkları geri gelir.':'0–1 arası değer. Yalnızca bu öğretici modelin hesabıdır.';$('loopResult').append(result,detail);
    document.querySelectorAll('[data-step]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.step)===step)));
    $('adapterView').classList.toggle('is-lora',method==='lora');$('adapterPair').hidden=method!=='lora';$('baseState').textContent=method==='lora'?'SABİT':'GÜNCELLENİR';
    $('methodExplanation').textContent=method==='lora'?'Temel W sabit kalır. B ve A öğrenilir; etkileri temel modele eklenir.':'Bu şemada W içindeki bütün ağırlıklar eğitimde güncellenebilir.';
    document.querySelectorAll('[data-method]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.method===method)));
  }
  function renderApproach() {
    const content=approachContent[approach];$('approachPlace').textContent=content.place;$('approachTitle').textContent=content.title;$('approachDescription').textContent=content.description;
    const nodes=[];content.flow.forEach((text,i)=>{if(i){const arrow=document.createElement('i');arrow.textContent='→';arrow.setAttribute('aria-hidden','true');nodes.push(arrow);}const label=document.createElement('span');label.textContent=text;nodes.push(label);});$('approachFlow').replaceChildren(...nodes);
    document.querySelectorAll('[data-approach]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.approach===approach)));
  }
  function renderNotes() { const [title,duration,body,action]=notes[scene-1];$('notesSceneTitle').textContent=`0${scene} — ${title}`;$('notesDuration').textContent=`${duration} SN / HEDEF`;$('notesBody').textContent=body;$('notesAction').textContent=action; }
  function render() {
    document.querySelectorAll('.scene').forEach(section=>{const active=Number(section.dataset.index)===scene;section.hidden=!active;section.inert=!active;section.classList.toggle('active',active);});
    $('app').dataset.scene=scene;$('currentSceneCount').textContent=`0${scene}`;$('progressLine').style.width=`${scene/7*100}%`;$('prevButton').disabled=scene===1;$('nextButton').disabled=scene===7;
    if(scene!==4)$('dataDetails').open=false;
    history.replaceState(null,'',`#0${scene}`);renderBench();renderApproach();renderNotes();$('announcer').textContent=`Sahne ${scene}: ${notes[scene-1][0]}`;
  }
  function navigate(direction) {
    if(scene===3&&(direction>0&&step<2||direction<0&&step>0))step+=direction;
    else{scene=Math.max(1,Math.min(7,scene+direction));if(scene===3)step=direction>0?0:2;}
    render();
  }
  $('nextButton').addEventListener('click',()=>navigate(1));$('prevButton').addEventListener('click',()=>navigate(-1));
  document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{step=Number(button.dataset.step);render();}));
  document.querySelectorAll('[data-dataset]').forEach(button=>button.addEventListener('click',()=>{if(dataset!==button.dataset.dataset){dataset=button.dataset.dataset;epochs=0;}renderBench();}));
  document.querySelectorAll('[data-method]').forEach(button=>button.addEventListener('click',()=>{method=button.dataset.method;renderBench();}));
  document.querySelectorAll('[data-approach]').forEach(button=>button.addEventListener('click',()=>{approach=button.dataset.approach;renderApproach();}));
  function changeEpoch(delta){epochs=Math.max(0,Math.min(30,epochs+delta));renderBench();}
  $('trainOne').addEventListener('click',()=>changeEpoch(1));$('trainFive').addEventListener('click',()=>changeEpoch(5));$('trainBack').addEventListener('click',()=>changeEpoch(-1));$('resetTraining').addEventListener('click',()=>{epochs=0;renderBench();});
  $('replayPresentation').addEventListener('click',()=>{scene=1;step=0;dataset='diverse';epochs=0;method='full';approach='prompt';render();$('nextButton').focus();});
  function toggleNotes(){if($('notesDrawer').open)$('notesDrawer').close();else{$('publicationDetails').open=false;$('notesDrawer').showModal();$('notesToggle').setAttribute('aria-expanded','true');}}
  $('notesToggle').addEventListener('click',toggleNotes);$('notesClose').addEventListener('click',()=>$('notesDrawer').close());$('notesDrawer').addEventListener('close',()=>$('notesToggle').setAttribute('aria-expanded','false'));
  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('announcer').textContent='Bu tarayıcıda tam ekran açılamadı.';}}
  $('fullscreenToggle').addEventListener('click',fullscreen);document.addEventListener('fullscreenchange',()=>$('fullscreenToggle').setAttribute('aria-label',document.fullscreenElement?'Tam ekrandan çık (F)':'Tam ekran modunu aç (F)'));
  window.addEventListener('keydown',event=>{
    const target=event.target instanceof Element?event.target:document.activeElement;
    if(event.key==='Escape'){if($('publicationDetails').open){$('publicationDetails').open=false;$('publicationDetails').querySelector('summary').focus();return;}if($('dataDetails').open){$('dataDetails').open=false;$('dataDetails').querySelector('summary').focus();return;}}
    if(event.altKey||event.ctrlKey||event.metaKey||target.closest('input,textarea,select,summary,[contenteditable="true"]')||$('publicationDetails').open)return;
    const key=event.key.toLowerCase();if(key===' '&&target.closest('button,a'))return;
    if(['arrowright','pagedown',' ','arrowleft','pageup','home','end','n','f'].includes(key))event.preventDefault();
    if(['arrowright','pagedown',' '].includes(key))navigate(1);else if(['arrowleft','pageup'].includes(key))navigate(-1);else if(key==='home'||key==='end'){scene=key==='home'?1:7;render();}else if(key==='n')toggleNotes();else if(key==='f')fullscreen();
  });
  for(const [id,count] of [['weightMatrix',16]])for(let i=0;i<count;i++)$(id).append(document.createElement('span'));
  document.querySelectorAll('.mini-matrix').forEach(matrix=>{for(let i=0;i<4;i++)matrix.append(document.createElement('span'));});
  render();
})();
