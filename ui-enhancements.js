// 도랑이네 래더빙고 UI 보정
// 1) 기본 팀명: 도랑팀 / 남의팀
// 2) 왼쪽 설정창은 항상 표시
// 3) 선수 명단은 빙고판 아래로 이동
// 4) 방 코드는 화면에 숨기고 방장만 복사 버튼으로 공유
// 5) 모든 참가자의 송출 화면은 850x720 팝업 + 미니 송출 UI
(function(){
  const a=$('createA'), b=$('createB');
  if(a && (!a.value || a.value==='BLUE')) a.value='도랑팀';
  if(b && (!b.value || b.value==='PINK')) b.value='남의팀';

  function applyRoomCodeShare(){
    const roomCodeBox=document.querySelector('.room-code-box');
    if(roomCodeBox) roomCodeBox.style.display='none';

    const actions=document.querySelector('.top-actions');
    if(!actions || document.getElementById('copyRoomCodeBtn')) return;

    const btn=document.createElement('button');
    btn.id='copyRoomCodeBtn';
    btn.className='btn host-only';
    btn.textContent='📋 방 코드 복사';
    btn.onclick=async()=>{
      if(!roomCode){toast('복사할 방 코드가 없어.');return;}
      try{
        await navigator.clipboard.writeText(roomCode);
        toast(`방 코드 ${roomCode} 복사 완료!`);
      }catch(e){
        console.warn('room code copy failed',e);
        toast(`방 코드: ${roomCode}`);
      }
    };

    const joinBtn=document.getElementById('copyJoinBtn');
    if(joinBtn) actions.insertBefore(btn,joinBtn);
    else actions.appendChild(btn);
  }

  function bindBroadcastPopup(){
    const btn=document.getElementById('openBroadcastBtn');
    if(!btn || btn.dataset.popupBound==='yes') return;
    btn.dataset.popupBound='yes';
    btn.onclick=()=>{
      if(!roomCode){toast('먼저 방에 들어가야 해.');return;}
      const u=new URL(location.href);
      u.search='';
      u.searchParams.set('room',roomCode);
      u.searchParams.set('view','broadcast');

      const width=850, height=720;
      const left=Math.max(0,Math.round((window.screen.availWidth-width)/2));
      const top=Math.max(0,Math.round((window.screen.availHeight-height)/2));
      const features=[
        `width=${width}`,
        `height=${height}`,
        `left=${left}`,
        `top=${top}`,
        'resizable=yes',
        'scrollbars=no',
        'menubar=no',
        'toolbar=no',
        'location=no',
        'status=no'
      ].join(',');

      const popup=window.open(u.toString(),`dorangBroadcast_${roomCode}`,features);
      if(popup){
        try{popup.focus();}catch(e){}
      }else{
        toast('팝업이 차단됐어. 이 사이트의 팝업을 허용해줘.');
      }
    };
  }

  function applyDashboardLayout(){
    const left=document.querySelector('.panel.left');
    const center=document.querySelector('.panel.center');
    const boardbox=center?.querySelector('.boardbox');
    const roster=document.getElementById('roster');
    const rosterEditor=document.querySelector('.roster-editor');
    const settingsFold=document.querySelector('.settings-fold');
    if(!left||!center||!boardbox||!roster)return;

    // 설정 접기 제거 → 왼쪽에 항상 표시
    if(settingsFold && !document.querySelector('.settings-static')){
      const settingsContent=settingsFold.querySelector('.settings-content');
      const wrap=document.createElement('div');
      wrap.className='settings-static host-only';
      const title=document.createElement('h2');
      title.textContent='⚙️ 게임 설정';
      wrap.appendChild(title);
      if(settingsContent){
        while(settingsContent.firstChild) wrap.appendChild(settingsContent.firstChild);
      }
      settingsFold.replaceWith(wrap);
    }

    // 왼쪽의 기존 선수명단 제목 제거
    const leftHeadings=[...left.querySelectorAll(':scope > h2')];
    leftHeadings.forEach(h=>{if(h.textContent.includes('선수 명단'))h.remove();});

    // 빙고판 아래 선수명단 영역 생성
    let rosterSection=document.querySelector('.roster-under-board');
    if(!rosterSection){
      rosterSection=document.createElement('section');
      rosterSection.className='roster-under-board';
      rosterSection.innerHTML='<div class="roster-under-title"><h2>👥 팀 명단</h2><span>경기 참가자 현황</span></div>';
      boardbox.insertAdjacentElement('afterend',rosterSection);
    }
    if(rosterEditor && rosterEditor.parentElement!==rosterSection) rosterSection.appendChild(rosterEditor);
    if(roster.parentElement!==rosterSection) rosterSection.appendChild(roster);

    // 설정을 왼쪽 최상단에 유지
    const settingsStatic=document.querySelector('.settings-static');
    if(settingsStatic && settingsStatic.parentElement===left && left.firstElementChild!==settingsStatic){
      left.prepend(settingsStatic);
    }

    applyRoomCodeShare();
    bindBroadcastPopup();
  }

  // 레이아웃 전용 CSS 주입
  const style=document.createElement('style');
  style.id='dorang-layout-v5';
  style.textContent=`
    .layout{grid-template-columns:285px minmax(540px,1fr) 325px!important;gap:10px!important;}
    .settings-static{display:block;margin:0;}
    .settings-static h2{font-size:15px!important;margin:0 0 10px!important;}
    .settings-static .field{margin:7px 0!important;}
    .settings-static input,.settings-static select{padding:8px 9px!important;font-size:12px!important;}
    .settings-static .btn{padding:8px 9px!important;font-size:11px!important;}
    .settings-static .muted{font-size:10px!important;line-height:1.4;}
    .settings-static .mode-tabs{margin-bottom:8px!important;}

    .room-code-box{display:none!important;}

    .center{overflow:auto!important;}
    .boardbox{flex:0 0 auto!important;min-height:0!important;overflow:visible!important;padding:2px 2px 5px!important;}
    .board{width:min(445px,65vh,100%)!important;min-width:0!important;min-height:0!important;margin:3px auto 0!important;gap:5px!important;}

    .roster-under-board{width:min(760px,100%);margin:8px auto 0;padding:10px;border:1px solid var(--line);border-radius:13px;background:#101621;}
    .roster-under-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px;}
    .roster-under-title h2{margin:0!important;font-size:13px!important;}
    .roster-under-title span{font-size:10px;color:var(--muted);}
    .roster-under-board .roster-editor{margin-bottom:8px!important;}
    .roster-under-board .roster-editor .row{gap:6px!important;}
    .roster-under-board .roster-editor textarea{min-height:50px!important;max-height:70px!important;font-size:11px!important;padding:7px!important;}
    .roster-under-board .roster{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px!important;max-height:185px;overflow:auto;}
    .roster-under-board .player{padding:6px 7px!important;min-width:0;}
    .roster-under-board .player b{font-size:11px!important;}
    .roster-under-board .player small{font-size:9px!important;}

    /* 미니 송출 화면: 작은 방송 구석에 넣어도 숫자가 먼저 보이게 */
    body.broadcast{
      overflow:hidden!important;
      background:#090d14!important;
    }
    .broadcast .topbar,.broadcast .left,.broadcast .right,.broadcast .roster-under-board{display:none!important;}
    .broadcast .app{
      width:100vw!important;
      height:100vh!important;
      max-width:none!important;
      padding:7px!important;
      margin:0!important;
    }
    .broadcast .layout{
      display:block!important;
      width:100%!important;
      height:100%!important;
      min-height:0!important;
    }
    .broadcast .center{
      width:100%!important;
      height:100%!important;
      padding:7px!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      overflow:hidden!important;
      border:1px solid #2b3548!important;
      border-radius:12px!important;
      background:#0d131e!important;
      box-shadow:none!important;
    }
    .broadcast .broadcast-title{display:none!important;}
    .broadcast .teamcards{
      flex:0 0 auto!important;
      width:min(calc(100vh - 90px),calc(100vw - 28px))!important;
      max-width:100%!important;
      margin:0 auto 6px!important;
      gap:5px!important;
      grid-template-columns:1fr 1fr!important;
    }
    .broadcast .teamcard{
      min-height:50px!important;
      padding:6px 9px!important;
      border-radius:9px!important;
      display:grid!important;
      grid-template-columns:1fr auto!important;
      grid-template-rows:1fr!important;
      align-items:center!important;
    }
    .broadcast .teamcard .name{
      font-size:18px!important;
      font-weight:1000!important;
      line-height:1!important;
      grid-column:1!important;
      grid-row:1!important;
      white-space:nowrap!important;
      overflow:hidden!important;
      text-overflow:ellipsis!important;
    }
    .broadcast .teamcard .big{
      font-size:21px!important;
      line-height:1!important;
      grid-column:2!important;
      grid-row:1!important;
      white-space:nowrap!important;
    }
    .broadcast .teamcard .mini{display:none!important;}
    .broadcast .boardbox{
      flex:1 1 auto!important;
      width:100%!important;
      min-height:0!important;
      padding:0!important;
      display:flex!important;
      align-items:flex-start!important;
      justify-content:center!important;
      overflow:hidden!important;
    }
    .broadcast .board{
      width:min(calc(100vh - 82px),calc(100vw - 28px))!important;
      height:auto!important;
      min-width:0!important;
      min-height:0!important;
      max-width:100%!important;
      margin:0 auto!important;
      gap:3px!important;
    }
    .broadcast .cell{
      border-radius:7px!important;
      font-size:clamp(20px,3vw,30px)!important;
      border-width:1px!important;
    }
    .broadcast .cell .owner{display:none!important;}
    .broadcast .cell .mark{font-size:11px!important;right:3px!important;top:2px!important;}

    @media(max-width:1250px){
      body:not(.broadcast) .layout{grid-template-columns:255px minmax(470px,1fr) 295px!important;}
      body:not(.broadcast) .board{width:min(420px,62vh,100%)!important;}
    }
  `;
  if(!document.getElementById(style.id)) document.head.appendChild(style);

  // DOM이 이미 만들어져 있으므로 즉시 적용
  applyDashboardLayout();
  applyRoomCodeShare();
  bindBroadcastPopup();

  // 기본 팀명 마이그레이션
  let tries=0;
  const timer=setInterval(async()=>{
    tries++;
    applyDashboardLayout();
    applyRoomCodeShare();
    bindBroadcastPopup();
    if(typeof currentRoom!=='undefined' && currentRoom){
      if(typeof isHost==='function' && isHost() && currentRoom.teamA==='BLUE' && currentRoom.teamB==='PINK'){
        try{
          await transact(r=>{
            if(r.teamA==='BLUE' && r.teamB==='PINK'){
              r.teamA='도랑팀';
              r.teamB='남의팀';
              logRoom(r,'기본 팀명 변경 → 도랑팀 vs 남의팀.');
            }
          });
        }catch(e){console.warn('team name migration failed',e)}
      }
      clearInterval(timer);
    }else if(tries>30){
      clearInterval(timer);
    }
  },300);
})();