// 도랑이네 래더빙고 - 아기자기 파스텔 테마
(function(){
  if(document.getElementById('dorang-cute-theme')) return;
  const style=document.createElement('style');
  style.id='dorang-cute-theme';
  style.textContent=`

/* 도랑이네 래더빙고 - 아기자기 테마 오버라이드 */

:root{
  --bg:#fff8fc;
  --bg2:#f9fbff;
  --panel:#ffffff;
  --panel2:#fffafd;
  --line:#e6d8ea;
  --line-strong:#d9c4e3;
  --text:#4e4760;
  --muted:#8f88a3;

  --accent:#b695ff;
  --accent-soft:#f1e8ff;

  --a:#7fc8ff;
  --a-soft:#eaf7ff;
  --b:#ff9ec2;
  --b-soft:#fff0f6;

  --green:#79d8b2;
  --yellow:#ffd97d;
  --red:#ff879c;

  --empty:#faf6fb;
}

html,body{
  background:
    radial-gradient(circle at 0% 0%, #fff0f8 0%, transparent 28%),
    radial-gradient(circle at 100% 10%, #eef7ff 0%, transparent 24%),
    linear-gradient(180deg, #fffafc 0%, #f8fbff 100%) !important;
  color:var(--text) !important;
}

.topbar,
.panel,
.welcome-card,
.entry,
.modal{
  background:rgba(255,255,255,.94) !important;
  border:1.5px solid var(--line) !important;
  box-shadow:
    0 12px 28px rgba(181,149,255,.08),
    0 4px 10px rgba(127,200,255,.06) !important;
}

.logo{
  background:linear-gradient(145deg,#c8b4ff,#ffb6d4) !important;
  color:#fff !important;
  border:2px solid #fff !important;
  box-shadow:0 6px 16px rgba(190,160,255,.24) !important;
}

.brand h1,
.hero h1{
  color:#6b5b86 !important;
  letter-spacing:.01em;
}

.brand .sub,
.hero p,
.muted,
.panel h3,
.field label{
  color:var(--muted) !important;
}

.pill,
.selfjoin-info,
.status,
.bonusbox span,
.logitem,
.player{
  background:#fff !important;
  border:1.5px solid var(--line) !important;
  color:var(--text) !important;
}

button,
input,
select,
textarea{
  font-family:inherit;
}

input,select,textarea{
  background:#fff !important;
  color:var(--text) !important;
  border:1.5px solid #dfd4e9 !important;
  box-shadow:0 1px 0 rgba(255,255,255,.9) inset !important;
}
input:focus,select:focus,textarea:focus{
  border-color:#b695ff !important;
  box-shadow:0 0 0 3px rgba(182,149,255,.14) !important;
}

.btn{
  background:#fff !important;
  color:#685a80 !important;
  border:1.5px solid #dfd4e9 !important;
  border-radius:14px !important;
  box-shadow:0 6px 14px rgba(182,149,255,.08) !important;
}
.btn:hover{
  transform:translateY(-1px);
}
.btn.primary{
  background:linear-gradient(135deg,#c7adff,#ffb4cf) !important;
  color:#fff !important;
  border:0 !important;
}
.btn.a{
  background:linear-gradient(135deg,#e9f7ff,#d4f0ff) !important;
  color:#4d7fa6 !important;
  border-color:#b7dfff !important;
}
.btn.b{
  background:linear-gradient(135deg,#fff0f6,#ffe1ee) !important;
  color:#aa5f7d !important;
  border-color:#ffc3d8 !important;
}
.btn.danger{
  background:linear-gradient(135deg,#fff4f6,#ffe2e9) !important;
  color:#cc6480 !important;
  border-color:#ffc6d6 !important;
}

.mode-choice,
.mode-tab,
.join-team-btn{
  background:#fff !important;
  border:1.5px solid var(--line) !important;
  color:#6a5f81 !important;
  border-radius:14px !important;
}
.mode-choice.active,
.mode-tab.active{
  background:linear-gradient(135deg,#f2eaff,#ffeef6) !important;
  border-color:#ccb4ff !important;
}
.join-team-btn.active.a{
  background:linear-gradient(135deg,#edf9ff,#dff3ff) !important;
  border-color:#a8d5ff !important;
}
.join-team-btn.active.b{
  background:linear-gradient(135deg,#fff2f7,#ffe5ef) !important;
  border-color:#ffb8d1 !important;
}

.teamcard{
  border:1.5px solid var(--line) !important;
  border-radius:18px !important;
  box-shadow:0 10px 22px rgba(170,170,190,.08) !important;
}
.teamcard.a{
  background:linear-gradient(135deg,#f4fbff,#eaf7ff) !important;
  border-color:#b8dcff !important;
}
.teamcard.b{
  background:linear-gradient(135deg,#fff7fa,#fff0f6) !important;
  border-color:#ffc8dc !important;
}
.teamcard .name{ color:#7c6c96 !important; }
.teamcard .big{ color:#65587c !important; }
.teamcard .mini{ color:#938aa9 !important; }

.board{
  gap:10px !important;
}

.cell{
  background:
    radial-gradient(circle at 80% 20%, rgba(255,255,255,.9) 0 10%, transparent 11%),
    linear-gradient(180deg, #fffefd 0%, #fbf6fd 100%) !important;
  border:1.5px solid #e2d5e8 !important;
  border-radius:18px !important;
  color:#65587c !important;
  box-shadow:
    0 1px 0 rgba(255,255,255,.95) inset,
    0 8px 18px rgba(193,165,214,.10) !important;
  font-weight:900 !important;
}

.cell::before{
  content:"✦";
  position:absolute;
  left:8px;
  top:6px;
  font-size:10px;
  color:#e7c7f7;
  opacity:.85;
}
.cell::after{
  content:"🐾";
  position:absolute;
  right:7px;
  bottom:5px;
  font-size:10px;
  opacity:.18;
}

.cell.clickable:hover{
  border-color:#c5b1df !important;
  transform:translateY(-2px) scale(1.02);
  box-shadow:
    0 1px 0 rgba(255,255,255,.95) inset,
    0 12px 22px rgba(182,149,255,.16) !important;
}

.cell.a{
  background:
    radial-gradient(circle at 85% 20%, rgba(255,255,255,.85) 0 10%, transparent 11%),
    linear-gradient(180deg,#eef9ff 0%,#dff1ff 100%) !important;
  border-color:#9fd2ff !important;
  color:#43779c !important;
}

.cell.b{
  background:
    radial-gradient(circle at 85% 20%, rgba(255,255,255,.85) 0 10%, transparent 11%),
    linear-gradient(180deg,#fff3f8 0%,#ffe3ee 100%) !important;
  border-color:#ffb5d0 !important;
  color:#a65e7c !important;
}

.cell.match{
  outline:3px solid #ffd77b !important;
  box-shadow:
    0 0 0 5px rgba(255,215,123,.20),
    0 8px 20px rgba(255,215,123,.14) !important;
}

.bingo-line{
  box-shadow:
    inset 0 0 0 3px rgba(255,255,255,.95),
    0 0 0 2px rgba(182,149,255,.20) !important;
}

.player{
  border-radius:14px !important;
}
.teamtag{
  border-radius:999px !important;
  font-weight:800 !important;
}
.teamtag.a{
  background:#e7f5ff !important;
  color:#5690bb !important;
}
.teamtag.b{
  background:#fff0f6 !important;
  color:#b86d8d !important;
}

.logitem{
  border-radius:12px !important;
  background:linear-gradient(180deg,#fff 0%, #fffafc 100%) !important;
}

.divider{
  background:linear-gradient(90deg, transparent 0%, #ddd0e6 15%, #ddd0e6 85%, transparent 100%) !important;
  height:2px !important;
}

.welcome{
  background:
    radial-gradient(circle at 10% 0%, #fff2f8 0%, transparent 26%),
    radial-gradient(circle at 95% 8%, #eef6ff 0%, transparent 24%),
    linear-gradient(180deg, #fffafc 0%, #f8fbff 100%) !important;
}

.broadcast .center,
.broadcast .teamcards,
.broadcast .boardbox{
  background:transparent !important;
}
.broadcast .teamcard{
  box-shadow:0 8px 20px rgba(170,170,190,.10) !important;
}
.broadcast .cell .owner{
  display:none !important;
}

.panel h2{
  color:#73658c !important;
  font-weight:900 !important;
}

@media (max-width: 900px){
  .cell{
    border-radius:14px !important;
  }
  .board{
    gap:7px !important;
  }
}

  `;
  document.head.appendChild(style);
})();
