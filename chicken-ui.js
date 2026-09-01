// 도랑이네 래더빙고 - 보너스 UI를 치킨으로 표시
(function(){
  if(window.__dorangChickenUiLoaded)return;
  window.__dorangChickenUiLoaded=true;

  function replaceText(root){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      if(!node.nodeValue||!node.nodeValue.includes('보너스'))return;
      node.nodeValue=node.nodeValue
        .replaceAll('연승 보너스','연승 치킨')
        .replaceAll('보너스 점령권','치킨 점령권')
        .replaceAll('보너스로','치킨으로')
        .replaceAll('보너스','치킨');
    });
  }

  function apply(){
    const a=document.getElementById('bonusA');
    const b=document.getElementById('bonusB');
    if(a?.parentElement){
      const span=a.parentElement;
      if(!span.querySelector('.chicken-icon'))span.insertAdjacentHTML('afterbegin','<span class="chicken-icon" aria-hidden="true">🍗</span> ');
      replaceText(span);
    }
    if(b?.parentElement){
      const span=b.parentElement;
      if(!span.querySelector('.chicken-icon'))span.insertAdjacentHTML('afterbegin','<span class="chicken-icon" aria-hidden="true">🍗</span> ');
      replaceText(span);
    }

    const btnA=document.getElementById('useBonusA');
    const btnB=document.getElementById('useBonusB');
    if(btnA){
      const team=(currentRoom?.teamA||'도랑팀');
      btnA.textContent=`🍗 ${team} 치킨`;
    }
    if(btnB){
      const team=(currentRoom?.teamB||'남의팀');
      btnB.textContent=`🍗 ${team} 치킨`;
    }

    replaceText(document.getElementById('pendingStatus'));
    replaceText(document.getElementById('log'));
    document.querySelectorAll('#board .owner').forEach(replaceText);
  }

  const style=document.createElement('style');
  style.id='dorang-chicken-ui-style';
  style.textContent=`
    .bonusbox .chicken-icon{font-size:14px!important;line-height:1!important;vertical-align:-1px!important}
    #useBonusA,#useBonusB{font-weight:900!important}
  `;
  document.head.appendChild(style);

  const observer=new MutationObserver(()=>apply());
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  apply();
  setTimeout(apply,0);
  setInterval(apply,700);
})();