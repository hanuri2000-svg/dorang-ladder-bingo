// 도랑이네 래더빙고 - TIME OVER 결과 확정 안전장치
(function(){
  if(window.__dorangTimeOverResultFixLoaded)return;
  window.__dorangTimeOverResultFixLoaded=true;

  let working=false;

  function remainingMs(r,p,now=Date.now()){
    if(!p)return Infinity;
    const total=Math.max(1,Number(r?.timer?.durationSec||3600));
    if(!p.timerStarted)return Infinity;
    if(p.timerFinished||p.overtimeUsed)return 0;
    if(p.timerRunning)return Math.max(0,Number(p.timerEndAt||0)-now);
    const sec=Number(p.timerRemainingSec);
    return Number.isFinite(sec)?Math.max(0,sec*1000):total*1000;
  }

  function startedPlayers(r){
    return (Array.isArray(r?.players)?r.players:[]).filter(p=>!!p.timerStarted);
  }

  function timeIsOver(r){
    if(!r?.timer?.enabled)return false;
    const players=startedPlayers(r);
    if(!players.length)return false;
    const now=Date.now();
    return players.every(p=>p.timerFinished||p.overtimeUsed||remainingMs(r,p,now)<=0);
  }

  function countBingo(r,team){
    if(typeof bingoLines==='function'){
      try{return Number(bingoLines(r,team)?.count||0);}catch{}
    }
    const n=Number(r?.size)||0;
    const b=Array.isArray(r?.board)?r.board:[];
    if(!n||b.length<n*n)return 0;
    const lines=[];
    for(let y=0;y<n;y++)lines.push(Array.from({length:n},(_,x)=>y*n+x));
    for(let x=0;x<n;x++)lines.push(Array.from({length:n},(_,y)=>y*n+x));
    lines.push(Array.from({length:n},(_,i)=>i*n+i));
    lines.push(Array.from({length:n},(_,i)=>i*n+(n-1-i)));
    return lines.filter(line=>line.every(i=>b[i]?.owner===team)).length;
  }

  function resultOf(r){
    const aBingo=countBingo(r,'A');
    const bBingo=countBingo(r,'B');
    const aCells=(r.board||[]).filter(c=>c.owner==='A').length;
    const bCells=(r.board||[]).filter(c=>c.owner==='B').length;
    let winner='DRAW',decision='draw';

    if(r.mode==='bingo'&&aBingo!==bBingo){
      winner=aBingo>bBingo?'A':'B';
      decision='bingo';
    }else if(aCells!==bCells){
      winner=aCells>bCells?'A':'B';
      decision=r.mode==='bingo'?'cells-after-bingo-tie':'cells';
    }
    return {aBingo,bBingo,aCells,bCells,winner,decision};
  }

  async function forceFinish(){
    if(working||!currentRoom||currentRoom.gameOver||!timeIsOver(currentRoom))return;
    working=true;
    try{
      await transact(r=>{
        if(r.gameOver||!timeIsOver(r))return;

        const result=resultOf(r);
        const endedAt=Date.now();
        const teamA=r.teamA,teamB=r.teamB;
        const winnerName=result.winner==='A'?teamA:result.winner==='B'?teamB:'무승부';

        r.gameOver={
          ended:true,
          reason:'time',
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
        r.timer.remainingSec=0;

        (r.players||[]).forEach(p=>{
          if(!p.timerStarted)return;
          p.timerRemainingSec=0;
          p.timerFinished=true;
          p.timerRunning=false;
          p.timerEndAt=0;
          p.gameActive=false;
          p.gameStartedAt=0;
          p.gameStartedBeforeEnd=false;
        });

        const scoreText=`${result.aBingo}:${result.bBingo} BINGO / ${result.aCells}:${result.bCells}칸`;
        if(result.winner==='DRAW')logRoom(r,`🤝 TIME OVER · ${scoreText} · 무승부.`);
        else logRoom(r,`🏆 TIME OVER · ${winnerName} 승리! (${scoreText})`);
      });
    }catch(err){
      console.warn('TIME OVER result fix failed',err);
    }finally{
      working=false;
    }
  }

  function tick(){
    if(!currentRoom||currentRoom.gameOver)return;
    if(timeIsOver(currentRoom))forceFinish();
  }

  tick();
  setInterval(tick,180);
})();
