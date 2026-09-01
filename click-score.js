// 도랑이네 래더빙고 - 빙고판 숫자 클릭으로 승리 점수 즉시 적용
(function(){
  if(window.__dorangClickScoreLoaded)return;
  window.__dorangClickScoreLoaded=true;

  function bindBoardClicks(){
    const board=document.getElementById('board');
    if(!board || board.dataset.clickScoreBound==='yes')return;
    board.dataset.clickScoreBound='yes';

    board.addEventListener('click',e=>{
      const cell=e.target.closest('.cell');
      if(!cell || !board.contains(cell))return;

      // 연승 보너스/기존 선택 모드가 활성화되어 있으면 기존 클릭 동작을 우선한다.
      if(typeof pending!=='undefined' && pending)return;
      if(typeof broadcast!=='undefined' && broadcast)return;
      if(typeof selectedResult!=='undefined' && selectedResult!=='win')return;

      const cells=[...board.children];
      const idx=cells.indexOf(cell);
      if(idx<0 || !currentRoom?.board?.[idx])return;

      const score=Number(currentRoom.board[idx].score);
      if(!Number.isFinite(score))return;

      const input=document.getElementById('gainScore');
      const apply=document.getElementById('applyResultBtn');
      if(!input || !apply)return;

      input.value=String(score);
      apply.click();
    });
  }

  function decorate(){
    if(typeof broadcast!=='undefined' && broadcast)return;
    const board=document.getElementById('board');
    if(!board)return;
    board.classList.add('click-score-board');
    [...board.querySelectorAll('.cell')].forEach(cell=>{
      if(typeof pending!=='undefined' && pending)return;
      cell.classList.add('score-pickable');
      cell.title='클릭해서 이 점수로 승리 결과 적용';
    });
  }

  const style=document.createElement('style');
  style.id='dorang-click-score-style';
  style.textContent=`
    body:not(.broadcast) .board.click-score-board .cell.score-pickable{cursor:pointer!important;}
    body:not(.broadcast) .board.click-score-board .cell.score-pickable:hover{
      transform:translateY(-2px) scale(1.015)!important;
      outline:2px solid rgba(182,149,255,.34)!important;
      outline-offset:-2px!important;
    }
  `;
  document.head.appendChild(style);

  bindBoardClicks();
  decorate();
  setInterval(()=>{bindBoardClicks();decorate();},500);
})();
