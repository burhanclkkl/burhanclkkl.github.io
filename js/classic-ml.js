(() => {
  'use strict';
  const M=window.ClassicML,config=JSON.parse(document.getElementById('classicConfig').textContent),$=id=>document.getElementById(id),SVG='http://www.w3.org/2000/svg';
  if(!M)return;
  const defaults=()=>({task:config.part===3?'groups':'number',qx:48,qy:54,area:90,outlier:false,threshold:50,neighbors:3,linkPresent:false,campaignPresent:false,C:1,contradiction:false,method:'logistic',depth:2,noisy:false,trees:7,seed:1,rate:.3,boostRound:0,lambda:0,growth:'leaf',encoding:'ordered',flipTarget:false,k:2,clusterRound:0,eps:.13,minPts:3,clusterMethod:'kmeans',angle:0,optimal:false,scaleY:false});
  let state=defaults(),scene=Number(location.hash.slice(1));if(!Number.isInteger(scene)||scene<1||scene>config.scenes.length)scene=1;
  const cache=new Map(),cached=(key,make)=>{if(!cache.has(key))cache.set(key,make());return cache.get(key);};
  const fmt=(v,d=2)=>Number(v).toLocaleString('tr-TR',{maximumFractionDigits:d,minimumFractionDigits:0});
  const plot=$('plotContent'),result=$('classicResult'),detail=$('classicDetail'),limit=$('classicLimit');
  const node=(tag,attrs={},text)=>{const el=document.createElementNS(SVG,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;};
  let domain=[0,1,0,1],layer;
  const xy=p=>[50+(p[0]-domain[0])/(domain[1]-domain[0])*410,295-(p[1]-domain[2])/(domain[3]-domain[2])*260];
  function text(x,y,value,cls='plot-label'){plot.append(node('text',{x,y,class:cls},value));}
  function line(a,b,cls='plot-model'){const p=xy(a),q=xy(b);layer.append(node('line',{x1:p[0],y1:p[1],x2:q[0],y2:q[1],class:cls}));}
  function axes(bounds=[0,1,0,1],xlabel='Bağlantı puanı',ylabel='Kampanya puanı',tickScale=1){
    domain=bounds;plot.replaceChildren();const defs=node('defs'),clip=node('clipPath',{id:'classicClip'});clip.append(node('rect',{x:50,y:35,width:410,height:260}));defs.append(clip);plot.append(defs);
    plot.append(node('path',{d:'M50 35 V295 H460',class:'plot-axis'}));text(300,329,xlabel);text(50,20,ylabel);text(50,313,fmt(bounds[0]*tickScale));text(425,313,fmt(bounds[1]*tickScale));layer=node('g',{'clip-path':'url(#classicClip)'});plot.append(layer);
  }
  function point(p,label='',cls='point-normal',big=false){const [x,y]=xy(p),g=node('g',{class:cls});g.append(node('circle',{cx:x,cy:y,r:big?9:6}));if(label)g.append(node('text',{x:label==='×'?x:x+9,y:label==='×'?y+4:y-8,class:'plot-label',...(label==='×'?{'text-anchor':'middle'}:{})},label));layer.append(g);return g;}
  function queryPoint(p){const [x,y]=xy(p);layer.append(node('path',{d:`M${x} ${y-10} l10 10 -10 10 -10 -10Z`,class:'query-mark'}));}
  function centers(values){values.forEach((p,i)=>{const [x,y]=xy(p);layer.append(node('path',{d:`M${x-7} ${y-7} l14 14 M${x-7} ${y+7} l14 -14`,class:'center-mark'}));text(x+10,y-10,String(i+1));});}
  function regions(predict){for(let i=0;i<16;i++)for(let j=0;j<12;j++){const c=predict([(i+.5)/16,(j+.5)/12]);layer.append(node('rect',{x:50+i*410/16,y:35+(11-j)*260/12,width:410/16+.5,height:260/12+.5,class:`region-${c}`}));}}
  function table(headers,rows){const t=document.createElement('table'),head=document.createElement('thead'),tr=document.createElement('tr');headers.forEach(h=>{const th=document.createElement('th');th.scope='col';th.textContent=h;tr.append(th);});head.append(tr);const body=document.createElement('tbody');rows.forEach(row=>{const tr=document.createElement('tr');row.forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td);});body.append(tr);});t.append(head,body);detail.replaceChildren(t);}
  function say(value,extra='',warning='Temsili küçük veri · gerçek model benchmarkı değildir.'){result.textContent=value;detail.textContent=extra;limit.textContent=warning;}
  const q=()=>[state.qx/100,state.qy/100];
  const msgRows=()=>state.contradiction?[...M.messages,[.65,.75,0]]:M.messages;
  function classification(kind,comparing=false){
    const data=kind==='svm'?msgRows():M.messages;let predict,description,score,neighbors=[];
    if(kind==='knn'){predict=p=>M.knn(data,p,state.neighbors).prediction;const answer=M.knn(data,q(),state.neighbors);neighbors=answer.neighbors;score=answer.prediction;description=`${answer.votes} spam / ${state.neighbors-answer.votes} normal oyu`;
    }else if(kind==='bayes'){predict=p=>M.bayes(data,p).prediction;const p=comparing?q():[state.linkPresent?.8:.2,state.campaignPresent?.8:.2],answer=M.bayes(data,p);score=answer.prediction;description=`Model desteği: spam %${fmt(answer.p*100,1)}; normal %${fmt((1-answer.p)*100,1)}`;
    }else if(kind==='svm'){const model=cached(`svm-${state.C}-${state.contradiction}`,()=>M.svm(data,state.C));predict=model.predict;const v=model.score(q());score=model.predict(q());description=`Ham skor: ${fmt(v,3)} · olasılık değildir`;
    }else{const model=cached('logistic',()=>M.logistic(data));predict=p=>Number(model.predict(p)>=state.threshold/100);const p=model.predict(q());score=p>=state.threshold/100?1:0;description=`Spam olasılığı tahmini %${fmt(p*100,1)} · eşik %${state.threshold}`;}
    axes([0,1,0,1],'Bağlantı puanı / 0–100','Kampanya puanı / 0–100',100);regions(predict);
    if(kind==='logistic'||kind==='svm'){
      const model=kind==='logistic'?cached('logistic',()=>M.logistic(data)):cached(`svm-${state.C}-${state.contradiction}`,()=>M.svm(data,state.C));
      const w=kind==='logistic'?model.w:[model.w[0]-model.w[1]-model.w[2],2*model.w[1],2*model.w[2]];
      for(const threshold of kind==='svm'?[-1,0,1]:[Math.log(state.threshold/(100-state.threshold))])if(Math.abs(w[2])>1e-9)line([0,(threshold-w[0])/w[2]],[1,(threshold-w[0]-w[1])/w[2]],kind==='svm'&&threshold!==0?'plot-margin':'plot-model');
    }
    data.forEach((p,i)=>{const item=point(p,p[2]?'S':'N',p[2]?'point-spam':'point-normal');if(neighbors.some(n=>n.i===i))item.classList.add('is-neighbor');});
    const selected=kind==='bayes'&&!comparing?[state.linkPresent?.8:.2,state.campaignPresent?.8:.2]:q();queryPoint(selected);
    say(`Yeni örnek → ${score?'SPAM':'NORMAL'}. ${description}`,kind==='bayes'?'Puanlar ≥50 ise özellik 1, değilse 0. Bernoulli olasılıkları, sınıf ön olasılıkları ve +1 yumuşatma hesaplanır.':kind==='knn'?'Vurgulu noktalar hesaplanan en yakın komşulardır. Oylar eşit ağırlıklı; uzaklık Öklid uzaklığıdır.':kind==='svm'?'Doğrusal hinge kaybı ve ağırlık cezası, 1.600 deterministik gradyan adımıyla yaklaşık çözülür. Kesik çizgiler ±1 marjıdır.':'Model lojistik kayıpla eğitildi. Eşik, eğitim katsayılarını değiştirmeden sınıf kararını değiştirir.');
    $('benchMode').textContent=kind==='compare'?state.method:kind.toUpperCase();
  }
  function housePlot(fit,data){axes([40,140,0,500],'Alan / m²','Fiyat puanı / temsili');data.forEach(p=>{line(p,[p[0],fit.predict(p[0])],'plot-residual');point(p,'','point-normal');});for(let x=40;x<140;x+=1)line([x,fit.predict(x)],[x+1,fit.predict(x+1)]);queryPoint([state.area,fit.predict(state.area)]);}
  function drawIntro(){
    if(config.part===3){if(state.task==='projection'){drawPca();return;}drawClusters('kmeans',true);return;}
    plot.replaceChildren();const numerical=state.task==='number';text(50,65,numerical?'GİRDİ / ALAN: 90 m²':'GİRDİ / MESAJ PUANLARI','diagram-small');text(50,140,numerical?'Doğrusal ilişkiyi öğren':'Etiketli örneklerden öğren','diagram-large');text(50,200,'↓','diagram-large');const answer=numerical?fmt(M.linear(M.houses).predict(90)):cached('logistic',()=>M.logistic(M.messages)).predict(q())>=.5?'SPAM':'NORMAL';text(50,265,`ÇIKTI / ${answer}`,'diagram-large');
    say(numerical?'Hedef sayısal bir fiyat puanı.':'Hedef, önceden tanımlı iki sınıftan biri.',numerical?'Örnek değer gerçek konut fiyatı değildir.':'N / normal, S / spam. Siyah işaret yeni örnektir.');
  }
  function drawTree(kind){
    const noisy=kind==='overfit'&&state.noisy,data=noisy?[...M.messages,[.72,.72,0]]:M.messages,depth=state.depth;
    const model=kind==='forest'?cached(`forest-${state.trees}-${state.seed}`,()=>M.forest(data,state.trees,state.seed)):cached(`tree-${depth}-${noisy}`,()=>M.tree(data,depth));
    const predict=kind==='forest'?model.predict:p=>M.treePredict(model,p);
    axes([0,1,0,1],'Bağlantı puanı / 0–100','Kampanya puanı / 0–100',100);regions(predict);data.forEach(p=>point(p,p[2]?'S':'N',p[2]?'point-spam':'point-normal'));queryPoint(q());
    const control=[[.7,.7,1],[.74,.74,1],[.15,.25,0],[.86,.76,1]];
    say(`Yeni örnek → ${predict(q())?'SPAM':'NORMAL'}.`,kind==='overfit'?`Eğitim: ${data.filter(p=>predict(p)===p[2]).length}/${data.length} · Ayrı kontrol: ${control.filter(p=>predict(p)===p[2]).length}/${control.length}. Bu çok küçük kontrol kümesi genelleme ölçümü değildir.`:'');
    if(kind==='forest'){const votes=model.votes(q());table(['Ağaç','Oy'],votes.map((v,i)=>[i+1,v?'Spam':'Normal']));result.textContent+=` ${votes.filter(Boolean).length}/${votes.length} spam oyu.`;}
    else{const path=M.treePath(model,q()),list=document.createElement('ol');for(const s of path.steps){const li=document.createElement('li');li.textContent=`${s.feature===0?'Bağlantı':'Kampanya'} puanı ≤ ${fmt(s.threshold*100,1)}? ${s.left?'Evet':'Hayır'}`;list.append(li);}const leaf=document.createElement('li');leaf.textContent=`Yaprak: ${path.prediction?'spam':'normal'} · ${path.count} eğitim kaydı`;list.append(leaf);detail.append(list);}
    $('benchMode').textContent=kind==='forest'?`${state.trees} AĞAÇ`:`DERİNLİK ≤ ${depth}`;
  }
  function drawBoost(){const model=M.boosting(M.houses,state.boostRound,state.rate);housePlot(model,M.houses);const mse=M.mean(M.houses.map(p=>(p[1]-model.predict(p[0]))**2));say(`${state.boostRound} küçük ağaç · eğitim ortalama kare hatası ${fmt(mse,1)}`,`Başlangıç ortalaması ${fmt(model.base)}. Tahmin = başlangıç + ${fmt(state.rate)} × ağaç düzeltmeleri. Eğitim kaybı, yeni veride kalite garantisi değildir.`);$('benchMode').textContent=`AŞAMA ${state.boostRound}/8`;}
  function drawLeaf(){
    const value=90/(3+state.lambda);plot.replaceChildren();text(40,65,'ARTIKLAR / 40 + 20 + 30','diagram-small');text(40,125,`w = 90 / (3 + ${state.lambda})`,'diagram-large');text(40,185,`YAPRAK DÜZELTMESİ = ${fmt(value)}`,'diagram-medium');plot.append(node('rect',{x:40,y:230,width:value/30*400,height:24,class:'leaf-bar'}));
    say(`λ = ${state.lambda} → düzeltme ${fmt(value)}.`,`Bu özel kare kayıp örneğinde H=3 ve −G=90. λ değişince ağırlık cezası değişir; artıklar aynıdır.`,'Basitleştirilmiş tek yaprak hesabı · tam XGBoost kütüphanesi veya eğitim çalıştırılmaz.');$('benchMode').textContent='XGBOOST / BİR HESAP';
  }
  function drawGrowth(){
    plot.replaceChildren();const gains=[3,9,7],depths=[1,2,2],chosen=state.growth==='leaf'?gains.indexOf(Math.max(...gains)):depths.indexOf(Math.min(...depths));
    gains.forEach((gain,i)=>{const x=45+i*155;plot.append(node('line',{x1:x+45,y1:45,x2:x+45,y2:80+depths[i]*30,class:'plot-axis'}));plot.append(node('rect',{x,y:80+depths[i]*30,width:100,height:58,rx:4,class:i===chosen?'chosen-leaf':'other-leaf'}));text(x+10,114+depths[i]*30,`Yaprak ${i+1}`);text(x,240,`Kazanç: ${gain}`);text(x,265,`Derinlik: ${depths[i]}`);});
    say(`Sıradaki aday: yaprak ${chosen+1}.`,state.growth==='leaf'?'Verili adaylar içinde en yüksek kazanç 9.':'Verili adaylar içinde en sığ derinlik 1.','Verili temsili kazançlarla büyüme sırası şeması · gerçek LightGBM modeli veya hız testi değildir.');$('benchMode').textContent='LIGHTGBM / BÜYÜME FİKRİ';
  }
  function drawCategory(){
    const rows=[{category:'A',y:state.flipTarget?0:1},{category:'B',y:0},{category:'A',y:1},{category:'C',y:0},{category:'B',y:1}],ordered=state.encoding==='ordered',values=M.categoryStats(rows,ordered);
    plot.replaceChildren();text(40,65,ordered?'YALNIZCA ÖNCEKİ KAYITLAR':'KENDİ HEDEFİ DE HESAPTA','diagram-small');values.forEach((v,i)=>{const y=100+i*42;text(40,y+12,`${i+1} / ${rows[i].category}`);plot.append(node('rect',{x:130,y,width:300*v,height:19,class:ordered?'category-bar':'leaky-bar'}));text(445,y+13,fmt(v));});
    say(ordered?'Her kayıt için önceki aynı kategori kayıtları kullanılır.':'Sızıntı: kaydın kendi hedefi kendi özelliğine girdi.','', 'Basitleştirilmiş sıralı hedef istatistiği · tam CatBoost modeli çalıştırılmaz. Ön değer 0,5; yumuşatma ağırlığı 1.');table(['Kayıt','Kategori','Hedef','Özellik'],rows.map((r,i)=>[i+1,r.category,r.y,fmt(values[i],3)]));result.classList.toggle('is-warning',!ordered);$('benchMode').textContent='CATBOOST / KATEGORİ FİKRİ';
  }
  function drawClusters(kind,intro=false){
    let model,db=kind==='dbscan'||kind==='clusterCompare'&&state.clusterMethod==='dbscan';
    if(db)model=M.dbscan(M.rings,kind==='clusterCompare'?.13:state.eps,kind==='clusterCompare'?3:state.minPts);
    else model=M.kmeans(M.rings,kind==='clusterCompare'||intro?2:state.k,kind==='clusterCompare'||intro?8:state.clusterRound);
    axes([0,1,0,1],'Özellik 1','Özellik 2');M.rings.forEach((p,i)=>{const c=model.labels[i],g=point(p,c<0?'×':String(c+1),c<0?'point-noise':`point-cluster-${c%3}`);if(db&&model.core[i])g.classList.add('is-core');});if(!db)centers(model.centers);
    say(db?`${model.groups} küme · ${model.noise} gürültü noktası.`:`${kind==='clusterCompare'||intro?2:state.k} merkez · ${kind==='clusterCompare'||intro?8:state.clusterRound} güncelleme.`,db?'Kalın çerçeve: çekirdek. ×: gürültü. minPts hesabına noktanın kendisi dahil.':'× işaretleri merkezdir. Nokta üzerindeki numara küme atamasıdır; doğrulanmış sınıf değildir.');$('benchMode').textContent=db?'DBSCAN':'K-MEANS';
  }
  function drawPca(){
    const scale=state.scaleY?10:1,fit=M.pca(M.correlated,scale,state.optimal?null:state.angle*Math.PI/180),bound=Math.max(...fit.z.flat().map(Math.abs))*1.25;
    axes([-bound*410/260,bound*410/260,-bound,bound],'Özellik 1 / merkezlenmiş',`Özellik 2 × ${scale}`);const axis=fit.axis;line([-axis[0]*bound*1.4,-axis[1]*bound*1.4],[axis[0]*bound*1.4,axis[1]*bound*1.4]);fit.z.forEach((p,i)=>{line(p,fit.projected[i],'plot-residual');point(p,'','point-normal');point(fit.projected[i],'','point-projected');});
    say(`Korunan varyans: %${fmt(fit.fraction*100,1)} · yön ${fmt(fit.theta*180/Math.PI,1)}°`, 'Lila çerçeveli noktalar merkezlenmiş veri, küçük turuncu noktalar bir eksene izdüşümdür. Kesik çizgi atılan dik bileşeni gösterir.','İki boyutlu gerçek kovaryans/özvektör hesabı · korunan varyans bir görev doğruluğu değildir.');$('benchMode').textContent=state.optimal?'PCA / EN YÜKSEK VARYANS':'ELLE SEÇİLEN EKSEN';
  }
  function summary(){plot.replaceChildren();['PROBLEMİ TANIMLA','VERİYİ HAZIRLA','AYRI VERİDE DEĞERLENDİR'].forEach((label,i)=>{text(40,65+i*95,label,i===1?'diagram-medium':'diagram-small');if(i<2)text(40,110+i*95,'↓','diagram-large');});say('Yöntem adından önce varsayımı ve değerlendirmeyi düşün.','Bu sayfadaki bütün deneyleri yeniden başlatabilirsin.');const button=document.createElement('button');button.type='button';button.id='replayPresentation';button.className='replay-button';button.textContent='BAŞTAN BAŞLA ↺';button.addEventListener('click',()=>{state=defaults();scene=1;render();});detail.append(button);}
  function renderExperiment(){
    const kind=config.scenes[scene-1].kind;result.classList.remove('is-warning');detail.replaceChildren();$('benchMode').textContent='';
    if(kind==='intro')drawIntro();else if(kind==='linear'){const data=state.outlier?[...M.houses,[95,430]]:M.houses,fit=M.linear(data);housePlot(fit,data);say(`${state.area} m² → ${fmt(fit.predict(state.area),1)} temsili fiyat puanı.`,`Eğim: ${fmt(fit.slope,3)} · başlangıç: ${fmt(fit.intercept,2)}. Uç değer seçimi eğitim doğrusunu yeniden hesaplar.`);$('benchMode').textContent='EN KÜÇÜK KARELER';}
    else if(['logistic','knn','bayes','svm','compare'].includes(kind))classification(kind==='compare'?state.method:kind,kind==='compare');
    else if(['tree','depth','overfit','forest'].includes(kind))drawTree(kind);else if(kind==='boost')drawBoost();else if(kind==='xgboost')drawLeaf();else if(kind==='lightgbm')drawGrowth();else if(kind==='catboost')drawCategory();else if(['kmeans','dbscan','clusterCompare'].includes(kind))drawClusters(kind);else if(['pca','scale'].includes(kind))drawPca();else summary();
    document.querySelectorAll('[data-control]').forEach(control=>{const value=state[control.dataset.control];if(control.type==='checkbox')control.checked=value;else control.value=value;});
    document.querySelectorAll('[data-output]').forEach(out=>out.textContent=fmt(state[out.dataset.output]));
    document.querySelectorAll('[data-action]').forEach(b=>{b.disabled=b.dataset.action==='boostNext'?state.boostRound>=8:b.dataset.action==='boostBack'?state.boostRound===0:b.dataset.action==='clusterNext'?state.clusterRound>=8:b.dataset.action==='clusterBack'?state.clusterRound===0:false;});
    $('classicPlot').dataset.kind=kind;$('classicPlot').querySelector('desc').textContent=result.textContent+' '+limit.textContent;
  }
  function render(){document.querySelectorAll('.scene').forEach(section=>{const active=Number(section.dataset.index)===scene;section.hidden=!active;section.inert=!active;section.classList.toggle('active',active);});$('app').dataset.scene=scene;$('currentSceneCount').textContent=String(scene).padStart(2,'0');$('scenePicker').value=scene;$('progressLine').style.width=`${scene/config.scenes.length*100}%`;$('prevButton').disabled=scene===1;$('nextButton').disabled=scene===config.scenes.length;history.replaceState(null,'',`#${String(scene).padStart(2,'0')}`);$('notesSceneTitle').textContent=config.scenes[scene-1].title;$('notesBody').textContent=config.scenes[scene-1].note;$('notesAction').textContent=config.scenes[scene-1].action;$('notesDuration').textContent='EK AYRINTI / KENDİ HIZINDA';$('announcer').textContent=`Sahne ${scene}: ${config.scenes[scene-1].title}`;renderExperiment();}
  document.querySelectorAll('[data-control]').forEach(control=>control.addEventListener(control.type==='range'?'input':'change',()=>{const key=control.dataset.control;state[key]=control.type==='checkbox'?control.checked:typeof state[key]==='number'?Number(control.value):control.value;if(key==='k')state.clusterRound=0;if(key==='angle')state.optimal=false;if(key==='scaleY')state.optimal=false;renderExperiment();}));
  document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>{const action=button.dataset.action;if(action==='boostNext')state.boostRound=Math.min(8,state.boostRound+1);if(action==='boostBack')state.boostRound=Math.max(0,state.boostRound-1);if(action==='clusterNext')state.clusterRound=Math.min(8,state.clusterRound+1);if(action==='clusterBack')state.clusterRound=Math.max(0,state.clusterRound-1);if(action==='pcaOptimal'){state.optimal=true;state.angle=Math.round(M.pca(M.correlated,state.scaleY?10:1).optimal*180/Math.PI);}renderExperiment();}));
  $('resetCurrent').addEventListener('click',()=>{state=defaults();renderExperiment();});
  function navigate(delta){scene=Math.max(1,Math.min(config.scenes.length,scene+delta));render();}
  $('nextButton').addEventListener('click',()=>navigate(1));$('prevButton').addEventListener('click',()=>navigate(-1));$('scenePicker').addEventListener('change',event=>{scene=Number(event.target.value);render();});
  function notes(){if($('notesDrawer').open)$('notesDrawer').close();else{$('publicationDetails').open=false;$('notesDrawer').showModal();$('notesToggle').setAttribute('aria-expanded','true');}}
  $('notesToggle').addEventListener('click',notes);$('notesClose').addEventListener('click',()=>$('notesDrawer').close());$('notesDrawer').addEventListener('close',()=>$('notesToggle').setAttribute('aria-expanded','false'));
  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('announcer').textContent='Bu tarayıcıda tam ekran açılamadı.';}}
  $('fullscreenToggle').addEventListener('click',fullscreen);
  window.addEventListener('keydown',event=>{const target=event.target instanceof Element?event.target:document.activeElement;if(event.key==='Escape'&&$('publicationDetails').open){$('publicationDetails').open=false;$('publicationDetails').querySelector('summary').focus();return;}if(event.altKey||event.ctrlKey||event.metaKey||target.closest('input,textarea,select,summary,[contenteditable="true"]')||$('publicationDetails').open)return;const key=event.key.toLowerCase();if(key===' '&&target.closest('button,a'))return;if(['arrowright','pagedown',' ','arrowleft','pageup','home','end','n','f'].includes(key))event.preventDefault();if(['arrowright','pagedown',' '].includes(key))navigate(1);else if(['arrowleft','pageup'].includes(key))navigate(-1);else if(key==='home'||key==='end'){scene=key==='home'?1:config.scenes.length;render();}else if(key==='n')notes();else if(key==='f')fullscreen();});
  render();
})();
