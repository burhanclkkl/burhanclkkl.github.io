/* Real cl100k_base tokens. Text stays in a local module worker. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),input=$('token-input'),pieces=$('token-pieces');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),PAGE_SIZE=160;
 const samples={hello:'Merhaba Dünya!',suffix:'Kitaplarımızdan',emoji:'🧑🏽‍🚀',code:'const selam = "Merhaba Dünya!";\nconsole.log(selam);',english:'Hello, world!'};
 const graphemes=typeof Intl.Segmenter==='function'?new Intl.Segmenter('tr',{granularity:'grapheme'}):null;
 const words=typeof Intl.Segmenter==='function'?new Intl.Segmenter('tr',{granularity:'word'}):null;
 const utf8=new TextEncoder();
 let worker=null,ready=false,busy=false,revision=0,latest=null,debounce=0,initTimer=0,jobTimer=0;
 let data=null,selected=-1,page=0,spans=[];
 const hex=bytes=>bytes.map(byte=>byte.toString(16).toUpperCase().padStart(2,'0')).join(' ');
 function say(text){$('token-status').textContent=text;}
 function counts(){
  const text=input.value;
  $('word-count').textContent=words?[...words.segment(text)].filter(s=>s.isWordLike).length:(text.match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}'’_-]*/gu)||[]).length;
  $('char-count').textContent=graphemes?[...graphemes.segment(text)].length:Array.from(text).length;
 }
 if(!graphemes){$('char-label').textContent='Unicode karakteri';$('counting-method').textContent='Bu tarayıcıda karakter sayacı görünen karakter kümeleri yerine Unicode kod noktalarını sayar. Birleşik bir emoji birkaç kod noktası olabilir. Kelime sayımı da harf ve rakam gruplarıyla yaklaşık yapılır.';}
 function resetSelection(){selected=-1;$('selected-position').textContent='';$('selected-id').textContent='—';$('selected-text').textContent='Bir parça seç.';$('selected-bytes').textContent='—';$('selected-explanation').textContent='Kimlik bir sözlük adresi gibidir; büyük bir numara daha önemli bir token anlamına gelmez.';$('selected-context').textContent='Bir token seçtiğinde metindeki karşılığını burada görebilirsin.';}
 function clearResults(){pieces.getAnimations().forEach(animation=>animation.cancel());data=null;page=0;resetSelection();pieces.replaceChildren();$('pagination').hidden=true;$('token-count').textContent='—';}
 function failure(message){
  clearTimeout(initTimer);clearTimeout(jobTimer);worker?.terminate();worker=null;ready=busy=false;clearResults();pieces.setAttribute('aria-busy','false');$('retry-worker').hidden=false;say(message);
 }
 function buildSpans(text){
  const list=graphemes?[...graphemes.segment(text)].map(s=>({text:s.segment,index:s.index})):[];
  if(!graphemes){let index=0;for(const char of text){list.push({text:char,index});index+=char.length;}}
  let byte=0;return list.map(s=>{const start=byte;byte+=utf8.encode(s.text).length;return {start,end:byte,from:s.index,to:s.index+s.text.length};});
 }
 function tokenLabel(token){
  if(token.text===null)return '0x'+hex(token.bytes);
  if($('show-spaces').checked)return token.text.replace(/ /g,'␠').replace(/\n/g,'↵').replace(/\r/g,'␍').replace(/\t/g,'⇥');
  return token.text.trim()?token.text:'boşluk';
 }
 function renderPieces(){
  pieces.classList.toggle('show-ids',$('show-ids').checked);const fragment=document.createDocumentFragment();
  if(!data?.tokens.length){pieces.replaceChildren(Object.assign(document.createElement('p'),{className:'empty-pieces',textContent:'Bir metin yaz; parçaları burada keşfet.'}));$('pagination').hidden=true;return;}
  const start=page*PAGE_SIZE,end=Math.min(data.tokens.length,start+PAGE_SIZE),active=selected>=start&&selected<end?selected:start;
  for(let i=start;i<end;i++){
   const token=data.tokens[i],button=document.createElement('button');button.type='button';button.className='token-chip';button.dataset.index=i;button.setAttribute('role','option');button.setAttribute('aria-selected',String(i===selected));button.tabIndex=i===active?0:-1;
   const label=Object.assign(document.createElement('span'),{className:'token-label',textContent:tokenLabel(token)});
   const id=Object.assign(document.createElement('span'),{className:'token-id',textContent:'ID '+token.id});button.append(label,id);
   button.setAttribute('aria-label',`${i+1}. token. ${token.text===null?'Tam karakter oluşturmayan bayt parçası':tokenLabel(token)}. Kimlik ${token.id}.`);
   button.addEventListener('click',()=>select(i));fragment.append(button);
  }
  pieces.replaceChildren(fragment);pieces.scrollTop=0;$('pagination').hidden=data.tokens.length<=PAGE_SIZE;$('page-label').textContent=`${start+1}–${end} / ${data.tokens.length} token`;$('previous-page').disabled=page===0;$('next-page').disabled=end===data.tokens.length;
 }
 function select(index,focus=false){
  if(!data||index<0||index>=data.tokens.length)return;
  selected=index;const targetPage=Math.floor(index/PAGE_SIZE);if(targetPage!==page){page=targetPage;renderPieces();}
  for(const b of pieces.querySelectorAll('button')){const active=Number(b.dataset.index)===index;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;}
  const token=data.tokens[index];$('selected-position').textContent=`${index+1} / ${data.tokens.length}`;$('selected-id').textContent=token.id;
  $('selected-text').textContent=token.text===null?'Tek başına tam bir UTF-8 karakteri oluşturmuyor.':token.text.replace(/ /g,'␠').replace(/\n/g,'↵').replace(/\r/g,'␍').replace(/\t/g,'⇥');
  $('selected-bytes').textContent=hex(token.bytes);
  $('selected-explanation').textContent=token.text===null?`Bu token ${token.bytes.length} bayt içeriyor. Karakter ancak komşu tokenların baytlarıyla tamamlanıyor; aşağıdaki metinde görünen karakterin tamamını vurguluyoruz.`:`Bu token ${token.bytes.length} UTF-8 baytı içeriyor. Renkler yalnızca parça sınırlarını ayırt etmek için kullanılıyor.`;
  const covered=spans.filter(s=>s.end>token.start&&s.start<token.end),from=covered[0]?.from??0,to=covered.at(-1)?.to??from;
  const first=spans.findIndex(s=>s.end>token.start),last=spans.findLastIndex(s=>s.start<token.end);
  const text=input.value,left=spans[Math.max(0,first-35)]?.from??0,right=spans[Math.min(spans.length-1,last+35)]?.to??text.length,mark=document.createElement('mark');mark.textContent=text.slice(from,to);
  $('selected-context').replaceChildren(document.createTextNode((left?'…':'')+text.slice(left,from)),mark,document.createTextNode(text.slice(to,right)+(right<text.length?'…':'')));
  input.setSelectionRange(from,to);
  const chip=pieces.querySelector(`[data-index="${index}"]`);if(focus){chip?.focus({preventScroll:true});chip?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
 }
 function pump(){
  if(!worker||!ready||busy||!latest||latest.sent)return;
  latest.sent=true;busy=true;const id=latest.id;worker.postMessage({id,text:latest.text});clearTimeout(jobTimer);jobTimer=setTimeout(()=>{if(busy)failure('Bu metin uzun sürdü. Metni kısaltıp tokenizer’ı yeniden yükleyebilirsin.');},8000);
 }
 function request(){
  revision++;clearTimeout(debounce);counts();clearResults();pieces.setAttribute('aria-busy',String(Boolean(worker)));
  if(input.value.length>6000){latest=null;pieces.setAttribute('aria-busy','false');say('Bu küçük deney için metni biraz kısalt. Metnin kesilmedi; sayım yapılmadı.');return;}
  latest={id:revision,text:input.value,sent:false};say(ready?'Parçalar hesaplanıyor…':'Tokenizer yükleniyor… Metnini bu sırada yazabilirsin.');
  if(!worker){pieces.setAttribute('aria-busy','false');say('Tokenizer hazır değil. Yeniden yükleyerek deneyebilirsin.');return;}
  debounce=setTimeout(pump,140);
 }
 function initialize(){
  worker?.terminate();clearTimeout(initTimer);clearTimeout(jobTimer);ready=busy=false;$('retry-worker').hidden=true;
  try{
   const current=new Worker('./worker.js',{type:'module'});worker=current;
   current.onerror=()=>{if(worker===current)failure('Tokenizer yüklenemedi. Bağlantını kontrol edip yeniden deneyebilirsin.');};
   current.onmessage=event=>{
    if(worker!==current)return;
    const result=event.data;
    if(result.type==='ready'){clearTimeout(initTimer);ready=true;pieces.setAttribute('aria-busy',String(Boolean(latest)));pump();return;}
    if(result.type==='init-error'){failure('Tokenizer başlatılamadı. Yeniden yükleyerek deneyebilirsin.');return;}
    if(result.type!=='result'&&result.type!=='error')return;
    clearTimeout(jobTimer);busy=false;
    if(result.id===revision){
     pieces.setAttribute('aria-busy','false');
     if(result.type==='error'){clearResults();say('Bu metin için sayım tamamlanamadı. Metni değiştirip yeniden deneyebilirsin.');}
     else{data=result;spans=buildSpans(input.value);$('token-count').textContent=result.tokens.length;renderPieces();say(result.tokens.length?`${result.tokens.length} token · cl100k_base. Bir parçaya dokunarak kimliğini incele.`:'Metin boş: 0 token. Bir cümle veya emoji dene.');if(!reduced.matches&&result.tokens.length)pieces.animate([{opacity:.45},{opacity:1}],{duration:220,easing:'ease-out'});}
    }
    pump();
   };
   initTimer=setTimeout(()=>{if(!ready)failure('Tokenizer yüklemesi tamamlanamadı. Yeniden deneyebilirsin.');},15000);
   request();
  }catch{failure('Bu tarayıcıda tokenizer başlatılamadı. Güncel bir tarayıcıyla site üzerinden deneyebilirsin.');counts();}
 }
 input.addEventListener('input',event=>{if(!event.isComposing)request();});input.addEventListener('compositionend',request);
 $('clear-input').addEventListener('click',()=>{input.value='';request();input.focus({preventScroll:true});});
 document.querySelectorAll('[data-sample]').forEach(button=>button.addEventListener('click',()=>{input.value=samples[button.dataset.sample];request();}));
 for(const id of ['show-spaces','show-ids'])$(id).addEventListener('change',()=>{renderPieces();});
 $('previous-page').addEventListener('click',()=>{if(page>0){page--;renderPieces();}});$('next-page').addEventListener('click',()=>{if(data&&(page+1)*PAGE_SIZE<data.tokens.length){page++;renderPieces();}});
 pieces.addEventListener('keydown',event=>{if(!data?.tokens.length||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;event.preventDefault();const index=Number(event.target.closest('button')?.dataset.index??page*PAGE_SIZE);select(event.key==='Home'?0:event.key==='End'?data.tokens.length-1:Math.max(0,Math.min(data.tokens.length-1,index+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1))),true);});
 $('retry-worker').addEventListener('click',initialize);
 function syncTheme(){$('theme-toggle').setAttribute('aria-label',document.documentElement.dataset.theme==='dark'?'Açık temaya geç':'Koyu temaya geç');document.querySelector('meta[name="theme-color"]').content=document.documentElement.dataset.theme==='dark'?'#17161A':'#FAF9F7';}
 $('theme-toggle').addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('open-notes-theme',theme);}catch{}syncTheme();});syncTheme();
 window.addEventListener('pagehide',()=>{clearTimeout(initTimer);clearTimeout(jobTimer);clearTimeout(debounce);worker?.terminate();worker=null;ready=busy=false;});
 window.addEventListener('pageshow',event=>{if(event.persisted)initialize();});
 reduced.addEventListener('change',()=>{if(reduced.matches)pieces.getAnimations().forEach(animation=>animation.cancel());});
 initialize();
})();
