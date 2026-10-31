/* Live conversion stays in this tab; only a click exports the current text. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),source=$('source'),markdown=$('markdown');
 const core=window.OpenNotesMarkdown,narrow=matchMedia('(max-width:700px)');
 if(!core){$('status').textContent='Dönüştürücü yüklenemedi. Sayfayı yenileyebilir veya Markdown rehberini açabilirsin.';return;}
 const {convertText,renderPreviewFragment}=core;
 const sample='Gökyüzü günlüğüm\n\nBugün öğrendiklerim:\n• Gökyüzü neden mavi?\n• Ay’da yerçekimi daha az.\n\nKüçük bir kod:\n```js\nconsole.log("Merhaba Dünya!");\n```';
 let view=narrow.matches?'input':'markdown',inputTimer=0,previewTimer=0,pending=false,composing=false;
 let stable={source:'',markdown:'',pending:false};const history=[];
 function state(){return {source:source.value,markdown:markdown.value,pending};}
 function remember(snapshot=state()){const copy={...snapshot};if(JSON.stringify(history.at(-1))!==JSON.stringify(copy)){history.push(copy);if(history.length>16)history.shift();}}
 function say(text){$('status').textContent=text;}
 function sync(){const valid=!!markdown.value.trim()&&!pending;$( 'copy').disabled=!valid;$('download').disabled=!valid;$('clear').disabled=!source.value&&!markdown.value;$('undo').disabled=!history.length;}
 function renderPreview(){
  clearTimeout(previewTimer);previewTimer=0;
  if(!markdown.value.trim()){$('preview').replaceChildren(Object.assign(document.createElement('p'),{className:'empty',textContent:'Önizleme için bir metin yaz.'}));return;}
  if(markdown.value.length>120000){$('preview').replaceChildren(Object.assign(document.createElement('p'),{textContent:'Bu uzunlukta önizleme gösterilemiyor. Markdown metnini kopyalayabilir veya indirebilirsin.'}));return;}
  try{$('preview').replaceChildren(renderPreviewFragment(markdown.value));}catch{$('preview').replaceChildren(Object.assign(document.createElement('p'),{textContent:'Önizleme hazırlanamadı. Markdown metnin korunuyor.'}));}
 }
 function apply(){
  clearTimeout(inputTimer);inputTimer=0;pending=false;
  if(source.value.length>100000){pending=true;sync();say('Dönüştürmek için metni 100.000 karakterin altına indir. Metnin kesilmedi.');return;}
  const result=convertText(source.value);markdown.value=result.markdown;stable=state();if(view==='preview')renderPreview();sync();
  say(!source.value.trim()?'Hazır. Notların bu sekmede işlenir; kapatmadan önce indir.':result.changes?`${result.changes} satır için biçim önerildi. Çıktıyı doğrudan düzenleyebilirsin.`:'Markdown güncel. Çıktıyı doğrudan düzenleyebilirsin.');
 }
 function flush(){if(pending&&!composing)apply();}
 source.addEventListener('compositionstart',()=>{composing=true;clearTimeout(inputTimer);});
 source.addEventListener('compositionend',()=>{composing=false;clearTimeout(inputTimer);inputTimer=setTimeout(apply,120);});
 source.addEventListener('input',event=>{
  if(!pending)remember(stable);pending=true;clearTimeout(inputTimer);sync();say('Dönüştürülüyor…');if(!composing&&!event.isComposing)inputTimer=setTimeout(apply,160);
 });
 markdown.addEventListener('focus',flush);
 markdown.addEventListener('input',()=>{
  clearTimeout(inputTimer);inputTimer=0;pending=false;remember(stable);stable=state();sync();clearTimeout(previewTimer);if(view==='preview')previewTimer=setTimeout(renderPreview,160);say('Markdown düzenlendi. Kopyalayabilir veya indirebilirsin.');
 });
 function setView(next,focus=false){
  if(!['input','markdown','preview'].includes(next))return;
  view=!narrow.matches&&next==='input'?'markdown':next;
  $('direct-app').dataset.view=view;$('input-pane').hidden=narrow.matches&&view!=='input';$('output-pane').hidden=narrow.matches&&view==='input';
  const out=view==='preview'?'preview':'markdown';$('markdown-panel').hidden=out!=='markdown';$('preview-panel').hidden=out!=='preview';
  $('markdown-panel').setAttribute('aria-labelledby',narrow.matches?'mobile-markdown':'output-markdown');$('preview-panel').setAttribute('aria-labelledby',narrow.matches?'mobile-preview':'output-preview');
  $('input-pane').setAttribute('role',narrow.matches?'tabpanel':'region');$('input-pane').setAttribute('aria-labelledby',narrow.matches?'mobile-input':'input-title');
  for(const button of document.querySelectorAll('[data-mobile-view]')){const selected=button.dataset.mobileView===view;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;}
  for(const button of document.querySelectorAll('[data-output-view]')){const selected=button.dataset.outputView===out;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;}
  if(out==='preview'){flush();renderPreview();}
  if(focus)$(narrow.matches?'mobile-'+view:'output-'+out).focus({preventScroll:true});
 }
 for(const button of document.querySelectorAll('[data-mobile-view]'))button.addEventListener('click',()=>setView(button.dataset.mobileView));
 for(const button of document.querySelectorAll('[data-output-view]'))button.addEventListener('click',()=>setView(button.dataset.outputView));
 for(const tablist of document.querySelectorAll('[role="tablist"]'))tablist.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const choices=narrow.matches?['input','markdown','preview']:['markdown','preview'];const index=Math.max(0,choices.indexOf(view));const next=event.key==='Home'?choices[0]:event.key==='End'?choices.at(-1):choices[(index+(event.key==='ArrowRight'?1:-1)+choices.length)%choices.length];setView(next,true);
 });
 narrow.addEventListener('change',()=>setView(view));
 $('example').addEventListener('click',()=>{flush();remember();source.value=sample;apply();say('Örnek yüklendi. “Geri al” önceki metnini getirir.');});
 $('clear').addEventListener('click',()=>{flush();remember();source.value='';markdown.value='';pending=false;stable=state();renderPreview();sync();say('Alanlar temizlendi. Önceki metnin için “Geri al”ı kullan.');});
 $('undo').addEventListener('click',()=>{const previous=history.pop();if(!previous)return;clearTimeout(inputTimer);clearTimeout(previewTimer);inputTimer=previewTimer=0;pending=!!previous.pending;source.value=previous.source;markdown.value=previous.markdown;stable=state();if(view==='preview')renderPreview();sync();say(pending?'Önceki metin geri getirildi. Dönüştürmek için 100.000 karakter sınırını kontrol et.':'Önceki durum geri getirildi.');});
 $('copy').addEventListener('click',async()=>{
  flush();if(pending||!markdown.value.trim())return;
  try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(markdown.value);say('Markdown kopyalandı.');}catch{setView('markdown');markdown.focus({preventScroll:true});markdown.select();say('Metin seçildi. Ctrl/Cmd + C ile kopyalayabilirsin.');}
 });
 $('download').addEventListener('click',()=>{
  flush();if(pending||!markdown.value.trim())return;
  let name=$('filename').value.replace(/\.md$/i,'').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').replace(/^\.+|[.\s]+$/g,'').trim().slice(0,64)||'notum';if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name))name='not-'+name;
  const url=URL.createObjectURL(new Blob([markdown.value],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name+'.md';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);say(`${name}.md için indirme başlatıldı.`);
 });
 const dialog=$('about-dialog');$('about-open').addEventListener('click',()=>dialog.showModal());$('about-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>$('about-open').focus({preventScroll:true}));
 function syncTheme(){$('theme').setAttribute('aria-label',document.documentElement.dataset.theme==='dark'?'Açık temaya geç':'Koyu temaya geç');document.querySelector('meta[name="theme-color"]').content=document.documentElement.dataset.theme==='dark'?'#17161A':'#FAF9F7';}
 $('theme').addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('open-notes-theme',theme);}catch{}syncTheme();});syncTheme();
 window.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'&&!dialog.open){event.preventDefault();apply();}});
 window.addEventListener('pagehide',()=>{clearTimeout(inputTimer);clearTimeout(previewTimer);});
 window.addEventListener('pageshow',event=>{if(event.persisted){composing=false;if(pending)apply();}});
 $('example').disabled=false;setView(view);sync();
})();
