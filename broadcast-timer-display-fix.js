// 도랑이네 래더빙고 - 송출 전용 안정 타이머 + 경기 결과 표시
(function(){
  if(window.__dorangBroadcastTimerDisplayFixV4)return;
  window.__dorangBroadcastTimerDisplayFixV4=true;

  const isBroadcast=()=>typeof broadcast!=='undefined'&&broadcast;
  function formatTime(ms){
    if(ms==null)return '--:--';
    const total=Math.max(0,Math.ceil(ms/1000));
    const h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
    return h>0?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  function durationSec(){return Math.max(1,Number(currentRoom?.timer?.durationSec||3600));}
  function remainingMs(p){
    if(!p)return null;
    if(!p.timerStarted)return durationSec()*1000;
    if(p.timerRunning)return Math.max(0,Number(p.timerEndAt||0)-Date.now());
    return Math.max(0,Number(p.timerRemainingSec??durationSec())*1000);
  }
  function activePlayers(){
    return (currentRoom?.players||[]).filter(p=>p.timerStarted&&p.gameActive&&!p.timerFinished&&!p.overtimeUsed);
  }
  function displayPlayer(){
    const active=activePlayers();
    if(!active.length)return null;
    return [...active].sort((a,b)=>(remainingMs(a)??Infinity)-(remainingMs(b)??Infinity))[0]||null;
  }

  function ensureStableBar(){
    if(!isBroadcast())return null;
    const center=document.querySelector('.panel.center');
    const teamcards=center?.querySelector('.teamcards');
    if(!center||!teamcards)return null;

    let bar=document.getElementById('broadcastStableTimerBar');
    if(!bar){
      bar=document.createElement('div');
      bar.id='broadcastStableTimerBar';
      bar.className='broadcast-stable-timer';
      bar.innerHTML='<span class="stable-icon">⏱</span><b id="broadcastStableTime">--:--</b><span id="broadcastStableState">진행 중 선수 없음</span>';
    }
    if(bar.parentElement!==center||bar.nextElementSibling!==teamcards)center.insertBefore(bar,teamcards);
    return bar;
  }

  function updateStableBar(){
    if(!isBroadcast())return;
    const bar=ensureStableBar();
    if(!bar)return;

    const g=currentRoom?.gameOver;
    const time=bar.querySelector('#broadcastStableTime');
    const state=bar.querySelector('#broadcastStableState');
    const icon=bar.querySelector('.stable-icon');

    bar.classList.remove('time-over','timer-running','winner-a','winner-b','draw','game-result');

    // 경기 종료가 확정되면 타이머 바 자체를 승리 결과 배너로 사용한다.
    if(g?.ended){
      bar.classList.add('game-result');
      if(g.winner==='A')bar.classList.add('winner-a');
      else if(g.winner==='B')bar.classList.add('winner-b');
      else bar.classList.add('draw');

      if(icon)icon.textContent=g.winner==='DRAW'?'🤝':'🏆';
      if(time){
        time.textContent=g.winner==='A'?`${g.teamA} 승리!`:g.winner==='B'?`${g.teamB} 승리!`:'무승부';
      }
      if(state){
        state.textContent=`${g.aBingo} : ${g.bBingo} BINGO · ${g.aCells} : ${g.bCells}칸`;
      }
      return;
    }

    if(icon)icon.textContent='⏱';
    const enabled=!!currentRoom?.timer?.enabled;
    const active=activePlayers();
    const p=displayPlayer();
    const rem=p?remainingMs(p):null;

    if(time)time.textContent=enabled&&p?formatTime(rem):'--:--';
    if(p&&rem!==null&&rem<=0)bar.classList.add('time-over');
    if(p?.timerRunning&&rem>0)bar.classList.add('timer-running');

    // 송출 화면에서는 선수 이름을 절대 표시하지 않는다.
    if(state){
      if(!enabled)state.textContent='타이머 미설정';
      else if(!p)state.textContent='진행 중 선수 없음';
      else if(rem<=0)state.textContent='TIME OVER · 마지막 경기 인정';
      else if(active.length>1)state.textContent=`진행 중 · ${active.length}명`;
      else state.textContent='진행 중';
    }
  }

  function fitBoard(){
    if(!isBroadcast())return;
    const center=document.querySelector('.panel.center');
    const board=document.getElementById('board');
    const boardbox=center?.querySelector('.boardbox');
    const teamcards=center?.querySelector('.teamcards');
    const timer=ensureStableBar();
    if(!center||!board||!boardbox||!teamcards)return;

    const centerH=center.clientHeight,centerW=center.clientWidth;
    const teamH=teamcards.getBoundingClientRect().height;
    const timerH=timer?.getBoundingClientRect().height||0;
    const usableH=Math.max(210,centerH-teamH-timerH-48);
    const usableW=Math.max(210,centerW-28);
    const size=Math.max(210,Math.floor(Math.min(usableW,usableH)));

    board.style.setProperty('width',size+'px','important');
    board.style.setProperty('height',size+'px','important');
    board.style.setProperty('min-width','0','important');
    board.style.setProperty('min-height','0','important');
    board.style.setProperty('max-width',size+'px','important');
    board.style.setProperty('max-height',size+'px','important');
    boardbox.style.setProperty('padding-bottom','24px','important');
  }

  const style=document.createElement('style');
  style.id='dorang-broadcast-timer-display-fix-v4';
  style.textContent=`
    body.broadcast{overflow:hidden!important}
    .broadcast .app{height:100vh!important;width:100vw!important;padding:5px!important;overflow:hidden!important}
    .broadcast .layout{height:100%!important;min-height:0!important;overflow:hidden!important}
    .broadcast .center{height:100%!important;min-height:0!important;padding:5px!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;box-sizing:border-box!important}

    /* 기존 공용 타이머는 선수별 코드가 계속 갱신하므로 송출에서는 완전히 숨긴다. */
    .broadcast #gameTimerBar{display:none!important}

    .broadcast #broadcastStableTimerBar{
      display:flex!important;flex:0 0 38px!important;width:100%!important;max-width:100%!important;
      min-height:38px!important;height:38px!important;margin:0 0 4px!important;padding:4px 10px!important;
      align-items:center!important;justify-content:center!important;gap:9px!important;
      border:1.5px solid #d7cae8!important;border-radius:10px!important;
      background:linear-gradient(135deg,#fff8fc,#f4f8ff)!important;box-shadow:none!important;
      color:#75658e!important;box-sizing:border-box!important;overflow:hidden!important
    }
    .broadcast #broadcastStableTimerBar .stable-icon{font-size:15px!important;line-height:1!important}
    .broadcast #broadcastStableTimerBar #broadcastStableTime{
      font-size:23px!important;line-height:1!important;font-weight:1000!important;font-variant-numeric:tabular-nums!important;
      color:#5f5276!important;white-space:nowrap!important
    }
    .broadcast #broadcastStableTimerBar #broadcastStableState{
      font-size:11px!important;font-weight:900!important;color:#8b819d!important;white-space:nowrap!important;
      overflow:hidden!important;text-overflow:ellipsis!important
    }
    .broadcast #broadcastStableTimerBar.time-over{background:#fff0f4!important;border-color:#ff9fba!important}
    .broadcast #broadcastStableTimerBar.time-over #broadcastStableTime{color:#d65272!important}
    .broadcast #broadcastStableTimerBar.time-over #broadcastStableState{color:#bf6078!important}

    .broadcast #broadcastStableTimerBar.game-result{height:44px!important;min-height:44px!important;flex-basis:44px!important;border-width:2px!important}
    .broadcast #broadcastStableTimerBar.game-result #broadcastStableTime{font-size:22px!important}
    .broadcast #broadcastStableTimerBar.game-result #broadcastStableState{font-size:11px!important}
    .broadcast #broadcastStableTimerBar.winner-a{background:#eaf6ff!important;border-color:#79bfff!important}
    .broadcast #broadcastStableTimerBar.winner-a #broadcastStableTime{color:#387fb9!important}
    .broadcast #broadcastStableTimerBar.winner-b{background:#fff0f6!important;border-color:#ff9fc3!important}
    .broadcast #broadcastStableTimerBar.winner-b #broadcastStableTime{color:#c94f7b!important}
    .broadcast #broadcastStableTimerBar.draw{background:#f5f2fa!important;border-color:#cdbfe1!important}

    .broadcast .teamcards{flex:0 0 44px!important;min-height:44px!important;height:44px!important;width:100%!important;max-width:100%!important;margin:0 0 4px!important;gap:5px!important}
    .broadcast .teamcard{height:44px!important;min-height:44px!important;padding:5px 9px!important;box-sizing:border-box!important}
    .broadcast .teamcard .name{font-size:16px!important}.broadcast .teamcard .big{font-size:19px!important}
    .broadcast .boardbox{flex:1 1 auto!important;min-height:0!important;width:100%!important;overflow:hidden!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;box-sizing:border-box!important;padding-bottom:24px!important}
    .broadcast .board{aspect-ratio:1/1!important;margin:0 auto!important;gap:3px!important;box-sizing:border-box!important}
    .broadcast .cell{min-width:0!important;min-height:0!important;border-radius:7px!important;line-height:1!important;box-sizing:border-box!important}
    .broadcast .cell.a{border-color:#7eb8f8!important}.broadcast .cell.b{border-color:#ef9dbb!important}
  `;
  document.head.appendChild(style);

  function tick(){updateStableBar();fitBoard();}
  window.addEventListener('resize',tick);
  tick();setTimeout(tick,0);setTimeout(tick,300);setTimeout(tick,900);setInterval(tick,200);
})();