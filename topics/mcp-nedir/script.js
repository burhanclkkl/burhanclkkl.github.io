(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const SVG = 'http://www.w3.org/2000/svg';
  const PROTOCOL = '2026-07-28';
  const app = $('#app'), svg = $('#mcpDiagram'), figure = $('.mcp-figure');
  const packet = $('#movingPacket'), activePath = $('#activePath'), trail = $('#packetTrail');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const COLORS = { lilac:'#AE91E8', orange:'#FF975E', green:'#51BA93', red:'#E96B72' };
  const NAMES = { user:'Kullanıcı', host:'AI Host', llm:'LLM', client:'MCP Client', server:'MCP Server', source:'Örnek dosya' };
  const NODE_DESCRIPTIONS = {
    user:'Soruyu yazan ve sonucu değerlendiren kişidir. Kullanıcı bu örnekte doğrudan MCP Server ile konuşmaz.',
    host:'Host, yapay zekâ uygulamasının tamamıdır. Bu çerçevede LLM ve MCP Client ayrı görevlerle birlikte bulunur; araç yürütme politikasını uygulama yönetir.',
    llm:'LLM, dil modelidir. Soru ve araç tanımlarından bir çağrı önerisi üretebilir; gelen araç sonucuyla son yanıtı oluşturabilir. MCP mesajını doğrudan bu kutu göndermez.',
    client:'MCP Client, Host içindeki protokol bileşenidir. Araç listesini ister, tools/call mesajını gönderir ve sonucu Host’a iletir.',
    server:'MCP Server, araç tanımlarını sunar ve çağrılan işlevi çalıştırır. Kendi API, dosya veya veritabanı bağlantısını kullanabilir.',
    source:'Bu düğüm yalnızca kurgusal örnek menü dosyasını temsil eder. Server’ın kaynağı okuması, Client–Server arasındaki MCP protokol hattından ayrı bir işlemdir.'
  };
  const TITLES = ['Yapay zekâ bugünkü menüyü nereden bilir?', 'Aralarında kim var?', 'Önce, hangi araçlar var?', 'Bu soruya hangi araç ulaşır?', 'Bir çağrı nelerden geçer?', 'Veri gelir. Yanıtı model kurar.', 'Hata nerede oluştu?'];
  const CATEGORIES = ['BİR SORU','MİMARİ','ARAÇ KEŞFİ','ARAÇ SEÇİMİ','CANLI AKIŞ','YANIT','HATA LABORATUVARI'];
  const CUES = ['Güncel bilgi, modelin içinde her zaman bulunmaz.', 'MCP bir model değil, ortak bir bağlantı protokolüdür.', 'tools/list → ad + açıklama + girdi şeması', 'Kararı model önerebilir; çağrıyı uygulama yürütür.', 'Client → Server: MCP. Server → dosya: kendi okuma işlemi.', 'Araç sonucu, kullanıcının gördüğü son yanıt değildir.', 'Yetki, girdi doğrulaması ve araç hatası farklı katmanlardadır.'];
  const SECONDS = [20,45,50,70,60,35,20];
  const dateParts = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part = key => dateParts.find(p => p.type === key).value;
  const demoDate = `${part('year')}-${part('month')}-${part('day')}`;
  const dateLabel = new Intl.DateTimeFormat('tr-TR', {timeZone:'Europe/Istanbul',day:'numeric',month:'long',year:'numeric'}).format(new Date());
  const argumentsForTool = { istenen_tarih:demoDate, lokasyon:'Saraçhane', kaynak_turu:'ornek_dosya' };
  const MENU = 'Mercimek Çorbası, Sebzeli Pilav, Mevsim Salata';
  const tool = { name:'yemek_listesini_getir', description:'İstenen tarih ve lokasyon için yalnızca örnek dosyadaki demo menüyü döndürür.', inputSchema:{ type:'object', properties:{ istenen_tarih:{type:'string',format:'date',pattern:'^\\d{4}-\\d{2}-\\d{2}$'}, lokasyon:{type:'string',enum:['Saraçhane']}, kaynak_turu:{type:'string',enum:['ornek_dosya']} },required:['istenen_tarih','lokasyon','kaynak_turu'],additionalProperties:false } };
  const meta = { 'io.modelcontextprotocol/protocolVersion':PROTOCOL, 'io.modelcontextprotocol/clientInfo':{name:'open-notes-demo',version:'1.0'}, 'io.modelcontextprotocol/clientCapabilities':{} };
  const request = (method, id, params={}) => ({jsonrpc:'2.0',id,method,params:{...params,_meta:meta}});
  const toolsListRequest = request('tools/list',3);
  const toolsListResponse = {jsonrpc:'2.0',id:3,result:{resultType:'complete',tools:[tool,{name:'kurum_duyurulari_getir',description:'Kurgusal duyuru örneklerini getirir.',inputSchema:{type:'object',properties:{},additionalProperties:false}}],ttlMs:300000,cacheScope:'public'}};
  const callRequest = request('tools/call',7,{name:tool.name,arguments:argumentsForTool});
  const callResponse = {jsonrpc:'2.0',id:7,result:{resultType:'complete',content:[{type:'text',text:`DEMO — ${demoDate} / Saraçhane: ${MENU}. Gerçek kurum menüsü değildir.`}],isError:false}};
  const errorResponse = {jsonrpc:'2.0',id:7,result:{resultType:'complete',content:[{type:'text',text:'DEMO: Örnek menü dosyası okunamadı.'}],isError:true}};
  const proposal = {layer:'host',kind:'model_tool_call_proposal',name:tool.name,arguments:argumentsForTool,note:'MCP isteği değildir; sağlayıcıya özgü biçimler değişebilir.'};
  const event = (label,from,to,tone,payload,done,options={}) => ({label,from,to,tone,payload,done,...options});
  const ROUTES = new Set(['user:llm','llm:user','llm:client','client:llm','client:server','server:client','server:source','source:server']);
  const state = {scene:0,step:0,playback:'idle',speed:1,failure:'access_denied'};
  let progress = 1, animation = null, auto = false, frame = 0, timer = 0;
  let width = 0, boxes = {}, routePaths = new Map(), nodeViews = new Map();
  let lastDialogOpener = null;
  const text = (selector,value) => { $(selector).textContent = value; };
  function sceneEvents(scene=state.scene) {
    const sent = event('tools/call','client','server','lilac',callRequest,'Server isteği aldı; bu örnekte girdiler doğrulandı.',{rpc:true});
    const reading = event('Dosyayı oku','server','source','orange',{layer:'server',operation:'read_example_file',source:'ornek_dosya',arguments:argumentsForTool},'Server kendi örnek dosyasına erişti. Bu hat MCP değildir.');
    const fileResult = event('Dosya verisi','source','server','green',{layer:'data_source',mode:'demo',menu:MENU},'Kurgusal menü dosyası okundu; sonuç Server’a döndü.');
    const result = event('Araç sonucu','server','client','green',callResponse,'Client araç sonucunu aldı; son kullanıcı yanıtı henüz yazılmadı.',{rpc:true});
    const hostResult = event('Host’a araç sonucu','client','llm','green',{layer:'host',tool_result:callResponse.result},'Host, araç sonucunu modele sundu.');
    if (scene===0) return [event('Kullanıcı sorusu','user','llm','orange',{layer:'user',message:'Saraçhane’de bugün yemekte ne var?'},'Host soruyu aldı. Yanıt için harici bilgi gerekiyor.')];
    if (scene===1) return [event('MCP protokol hattı','client','server','lilac',{kind:'architecture',note:'Client–Server bağlantısı; henüz araç çağrısı yok.'},'Vurgulanan hat MCP Client ile MCP Server arasındadır.',{connection:true})];
    if (scene===2) return [event('tools/list','client','server','lilac',toolsListRequest,'Server tools/list isteğini aldı.',{rpc:true}),event('Araç kataloğu','server','client','green',toolsListResponse,'Katalog Client’a geldi. Host, araç tanımlarını modele sunabilir.',{rpc:true})];
    if (scene===3) return [event('Modelin araç seçimi','llm','llm','orange',proposal,'Yemek aracı seçildi; bu henüz bir MCP isteği değildir.'),event('Host içi öneri','llm','client','orange',proposal,'Host izin ve girdi kontrollerinden sonra öneriyi Client’a aktardı.')];
    if (scene===4) return [sent,reading,fileResult,result,hostResult];
    if (scene===5) return [event('Son kullanıcı yanıtı','llm','user','green',{layer:'host',final_answer:`Saraçhane örnek menüsünde ${MENU} var. Bu menü örnektir; canlı kurum verisi değildir.`},'Örnek son yanıt kullanıcıya ulaştı. Demo uyarısı korunur.')];
    if (state.failure==='access_denied') return [event('Host izin engeli','client','client','red',{layer:'host',status:'access_denied',sent_to_server:false},'Host işlemi durdurdu. Server’a veya kaynağa paket gönderilmedi.')];
    if (state.failure==='invalid_args') return [event('Host girdi doğrulaması','client','client','red',{layer:'host',status:'invalid_date',field:'istenen_tarih',value:'28/10/2026',expected:'YYYY-MM-DD',sent_to_server:false},'Bu demoda tarih Host katmanında reddedildi. Server’a paket gitmedi.')];
    return [sent,reading,event('Okuma başarısız','source','server','red',{layer:'server',operation:'read_example_file',status:'failed',mode:'demo'},'Örnek dosya okunamadı; Server araç hatası oluşturuyor.'),event('isError: true','server','client','red',errorResponse,'Araç çalıştırma hatası Client’a döndü. Bu, JSON-RPC error nesnesi değildir.',{rpc:true})];
  }
  function currentEvent() { return sceneEvents()[state.step-1] || null; }
  function setPlayback(value) { state.playback=value; app.dataset.playback=value; }
  function stop() {
    cancelAnimationFrame(frame);clearTimeout(timer);frame=timer=0;animation=null;auto=false;
    setPlayback('idle');
  }
  function pause() {
    cancelAnimationFrame(frame);clearTimeout(timer);frame=timer=0;auto=false;
    if (animation || state.playback==='playing') setPlayback('paused');
    renderControls();
  }
  function notify(message) { text('#announcer',message); }
  function svgElement(tag,attributes={},content='') {
    const node=document.createElementNS(SVG,tag);
    for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));
    if(content)node.textContent=content;
    return node;
  }
  function makeNode(id,box,label,detail,parent) {
    const group=svgElement('g',{'data-node':id,class:'node-action',role:'button',tabindex:'0','aria-label':`${label}: görevini açıkla`});
    group.append(svgElement('title',{},NODE_DESCRIPTIONS[id]));
    group.append(svgElement('rect',{...box,rx:id==='host'?12:8,class:`node-box${id==='host'?' host-box':''}`}));
    if(id==='host') group.append(svgElement('text',{x:box.x+18,y:box.y+25,class:'host-label'},'AI HOST / UYGULAMA'));
    else {
      group.append(svgElement('text',{x:box.x+box.width/2,y:box.y+box.height/2-3,'text-anchor':'middle',class:'node-label'},label));
      group.append(svgElement('text',{x:box.x+box.width/2,y:box.y+box.height/2+18,'text-anchor':'middle',class:'node-detail'},detail));
    }
    parent.append(group);nodeViews.set(id,group);return group;
  }
  function addRoute(a,b,start,c1,c2,end,label,labelPoint) {
    const d=`M ${start[0]} ${start[1]} C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${end[0]} ${end[1]}`;
    const reverse=`M ${end[0]} ${end[1]} C ${c2[0]} ${c2[1]} ${c1[0]} ${c1[1]} ${start[0]} ${start[1]}`;
    routePaths.set(`${a}:${b}`,d);routePaths.set(`${b}:${a}`,reverse);
    $('#passivePaths').append(svgElement('path',{d,class:'wire'}));
    if(label) $('#diagramLabels').append(svgElement('text',{x:labelPoint[0],y:labelPoint[1],'text-anchor':'middle',class:'route-label'},label));
  }
  function layoutDiagram(force=false) {
    const nextWidth=Math.max(260,Math.floor(figure.clientWidth));
    if(!force && Math.abs(nextWidth-width)<1)return;
    width=nextWidth;const vertical=width<1180;
    svg.setAttribute('viewBox',`0 0 ${width} ${vertical?628:250}`);
    svg.setAttribute('role','group');
    $('#passivePaths').replaceChildren();$('#diagramNodes').replaceChildren();$('#diagramLabels').replaceChildren();
    routePaths.clear();nodeViews.clear();
    if(vertical) {
      const c=width/2;
      boxes={user:{x:c-90,y:14,width:180,height:52},host:{x:c-122,y:112,width:244,height:210},llm:{x:c-96,y:146,width:192,height:58},client:{x:c-96,y:236,width:192,height:58},server:{x:c-105,y:385,width:210,height:76},source:{x:c-105,y:525,width:210,height:76}};
      addRoute('user','llm',[c,66],[c,95],[c,116],[c,146],'',[0,0]);
      addRoute('llm','client',[c,204],[c,216],[c,224],[c,236],'',[0,0]);
      addRoute('client','server',[c,294],[c-38,329],[c+38,350],[c,385],'MCP',[c+44,349]);
      addRoute('server','source',[c,461],[c+35,480],[c-35,506],[c,525],'Dosya',[c+42,499]);
    } else {
      const m=(width-1150)/2;
      boxes={user:{x:m,y:100,width:150,height:62},host:{x:m+230,y:24,width:390,height:194},llm:{x:m+250,y:74,width:150,height:88},client:{x:m+450,y:74,width:150,height:88},server:{x:m+760,y:95,width:178,height:80},source:{x:m+1000,y:95,width:150,height:80}};
      addRoute('user','llm',[m+150,131],[m+185,131],[m+208,118],[m+250,118],'',[0,0]);
      addRoute('llm','client',[m+400,118],[m+420,100],[m+430,136],[m+450,118],'',[0,0]);
      addRoute('client','server',[m+600,118],[m+660,70],[m+700,180],[m+760,135],'MCP',[m+684,203]);
      addRoute('server','source',[m+938,135],[m+960,110],[m+978,160],[m+1000,135],'Dosya / API',[m+980,203]);
    }
    const host=makeNode('host',boxes.host,'AI Host','',$('#diagramNodes'));
    makeNode('user',boxes.user,'Kullanıcı','soruyu sorar',$('#diagramNodes'));
    makeNode('llm',boxes.llm,'LLM','önerir / yanıtlar',host);
    makeNode('client',boxes.client,'MCP Client','protokol mesajı',host);
    makeNode('server',boxes.server,'MCP Server','aracı çalıştırır',$('#diagramNodes'));
    makeNode('source',boxes.source,'Örnek dosya','canlı kurum verisi değil',$('#diagramNodes'));
    paintTransfer();
  }
  function paintTransfer() {
    const active=currentEvent();
    for(const [id,node] of nodeViews) {
      node.classList.toggle('is-chosen',id==='llm' && state.scene===3 && state.step>0);
      node.classList.toggle('arrived',!!active && active.to===id && progress>=1 && !reduced.matches);
      node.style.setProperty('--event-color',active?COLORS[active.tone]:COLORS.lilac);
    }
    const d=active && routePaths.get(`${active.from}:${active.to}`);
    if(!d) { activePath.setAttribute('d','');trail.setAttribute('d','');packet.setAttribute('hidden','');return; }
    activePath.setAttribute('d',d);trail.setAttribute('d',d);
    const color=COLORS[active.tone];activePath.setAttribute('stroke',color);trail.setAttribute('stroke',color);
    const length=activePath.getTotalLength();
    const amount=reduced.matches?1:Math.max(0,Math.min(1,progress));
    activePath.setAttribute('stroke-dasharray',String(length));
    activePath.setAttribute('stroke-dashoffset',String(length*(1-amount)));
    const point=activePath.getPointAtLength(length*amount);
    packet.setAttribute('transform',`translate(${point.x} ${point.y})`);
    packet.querySelector('circle').setAttribute('fill',color);
    packet.toggleAttribute('hidden',reduced.matches||!!active.connection);
    packet.setAttribute('aria-label',`${active.label}: ${NAMES[active.from]} → ${NAMES[active.to]}. İçeriği aç.`);
    text('#packetTooltip',`${active.label} · ${NAMES[active.from]} → ${NAMES[active.to]} · Temsili paket. Tıkla: JSON.`);
    trail.setAttribute('stroke-dasharray',`26 ${length}`);
    trail.setAttribute('stroke-dashoffset',String(-Math.max(0,length*amount-26)));
    trail.style.display=amount<1 && !reduced.matches && !active.connection?'':'none';
  }
  function status() {
    const active=currentEvent();const el=$('.event-summary');
    el.dataset.tone=active?.tone||'lilac';
    text('#eventKind',active?active.label.toLocaleUpperCase('tr-TR'):'ADIM BEKLENİYOR');
    text('#eventStatus',active?(progress>=1?active.done:`${NAMES[active.from]} → ${NAMES[active.to]} · ${active.label}`):CUES[state.scene]);
  }
  function renderControls() {
    const events=sceneEvents(),done=state.step>=events.length;
    text('#stepCount',`${String(state.step).padStart(2,'0')} / ${String(events.length).padStart(2,'0')}`);
    const first=['Soruyu gönder','Protokol hattını göster','Araçları listele','Aracı seç','Çağrıyı gönder','Son yanıtı gör','Hatayı dene'];
    const nextNames=state.scene===2?['Araçları listele','Kataloğu al']:state.scene===3?['Aracı seç','Client’a aktar']:null;
    const name=done?(state.scene===6?'Deney tamamlandı':'Sonraki sahne'):nextNames?nextNames[state.step]:state.step===0?first[state.scene]:'Sonraki adım';
    $('#advanceStep').replaceChildren(document.createTextNode(name+' '),Object.assign(document.createElement('span'),{textContent:'→'}));
    $('#advanceStep').disabled=done&&state.scene===6;
    $('#prevButton').disabled=state.scene===0&&state.step===0;
    $('#nextButton').disabled=done&&state.scene===6;
    $('#playFlow').disabled=done&&!animation;
    $('#playFlow').setAttribute('aria-pressed',String(auto));
    $('#pauseFlow').disabled=!auto&&!animation;
    $('#inspectPacket').disabled=!currentEvent()&&state.scene!==5;
  }
  function renderPacket() {
    const active=currentEvent()||(state.scene===5?{label:'Ham araç sonucu',from:'server',to:'client',tone:'green',payload:callResponse,rpc:true}:null);
    if(!active)return;
    text('#packetTitle',active.label);
    text('#packetDescription',active.done||'Bu mesaj yalnızca öğretici bir örnektir.');
    const facts=[['Gönderen',NAMES[active.from]],['Alıcı',NAMES[active.to]],['Katman',active.rpc?'MCP / JSON-RPC':active.connection?'Mimari bağlantı':'Host veya Server içi işlem'],['Gerçek ağ isteği','Hayır; yerel ve deterministik demo.']];
    if(active.rpc) facts.push(['Protokol',PROTOCOL]);
    const list=$('#packetFacts');list.replaceChildren();
    for(const [key,value] of facts)list.append(Object.assign(document.createElement('dt'),{textContent:key}),Object.assign(document.createElement('dd'),{textContent:value}));
    text('#payloadLabel',active.rpc?'Öğretici JSON-RPC mesajı':'Öğretici veri (MCP mesajı değildir)');
    text('#packetJSON',JSON.stringify(active.payload,null,2));
    const log=$('#eventLog');log.replaceChildren();
    sceneEvents().forEach((item,i)=>{const li=document.createElement('li');li.textContent=`${NAMES[item.from]} → ${NAMES[item.to]}: ${item.label}`;if(i===state.step-1)li.setAttribute('aria-current','step');log.append(li);});
  }
  function render() {
    app.dataset.scene=String(state.scene+1);app.dataset.step=String(state.step);app.dataset.failure=state.failure;
    text('#sceneNumber',String(state.scene+1).padStart(2,'0'));text('#sceneCategory',CATEGORIES[state.scene]);text('#sceneTitle',TITLES[state.scene]);text('#sceneCue',CUES[state.scene]);text('#currentSceneCount',String(state.scene+1).padStart(2,'0'));
    $('#scenePicker').value=String(state.scene+1);$('#progressLine').style.width=`${(state.scene+1)/7*100}%`;
    $('#toolCatalog').hidden=!((state.scene===2&&state.step>=2)||state.scene===3);
    $('#toolCatalog').classList.toggle('is-selected',state.scene===3&&state.step>0);
    $('#responseLab').hidden=state.scene!==5;
    $('#responseRaw').hidden=state.scene===5&&state.step>0;
    $('#finalAnswer').hidden=state.step===0;
    $$('[data-output]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.output===(state.step===0?'raw':'answer'))));
    $('#failureLab').hidden=state.scene!==6;
    $('#failureArgument').hidden=state.failure!=='invalid_args';
    $$('[data-failure]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.failure===state.failure)));
    $$('[data-speaker]').forEach(note=>{note.hidden=Number(note.dataset.speaker)!==state.scene+1;});
    text('#notesSceneTitle',`${String(state.scene+1).padStart(2,'0')} / ${CATEGORIES[state.scene]}`);text('#notesDuration',String(SECONDS[state.scene]));
    status();paintTransfer();renderControls();if($('#packetDialog').open)renderPacket();
    const hash=`#${String(state.scene+1).padStart(2,'0')}`;if(location.hash!==hash)history.replaceState(null,'',hash);
  }
  function complete() {
    progress=1;animation=null;frame=0;setPlayback(auto?'playing':'completed');
    status();paintTransfer();renderControls();
    if(auto && state.step<sceneEvents().length)timer=setTimeout(()=>advance(true),450/state.speed);
    else {auto=false;setPlayback('completed');renderControls();}
  }
  function tick(now) {
    if(!animation)return;
    if(reduced.matches){complete();return;}
    progress=Math.min(1,progress+(now-animation.last)*state.speed/900);animation.last=now;
    paintTransfer();
    if(progress>=1)complete();else frame=requestAnimationFrame(tick);
  }
  function advance(automatic=false) {
    const wantAuto=automatic;
    stop();auto=wantAuto;
    if(state.step>=sceneEvents().length){if(!automatic&&state.scene<6)goScene(state.scene+1);return;}
    state.step++;const active=currentEvent();progress=0;
    animation={last:performance.now()};setPlayback('playing');render();
    if(reduced.matches||!ROUTES.has(`${active.from}:${active.to}`)){complete();return;}
    frame=requestAnimationFrame(tick);
  }
  function next() {if(state.step<sceneEvents().length)advance();else if(state.scene<6)goScene(state.scene+1);}
  function previous() {
    stop();progress=1;
    if(state.step>0)state.step--;else if(state.scene>0){state.scene--;state.step=sceneEvents().length;}
    render();notify(`${state.scene+1}. sahne, ${state.step}. adım.`);
  }
  function goScene(index) {stop();state.scene=Math.max(0,Math.min(6,index));state.step=0;progress=1;render();notify(`${state.scene+1}. sahne. ${TITLES[state.scene]}`);}
  function play() {
    cancelAnimationFrame(frame);clearTimeout(timer);frame=timer=0;
    if(animation&&progress<1){auto=true;setPlayback('playing');animation.last=performance.now();frame=requestAnimationFrame(tick);renderControls();}
    else if(state.step<sceneEvents().length)advance(true);
  }
  function reset() {stop();state.step=0;progress=1;render();notify('Seçili sahne başlangıca döndü.');}
  function openDialog(dialog,opener) {pause();lastDialogOpener=opener||document.activeElement;dialog.showModal();}
  function inspect(opener) {if(currentEvent()||state.scene===5){renderPacket();openDialog($('#packetDialog'),opener);}}
  $('#advanceStep').addEventListener('click',next);$('#nextButton').addEventListener('click',next);$('#prevButton').addEventListener('click',previous);
  $('#playFlow').addEventListener('click',play);$('#pauseFlow').addEventListener('click',pause);$('#resetFlow').addEventListener('click',reset);
  $('#inspectPacket').addEventListener('click',event=>inspect(event.currentTarget));
  $('#flowSpeed').addEventListener('change',event=>{state.speed=Number(event.target.value);});
  $('#scenePicker').addEventListener('change',event=>goScene(Number(event.target.value)-1));
  $$('[data-failure]').forEach(button=>button.addEventListener('click',()=>{stop();state.failure=button.dataset.failure;state.step=0;progress=1;render();}));
  $$('[data-output]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.output==='raw')reset();else{stop();state.step=0;advance();}}));
  $('#menuTool').addEventListener('click',event=>{
    stop();renderPacket();text('#packetTitle','yemek_listesini_getir');text('#payloadLabel','Araç tanımı / inputSchema');text('#packetJSON',JSON.stringify(tool,null,2));text('#packetDescription','Bu tanım, modelin uygun aracı seçebilmesi için Host tarafından modele sunulabilir.');openDialog($('#packetDialog'),event.currentTarget);
  });
  packet.addEventListener('click',()=>inspect(packet));packet.addEventListener('keydown',event=>{if(event.key==='Enter'||event.code==='Space'){event.preventDefault();event.stopPropagation();inspect(packet);}});
  function showNode(target){const id=target?.dataset.node;if(!id)return;text('#nodeTitle',NAMES[id]);text('#nodeDescription',NODE_DESCRIPTIONS[id]);openDialog($('#nodeDialog'),target);}
  svg.addEventListener('click',event=>{if(!packet.contains(event.target))showNode(event.target.closest('[data-node]'));});
  svg.addEventListener('keydown',event=>{if(event.key==='Enter'||event.code==='Space'){const target=event.target.closest('[data-node]');if(target){event.preventDefault();event.stopPropagation();showNode(target);}}});
  $('#notesToggle').addEventListener('click',event=>{openDialog($('#notesDrawer'),event.currentTarget);$('#notesToggle').setAttribute('aria-expanded','true');});
  for(const [id,button] of [['packetDialog','packetClose'],['notesDrawer','notesClose'],['nodeDialog','nodeClose']]) {
    const dialog=$('#'+id);$('#'+button).addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{if(id==='notesDrawer')$('#notesToggle').setAttribute('aria-expanded','false');if(lastDialogOpener?.isConnected)lastDialogOpener.focus({preventScroll:true});});
  }
  $('#publicationDetails').addEventListener('toggle',()=>{if($('#publicationDetails').open)pause();});
  document.addEventListener('click',event=>{if(event.target.closest('[aria-controls="lesson-panel"]')&&document.body.classList.contains('lesson-explanation-open'))pause();});
  $('#fullscreenToggle').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('Tam ekran açılamadı. Sunum normal görünümde çalışmaya devam eder.');}});
  window.addEventListener('keydown',event=>{
    if(event.defaultPrevented||event.ctrlKey||event.altKey||event.metaKey)return;
    const dialog=document.querySelector('dialog[open]');
    if(dialog){if(event.key==='Escape'){event.preventDefault();dialog.close();}return;}
    if($('#publicationDetails').open){if(event.key==='Escape'){$('#publicationDetails').open=false;$('#publicationDetails summary').focus();}return;}
    if(document.querySelector('.lesson-panel[aria-modal="true"]'))return;
    if(document.activeElement?.matches('input,textarea,select,summary,[contenteditable="true"]'))return;
    const key=event.key.toLowerCase();
    if(key==='n'){event.preventDefault();$('#notesToggle').click();return;}
    if(key==='f'){event.preventDefault();$('#fullscreenToggle').click();return;}
    if(key==='home'||key==='end'){event.preventDefault();goScene(key==='home'?0:6);return;}
    if(event.code==='Space'&&document.activeElement?.matches('button,a,[role="button"]'))return;
    if(event.key==='ArrowRight'||event.key==='PageDown'||event.code==='Space'){event.preventDefault();next();}
    if(event.key==='ArrowLeft'||event.key==='PageUp'){event.preventDefault();previous();}
  });
  window.addEventListener('hashchange', () => {
    const match = location.hash.match(/^#0?([1-7])$/);
    if (match && Number(match[1]) !== state.scene + 1) goScene(Number(match[1]) - 1);
  });
  reduced.addEventListener('change',()=>{if(reduced.matches&&animation)complete();else paintTransfer();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  new ResizeObserver(()=>layoutDiagram()).observe(figure);
  $$('[data-demo-date]').forEach(el=>{el.dateTime=demoDate;el.textContent=dateLabel;});
  svg.setAttribute('role','group');
  const hash=location.hash.match(/^#0?([1-7])$/);if(hash)state.scene=Number(hash[1])-1;
  // Ortak paneli değiştirmeden bu konuya ait kısa tanımı kullan.
  document.addEventListener('DOMContentLoaded', () => {
    const summary = document.querySelector('.lesson-summary p');
    if (!summary) return;
    let previousScene = null;
    const syncSummary = () => {
      if (app.dataset.scene === previousScene) return;
      const article = document.querySelector(`[data-lesson-scene="${app.dataset.scene}"]`);
      if (article?.dataset.summary) summary.textContent = article.dataset.summary;
      previousScene = app.dataset.scene;
    };
    syncSummary();
    new MutationObserver(syncSummary).observe(app, { attributes:true, attributeFilter:['data-scene'] });
  }, {once:true});
  document.body.classList.add('mcp-ready');
  text('#responseRaw',JSON.stringify(callResponse,null,2));
  layoutDiagram(true);render();
})();
