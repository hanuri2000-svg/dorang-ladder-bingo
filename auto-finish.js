// 도랑이네 래더빙고 - 자동 경기 종료 / 승리 판정
(function(){
  if(window.__dorangAutoFinishLoaded)return;
  window.__dorangAutoFinishLoaded=true;

  let finalizing=false;
  let dismissedAt=0;

  const byId=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function boardFull(r){
    return !!r?.board?.length && r.board.every(c=>!!c.owner);
  }

  function playerRemainingMs(r,p,now=Date.now()){
    if(!p)return Infinity;
    const totalSec=Math.max(1,Number(r?.timer?.durationSec||3600));
    if(!p.timerStarted)return totalSec*1000;
    if(p.timerFinished||p.overtimeUsed)return 0;
    if(p.timerRunning)return Math.max(0,Number(p.timerEndAt||0)-now);
    return Math.max(0,Number(p.timerRemainingSec??totalSec)*1000);
  }

  function allTimersDone(r){
    if(!r?.timer?.enabled)return false;
    const players=Array.isArray(r.players)?r.players:[];
    if(!players.length)return false;
    // 선수별 타이머를 사용하는 구조이므로 모든 등록 선수가 한 번은 시작해야 경기 시간 종료가 성립한다.
    // 마지막 결과 입력 여부(timerFinished/overtimeUsed)를 기다리지 않고 실제 남은 시간이 00:00이면 즉시 종료한다.
    const now=Date.now();
    return players.every(p=>!!p.timerStarted && playerRemainingMs(r,p,now)<=0);
  }

  function statsOf(r){
    const aBingo=typeof bingoLines==='function'?bingoLines(r,'A').count:0;
    const bBingo=typeof bingoLines==='function'?bingoLines(r,'B').count:0;
    const aCells=(r.board||[]).filter(c=>c.owner==='A').length;
    const bCells=(r.board||[]).filter(c=>c.owner==='B').length;
    return {aBingo,bBingo,aCells,bCells};
  }

  function decideWinner(r){
    const s=statsOf(r);
    let winner='DRAW',decision='draw';

    if(r.mode==='bingo' && s.aBingo!==s.bBingo){
      winner=s.aBingo>s.bBingo?'A':'B';
      decision='bingo';
    }else if(s.aCells!==s.bCells){
      winner=s.aCells>s.bCells?'A':'B';
      decision=r.mode==='bingo'?'cells-after-bingo-tie':'cells';
    }

    return {...s,winner,decision};
  }

  async function finalize(reason){
    if(finalizing||!currentRoom||currentRoom.gameOver)return;
    finalizing=true;
    try{
      await transact(r=>{
        if(r.gameOver)return;
        const valid=reason==='board'?boardFull(r):allTimersDone(r);
        if(!valid)return;

        const result=decideWinner(r);
        const endedAt=Date.now();
        const teamA=r.teamA,teamB=r.teamB;
        const winnerName=result.winner==='A'?teamA:result.winner==='B'?teamB:'무승부';

        r.gameOver={
          ended:true,
          reason,
          winner:result.winner,
          winnerName,
          decision:result.decision,
          aBingo:result.aBingo,
          bBingo:result.bBingo,
          aCells:result.aCells,
          bCells:result.bCells,
          teamA,
          teamB,
          endedAt
        };

        r.timer=r.timer||{};
        r.timer.pausedAll=true;
        r.timer.running=false;
        r.timer.endAt=0;

        (r.players||[]).forEach(p=>{
          if(p.timerRunning){
            p.timerRemainingSec=Math.ceil(Math.max(0,Number(p.timerEndAt||0)-endedAt)/1000);
          }
          if(reason==='time'){
            p.timerRemainingSec=0;
            p.timerFinished=true;
          }
          p.timerRunning=false;
          p.timerEndAt=0;
          p.gameActive=false;
          p.gameStartedAt=0;
          p.gameStartedBeforeEnd=false;
        });

        const why=reason==='board'?'빙고판 모든 칸 완료':'모든 선수 시간 종료';
        if(result.winner==='DRAW'){
          logRoom(r,`🤝 경기 종료 · ${why} · ${result.aBingo}:${result.bBingo} BINGO / ${result.aCells}:${result.bCells}칸 · 무승부.`);
        }else{
          logRoom(r,`🏆 경기 종료 · ${why} · ${winnerName} 승리! (${result.aBingo}:${result.bBingo} BINGO / ${result.aCells}:${result.bCells}칸)`);
        }
      });
    }catch(err){
      console.warn('auto finish failed',err);
    }finally{
      finalizing=false;
    }
  }

  function reasonText(g){
    return g.reason==='board'?'빙고판의 모든 칸이 채워져 경기가 종료됐어.':'모든 선수의 개별 시간이 00:00이 되어 즉시 경기가 끝났어.';
  }

  function decisionText(g){
    if(g.winner==='DRAW')return 'BINGO 수와 점령 칸 수가 모두 같아 무승부야.';
    if(g.decision==='bingo')return '완성한 BINGO 줄 수가 더 많아 승리!';
    if(g.decision==='cells-after-bingo-tie')return 'BINGO 수가 같아서 점령 칸 수로 승부 결정!';
    return '점령한 칸 수가 더 많아 승리!';
  }

  function ensureOverlay(){
    let overlay=byId('gameOverOverlay');
    if(overlay)return overlay;
    overlay=document.createElement('div');
    overlay.id='gameOverOverlay';
    overlay.className='game-over-overlay hidden';
    overlay.innerHTML=`
      <div class="game-over-card">
        <div class="game-over-crown">🏆</div>
        <div id="gameOverTitle" class="game-over-title">경기 종료</div>
        <div id="gameOverDecision" class="game-over-decision"></div>
        <div class="game-over-score-row">
          <div class="game-over-team a"><b id="gameOverAName"></b><strong id="gameOverAStats"></strong></div>
          <div class="game-over-vs">VS</div>
          <div class="game-over-team b"><b id="gameOverBName"></b><strong id="gameOverBStats"></strong></div>
        </div>
        <div id="gameOverReason" class="game-over-reason"></div>
        <div class="game-over-actions">
          <button id="gameOverCloseBtn" type="button" class="btn">결과창 닫기</button>
          <button id="gameOverNewBtn" type="button" class="btn primary host-only">🎲 새 경기</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    byId('gameOverCloseBtn').onclick=()=>{
      dismissedAt=Number(currentRoom?.gameOver?.endedAt||0);
      overlay.classList.add('hidden');
    };
    byId('gameOverNewBtn').onclick=()=>byId('newBoardBtn')?.click();
    return overlay;
  }

  function setLocked(locked){
    document.body.classList.toggle('game-ended',locked);
    const ids=['winBtn','lossBtn','gainScore','applyResultBtn','useBonusA','useBonusB','gameStartBtn','timerStartBtn','timerPauseBtn','timerPlusBtn'];
    ids.forEach(id=>{
      const el=byId(id);
      if(!el)return;
      if(locked)el.disabled=true;
      else if(id!=='gameStartBtn')el.disabled=false;
    });
  }

  function renderGameOver(){
    const g=currentRoom?.gameOver;
    const overlay=ensureOverlay();
    if(!g?.ended){
      setLocked(false);
      overlay.classList.add('hidden');
      return;
    }

    setLocked(true);
    const winnerName=g.winner==='A'?g.teamA:g.winner==='B'?g.teamB:'무승부';
    const title=byId('gameOverTitle');
    if(title)title.textContent=g.winner==='DRAW'?'🤝 무승부':`🏆 ${winnerName} 승리!`;
    const decision=byId('gameOverDecision');if(decision)decision.textContent=decisionText(g);
    const an=byId('gameOverAName');if(an)an.textContent=g.teamA;
    const bn=byId('gameOverBName');if(bn)bn.textContent=g.teamB;
    const as=byId('gameOverAStats');if(as)as.textContent=`${g.aBingo} BINGO · ${g.aCells}칸`;
    const bs=byId('gameOverBStats');if(bs)bs.textContent=`${g.bBingo} BINGO · ${g.bCells}칸`;
    const why=byId('gameOverReason');if(why)why.textContent=reasonText(g);

    overlay.classList.toggle('winner-a',g.winner==='A');
    overlay.classList.toggle('winner-b',g.winner==='B');
    overlay.classList.toggle('draw',g.winner==='DRAW');

    const close=byId('gameOverCloseBtn');
    const newBtn=byId('gameOverNewBtn');
    if(typeof broadcast!=='undefined'&&broadcast){
      if(close)close.style.display='none';
      if(newBtn)newBtn.style.display='none';
      overlay.classList.remove('hidden');
    }else{
      if(close)close.style.display='';
      if(newBtn)newBtn.style.display=(typeof isHost==='function'&&isHost())?'':'none';
      if(dismissedAt!==Number(g.endedAt||0))overlay.classList.remove('hidden');
    }
  }

  // 종료 상태에서는 결과 입력 / 보너스 / 보드 클릭을 즉시 막는다.
  document.addEventListener('click',e=>{
    if(!currentRoom?.gameOver?.ended)return;
    const blocked=e.target.closest?.('#applyResultBtn,#winBtn,#lossBtn,#useBonusA,#useBonusB,#gameStartBtn,#board .cell');
    if(!blocked)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    toast('경기가 종료됐어. 새 경기를 시작해줘.');
  },true);

  // 새 보드는 곧 새 경기이므로 승리 상태와 선수별 타이머까지 함께 초기화한다.
  function bindNewGame(){
    const btn=byId('newBoardBtn');
    if(!btn||btn.dataset.autoFinishBound==='yes')return;
    btn.dataset.autoFinishBound='yes';
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
          p.lands=0;p.streak=0;
          p.timerStarted=false;p.timerRunning=false;p.timerEndAt=0;p.timerRemainingSec=total;p.timerFinished=false;
          p.gameActive=false;p.gameStartedAt=0;p.gameStartedBeforeEnd=false;p.overtimeUsed=false;
        });
        r.bonus={A:0,B:0};
        if(r.timer){r.timer.pausedAll=false;r.timer.running=false;r.timer.endAt=0;r.timer.remainingSec=total;}
        delete r.gameOver;
        logRoom(r,'🎲 새 경기 시작 · 보드와 선수별 타이머 초기화.');
      });
      pending=null;
      dismissedAt=0;
    };
  }

  const style=document.createElement('style');
  style.id='dorang-auto-finish-style';
  style.textContent=`
    body.game-ended #board .cell{pointer-events:none!important;cursor:default!important}
    body.game-ended #board .cell:hover{transform:none!important;outline:none!important}
    .game-over-overlay{position:fixed;inset:0;z-index:500;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(64,55,78,.28);backdrop-filter:blur(4px)}
    .game-over-overlay.hidden{display:none!important}
    .game-over-card{width:min(520px,92vw);padding:26px 24px 22px;border:2px solid #d9c9e9;border-radius:25px;background:linear-gradient(160deg,#fff,#fff7fc 55%,#f5f7ff);box-shadow:0 28px 70px rgba(74,61,94,.24);text-align:center;color:#5f5374}
    .game-over-crown{font-size:48px;line-height:1;margin-bottom:5px}.game-over-title{font-size:30px;font-weight:1000;letter-spacing:-.6px}.game-over-decision{margin:7px 0 18px;font-size:13px;font-weight:900;color:#887b9d}
    .game-over-score-row{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center}.game-over-team{padding:13px 10px;border-radius:16px;border:1.5px solid #ddd3e7;background:#fff}.game-over-team.a{background:#eef8ff;border-color:#add7ff}.game-over-team.b{background:#fff1f6;border-color:#ffc1d7}.game-over-team b{display:block;font-size:15px}.game-over-team strong{display:block;margin-top:5px;font-size:17px}.game-over-vs{font-size:12px;font-weight:1000;color:#9a8fa8}.game-over-reason{margin-top:15px;font-size:11px;color:#968ba3}.game-over-actions{display:flex;justify-content:center;gap:8px;margin-top:17px}.game-over-actions .btn{min-width:120px}
    .game-over-overlay.winner-a .game-over-card{border-color:#9dccff}.game-over-overlay.winner-b .game-over-card{border-color:#ffb1cc}.game-over-overlay.draw .game-over-crown{filter:grayscale(.4)}
    .broadcast .game-over-overlay{background:rgba(255,250,253,.82);backdrop-filter:blur(7px)}
    .broadcast .game-over-card{width:min(600px,88vw);padding:30px 28px;border-width:3px}.broadcast .game-over-crown{font-size:58px}.broadcast .game-over-title{font-size:38px}.broadcast .game-over-decision{font-size:15px}.broadcast .game-over-team strong{font-size:20px}.broadcast .game-over-actions{display:none!important}
  `;
  document.head.appendChild(style);

  function tick(){
    bindNewGame();
    if(!currentRoom)return;
    if(!currentRoom.gameOver){
      if(boardFull(currentRoom))finalize('board');
      else if(allTimersDone(currentRoom))finalize('time');
    }
    renderGameOver();
  }

  ensureOverlay();
  bindNewGame();
  tick();
  setInterval(tick,250);
})();