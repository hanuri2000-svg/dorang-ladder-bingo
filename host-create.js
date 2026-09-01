// 도랑이네 래더빙고 - 방 생성 시 방장 자동 선수 등록
(function(){
  if(window.__dorangHostCreateLoaded)return;
  window.__dorangHostCreateLoaded=true;

  function ensureUI(){
    const createBtn=document.getElementById('createRoomBtn');
    if(!createBtn||document.getElementById('createHostName'))return;

    const wrap=document.createElement('div');
    wrap.id='hostCreateFields';
    wrap.innerHTML=`
      <div class="divider" style="margin:14px 0 12px"></div>
      <div class="field">
        <label>👑 방장 이름</label>
        <input id="createHostName" maxlength="30" placeholder="예: 최도랑" autocomplete="nickname">
      </div>
      <div class="row">
        <div class="field">
          <label>내 팀</label>
          <select id="createHostTeam">
            <option value="A">도랑팀</option>
            <option value="B">남의팀</option>
          </select>
        </div>
        <div class="field">
          <label>성별</label>
          <select id="createHostGender">
            <option value="">선택</option>
            <option value="male">♂ 남자</option>
            <option value="female">♀ 여자</option>
          </select>
        </div>
      </div>
      <div class="muted host-create-note">방을 만들면 방장이 첫 번째 선수로 자동 등록돼.</div>`;
    createBtn.insertAdjacentElement('beforebegin',wrap);

    const teamA=document.getElementById('createA');
    const teamB=document.getElementById('createB');
    const teamSelect=document.getElementById('createHostTeam');
    const syncTeamLabels=()=>{
      if(!teamSelect)return;
      teamSelect.options[0].textContent=teamA?.value.trim()||'도랑팀';
      teamSelect.options[1].textContent=teamB?.value.trim()||'남의팀';
    };
    teamA?.addEventListener('input',syncTeamLabels);
    teamB?.addEventListener('input',syncTeamLabels);
    syncTeamLabels();
  }

  async function createRoomWithHost(e){
    const btn=e.target.closest?.('#createRoomBtn');
    if(!btn)return;
    e.preventDefault();
    e.stopImmediatePropagation();

    const title=document.getElementById('createTitle')?.value.trim()||'도랑이네 래더빙고';
    const teamA=document.getElementById('createA')?.value.trim()||'도랑팀';
    const teamB=document.getElementById('createB')?.value.trim()||'남의팀';
    const hostName=document.getElementById('createHostName')?.value.trim()||'';
    const hostTeam=document.getElementById('createHostTeam')?.value==='B'?'B':'A';
    const gender=document.getElementById('createHostGender')?.value||'';

    if(!hostName){toast('방장 이름을 입력해줘.');document.getElementById('createHostName')?.focus();return;}
    if(gender!=='male'&&gender!=='female'){toast('방장 성별을 선택해줘.');return;}

    btn.disabled=true;
    const originalText=btn.textContent;
    btn.textContent='방 만드는 중...';
    try{
      roomCode=randCode();
      hostKey=randSecret();
      const room=freshRoom({title,mode:createMode,teamA,teamB,hostKey});
      const uid=typeof myUid==='function'?myUid():'';
      room.players=[{
        name:hostName,
        team:hostTeam,
        gender,
        clientId:uid||'',
        wins:0,losses:0,streak:0,best:0,lands:0
      }];
      room.logs=Array.isArray(room.logs)?room.logs:[];
      room.logs.unshift({t:nowTime(),text:`👑 방장 ${hostName} 자동 등록 · ${hostTeam==='A'?teamA:teamB} · ${gender==='male'?'남자':'여자'}.`});
      room.updatedAt=Date.now();

      if(cloudEnabled){
        await fb.set(fb.ref(db,'rooms/'+roomCode),room);
      }else{
        localStorage.setItem(localKey(roomCode),JSON.stringify(room));
      }

      const u=new URL(location.href);
      u.search='';
      u.searchParams.set('room',roomCode);
      u.searchParams.set('host',hostKey);
      location.href=u.toString();
    }catch(err){
      console.error('host room create failed',err);
      toast(err?.message||'방 생성 중 오류가 생겼어.');
      btn.disabled=false;
      btn.textContent=originalText;
    }
  }

  const style=document.createElement('style');
  style.id='dorang-host-create-style';
  style.textContent=`
    #hostCreateFields{margin-top:12px;padding:12px;border:1.5px solid #e1d5eb;border-radius:16px;background:linear-gradient(145deg,#fffafd,#f8f6ff)}
    #hostCreateFields .field{margin-bottom:9px}
    #hostCreateFields .row{gap:8px}
    #hostCreateFields select{width:100%}
    .host-create-note{margin:-1px 0 10px;font-size:11px}
  `;
  document.head.appendChild(style);

  ensureUI();
  setTimeout(ensureUI,0);
  window.addEventListener('load',ensureUI);
  document.addEventListener('click',createRoomWithHost,true);
})();
