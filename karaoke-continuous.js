// 도랑이네 래더빙고 - 노래방룰 연속 경기 보정
(function(){
  if(window.__dorangKaraokeContinuousLoaded)return;
  window.__dorangKaraokeContinuousLoaded=true;

  let lastSelectedKey='';

  function keyOf(p){
    if(!p)return '';
    return `${p.name}|||${p.team}`;
  }

  function findByKey(r,key){
    if(!r||!key)return null;
    const [name,team]=key.split('|||');
    return (r.players||[]).find(p=>p.name===name&&p.team===team)||(r.players||[]).find(p=>p.name===name)||null;
  }

  function remainingMs(r=currentRoom){
    const t=r?.timer;
    if(!t?.enabled)return null;
    if(t.running)return Math.max(0,Number(t.endAt||0)-Date.now());
    return Math.max(0,Number(t.remainingSec||0)*1000);
  }

  function selectedPlayerNow(){
    if(!currentRoom)return null;
    if(typeof isHost==='function'&&!isHost()){
      return typeof myPlayer==='function'?myPlayer():null;
    }
    const sel=document.getElementById('resultPlayer');
    const idx=Number(sel?.value);
    return currentRoom.players?.[idx]||null;
  }

  function rememberSelection(){
    const p=selectedPlayerNow();
    if(p)lastSelectedKey=keyOf(p);
  }

  function restoreSelection(){
    if(!currentRoom||!lastSelectedKey||!(typeof isHost==='function'&&isHost()))return;
    const sel=document.getElementById('resultPlayer');
    if(!sel)return;
    const [name,team]=lastSelectedKey.split('|||');
    const idx=(currentRoom.players||[]).findIndex(p=>p.name===name&&p.team===team);
    if(idx>=0 && String(sel.value)!==String(idx)){
      sel.value=String(idx);
      sel.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }

  // Firebase 갱신으로 render()가 다시 돌아도 선택 선수를 유지한다.
  try{
    const baseRender=render;
    render=function(){
      rememberSelection();
      const out=baseRender.apply(this,arguments);
      restoreSelection();
      setTimeout(restoreSelection,0);
      return out;
    };
  }catch(e){console.warn('karaoke continuous render hook failed',e);}

  const sel=document.getElementById('resultPlayer');
  if(sel){
    sel.addEventListener('change',()=>{
      rememberSelection();
      const p=selectedPlayerNow();
      // 타이머가 돌고 있는 동안 이미 연속 경기 모드가 시작된 상태라면,
      // 새로 고른 선수도 그 시점부터 진행 중 경기로 잡아준다.
      if(!p||!currentRoom?.timer?.enabled||!currentRoom.timer.running||remainingMs()<=0)return;
      const anyActive=(currentRoom.players||[]).some(x=>x.gameActive);
      if(!anyActive)return;
      const key=keyOf(p);
      transact(r=>{
        const x=findByKey(r,key);
        if(!x)return;
        x.gameActive=true;
        x.gameStartedAt=Date.now();
        x.gameStartedBeforeEnd=true;
      }).catch?.(()=>{});
    });
  }

  // 결과가 실제 반영되면 기존 timer-karaoke.js가 gameActive를 잠깐 해제한다.
  // 시간이 남아 있으면 같은 선수를 즉시 다음 경기 진행 중으로 자동 재등록한다.
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('#applyResultBtn');
    if(!btn||!currentRoom?.timer?.enabled)return;

    const p=selectedPlayerNow();
    if(!p||!p.gameActive)return;
    const key=keyOf(p);
    lastSelectedKey=key;
    const before=(p.wins||0)+(p.losses||0);
    let checks=0;

    const watch=setInterval(async()=>{
      checks++;
      const latest=findByKey(currentRoom,key);
      if(latest&&((latest.wins||0)+(latest.losses||0))>before){
        clearInterval(watch);

        // 00:00 이전이면 다음 판이 바로 이어진다고 보고 다시 진행중으로 유지.
        if(currentRoom?.timer?.running && remainingMs()>0){
          try{
            await new Promise(r=>setTimeout(r,250));
            await transact(r=>{
              const x=findByKey(r,key);
              const t=r.timer;
              const left=t?.running?Math.max(0,Number(t.endAt||0)-Date.now()):0;
              if(!x||!t?.enabled||!t.running||left<=0)return;
              x.gameActive=true;
              x.gameStartedAt=Date.now();
              x.gameStartedBeforeEnd=true;
            });
          }catch(err){console.warn('continuous game rearm failed',err);}
        }
        // 시간이 끝났으면 재등록하지 않음 → 기존 진행 중 마지막 한 판 결과로 종료.
        restoreSelection();
      }else if(checks>30){
        clearInterval(watch);
      }
    },120);
  },true);

  // Enter 결과 적용 후 점수 칸으로 다시 포커스해 연속 입력이 편하게.
  document.addEventListener('click',e=>{
    if(!e.target.closest?.('#applyResultBtn'))return;
    setTimeout(()=>{
      const input=document.getElementById('gainScore');
      if(input&&!input.disabled)input.focus();
    },500);
  });

  // 상태 문구도 연속 입력 방식에 맞춘다.
  setInterval(()=>{
    const p=selectedPlayerNow();
    const status=document.getElementById('gameStartStatus');
    if(!status||!currentRoom?.timer?.enabled)return;
    const rem=remainingMs();
    if(p?.gameActive&&rem>0)status.textContent='연속 경기 진행 중 · 점수 입력 후 Enter';
    else if(p?.gameActive&&rem<=0)status.textContent='TIME OVER · 마지막 진행 중 경기 결과만 인정';
  },300);
})();
