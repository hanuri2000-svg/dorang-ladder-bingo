const LOCAL_ROOM_PREFIX='ladder_bingo_room_v42_';
const LOCAL_CLIENT_KEY='ladder_bingo_local_client_v42';
const ROOM_TTL_DAYS=7;
const ROOM_TTL_MS=ROOM_TTL_DAYS*24*60*60*1000;
const CLEANUP_CHECK_KEY='ladder_bingo_cleanup_last_v44';
const CLEANUP_INTERVAL_MS=6*60*60*1000; // 같은 브라우저에서는 최대 6시간마다 한 번 정리
const params=new URLSearchParams(location.search);
let roomCode=(params.get('room')||'').toUpperCase();
let hostKey=params.get('host')||'';
const broadcast=params.get('view')==='broadcast';

let fb=null, db=null, auth=null, roomRef=null, unsubscribe=null;
let cloudEnabled=false, currentRoom=null, pending=null, selectedResult='win', createMode='bingo';
let selfJoinTeam='A';

const $=id=>document.getElementById(id);
const deepClone=o=>JSON.parse(JSON.stringify(o));
const nowTime=()=>new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
const randCode=(n=6)=>{
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s=''; crypto.getRandomValues(new Uint32Array(n)).forEach(v=>s+=chars[v%chars.length]); return s;
};
const randSecret=()=>crypto.randomUUID().replaceAll('-','').slice(0,20);
const splitNames=v=>v.split(/[\n,，;；\t]+|\s{2,}/).map(x=>x.trim()).filter(Boolean);
const toast=msg=>{const t=$('toast');t.textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),1800)};
const makeScoreRange=(min,max)=>{
  min=Math.trunc(Number(min)); max=Math.trunc(Number(max));
  if(!Number.isFinite(min)||!Number.isFinite(max)) return [];
  if(min>max)[min,max]=[max,min];
  return Array.from({length:max-min+1},(_,i)=>min+i);
};
const isHost=()=>!!currentRoom && !!hostKey && currentRoom.hostKey===hostKey;
const localClientId=()=>{
  let id=sessionStorage.getItem(LOCAL_CLIENT_KEY);
  if(!id){id='local-'+crypto.randomUUID();sessionStorage.setItem(LOCAL_CLIENT_KEY,id);}
  return id;
};
const myUid=()=>auth?.currentUser?.uid||localClientId();
const myPlayer=()=>currentRoom?.players?.find(p=>p.clientId && p.clientId===myUid())||null;

function showSelfJoin(){
  if(!currentRoom||isHost()||broadcast)return;
  const mine=myPlayer();
  if(mine){$('joinPlayerModal').classList.add('hidden');return;}
  $('selfJoinTeamA').textContent=currentRoom.teamA;
  $('selfJoinTeamB').textContent=currentRoom.teamB;
  $('joinPlayerModal').classList.remove('hidden');
  setTimeout(()=>$('selfJoinName').focus(),50);
}
function hideSelfJoin(){$('joinPlayerModal').classList.add('hidden')}
function setSelfJoinTeam(team){
  selfJoinTeam=team;
  $('selfJoinTeamA').classList.toggle('active',team==='A');
  $('selfJoinTeamB').classList.toggle('active',team==='B');
}
async function submitSelfJoin(){
  if(!currentRoom||isHost()||broadcast)return;
  const name=$('selfJoinName').value.trim();
  if(!name){toast('이름을 입력해줘.');return;}
  const uid=myUid();
  if(!uid){toast('로그인 정보를 확인 중이야. 잠시 후 다시 해줘.');return;}
  let rejected=false;
  await transact(r=>{
    const sameUid=r.players.find(p=>p.clientId===uid);
    if(sameUid){
      sameUid.name=name;
      sameUid.team=selfJoinTeam;
      logRoom(r,`${sameUid.name} 참가 정보 변경.`);
      return;
    }
    const sameName=r.players.find(p=>String(p.name).toLowerCase()===name.toLowerCase());
    if(sameName){
      if(sameName.clientId && sameName.clientId!==uid){
        rejected=true; return;
      }
      sameName.clientId=uid;
      logRoom(r,`${sameName.name} 참가 접속.`);
      return;
    }
    r.players.push({name,team:selfJoinTeam,clientId:uid,wins:0,losses:0,streak:0,best:0,lands:0});
    logRoom(r,`${name} 참가 · ${selfJoinTeam==='A'?r.teamA:r.teamB}.`);
  });
  if(rejected){toast('이미 다른 참가자가 사용 중인 이름이야.');return;}
  hideSelfJoin();
  $('selfJoinName').value='';
  render();
}
function makeBoard(size,scores){
  const needed=size*size;
  const unique=[...new Set(scores.map(Number).filter(Number.isFinite))];
  if(unique.length<needed){
    throw new Error(`보드 ${size}×${size}에는 서로 다른 숫자가 ${needed}개 필요해. 현재 점수 후보는 ${unique.length}개야.`);
  }
  const pool=[...unique];
  for(let i=pool.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [pool[i],pool[j]]=[pool[j],pool[i]];
  }
  return pool.slice(0,needed).map(score=>({score,owner:null,player:''}));
}
function freshRoom({title,mode,teamA,teamB,hostKey}){
  const size=7,minScore=8,maxScore=60,scores=makeScoreRange(minScore,maxScore);
  return {
    version:4.4,title,mode,teamA,teamB,size,minScore,maxScore,scores,capture:false,streakTarget:3,hostKey,
    board:makeBoard(size,scores),players:[],logs:[{t:nowTime(),text:'방이 생성됐어.'}],bonus:{A:0,B:0},history:[],
    createdAt:Date.now(),updatedAt:Date.now(),expiresAt:Date.now()+ROOM_TTL_MS
  };
}
function historySnapshot(r){
  const s=deepClone(r); delete s.history; return s;
}
function pushHistory(r){
  r.history=Array.isArray(r.history)?r.history:[];
  r.history.push(historySnapshot(r));
  if(r.history.length>15)r.history.shift();
}
function logRoom(r,text){
  r.logs=Array.isArray(r.logs)?r.logs:[];
  r.logs.unshift({t:nowTime(),text});
  r.logs=r.logs.slice(0,80);
  r.updatedAt=Date.now();
}
function normalizeRoom(r){
  if(!r)return null;
  r.players=Array.isArray(r.players)?r.players.map(p=>({...p,clientId:p.clientId||''})):[];
  r.board=Array.isArray(r.board)?r.board:[];
  r.logs=Array.isArray(r.logs)?r.logs:[];
  r.history=Array.isArray(r.history)?r.history:[];
  r.bonus=r.bonus||{A:0,B:0};
  r.capture=!!r.capture;
  r.streakTarget=Number(r.streakTarget)||3;
  if(!Number.isFinite(Number(r.minScore))) r.minScore=8;
  if(!Number.isFinite(Number(r.maxScore))) r.maxScore=60;
  r.minScore=Math.trunc(Number(r.minScore)); r.maxScore=Math.trunc(Number(r.maxScore));
  if(r.minScore>r.maxScore)[r.minScore,r.maxScore]=[r.maxScore,r.minScore];
  r.scores=makeScoreRange(r.minScore,r.maxScore);
  const baseCreated=Number(r.createdAt)||Date.now();
  r.createdAt=baseCreated;
  if(!Number.isFinite(Number(r.expiresAt))) r.expiresAt=baseCreated+ROOM_TTL_MS;
  return r;
}
function bingoLines(r,team){
  const n=r.size,b=r.board,lines=[];
  for(let y=0;y<n;y++)lines.push(Array.from({length:n},(_,x)=>y*n+x));
  for(let x=0;x<n;x++)lines.push(Array.from({length:n},(_,y)=>y*n+x));
  lines.push(Array.from({length:n},(_,i)=>i*n+i));
  lines.push(Array.from({length:n},(_,i)=>i*n+(n-1-i)));
  const won=lines.filter(line=>line.every(i=>b[i]?.owner===team));
  return {count:won.length,indexes:new Set(won.flat())};
}
function landStats(r,team){
  const count=r.board.filter(c=>c.owner===team).length,total=r.board.length||1;
  return {count,rate:(count/total*100).toFixed(1)};
}
async function initFirebase(){
  if(location.protocol==='file:'){
    cloudEnabled=false;
    cleanupExpiredLocalRooms();
    setConn(false,'로컬 테스트 모드');
    return false;
  }
  try{
    const config={"apiKey":"AIzaSyCrtuTyDr4nkFu_gl6qw6BiT3xS7ngGOG0","authDomain":"ladder-bingo-multi.firebaseapp.com","databaseURL":"https://ladder-bingo-multi-default-rtdb.asia-southeast1.firebasedatabase.app","projectId":"ladder-bingo-multi","storageBucket":"ladder-bingo-multi.firebasestorage.app","messagingSenderId":"1029029860880","appId":"1:1029029860880:web:5e98fac7fda6290eae9c95"};
    const appMod=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js');
    const dbMod=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js');
    const authMod=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js');
    const app=appMod.initializeApp(config);
    db=dbMod.getDatabase(app);
    auth=authMod.getAuth(app);
    fb={...dbMod,...authMod};
    await authMod.signInAnonymously(auth);
    cloudEnabled=true;
    setConn(true,'Firebase 실시간 서버');
    await cleanupExpiredRooms();
    return true;
  }catch(e){
    console.error('Firebase init failed:',e);
    cloudEnabled=false;
    const code=e?.code||e?.name||'unknown';
    const message=e?.message||String(e)||'알 수 없는 오류';
    setConn(false,`연결 실패 · ${code}`);
    if($('connText')) $('connText').title=message;
    toast(`Firebase 오류: ${code}`);
    const box=document.querySelector('.setup-note');
    if(box){
      let detail=document.getElementById('firebaseErrorDetail');
      if(!detail){
        detail=document.createElement('div');
        detail.id='firebaseErrorDetail';
        detail.style.cssText='margin-top:10px;padding:10px;border-radius:10px;background:#fff1f2;color:#9f1239;font-weight:700;word-break:break-word';
        box.appendChild(detail);
      }
      detail.textContent=`Firebase 연결 오류: ${code} · ${message}`;
    }
    return false;
  }
}
function setConn(ok,text){
  $('connText').textContent=text;
  $('connDot').className='dot '+(ok?'online':'offline');
}
async function cleanupExpiredRooms(force=false){
  if(!cloudEnabled||!fb||!db)return;
  const now=Date.now();
  const last=Number(localStorage.getItem(CLEANUP_CHECK_KEY)||0);
  if(!force && now-last<CLEANUP_INTERVAL_MS)return;
  localStorage.setItem(CLEANUP_CHECK_KEY,String(now));
  try{
    const roomsRoot=fb.ref(db,'rooms');
    const snap=await fb.get(roomsRoot);
    if(!snap.exists())return;
    const updates={};
    let removed=0;
    snap.forEach(child=>{
      const room=normalizeRoom(child.val());
      const expires=Number(room?.expiresAt)||0;
      if(expires && expires<=now){
        updates[child.key]=null;
        removed++;
      }
    });
    if(removed>0){
      await fb.update(roomsRoot,updates);
      console.log(`Expired rooms cleaned: ${removed}`);
    }
  }catch(e){
    console.warn('Expired room cleanup failed:',e);
  }
}

function cleanupExpiredLocalRooms(){
  const now=Date.now();
  const remove=[];
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(!key||!key.startsWith(LOCAL_ROOM_PREFIX))continue;
    try{
      const room=normalizeRoom(JSON.parse(localStorage.getItem(key)));
      if(Number(room?.expiresAt)&&Number(room.expiresAt)<=now) remove.push(key);
    }catch{}
  }
  remove.forEach(k=>localStorage.removeItem(k));
}

async function readCloudRoom(code){
  const r=fb.ref(db,'rooms/'+code);
  const snap=await fb.get(r);
  if(!snap.exists()) return null;
  const room=normalizeRoom(snap.val());
  if(Number(room.expiresAt)<=Date.now()){
    try{ await fb.remove(r); }catch{}
    return null;
  }
  return room;
}
function localKey(code){return LOCAL_ROOM_PREFIX+code}
function readLocalRoom(code){
  try{
    const key=localKey(code);
    const raw=localStorage.getItem(key);
    if(!raw)return null;
    const room=normalizeRoom(JSON.parse(raw));
    if(Number(room.expiresAt)<=Date.now()){
      localStorage.removeItem(key);
      return null;
    }
    return room;
  }catch{return null}
}
async function createRoom(){
  const title=$('createTitle').value.trim()||'도랑이네 래더빙고';
  const teamA=$('createA').value.trim()||'BLUE',teamB=$('createB').value.trim()||'PINK';
  roomCode=randCode(); hostKey=randSecret();
  let room;
  try{
    room=freshRoom({title,mode:createMode,teamA,teamB,hostKey});
  }catch(e){
    toast(e.message||'보드 숫자 생성 오류');
    return;
  }
  if(cloudEnabled){
    await fb.set(fb.ref(db,'rooms/'+roomCode),room);
  }else{
    localStorage.setItem(localKey(roomCode),JSON.stringify(room));
  }
  const u=new URL(location.href);u.search='';u.searchParams.set('room',roomCode);u.searchParams.set('host',hostKey);location.href=u.toString();
}
async function joinRoom(){
  const code=$('joinCode').value.trim().toUpperCase();
  if(!code)return;
  let room=cloudEnabled?await readCloudRoom(code):readLocalRoom(code);
  if(!room){toast('해당 방을 찾지 못했어.');return}
  const u=new URL(location.href);u.search='';u.searchParams.set('room',code);location.href=u.toString();
}
async function connectRoom(){
  if(!roomCode)return;
  if(cloudEnabled){
    roomRef=fb.ref(db,'rooms/'+roomCode);
    const existing=await fb.get(roomRef);
    if(!existing.exists()){toast('방을 찾지 못했어.');showWelcome();return}
    unsubscribe=fb.onValue(roomRef,async s=>{
      if(!s.exists()){toast('방이 삭제됐어.');showWelcome();return}
      currentRoom=normalizeRoom(s.val());
      if(Number(currentRoom.expiresAt)<=Date.now()){
        try{ await fb.remove(roomRef); }catch{}
        toast('이 방은 7일이 지나 자동 삭제됐어.');
        showWelcome();
        return;
      }
      render();
      showSelfJoin();
    });
  }else{
    currentRoom=readLocalRoom(roomCode);
    if(!currentRoom){toast('이 PC에 해당 방이 없어.');showWelcome();return}
    window.addEventListener('storage',e=>{
      if(e.key===localKey(roomCode) && e.newValue){
        currentRoom=normalizeRoom(JSON.parse(e.newValue));
        render();
        showSelfJoin();
      }
    });
    render();
    showSelfJoin();
  }
}
async function transact(mutator){
  if(!currentRoom)return;
  if(cloudEnabled && roomRef){
    const res=await fb.runTransaction(roomRef,raw=>{
      if(!raw)return raw;
      const r=normalizeRoom(raw);
      mutator(r);
      return r;
    });
    if(res.committed)currentRoom=normalizeRoom(res.snapshot.val());
  }else{
    const r=normalizeRoom(readLocalRoom(roomCode));
    if(!r)return;
    mutator(r);
    localStorage.setItem(localKey(roomCode),JSON.stringify(r));
    currentRoom=r;
    render();
  }
}
function showWelcome(){
  $('welcome').classList.remove('hidden');$('mainApp').classList.add('hidden');
}
function showApp(){
  $('welcome').classList.add('hidden');$('mainApp').classList.remove('hidden');
}
