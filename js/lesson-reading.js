(() => {
  'use strict';
  const app=document.getElementById('app');
  const reading=document.getElementById('lesson-reading');
  const articles=[...document.querySelectorAll('[data-lesson-scene]')];
  if(!app||!reading||!articles.length)return;
  let previous=null;
  function sync() {
    const number=Number(app.dataset.scene);
    if(number===previous||!articles.some(article=>Number(article.dataset.lessonScene)===number))return;
    const changed=previous!==null;
    for(const article of articles) {
      const active=Number(article.dataset.lessonScene)===number;
      article.hidden=!active;
      article.inert=!active;
    }
    previous=number;
    // Deney içindeki ara adımlar aynı sahnede kalır; okuma konumunu bozmaz.
    if(changed&&!document.querySelector('dialog[open]')&&!app.classList.contains('notes-open')) {
      window.scrollTo({top:0,behavior:'instant'});
    }
  }
  new MutationObserver(sync).observe(app,{attributes:true,attributeFilter:['data-scene']});
  document.querySelectorAll('.lesson-jump,.lesson-return').forEach(link=>link.addEventListener('click',event=>{
    const target=document.getElementById(link.getAttribute('href').slice(1));
    if(!target)return;
    event.preventDefault();
    target.scrollIntoView({block:'start',behavior:'instant'});
    // URL'deki sahne numarası korunur; görsele gitmek yeniden yüklemede sahneyi değiştirmez.
  }));
  sync();
})();
