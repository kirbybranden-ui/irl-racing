import {useEffect} from 'react';
import {labelMobileTable} from '../../lib/mobileTableFlow';
export default function MobileTableFlow(){
  useEffect(()=>{
    const root=document.getElementById('root');if(!root)return;
    let frame=0,disposed=false;
    const pending=new Set();
    const enqueue=node=>{
      if(node.nodeType!==1&&node.nodeType!==3)return;
      const element=node.nodeType===1?node:node.parentElement;
      if(!element)return;
      const table=element.closest('table');if(table)pending.add(table);
      element.querySelectorAll?.('table').forEach(t=>pending.add(t));
    };
    const flush=()=>{frame=0;if(disposed)return;for(const table of pending)if(root.contains(table))labelMobileTable(table);pending.clear();};
    const schedule=()=>{if(!frame&&pending.size)frame=requestAnimationFrame(flush);};
    enqueue(root);flush();
    const observer=new MutationObserver(records=>{
      for(const record of records){enqueue(record.target);record.addedNodes.forEach(enqueue);}schedule();
    });
    // No attribute observation: our own labels cannot cause a refresh loop.
    observer.observe(root,{subtree:true,childList:true,characterData:true});
    return()=>{disposed=true;observer.disconnect();if(frame)cancelAnimationFrame(frame);pending.clear();};
  },[]);
  return null;
}
