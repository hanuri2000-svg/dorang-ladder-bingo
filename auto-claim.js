// 승리 결과 적용 시 해당 +점수 칸을 즉시 자동 점령한다.
// 패배 입력과 연승 보너스 선택은 기존 동작을 그대로 사용한다.
const originalApplyResult = applyResult;

async function applyResultWithAutoClaim(){
  if(selectedResult !== 'win'){
    return originalApplyResult();
  }

  let idx=Number($('resultPlayer').value);
  if(!isHost()){
    const mine=myPlayer();
    if(!mine){showSelfJoin();toast('먼저 자기 이름을 등록해줘.');return;}
    idx=currentRoom.players.findIndex(p=>p.clientId===myUid());
  }

  const p=currentRoom.players[idx];
  if(!p){toast('선수를 먼저 등록해줘.');return;}

  const playerName=p.name,team=p.team;
  const gain=Number($('gainScore').value);
  if(!Number.isFinite(gain)){toast('승리 시 받은 +점수를 입력해줘.');return;}

  let claimStatus='missing';
  let bonusEarned=false;

  await transact(r=>{
    pushHistory(r);
    const x=r.players.find(q=>q.name===playerName&&q.team===team)||r.players.find(q=>q.name===playerName);
    if(!x)return;

    x.wins=(x.wins||0)+1;
    x.streak=(x.streak||0)+1;
    x.best=Math.max(x.best||0,x.streak);
    logRoom(r,`${x.name} 승리 · +${gain}점 · ${x.streak}연승.`);

    if(x.streak>0 && x.streak%r.streakTarget===0){
      r.bonus[x.team]=(r.bonus[x.team]||0)+1;
      bonusEarned=true;
      logRoom(r,`🔥 ${x.name} ${x.streak}연승! ${x.team==='A'?r.teamA:r.teamB} 보너스 점령권 +1.`);
    }

    const cellIndex=r.board.findIndex(c=>Number(c.score)===gain);
    if(cellIndex<0){claimStatus='missing';return;}

    const c=r.board[cellIndex];
    if(c.owner===x.team){
      claimStatus='already-team';
      return;
    }
    if(c.owner && c.owner!==x.team && !r.capture){
      claimStatus='blocked';
      return;
    }

    const oldOwner=c.owner,oldPlayer=c.player;
    if(oldOwner && oldOwner!==x.team){
      const op=r.players.find(q=>q.name===oldPlayer&&q.team===oldOwner);
      if(op)op.lands=Math.max(0,(op.lands||0)-1);
    }

    x.lands=(x.lands||0)+1;
    c.owner=x.team;
    c.player=x.name;
    claimStatus=oldOwner&&oldOwner!==x.team?'captured':'claimed';
    logRoom(r,`${x.name}가 +${c.score} 칸 ${claimStatus==='captured'?'자동 탈환':'자동 점령'}.`);
  });

  pending=null;
  $('gainScore').value='';
  render();

  if(claimStatus==='claimed') toast(`+${gain} 칸 자동 점령 완료!`);
  else if(claimStatus==='captured') toast(`+${gain} 칸 자동 탈환 완료!`);
  else if(claimStatus==='already-team') toast(`+${gain} 칸은 이미 우리 팀이 점령 중이야.`);
  else if(claimStatus==='blocked') toast(`+${gain} 칸은 상대 팀 점령 중이야. 탈환이 금지돼 있어.`);
  else toast(`+${gain} 칸이 현재 보드에 없어. 승리 기록만 반영했어.`);

  if(bonusEarned){
    setTimeout(()=>toast('🔥 연승 보너스 점령권 +1! 원하는 빈 칸을 골라 사용할 수 있어.'),1900);
  }
}

$('applyResultBtn').onclick=applyResultWithAutoClaim;
