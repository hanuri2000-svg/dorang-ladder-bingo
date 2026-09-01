// 도랑이네 래더빙고 - 새 방 기본값: 5x5 / 숫자 1~30
(function(){
  if(window.__dorangDefaultRoomSettingsLoaded)return;
  window.__dorangDefaultRoomSettingsLoaded=true;

  const baseFreshRoom=freshRoom;
  freshRoom=function(args){
    const room=baseFreshRoom(args);
    const size=5;
    const minScore=1;
    const maxScore=30;
    const scores=makeScoreRange(minScore,maxScore);

    room.size=size;
    room.minScore=minScore;
    room.maxScore=maxScore;
    room.scores=scores;
    room.board=makeBoard(size,scores);
    return room;
  };
})();
