// 도랑이네 래더빙고 - 고정 메인방 자동 접속
// 사용자에게는 방/코드를 노출하지 않고 사이트 주소 하나로 바로 접속한다.
(function(){
  const MAIN_ROOM_CODE='DORANGMAIN';
  const MAIN_HOST_STORAGE='dorang_main_host_key_v1';
  const MAIN_EXPIRES_AT=253402300799000; // 9999-12-31: 사실상 영구 유지

  // URL의 예전 room/host 값은 무시하고 내부 고정 메인방을 사용한다.
  roomCode=MAIN_ROOM_CODE;
  hostKey=localStorage.getItem(MAIN_HOST_STORAGE)||'';

  try{
    const clean=new URL(location.href);
    clean.search='';
    if(broadcast) clean.searchParams.set('view','broadcast');
    if(clean.toString()!==location.href) history.replaceState(null,'',clean.toString());
  }catch(e){}

  // 기존 방 만들기/참가 화면은 더 이상 사용자에게 보여주지 않는다.
  const welcome=document.getElementById('welcome');
  if(welcome) welcome.classList.add('hidden');

  const loading=document.createElement('div');
  loading.id='mainAutoLoading';
  loading.innerHTML='<div class="main-auto-card"><div class="main-auto-icon">🐾</div><b>도랑이네 래더빙고</b><span>메인 빙고 연결 중...</span></div>';
  document.body.appendChild(loading);

  const style=document.createElement('style');
  style.id='main-auto-style';
  style.textContent=`
    #welcome{display:none!important}
    #mainAutoLoading{position:fixed;inset:0;display:grid;place-items:center;background:linear-gradient(135deg,#fff7fb,#f4f8ff);z-index:1000}
    #mainAutoLoading.hidden{display:none!important}
    .main-auto-card{min-width:260px;padding:28px 30px;border:1.5px solid #e6d8ea;border-radius:24px;background:#fff;box-shadow:0 18px 45px rgba(164,137,190,.13);text-align:center;color:#695b80}
    .main-auto-icon{font-size:42px;margin-bottom:7px}.main-auto-card b{display:block;font-size:20px}.main-auto-card span{display:block;margin-top:5px;font-size:12px;color:#9288a5}
    .room-code-box,#copyRoomCodeBtn,#leaveBtn{display:none!important}
    .brand .sub{font-size:0!important}.brand .sub #roleText{font-size:12px!important}.brand .sub #expiryText{display:none!important}
  `;
  document.head.appendChild(style);

  const baseShowApp=showApp;
  showApp=function(){
    baseShowApp();
    loading.classList.add('hidden');
  };
  showWelcome=function(){
    if(welcome)welcome.classList.add('hidden');
    if(document.getElementById('mainApp'))document.getElementById('mainApp').classList.add('hidden');
    loading.classList.remove('hidden');
    const msg=loading.querySelector('span');
    if(msg)msg.textContent='메인 빙고 다시 연결 중...';
  };

  async function ensureMainRoom(){
    roomCode=MAIN_ROOM_CODE;
    const stored=localStorage.getItem(MAIN_HOST_STORAGE)||'';
    const candidate=stored||randSecret();

    if(cloudEnabled){
      const ref=fb.ref(db,'rooms/'+MAIN_ROOM_CODE);
      const result=await fb.runTransaction(ref,raw=>{
        if(raw){
          raw.mainRoom=true;
          raw.expiresAt=MAIN_EXPIRES_AT;
          return raw;
        }
        const r=freshRoom({
          title:'도랑이네 래더빙고',
          mode:'bingo',
          teamA:'도랑팀',
          teamB:'남의팀',
          hostKey:candidate
        });
        r.mainRoom=true;
        r.expiresAt=MAIN_EXPIRES_AT;
        r.maleStreakTarget=5;
        r.femaleStreakTarget=3;
        r.logs=[{t:nowTime(),text:'메인 래더빙고 시작.'}];
        return r;
      });
      const room=normalizeRoom(result.snapshot.val());
      if(room?.hostKey===candidate){
        hostKey=candidate;
        localStorage.setItem(MAIN_HOST_STORAGE,candidate);
      }else if(stored&&room?.hostKey===stored){
        hostKey=stored;
      }else{
        hostKey='';
        if(stored)localStorage.removeItem(MAIN_HOST_STORAGE);
      }
      return room;
    }

    let room=readLocalRoom(MAIN_ROOM_CODE);
    if(!room){
      hostKey=candidate;
      localStorage.setItem(MAIN_HOST_STORAGE,candidate);
      room=freshRoom({title:'도랑이네 래더빙고',mode:'bingo',teamA:'도랑팀',teamB:'남의팀',hostKey:candidate});
      room.mainRoom=true;
      room.expiresAt=MAIN_EXPIRES_AT;
      room.maleStreakTarget=5;
      room.femaleStreakTarget=3;
      localStorage.setItem(localKey(MAIN_ROOM_CODE),JSON.stringify(room));
    }else{
      room.mainRoom=true;
      room.expiresAt=MAIN_EXPIRES_AT;
      if(stored&&room.hostKey===stored)hostKey=stored;
      localStorage.setItem(localKey(MAIN_ROOM_CODE),JSON.stringify(room));
    }
    return room;
  }

  const baseConnectRoom=connectRoom;
  connectRoom=async function(){
    try{
      await ensureMainRoom();
      await baseConnectRoom();
    }catch(e){
      console.error('main room connect failed',e);
      const msg=loading.querySelector('span');
      if(msg)msg.textContent='연결에 실패했어. 새로고침해줘.';
      toast('메인 빙고 연결 실패');
    }
  };

  function rootUrl(view){
    const u=new URL(location.href);
    u.search='';u.hash='';
    if(view==='broadcast')u.searchParams.set('view','broadcast');
    return u;
  }

  const copyJoin=document.getElementById('copyJoinBtn');
  if(copyJoin){
    copyJoin.textContent='🔗 사이트 링크 복사';
    copyJoin.addEventListener('click',e=>{
      e.preventDefault();e.stopImmediatePropagation();
      navigator.clipboard.writeText(rootUrl().toString()).then(()=>toast('사이트 링크 복사 완료'));
    },true);
  }

  const copyBroadcast=document.getElementById('copyBroadcastBtn');
  if(copyBroadcast){
    copyBroadcast.addEventListener('click',e=>{
      e.preventDefault();e.stopImmediatePropagation();
      navigator.clipboard.writeText(rootUrl('broadcast').toString()).then(()=>toast('송출 링크 복사 완료'));
    },true);
  }

  const openBroadcastBtn=document.getElementById('openBroadcastBtn');
  if(openBroadcastBtn){
    openBroadcastBtn.addEventListener('click',e=>{
      e.preventDefault();e.stopImmediatePropagation();
      const width=850,height=720;
      const left=Math.max(0,Math.round((screen.availWidth-width)/2));
      const top=Math.max(0,Math.round((screen.availHeight-height)/2));
      const popup=window.open(rootUrl('broadcast').toString(),'dorangMainBroadcast',`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no`);
      if(popup){try{popup.focus();}catch(e){}}else toast('팝업이 차단됐어. 이 사이트의 팝업을 허용해줘.');
    },true);
  }

  const newBoardBtn=document.getElementById('newBoardBtn');
  if(newBoardBtn)newBoardBtn.textContent='🎲 새 경기';
})();