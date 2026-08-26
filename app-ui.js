function render(){
  if(!currentRoom)return;
  showApp();
  document.body.classList.toggle('is-host',isHost());
  document.body.classList.toggle('broadcast',broadcast);
  $('roomTitle').textContent=currentRoom.title;
  $('roomCodeTop').textContent=roomCode;
  const mine=myPlayer();
  $('roleText').textContent=isHost()?'방장':broadcast?'송출':mine?`참가자 · ${mine.name}`:'참가자';
  const exp=new Date(Number(currentRoom.expiresAt));
  $('expiryText').textContent=`자동삭제 ${exp.toLocaleDateString('ko-KR')}`;
  $('broadcastTitle').textContent=currentRoom.title;
  $('broadcastSub').textContent=`${currentRoom.teamA} vs ${currentRoom.teamB} · ${currentRoom.mode==='bingo'?'일반 래더빙고':'땅따먹기'}`;
  $('settingsTitle').value=currentRoom.title;
  $('settingsA').value=currentRoom.teamA;$('settingsB').value=currentRoom.teamB;
  $('settingsSize').value=String(currentRoom.size);$('settingsStreak').value=String(currentRoom.streakTarget);
  $('settingsMinScore').value=String(currentRoom.minScore);$('settingsMaxScore').value=String(currentRoom.maxScore);
  $('settingsCapture').value=currentRoom.capture?'yes':'no';
  $('bulkALabel').textContent=currentRoom.teamA;$('bulkBLabel').textContent=currentRoom.teamB;
  $('modeBingoBtn').classList.toggle('active',currentRoom.mode==='bingo');
  $('modeLandBtn').classList.toggle('active',currentRoom.mode==='land');

  $('scoreAName').textContent=currentRoom.teamA;$('scoreBName').textContent=currentRoom.teamB;
  if(currentRoom.mode==='bingo'){
    const a=bingoLines(currentRoom,'A'),b=bingoLines(currentRoom,'B');
    $('scoreABig').textContent=a.count+' BINGO';$('scoreBBig').textContent=b.count+' BINGO';
    $('scoreAMini').textContent=currentRoom.board.filter(c=>c.owner==='A').length+'칸 점령';
    $('scoreBMini').textContent=currentRoom.board.filter(c=>c.owner==='B').length+'칸 점령';
  }else{
    const a=landStats(currentRoom,'A'),b=landStats(currentRoom,'B');
    $('scoreABig').textContent=a.count+'칸';$('scoreBBig').textContent=b.count+'칸';
    $('scoreAMini').textContent='점유율 '+a.rate+'%';$('scoreBMini').textContent='점유율 '+b.rate+'%';
  }

  const aLines=bingoLines(currentRoom,'A'),bLines=bingoLines(currentRoom,'B');
  $('board').style.gridTemplateColumns=`repeat(${currentRoom.size},1fr)`;
  $('board').innerHTML='';
  currentRoom.board.forEach((c,i)=>{
    const el=document.createElement('div');
    el.className='cell '+(c.owner?c.owner.toLowerCase():'');
    const canMatch=pending && (
      (pending.type==='score' && c.score===pending.score && (!c.owner || c.owner===pending.team || currentRoom.capture)) ||
      (pending.type==='bonus' && !c.owner)
    );
    if(canMatch){el.classList.add('match','clickable');el.onclick=()=>claimCell(i)}
    if(currentRoom.mode==='bingo' && ((c.owner==='A'&&aLines.indexes.has(i))||(c.owner==='B'&&bLines.indexes.has(i))))el.classList.add('bingo-line');
    el.innerHTML=`+${c.score}<span class="owner">${c.player||''}</span><span class="mark">${c.owner?(c.owner==='A'?'🔵':'🌸'):''}</span>`;
    $('board').appendChild(el);
  });

  $('roster').innerHTML='';
  currentRoom.players.forEach((p,idx)=>{
    const el=document.createElement('div');el.className='player';
    el.innerHTML=`<div><b>${escapeHtml(p.name)}</b> <span class="teamtag ${p.team.toLowerCase()}">${p.team==='A'?escapeHtml(currentRoom.teamA):escapeHtml(currentRoom.teamB)}</span><small>${p.wins||0}승 ${p.losses||0}패 · ${p.streak||0}연승 · 점령 ${p.lands||0}칸</small></div><button class="btn host-only" style="padding:5px 7px">팀변경</button>`;
    const btn=el.querySelector('button');if(btn)btn.onclick=()=>changeTeam(idx);
    $('roster').appendChild(el);
  });
  if(isHost()){
    $('resultPlayer').innerHTML=currentRoom.players.map((p,i)=>`<option value="${i}">${escapeHtml(p.name)} (${p.team==='A'?escapeHtml(currentRoom.teamA):escapeHtml(currentRoom.teamB)})</option>`).join('');
    $('resultPlayer').disabled=false;
  }else if(!broadcast){
    const mine=myPlayer();
    if(mine){
      const idx=currentRoom.players.findIndex(p=>p.clientId===myUid());
      $('resultPlayer').innerHTML=`<option value="${idx}">${escapeHtml(mine.name)} (${mine.team==='A'?escapeHtml(currentRoom.teamA):escapeHtml(currentRoom.teamB)})</option>`;
      $('resultPlayer').disabled=true;
      $('myPlayerSummary').innerHTML=`<b>${escapeHtml(mine.name)}</b> · ${mine.team==='A'?escapeHtml(currentRoom.teamA):escapeHtml(currentRoom.teamB)} <span style="margin-left:auto;color:var(--muted)">${mine.wins||0}승 ${mine.losses||0}패 · ${mine.streak||0}연승</span>`;
    }else{
      $('resultPlayer').innerHTML='';
      $('resultPlayer').disabled=true;
      $('myPlayerSummary').textContent='먼저 참가자 이름을 등록해줘.';
    }
  }
  $('bonusA').textContent=currentRoom.bonus.A||0;$('bonusB').textContent=currentRoom.bonus.B||0;
  $('useBonusA').textContent=currentRoom.teamA+' 보너스';$('useBonusB').textContent=currentRoom.teamB+' 보너스';
  $('log').innerHTML=currentRoom.logs.map(l=>`<div class="logitem"><b>${escapeHtml(l.t)}</b> ${escapeHtml(l.text)}</div>`).join('');
  updatePendingStatus();
}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function updatePendingStatus(){
  const box=$('pendingStatus');
  if(!pending){box.className='status';box.textContent='선수를 선택하고 경기 결과를 입력해줘.';return}
  box.className='status warn';
  box.textContent=pending.type==='score'?`+${pending.score} 칸을 선택해줘. 노란 테두리 칸 중 하나를 클릭하면 돼.`:`${pending.team==='A'?currentRoom.teamA:currentRoom.teamB} 보너스 점령권 사용 중. 빈 칸 하나를 선택해줘.`;
}
async function applyResult(){
  let idx=Number($('resultPlayer').value);
  if(!isHost()){
    const mine=myPlayer();
    if(!mine){showSelfJoin();toast('먼저 자기 이름을 등록해줘.');return;}
    idx=currentRoom.players.findIndex(p=>p.clientId===myUid());
  }
  const p=currentRoom.players[idx]; if(!p){toast('선수를 먼저 등록해줘.');return}
  const playerName=p.name,team=p.team;
  if(selectedResult==='loss'){
    await transact(r=>{
      pushHistory(r);
      const x=r.players.find(q=>q.name===playerName&&q.team===team)||r.players.find(q=>q.name===playerName);
      if(!x)return;x.losses=(x.losses||0)+1;x.streak=0;logRoom(r,`${x.name} 패배 · 연승 초기화.`);
    });
    pending=null;render();return;
  }
  const gain=Number($('gainScore').value);if(!Number.isFinite(gain)){toast('승리 시 받은 +점수를 입력해줘.');return}
  let bonusEarned=false;
  await transact(r=>{
    pushHistory(r);
    const x=r.players.find(q=>q.name===playerName&&q.team===team)||r.players.find(q=>q.name===playerName);
    if(!x)return;
    x.wins=(x.wins||0)+1;x.streak=(x.streak||0)+1;x.best=Math.max(x.best||0,x.streak);
    logRoom(r,`${x.name} 승리 · +${gain}점 · ${x.streak}연승.`);
    if(x.streak>0 && x.streak%r.streakTarget===0){
      r.bonus[x.team]=(r.bonus[x.team]||0)+1;bonusEarned=true;
      logRoom(r,`🔥 ${x.name} ${x.streak}연승! ${x.team==='A'?r.teamA:r.teamB} 보너스 점령권 +1.`);
    }
  });
  const possible=currentRoom.board.some(c=>c.score===gain && (!c.owner || c.owner===team || currentRoom.capture));
  pending=possible?{type:'score',score:gain,team,playerName}:null;
  if(!possible)toast(`+${gain} 점령 가능 칸이 없어.`);
  else toast(`+${gain} 칸을 골라줘.`);
  $('gainScore').value='';render();
}
async function claimCell(i){
  if(!pending)return;
  const take=deepClone(pending);
  await transact(r=>{
    const c=r.board[i];if(!c)return;
    if(take.type==='score'){
      if(c.score!==take.score)return;
      if(c.owner && c.owner!==take.team && !r.capture)return;
      pushHistory(r);
      const oldOwner=c.owner,oldPlayer=c.player;
      if(oldOwner && oldOwner!==take.team){
        const op=r.players.find(x=>x.name===oldPlayer&&x.team===oldOwner);if(op)op.lands=Math.max(0,(op.lands||0)-1);
      }
      if(c.owner!==take.team){
        const np=r.players.find(x=>x.name===take.playerName&&x.team===take.team);if(np)np.lands=(np.lands||0)+1;
      }
      c.owner=take.team;c.player=take.playerName;
      logRoom(r,`${take.playerName}가 +${c.score} 칸 ${oldOwner&&oldOwner!==take.team?'탈환':'점령'}.`);
    }else{
      if(c.owner)return;pushHistory(r);c.owner=take.team;c.player='연승 보너스';
      r.bonus[take.team]=Math.max(0,(r.bonus[take.team]||0)-1);
      logRoom(r,`${take.team==='A'?r.teamA:r.teamB}가 보너스로 +${c.score} 칸 점령.`);
    }
  });
  pending=null;render();
}
async function useBonus(team){
  if((currentRoom.bonus[team]||0)<=0){toast('사용 가능한 보너스 점령권이 없어.');return}
  if(!currentRoom.board.some(c=>!c.owner)){toast('빈 칸이 없어.');return}
  pending={type:'bonus',team};render();
}
async function saveSettings(){
  if(!isHost())return;
  const title=$('settingsTitle').value.trim()||'도랑이네 래더빙고',teamA=$('settingsA').value.trim()||'BLUE',teamB=$('settingsB').value.trim()||'PINK';
  const size=Number($('settingsSize').value)||7;
  let minScore=Math.trunc(Number($('settingsMinScore').value));
  let maxScore=Math.trunc(Number($('settingsMaxScore').value));
  const streak=Math.max(2,Number($('settingsStreak').value)||3),capture=$('settingsCapture').value==='yes';
  if(!Number.isFinite(minScore)||!Number.isFinite(maxScore)){toast('점수 최소/최대 값을 확인해줘.');return;}
  if(minScore>maxScore)[minScore,maxScore]=[maxScore,minScore];
  const scores=makeScoreRange(minScore,maxScore);
  if(scores.length<size*size){
    toast(`${size}×${size} 보드는 ${size*size}칸이야. 현재 구간은 숫자가 ${scores.length}개라 부족해.`);
    return;
  }
  await transact(r=>{pushHistory(r);r.title=title;r.teamA=teamA;r.teamB=teamB;r.streakTarget=streak;r.capture=capture;
    const rangeChanged=r.minScore!==minScore||r.maxScore!==maxScore;
    const sizeChanged=r.size!==size;
    r.minScore=minScore;r.maxScore=maxScore;r.scores=scores;
    if(sizeChanged||rangeChanged){
      r.size=size;r.board=makeBoard(size,scores);r.players.forEach(p=>p.lands=0);r.bonus={A:0,B:0};
      logRoom(r,`보드 설정 변경 → ${size}×${size}, 점수 ${minScore}~${maxScore}, 중복 없는 새 보드 생성.`);
    }else logRoom(r,'게임 설정 변경.');
  });
}
async function setMode(mode){
  if(!isHost()||currentRoom.mode===mode)return;
  await transact(r=>{pushHistory(r);r.mode=mode;logRoom(r,`게임 모드 변경 → ${mode==='bingo'?'일반 래더빙고':'땅따먹기'}.`)});
}
async function newBoard(){
  if(!isHost()||!confirm('현재 점령 상황을 지우고 새 보드를 만들까?'))return;
  const available=currentRoom.maxScore-currentRoom.minScore+1;
  if(available<currentRoom.size*currentRoom.size){
    toast(`${currentRoom.size}×${currentRoom.size} 보드에는 ${currentRoom.size*currentRoom.size}개의 서로 다른 숫자가 필요해. 현재 구간은 ${available}개야.`);
    return;
  }
  await transact(r=>{pushHistory(r);r.board=makeBoard(r.size,r.scores);r.players.forEach(p=>{p.lands=0;p.streak=0});r.bonus={A:0,B:0};logRoom(r,'중복 없는 새 보드 생성.');});
  pending=null;
}
async function applyRoster(){
  if(!isHost())return;
  const a=splitNames($('bulkA').value),b=splitNames($('bulkB').value);
  if(!a.length&&!b.length){toast('선수 이름을 입력해줘.');return}
  const incoming=[...a.map(name=>({name,team:'A'})),...b.map(name=>({name,team:'B'}))];
  const uniq=[];const seen=new Set();incoming.forEach(x=>{const k=x.name.toLowerCase();if(!seen.has(k)){seen.add(k);uniq.push(x)}});
  await transact(r=>{
    pushHistory(r);const old=new Map(r.players.map(p=>[p.name.toLowerCase(),p]));
    r.players=uniq.map(x=>{const o=old.get(x.name.toLowerCase());return {name:x.name,team:x.team,clientId:o?.clientId||'',wins:o?.wins||0,losses:o?.losses||0,streak:o?.streak||0,best:o?.best||0,lands:o?.lands||0}});
    logRoom(r,`선수 명단 ${r.players.length}명 적용.`);
  });
  $('bulkA').value='';$('bulkB').value='';
}
async function changeTeam(idx){
  if(!isHost())return;const p=currentRoom.players[idx];if(!p)return;const name=p.name;
  await transact(r=>{pushHistory(r);const x=r.players.find(q=>q.name===name);if(!x)return;x.team=x.team==='A'?'B':'A';logRoom(r,`${x.name} 팀 변경 → ${x.team==='A'?r.teamA:r.teamB}.`)});
}
async function undo(){
  if(!isHost())return;
  await transact(r=>{
    if(!r.history?.length)return;
    const prev=r.history.pop(),hist=r.history;
    Object.keys(r).forEach(k=>delete r[k]);Object.assign(r,prev);r.history=hist;
    logRoom(r,'↩ 방장이 마지막 변경을 되돌렸어.');
  });
  pending=null;
}
function shareUrl(type){
  const u=new URL(location.href);u.search='';u.searchParams.set('room',roomCode);
  if(type==='broadcast')u.searchParams.set('view','broadcast');
  navigator.clipboard.writeText(u.toString()).then(()=>toast(type==='broadcast'?'송출 링크 복사 완료':'참가 링크 복사 완료'));
}
function openBroadcast(){
  if(!roomCode){toast('먼저 방에 들어가야 해.');return;}
  const u=new URL(location.href);
  u.search='';
  u.searchParams.set('room',roomCode);
  u.searchParams.set('view','broadcast');
  window.open(u.toString(),'_blank','noopener');
}
document.querySelectorAll('[data-create-mode]').forEach(el=>{
  el.onclick=()=>{
    createMode=el.dataset.createMode;
    document.querySelectorAll('[data-create-mode]').forEach(x=>x.classList.toggle('active',x===el));
  };
});
$('createRoomBtn').onclick=createRoom;$('joinRoomBtn').onclick=joinRoom;
$('joinCode').addEventListener('keydown',e=>{if(e.key==='Enter')joinRoom()});

$('copyJoinBtn').onclick=()=>shareUrl('join');
$('openBroadcastBtn').onclick=openBroadcast;
$('copyBroadcastBtn').onclick=()=>shareUrl('broadcast');
$('selfJoinTeamA').onclick=()=>setSelfJoinTeam('A');
$('selfJoinTeamB').onclick=()=>setSelfJoinTeam('B');
$('selfJoinSubmit').onclick=submitSelfJoin;
$('selfJoinName').addEventListener('keydown',e=>{if(e.key==='Enter')submitSelfJoin()});
$('selfJoinCancel').onclick=()=>{const u=new URL(location.href);u.search='';location.href=u.toString()};
$('myInfoBtn').onclick=()=>{
  const mine=myPlayer();
  if(mine){$('selfJoinName').value=mine.name;setSelfJoinTeam(mine.team);}
  // Temporarily allow editing existing identity by clearing only UI gate check
  $('joinPlayerModal').classList.remove('hidden');
};
$('leaveBtn').onclick=()=>{const u=new URL(location.href);u.search='';location.href=u.toString()};
$('saveSettingsBtn').onclick=saveSettings;$('newBoardBtn').onclick=newBoard;$('applyRosterBtn').onclick=applyRoster;
$('modeBingoBtn').onclick=()=>setMode('bingo');$('modeLandBtn').onclick=()=>setMode('land');
$('winBtn').onclick=()=>{selectedResult='win';$('winBtn').classList.add('primary');$('lossBtn').classList.remove('primary')};
$('lossBtn').onclick=()=>{selectedResult='loss';$('lossBtn').classList.add('primary');$('winBtn').classList.remove('primary')};
$('applyResultBtn').onclick=applyResult;$('useBonusA').onclick=()=>useBonus('A');$('useBonusB').onclick=()=>useBonus('B');$('undoBtn').onclick=undo;

(async()=>{
  await initFirebase();
  if(roomCode) await connectRoom(); else showWelcome();
})();
