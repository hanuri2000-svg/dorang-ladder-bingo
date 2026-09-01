// 도랑이네 래더빙고 - 화이트 테마 선명도 보정
(function(){
  if(document.getElementById('dorang-border-boost')) return;
  const style=document.createElement('style');
  style.id='dorang-border-boost';
  style.textContent=`
    :root{
      --line:#ccd5e4!important;
      --line-strong:#b9c5d8!important;
      --line-soft:#d9e0ec!important;
    }

    .topbar,
    .panel,
    .welcome-card,
    .entry,
    .modal,
    .toast{
      border-color:#ccd5e4!important;
      box-shadow:0 10px 28px rgba(84,98,128,.08),0 0 0 1px rgba(201,210,226,.65) inset!important;
    }

    .teamcard{
      border:1.5px solid #ccd5e4!important;
      box-shadow:0 6px 18px rgba(84,98,128,.05),0 0 0 1px rgba(255,255,255,.5) inset!important;
    }
    .teamcard.a{border-color:#9fc8ff!important}
    .teamcard.b{border-color:#f6b4cb!important}

    input,select,textarea,
    .btn,.mode-tab,.mode-choice,.join-team-btn,
    .status,.bonusbox span,.player,.logitem,.pill,.selfjoin-info{
      border-color:#ccd5e4!important;
    }

    input,select,textarea{
      box-shadow:0 0 0 1px rgba(255,255,255,.55) inset!important;
    }
    input:focus,select:focus,textarea:focus{
      border-color:#9b8cff!important;
      box-shadow:0 0 0 3px rgba(155,140,255,.12)!important;
    }

    .board{gap:8px!important}
    .cell{
      border:1.5px solid #c9d2e2!important;
      box-shadow:0 1px 0 rgba(255,255,255,.75) inset,0 4px 12px rgba(119,131,154,.08)!important;
    }
    .cell.clickable:hover{
      border-color:#aab7ca!important;
      box-shadow:0 1px 0 rgba(255,255,255,.85) inset,0 8px 16px rgba(119,131,154,.12)!important;
    }
    .cell.a{
      border-color:#8dc0ff!important;
      box-shadow:0 0 0 1px rgba(255,255,255,.3) inset,0 6px 14px rgba(93,169,255,.16)!important;
    }
    .cell.b{
      border-color:#f4a9c4!important;
      box-shadow:0 0 0 1px rgba(255,255,255,.3) inset,0 6px 14px rgba(255,127,168,.14)!important;
    }
    .cell.match{
      outline:3px solid #f4c95b!important;
      box-shadow:0 0 0 5px rgba(244,201,91,.18),0 8px 20px rgba(244,201,91,.14)!important;
    }
    .bingo-line{
      box-shadow:inset 0 0 0 2px rgba(255,255,255,.85),0 0 0 1px rgba(140,155,180,.3)!important;
    }

    .divider{
      background:#b9c5d8!important;
      opacity:.75!important;
    }
    .player,.logitem,.status,.selfjoin-info,.bonusbox span{
      border-width:1.5px!important;
    }

    .broadcast .center{border-color:#c7d0df!important}
    .broadcast .cell{border-color:#c3ccda!important}
    .broadcast .teamcard.a{border-color:#90c0fb!important}
    .broadcast .teamcard.b{border-color:#f0a6c0!important}

    @media(max-width:1024px){
      .topbar,.panel,.teamcard,.cell,input,select,textarea,.btn,.player,.logitem{
        border-width:1.4px!important;
      }
    }
  `;
  document.head.appendChild(style);
})();

// 남/여 연승 기준 기능 로드
(function(){
  if(document.querySelector('script[data-gender-streak-loader]'))return;
  const s=document.createElement('script');
  s.dataset.genderStreakLoader='yes';
  s.src='gender-streak.js?v=1';
  document.body.appendChild(s);
})();

// 페이지 기본 UI가 모두 만들어진 뒤 브랜드/버전/기본 방설정/선수별 타이머/송출/입력/레이아웃/자동종료/치킨 UI 기능을 순서대로 로드한다.
window.addEventListener('load',()=>{
  const files=[
    ['brand-logo.js?v=2','brand-logo-loader'],
    ['version-badge.js?v=3','version-badge-loader'],
    ['default-room-settings.js?v=1','default-room-settings-loader'],
    ['player-timer.js?v=1','player-timer-loader'],
    ['timer-hms.js?v=2','timer-hms-loader'],
    ['broadcast-fit.js?v=1','broadcast-fit-loader'],
    ['broadcast-timer-display-fix.js?v=5','broadcast-timer-display-fix-loader'],
    ['enter-submit.js?v=1','enter-submit-loader'],
    ['layout-balance.js?v=1','layout-balance-loader'],
    ['click-score.js?v=1','click-score-loader'],
    ['auto-finish.js?v=2','auto-finish-loader'],
    ['time-over-result-fix.js?v=1','time-over-result-fix-loader'],
    ['chicken-ui.js?v=1','chicken-ui-loader']
  ];
  files.forEach(([src,key])=>{
    if(document.querySelector(`script[data-${key}]`))return;
    const s=document.createElement('script');
    s.setAttribute(`data-${key}`,'yes');
    s.src=src;
    s.async=false;
    document.body.appendChild(s);
  });
});