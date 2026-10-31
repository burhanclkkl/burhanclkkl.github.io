/* OPEN / NOTES — local note formatting, safe preview, and a written walkthrough. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),source=$('source-text'),output=$('markdown-output');
 const examples=JSON.parse($('examples-data').textContent),sample=JSON.parse($('sample-data').textContent);
 const narrow=matchMedia('(max-width:840px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let view=narrow.matches?'input':'preview',lastSource=null,previewTimer=0,guideStep=-1;
 const history=[],MAX_HISTORY=12;
 const {normalize,protectedLines,convertText,renderPreviewFragment}=window.OpenNotesMarkdown;
 function notify(text){$('app-status').textContent=text;}
 function dirty(){return lastSource!==null&&source.value!==lastSource;}
 function validOutput(){return !!output.value.trim()&&!dirty();}
 function remember(){
  const snapshot={source:source.value,markdown:output.value,lastSource,view};
  if(JSON.stringify(history.at(-1))!==JSON.stringify(snapshot)){history.push(snapshot);if(history.length>MAX_HISTORY)history.shift();}
 }
 function sync(){
  const available=validOutput();$('copy').disabled=!available;$('download').disabled=!available;$('apply-line').disabled=!available;
  $('convert').disabled=!source.value.trim()||source.value.length>100000;$('clear').disabled=!source.value&&!output.value;$('undo').disabled=!history.length;
  const lines=Math.max(1,normalize(output.value).split('\n').length);$('line-number').max=lines;
  $('result-state').textContent=dirty()?'Notun değişti':output.value.trim()?`${lines} satır · düzenlenebilir`:'Sonuç bekleniyor';
  $('result-pane').classList.toggle('is-stale',dirty());
 }
 function renderPreview(){
  clearTimeout(previewTimer);previewTimer=0;
  const preview=$('preview');
  if(!output.value.trim()){preview.replaceChildren(Object.assign(document.createElement('p'),{className:'empty-preview',textContent:'Dönüştürdüğün not burada görünecek.'}));return;}
  try{
   const fragment=renderPreviewFragment(output.value);
   preview.replaceChildren(fragment);
  }catch{preview.replaceChildren(Object.assign(document.createElement('p'),{textContent:'Önizleme oluşturulamadı. Markdown metnin korunuyor.'}));}
 }
 function setView(next,focus=false){
  if(!['input','preview','markdown'].includes(next))return;
  view=next;const mobile=narrow.matches;
  if(!mobile&&view==='input')view='preview';
  $('workspace').dataset.view=view;$('source-pane').hidden=mobile&&view!=='input';$('result-pane').hidden=mobile&&view==='input';
  $('preview-panel').hidden=view!=='preview';$('markdown-panel').hidden=view!=='markdown';
  if(mobile){$('source-pane').setAttribute('role','tabpanel');$('source-pane').setAttribute('aria-labelledby','tab-input');}
  else{$('source-pane').setAttribute('role','region');$('source-pane').setAttribute('aria-labelledby','source-title');}
  document.querySelectorAll('[data-view]').forEach(button=>{const selected=button.dataset.view===view;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
  if(focus)$('tab-'+view).focus({preventScroll:true});
 }
 function convert(save=true){
  if(!source.value.trim()){notify('Önce kısa bir not yaz veya örnek notu aç.');return;}
  if(source.value.length>100000){notify('Notu 100.000 karakterin altında tut.');return;}
  if(save)remember();const result=convertText(source.value);output.value=result.markdown;lastSource=source.value;sync();renderPreview();setView('preview');
  notify(result.changes?`${result.changes} satır için biçim önerildi. Sonucu kontrol edip düzeltebilirsin.`:'Markdown hazır. Belirgin bir otomatik biçim değişikliği gerekmedi.');
  if(save&&!reduced.matches)$('result-pane').animate([{opacity:.35,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:380,easing:'ease-out'});
 }
 function loadExample(text){remember();source.value=text;convert(false);$('workspace').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});notify('Örnek yüklendi. “İşlemi geri al” önceki notunu geri getirir.');}
 $('convert').addEventListener('click',()=>convert());$('load-sample').addEventListener('click',()=>loadExample(sample));
 document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>loadExample(examples[button.dataset.example])));
 source.addEventListener('input',()=>{sync();notify(dirty()?'Notun değişti. Sonucu yenilemek için dönüştür.':'Notun hazır olduğunda dönüştür.');});
 output.addEventListener('input',()=>{if(output.value.length>120000)output.value=output.value.slice(0,120000);if(lastSource===null)lastSource=source.value;sync();clearTimeout(previewTimer);previewTimer=setTimeout(renderPreview,180);notify('Markdown düzenlendi. Önizleme güncelleniyor.');});
 function selectedLine(){const number=output.value.slice(0,output.selectionStart).split('\n').length;$('line-number').value=number;}
 output.addEventListener('click',selectedLine);output.addEventListener('keyup',selectedLine);output.addEventListener('select',selectedLine);
 $('apply-line').addEventListener('click',()=>{
  if(!validOutput())return;
  const lines=normalize(output.value).split('\n'),index=Math.max(0,Math.min(lines.length-1,Math.floor(Number($('line-number').value)||1)-1));
  if(protectedLines(lines)[index]){notify('Bu satır bir kod bloğunda. Kodunu Markdown alanından doğrudan düzenleyebilirsin.');return;}
  remember();let line=lines[index].replace(/^ {0,3}#{1,6}\s+/,'').replace(/^ {0,3}(?:[-+*]|\d+[.)])\s+/,'').replace(/^ {0,3}>\s?/,'');
  const prefix={text:'',h1:'# ',h2:'## ',h3:'### ',list:'- ',ordered:'1. ',quote:'> '}[$('line-type').value];
  lines[index]=prefix+line;output.value=lines.join('\n');sync();renderPreview();setView('markdown');
  const start=lines.slice(0,index).reduce((total,value)=>total+value.length+1,0);output.focus({preventScroll:true});output.setSelectionRange(start,start+lines[index].length);$('line-number').value=index+1;notify(`${index+1}. satır düzenlendi.`);
 });
 $('clear').addEventListener('click',()=>{remember();source.value='';output.value='';lastSource=null;sync();renderPreview();setView(narrow.matches?'input':'preview');notify('Alanlar temizlendi. Önceki notun için “İşlemi geri al”ı kullan.');});
 $('undo').addEventListener('click',()=>{const previous=history.pop();if(!previous)return;clearTimeout(previewTimer);source.value=previous.source;output.value=previous.markdown;lastSource=previous.lastSource;setView(previous.view);sync();renderPreview();notify('Önceki işlem geri alındı.');});
 $('copy').addEventListener('click',async()=>{
  if(!validOutput())return;const markdown=output.value;
  try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(markdown);notify('Markdown kopyalandı.');}
  catch{setView('markdown');output.focus({preventScroll:true});output.select();notify('Otomatik kopyalama kullanılamıyor. Metin seçildi; Ctrl/Cmd + C ile kopyalayabilirsin.');}
 });
 $('download').addEventListener('click',()=>{
  if(!validOutput())return;
  let name=$('filename').value.replace(/\.md$/i,'').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').replace(/^\.+|[.\s]+$/g,'').trim().slice(0,64)||'notum';
  if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name))name='not-'+name;
  const url=URL.createObjectURL(new Blob([output.value],{type:'text/markdown;charset=utf-8'})),anchor=document.createElement('a');anchor.href=url;anchor.download=name+'.md';document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify(`${name}.md için indirme başlatıldı.`);
 });
 document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
 document.querySelector('.view-tabs').addEventListener('keydown',event=>{
  const tabs=narrow.matches?['input','preview','markdown']:['preview','markdown'];if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();
  const index=tabs.indexOf(view),next=event.key==='Home'?tabs[0]:event.key==='End'?tabs.at(-1):tabs[(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];setView(next,true);
 });
 const guide=[
  ['Notunu yerleştir','Soldaki alana notunu yaz veya yapıştır. “Örnek notla dene” hazır bir not getirir. Başlık ve liste işaretlerinin nereye ekleneceğini birazdan birlikte göreceğiz.','source-pane','input'],
  ['Biçim önerilerini oluştur','“Markdown’a dönüştür”e bas. Kısa ilk satır ve belirgin liste işaretleri için öneri yapılır. Kod bloklarının içi korunur; cümlelerin anlamı yeniden yazılmaz.','convert-area','input'],
  ['İşaret ile sonucu karşılaştır','“Önizleme” görünen sonucu, “Markdown” işaretli metni gösterir. Örneğin ## bir alt başlık, - ise bir madde oluşturur. Aşağıdaki rehberde her yapının kodu ve sonucu yan yana.','result-pane','preview'],
  ['Son düzenlemeyi sen yap','Markdown alanına yazabilirsin. Altındaki satır numarasını ve biçimini seçip “Uygula”ya basarak yanlış yorumlanan bir başlığı veya maddeyi düzeltebilirsin. Kod bloklarındaki satırları doğrudan düzenle.','line-tools','markdown'],
  ['Notunu yanında götür','Dosya adını seç, “Markdown’ı kopyala” veya “.md indir”e bas. Notunu daha sonra bir Markdown okuyucusunda açabilirsin. Sayfayı kapatmadan önce dosyanı al; notlar sunucuya kaydedilmez.','export-bar','markdown']
 ];
 function guideRender(){
  document.querySelectorAll('.is-guided').forEach(el=>el.classList.remove('is-guided'));
  $('walkthrough').hidden=guideStep<0;$('guide-start').setAttribute('aria-expanded',String(guideStep>=0));if(guideStep<0)return;
  const [heading,text,target,mode]=guide[guideStep];setView(mode);$('guide-count').textContent=`0${guideStep+1} / 05 · BİRLİKTE DENEYELİM`;$('guide-heading').textContent=heading;$('guide-text').textContent=text;$(target).classList.add('is-guided');$('guide-prev').disabled=guideStep===0;$('guide-next').textContent=guideStep===4?'Tamamla ✓':'Sonraki →';
 }
 $('guide-start').setAttribute('aria-controls','walkthrough');$('guide-start').setAttribute('aria-expanded','false');
 $('guide-start').addEventListener('click',()=>{guideStep=0;guideRender();$('walkthrough').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});$('guide-next').focus({preventScroll:true});});
 $('guide-prev').addEventListener('click',()=>{guideStep=Math.max(0,guideStep-1);guideRender();});
 $('guide-next').addEventListener('click',()=>{guideStep=guideStep===4?-1:guideStep+1;guideRender();if(guideStep<0)$('guide-start').focus({preventScroll:true});});
 function closeGuide(){guideStep=-1;guideRender();$('guide-start').focus({preventScroll:true});}
 $('guide-close').addEventListener('click',closeGuide);window.addEventListener('keydown',event=>{if(event.key==='Escape'&&guideStep>=0){event.preventDefault();closeGuide();}});
 narrow.addEventListener('change',()=>{setView(view);if(guideStep>=0)guideRender();});
 const theme=$('theme-toggle');
 function syncTheme(){theme.setAttribute('aria-label',document.documentElement.dataset.theme==='dark'?'Açık temaya geç':'Koyu temaya geç');document.querySelector('meta[name="theme-color"]').content=document.documentElement.dataset.theme==='dark'?'#17161A':'#FAF9F7';}
 theme.addEventListener('click',()=>{const value=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=value;try{localStorage.setItem('open-notes-theme',value);}catch{}syncTheme();});syncTheme();
 document.querySelectorAll('[data-enable]').forEach(button=>button.disabled=false);convert(false);setView(narrow.matches?'input':'preview');notify('Hazır örnek açık. Kendi notunu yazabilir veya metinli rehberle başlayabilirsin.');
})();
