// Deduplicate concurrent reads only. No financial/permission response is persisted or used as a write authority.
export function createSharedRead({request,validate=value=>value,timeoutMs=15000,label='Data',onTimeout=()=>{}}){
 let pending=null,generation=0;
 function invalidate(){++generation;pending=null;}
 function read(){
  if(pending)return pending.promise;
  const ticket=generation,controller=new AbortController();
  let timer;
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();onTimeout();reject(new Error(`${label} took too long to load. Please retry. Your saved data has not been changed.`));},timeoutMs);});
  const promise=Promise.race([deadline,Promise.resolve().then(()=>request(controller.signal)).then(value=>{if(ticket!==generation)throw new Error('Your account or data changed while loading. Please retry.');return validate(value);})]).finally(()=>{clearTimeout(timer);if(pending?.promise===promise)pending=null;});
  pending={promise};return promise;
 }
 return {read,invalidate};
}
