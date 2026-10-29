/* OPEN / NOTES mascot v1 — procedural 2.5D Canvas rig, no external assets. */
(function(global){
'use strict';
const palette={background:'#FAF9F7',ink:'#27232C',body:'#AE91E8',shade:'#7957B0',pale:'#F0EBF8',green:'#51BA93',orange:'#FF975E'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// The seeded paper texture is static. Rasterize it once, not 500 dots per frame.
const textureCache=new Map();
function bodyTexture(width){
const key=width.toFixed(3);if(textureCache.has(key))return textureCache.get(key);
const pixelWidth=Math.ceil((width*2+2)*2);
const bitmap=typeof OffscreenCanvas==='function'?new OffscreenCanvas(pixelWidth,370):global.document?.createElement('canvas');
if(!bitmap)return null;
bitmap.width=pixelWidth;bitmap.height=370;
const g=bitmap.getContext('2d');if(!g)return null;
g.setTransform(2,0,0,2,0,0);g.translate(width+1,91);
let seed=1729;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
for(let i=0;i<500;i++){const u=rand()*2-1,v=rand()*183-90,r=rand()*.65+.15;g.beginPath();g.ellipse(u*width,v,r,r,0,0,Math.PI*2);g.fillStyle=i%2?'#FAF9F72a':'#27232C14';g.fill();}
const texture={bitmap,x:-width-1,y:-91,width:pixelWidth/2,height:185};
if(textureCache.size>=8)textureCache.delete(textureCache.keys().next().value);
textureCache.set(key,texture);return texture;
}
function draw(ctx,options={}){
const o={x:0,y:0,scale:1,yaw:0,time:0,expression:'curious',action:'idle',texture:true,particle:true,...options};
const t=o.time,a=o.yaw*Math.PI/180,co=Math.cos(a),si=Math.sin(a),front=Math.max(0,co),side=Math.abs(si);
const walk=o.action==='walk',think=o.action==='think'||o.expression==='thinking';
const bounce=walk?Math.abs(Math.sin(t*7))*7:Math.sin(t*2)*2;
ctx.save();ctx.translate(o.x,o.y);ctx.scale(o.scale,o.scale);
const path=(p,fill,stroke=palette.ink,w=3)=>{ctx.beginPath();p();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke()}};
const line=(pts,w=3,color=palette.ink)=>path(()=>{ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p)},null,color,w);
const oval=(x,y,rx,ry,fill,stroke=null,w=2)=>path(()=>ctx.ellipse(x,y,rx,Math.max(.05,ry),0,0,Math.PI*2),fill,stroke,w);
// A turn preserves the same volume: narrow profile, wide front and back.
const width=64*(.67+.33*Math.abs(co));
oval(0,109,75,9,'#27232C12');ctx.translate(0,-bounce);
const legs=[-1,1].map(s=>({s,x:s*34*co,y:s*11*si})).sort((l,r)=>l.y-r.y);
for(const p of legs){const stride=walk?Math.sin(t*7+p.s*1.57)*13:0;line([[p.x,82+p.y],[p.x+stride,104+p.y]],5);oval(p.x+stride+p.s*3,106+p.y,11,4,palette.ink)}
const arms=[-1,1].map(s=>({s,x:s*(width-3)*co,y:s*18*si})).sort((l,r)=>l.y-r.y);
function arm(p){const s=p.s;let x=p.x,y=20+p.y;const wave=o.action==='wave'&&s===1, thinking=think&&s===1;
const tipX=thinking?si*30+22*co:x+s*(15+side*4)+(walk?Math.sin(t*7+s)*8:0);
const tipY=thinking?-18:wave?-37+Math.sin(t*8)*9:68+p.y;
path(()=>{ctx.moveTo(x,y);ctx.quadraticCurveTo(x+s*13,y+23,tipX,tipY)},null,palette.ink,3.2);
line([[tipX-3,tipY+4],[tipX,tipY-2],[tipX+3,tipY+4]],2);
}
arm(arms[0]);
const body=new Path2D();
// Slightly irregular crown, one shallow notch, off-centre shoulders.
body.moveTo(-width*.82,67);body.bezierCurveTo(-width*1.10,42,-width*.85,-8,-width*.64,-45);
body.bezierCurveTo(-width*.49,-79,-width*.13,-92,width*.17,-84);
body.lineTo(width*.24,-74);body.lineTo(width*.37,-79);
body.bezierCurveTo(width*.76,-64,width*.83,-20,width*.94,23);
body.bezierCurveTo(width*1.17,71,width*.70,91,width*.12,91);
body.bezierCurveTo(-width*.25,94,-width*.68,89,-width*.82,67);body.closePath();
ctx.fillStyle=palette.body;ctx.fill(body);
ctx.save();ctx.clip(body);ctx.fillStyle='#7957B024';ctx.beginPath();ctx.ellipse(-width*.9+si*10,13,width*.32,99,-.13,0,7);ctx.fill();
if(o.texture){
const texture=bodyTexture(width);
if(texture)ctx.drawImage(texture.bitmap,texture.x,texture.y,texture.width,texture.height);
else {
let seed=1729;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
for(let i=0;i<500;i++){const u=rand()*2-1,v=rand()*183-90,r=rand()*.65+.15;oval(u*width,v,r,r,i%2?'#FAF9F72a':'#27232C14')}
}
}ctx.restore();ctx.strokeStyle=palette.ink;ctx.lineWidth=3.2;ctx.lineJoin='round';ctx.stroke(body);
// Features are projected from a curved face; far eye disappears at profile.
const blink=o.expression==='blink'||Math.sin(t*1.7)> .994;
for(const s of [-1,1]){
const phi=a+s*.34,visibility=Math.cos(phi);if(visibility<=.08)continue;
const ex=Math.sin(phi)*width*.85,ey=-18+s*4;
const worried=o.expression==='confused',surprised=o.expression==='surprised';
const er=s===-1?13:10;
if(blink)line([[ex-er*visibility,ey],[ex+er*visibility,ey]],2.4);
else {oval(ex,ey,er*visibility,surprised?er*1.2:er,palette.background,palette.ink,2);oval(ex+si*2,ey+(think?-3:0),3*Math.max(.5,visibility),3.5,palette.ink)}
if(worried||think)line([[ex-7*visibility,ey-19],[ex+6*visibility,ey-22+s*3]],2);
}
if(co>0.08){const mx=si*width*.82,my=16;
ctx.save();ctx.translate(mx,my);ctx.scale(Math.max(.1,front),1);
if(o.expression==='surprised')oval(0,0,5,7,palette.ink);
else if(o.expression==='happy'){path(()=>{ctx.moveTo(-8,-2);ctx.quadraticCurveTo(0,11,8,-2);ctx.closePath()},palette.ink,null)}
else if(o.expression==='talk'){oval(0,0,5,2+Math.abs(Math.sin(t*12))*5,palette.ink)}
else line([[-4,0],[4,o.expression==='confused'?-2:0]],2.5);ctx.restore();
}
arm(arms[1]);
if(o.particle){const py=-119+Math.sin(t*2.4)*4-(o.expression==='surprised'?12:0);ctx.save();ctx.translate(si*12,py);ctx.rotate(.16+(think?t*.65:Math.sin(t)*.09));ctx.fillStyle=palette.ink;ctx.fillRect(-9,-9,18,18);ctx.restore()}
ctx.restore();
}
global.NoteMascot={draw,palette,angles:[0,45,90,135,180,225,270,315]};
})(typeof window!=='undefined'?window:globalThis);
