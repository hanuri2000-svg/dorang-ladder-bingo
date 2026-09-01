// 도랑이네 래더빙고 - 상단 심플 하트 로고
(function(){
  if(window.__dorangBrandLogoLoaded)return;
  window.__dorangBrandLogoLoaded=true;

  function applyBrandLogo(){
    const logo=document.querySelector('.topbar .brand .logo');
    if(!logo)return;
    logo.innerHTML='<span class="dorang-heart-mark" aria-hidden="true">💗</span>';
    logo.classList.add('dorang-heart-logo');
  }

  const style=document.createElement('style');
  style.id='dorang-brand-logo-style';
  style.textContent=`
    .topbar .brand{align-items:center!important;gap:10px!important}
    .topbar .brand .logo.dorang-heart-logo{
      width:54px!important;
      height:54px!important;
      min-width:54px!important;
      min-height:54px!important;
      padding:0!important;
      margin:0!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      background:linear-gradient(145deg,#fff7fb,#ffe9f1)!important;
      border:1.5px solid #f4bfd1!important;
      border-radius:17px!important;
      box-shadow:0 5px 14px rgba(228,126,164,.14)!important;
      overflow:hidden!important;
      font-size:0!important;
    }
    .topbar .brand .dorang-heart-mark{
      display:block!important;
      font-size:29px!important;
      line-height:1!important;
      transform:translateY(1px);
    }
    @media(max-width:1024px){
      .topbar .brand .logo.dorang-heart-logo{
        width:50px!important;
        height:50px!important;
        min-width:50px!important;
        min-height:50px!important;
      }
      .topbar .brand .dorang-heart-mark{font-size:27px!important}
    }
  `;
  document.head.appendChild(style);

  applyBrandLogo();
  setTimeout(applyBrandLogo,0);
  setTimeout(applyBrandLogo,400);
})();
