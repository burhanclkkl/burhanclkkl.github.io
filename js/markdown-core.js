/* Shared by Markdown Atölyesi and the full-screen converter. No network calls. */
(() => {
 'use strict';
 const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let parser=null;
 if(window.marked?.Marked&&window.DOMPurify?.sanitize){
  parser=new window.marked.Marked({gfm:true,breaks:false,renderer:{
   html(token){return escapeHTML(typeof token==='string'?token:token.text);},
   image(token){return `<span class="md-image"><strong>${escapeHTML(token.text||'Görsel')}</strong><small>Görsel: ${escapeHTML(token.href||'')}</small></span>`;}
  }});
 }
 function normalize(text){return text.replace(/\r\n?/g,'\n');}
 function protectedLines(lines){
  let fence=null;return lines.map(line=>{
   const match=line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
   if(fence){if(match&&match[1][0]===fence.char&&match[1].length>=fence.length&&!match[2].trim())fence=null;return true;}
   if(match){fence={char:match[1][0],length:match[1].length};return true;}
   return /^( {4}|\t)/.test(line);
  });
 }
 function convertText(text){
  const lines=normalize(text).split('\n'),protectedFlags=protectedLines(lines);
  const first=lines.findIndex(line=>line.trim());let changes=0;
  const result=lines.map((line,index)=>{
   if(protectedFlags[index]||!line.trim())return line;
   const trimmed=line.trim();let next=line;
   if(/^( {0,3})[•·–]\s+/.test(line))next=line.replace(/^( {0,3})[•·–]\s+/,'$1- ');
   else if(/^( {0,3})\d+\)\s+/.test(line))next=line.replace(/^( {0,3})(\d+)\)\s+/,'$1$2. ');
   else if(!/^\s/.test(line)&&!/[#>*_`\[\]{}<>|\\]/.test(trimmed)&&!/^([-+=~]{3,}|\d+[.)]\s|https?:\/\/)/i.test(trimmed)){
    if(trimmed.endsWith(':')&&trimmed.length<75&&trimmed.split(/\s+/).length<=10)next='## '+trimmed.slice(0,-1);
    else if(index===first&&trimmed.length<=65&&trimmed.split(/\s+/).length<=8&&!/[.!?:;]$/.test(trimmed)&&!lines[index+1]?.trim())next='# '+trimmed;
   }
   if(next!==line)changes++;return next;
  }).join('\n');
  return {markdown:result.trim()?result.replace(/\n*$/,'\n'):'',changes};
 }
 function renderPreviewFragment(text){
  if(!parser)throw new Error('Preview dependencies unavailable');
   const html=parser.parse(text);
   const fragment=DOMPurify.sanitize(html,{RETURN_DOM_FRAGMENT:true,ALLOWED_TAGS:['p','br','h1','h2','h3','h4','h5','h6','strong','em','del','a','ul','ol','li','blockquote','pre','code','hr','table','thead','tbody','tr','th','td','input','span','small'],ALLOWED_ATTR:['href','title','class','type','checked','disabled','start','align'],ALLOW_DATA_ATTR:false,ALLOW_ARIA_ATTR:false});
   fragment.querySelectorAll('a').forEach(link=>{
    const raw=link.getAttribute('href');if(!raw)return;
    try{const url=new URL(raw,location.href);if(!['https:','http:','mailto:','tel:'].includes(url.protocol)){link.removeAttribute('href');return;}link.target='_blank';link.rel='noopener noreferrer';}catch{link.removeAttribute('href');}
   });
   fragment.querySelectorAll('input').forEach(input=>{input.type='checkbox';input.disabled=true;});
  return fragment;
 }
 window.OpenNotesMarkdown=Object.freeze({normalize,protectedLines,convertText,renderPreviewFragment});
})();
