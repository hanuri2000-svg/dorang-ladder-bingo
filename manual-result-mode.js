// 도랑이네 래더빙고 - 자동 결과 제거 / 노래방룰 유지 / 새 경기 초기화
(function(){
  if(window.__dorangManualResultModeLoaded)return;
  window.__dorangManualResultModeLoaded=true;

  let clearing=false;

  async function clearLegacyAutoResult(){
    if(clearing||!currentRoom?.gameOver?.ended)return;
    clearing=true;
    try{
      await transact(r=>{
        const g=r.gameOver;
        if(!g?.ended)return;

        // 이전 자동 TIME OVER가 마지막 진행 중 경기 입력까지 막아버린 경우 복구한다.
        if(g.reason==='time'){
          (r.players||[]).forEach(p=>{
            if(!p.timerStarted)return;
            if(p.timerFinished&&!p.overtimeUsed){
              p.timerFinished=false;
              p.timerRunning=false;
              p.timerEndAt=0;
              p.timerRemainingSec=0;
              p.gameActive=true;
              p.gameStartedBeforeEnd=true;
            }
          });
          if(r.timer)r.timer.pausedAll=false;
        }

        // 빙고판 완성으로 자동 종료된 기존 방도 다시 잠금 해제한다.
        if(g.reason==='board'){
          const now=Date.now();
          (r.players||[]).forEach(p=>{
            if(!p.timerStarted||p.timerFinished||p.overtimeUsed)return;
            const sec=Math.max(0,Number(p.timerRemainingSec||0));
            p.gameActive=true;
            if(sec>0){
              p.timerRunning=true;
              p.timerEndAt=now+sec*1000;
            }
          });
          if(r.timer)r.timer.pausedAll=false;
        }

        delete r.gameOver;
        logRoom(r,'🔓 자동 결과 기능 해제 · 노래방룰 수동 진행 모드로 전환.');
      });
    }catch(err){
      console.warn('legacy auto result cleanup failed',err);
    }finally{
      clearing=false;
    }
  }

  function bindNewGame(){
    const btn=document.getElementById('newBoardBtn');
    if(!btn||btn.dataset.manualResultBound==='yes')return;
    btn.dataset.manualResultBound='yes';
    btn.textContent='🎲 새 경기';
    btn.onclick=async()=>{
      if(!isHost()||!confirm('현재 점령 상황을 지우고 새 경기를 시작할까?'))return;
      const available=currentRoom.maxScore-currentRoom.minScore+1;
      if(available<currentRoom.size*currentRoom.size){
        toast(`${currentRoom.size}×${currentRoom.size} 보드에는 ${currentRoom.size*currentRoom.size}개의 서로 다른 숫자가 필요해. 현재 구간은 ${available}개야.`);
        return;
      }
      await transact(r=>{
        pushHistory(r);
        r.board=makeBoard(r.size,r.scores);
        const total=Math.max(1,Number(r.timer?.durationSec||3600));
        (r.players||[]).forEach(p=>{
          p.lands=0;
          p.streak=0;
          p.timerStarted=false;
          p.timerRunning=false;
          p.timerEndAt=0;
          p.timerRemainingSec=total;
          p.timerFinished=false;
          p.gameActive=false;
          p.gameStartedAt=0;
          p.gameStartedBeforeEnd=false;
          p.overtimeUsed=false;
        });
        r.bonus={A:0,B:0};
        if(r.timer){
          r.timer.pausedAll=false;
          r.timer.running=false;
          r.timer.endAt=0;
          r.timer.remainingSec=total;
        }
        delete r.gameOver;
        logRoom(r,'🎲 새 경기 시작 · 보드와 선수별 타이머 초기화.');
      });
      if(typeof pending!=='undefined')pending=null;
    };
  }

  function tick(){
    bindNewGame();
    clearLegacyAutoResult();
  }

  tick();
  setTimeout(tick,0);
  setInterval(tick,500);
})();
