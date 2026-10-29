/* OPEN / NOTES — small spaceship trips, multilingual greetings, quiet rests. */
(() => {
 'use strict';
 if(!window.NoteMascot||!document.querySelector('.footer-right'))return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const HIDDEN_KEY='open-notes-mascot-hidden',WELCOME_KEY='open-notes-mascot-welcomed';
 const read=(storage,key)=>{try{return storage.getItem(key);}catch{return null;}};
 const write=(storage,key,value)=>{try{storage.setItem(key,value);}catch{}};
 let persistent=null,session=null;try{persistent=window.localStorage;session=window.sessionStorage;}catch{}
 const root=document.createElement('aside');root.className='note-mascot';root.setAttribute('aria-label','OPEN / NOTES maskotu');root.hidden=true;
 root.innerHTML='<canvas width="640" height="520" aria-hidden="true"></canvas><p class="note-mascot-bubble" aria-live="off" dir="auto" hidden></p><button type="button" class="note-mascot-hit" aria-label="Maskota selam ver; küçük bir gezintiye çıksın" title="Bir merhaba de"></button><button type="button" class="note-mascot-close" aria-label="Maskotu gizle" title="Maskotu gizle">×</button>';
 document.body.append(root);
 const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');if(!ctx){root.remove();return;}
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
 let hidden=read(persistent,HIDDEN_KEY)==='true',phase='parked',frame=0,timer=0,bubbleTimer=0,avoidFrame=0;
 let lastPaint=0,started=0,clock=0,greetingIndex=0,roamCount=0,autoVisits=0;
 let geometry={width:192,left:10,bottom:8,viewport:innerWidth};
 let facingRight=false;
 let blocked=false,moving=false,dockX=0,currentX=0,routeStart=0,routeEnd=0,manualGreeting=false;
 function syncToggle(){toggle.textContent=hidden?'Maskotu göster':'Maskotu gizle';toggle.setAttribute('aria-expanded',String(!hidden));}
 function stop(){cancelAnimationFrame(frame);clearTimeout(timer);clearTimeout(bubbleTimer);frame=timer=bubbleTimer=0;moving=false;root.classList.remove('is-moving');}
 function refreshGeometry(){
  const style=getComputedStyle(root);
  geometry={width:root.offsetWidth||(innerWidth<=600?144:192),left:parseFloat(style.left)||0,bottom:parseFloat(style.bottom)||0,viewport:innerWidth};
 }
 function maxTravel(){return Math.max(0,geometry.viewport-geometry.width-geometry.left-10);}
 function clampDock(value){return Math.max(0,Math.min(maxTravel(),value));}
 function position(x=dockX,y=0,rotation=0){
  currentX=x;const right=x+geometry.left+geometry.width/2>geometry.viewport/2;
  if(right!==facingRight){root.classList.toggle('is-right',right);facingRight=right;}
  root.style.transform=`translate3d(${x}px,${y}px,0) rotate(${rotation}deg)`;
 }
 function speech(greeting,manual=false){bubble.lang=greeting.lang;bubble.setAttribute('aria-live',manual?'polite':'off');bubble.textContent=greeting.text;bubble.hidden=false;}
 function nextGreeting(){return greetings[greetingIndex++%greetings.length];}
 function draw(peek=0,time=0,thrusters=false){
  const dark=document.documentElement.dataset.theme==='dark';
  const ink=dark?'#E0D8E9':'#27232C',hull=dark?'#302A3A':'#F0EBF8',underside=dark?'#211D29':'#E5DEEF';
  ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,320,260);
  ctx.lineCap='round';ctx.lineJoin='round';
  const ellipse=(x,y,rx,ry,fill,stroke=ink,line=2)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}};
  ellipse(160,228,76,5,dark?'#00000028':'#27232C0C',null);
  if(thrusters){for(const x of [122,198]){ctx.beginPath();ctx.moveTo(x-5,207);ctx.quadraticCurveTo(x,224+Math.sin(time*12)*2,x+5,207);ctx.fillStyle='#FF975E';ctx.fill();}}
  // Rear rim and an open little cockpit; the supplied character rises through it.
  ellipse(160,164,62,44,dark?'#AE91E819':'#AE91E81C',dark?'#8D77AD':'#C2A9EA',1.5);
  ellipse(160,171,75,13,dark?'#211D29':'#E8E0F1',ink,2);
  if(peek>0){ctx.save();ctx.beginPath();ctx.rect(60,0,200,175);ctx.clip();
   window.NoteMascot.draw(ctx,{x:160,y:137+(1-peek)*112,scale:.59,yaw:0,time,expression:peek>.8?'happy':'curious',action:moving&&['welcome','peek'].includes(phase)&&peek>.85&&!reduced.matches?'wave':'idle',texture:true,particle:peek>.85});ctx.restore();}
  // Two small fins and the round saucer body cover the lower half of the mascot.
  ctx.beginPath();ctx.moveTo(93,174);ctx.quadraticCurveTo(70,166,59,186);ctx.lineTo(99,192);ctx.closePath();ctx.fillStyle=underside;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.moveTo(227,174);ctx.quadraticCurveTo(250,166,261,186);ctx.lineTo(221,192);ctx.closePath();ctx.fill();ctx.stroke();
  ellipse(160,190,92,24,hull,ink,2.3);ellipse(160,195,66,14,underside,null);
  ctx.beginPath();ctx.moveTo(78,184);ctx.quadraticCurveTo(160,205,242,184);ctx.strokeStyle=dark?'#88729F':'#C4B2DF';ctx.lineWidth=1.4;ctx.stroke();
  ellipse(160,189,15,9,dark?'#77D5AC':'#51BA93',ink,1.7);ellipse(155,186,4,2,'#FAF9F7AA',null);
  for(const x of [116,204]){ellipse(x,189,4.2,3,dark?'#FFAC7B':'#FF975E',null);}
  ctx.beginPath();ctx.moveTo(116,212);ctx.lineTo(110,221);ctx.moveTo(204,212);ctx.lineTo(210,221);ctx.strokeStyle=ink;ctx.lineWidth=2.5;ctx.stroke();
 }
 function schedule(){
  clearTimeout(timer);timer=0;
  if(hidden||blocked||reduced.matches||document.hidden)return;
  timer=setTimeout(()=>{autoVisits++;begin('roam');},autoVisits===0?16000:26000+(autoVisits%3)*6000);
 }
 function park(){
  phase='parked';moving=false;root.classList.remove('is-moving');root.dataset.phase=phase;dockX=clampDock(currentX);position();bubble.hidden=true;
  draw(reduced.matches ? .9 : .82);schedule();checkCorner();
 }
 function collidesAt(x){
  const r=greet.getBoundingClientRect(),dx=x-currentX;
  const points=[[r.left+dx+r.width/2,r.top+r.height/2],[r.left+dx+5,r.top+8],[r.right+dx-5,r.bottom-8]];
  return points.some(([px,py])=>document.elementsFromPoint(px,py).some(element=>!root.contains(element)&&!!element.closest('a,button,input,select,textarea,summary')));
 }
 function safeDock(preferred){
  const max=maxTravel();
  const candidates=[preferred,0,max,max*.5,max*.25,max*.75].map(clampDock);
  return candidates.find(x=>!collidesAt(x))??clampDock(preferred);
 }
 function nextDock(){
  const ratios=[.3,.82,.12,.65,0];
  const preferred=maxTravel()*ratios[roamCount++%ratios.length];
  const candidates=[preferred,maxTravel()-dockX,0,maxTravel()].map(clampDock);
  return candidates.find(x=>Math.abs(x-dockX)>Math.min(35,maxTravel()/4)&&!collidesAt(x))??safeDock(preferred);
 }
 function begin(next,manual=false){
  if(hidden||blocked||document.hidden)return;
  stop();dockX=clampDock(currentX);phase=next;manualGreeting=manual;started=performance.now();lastPaint=0;root.dataset.phase=phase;root.hidden=false;refreshGeometry();
  if(reduced.matches){phase='parked';root.dataset.phase=phase;position();draw(.9);if(manual){speech(nextGreeting(),true);bubbleTimer=setTimeout(()=>{bubble.hidden=true;draw(.9);},3200);}return;}
  if(next==='roam'){routeStart=dockX;routeEnd=nextDock();bubble.hidden=true;}
  if(next==='peek')speech(nextGreeting(),manual);
  moving=true;greet.disabled=true;root.classList.add('is-moving');frame=requestAnimationFrame(tick);
 }
 function tick(now){
  if(hidden||blocked||document.hidden||!moving)return;
  if(reduced.matches){stop();park();return;}
  const progress=Math.min(1,(now-started)/duration[phase]);
  clock=now/1000;
  let peek=.82,x=dockX,y=0,rotation=0;
  if(phase==='arrival'){const e=ease(progress);x=-(geometry.width+60)*(1-e)+dockX*e;y=-72-12*Math.sin(progress*Math.PI);rotation=-7*(1-e);peek=0;}
  else if(phase==='welcome'){y=-72;peek=ease(Math.min(1,progress/.18));if(progress>.15&&bubble.hidden){speech(greetings[0]);greetingIndex=1;}}
  else if(phase==='landing'){const e=ease(progress);y=-72*(1-e);peek=1-.18*e;bubble.hidden=true;}
  else if(phase==='roam'){const direction=Math.sign(routeEnd-routeStart);x=routeStart+(routeEnd-routeStart)*smooth(progress);y=-12*Math.sin(progress*Math.PI);rotation=direction*3*Math.sin(progress*Math.PI);peek=.9;}
  else if(phase==='peek'){peek=progress<.2?.82+.18*ease(progress/.2):progress>.78?1-.18*ease((progress-.78)/.22):1;if(progress>.8)bubble.hidden=true;}
  // Move at the display's refresh rate. Canvas updates are independently paced.
  position(x,y,rotation);
  if(!lastPaint||now-lastPaint>=1000/30||progress>=1){
   const interval=1000/30;lastPaint=now-((now-lastPaint)%interval);
   draw(peek,clock,['arrival','landing','roam'].includes(phase));
  }
  if(progress>=1){moving=false;
   if(phase==='arrival')begin('welcome');
   else if(phase==='welcome')begin('landing');
   else if(phase==='roam'){dockX=clampDock(routeEnd);position();begin('peek',manualGreeting);}
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
  if(blocked){stop();greet.disabled=true;root.classList.add('is-yielding');phase='parked';root.dataset.phase=phase;dockX=clampDock(currentX);position();bubble.hidden=true;draw(.82);root.hidden=hidden||document.hidden||!!document.querySelector('dialog[open]');}
  else if(!hidden){root.hidden=false;park();}
 }
 document.addEventListener('visibilitychange',syncBlocking);document.addEventListener('focusin',syncBlocking);document.addEventListener('focusout',()=>queueMicrotask(syncBlocking));
 new MutationObserver(syncBlocking).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 new MutationObserver(()=>{if(!hidden&&!moving)draw(reduced.matches ? .9 : .82);}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 reduced.addEventListener('change',()=>{stop();if(!hidden&&!blocked){root.hidden=false;park();}});
 // Reposition near a control instead of hiding. If every spot is occupied,
 // let clicks pass through the ship while keeping the character visible.
 function avoidControls(){
  avoidFrame=0;if(hidden||blocked)return;
  refreshGeometry();
  const bounded=clampDock(currentX);
  if(moving&&bounded===currentX&&!collidesAt(currentX))return;
  if(moving)stop();
  dockX=safeDock(bounded);position();phase='parked';root.dataset.phase=phase;bubble.hidden=true;
  const collision=collidesAt(dockX);root.classList.toggle('is-yielding',collision);greet.disabled=collision;
  draw(reduced.matches ? .9 : .82);schedule();
 }
 function checkCorner(){if(!avoidFrame)avoidFrame=requestAnimationFrame(avoidControls);}
 window.addEventListener('scroll',checkCorner,{passive:true});window.addEventListener('resize',checkCorner);document.addEventListener('focusin',checkCorner);
 window.addEventListener('pagehide',()=>{stop();cancelAnimationFrame(avoidFrame);avoidFrame=0;});
 window.addEventListener('pageshow',event=>{if(!event.persisted)return;blocked=shouldBlock();root.hidden=hidden||document.hidden||!!document.querySelector('dialog[open]');if(!hidden&&!blocked)park();});
 refreshGeometry();syncToggle();blocked=shouldBlock();
 if(!hidden&&!blocked){root.hidden=false;if(read(session,WELCOME_KEY)==='true'||reduced.matches)park();else{write(session,WELCOME_KEY,'true');begin('arrival');}}
})();
