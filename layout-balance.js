// 도랑이네 래더빙고 - 좌우 패널 확장 / 빙고판 크기 유지
(function(){
  if(window.__dorangLayoutBalanceLoaded)return;
  window.__dorangLayoutBalanceLoaded=true;

  const style=document.createElement('style');
  style.id='dorang-layout-balance-style';
  style.textContent=`
    body:not(.broadcast) .layout{
      grid-template-columns:340px minmax(560px,720px) 390px!important;
      justify-content:center!important;
      gap:12px!important;
    }
    body:not(.broadcast) .panel.left{width:100%!important;}
    body:not(.broadcast) .panel.right{width:100%!important;}
    body:not(.broadcast) .panel.center{
      width:100%!important;
      max-width:720px!important;
      justify-self:center!important;
    }

    /* 빙고판은 과하게 키우지 않고 기존 보기 좋은 크기 유지 */
    body:not(.broadcast) .board{
      width:min(455px,62vh,100%)!important;
      max-width:455px!important;
      min-width:0!important;
      min-height:0!important;
      margin-left:auto!important;
      margin-right:auto!important;
    }
    body:not(.broadcast) .game-timer-bar{
      width:min(455px,100%)!important;
      max-width:455px!important;
    }
    body:not(.broadcast) .teamcards{
      width:min(520px,100%)!important;
      margin-left:auto!important;
      margin-right:auto!important;
    }
    body:not(.broadcast) .roster-under-board{
      width:min(680px,100%)!important;
    }

    /* 넓어진 좌우 패널에 맞춰 입력부도 조금 여유 있게 */
    body:not(.broadcast) .settings-static input,
    body:not(.broadcast) .settings-static select,
    body:not(.broadcast) .settings-static .btn{
      font-size:12px!important;
    }
    body:not(.broadcast) .panel.right .btn{
      min-height:36px;
    }

    @media(max-width:1500px){
      body:not(.broadcast) .layout{
        grid-template-columns:315px minmax(520px,680px) 350px!important;
        gap:10px!important;
      }
      body:not(.broadcast) .panel.center{max-width:680px!important;}
      body:not(.broadcast) .board{width:min(445px,60vh,100%)!important;max-width:445px!important;}
    }

    @media(max-width:1250px){
      body:not(.broadcast) .layout{
        grid-template-columns:285px minmax(470px,1fr) 315px!important;
      }
      body:not(.broadcast) .panel.center{max-width:none!important;}
      body:not(.broadcast) .board{width:min(420px,58vh,100%)!important;max-width:420px!important;}
    }
  `;
  document.head.appendChild(style);
})();
