// 도랑이네 래더빙고 - 모드별 상대 칸 탈환 기본값
// 일반 래더빙고: 금지 / 땅따먹기: 허용
(function(){
  if(window.__dorangLandCaptureDefaultLoaded)return;
  window.__dorangLandCaptureDefaultLoaded=true;

  // 새 방 생성 시 선택한 모드에 맞춰 탈환 기본값 적용.
  try{
    const baseFreshRoom=freshRoom;
    freshRoom=function(args){
      const room=baseFreshRoom(args);
      room.capture=args?.mode==='land';
      return room;
    };
  }catch(err){
    console.warn('land capture freshRoom hook failed',err);
  }

  // 방장이 모드를 바꿀 때도 해당 모드의 기본값으로 자동 전환.
  try{
    setMode=async function(mode){
      if(!isHost()||!currentRoom||currentRoom.mode===mode)return;
      await transact(r=>{
        pushHistory(r);
        r.mode=mode;
        r.capture=mode==='land';
        logRoom(r,`게임 모드 변경 → ${mode==='bingo'?'일반 래더빙고':'땅따먹기'} · 상대 칸 탈환 ${r.capture?'허용':'금지'}.`);
      });
      const capture=document.getElementById('settingsCapture');
      if(capture)capture.value=mode==='land'?'yes':'no';
    };
  }catch(err){
    console.warn('land capture setMode hook failed',err);
  }
})();
