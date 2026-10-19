(() => {
  'use strict';
  const launch = document.getElementById('universe-launch');
  const topics = window.SITE_TOPICS;
  if (!launch || !Array.isArray(topics) || !topics.length) return;
  const groups = [
    {id:'ai', name:'Yapay zekâ', x:150, y:300, color:'lilac'},
    {id:'system', name:'Sistemler', x:1050, y:0, color:'green'},
    {id:'software', name:'Yazılım', x:1500, y:600, color:'orange'}
  ];
  const dialog = document.createElement('dialog');
  dialog.className = 'universe';
  dialog.setAttribute('aria-labelledby','universe-title');
  dialog.innerHTML = `<header class="universe-head"><h2 class="universe-title" id="universe-title">OPEN / NOTES · KONU EVRENİ</h2><nav class="universe-filters" aria-label="Konu sistemleri"></nav><button type="button" class="universe-close" aria-label="Konu evrenini kapat">Kapat ×</button></header><div class="universe-viewport" aria-label="Sürüklenebilir konu haritası"><div class="universe-world"></div></div><details class="universe-list"><summary>Konu listesi</summary><div></div></details><section class="universe-card" hidden aria-labelledby="universe-topic-title"><button type="button" class="universe-card-close" aria-label="Konu bilgisini kapat">×</button><p class="universe-card-status"></p><h3 id="universe-topic-title"></h3><p class="universe-card-description"></p><a></a></section><footer class="universe-foot"><p class="universe-hint">Sürükle · Yakınlaş · Bir gezegen seç<br>Yeni konular güneşe daha yakın · Kesik halka: yakında</p><div class="universe-tools"><button type="button" data-space="out" aria-label="Uzaklaştır">−</button><output aria-label="Yakınlaştırma oranı"></output><button type="button" data-space="in" aria-label="Yakınlaştır">+</button><button type="button" data-space="fit">Tümünü göster</button><button type="button" data-space="motion" aria-pressed="false">Hareketi duraklat</button></div></footer>`;
  document.body.append(dialog);
  launch.hidden = false;
  const $ = selector => dialog.querySelector(selector);
  const viewport = $('.universe-viewport'), world = $('.universe-world');
  const card = $('.universe-card');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const planets = [];
  let category = 'all', scale = 1, offsetX = 0, offsetY = 0;
  let paused = reduced.matches, frame = 0, last = 0, elapsed = 0, oldOverflow = '';
  const buttons = new Map();
  function makeButton(text, action) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = text;
    button.addEventListener('click', action);
    return button;
  }
  for (const group of [{id:'all',name:'Tümü'}, ...groups]) {
    const button = makeButton(group.name, () => focusGroup(group.id));
    button.setAttribute('aria-pressed', String(group.id === 'all'));
    $('.universe-filters').append(button); buttons.set(group.id,button);
  }
  // Ekran boyunca düzensiz, farklı derinliklerde bir yıldız alanı.
  const starfield = document.createElement('div');
  starfield.className = 'universe-starfield';
  starfield.setAttribute('aria-hidden', 'true');
  viewport.prepend(starfield);
  let seed = 734821;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const stars = [];
  let mouse = null, starTime = 0;
  for (let i=0;i<110;i++) {
    const element = document.createElement('span');
    element.className = 'universe-star';
    const star = {element, x:random(), y:random(), depth:.25+random()*.75, phase:random()*Math.PI*2, dx:0, dy:0};
    element.style.left = `${star.x*100}%`;
    element.style.top = `${star.y*100}%`;
    const size = 1+star.depth*1.8;
    element.style.width = element.style.height = `${size}px`;
    element.style.opacity = .16+star.depth*.35;
    starfield.append(element); stars.push(star);
  }
  viewport.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const rect=viewport.getBoundingClientRect();
    mouse={x:event.clientX-rect.left,y:event.clientY-rect.top};
  });
  viewport.addEventListener('pointerleave', () => { mouse=null; });
  const known = new Set(groups.map(group=>group.id));
  // Yeni kategoriler de veri kaybı olmadan ayrı bir sistem olarak gösterilir.
  for (const topic of topics) if (!known.has(topic.category)) {
    known.add(topic.category);
    const id=topic.category;
    const group={id,name:topic.categoryLabel || id,x:150+groups.length%2*1000,y:1500+Math.floor((groups.length-3)/2)*900,color:'lilac'};
    groups.push(group);
    const button=makeButton(group.name,()=>focusGroup(id));
    button.setAttribute('aria-pressed','false');$('.universe-filters').append(button);buttons.set(id,button);
  }
  function select(planet, source) {
    for (const p of planets) p.button.setAttribute('aria-pressed',String(p===planet));
    const topic=planet.topic;
    $('.universe-card-status').textContent=`${planet.group.name} / ${topic.status==='published'?'Yayında':'Yakında'}`;
    $('#universe-topic-title').textContent=topic.title;
    $('.universe-card-description').textContent=topic.description;
    const link=$('.universe-card a');
    const ready=topic.status==='published' && typeof topic.href==='string' && /^(topics\/|\.\/topics\/)/.test(topic.href);
    link.hidden=!ready;
    if(ready){link.setAttribute('href',topic.href);link.textContent='Anlatımı aç ↗';}else link.removeAttribute('href');
    card.hidden=false;
    $('.universe-list').open=false;
    // Kart açılınca klavye kullanıcısı içeriğine doğrudan ulaşabilir.
    $('.universe-card-close').focus({preventScroll:true});
    card._returnFocus=source;
  }
  for (const group of groups) {
    const system=document.createElement('section');system.className='universe-system';
    system.style.left=`${group.x}px`;system.style.top=`${group.y}px`;
    system.style.setProperty('--system-color',`var(--${group.color})`);
    system.setAttribute('aria-label',group.name);
    const items=topics.map((topic,index)=>({topic,index})).filter(item=>item.topic.category===group.id);
    const published=items.filter(item=>item.topic.status==='published').sort((a,b)=>{
      const ad=Date.parse(a.topic.publishedAt),bd=Date.parse(b.topic.publishedAt);
      if(Number.isFinite(ad)!==Number.isFinite(bd))return Number.isFinite(bd)?1:-1;
      return Number.isFinite(ad)&&Number.isFinite(bd)?bd-ad || b.index-a.index:b.index-a.index;
    });
    const planned=items.filter(item=>item.topic.status!=='published');
    const sorted=[...published,...planned];
    const sun=makeButton('',()=>focusGroup(group.id));sun.className='universe-sun';sun.setAttribute('aria-label',`${group.name} sistemine yaklaş`);system.append(sun);
    const title=document.createElement('div');title.className='universe-system-title';title.textContent=group.name;
    const count=document.createElement('span');count.className='universe-system-count';count.textContent=`${items.length} konu · ${published.length} yayında`;title.append(count);system.append(title);
    sorted.forEach(({topic},index)=>{
      const radius=sorted.length<=10?115+index*28:115+Math.floor(index/8)*52;
      const orbit=document.createElement('span');orbit.className='universe-orbit';orbit.setAttribute('aria-hidden','true');
      Object.assign(orbit.style,{left:`${400-radius}px`,top:`${400-radius}px`,width:`${radius*2}px`,height:`${radius*2}px`});system.append(orbit);
      const button=document.createElement('button');button.type='button';button.className='universe-planet';
      if(topic.status!=='published')button.classList.add('is-planned');
      button.setAttribute('aria-label',`${topic.title} — ${topic.status==='published'?'Yayında':'Yakında'}`);button.setAttribute('aria-pressed','false');
      const accent=['lilac','green','orange','red'].includes(topic.accent)?topic.accent:group.color;
      button.style.setProperty('--planet-color',`var(--${accent})`);
      const dot=document.createElement('span');dot.className='universe-planet-dot';dot.setAttribute('aria-hidden','true');
      const label=document.createElement('span');label.className='universe-planet-label';label.textContent=topic.title;
      if(topic.status!=='published'){const small=document.createElement('small');small.textContent='Yakında';label.append(small);}
      const leader=document.createElement('span');leader.className='universe-label-line';leader.setAttribute('aria-hidden','true');
      button.append(leader,dot,label);system.append(button);
      const planet={button,topic,group,radius,angle:index*2.399+0.4,period:80+index*17};
      button.addEventListener('click',()=>select(planet,button));planets.push(planet);
      const listButton=makeButton(`${topic.title}${topic.status==='published'?'':' · Yakında'}`,()=>{focusGroup(group.id);select(planet,listButton);});
      $('.universe-list div').append(listButton);
    });
    world.append(system);group.element=system;
    group.extent=Math.max(400,...planets.filter(p=>p.group===group).map(p=>p.radius+100));
  }
  function renderCamera(){world.style.transform=`translate(${offsetX}px,${offsetY}px) scale(${scale})`;world.style.setProperty('--map-scale',scale);world.classList.toggle('is-distant',scale<.3);$('.universe-tools output').textContent=`${Math.round(scale*100)}%`;}
  function fit(id){
    const targets=id==='all'?groups:groups.filter(group=>group.id===id);
    const left=Math.min(...targets.map(g=>g.x+400-g.extent)),right=Math.max(...targets.map(g=>g.x+400+g.extent));
    const top=Math.min(...targets.map(g=>g.y+400-g.extent)),bottom=Math.max(...targets.map(g=>g.y+400+g.extent));
    const w=viewport.clientWidth,h=viewport.clientHeight;
    scale=Math.max(.08,Math.min(1.3,(w-32)/(right-left),(h-32)/(bottom-top)));
    offsetX=(w-(right+left)*scale)/2;offsetY=(h-(bottom+top)*scale)/2;renderCamera();
  }
  function focusGroup(id){category=id;for(const [key,button]of buttons)button.setAttribute('aria-pressed',String(key===id));fit(id);}
  function zoom(factor,x=viewport.clientWidth/2,y=viewport.clientHeight/2){
    const next=Math.max(.08,Math.min(2.5,scale*factor)),ratio=next/scale;
    offsetX=x-(x-offsetX)*ratio;offsetY=y-(y-offsetY)*ratio;scale=next;renderCamera();
  }
  function motionState(){
    dialog.classList.toggle('is-paused',paused||reduced.matches);
    const control=$('[data-space="motion"]');control.setAttribute('aria-pressed',String(paused));control.textContent=paused?'Hareketi sürdür':'Hareketi duraklat';
    control.hidden=reduced.matches;
  }
  function arrangeLabels() {
    if(scale<.3)return;
    const bounds=viewport.getBoundingClientRect();
    const intersects=(a,b)=>a.x<b.x+b.w+5&&a.x+a.w+5>b.x&&a.y<b.y+b.h+5&&a.y+a.h+5>b.y;
    const rect=e=>{const r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};};
    const occupied=[...world.querySelectorAll('.universe-system-title,.universe-sun')].map(rect);
    const measured=planets.map(p=>({p,button:rect(p.button),label:rect(p.button.querySelector('.universe-planet-label'))}));
    for(const {button} of measured)occupied.push(button);
    const placements=[];
    for(const {p,button,label} of measured) {
      const element=p.button.querySelector('.universe-planet-label');
      const line=p.button.querySelector('.universe-label-line');
      const cx=button.x+button.w/2,cy=button.y+button.h/2;
      if(cx<bounds.left||cx>bounds.right||cy<bounds.top||cy>bounds.bottom){placements.push({element,line,hidden:true});continue;}
      const candidates=[];
      for(let ring=0;ring<10;ring++) {
        const gap=12+ring*16;
        candidates.push({x:cx-label.w/2,y:cy+gap},{x:cx-label.w/2,y:cy-gap-label.h},
          {x:cx+gap,y:cy-label.h/2},{x:cx-gap-label.w,y:cy-label.h/2},
          {x:cx+gap,y:cy+gap},{x:cx-gap-label.w,y:cy+gap},
          {x:cx+gap,y:cy-gap-label.h},{x:cx-gap-label.w,y:cy-gap-label.h});
      }
      const order=[p.labelChoice??0,...candidates.map((_,i)=>i).filter(i=>i!==p.labelChoice)];
      let chosen=null;
      for(const index of order) {
        const c=candidates[index],r={x:c.x,y:c.y,w:label.w,h:label.h};
        if(r.x<bounds.left+6||r.x+r.w>bounds.right-6||r.y<bounds.top+6||r.y+r.h>bounds.bottom-6)continue;
        if(!occupied.some(other=>intersects(r,other))){chosen=r;p.labelChoice=index;break;}
      }
      // Çok yoğun yakınlaştırmada diğer konular listeden ve gezegen odağından erişilir.
      if(!chosen){placements.push({element,line,hidden:true});continue;}
      occupied.push(chosen);
      const dx=(chosen.x+chosen.w/2-cx)/scale,dy=(chosen.y-cy)/scale;
      const endX=Math.max(chosen.x,Math.min(cx,chosen.x+chosen.w));
      const endY=Math.max(chosen.y,Math.min(cy,chosen.y+chosen.h));
      const lx=(endX-cx)/scale,ly=(endY-cy)/scale;
      placements.push({element,line,dx,dy,length:Math.hypot(lx,ly),angle:Math.atan2(ly,lx)});
    }
    for(const item of placements) {
      item.element.style.visibility=item.hidden?'hidden':'';
      item.line.hidden=!!item.hidden;
      if(item.hidden)continue;
      item.element.style.transform=`translateX(-50%) translate(${item.dx}px,${item.dy}px)`;
      item.line.style.width=`${item.length}px`;
      item.line.style.transform=`rotate(${item.angle}rad)`;
    }
  }
  function animate(now){
    if(!dialog.open)return;
    const stop=paused||reduced.matches||document.hidden||world.matches(':has(.universe-planet:hover),:has(.universe-planet:focus-visible)')||!card.hidden||pointers.size>0;
    if(!stop&&last)elapsed+=Math.min(now-last,60)/1000;
    const dt=last ? Math.min(now-last,60)/1000 : 0;
    if(!paused&&!reduced.matches&&!document.hidden) {
      starTime+=dt;
      const width=viewport.clientWidth,height=viewport.clientHeight;
      for(const star of stars) {
        let x=Math.sin(starTime*.13+star.phase)*10*star.depth;
        let y=Math.cos(starTime*.11+star.phase)*8*star.depth;
        if(mouse) {
          const dx=star.x*width+x-mouse.x,dy=star.y*height+y-mouse.y;
          const distance=Math.hypot(dx,dy);
          if(distance<140) { const push=(1-distance/140)*32*star.depth; x+=dx/(distance||1)*push; y+=dy/(distance||1)*push; }
          x+=(mouse.x-width/2)*.008*star.depth;
          y+=(mouse.y-height/2)*.008*star.depth;
        }
        const smooth=1-Math.exp(-dt*5);
        star.dx+=(x-star.dx)*smooth;star.dy+=(y-star.dy)*smooth;
        star.element.style.transform=`translate3d(${star.dx}px,${star.dy}px,0)`;
      }
    }
    last=now;
    for(const p of planets){const a=p.angle+elapsed*Math.PI*2/p.period;p.button.style.transform=`translate(${400+Math.cos(a)*p.radius-22}px,${400+Math.sin(a)*p.radius-22}px)`;}
    arrangeLabels();
    frame=requestAnimationFrame(animate);
  }
  launch.addEventListener('click',()=>{oldOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';focusGroup('all');last=0;frame=requestAnimationFrame(animate);});
  $('.universe-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dialog.close();}});
  dialog.addEventListener('close',()=>{cancelAnimationFrame(frame);document.body.style.overflow=oldOverflow;pointers.clear();mouse=null;viewport.classList.remove('is-dragging');launch.focus({preventScroll:true});});
  $('.universe-card-close').addEventListener('click',()=>{card.hidden=true;for(const p of planets)p.button.setAttribute('aria-pressed','false');card._returnFocus?.focus({preventScroll:true});});
  $('[data-space="in"]').addEventListener('click',()=>zoom(1.3));
  $('[data-space="out"]').addEventListener('click',()=>zoom(1/1.3));
  $('[data-space="fit"]').addEventListener('click',()=>{card.hidden=true;focusGroup('all');});
  $('[data-space="motion"]').addEventListener('click',()=>{paused=!paused;motionState();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;motionState();});motionState();
  new ResizeObserver(()=>{if(dialog.open)fit(category);}).observe(viewport);
  viewport.addEventListener('wheel',event=>{event.preventDefault();const r=viewport.getBoundingClientRect();zoom(Math.exp(-event.deltaY*.0015),event.clientX-r.left,event.clientY-r.top);},{passive:false});
  const pointers=new Map();let gesture=null, dragged=false;
  function snapshot(){const points=[...pointers.values()];return {x:points.reduce((n,p)=>n+p.x,0)/points.length,y:points.reduce((n,p)=>n+p.y,0)/points.length,distance:points.length>1?Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y):0};}
  viewport.addEventListener('pointerdown',event=>{if(event.target.closest('button'))return;viewport.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});gesture=snapshot();dragged=false;viewport.classList.add('is-dragging');});
  viewport.addEventListener('pointermove',event=>{if(!pointers.has(event.pointerId))return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const next=snapshot();const dx=next.x-gesture.x,dy=next.y-gesture.y;if(Math.abs(dx)+Math.abs(dy)>2)dragged=true;
    if(next.distance&&gesture.distance){const rect=viewport.getBoundingClientRect();zoom(next.distance/gesture.distance,next.x-rect.left,next.y-rect.top);}offsetX+=dx;offsetY+=dy;gesture=next;renderCamera();});
  function release(event){pointers.delete(event.pointerId);gesture=pointers.size?snapshot():null;if(!pointers.size)viewport.classList.remove('is-dragging');}
  viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);
  viewport.addEventListener('click',event=>{if(dragged){event.preventDefault();dragged=false;}});
})();
