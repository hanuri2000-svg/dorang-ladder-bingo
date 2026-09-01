// 도랑이네 래더빙고 - 송출 팝업 자동 맞춤
(function(){
  if(window.__dorangBroadcastFitLoaded)return;
  window.__dorangBroadcastFitLoaded=true;

  const style=document.createElement('style');
  style.id='dorang-broadcast-fit';
  style.textContent=`
    body.broadcast{overflow:hidden!important;}
    .broadcast .app{padding:5px!important;width:100vw!important;height:100vh!important;overflow:hidden!important;}
    .broadcast .layout{height:100%!important;min-height:0!important;overflow:hidden!important;}
    .broadcast .center{height:100%!important;min-height:0!important;padding:5px!important;overflow:hidden!important;}
    .broadcast .teamcards{
      flex:0 0 44px!important;
      min-height:44px!important;
      width:100%!important;
      max-width:100%!important;
      margin:0 auto 4px!important;
      gap:5px!important;
    }
    .broadcast .teamcard{
      min-height:44px!important;
      height:44px!important;
      padding:5px 9px!important;
      border-radius:9px!important;
    }
    .broadcast .teamcard .name{font-size:16px!important;}
    .broadcast .teamcard .big{font-size:19px!important;}
    .broadcast .boardbox{
      flex:1 1 auto!important;
      min-height:0!important;
      width:100%!important;
      padding:0!important;
      overflow:hidden!important;
      display:flex!important;
      align-items:flex-start!important;
      justify-content:center!important;
    }
    .broadcast .board{
      min-width:0!important;
      min-height:0!important;
      max-width:none!important;
      max-height:none!important;
      aspect-ratio:1/1!important;
      margin:0 auto!important;
      gap:3px!important;
    }
    .broadcast .cell{
      min-width:0!important;
      min-height:0!important;
      border-radius:7px!important;
      font-size:clamp(17px,3vw,27px)!important;
      line-height:1!important;
    }
    .broadcast .cell.a{border-color:#7eb8f8!important;}
    .broadcast .cell.b{border-color:#ef9dbb!important;}
  `;
  document.head.appendChild(style);

  function fitBroadcastBoard(){
    if(typeof broadcast==='undefined'||!broadcast)return;
    const board=document.getElementById('board');
    if(!board)return;
    const w=Math.max(320,window.innerWidth||850);
    const h=Math.max(320,window.innerHeight||650);
    // 팀 카드 44px + 타이머 최대 38px + 간격/패딩을 제외한 실제 정사각형 크기
    const reserve=document.getElementById('gameTimerBar')?98:60;
    const size=Math.max(240,Math.floor(Math.min(w-20,h-reserve)));
    board.style.setProperty('width',size+'px','important');
    board.style.setProperty('height',size+'px','important');
  }

  window.addEventListener('resize',fitBroadcastBoard);
  fitBroadcastBoard();
  setTimeout(fitBroadcastBoard,0);
  setTimeout(fitBroadcastBoard,500);
  setInterval(fitBroadcastBoard,1500);
})();