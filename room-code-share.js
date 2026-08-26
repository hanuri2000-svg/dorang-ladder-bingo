// 방 코드는 화면에 표시하지 않고 방장만 버튼으로 복사해서 공유한다.
(function(){
  const btn=document.getElementById('copyRoomCodeBtn');
  if(!btn)return;
  btn.addEventListener('click',async()=>{
    if(!roomCode){toast('복사할 방 코드가 없어.');return;}
    try{
      await navigator.clipboard.writeText(roomCode);
      toast(`방 코드 ${roomCode} 복사 완료!`);
    }catch(e){
      console.warn('room code copy failed',e);
      toast(`방 코드: ${roomCode}`);
    }
  });
})();
