/* OPEN / NOTES — a slim human companion, multilingual greetings, quiet flights. */
(() => {
 'use strict';
 if(!window.NoteMascot||!document.querySelector('.footer-right'))return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const HIDDEN_KEY='open-notes-mascot-hidden',WELCOME_KEY='open-notes-mascot-welcomed';
 const read=(storage,key)=>{try{return storage.getItem(key);}catch{return null;}};
 const write=(storage,key,value)=>{try{storage.setItem(key,value);}catch{}};
 let persistent=null,session=null;try{persistent=window.localStorage;session=window.sessionStorage;}catch{}
 const root=document.createElement('aside');root.className='note-mascot';root.setAttribute('aria-label','Uzay aracındaki OPEN / NOTES maskotu');root.hidden=true;
 root.innerHTML='<div class="note-mascot-art" aria-hidden="true"></div><p class="note-mascot-bubble" aria-live="off" dir="auto" hidden></p><button type="button" class="note-mascot-hit" aria-label="Maskota selam ver; küçük bir gezintiye çıksın" title="Bir merhaba de"></button><button type="button" class="note-mascot-close" aria-label="Maskotu gizle" title="Maskotu gizle">×</button>';
 document.body.append(root);
 const actor=window.NoteMascot.create(root.querySelector('.note-mascot-art'),{state:'thinking',view:'three-quarter',motion:false,autoPlay:false});
 const bubble=root.querySelector('.note-mascot-bubble'),greet=root.querySelector('.note-mascot-hit'),close=root.querySelector('.note-mascot-close');
 const toggle=document.createElement('button');toggle.type='button';toggle.className='note-mascot-toggle';toggle.setAttribute('aria-controls','site-mascot');root.id='site-mascot';document.querySelector('.footer-right').prepend(toggle);
 const greetings=[
  {text:'Merhaba Dünya!',lang:'tr'},
  {text:'Hello, world!',lang:'en'},
  {text:'Bonjour le monde !',lang:'fr'},
  {text:'¡Hola, mundo!',lang:'es'},
  {text:'Merhaba Dünya!',lang:'tr'},
  {text:'Hallo, Welt!',lang:'de'},
  {text:'Ciao, mondo!',lang:'it'},
  {text:'こんにちは、世界！',lang:'ja'},
  {text:'مرحبًا بالعالم!',lang:'ar'}
 ];
 const duration={arrival:1200,welcome:2900,landing:950,roam:3400,peek:3200};
 const ease=p=>1-Math.pow(1-Math.max(0,Math.min(1,p)),3);
 const smooth=p=>p*p*(3-2*p);
 let hidden=read(persistent,HIDDEN_KEY)==='true',phase='parked',frame=0,timer=0,bubbleTimer=0,interactionFrame=0;
 let started=0,greetingIndex=0,renderedState='thinking';
 let geometry={width:196,height:194,left:10,bottom:8,viewport:innerWidth,viewportHeight:innerHeight};
 let facingRight=false;
 let blocked=false,moving=false,dock={x:0,y:0},current={x:0,y:0},routeStart={x:0,y:0},routeEnd={x:0,y:0},routeArc=0,manualGreeting=false;
 function syncToggle(){toggle.textContent=hidden?'Maskotu göster':'Maskotu gizle';toggle.setAttribute('aria-expanded',String(!hidden));}
 function stop(){cancelAnimationFrame(frame);clearTimeout(timer);clearTimeout(bubbleTimer);frame=timer=bubbleTimer=0;moving=false;root.classList.remove('is-moving');}
 function refreshGeometry(){
  const style=getComputedStyle(root);
  geometry={width:root.offsetWidth||(innerWidth<=600?150:196),height:root.offsetHeight||(innerWidth<=600?148:194),left:parseFloat(style.left)||0,bottom:parseFloat(style.bottom)||0,viewport:innerWidth,viewportHeight:innerHeight};
 }
 function maxTravel(){return Math.max(0,geometry.viewport-geometry.width-geometry.left-10);}
 function minY(){return -Math.max(0,geometry.viewportHeight-geometry.bottom-geometry.height-90);}
 function clampDock(point){return {x:Math.max(0,Math.min(maxTravel(),point.x)),y:Math.max(minY(),Math.min(0,point.y))};}
 function randomDock(){return {x:Math.random()*maxTravel(),y:Math.random()*minY()};}
 function position(x=dock.x,y=dock.y,rotation=0){
  current={x,y};const right=x+geometry.left+geometry.width/2>geometry.viewport/2;
  if(right!==facingRight){root.classList.toggle('is-right',right);facingRight=right;}
  root.style.transform=`translate3d(${x}px,${y}px,0) rotate(${rotation}deg)`;
 }
 function speech(greeting,manual=false){bubble.lang=greeting.lang;bubble.setAttribute('aria-live',manual?'polite':'off');bubble.textContent=greeting.text;bubble.hidden=false;draw();}
 function nextGreeting(){return greetings[greetingIndex++%greetings.length];}
 // Rebuild SVG only for a new pose. Travel uses the existing transform layer.
 function draw(){
  const greeting=!bubble.hidden&&(['welcome','peek'].includes(phase)||reduced.matches);
  const state=greeting?(greetingIndex>0&&greetingIndex%4===0?'eureka':'wave'):phase==='roam'?'happy':greetingIndex%4===3?'confused':'thinking';
  root.classList.toggle('is-greeting',state==='wave'&&!reduced.matches);root.dataset.state=state;
  if(state===renderedState)return;
  actor.setState(state);renderedState=state;
 }
 function schedule(){
  clearTimeout(timer);timer=0;
  if(hidden||blocked||reduced.matches||document.hidden)return;
  timer=setTimeout(()=>begin('roam'),12000+Math.random()*12000);
 }
 function park(){
  phase='parked';moving=false;root.classList.remove('is-moving');root.dataset.phase=phase;dock=clampDock(current);position();bubble.hidden=true;
  draw();schedule();checkInteractions();
 }
 // Measure only when choosing a destination or reacting to a layout event.
 function collidesAt(point,avoidText=false){
  const r=greet.getBoundingClientRect(),dx=point.x-current.x,dy=point.y-current.y;
  const points=[[r.left+dx+r.width/2,r.top+dy+r.height/2],[r.left+dx+5,r.top+dy+8],[r.right+dx-5,r.bottom+dy-8]];
  const selector='a,button,input,select,textarea,summary'+(avoidText?',h1,h2,h3,h4,p,li,pre':'');
  return points.some(([px,py])=>document.elementsFromPoint(px,py).some(element=>!root.contains(element)&&!!element.closest(selector)));
 }
 function safeDock(preferred){
  const max=maxTravel();
  const candidates=[preferred,{x:0,y:0},{x:max,y:0},{x:0,y:minY()},{x:max,y:minY()},...Array.from({length:8},randomDock)].map(clampDock);
  return candidates.find(point=>!collidesAt(point))??clampDock(preferred);
 }
 function nextDock(){
  const candidates=Array.from({length:16},randomDock);
  const minimum=Math.min(140,Math.hypot(maxTravel(),minY())*.25);
  const distant=candidates.filter(point=>Math.hypot(point.x-dock.x,point.y-dock.y)>=minimum);
  return distant.find(point=>!collidesAt(point,true))||distant.find(point=>!collidesAt(point))||safeDock(candidates[0]);
 }
 function begin(next,manual=false){
  if(hidden||blocked||document.hidden)return;
  stop();dock=clampDock(current);phase=next;manualGreeting=manual;started=performance.now();root.dataset.phase=phase;root.hidden=false;refreshGeometry();
  if(reduced.matches){phase='parked';root.dataset.phase=phase;position();draw();if(manual){speech(nextGreeting(),true);bubbleTimer=setTimeout(()=>{bubble.hidden=true;draw();},3200);}return;}
  if(['arrival','landing','roam'].includes(next))bubble.hidden=true;
  if(next==='roam'){routeStart={...dock};routeEnd=nextDock();routeArc=(Math.random()-.5)*36;duration.roam=2800+Math.min(2200,Math.hypot(routeEnd.x-routeStart.x,routeEnd.y-routeStart.y)*2);bubble.hidden=true;}
  if(next==='peek')speech(nextGreeting(),manual);
  moving=true;greet.disabled=true;root.classList.add('is-moving');draw();frame=requestAnimationFrame(tick);
 }
 function tick(now){
  if(hidden||blocked||document.hidden||!moving)return;
  if(reduced.matches){stop();park();return;}
  const progress=Math.min(1,(now-started)/duration[phase]);
  let x=dock.x,y=dock.y,rotation=0;
  if(phase==='arrival'){const e=ease(progress);x=-(geometry.width+60)*(1-e)+dock.x*e;y=-72-12*Math.sin(progress*Math.PI);rotation=-7*(1-e);}
  else if(phase==='welcome'){y=-72;if(progress>.15&&bubble.hidden){speech(greetings[0]);greetingIndex=1;}}
  else if(phase==='landing'){const e=ease(progress);y=-72*(1-e);bubble.hidden=true;}
  else if(phase==='roam'){const e=smooth(progress),arc=Math.sin(progress*Math.PI);x=routeStart.x+(routeEnd.x-routeStart.x)*e;y=Math.max(minY(),Math.min(0,routeStart.y+(routeEnd.y-routeStart.y)*e+routeArc*arc));rotation=Math.sign(routeEnd.x-routeStart.x)*3*arc;}
  else if(phase==='peek'&&progress>.8&&!bubble.hidden){bubble.hidden=true;draw();}
  position(x,y,rotation);
  if(progress>=1){moving=false;
   if(phase==='arrival')begin('welcome');
   else if(phase==='welcome')begin('landing');
   else if(phase==='roam'){dock=clampDock(routeEnd);position();begin('peek',manualGreeting);}
   else park();
   return;
  }
  frame=requestAnimationFrame(tick);
 }
 function setHidden(value){
  hidden=value;write(persistent,HIDDEN_KEY,String(value));stop();root.hidden=value;root.classList.remove('is-yielding');greet.disabled=false;syncToggle();
  if(!value){write(session,WELCOME_KEY,'true');begin('peek',true);}
  else{bubble.hidden=true;toggle.focus({preventScroll:true});}
 }
 close.addEventListener('click',()=>setHidden(true));toggle.addEventListener('click',()=>setHidden(!hidden));
 greet.addEventListener('click',()=>{write(session,WELCOME_KEY,'true');begin('roam',true);});
 root.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();stop();park();}});
 function shouldBlock(){return document.hidden||!!document.querySelector('dialog[open]')||!!document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');}
 function syncBlocking(){
  const next=shouldBlock();if(next===blocked)return;blocked=next;
  if(blocked){stop();greet.disabled=true;root.classList.add('is-yielding');phase='parked';root.dataset.phase=phase;dock=clampDock(current);position();bubble.hidden=true;draw();root.hidden=hidden||document.hidden||!!document.querySelector('dialog[open]');}
  else if(!hidden){root.hidden=false;park();}
 }
 document.addEventListener('visibilitychange',syncBlocking);document.addEventListener('focusin',syncBlocking);document.addEventListener('focusout',()=>queueMicrotask(syncBlocking));
 new MutationObserver(syncBlocking).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 new MutationObserver(()=>{if(!hidden&&!moving)draw();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 reduced.addEventListener('change',()=>{stop();if(!hidden&&!blocked){root.hidden=false;park();}});
 // Scrolling changes the content beneath a fixed ship, not its flight state.
 // Let clicks pass through near controls; never move, stop or restart a route here.
 function syncInteractions(){
  interactionFrame=0;if(hidden||blocked)return;
  if(moving){greet.disabled=true;return;}
  const collision=collidesAt(current);
  root.classList.toggle('is-yielding',collision);greet.disabled=collision;
 }
 function checkInteractions(){if(!interactionFrame)interactionFrame=requestAnimationFrame(syncInteractions);}
 function resizeViewport(){
  const previous=geometry;refreshGeometry();
  if(previous.width===geometry.width&&previous.height===geometry.height&&previous.viewport===geometry.viewport&&previous.viewportHeight===geometry.viewportHeight&&previous.left===geometry.left&&previous.bottom===geometry.bottom)return;
  const bounded=clampDock(current);position(bounded.x,bounded.y);
  if(moving&&phase==='roam'){
   // Rebase only when the viewport really changes, keeping the present location.
   routeStart={...bounded};routeEnd=clampDock(routeEnd);started=performance.now();
   duration.roam=1600+Math.min(2200,Math.hypot(routeEnd.x-routeStart.x,routeEnd.y-routeStart.y)*2);
  }else dock={...bounded};
  checkInteractions();
 }
 window.addEventListener('scroll',()=>{if(!moving)checkInteractions();},{passive:true});
 window.addEventListener('resize',resizeViewport);document.addEventListener('focusin',checkInteractions);
 window.addEventListener('pagehide',()=>{stop();cancelAnimationFrame(interactionFrame);interactionFrame=0;});
 window.addEventListener('pageshow',event=>{if(!event.persisted)return;blocked=shouldBlock();root.hidden=hidden||document.hidden||!!document.querySelector('dialog[open]');if(!hidden&&!blocked)park();});
 refreshGeometry();syncToggle();blocked=shouldBlock();
 if(!hidden&&!blocked){root.hidden=false;if(read(session,WELCOME_KEY)==='true'||reduced.matches)park();else{write(session,WELCOME_KEY,'true');begin('arrival');}}
})();
