// 도랑이네 래더빙고 - 타이머 시/분/초 분리 입력
(function(){
  if(window.__dorangTimerHmsLoaded)return;
  window.__dorangTimerHmsLoaded=true;

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Math.trunc(Number(n)||0)));

  function splitDuration(sec){
    sec=Math.max(0,Math.trunc(Number(sec)||0));
    return {
      h:Math.floor(sec/3600),
      m:Math.floor((sec%3600)/60),
      s:sec%60
    };
  }

  function ensureHmsUI(){
    const box=document.getElementById('timerSettingsBox');
    if(!box)return false;
    let row=box.querySelector('.timer-min-row');
    if(!row)return false;

    if(!document.getElementById('timerHours')){
      row.classList.add('timer-hms-row');
      row.innerHTML=`
        <div class="timer-hms-caption">경기 시간</div>
        <div class="timer-hms-fields">
          <label class="timer-hms-field"><input id="timerHours" type="number" min="0" max="99" inputmode="numeric" value="1"><span>시</span></label>
          <span class="timer-hms-colon">:</span>
          <label class="timer-hms-field"><input id="timerMinutesPart" type="number" min="0" max="59" inputmode="numeric" value="0"><span>분</span></label>
          <span class="timer-hms-colon">:</span>
          <label class="timer-hms-field"><input id="timerSecondsPart" type="number" min="0" max="59" inputmode="numeric" value="0"><span>초</span></label>
        </div>
        <button id="timerSetBtn" class="btn timer-hms-set" type="button">시간 설정</button>`;

      ['timerHours','timerMinutesPart','timerSecondsPart'].forEach(id=>{
        const input=document.getElementById(id);
        if(!input)return;
        input.addEventListener('change',()=>{
          if(id==='timerHours')input.value=String(clamp(input.value,0,99));
          else input.value=String(clamp(input.value,0,59));
        });
        input.addEventListener('focus',e=>e.target.select());
      });
    }

    const setBtn=document.getElementById('timerSetBtn');
    if(setBtn&&!setBtn.dataset.hmsBound){
      setBtn.dataset.hmsBound='yes';
      setBtn.onclick=setTimerHms;
    }
    return true;
  }

  async function setTimerHms(){
    if(typeof isHost==='function'&&!isHost())return;
    const h=clamp(document.getElementById('timerHours')?.value,0,99);
    const m=clamp(document.getElementById('timerMinutesPart')?.value,0,59);
    const s=clamp(document.getElementById('timerSecondsPart')?.value,0,59);
    const total=h*3600+m*60+s;
    if(total<=0){
      toast('타이머는 최소 1초 이상 설정해줘.');
      return;
    }

    await transact(r=>{
      r.timer={
        enabled:true,
        durationSec:total,
        remainingSec:total,
        running:false,
        endAt:0,
        karaoke:true
      };
      (r.players||[]).forEach(p=>{
        p.gameActive=false;
        p.gameStartedAt=0;
        p.gameStartedBeforeEnd=false;
      });
      const parts=[];
      if(h)parts.push(`${h}시간`);
      if(m)parts.push(`${m}분`);
      if(s)parts.push(`${s}초`);
      logRoom(r,`⏱ 경기 시간 ${parts.join(' ')} 설정 · 노래방룰 적용.`);
    });

    const parts=[];
    if(h)parts.push(`${h}시간`);
    if(m)parts.push(`${m}분`);
    if(s)parts.push(`${s}초`);
    toast(`타이머 ${parts.join(' ')} 설정 완료`);
  }

  function syncHmsValues(){
    if(!ensureHmsUI())return;
    if(typeof currentRoom==='undefined'||!currentRoom?.timer?.durationSec)return;
    const {h,m,s}=splitDuration(currentRoom.timer.durationSec);
    const hi=document.getElementById('timerHours');
    const mi=document.getElementById('timerMinutesPart');
    const si=document.getElementById('timerSecondsPart');
    if(hi&&document.activeElement!==hi)hi.value=String(h);
    if(mi&&document.activeElement!==mi)mi.value=String(m);
    if(si&&document.activeElement!==si)si.value=String(s);
  }

  const style=document.createElement('style');
  style.id='dorang-timer-hms-style';
  style.textContent=`
    .timer-min-row.timer-hms-row{
      display:grid!important;
      grid-template-columns:1fr!important;
      gap:6px!important;
      align-items:stretch!important;
    }
    .timer-hms-caption{
      font-size:10px!important;
      font-weight:900!important;
      color:#8d819e!important;
    }
    .timer-hms-fields{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) 9px minmax(0,1fr) 9px minmax(0,1fr)!important;
      gap:3px!important;
      align-items:center!important;
    }
    .timer-hms-field{
      position:relative!important;
      display:block!important;
      min-width:0!important;
      margin:0!important;
    }
    .timer-hms-field input{
      width:100%!important;
      min-width:0!important;
      height:36px!important;
      padding:5px 23px 5px 6px!important;
      text-align:center!important;
      font-size:14px!important;
      font-weight:1000!important;
      font-variant-numeric:tabular-nums!important;
      border-radius:10px!important;
    }
    .timer-hms-field span{
      position:absolute!important;
      right:7px!important;
      top:50%!important;
      transform:translateY(-50%)!important;
      font-size:9px!important;
      font-weight:900!important;
      color:#9a8fa9!important;
      pointer-events:none!important;
    }
    .timer-hms-colon{
      text-align:center!important;
      font-size:14px!important;
      font-weight:1000!important;
      color:#a498b4!important;
    }
    .timer-hms-set{width:100%!important;padding:7px 8px!important;font-size:10px!important;}
  `;
  document.head.appendChild(style);

  let tries=0;
  const boot=setInterval(()=>{
    tries++;
    syncHmsValues();
    if(document.getElementById('timerHours')||tries>80)clearInterval(boot);
  },150);

  // 방 설정 변경과 Firebase 갱신을 계속 반영한다.
  setInterval(syncHmsValues,500);
})();
