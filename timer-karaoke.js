// 도랑이네 래더빙고 - 실시간 타이머 + 노래방룰
(function(){
  if(window.__dorangTimerKaraokeLoaded)return;
  window.__dorangTimerKaraokeLoaded=true;

  const TIMER_DEFAULT_MIN=60;

  function timerOf(r){return r?.timer||null;}
  function remainingMs(r=currentRoom){
    const t=timerOf(r);
    if(!t?.enabled)return null;
    if(t.running)return Math.max(0,Number(t.endAt||0)-Date.now());
    return Math.max(0,Number(t.remainingSec||0)*1000);
  }
  function formatTime(ms){
    if(ms==null)return '--:--';
    const total=Math.max(0,Math.ceil(ms/1000));
    const h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
    if(h>0)return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function selectedPlayer(){
    if(!currentRoom)return null;
    if(!isHost())return myPlayer();
    const idx=Number($('resultPlayer')?.value);
    return currentRoom.players?.[idx]||null;
  }

  function ensureTimerUI(){
    const center=document.querySelector('.panel.center');
    const teamcards=center?.querySelector('.teamcards');
    if(center&&teamcards&&!document.getElementById('gameTimerBar')){
      const bar=document.createElement('div');
      bar.id='gameTimerBar';
      bar.className='game-timer-bar';
      bar.innerHTML=`<span class="timer-icon">⏱</span><b id="gameTimerText">--:--</b><span id="gameTimerState">타이머 미설정</span>`;
      teamcards.insertAdjacentElement('beforebegin',bar);
    }

    const settings=document.querySelector('.settings-static');
    if(settings&&!document.getElementById('timerSettingsBox')){
      const box=document.createElement('section');
      box.id='timerSettingsBox';
      box.className='timer-settings-box host-only';
      box.innerHTML=`
        <div class="timer-settings-title">⏱ 경기 타이머 · 노래방룰</div>
        <div class="timer-min-row">
          <label>경기 시간(분)</label>
          <input id="timerMinutes" type="number" min="1" max="600" value="${TIMER_DEFAULT_MIN}">
          <button id="timerSetBtn" class="btn" type="button">시간 설정</button>
        </div>
        <div class="timer-control-grid">
          <button id="timerStartBtn" class="btn primary" type="button">▶ 시작</button>
          <button id="timerPauseBtn" class="btn" type="button">⏸ 일시정지</button>
          <button id="timerPlusBtn" class="btn" type="button">+5분</button>
          <button id="timerResetBtn" class="btn danger" type="button">↺ 초기화</button>
        </div>
        <div class="timer-rule-note">시간 종료 전 <b>경기 시작</b>한 판은 끝날 때까지 결과 인정 · 종료 후 새 경기 시작 불가</div>`;
      const heading=settings.querySelector('h2');
      if(heading)heading.insertAdjacentElement('afterend',box);else settings.prepend(box);
      bindTimerControls();
    }

    const resultPlayer=document.getElementById('resultPlayer');
    const resultField=resultPlayer?.closest('.field');
    if(resultField&&!document.getElementById('gameStartWrap')){
      const wrap=document.createElement('div');
      wrap.id='gameStartWrap';
      wrap.className='game-start-wrap';
      wrap.innerHTML=`<button id="gameStartBtn" class="btn game-start-btn" type="button">🎮 경기 시작</button><span id="gameStartStatus">타이머 미설정</span>`;
      resultField.insertAdjacentElement('afterend',wrap);
      document.getElementById('gameStartBtn').onclick=startSelectedGame;
    }
  }

  async function setTimer(){
    if(!isHost())return;
    const min=Math.max(1,Math.min(600,Math.trunc(Number(document.getElementById('timerMinutes')?.value)||TIMER_DEFAULT_MIN)));
    await transact(r=>{
      r.timer={enabled:true,durationSec:min*60,remainingSec:min*60,running:false,endAt:0,karaoke:true};
      (r.players||[]).forEach(p=>{p.gameActive=false;p.gameStartedAt=0;});
      logRoom(r,`⏱ 경기 시간 ${min}분 설정 · 노래방룰 적용.`);
    });
    toast(`타이머 ${min}분 설정 완료`);
  }

  async function startTimer(){
    if(!isHost())return;
    if(!currentRoom?.timer?.enabled){toast('먼저 경기 시간을 설정해줘.');return;}
    await transact(r=>{
      const t=r.timer||{};
      let sec=Math.max(0,Number(t.remainingSec||0));
      if(t.running)sec=Math.ceil(Math.max(0,Number(t.endAt||0)-Date.now())/1000);
      if(sec<=0)sec=Math.max(1,Number(t.durationSec||TIMER_DEFAULT_MIN*60));
      t.enabled=true;t.running=true;t.remainingSec=sec;t.endAt=Date.now()+sec*1000;t.karaoke=true;
      r.timer=t;
      logRoom(r,`▶ 타이머 시작 · ${formatTime(sec*1000)}.`);
    });
  }

  async function pauseTimer(){
    if(!isHost()||!currentRoom?.timer?.enabled)return;
    await transact(r=>{
      const t=r.timer||{};
      const sec=t.running?Math.ceil(Math.max(0,Number(t.endAt||0)-Date.now())/1000):Math.max(0,Number(t.remainingSec||0));
      t.remainingSec=sec;t.running=false;t.endAt=0;r.timer=t;
      logRoom(r,`⏸ 타이머 일시정지 · ${formatTime(sec*1000)} 남음.`);
    });
  }

  async function addFiveMinutes(){
    if(!isHost()||!currentRoom?.timer?.enabled){toast('먼저 경기 시간을 설정해줘.');return;}
    await transact(r=>{
      const t=r.timer||{};
      if(t.running){t.endAt=Math.max(Date.now(),Number(t.endAt||0))+300000;}
      else t.remainingSec=Math.max(0,Number(t.remainingSec||0))+300;
      r.timer=t;logRoom(r,'⏱ 타이머 +5분 연장.');
    });
  }

  async function resetTimer(){
    if(!isHost()||!currentRoom?.timer?.enabled)return;
    await transact(r=>{
      const t=r.timer||{};
      t.running=false;t.endAt=0;t.remainingSec=Math.max(1,Number(t.durationSec||TIMER_DEFAULT_MIN*60));r.timer=t;
      (r.players||[]).forEach(p=>{p.gameActive=false;p.gameStartedAt=0;});
      logRoom(r,'↺ 타이머 초기화 · 진행 중 경기 표시 해제.');
    });
  }

  function bindTimerControls(){
    const set=document.getElementById('timerSetBtn');if(set)set.onclick=setTimer;
    const start=document.getElementById('timerStartBtn');if(start)start.onclick=startTimer;
    const pause=document.getElementById('timerPauseBtn');if(pause)pause.onclick=pauseTimer;
    const plus=document.getElementById('timerPlusBtn');if(plus)plus.onclick=addFiveMinutes;
    const reset=document.getElementById('timerResetBtn');if(reset)reset.onclick=resetTimer;
  }

  async function startSelectedGame(){
    const p=selectedPlayer();
    if(!p){toast('선수를 먼저 선택해줘.');return;}
    const t=currentRoom?.timer;
    if(!t?.enabled){toast('방장이 먼저 경기 시간을 설정해줘.');return;}
    const rem=remainingMs();
    if(!t.running){toast(rem<=0?'경기 시간이 종료됐어.':'타이머가 시작되지 않았어.');return;}
    if(rem<=0){toast('시간 종료! 새 경기는 시작할 수 없어.');return;}
    if(p.gameActive){toast(`${p.name} 선수는 이미 경기 진행 중이야.`);return;}
    const name=p.name,team=p.team;
    let accepted=false;
    await transact(r=>{
      const rt=r.timer;
      const left=rt?.running?Math.max(0,Number(rt.endAt||0)-Date.now()):Math.max(0,Number(rt?.remainingSec||0)*1000);
      if(!rt?.enabled||!rt.running||left<=0)return;
      const x=r.players.find(q=>q.name===name&&q.team===team)||r.players.find(q=>q.name===name);
      if(!x||x.gameActive)return;
      x.gameActive=true;x.gameStartedAt=Date.now();x.gameStartedBeforeEnd=true;
      accepted=true;
      logRoom(r,`🎮 ${x.name} 경기 시작 · 남은 시간 ${formatTime(left)}.`);
    });
    if(accepted)toast(`${name} 경기 시작!`);else toast('경기 시작 처리에 실패했어. 시간을 확인해줘.');
  }

  function syncActiveRoster(){
    if(!currentRoom?.players)return;
    const rows=[...document.querySelectorAll('#roster .player')];
    rows.forEach((row,idx)=>{
      const p=currentRoom.players[idx];if(!p)return;
      let badge=row.querySelector('.game-active-badge');
      if(p.gameActive){
        if(!badge){badge=document.createElement('span');badge.className='game-active-badge';badge.textContent='🎮 진행중';const info=row.querySelector('div');if(info)info.appendChild(badge);}
      }else if(badge)badge.remove();
    });
  }

  function syncTimerUI(){
    ensureTimerUI();
    if(!currentRoom)return;
    const t=currentRoom.timer;
    const rem=remainingMs();
    const text=document.getElementById('gameTimerText');
    const state=document.getElementById('gameTimerState');
    const bar=document.getElementById('gameTimerBar');
    if(text)text.textContent=formatTime(rem);
    if(bar){bar.classList.toggle('time-over',!!t?.enabled&&rem<=0);bar.classList.toggle('timer-running',!!t?.running&&rem>0);}
    if(state){
      if(!t?.enabled)state.textContent='타이머 미설정';
      else if(rem<=0)state.textContent='TIME OVER · 진행 중 경기만 인정';
      else if(t.running)state.textContent='🎤 노래방룰';
      else state.textContent='일시정지';
    }
    const min=document.getElementById('timerMinutes');
    if(min&&document.activeElement!==min&&t?.durationSec)min.value=String(Math.max(1,Math.round(Number(t.durationSec)/60)));

    const p=selectedPlayer();
    const startBtn=document.getElementById('gameStartBtn');
    const status=document.getElementById('gameStartStatus');
    if(startBtn){
      const blocked=!t?.enabled||!t.running||rem<=0||!p||!!p.gameActive;
      startBtn.disabled=blocked;
      startBtn.textContent=p?.gameActive?'🎮 경기 진행 중':'🎮 경기 시작';
    }
    if(status){
      if(!t?.enabled)status.textContent='타이머 미설정';
      else if(p?.gameActive)status.textContent=rem<=0?'시간 종료 전 시작한 경기 · 결과 인정':'현재 경기 진행 중';
      else if(rem<=0)status.textContent='시간 종료 · 새 경기 시작 불가';
      else if(!t.running)status.textContent='타이머 일시정지';
      else status.textContent='결과 입력 전 경기 시작을 눌러줘';
    }
    syncActiveRoster();
  }

  // 결과 버튼을 가장 먼저 검사해 노래방룰 위반 입력을 막는다.
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('#applyResultBtn');
    if(!btn||!currentRoom?.timer?.enabled)return;
    const p=selectedPlayer();
    if(!p){e.preventDefault();e.stopImmediatePropagation();toast('선수를 먼저 선택해줘.');return;}
    const rem=remainingMs();
    if(!p.gameActive){
      e.preventDefault();e.stopImmediatePropagation();
      if(rem<=0)toast('시간 종료! 종료 전에 시작한 경기만 결과를 넣을 수 있어.');
      else if(!currentRoom.timer.running)toast('타이머가 멈춰 있어. 경기 시작 상태를 확인해줘.');
      else toast('노래방룰: 먼저 🎮 경기 시작을 눌러줘.');
      return;
    }

    // 유효한 결과가 실제 반영됐을 때만 해당 진행 중 경기 표시를 해제한다.
    const name=p.name,team=p.team,before=(p.wins||0)+(p.losses||0);
    let checks=0;
    const watch=setInterval(async()=>{
      checks++;
      const latest=currentRoom?.players?.find(q=>q.name===name&&q.team===team)||currentRoom?.players?.find(q=>q.name===name);
      if(latest&&((latest.wins||0)+(latest.losses||0))>before){
        clearInterval(watch);
        try{
          await transact(r=>{
            const x=r.players.find(q=>q.name===name&&q.team===team)||r.players.find(q=>q.name===name);
            if(x){x.gameActive=false;x.gameStartedAt=0;x.gameStartedBeforeEnd=false;}
          });
        }catch(err){console.warn('game finish cleanup failed',err);}
      }else if(checks>24)clearInterval(watch);
    },150);
  },true);

  const style=document.createElement('style');
  style.id='dorang-timer-karaoke-style';
  style.textContent=`
    .game-timer-bar{width:min(445px,100%);margin:0 auto 7px;min-height:36px;display:flex;align-items:center;justify-content:center;gap:8px;padding:6px 12px;border:1.5px solid #d8cbea;border-radius:14px;background:linear-gradient(135deg,#fff8fc,#f4f8ff);box-shadow:0 7px 18px rgba(182,149,255,.09);color:#75658e;}
    .game-timer-bar .timer-icon{font-size:15px}.game-timer-bar b{font-size:22px;line-height:1;font-variant-numeric:tabular-nums;color:#5f5276}.game-timer-bar span:last-child{font-size:10px;font-weight:900;color:#9187a5}
    .game-timer-bar.timer-running{border-color:#bca7ef}.game-timer-bar.time-over{background:#fff0f4;border-color:#ffb5c7}.game-timer-bar.time-over b{color:#d65272}.game-timer-bar.time-over span:last-child{color:#bf6078}
    .timer-settings-box{margin:0 0 10px;padding:9px;border:1.5px solid #e1d5ea;border-radius:14px;background:linear-gradient(180deg,#fffafd,#f9f7ff)}
    .timer-settings-title{font-size:11px;font-weight:1000;color:#725f8d;margin-bottom:6px}.timer-min-row{display:grid;grid-template-columns:1fr 64px 76px;gap:5px;align-items:end}.timer-min-row label{font-size:9px;color:var(--muted)}.timer-min-row input{padding:6px 7px!important;font-size:11px!important}.timer-min-row .btn{padding:6px!important;font-size:9px!important}
    .timer-control-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:5px}.timer-control-grid .btn{padding:6px 3px!important;font-size:9px!important}.timer-rule-note{margin-top:6px;font-size:9px;line-height:1.35;color:#8d839e}
    .game-start-wrap{display:flex;align-items:center;gap:7px;margin:5px 0 8px}.game-start-btn{flex:0 0 112px;padding:8px!important}.game-start-btn:disabled{opacity:.55;cursor:not-allowed}.game-start-wrap span{font-size:9px;line-height:1.3;color:var(--muted)}
    .game-active-badge{display:inline-flex;margin-left:5px;padding:2px 5px;border-radius:999px;background:#fff2c9;border:1px solid #f0d57a;color:#8b6815;font-size:8px;font-weight:1000}
    .broadcast .game-timer-bar{flex:0 0 34px!important;width:100%!important;max-width:100%!important;min-height:34px!important;height:34px!important;margin:0 auto 4px!important;padding:4px 10px!important;border-radius:9px!important}.broadcast .game-timer-bar b{font-size:19px!important}.broadcast .game-timer-bar span:last-child{font-size:9px!important}
  `;
  document.head.appendChild(style);

  window.addEventListener('load',()=>{ensureTimerUI();bindTimerControls();syncTimerUI();});
  ensureTimerUI();bindTimerControls();syncTimerUI();
  setInterval(syncTimerUI,250);
})();