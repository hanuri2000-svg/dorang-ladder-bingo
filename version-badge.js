// 도랑이네 래더빙고 - 앱 버전 표시
(function(){
  if(window.__dorangVersionBadgeLoaded)return;
  window.__dorangVersionBadgeLoaded=true;

  const VERSION='1.0.3';
  window.DORANG_APP_VERSION=VERSION;

  const style=document.createElement('style');
  style.id='dorang-version-badge-style';
  style.textContent=`
    .dorang-version-badge{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      min-height:20px!important;
      padding:2px 8px!important;
      margin-left:7px!important;
      border:1px solid #d9c8e8!important;
      border-radius:999px!important;
      background:linear-gradient(135deg,#fff8fc,#f3f2ff)!important;
      color:#8b789e!important;
      font-size:11px!important;
      line-height:1!important;
      font-weight:900!important;
      letter-spacing:.2px!important;
      vertical-align:middle!important;
      box-sizing:border-box!important;
      white-space:nowrap!important;
    }
    .topbar .brand .dorang-title-line{
      display:flex!important;
      align-items:center!important;
      flex-wrap:wrap!important;
      gap:0!important;
    }
    .topbar .brand .dorang-title-line #roomTitle{margin:0!important}
    .hero .dorang-version-badge{
      margin:8px 0 0!important;
      min-height:22px!important;
      padding:3px 9px!important;
      font-size:11px!important;
    }
    .broadcast .dorang-version-badge{display:none!important}
  `;
  document.head.appendChild(style);

  function apply(){
    const roomTitle=document.getElementById('roomTitle');
    if(roomTitle&&!document.getElementById('dorangTopVersionBadge')){
      const parent=roomTitle.parentElement;
      if(parent){
        let line=parent.querySelector('.dorang-title-line');
        if(!line){
          line=document.createElement('div');
          line.className='dorang-title-line';
          parent.insertBefore(line,roomTitle);
          line.appendChild(roomTitle);
        }
        const badge=document.createElement('span');
        badge.id='dorangTopVersionBadge';
        badge.className='dorang-version-badge';
        badge.textContent=`v${VERSION}`;
        line.appendChild(badge);
      }
    }

    const hero=document.querySelector('#welcome .hero');
    if(hero&&!document.getElementById('dorangWelcomeVersionBadge')){
      const badge=document.createElement('span');
      badge.id='dorangWelcomeVersionBadge';
      badge.className='dorang-version-badge';
      badge.textContent=`VERSION v${VERSION}`;
      const title=hero.querySelector('h1');
      if(title)title.insertAdjacentElement('afterend',badge);
      else hero.prepend(badge);
    }
  }

  apply();
  setTimeout(apply,0);
  setTimeout(apply,400);
  window.addEventListener('load',apply);
})();