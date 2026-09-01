// 도랑이네 래더빙고 - 상단 브랜드 이미지 로고
(function(){
  if(window.__dorangBrandLogoLoaded)return;
  window.__dorangBrandLogoLoaded=true;

  function applyBrandLogo(){
    const logo=document.querySelector('.topbar .brand .logo');
    if(!logo)return;
    if(logo.querySelector('.dorang-brand-logo-img'))return;

    logo.textContent='';
    logo.classList.add('dorang-brand-image-logo');

    const img=document.createElement('img');
    img.className='dorang-brand-logo-img';
    img.src='assets/dorang-heart-logo.webp?v=1';
    img.alt='도랑이네 래더빙고';
    logo.appendChild(img);
  }

  const style=document.createElement('style');
  style.id='dorang-brand-logo-style';
  style.textContent=`
    .topbar .brand{align-items:center!important;gap:10px!important}
    .topbar .brand .logo.dorang-brand-image-logo{
      width:58px!important;
      height:58px!important;
      min-width:58px!important;
      min-height:58px!important;
      padding:0!important;
      margin:0!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      background:transparent!important;
      border:none!important;
      border-radius:0!important;
      box-shadow:none!important;
      overflow:visible!important;
      font-size:0!important;
    }
    .topbar .brand .dorang-brand-logo-img{
      display:block!important;
      width:58px!important;
      height:58px!important;
      max-width:none!important;
      max-height:none!important;
      object-fit:contain!important;
      object-position:center!important;
      filter:none!important;
    }
    @media(max-width:1024px){
      .topbar .brand .logo.dorang-brand-image-logo,
      .topbar .brand .dorang-brand-logo-img{
        width:52px!important;
        height:52px!important;
        min-width:52px!important;
        min-height:52px!important;
      }
    }
  `;
  document.head.appendChild(style);

  applyBrandLogo();
  setTimeout(applyBrandLogo,0);
  setTimeout(applyBrandLogo,500);
})();
