// 도랑이네 래더빙고 - 보너스 UI를 치킨으로 표시
(function(){
  if(window.__dorangChickenUiLoaded)return;
  window.__dorangChickenUiLoaded=true;

  let applying=false;

  function replaceText(root){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      if(!node.nodeValue||!node.nodeValue.includes('보너스'))return;
      const next=node.nodeValue
        .replaceAll('연승 보너스','연승 치킨')
        .replaceAll('보너스 점령권','치킨 점령권')
        .replaceAll('보너스로','치킨으로')
        .replaceAll('보너스','치킨');
      if(next!==node.nodeValue)node.nodeValue=next;
    });
  }

  function apply(){
    if(applying)return;
    applying=true;
    try{
      const a=document.getElementById('bonusA');
      const b=document.getElementById('bonusB');
      [a,b].forEach(counter=>{
        const span=counter?.parentElement;
        if(!span)return;
        replaceText(span);
        if(!span.textContent.includes('🍗'))span.insertAdjacentText('afterbegin','🍗 ');
      });

      const btnA=document.getElementById('useBonusA');
      const btnB=document.getElementById('useBonusB');
      if(btnA){
        const desired=`🍗 ${currentRoom?.teamA||'도랑팀'} 치킨`;
        if(btnA.textContent!==desired)btnA.textContent=desired;
      }
      if(btnB){
        const desired=`🍗 ${currentRoom?.teamB||'남의팀'} 치킨`;
        if(btnB.textContent!==desired)btnB.textContent=desired;
      }

      replaceText(document.getElementById('pendingStatus'));
      replaceText(document.getElementById('log'));
      document.querySelectorAll('#board .owner').forEach(replaceText);
    }finally{
      applying=false;
    }
  }

  const style=document.createElement('style');
  style.id='dorang-chicken-ui-style';
  style.textContent=`
    .bonusbox span{font-weight:800!important}
    #useBonusA,#useBonusB{font-weight:900!important}
  `;
  document.head.appendChild(style);

  const observer=new MutationObserver(()=>requestAnimationFrame(apply));
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  apply();
  setTimeout(apply,0);
  setInterval(apply,900);
})();