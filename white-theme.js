// 도랑이네 래더빙고 - 화이트 테마
(function(){
  const style=document.createElement('style');
  style.id='dorang-white-theme';
  style.textContent=`
    :root{
      --bg:#f6f7fb!important;
      --panel:#ffffff!important;
      --panel2:#f7f8fc!important;
      --line:#e2e6ef!important;
      --text:#202635!important;
      --muted:#7a8496!important;
      --a:#5aa7ff!important;
      --b:#ff7fa7!important;
      --accent:#8f7cf6!important;
      --green:#43b987!important;
      --yellow:#f1b94d!important;
      --red:#ef6677!important;
      --empty:#f4f6fa!important;
    }

    html,body{
      background:linear-gradient(135deg,#fbfcff 0%,#f6f3ff 46%,#eef7ff 100%)!important;
      color:#202635!important;
    }

    /* 첫 화면 */
    .welcome-card{
      background:rgba(255,255,255,.96)!important;
      border:1px solid #e4e7ef!important;
      box-shadow:0 28px 80px rgba(76,86,125,.14)!important;
    }
    .hero h1{color:#22283a!important}
    .hero p,.muted,.field label,.brand .sub{color:#7a8496!important}
    .entry{
      background:#fbfbfe!important;
      border:1px solid #e6e8f0!important;
      box-shadow:0 8px 24px rgba(67,76,110,.05)!important;
    }
    .mode-choice{
      background:#fff!important;
      border-color:#e1e5ee!important;
      color:#293042!important;
    }
    .mode-choice.active{
      background:linear-gradient(135deg,#f1edff,#ebe8ff)!important;
      border-color:#9a8af4!important;
      box-shadow:0 5px 14px rgba(143,124,246,.12)!important;
    }
    .mode-choice small{color:#7f8797!important}
    .setup-note{
      background:#f8f6ff!important;
      border-color:#cfc6fb!important;
      color:#665f86!important;
    }

    /* 상단 / 카드 */
    .topbar{
      background:rgba(255,255,255,.94)!important;
      border-color:#e3e6ee!important;
      box-shadow:0 10px 32px rgba(54,66,103,.08)!important;
    }
    .brand h1{color:#24293a!important}
    .logo{
      background:linear-gradient(145deg,#7c6ff0,#b69cff)!important;
      color:#fff!important;
      box-shadow:0 7px 18px rgba(124,111,240,.24)!important;
    }
    .pill{
      background:#f7f8fb!important;
      border-color:#e1e5ed!important;
      color:#4a5365!important;
    }
    .panel{
      background:rgba(255,255,255,.97)!important;
      border-color:#e2e6ef!important;
      box-shadow:0 14px 36px rgba(62,73,107,.08)!important;
    }
    .panel h2,.panel h3{color:#252c3c!important}
    .divider{background:#e7e9ef!important}

    /* 입력 / 버튼 */
    input,select,textarea{
      background:#fff!important;
      color:#222938!important;
      border-color:#dfe4ed!important;
      box-shadow:inset 0 1px 2px rgba(42,50,80,.025)!important;
    }
    input:focus,select:focus,textarea:focus{
      border-color:#9888f3!important;
      box-shadow:0 0 0 3px rgba(143,124,246,.11)!important;
    }
    input::placeholder,textarea::placeholder{color:#a1a9b8!important}
    .btn{
      background:#f7f8fb!important;
      color:#343b4d!important;
      border-color:#dfe4ec!important;
      box-shadow:0 2px 5px rgba(54,66,98,.04)!important;
    }
    .btn:hover{background:#f1f3f8!important}
    .btn.primary{
      background:linear-gradient(135deg,#8c7bf4,#ab8df7)!important;
      color:#fff!important;
      border-color:transparent!important;
      box-shadow:0 7px 16px rgba(140,123,244,.22)!important;
    }
    .btn.a{
      background:#edf6ff!important;
      border-color:#b9dafb!important;
      color:#2468a4!important;
    }
    .btn.b{
      background:#fff0f5!important;
      border-color:#f8c5d5!important;
      color:#a64263!important;
    }
    .btn.danger{
      background:#fff1f3!important;
      border-color:#f3c9cf!important;
      color:#b84c5c!important;
    }
    .mode-tab{
      background:#f6f7fb!important;
      color:#656d7d!important;
      border-color:#e1e5ed!important;
    }
    .mode-tab.active{
      background:#eeeaff!important;
      color:#6757c9!important;
      border-color:#a899f4!important;
    }

    /* 팀 현황 */
    .teamcard{
      border-color:#e2e6ef!important;
      box-shadow:0 5px 14px rgba(54,68,100,.05)!important;
    }
    .teamcard.a{background:linear-gradient(135deg,#f5faff,#edf6ff)!important}
    .teamcard.b{background:linear-gradient(135deg,#fff7fa,#fff0f5)!important}
    .teamcard .name,.teamcard .big{color:#263044!important}
    .teamcard .mini{color:#7b8494!important}

    /* 빙고판 */
    .cell{
      background:linear-gradient(145deg,#ffffff,#f2f5fa)!important;
      border-color:#dce2eb!important;
      color:#2f384b!important;
      box-shadow:0 3px 9px rgba(65,77,108,.06)!important;
    }
    .cell.clickable:hover{
      border-color:#a8b4c7!important;
      box-shadow:0 5px 14px rgba(65,77,108,.10)!important;
    }
    .cell.a{
      background:linear-gradient(145deg,#78bbff,#4f9ff1)!important;
      color:#fff!important;
      border-color:#4895e6!important;
      box-shadow:0 5px 13px rgba(74,156,238,.22)!important;
    }
    .cell.b{
      background:linear-gradient(145deg,#ff9abb,#f2749e)!important;
      color:#fff!important;
      border-color:#ea6b95!important;
      box-shadow:0 5px 13px rgba(242,116,158,.22)!important;
    }
    .cell .owner,.cell .mark{color:inherit!important}
    .cell.match{
      outline:3px solid #f2bd4e!important;
      box-shadow:0 0 0 5px rgba(242,189,78,.16),0 7px 18px rgba(81,91,118,.10)!important;
    }
    .bingo-line{box-shadow:inset 0 0 0 3px rgba(255,255,255,.75),0 5px 14px rgba(60,72,110,.10)!important}

    /* 명단 / 상태 / 기록 */
    .roster-under-board,.player,.logitem,.status,.bonusbox span,.selfjoin-info{
      background:#f9fafc!important;
      border-color:#e1e5ed!important;
      color:#343c4d!important;
    }
    .roster-under-board{box-shadow:0 7px 18px rgba(58,69,101,.05)!important}
    .player small,.roster-under-title span{color:#80899a!important}
    .teamtag.a{background:#e7f3ff!important;color:#3376b6!important}
    .teamtag.b{background:#ffeaf1!important;color:#b24e70!important}
    .status.warn{background:#fff9e9!important;border-color:#efdca3!important;color:#8a6a18!important}
    .status.good{background:#eefaf5!important;border-color:#bce6d4!important;color:#34775d!important}

    /* 설정 영역 */
    .settings-static{background:transparent!important}

    /* 모달 / 토스트 */
    .modalback{background:rgba(44,50,67,.30)!important;backdrop-filter:blur(4px)}
    .modal{
      background:#fff!important;
      border-color:#e1e5ed!important;
      color:#252c3b!important;
      box-shadow:0 24px 70px rgba(50,58,87,.18)!important;
    }
    .toast{
      background:#ffffff!important;
      color:#30384a!important;
      border-color:#dfe3eb!important;
      box-shadow:0 12px 30px rgba(50,59,88,.16)!important;
    }
    .join-team-btn{
      background:#f8f9fc!important;
      color:#31394a!important;
      border-color:#e0e4ec!important;
    }
    .join-team-btn.active.a{background:#eaf5ff!important;border-color:#66adf3!important;color:#276b9f!important}
    .join-team-btn.active.b{background:#fff0f5!important;border-color:#ef82a5!important;color:#a64565!important}

    /* 미니 송출 화면도 화이트 테마 */
    body.broadcast{
      background:#f4f6fa!important;
    }
    .broadcast .center{
      background:#ffffff!important;
      border-color:#e0e5ed!important;
      box-shadow:none!important;
    }
    .broadcast .teamcard.a{background:linear-gradient(135deg,#f2f9ff,#e8f4ff)!important}
    .broadcast .teamcard.b{background:linear-gradient(135deg,#fff6f9,#ffeaf1)!important}
    .broadcast .cell{
      background:linear-gradient(145deg,#ffffff,#eef2f7)!important;
      border-color:#d6dde7!important;
      color:#273247!important;
      box-shadow:none!important;
    }
    .broadcast .cell.a{
      background:linear-gradient(145deg,#72b8fb,#4c9ceb)!important;
      color:#fff!important;
      border-color:#418fdc!important;
    }
    .broadcast .cell.b{
      background:linear-gradient(145deg,#ff96b7,#ef729c)!important;
      color:#fff!important;
      border-color:#e76691!important;
    }
  `;
  document.head.appendChild(style);
})();
