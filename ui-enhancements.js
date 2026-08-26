// 기본 팀명 및 기존 기본방 이름 마이그레이션
(function(){
  const a=$('createA'), b=$('createB');
  if(a && (!a.value || a.value==='BLUE')) a.value='도랑팀';
  if(b && (!b.value || b.value==='PINK')) b.value='남의팀';

  let tries=0;
  const timer=setInterval(async()=>{
    tries++;
    if(typeof currentRoom!=='undefined' && currentRoom){
      if(typeof isHost==='function' && isHost() && currentRoom.teamA==='BLUE' && currentRoom.teamB==='PINK'){
        try{
          await transact(r=>{
            if(r.teamA==='BLUE' && r.teamB==='PINK'){
              r.teamA='도랑팀';
              r.teamB='남의팀';
              logRoom(r,'기본 팀명 변경 → 도랑팀 vs 남의팀.');
            }
          });
        }catch(e){console.warn('team name migration failed',e)}
      }
      clearInterval(timer);
    }else if(tries>30){
      clearInterval(timer);
    }
  },300);
})();
