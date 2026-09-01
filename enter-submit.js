// 도랑이네 래더빙고 - 점수 입력 Enter 즉시 적용
(function(){
  if(window.__dorangEnterSubmitLoaded)return;
  window.__dorangEnterSubmitLoaded=true;

  function bind(){
    const input=document.getElementById('gainScore');
    const btn=document.getElementById('applyResultBtn');
    if(!input||!btn||input.dataset.enterSubmitBound==='yes')return;
    input.dataset.enterSubmitBound='yes';
    input.addEventListener('keydown',e=>{
      if(e.key!=='Enter'||e.isComposing||e.repeat)return;
      e.preventDefault();
      btn.click();
    });
  }

  bind();
  setTimeout(bind,0);
  setInterval(bind,1200);
})();
