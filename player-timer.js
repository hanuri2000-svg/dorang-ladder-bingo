// 도랑이네 래더빙고 - 선수별 개별 카운트다운 + 노래방룰
(function(){
  if(window.__dorangPlayerTimerLoaded)return;
  window.__dorangPlayerTimerLoaded=true;

  const $id=id=>document.getElementById(id);
  let lastSelectedKey='';

  const keyOf=p=>p?`${p.name}|||${p.team}`:'';
  function findByKey(r,key){
    if(!r||!key)return null;
    const [name,team]=key.split('|||');
    return (r.players||[]).find(p=>p.name===name&&p.team===team)||(r.players||[]).find(p=>p.name===name)||null;
  }
  function selectedPlayer(){
    if(!currentRoom)return null;
    if(typeof isHost==='function'&&!isHost())return typeof myPlayer==='function'?myPlayer():null;
    const idx=Number($id('resultPlayer')?.value);
    return currentRoom.players?.[idx]||null;
  }
  function durationSec(r=currentRoom){return Math.max(1,Number(r?.timer?.durationSec||3600));}
  function playerRemainingMs(p,r=currentRoom){
    if(!p)return null;
    const total=durationSec(r);
    if(!p.timerStarted)return total*1000;
    if(p.timerRunning)return Math.max(0,Number(p.timerEndAt||0)-Date.now());
    return Math.max(0,Number(p.timerRemainingSec??total)*1000);
  }
  function formatTime(ms){
    if(ms==null)return '--:--';
    const total=Math.max(0,Math.ceil(ms/1000));
    const h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
    return h>0?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function ensureUI(){
    const center=document.querySelector('.panel.center');
    const teamcards=center?.querySelector('.teamcards');
    if(center&&teamcards&&!$id('gameTimerBar')){
      const bar=document.createElement('div');
      bar.id='gameTimerBar';
      bar.className='game-timer-bar';
      bar.innerHTML='<span class="timer-icon">⏱</span><b id="gameTimerText">--:--</b><span id="gameTimerState">타이머 미설정</span>';
      teamcards.insertAdjacentElement('beforebegin',bar);
    }

    const settings=document.querySelector('.settings-static');
    if(settings&&!$id('timerSettingsBox')){
      const box=document.createElement('section');
      box.id='timerSettingsBox';
      box.className='timer-settings-box host-only';
      box.innerHTML=`
        <div class="timer-settings-title">⏱ 선수별 타이머 · 노래방룰</div>
        <div class="timer-min-row">
          <label>경기 시간(분)</label>
          <input id="timerMinutes" type="number" min="1" max="600" value="60">
          <button id="timerSetBtn" class="btn" type="button">시간 설정</button>
        </div>
        <div class="timer-control-grid">
          <button id="timerStartBtn" class="btn primary" type="button">▶ 전체 재개</button>
          <button id="timerPauseBtn" class="btn" type="button">⏸ 전체 일시정지</button>
          <button id="timerPlusBtn" class="btn" type="button">+5분</button>
          <button id="timerResetBtn" class="btn danger" type="button">↺ 전체 초기화</button>
        </div>
        <div class="timer-rule-note">각 선수는 <b>경기 시작</b>을 누른 순간부터 자기 타이머가 감소해. 시작 전 선수의 시간은 줄지 않아.</div>`;
      const heading=settings.querySelector('h2');
      if(heading)heading.insertAdjacentElement('afterend',box);else settings.prepend(box);
    }

    const resultField=$id('resultPlayer')?.closest('.field');
    if(resultField&&!$id('gameStartWrap')){
      const wrap=document.createElement('div');
      wrap.id='gameStartWrap';
      wrap.className='game-start-wrap';
      wrap.innerHTML='<button id="gameStartBtn" class="btn game-start-btn" type="button">🎮 경기 시작</button><span id="gameStartStatus">타이머 미설정</span>';
      resultField.insertAdjacentElement('afterend',wrap);
      $id('gameStartBtn').onclick=startPlayerTimer;
    }
    bindControls();
  }

  async function startPlayerTimer(){
    const p=selectedPlayer();
    if(!p){toast('선수를 먼저 선택해줘.');return;}
    if(!currentRoom?.timer?.enabled){toast('방장이 먼저 경기 시간을 설정해줘.');return;}
    if(currentRoom.timer.pausedAll){toast('전체 타이머가 일시정지 상태야.');return;}
    const key=keyOf(p);
    let ok=false;
    await transact(r=>{
      r.timer=r.timer||{};r.timer.perPlayer=true;
      const x=findByKey(r,key);if(!x)return;
      const total=durationSec(r);
      if(x.timerFinished||x.overtimeUsed)return;
      if(x.timerRunning){ok=true;return;}
      let sec=x.timerStarted?Math.max(0,Number(x.timerRemainingSec??total)):total;
      if(sec<=0)return;
      x.timerStarted=true;x.timerRunning=true;x.timerRemainingSec=sec;x.timerEndAt=Date.now()+sec*1000;
      x.gameActive=true;x.gameStartedAt=Date.now();x.gameStartedBeforeEnd=true;x.overtimeUsed=false;x.timerFinished=false;
      ok=true;
      logRoom(r,`🎮 ${x.name} 개별 타이머 시작 · ${formatTime(sec*1000)}.`);
    });
    if(ok)toast(`${p.name} 타이머 시작!`);else toast('이 선수의 사용 시간이 이미 끝났어.');
  }

  async function pauseAll(){
    if(!isHost()||!currentRoom?.timer?.enabled)return;
    await transact(r=>{
      r.timer=r.timer||{};r.timer.perPlayer=true;r.timer.pausedAll=true;
      (r.players||[]).forEach(p=>{
        if(p.timerRunning){
          p.timerRemainingSec=Math.ceil(Math.max(0,Number(p.timerEndAt||0)-Date.now())/1000);
          p.timerRunning=false;p.timerEndAt=0;
        }
      });
      logRoom(r,'⏸ 선수별 타이머 전체 일시정지.');
    });
  }
  async function resumeAll(){
    if(!isHost()||!currentRoom?.timer?.enabled)return;
    await transact(r=>{
      r.timer=r.timer||{};r.timer.perPlayer=true;r.timer.pausedAll=false;
      (r.players||[]).forEach(p=>{
        const sec=Math.max(0,Number(p.timerRemainingSec??durationSec(r)));
        if(p.timerStarted&&!p.timerFinished&&!p.overtimeUsed&&sec>0&&p.gameActive){
          p.timerRunning=true;p.timerEndAt=Date.now()+sec*1000;
        }
      });
      logRoom(r,'▶ 선수별 타이머 전체 재개.');
    });
  }
  async function addFive(){
    if(!isHost()||!currentRoom?.timer?.enabled){toast('먼저 경기 시간을 설정해줘.');return;}
    await transact(r=>{
      r.timer=r.timer||{};r.timer.perPlayer=true;r.timer.durationSec=durationSec(r)+300;
      (r.players||[]).forEach(p=>{
        if(!p.timerStarted){p.timerRemainingSec=durationSec(r);return;}
        if(p.timerFinished||p.overtimeUsed)return;
        if(p.timerRunning)p.timerEndAt=Math.max(Date.now(),Number(p.timerEndAt||0))+300000;
        else p.timerRemainingSec=Math.max(0,Number(p.timerRemainingSec||0))+300;
      });
      logRoom(r,'⏱ 모든 선수 사용시간 +5분 연장.');
    });
  }
  async function resetAll(){
    if(!isHost()||!currentRoom?.timer?.enabled)return;
    await transact(r=>{
      r.timer=r.timer||{};r.timer.perPlayer=true;r.timer.pausedAll=false;
      const total=durationSec(r);
      (r.players||[]).forEach(p=>{
        p.timerStarted=false;p.timerRunning=false;p.timerEndAt=0;p.timerRemainingSec=total;p.timerFinished=false;
        p.gameActive=false;p.gameStartedAt=0;p.gameStartedBeforeEnd=false;p.overtimeUsed=false;
      });
      logRoom(r,'↺ 선수별 타이머 전체 초기화.');
    });
  }
  function bindControls(){
    const s=$id('timerStartBtn');if(s&&!s.dataset.playerBound){s.dataset.playerBound='yes';s.textContent='▶ 전체 재개';s.onclick=resumeAll;}
    const p=$id('timerPauseBtn');if(p&&!p.dataset.playerBound){p.dataset.playerBound='yes';p.textContent='⏸ 전체 일시정지';p.onclick=pauseAll;}
    const a=$id('timerPlusBtn');if(a&&!a.dataset.playerBound){a.dataset.playerBound='yes';a.onclick=addFive;}
    const r=$id('timerResetBtn');if(r&&!r.dataset.playerBound){r.dataset.playerBound='yes';r.textContent='↺ 전체 초기화';r.onclick=resetAll;}
  }

  // 시/분/초 시간 설정이 저장된 뒤 모든 선수의 개별 타이머를 새 설정값으로 초기화한다.
  document.addEventListener('click',e=>{
    if(!e.target.closest?.('#timerSetBtn'))return;
    setTimeout(async()=>{
      if(!currentRoom?.timer?.enabled||!isHost())return;
      try{
        await transact(r=>{
          r.timer=r.timer||{};r.timer.perPlayer=true;r.timer.pausedAll=false;r.timer.running=false;r.timer.endAt=0;
          const total=durationSec(r);
          (r.players||[]).forEach(p=>{
            p.timerStarted=false;p.timerRunning=false;p.timerEndAt=0;p.timerRemainingSec=total;p.timerFinished=false;
            p.gameActive=false;p.gameStartedAt=0;p.gameStartedBeforeEnd=false;p.overtimeUsed=false;
          });
        });
      }catch(err){console.warn('player timer reset after setting failed',err);}
    },350);
  },true);

  // 결과 입력: 선택 선수의 개별 타이머만 검사한다.
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('#applyResultBtn');
    if(!btn||!currentRoom?.timer?.enabled)return;
    const p=selectedPlayer();
    if(!p){e.preventDefault();e.stopImmediatePropagation();toast('선수를 먼저 선택해줘.');return;}
    const rem=playerRemainingMs(p);
    const inOvertime=p.timerStarted&&p.gameActive&&rem<=0&&!p.overtimeUsed;
    const active=p.timerStarted&&p.gameActive&&((p.timerRunning&&rem>0)||inOvertime);
    if(!active){
      e.preventDefault();e.stopImmediatePropagation();
      if(!p.timerStarted)toast(`${p.name} 선수는 아직 🎮 경기 시작을 누르지 않았어.`);
      else if(p.timerFinished||p.overtimeUsed)toast(`${p.name} 선수의 사용 시간이 종료됐어.`);
      else if(currentRoom.timer.pausedAll)toast('전체 타이머가 일시정지 상태야.');
      else toast(`${p.name} 선수의 경기 시작 상태를 확인해줘.`);
      return;
    }

    const key=keyOf(p),before=(p.wins||0)+(p.losses||0),wasOvertime=inOvertime;
    let checks=0;
    const watch=setInterval(async()=>{
      checks++;
      const latest=findByKey(currentRoom,key);
      if(latest&&((latest.wins||0)+(latest.losses||0))>before){
        clearInterval(watch);
        if(wasOvertime){
          try{
            await transact(r=>{
              const x=findByKey(r,key);if(!x)return;
              x.overtimeUsed=true;x.timerFinished=true;x.timerRunning=false;x.timerEndAt=0;x.timerRemainingSec=0;
              x.gameActive=false;x.gameStartedAt=0;x.gameStartedBeforeEnd=false;
              logRoom(r,`⏰ ${x.name} TIME OVER · 마지막 진행 중 경기 결과까지 인정.`);
            });
          }catch(err){console.warn('overtime finish failed',err);}
        }
        setTimeout(()=>{$id('gainScore')?.focus();},180);
      }else if(checks>30)clearInterval(watch);
    },120);
  },true);

  function rememberSelection(){const p=selectedPlayer();if(p)lastSelectedKey=keyOf(p);}
  function restoreSelection(){
    if(!currentRoom||!lastSelectedKey||!isHost())return;
    const sel=$id('resultPlayer');if(!sel)return;
    const p=findByKey(currentRoom,lastSelectedKey);if(!p)return;
    const idx=currentRoom.players.indexOf(p);
    if(idx>=0)sel.value=String(idx);
  }
  try{
    const baseRender=render;
    render=function(){rememberSelection();const out=baseRender.apply(this,arguments);restoreSelection();setTimeout(restoreSelection,0);return out;};
  }catch(e){console.warn('player timer render hook failed',e);}
  $id('resultPlayer')?.addEventListener('change',()=>{rememberSelection();syncUI();});

  function activePlayers(){
    return (currentRoom?.players||[]).filter(p=>p.timerStarted&&p.gameActive&&!p.timerFinished&&!p.overtimeUsed);
  }
  function syncUI(){
    ensureUI();
    if(!currentRoom)return;
    currentRoom.timer=currentRoom.timer||{};
    const p=selectedPlayer();
    const rem=p?playerRemainingMs(p):null;
    const bar=$id('gameTimerBar'),text=$id('gameTimerText'),state=$id('gameTimerState');
    if(text)text.textContent=currentRoom.timer.enabled&&p?formatTime(rem):'--:--';
    if(bar){bar.classList.toggle('time-over',!!p&&p.timerStarted&&rem<=0);bar.classList.toggle('timer-running',!!p?.timerRunning&&rem>0);}
    if(state){
      if(!currentRoom.timer.enabled)state.textContent='타이머 미설정';
      else if(!p)state.textContent='선수 선택';
      else if(!p.timerStarted)state.textContent=`${p.name} · 대기`;
      else if(p.timerFinished||p.overtimeUsed)state.textContent=`${p.name} · 종료`;
      else if(rem<=0)state.textContent=`${p.name} · TIME OVER · 마지막 결과 인정`;
      else if(currentRoom.timer.pausedAll)state.textContent=`${p.name} · 일시정지`;
      else if(p.timerRunning)state.textContent=`${p.name} · 진행 중`;
      else state.textContent=`${p.name} · 대기`;
    }
    const start=$id('gameStartBtn'),status=$id('gameStartStatus');
    if(start){
      const disabled=!currentRoom.timer.enabled||!p||currentRoom.timer.pausedAll||p.timerFinished||p.overtimeUsed||p.timerRunning||(p.timerStarted&&rem<=0);
      start.disabled=disabled;
      start.textContent=p?.timerRunning?'🎮 경기 진행 중':p?.timerStarted?'▶ 타이머 계속':'🎮 경기 시작';
    }
    if(status){
      if(!currentRoom.timer.enabled)status.textContent='타이머 미설정';
      else if(!p)status.textContent='선수를 선택해줘';
      else if(!p.timerStarted)status.textContent=`${p.name} · 시작 전 ${formatTime(rem)}`;
      else if(p.timerFinished||p.overtimeUsed)status.textContent='사용 시간 종료';
      else if(rem<=0)status.textContent='TIME OVER · 마지막 진행 중 경기 결과만 인정';
      else if(currentRoom.timer.pausedAll)status.textContent=`일시정지 · ${formatTime(rem)}`;
      else status.textContent=`개별 타이머 ${formatTime(rem)} · 점수 입력 후 Enter`;
    }

    // 명단에서도 선수별 남은 시간을 바로 확인
    [...document.querySelectorAll('#roster .player')].forEach((row,idx)=>{
      const rp=currentRoom.players?.[idx];if(!rp)return;
      let badge=row.querySelector('.player-timer-badge');
      if(!badge){badge=document.createElement('span');badge.className='player-timer-badge';row.querySelector('div')?.appendChild(badge);}
      const rr=playerRemainingMs(rp);
      badge.textContent=!currentRoom.timer.enabled?'':!rp.timerStarted?`⏱ ${formatTime(rr)} 대기`:rp.timerFinished||rp.overtimeUsed?'⏱ 종료':`⏱ ${formatTime(rr)}`;
      badge.classList.toggle('running',!!rp.timerRunning&&rr>0);
      badge.classList.toggle('over',!!rp.timerStarted&&rr<=0);
    });
  }

  const style=document.createElement('style');
  style.id='dorang-player-timer-style';
  style.textContent=`
    .game-timer-bar{width:min(445px,100%);margin:0 auto 7px;min-height:36px;display:flex;align-items:center;justify-content:center;gap:8px;padding:6px 12px;border:1.5px solid #d8cbea;border-radius:14px;background:linear-gradient(135deg,#fff8fc,#f4f8ff);box-shadow:0 7px 18px rgba(182,149,255,.09);color:#75658e}
    .game-timer-bar b{font-size:22px;line-height:1;font-variant-numeric:tabular-nums;color:#5f5276}.game-timer-bar span:last-child{font-size:10px;font-weight:900;color:#9187a5}.game-timer-bar.time-over{background:#fff0f4;border-color:#ffb5c7}.game-timer-bar.time-over b{color:#d65272}
    .timer-settings-box{margin:0 0 10px;padding:9px;border:1.5px solid #e1d5ea;border-radius:14px;background:linear-gradient(180deg,#fffafd,#f9f7ff)}
    .timer-settings-title{font-size:11px;font-weight:1000;color:#725f8d;margin-bottom:6px}.timer-control-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px}.timer-rule-note{margin-top:6px;font-size:9px;line-height:1.4;color:#9589a4}.game-start-wrap{display:grid;grid-template-columns:auto 1fr;gap:7px;align-items:center;margin:5px 0 8px}.game-start-wrap span{font-size:10px;color:var(--muted)}
    .player-timer-badge{display:inline-flex;margin-left:6px;padding:2px 6px;border-radius:999px;font-size:9px;font-weight:900;background:#f2eef7;color:#80738f}.player-timer-badge.running{background:#e9f7ff;color:#4f86aa}.player-timer-badge.over{background:#fff0f3;color:#c25c75}
    .broadcast .game-start-wrap,.broadcast .timer-settings-box{display:none!important}
  `;
  document.head.appendChild(style);

  ensureUI();syncUI();
  setInterval(syncUI,250);
})();
