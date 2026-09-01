// 도랑이네 래더빙고 - 송출 화면 최종 맞춤 + 선수별 실시간 타이머 표시
(function(){
  if(window.__dorangBroadcastTimerDisplayFixV3)return;
  window.__dorangBroadcastTimerDisplayFixV3=true;

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

  function ensureBroadcastTimer(){
    if(!isBroadcast())return null;
    const center=document.querySelector('.panel.center');
    const teamcards=center?.querySelector('.teamcards');
    if(!center||!teamcards)return null;
    let bar=document.getElementById('gameTimerBar');
    if(!bar){
      bar=document.createElement('div');
      bar.id='gameTimerBar';
      bar.className='game-timer-bar broadcast-live-timer';
      bar.innerHTML='<span class="timer-icon">⏱</span><b id="gameTimerText">--:--</b><span id="gameTimerState">진행 중 선수 없음</span>';
    }
    if(bar.parentElement!==center||bar.nextElementSibling!==teamcards)center.insertBefore(bar,teamcards);
    bar.classList.add('broadcast-live-timer');
    return bar;
  }

  function updateBroadcastTimer(){
    if(!isBroadcast())return;
    const bar=ensureBroadcastTimer();if(!bar)return;
    const enabled=!!currentRoom?.timer?.enabled;
    const active=activePlayers();
    const p=displayPlayer();
    const rem=p?remainingMs(p):null;
    const text=bar.querySelector('#gameTimerText');
    const state=bar.querySelector('#gameTimerState');
    if(text)text.textContent=enabled&&p?formatTime(rem):'--:--';
    bar.classList.toggle('time-over',!!p&&rem!==null&&rem<=0);
    bar.classList.toggle('timer-running',!!p?.timerRunning&&rem>0);
    if(state){
      if(!enabled)state.textContent='타이머 미설정';
      else if(!p)state.textContent='진행 중 선수 없음';
      else if(rem<=0)state.textContent=`${p.name} · TIME OVER · 마지막 결과 인정`;
      else if(active.length>1)state.textContent=`${p.name} · 진행 중 외 ${active.length-1}명`;
      else state.textContent=`${p.name} · 진행 중`;
    }
  }

  function fitBoard(){
    if(!isBroadcast())return;
    const center=document.querySelector('.panel.center');
    const board=document.getElementById('board');
    const boardbox=center?.querySelector('.boardbox');
    const teamcards=center?.querySelector('.teamcards');
    const timer=ensureBroadcastTimer();
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
  style.id='dorang-broadcast-timer-display-fix-v3';
  style.textContent=`
    body.broadcast{overflow:hidden!important}
    .broadcast .app{height:100vh!important;width:100vw!important;padding:5px!important;overflow:hidden!important}
    .broadcast .layout{height:100%!important;min-height:0!important;overflow:hidden!important}
    .broadcast .center{height:100%!important;min-height:0!important;padding:5px!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;box-sizing:border-box!important}
    .broadcast #gameTimerBar.broadcast-live-timer{display:flex!important;flex:0 0 38px!important;width:100%!important;max-width:100%!important;min-height:38px!important;height:38px!important;margin:0 0 4px!important;padding:4px 10px!important;align-items:center!important;justify-content:center!important;gap:9px!important;border:1.5px solid #d7cae8!important;border-radius:10px!important;background:linear-gradient(135deg,#fff8fc,#f4f8ff)!important;box-shadow:none!important;color:#75658e!important;box-sizing:border-box!important;overflow:hidden!important}
    .broadcast #gameTimerBar .timer-icon{font-size:15px!important;line-height:1!important}
    .broadcast #gameTimerBar #gameTimerText{font-size:23px!important;line-height:1!important;font-weight:1000!important;font-variant-numeric:tabular-nums!important;color:#5f5276!important;white-space:nowrap!important}
    .broadcast #gameTimerBar #gameTimerState{font-size:11px!important;font-weight:900!important;color:#8b819d!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    .broadcast #gameTimerBar.time-over{background:#fff0f4!important;border-color:#ffb5c7!important}
    .broadcast #gameTimerBar.time-over #gameTimerText{color:#d65272!important}
    .broadcast .teamcards{flex:0 0 44px!important;min-height:44px!important;height:44px!important;width:100%!important;max-width:100%!important;margin:0 0 4px!important;gap:5px!important}
    .broadcast .teamcard{height:44px!important;min-height:44px!important;padding:5px 9px!important;box-sizing:border-box!important}
    .broadcast .teamcard .name{font-size:16px!important}.broadcast .teamcard .big{font-size:19px!important}
    .broadcast .boardbox{flex:1 1 auto!important;min-height:0!important;width:100%!important;overflow:hidden!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;box-sizing:border-box!important;padding-bottom:24px!important}
    .broadcast .board{aspect-ratio:1/1!important;margin:0 auto!important;gap:3px!important;box-sizing:border-box!important}
    .broadcast .cell{min-width:0!important;min-height:0!important;border-radius:7px!important;line-height:1!important;box-sizing:border-box!important}
    .broadcast .cell.a{border-color:#7eb8f8!important}.broadcast .cell.b{border-color:#ef9dbb!important}
  `;
  document.head.appendChild(style);

  function tick(){updateBroadcastTimer();fitBoard();}
  window.addEventListener('resize',tick);
  tick();setTimeout(tick,0);setTimeout(tick,300);setTimeout(tick,900);setInterval(tick,250);
})();