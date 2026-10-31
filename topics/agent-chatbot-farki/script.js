/* Deterministic teaching simulation. No model, account, storage or remote tool calls. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id), app=$('app'), bench=$('agentBench');
 const notes=JSON.parse($('speaker-data').textContent);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let scene=/^#0?[1-7]$/.test(location.hash)?Number(location.hash.slice(1)):1;
 let mode='chat',toolStep=0,stock='missing',step=0,approval=null,health='offline',attempts=0,pattern='chat';
 const routes={out:'M388 68 C508 68 520 112 520 182',result:'M520 246 C520 328 470 340 402 340',back:'M238 340 C181 340 193 114 252 82'};
 const patterns={
  chat:['Bu örnekte tek yanıt üreten uygulama.','Veri, konuşmadaki yanıtı besleyebilir.','Yanıt verildiğinde yeni mesaj bekler.'],
  workflow:['Geliştiricinin yazdığı sabit akış.','Önceden tanımlanmış kurallar uygulanır.','Tanımlanan akış bittiğinde veya hata sınırında.'],
  agent:['Model, uygulamanın sınırları içinde sonraki işlemi seçebilir.','Gözlem, sonraki araç seçimini veya bitiş kararını etkileyebilir.','Hedef tamamlanınca; izin, hata veya bütçe sınırında.']
 };
 function pressed(selector,key,value){document.querySelectorAll(selector).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset[key]===String(value))));}
 function stopMotion(){for(const id of ['packetMotion','packetFade'])try{$(id).endElement();}catch{} $('routePacket').style.opacity='0';}
 function pulse(route){stopMotion();if(reduced.matches||document.hidden||!route)return;$('packetMotion').setAttribute('path',routes[route]);$('packetMotion').beginElement();$('packetFade').beginElement();}
 function experiment(){
  const ready=stock==='ready';
  const states=[
   ['Hedef alındı','Henüz araç çalışmadı. Dolabı okuyarak başla.','MODEL','Hedefi al','İlk işlem bekliyor','model',null],
   ['dolap_oku sonucu',ready?'Muz var. Yoğurt var.':'Muz var. Yoğurt yok.','ARAÇ','Veriyi oku','Hazır dolap verisi','result','result'],
   ['Sonuç değerlendirildi',ready?'İki malzeme de hazır. Listeye yazmaya gerek yok.':'Muz hazır; yoğurt eksik. Listeye yazmadan önce onay gerekli.','MODEL','Değerlendir',ready?'Eksik yok':'1 malzeme eksik','model','back'],
   ready?['Hedef tamamlandı','Eksik malzeme yok. Örnek liste boş kaldı.','BİTTİ','Tamamlandı','Yazma gerekmedi','result',null]:['Kullanıcı onayı','Örnek listene yoğurt eklensin mi? Ekle veya Vazgeç seç.','ONAY','Onay bekle','Henüz yazılmadı','model',null],
   approval==='deny'?['Kullanıcı vazgeçti','İşlem durdu. Örnek listeye hiçbir şey eklenmedi.','DURDU','Durduruldu','Yazma yapılmadı','result',null]:['listeye_ekle sonucu','Yoğurt örnek listeye eklendi. Şimdi kaydı doğrula.','ARAÇ','Kaydı kontrol et','Doğrulama bekliyor','tool','out'],
   ['liste_oku sonucu','Yoğurt kaydı örnek listede bulundu. Hedef tamamlandı.','DOĞRULANDI','Tamamlandı','Kayıt doğrulandı','result','result']
  ];
  return states[step];
 }
 function terminal(){return stock==='ready'?step>=3:approval==='deny'?step>=4:step>=5;}
 function pending(){return scene===4&&stock==='missing'&&step===3;}
 function view(){
  let v={mode:'agent',badge:'DÖNGÜ',label:'HEDEF',text:'Muzlu yoğurt için eksikleri bul; listeye eklemeden önce sor.',center:'Sonucu kullan',sub:'Gerekiyorsa devam et',active:'model',route:null,ingredients:false,list:false,status:'normal',tool:'ARAÇ',toolSub:'Uygulama yürütür'};
  if(scene===2){v.mode=mode;v.badge=mode==='chat'?'SOHBET':'AGENT DÖNGÜSÜ';if(mode==='chat')Object.assign(v,{label:'ÖRNEK YANIT',text:'Muz ve yoğurt kullanabilirsin; evde eksik olanı kontrol et.',center:'Yanıt üret',sub:'Yeni mesajı bekle',tool:'YANIT',toolSub:'Bir öneri',active:'tool',route:'out'});else v.route='out';}
  if(scene===3){const records=[['İŞLEM İSTEĞİ','dolap_oku() seçildi. Uygulama henüz aracı çalıştırmadı.','İşlemi seç','Çağrı ≠ sonuç','model','out'],['UYGULAMA ÇALIŞTIRDI','dolap_oku → muz: var; yoğurt: yok. Hazır örnek veri alındı.','Aracı çalıştır','Sonuç uygulamaya döndü','tool','result'],['MODELE SUNULAN GÖZLEM','Muz var, yoğurt yok. Bu bilgi bir sonraki işlem için kullanılabilir.','Sonucu oku','Yeni bağlam','model','back']][toolStep];Object.assign(v,{label:records[0],text:records[1],center:records[2],sub:records[3],active:records[4],route:records[5],ingredients:toolStep>=1});}
  if(scene===4){const r=experiment();Object.assign(v,{label:r[0],text:r[1],badge:r[2],center:r[3],sub:r[4],active:r[5],route:r[6],ingredients:step>=1,list:true,status:step>=4&&approval==='allow'?'success':'normal',tool:step>=4&&approval==='allow'?'LİSTE':'ARAÇ',toolSub:step===5?'liste_oku':step===4&&approval==='allow'?'listeye_ekle':'dolap_oku'});}
  if(scene===5){v.badge=`${attempts} / 2 DENEME`;if(!attempts)Object.assign(v,{label:'ARAÇ HENÜZ ÇALIŞMADI',text:'Bu sahne dolabı okumadan önce başlar. Örnek liste boş.',center:'Aracı dene',sub:'Bütçe: 2 deneme'});else if(health==='ok')Object.assign(v,{label:'DOĞRULANAN ARAÇ YANITI',text:'Muz var, yoğurt yok. Veri alındı; bu sahnede listeye yazılmaz.',center:'Veri alındı',sub:'1 deneme kullanıldı',active:'result',route:'result',ingredients:true,status:'success'});else Object.assign(v,{label:'ARAÇ ERİŞİLEMİYOR',text:attempts===1?'Dolap bilgisi alınamadı. Liste değişmedi; bir deneme hakkı kaldı.':'2 deneme sınırı doldu. Dolap bilgisi doğrulanamadı; liste değişmedi.',center:attempts===1?'Veri alınamadı':'Sınırda dur',sub:attempts===1?'1 deneme kaldı':'Bütçe tükendi',active:'tool',route:'out',status:'error'});v.list=true;}
  if(scene===6){v.mode=pattern;v.badge=pattern==='chat'?'SOHBET':pattern==='workflow'?'SABİT AKIŞ':'AGENT DÖNGÜSÜ';v.label='ÇALIŞMA DÜZENİ';v.text=pattern==='chat'?'Kullanıcı → yanıt. Sohbet, gerekirse araçla alınan bilgiyi de kullanabilir.':pattern==='workflow'?'Dolabı oku → tarifi karşılaştır → liste taslağı. Sıra önceden yazılıdır.':'Hedef → işlem → gözlem → sonraki işlemi seç veya dur. Sonuç akışı yönlendirebilir.';v.center=pattern==='chat'?'Yanıt üret':pattern==='workflow'?'Sabit sırayı izle':'Sonuca göre seç';v.sub=pattern==='chat'?'Araç da kullanabilir':pattern==='workflow'?'Önceden yazılmış adımlar':'İzin ve bütçe içinde';v.route=pattern==='chat'?'out':pattern==='workflow'?'result':'back';if(pattern==='chat'){v.tool='YANIT';v.toolSub='Konuşma çıktısı';}}
  return v;
 }
 function render(animate=true){
  const oldScene=Number(app.dataset.scene);
  document.querySelectorAll('.scene').forEach(section=>{const active=Number(section.dataset.index)===scene;section.hidden=!active;section.inert=!active;section.classList.toggle('active',active);});
  app.dataset.scene=String(scene);bench.hidden=scene<2||scene>6;
  const v=view();bench.dataset.mode=v.mode;bench.dataset.status=v.status;
  $('benchBadge').textContent=v.badge;$('evidenceLabel').textContent=v.label;$('evidenceText').textContent=v.text;$('loopLabel').textContent=v.center;$('loopSub').textContent=v.sub;$('toolNodeLabel').textContent=v.tool;$('toolNodeSub').textContent=v.toolSub;
  $('diagramDescription').textContent=v.mode==='chat'?'Örnekte hedef modele gelir; model yanıt üretir.':v.mode==='workflow'?'Önceden yazılmış sıra, model ve araçlar arasındaki adımları belirler.':'Model araç çağrısı seçer; uygulama çalıştırır. Sonuç, sonraki adımı seçmek için modele döner.';
  for(const [id,key] of [['modelNode','model'],['toolNode','tool'],['resultNode','result']])$(id).classList.toggle('is-active',key===v.active);
  $('ingredientLine').hidden=!v.ingredients;$('yogurtItem').replaceChildren(document.createTextNode('Yoğurt '),Object.assign(document.createElement('b'),{textContent:scene===4&&stock==='ready'?'var':'yok'}));
  $('listStrip').hidden=!v.list;const written=scene===4&&approval==='allow'&&step>=4;
  $('listValue').textContent=written?'Yoğurt':'Boş';$('listStrip').classList.toggle('has-entry',written);$('listVerification').textContent=scene===4&&step===5?'liste_oku ile doğrulandı.':written?'Kayıt yazıldı; doğrulama bekliyor.':'Bu durumda listeye yazılmadı.';
  pressed('[data-mode]','mode',mode);pressed('[data-tool-step]','toolStep',toolStep);pressed('[data-stock]','stock',stock);pressed('[data-health]','health',health);pressed('[data-pattern]','pattern',pattern);
  $('modeDescription').textContent=mode==='chat'?'Bu araçsız sohbet örneği bir öneriyle yanıt verir.':'Araç sonucu geri gelir; sistem sonraki işlemi seçebilir veya durabilir.';
  $('approval').hidden=!pending();$('experimentBack').disabled=step===0;$('experimentNext').disabled=pending()||terminal();
  $('experimentStatus').textContent=experiment()[1];
  $('tryTool').disabled=attempts>=2||(health==='ok'&&attempts>=1);
  $('retryStatus').textContent=!attempts?'Henüz denenmedi. Bütçe: en fazla 2 deneme.':health==='ok'?'Veri alındı. 1 / 2 deneme kullanıldı.':attempts===1?'1 / 2 başarısız deneme. Bir kez daha deneyebilirsin.':'2 / 2 başarısız deneme. Bütçe doldu; işlem durdu.';
  [$('patternControl'),$('patternFeedback'),$('patternStop')].forEach((el,i)=>el.textContent=patterns[pattern][i]);
  $('currentSceneCount').textContent=String(scene).padStart(2,'0');$('progressLine').style.width=`${scene/7*100}%`;$('scenePicker').value=scene;
  $('prevButton').disabled=scene===1;$('nextButton').disabled=scene===7||pending();
  const note=notes[scene-1];$('notesSceneTitle').textContent=`0${scene} — ${note.title}`;$('notesBody').textContent=note.body;$('notesDuration').textContent=`${note.duration} SN / HEDEF`;$('notesAction').textContent=note.action;
  try{history.replaceState(null,'',`#0${scene}`);}catch{}
  $('announcer').textContent=`Sahne ${scene}: ${note.title}. ${scene===4?experiment()[1]:''}`;
  if(oldScene!==scene)$('publicationDetails').open=false;
  if(animate&&!bench.hidden)pulse(v.route);else stopMotion();
 }
 function resetExperiment(){step=0;approval=null;}
 function stepBack(){if(step>0){step--;if(step<=3)approval=null;render();}}
 function stepNext(){if(terminal()||pending())return;step++;render();if(pending())$('approveAdd').focus({preventScroll:true});}
 function navigate(direction){
  if(scene===2&&((direction>0&&mode==='chat')||(direction<0&&mode==='agent'))){mode=direction>0?'agent':'chat';render();return;}
  if(scene===3&&((direction>0&&toolStep<2)||(direction<0&&toolStep>0))){toolStep+=direction;render();return;}
  if(scene===4){if(direction>0&&!terminal()){stepNext();return;}if(direction<0&&step>0){stepBack();return;}}
  const order=['chat','workflow','agent'],index=order.indexOf(pattern);
  if(scene===6&&((direction>0&&index<2)||(direction<0&&index>0))){pattern=order[index+direction];render();return;}
  scene=Math.max(1,Math.min(7,scene+direction));render();
 }
 $('nextButton').addEventListener('click',()=>navigate(1));$('prevButton').addEventListener('click',()=>navigate(-1));
 $('scenePicker').addEventListener('change',event=>{scene=Number(event.target.value);render();});
 const select=(selector,fn)=>document.querySelectorAll(selector).forEach(button=>button.addEventListener('click',()=>{fn(button);render();}));
 select('[data-mode]',b=>mode=b.dataset.mode);select('[data-tool-step]',b=>toolStep=Number(b.dataset.toolStep));
 select('[data-stock]',b=>{stock=b.dataset.stock;resetExperiment();});select('[data-health]',b=>{health=b.dataset.health;attempts=0;});select('[data-pattern]',b=>pattern=b.dataset.pattern);
 $('experimentBack').addEventListener('click',stepBack);$('experimentNext').addEventListener('click',stepNext);
 $('experimentReset').addEventListener('click',()=>{resetExperiment();render();});
 for(const [id,value] of [['approveAdd','allow'],['declineAdd','deny']])$(id).addEventListener('click',()=>{if(!pending())return;approval=value;step=4;render();$('experimentBack').focus({preventScroll:true});});
 $('tryTool').addEventListener('click',()=>{if(attempts>=2||(health==='ok'&&attempts>=1))return;attempts++;render();});$('retryReset').addEventListener('click',()=>{attempts=0;render();});
 $('replayPresentation').addEventListener('click',()=>{scene=1;mode='chat';toolStep=0;stock='missing';resetExperiment();health='offline';attempts=0;pattern='chat';render();$('nextButton').focus({preventScroll:true});});
 function toggleNotes(){if($('notesDrawer').open)$('notesDrawer').close();else{$('publicationDetails').open=false;$('notesDrawer').showModal();$('notesToggle').setAttribute('aria-expanded','true');}}
 $('notesToggle').addEventListener('click',toggleNotes);$('notesClose').addEventListener('click',()=>$('notesDrawer').close());$('notesDrawer').addEventListener('close',()=>{$('notesToggle').setAttribute('aria-expanded','false');$('notesToggle').focus({preventScroll:true});});
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('announcer').textContent='Bu tarayıcıda tam ekran açılamadı.';}}
 $('fullscreenToggle').addEventListener('click',fullscreen);document.addEventListener('fullscreenchange',()=>$('fullscreenToggle').setAttribute('aria-label',document.fullscreenElement?'Tam ekrandan çık (F)':'Tam ekran modunu aç (F)'));
 window.addEventListener('keydown',event=>{
  const target=event.target instanceof Element?event.target:document.activeElement;
  if(event.key==='Escape'&&$('publicationDetails').open){$('publicationDetails').open=false;$('publicationDetails').querySelector('summary').focus();return;}
  if(event.altKey||event.ctrlKey||event.metaKey||document.querySelector('dialog[open]')||$('publicationDetails').open||target.closest('input,textarea,select,summary,[contenteditable="true"],#lesson-panel'))return;
  const key=event.key.toLowerCase();if(key===' '&&target.closest('button,a'))return;
  if(['arrowright','pagedown',' ','arrowleft','pageup','home','end','n','f'].includes(key))event.preventDefault();
  if(['arrowright','pagedown',' '].includes(key))navigate(1);else if(['arrowleft','pageup'].includes(key))navigate(-1);else if(key==='home'||key==='end'){scene=key==='home'?1:7;render();}else if(key==='n')toggleNotes();else if(key==='f')fullscreen();
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMotion();});reduced.addEventListener('change',stopMotion);
 window.addEventListener('hashchange',()=>{if(/^#0?[1-7]$/.test(location.hash)){scene=Number(location.hash.slice(1));render();}});
 render(false);
})();
