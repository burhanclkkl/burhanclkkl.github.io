(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const notes = [
    ['Ortak soru',20,'Makine öğrenmesinde isimlerden önce şu soruyu soralım: modelin elinde hangi bilgi var? Doğru cevapları biliyor muyuz, yalnızca örnekleri mi görüyoruz, yoksa eylemlerin sonuçlarını mı izliyoruz? Aynı noktaları farklı öğrenme düzenlerinde kullanarak bu ayrımı görünür hale getireceğiz.','Dört öğrenme sinyalini göster.'],
    ['Tür, görev, yöntem',25,'Öğrenme türü, algoritmanın adı değildir. Gözetimli öğrenme bir düzen, sınıflandırma bir görev, en yakın merkez ise örnek bir yöntemdir. Buradaki dört tür iyi bir başlangıç haritasıdır; bütün yaklaşımları kapsamaz. Örneğin kendinden gözetimli öğrenme ayrıca incelenebilir. Bir sistem farklı aşamalarda birden çok düzen kullanabilir.','Tür, görev ve yöntem satırlarını ayrı oku.'],
    ['Gözetimli öğrenme',30,'Gözetimli öğrenmede girdilerin yanında hedefler de bulunur. E-postaya spam veya normal etiketi vermek sınıflandırmadır; geçmiş satışlardan fiyat tahmin etmek regresyondur. Model örneklerdeki ilişkiyi öğrenir ve yeni girdiye tahmin yapar. Eğitim ile tahmin aynı işlem değildir. Hedef, eğitim örneklerini ezberlemekten çok yeni örneklere genelleyebilmektir.','Örnekler, öğrenme ve tahmin adımlarını ilerlet.'],
    ['Etiketlerle deney',40,'Burada her sınıfın ortalama konumunu hesaplayan küçük bir sınıflandırıcı var. Yeni nokta yakın merkezin sınıfını alıyor. İki etiketi değiştirince merkezler ve bazı tahminler değişiyor. Verinin görünüşü aynı kalsa bile verilen cevaplar öğrenmeyi yönlendiriyor. Bu noktalar temsili; başarıyı değerlendirmek için eğitimden ayrı ve temsil edici örnekler gerekir.','Etiketleri değiştir, yeni noktanın konumunu kaydır ve sıfırla.'],
    ['Gözetimsiz öğrenme',35,'Şimdi cevap etiketlerini kaldırıyoruz. K-Means noktaları seçtiğimiz sayıda merkez etrafında toplar. Önce en yakın merkeze atar, ardından merkezleri yeniden hesaplar. Birkaç adımda bu döngüyü izleyebiliriz. Küme bir insanın verdiği sınıf adı değildir. Müşteri gruplama bunun bir kullanım alanıdır; bulunan yapının işe yarayıp yaramadığını ayrıca yorumlamalıyız.','Küme sayısını değiştir; adımları ileri ve geri al.'],
    ['Yarı gözetimli öğrenme',40,'Yarı gözetimli öğrenmede az etiketli ve çok etiketsiz veri birlikte kullanılır. Bu deneyde yakın örnekler bir grafla bağlanır. İki sabit etiketin bilgisi komşular üzerinden yayılır; kesikli noktalar insan etiketi değil, model tahminidir. Bu yalnızca bir yöntem örneği. Benzerlik sınıfı yansıtmıyorsa veya başlangıç etiketi yanlışsa sonuç kötüleşebilir. Etiketsiz veri koşulsuz bir kazanç sağlamaz.','Bilgiyi birkaç tur yay; yanlış etiket seçeneğini dene.'],
    ['Pekiştirmeli öğrenme',25,'Pekiştirmeli öğrenmede ajan eylem seçer; ortam yeni durum ve ödül döndürür. Amaç yalnızca son ödülü değil, beklenen toplam ödülü artıran bir politika öğrenmektir. Hangi eylemin iyi olduğu baştan verilmez. Keşif yapmak ve gecikmiş sonuçları hesaba katmak gerekir. Robot kontrolü ve oyunlar buna örnektir.','Ajan, eylem, ortam ve ödül döngüsünü izle.'],
    ['Ödülle deney',40,'Beş durumlu ortamda normal adım eksi bir, hedefe varış artı sekiz getiriyor. Q-learning, seçilen eylemin değerini ödül ve sonraki durumun değerine göre güncelliyor. On bölüm öğrenirken keşif de yapılıyor. Politikayı denemek ise öğrenilmiş değerleri değiştirmiyor. Ödülün yanlış tasarlanması istenmeyen davranış öğretebilir; bu küçük ortam gerçek dünyadaki güvenlik ve genelleme sorunlarını temsil etmez.','Önce elle eylem seç, sonra öğren ve politikayı dene.'],
    ['Karşılaştırma',25,'Dört düzeni geri bildirim üzerinden karşılaştıralım: gözetimlide hedef, gözetimsizde etiketsiz yapı, yarı gözetimlide ikisinin birleşimi, pekiştirmelide etkileşimden gelen ödül var. Algoritma seçimi bundan sonraki sorudur. Aynı sınıflandırma görevi etiketlerin bulunabilirliğine göre farklı düzenlerle ele alınabilir.','Öğrenme sinyali sütununu karşılaştır.'],
    ['Sonuç',20,'Başlangıç sorumuz artık net: elimde hangi veri ve geri bildirim var? Önce bunu, sonra görevi ve yöntemi seç. Sonucu yeni örneklerde veya ayrı denemelerde değerlendir. Daha karmaşık model otomatik olarak daha iyi çözüm değildir; öğrenme sinyali ve doğru değerlendirme birlikte önemlidir.','Üç çıkarımla bitir.']
  ];
  const POINTS=[[.12,.35],[.2,.2],[.24,.54],[.34,.38],[.37,.65],[.62,.22],[.7,.4],[.76,.64],[.84,.3],[.88,.54]];
  const distance=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
  const mean=points=>[0,1].map(d=>points.reduce((s,p)=>s+p[d],0)/points.length);
  const closest=(p,centers)=>centers.reduce((best,c,i)=>distance(p,c)<distance(p,centers[best])?i:best,0);
  const clone=value=>JSON.parse(JSON.stringify(value));
  const pad=value=>String(value).padStart(2,'0');
  let scene=Number(location.hash.slice(1));if(!Number.isInteger(scene)||scene<1||scene>10)scene=1;
  let step=0,labelMode='clean',queryX=45,k=2,clusterRound=0,spreadRound=0;
  const graph=POINTS.map((p,i)=>POINTS.map((q,j)=>i===j?0:Math.exp(-distance(p,q)/.035)));
  // Simetrik 3-komşu grafı; uzak bağlantılar kesilir. Etiketli düğümler sabit tutulur.
  const neighbors=POINTS.map((p,i)=>POINTS.map((q,j)=>({j,d:distance(p,q)})).filter(x=>x.j!==i).sort((a,b)=>a.d-b.d).slice(0,3).map(x=>x.j));
  graph.forEach((row,i)=>row.forEach((_,j)=>{if(!neighbors[i].includes(j)&&!neighbors[j].includes(i))row[j]=0;}));
  function labels(){return POINTS.map((_,i)=>Number(i>=5)^(labelMode==='noisy'&&(i===1||i===4)?1:0));}
  function supervisedCenters(){const y=labels();return [0,1].map(c=>mean(POINTS.filter((_,i)=>y[i]===c)));}
  function clusterState(){
    let centers=k===2?[[.18,.18],[.28,.4]]:[[.15,.2],[.45,.8],[.8,.2]];
    for(let r=0;r<clusterRound;r++){const assignments=POINTS.map(p=>closest(p,centers));centers=centers.map((c,i)=>{const members=POINTS.filter((_,j)=>assignments[j]===i);return members.length?mean(members):c;});}
    return {centers,assignments:POINTS.map(p=>closest(p,centers))};
  }
  function spreadState(){
    const seedA=$('wrongSeed').checked?1:0;let probabilities=POINTS.map((_,i)=>i===0?seedA:i===9?1:.5);
    for(let round=0;round<spreadRound;round++)probabilities=probabilities.map((p,i)=>{
      if(i===0)return seedA;if(i===9)return 1;
      const total=graph[i].reduce((s,w)=>s+w,0);return total?graph[i].reduce((s,w,j)=>s+w*probabilities[j],0)/total:p;
    });return probabilities;
  }
  const SVG='http://www.w3.org/2000/svg';
  function svg(tag,attrs={},text){const el=document.createElementNS(SVG,tag);Object.entries(attrs).forEach(([name,value])=>el.setAttribute(name,value));if(text!==undefined)el.textContent=text;return el;}
  const xy=p=>[42+p[0]*350,270-p[1]*225];
  const content=$('plotContent');content.append(svg('path',{d:'M42 28 V270 H410',class:'plot-axis'}),svg('text',{x:350,y:300,class:'axis-label'},'Özellik 1'),svg('text',{x:44,y:20,class:'axis-label'},'Özellik 2'));
  const edgeLayer=svg('g');content.append(edgeLayer);
  graph.forEach((row,i)=>row.forEach((w,j)=>{if(w&&j>i){const a=xy(POINTS[i]),b=xy(POINTS[j]);edgeLayer.append(svg('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],class:'graph-edge'}));}}));
  const pointNodes=POINTS.map((point,i)=>{const [x,y]=xy(point);const group=svg('g',{class:'data-point',transform:`translate(${x} ${y})`,'data-index':i});group.append(svg('circle',{r:12}),svg('text',{},'?'));content.append(group);return group;});
  const centerNodes=Array.from({length:3},()=>{const group=svg('g',{class:'cluster-center'});group.append(svg('path',{d:'M-7 -7 7 7 M-7 7 7 -7'}),svg('text',{x:11,y:-9}));content.append(group);return group;});
  const query=svg('g',{class:'query-point'});query.append(svg('path',{d:'M0 -10 10 0 0 10 -10 0Z'}),svg('text',{x:12,y:5},'Yeni'));content.append(query);
  function renderPlot(){
    $('dataBench').hidden=scene<3||scene>6;edgeLayer.style.display=scene===6?'':'none';centerNodes.forEach(n=>n.style.display='none');query.style.display='none';
    const y=labels();let classes=[],texts=[],centers=[],status='',legend='',phase='';
    if(scene===3||scene===4){
      classes=y; texts=y.map(v=>v?'B':'A');centers=scene===4||step>=1?supervisedCenters():[];
      if(scene===4||step===2){const point=[scene===4?queryX/100:.45,.46];query.style.display='';const [x,z]=xy(point);query.style.transform=`translate(${x}px,${z}px)`;const prediction=closest(point,centers);query.dataset.prediction=prediction;status=`Yeni nokta → ${prediction?'B':'A'}. Tahmin, verilen etiketlerden öğrenilen merkezlere bağlı.`;}
      else status=step===0?'10 örneğin A/B hedefleri verilmiş durumda.':'Her sınıfın konum ortalaması hesaplandı; × işaretleri öğrenilen merkezler.';
      legend='A / lila · B / turuncu · × merkez · ◆ yeni örnek';phase=scene===3?['ETİKETLİ ÖRNEKLER','MERKEZLERİ ÖĞREN','YENİ ÖRNEĞİ TAHMİN ET'][step]:'ETİKETLİ VERİ';
    }else if(scene===5){
      const state=clusterState();classes=state.assignments;texts=classes.map(c=>String(c+1));centers=state.centers;phase=`K = ${k} · ADIM ${clusterRound}/8`;
      status=`${k} merkez ve ${POINTS.length} nokta. Grup numaraları insan tarafından verilmiş sınıf adları değildir.`;legend='Noktadaki sayı: hesaplanan küme · ×: merkez';
    }else if(scene===6){
      const probabilities=spreadState();classes=probabilities.map(p=>Math.abs(p-.5)<1e-10?-1:Number(p>.5));texts=classes.map(c=>c===-1?'?':c?'B':'A');phase=`2 ETİKET / 10 VERİ · TUR ${spreadRound}/20`;
      status=spreadRound?`2 insan etiketi sabit. ${classes.filter((c,i)=>i!==0&&i!==9&&c!==-1).length} etiketsiz noktaya graf üzerinden tahmin ulaştı.`:'İki etiket dışında cevaplar bilinmiyor. Komşuluk bilgisi henüz yayılmadı.';legend='Düz çerçeve: verilen etiket · kesik çerçeve: tahmin · ?: henüz eşit destek';
      pointNodes.forEach((node,i)=>node.dataset.support=probabilities[i]);
    }
    pointNodes.forEach((node,i)=>{node.setAttribute('class',`data-point ${['class-a','class-b','class-c'][classes[i]]||''}${scene===6&&i!==0&&i!==9?' predicted':''}`);node.querySelector('text').textContent=texts[i]||'?';node.dataset.assignment=classes[i]??-1;});
    centers.forEach((center,i)=>{const [x,y]=xy(center),node=centerNodes[i];node.style.display='';node.style.transform=`translate(${x}px,${y}px)`;node.dataset.x=center[0];node.dataset.y=center[1];node.querySelector('text').textContent=scene===5?String(i+1):i?'B':'A';});
    $('plotStatus').textContent=status;$('plotLegend').textContent=legend;$('dataPhase').textContent=phase;
    $('supervisedExplanation').textContent=['Her girdinin bir hedef etiketi var.','Etiketli örneklerden iki sınıf merkezi hesaplanıyor.','Yeni noktanın hedefi verilmedi; model yakın merkezle tahmin yapıyor.'][step];
    document.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.step)===step)));
    document.querySelectorAll('[data-labels]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.labels===labelMode)));
    document.querySelectorAll('[data-k]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.k)===k)));
    $('clusterStep').disabled=clusterRound>=8;$('clusterBack').disabled=clusterRound===0;$('spreadStep').disabled=spreadRound>=20;$('spreadBack').disabled=spreadRound===0;
    $('queryX').value=queryX;$('queryValue').textContent=queryX;
  }
  function freshAgent(){return {q:Array.from({length:5},()=>[0,0]),position:0,last:0,total:0,steps:0,done:false,episodes:0,seed:5317,status:'Ajan 0 durumunda. Hedef 4. Bir eylem seç veya öğrenmeyi başlat.'};}
  let agent=freshAgent();const history=[];
  function remember(){history.push(clone(agent));if(history.length>100)history.shift();}
  function random(){agent.seed=(Math.imul(1664525,agent.seed)+1013904223)>>>0;return agent.seed/4294967296;}
  function beginEpisode(){agent.position=0;agent.last=0;agent.total=0;agent.steps=0;agent.done=false;}
  function move(action,learn){
    if(agent.done)return;
    const state=agent.position,next=Math.max(0,Math.min(4,state+(action===0?-1:1))),terminal=next===4,reward=terminal?8:-1;
    if(learn)agent.q[state][action]+=.7*(reward+(terminal?0:.9*Math.max(...agent.q[next]))-agent.q[state][action]);
    agent.position=next;agent.last=reward;agent.total+=reward;agent.steps++;agent.done=terminal||agent.steps>=20;
    agent.status=`${state} → ${next} · ödül ${reward>0?'+':''}${reward}. ${terminal?'Hedefe ulaşıldı.':agent.done?'20 adım sınırı: bölüm kesildi.':'Sonraki eylemi seç.'}`;
  }
  function runEpisode(learn){beginEpisode();while(!agent.done){const action=learn&&random()<.3?Math.floor(random()*2):agent.q[agent.position][1]>agent.q[agent.position][0]?1:0;move(action,learn);}if(learn)agent.episodes++;}
  function renderAgent(){
    $('agentTrack').replaceChildren(...Array.from({length:5},(_,i)=>{const cell=document.createElement('div');cell.className=`track-cell${i===4?' is-goal':''}${i===agent.position?' is-agent':''}`;const number=document.createElement('small');number.textContent=i;const label=document.createElement('span');label.textContent=i===agent.position?'AJAN':i===4?'HEDEF':'·';cell.append(number,label);return cell;}));
    $('lastReward').textContent=agent.last;$('totalReward').textContent=agent.total;$('agentPhase').textContent=`ÖĞRENİLEN BÖLÜM: ${agent.episodes}`;$('agentStatus').textContent=agent.status;
    const table=document.createElement('table'),caption=document.createElement('caption');caption.textContent='Öğrenilen Q değerleri · α = 0,7 · γ = 0,9';const head=document.createElement('thead'),header=document.createElement('tr');
    for(const text of ['Eylem / durum','0','1','2','3','4']){const th=document.createElement('th');th.scope='col';th.textContent=text;header.append(th);}head.append(header);const body=document.createElement('tbody');
    for(const [action,title] of [[0,'← Sol'],[1,'Sağ →']]){const row=document.createElement('tr'),th=document.createElement('th');th.scope='row';th.textContent=title;row.append(th);for(let state=0;state<5;state++){const td=document.createElement('td');td.textContent=agent.q[state][action].toLocaleString('tr-TR',{minimumFractionDigits:1,maximumFractionDigits:1});td.dataset.q=agent.q[state][action];row.append(td);}body.append(row);}table.append(caption,head,body);$('qValues').replaceChildren(table);
    $('moveLeft').disabled=$('moveRight').disabled=agent.done;$('undoAgent').disabled=!history.length;$('trainEpisodes').disabled=agent.episodes>=100;
  }
  function renderNotes(){const [title,duration,body,action]=notes[scene-1];$('notesSceneTitle').textContent=`${pad(scene)} — ${title}`;$('notesDuration').textContent=`${duration} SN / HEDEF`;$('notesBody').textContent=body;$('notesAction').textContent=action;}
  function render(){
    document.querySelectorAll('.scene').forEach(section=>{const active=Number(section.dataset.index)===scene;section.hidden=!active;section.inert=!active;section.classList.toggle('active',active);});
    $('app').dataset.scene=scene;$('currentSceneCount').textContent=pad(scene);$('progressLine').style.width=`${scene*10}%`;$('prevButton').disabled=scene===1;$('nextButton').disabled=scene===10;$('scenePicker').value=scene;window.history.replaceState(null,'',`#${pad(scene)}`);renderPlot();renderAgent();renderNotes();$('announcer').textContent=`Sahne ${scene}: ${notes[scene-1][0]}`;
  }
  function navigate(direction){if(scene===3&&(direction>0&&step<2||direction<0&&step>0))step+=direction;else{scene=Math.max(1,Math.min(10,scene+direction));if(scene===3)step=direction>0?0:2;}render();}
  $('prevButton').addEventListener('click',()=>navigate(-1));$('nextButton').addEventListener('click',()=>navigate(1));$('scenePicker').addEventListener('change',event=>{scene=Number(event.target.value);step=0;render();});
  document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.step);renderPlot();}));
  document.querySelectorAll('[data-labels]').forEach(b=>b.addEventListener('click',()=>{labelMode=b.dataset.labels;renderPlot();}));
  $('queryX').addEventListener('input',event=>{queryX=Number(event.target.value);renderPlot();});$('resetSupervised').addEventListener('click',()=>{queryX=45;labelMode='clean';renderPlot();});
  document.querySelectorAll('[data-k]').forEach(b=>b.addEventListener('click',()=>{k=Number(b.dataset.k);clusterRound=0;renderPlot();}));
  $('clusterStep').addEventListener('click',()=>{clusterRound=Math.min(8,clusterRound+1);renderPlot();});$('clusterBack').addEventListener('click',()=>{clusterRound=Math.max(0,clusterRound-1);renderPlot();});$('resetClusters').addEventListener('click',()=>{clusterRound=0;renderPlot();});
  $('spreadStep').addEventListener('click',()=>{spreadRound=Math.min(20,spreadRound+1);renderPlot();});$('spreadBack').addEventListener('click',()=>{spreadRound=Math.max(0,spreadRound-1);renderPlot();});$('resetSpread').addEventListener('click',()=>{spreadRound=0;renderPlot();});$('wrongSeed').addEventListener('change',()=>{spreadRound=0;renderPlot();});
  for(const [id,action] of [['moveLeft',0],['moveRight',1]])$(id).addEventListener('click',()=>{if(agent.done)return;remember();move(action,true);renderAgent();});
  $('newEpisode').addEventListener('click',()=>{remember();beginEpisode();agent.status='Yeni başlangıç. Öğrenilmiş Q değerleri korundu.';renderAgent();});
  $('trainEpisodes').addEventListener('click',()=>{remember();const count=Math.min(10,100-agent.episodes);for(let i=0;i<count;i++)runEpisode(true);agent.status=`${count} bölüm öğrenildi; son bölüm toplamı ${agent.total}. %30 keşif, en fazla 20 adım/bölüm.`;renderAgent();});
  $('testPolicy').addEventListener('click',()=>{remember();runEpisode(false);agent.status=`Politika denemesi: ${agent.position===4?'hedefe ulaştı':'20 adım sınırında durdu'}. Toplam ${agent.total}. Q değerleri değiştirilmedi.`;renderAgent();});
  $('undoAgent').addEventListener('click',()=>{if(history.length)agent=history.pop();renderAgent();});$('resetAgent').addEventListener('click',()=>{agent=freshAgent();history.length=0;renderAgent();});
  $('replayPresentation').addEventListener('click',()=>{scene=1;step=0;labelMode='clean';queryX=45;k=2;clusterRound=0;spreadRound=0;$('wrongSeed').checked=false;agent=freshAgent();history.length=0;render();$('nextButton').focus();});
  function toggleNotes(){if($('notesDrawer').open)$('notesDrawer').close();else{$('publicationDetails').open=false;$('notesDrawer').showModal();$('notesToggle').setAttribute('aria-expanded','true');}}
  $('notesToggle').addEventListener('click',toggleNotes);$('notesClose').addEventListener('click',()=>$('notesDrawer').close());$('notesDrawer').addEventListener('close',()=>$('notesToggle').setAttribute('aria-expanded','false'));
  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('announcer').textContent='Bu tarayıcıda tam ekran açılamadı.';}}
  $('fullscreenToggle').addEventListener('click',fullscreen);document.addEventListener('fullscreenchange',()=>$('fullscreenToggle').setAttribute('aria-label',document.fullscreenElement?'Tam ekrandan çık (F)':'Tam ekran modunu aç (F)'));
  window.addEventListener('keydown',event=>{const target=event.target instanceof Element?event.target:document.activeElement;if(event.key==='Escape'&&$('publicationDetails').open){$('publicationDetails').open=false;$('publicationDetails').querySelector('summary').focus();return;}if(event.altKey||event.ctrlKey||event.metaKey||target.closest('input,textarea,select,summary,[contenteditable="true"]')||$('publicationDetails').open)return;const key=event.key.toLowerCase();if(key===' '&&target.closest('button,a'))return;if(['arrowright','pagedown',' ','arrowleft','pageup','home','end','n','f'].includes(key))event.preventDefault();if(['arrowright','pagedown',' '].includes(key))navigate(1);else if(['arrowleft','pageup'].includes(key))navigate(-1);else if(key==='home'||key==='end'){scene=key==='home'?1:10;render();}else if(key==='n')toggleNotes();else if(key==='f')fullscreen();});
  render();
})();
