// 도랑이네 래더빙고 - 남/여 연승 기준 분리
// 기본값: 남자 5연승 / 여자 3연승. 방장이 각각 변경 가능.
(function(){
  if(window.__dorangGenderStreakLoaded) return;
  window.__dorangGenderStreakLoaded=true;

  let selfJoinGender='';
  const maleTarget=r=>Math.max(2,Number(r?.maleStreakTarget)||5);
  const femaleTarget=r=>Math.max(2,Number(r?.femaleStreakTarget)||3);
  const genderLabel=g=>g==='male'?'남자':g==='female'?'여자':'성별 미지정';

  function setSelfJoinGender(gender){
    selfJoinGender=gender==='male'||gender==='female'?gender:'';
    const m=document.getElementById('selfJoinMale');
    const f=document.getElementById('selfJoinFemale');
    if(m)m.classList.toggle('active',selfJoinGender==='male');
    if(f)f.classList.toggle('active',selfJoinGender==='female');
  }

  function ensureJoinGenderUI(){
    const modal=document.querySelector('.join-player-card');
    if(!modal||document.getElementById('selfJoinGenderField'))return;
    const teamGrid=document.querySelector('.join-team-grid');
    if(!teamGrid)return;
    const teamField=teamGrid.closest('.field');
    const field=document.createElement('div');
    field.className='field';
    field.id='selfJoinGenderField';
    field.innerHTML=`
      <label>성별</label>
      <div class="join-gender-grid">
        <button id="selfJoinMale" class="join-team-btn a" type="button">♂ 남자</button>
        <button id="selfJoinFemale" class="join-team-btn b" type="button">♀ 여자</button>
      </div>`;
    teamField.insertAdjacentElement('afterend',field);
    document.getElementById('selfJoinMale').onclick=()=>setSelfJoinGender('male');
    document.getElementById('selfJoinFemale').onclick=()=>setSelfJoinGender('female');
  }

  function ensureSettingsUI(){
    const legacy=document.getElementById('settingsStreak');
    if(!legacy||document.getElementById('genderStreakSettings'))return;
    const legacyField=legacy.closest('.field');
    const legacyRow=legacyField?.parentElement;
    if(legacyField)legacyField.style.display='none';
    const row=document.createElement('div');
    row.className='row gender-streak-settings';
    row.id='genderStreakSettings';
    row.innerHTML=`
      <div class="field">
        <label>♂ 남자 연승 기준</label>
        <input id="settingsMaleStreak" type="number" min="2" max="30" value="5">
      </div>
      <div class="field">
        <label>♀ 여자 연승 기준</label>
        <input id="settingsFemaleStreak" type="number" min="2" max="30" value="3">
      </div>`;
    if(legacyRow)legacyRow.insertAdjacentElement('afterend',row);
  }

  async function changePlayerGender(idx,gender){
    if(!isHost()||!currentRoom)return;
    const p=currentRoom.players[idx];
    if(!p)return;
    const name=p.name,team=p.team;
    await transact(r=>{
      const x=r.players.find(q=>q.name===name&&q.team===team)||r.players.find(q=>q.name===name);
      if(!x)return;
      x.gender=gender;
      logRoom(r,`${x.name} 성별 설정 → ${genderLabel(gender)}.`);
    });
  }

  function syncRosterGenderControls(){
    if(!currentRoom)return;
    const rows=[...document.querySelectorAll('#roster .player')];
    rows.forEach((row,idx)=>{
      const p=currentRoom.players[idx];
      if(!p)return;
      const info=row.querySelector('div');
      if(info&&!info.querySelector('.gender-badge')){
        const badge=document.createElement('span');
        badge.className='gender-badge '+(p.gender||'unset');
        badge.textContent=p.gender==='male'?'♂ 남':p.gender==='female'?'♀ 여':'⚠ 성별 미지정';
        const tag=info.querySelector('.teamtag');
        if(tag)tag.insertAdjacentElement('afterend',badge);else info.prepend(badge);
      }
      if(isHost()&&!row.querySelector('.gender-select')){
        const select=document.createElement('select');
        select.className='gender-select host-only';
        select.title='선수 성별';
        select.innerHTML='<option value="">성별</option><option value="male">♂ 남자</option><option value="female">♀ 여자</option>';
        select.value=p.gender||'';
        select.onchange=()=>changePlayerGender(idx,select.value);
        const teamBtn=row.querySelector('button');
        if(teamBtn)row.insertBefore(select,teamBtn);else row.appendChild(select);
      }
    });
  }

  function syncGenderUI(){
    ensureJoinGenderUI();
    ensureSettingsUI();
    if(currentRoom){
      const male=document.getElementById('settingsMaleStreak');
      const female=document.getElementById('settingsFemaleStreak');
      if(male&&document.activeElement!==male)male.value=String(maleTarget(currentRoom));
      if(female&&document.activeElement!==female)female.value=String(femaleTarget(currentRoom));
      syncRosterGenderControls();
      const mine=typeof myPlayer==='function'?myPlayer():null;
      const summary=document.getElementById('myPlayerSummary');
      if(mine&&summary&&!summary.querySelector('.my-gender-note')){
        const note=document.createElement('span');
        note.className='my-gender-note';
        note.textContent=` · ${genderLabel(mine.gender)}`;
        summary.appendChild(note);
      }
    }
  }

  // 참가자 등록/정보수정: 성별을 같이 저장
  async function submitSelfJoinWithGender(){
    if(!currentRoom||isHost()||broadcast)return;
    const name=$('selfJoinName').value.trim();
    if(!name){toast('이름을 입력해줘.');return;}
    if(!selfJoinGender){toast('남자 / 여자 중 성별을 선택해줘.');return;}
    const uid=myUid();
    if(!uid){toast('로그인 정보를 확인 중이야. 잠시 후 다시 해줘.');return;}
    let rejected=false;
    await transact(r=>{
      const sameUid=r.players.find(p=>p.clientId===uid);
      if(sameUid){
        sameUid.name=name;
        sameUid.team=selfJoinTeam;
        sameUid.gender=selfJoinGender;
        logRoom(r,`${sameUid.name} 참가 정보 변경 · ${genderLabel(selfJoinGender)}.`);
        return;
      }
      const sameName=r.players.find(p=>String(p.name).toLowerCase()===name.toLowerCase());
      if(sameName){
        if(sameName.clientId&&sameName.clientId!==uid){rejected=true;return;}
        sameName.clientId=uid;
        sameName.gender=selfJoinGender;
        logRoom(r,`${sameName.name} 참가 접속 · ${genderLabel(selfJoinGender)}.`);
        return;
      }
      r.players.push({name,team:selfJoinTeam,gender:selfJoinGender,clientId:uid,wins:0,losses:0,streak:0,best:0,lands:0});
      logRoom(r,`${name} 참가 · ${selfJoinTeam==='A'?r.teamA:r.teamB} · ${genderLabel(selfJoinGender)}.`);
    });
    if(rejected){toast('이미 다른 참가자가 사용 중인 이름이야.');return;}
    hideSelfJoin();
    $('selfJoinName').value='';
    setSelfJoinGender('');
    render();
  }

  // 방장이 명단을 다시 적용해도 기존 성별 정보 유지
  async function applyRosterWithGender(){
    if(!isHost())return;
    const a=splitNames($('bulkA').value),b=splitNames($('bulkB').value);
    if(!a.length&&!b.length){toast('선수 이름을 입력해줘.');return;}
    const incoming=[...a.map(name=>({name,team:'A'})),...b.map(name=>({name,team:'B'}))];
    const uniq=[];const seen=new Set();
    incoming.forEach(x=>{const k=x.name.toLowerCase();if(!seen.has(k)){seen.add(k);uniq.push(x);}});
    await transact(r=>{
      pushHistory(r);
      const old=new Map(r.players.map(p=>[p.name.toLowerCase(),p]));
      r.players=uniq.map(x=>{
        const o=old.get(x.name.toLowerCase());
        return {name:x.name,team:x.team,gender:o?.gender||'',clientId:o?.clientId||'',wins:o?.wins||0,losses:o?.losses||0,streak:o?.streak||0,best:o?.best||0,lands:o?.lands||0};
      });
      logRoom(r,`선수 명단 ${r.players.length}명 적용.`);
    });
    $('bulkA').value='';$('bulkB').value='';
  }

  // 기존 설정 저장 + 남/여 연승 기준 별도 저장
  const baseSaveSettings=saveSettings;
  async function saveSettingsWithGender(){
    if(!isHost())return;
    const male=Math.max(2,Math.trunc(Number(document.getElementById('settingsMaleStreak')?.value)||5));
    const female=Math.max(2,Math.trunc(Number(document.getElementById('settingsFemaleStreak')?.value)||3));
    const legacy=document.getElementById('settingsStreak');
    if(legacy)legacy.value=String(female);
    await baseSaveSettings();
    await transact(r=>{
      r.maleStreakTarget=male;
      r.femaleStreakTarget=female;
      r.streakTarget=female;
      logRoom(r,`연승 기준 설정 → 남자 ${male}연승 / 여자 ${female}연승.`);
    });
    toast(`연승 기준 저장 · 남 ${male} / 여 ${female}`);
  }

  // 승리 결과: 성별에 맞는 연승 기준으로 보너스 지급 + 해당 점수 자동 점령
  async function applyResultWithGenderAutoClaim(){
    if(selectedResult!=='win'){
      return applyResult();
    }
    let idx=Number($('resultPlayer').value);
    if(!isHost()){
      const mine=myPlayer();
      if(!mine){showSelfJoin();toast('먼저 자기 이름을 등록해줘.');return;}
      idx=currentRoom.players.findIndex(p=>p.clientId===myUid());
    }
    const p=currentRoom.players[idx];
    if(!p){toast('선수를 먼저 등록해줘.');return;}
    if(p.gender!=='male'&&p.gender!=='female'){
      if(!isHost()){
        const btn=document.getElementById('myInfoBtn');
        if(btn)btn.click();
        toast('내 정보에서 성별을 먼저 지정해줘.');
      }else toast(`${p.name} 선수의 성별을 팀 명단에서 지정해줘.`);
      return;
    }
    const playerName=p.name,team=p.team;
    const gain=Number($('gainScore').value);
    if(!Number.isFinite(gain)){toast('승리 시 받은 +점수를 입력해줘.');return;}

    let claimStatus='missing';
    let bonusEarned=false;
    let earnedTarget=0;
    await transact(r=>{
      pushHistory(r);
      const x=r.players.find(q=>q.name===playerName&&q.team===team)||r.players.find(q=>q.name===playerName);
      if(!x)return;
      x.wins=(x.wins||0)+1;
      x.streak=(x.streak||0)+1;
      x.best=Math.max(x.best||0,x.streak);
      logRoom(r,`${x.name} 승리 · +${gain}점 · ${x.streak}연승.`);

      const target=x.gender==='male'?maleTarget(r):femaleTarget(r);
      if(x.streak>0&&x.streak%target===0){
        r.bonus[x.team]=(r.bonus[x.team]||0)+1;
        bonusEarned=true;
        earnedTarget=target;
        logRoom(r,`🔥 ${x.name} ${x.streak}연승! (${genderLabel(x.gender)} ${target}연승 기준) ${x.team==='A'?r.teamA:r.teamB} 보너스 점령권 +1.`);
      }

      const cellIndex=r.board.findIndex(c=>Number(c.score)===gain);
      if(cellIndex<0){claimStatus='missing';return;}
      const c=r.board[cellIndex];
      if(c.owner===x.team){claimStatus='already-team';return;}
      if(c.owner&&c.owner!==x.team&&!r.capture){claimStatus='blocked';return;}
      const oldOwner=c.owner,oldPlayer=c.player;
      if(oldOwner&&oldOwner!==x.team){
        const op=r.players.find(q=>q.name===oldPlayer&&q.team===oldOwner);
        if(op)op.lands=Math.max(0,(op.lands||0)-1);
      }
      x.lands=(x.lands||0)+1;
      c.owner=x.team;c.player=x.name;
      claimStatus=oldOwner&&oldOwner!==x.team?'captured':'claimed';
      logRoom(r,`${x.name}가 +${c.score} 칸 ${claimStatus==='captured'?'자동 탈환':'자동 점령'}.`);
    });

    pending=null;
    $('gainScore').value='';
    render();
    if(claimStatus==='claimed')toast(`+${gain} 칸 자동 점령 완료!`);
    else if(claimStatus==='captured')toast(`+${gain} 칸 자동 탈환 완료!`);
    else if(claimStatus==='already-team')toast(`+${gain} 칸은 이미 우리 팀이 점령 중이야.`);
    else if(claimStatus==='blocked')toast(`+${gain} 칸은 상대 팀 점령 중이야. 탈환이 금지돼 있어.`);
    else toast(`+${gain} 칸이 현재 보드에 없어. 승리 기록만 반영했어.`);
    if(bonusEarned){
      setTimeout(()=>toast(`🔥 ${earnedTarget}연승 달성! 보너스 점령권 +1`),1900);
    }
  }

  function bindFeatureHandlers(){
    ensureJoinGenderUI();
    ensureSettingsUI();
    const submit=document.getElementById('selfJoinSubmit');
    if(submit)submit.onclick=submitSelfJoinWithGender;
    try{submitSelfJoin=submitSelfJoinWithGender;}catch(e){}

    const rosterBtn=document.getElementById('applyRosterBtn');
    if(rosterBtn)rosterBtn.onclick=applyRosterWithGender;
    const saveBtn=document.getElementById('saveSettingsBtn');
    if(saveBtn)saveBtn.onclick=saveSettingsWithGender;
    const resultBtn=document.getElementById('applyResultBtn');
    if(resultBtn)resultBtn.onclick=applyResultWithGenderAutoClaim;

    const infoBtn=document.getElementById('myInfoBtn');
    if(infoBtn&&!infoBtn.dataset.genderWrapped){
      infoBtn.dataset.genderWrapped='yes';
      const old=infoBtn.onclick;
      infoBtn.onclick=()=>{
        if(old)old();
        const mine=myPlayer();
        setSelfJoinGender(mine?.gender||'');
      };
    }
  }

  // 렌더 뒤 성별 UI도 다시 맞춘다.
  try{
    const baseRender=render;
    render=function(){
      baseRender();
      setTimeout(()=>{syncGenderUI();bindFeatureHandlers();},0);
    };
  }catch(e){console.warn('gender render hook failed',e);}

  const style=document.createElement('style');
  style.id='gender-streak-style';
  style.textContent=`
    .join-gender-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:10px 0}
    .gender-streak-settings{margin-top:2px}
    .gender-badge{display:inline-flex;align-items:center;margin-left:5px;padding:2px 5px;border-radius:999px;font-size:9px;font-weight:900;vertical-align:middle}
    .gender-badge.male{background:#e7f3ff;color:#3376b6;border:1px solid #b9dafb}
    .gender-badge.female{background:#ffeaf1;color:#b24e70;border:1px solid #f8c5d5}
    .gender-badge.unset{background:#fff7df;color:#946d18;border:1px solid #efdca3}
    body.is-host #roster .player{grid-template-columns:minmax(0,1fr) 82px auto!important}
    body:not(.is-host) #roster .player{grid-template-columns:1fr!important}
    .gender-select{width:82px!important;min-width:82px;padding:5px 6px!important;font-size:10px!important;border-radius:8px!important}
    .my-gender-note{color:var(--muted);font-size:10px}
    .broadcast .gender-badge,.broadcast .gender-select{display:none!important}
  `;
  document.head.appendChild(style);

  bindFeatureHandlers();
  syncGenderUI();

  // 기존 방에는 필드가 없으므로 방장이 들어오면 기본값을 한 번 저장한다.
  let tries=0;
  const timer=setInterval(async()=>{
    tries++;
    bindFeatureHandlers();
    syncGenderUI();
    if(currentRoom){
      if(isHost()&&(!Number(currentRoom.maleStreakTarget)||!Number(currentRoom.femaleStreakTarget))){
        try{
          await transact(r=>{
            if(!Number(r.maleStreakTarget))r.maleStreakTarget=5;
            if(!Number(r.femaleStreakTarget))r.femaleStreakTarget=3;
          });
        }catch(e){console.warn('streak target migration failed',e);}
      }
      if(tries>20)clearInterval(timer);
    }else if(tries>60)clearInterval(timer);
  },300);
})();
