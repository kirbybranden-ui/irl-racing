// One request per resource at a time. A failed/aborted read never becomes a
// successful result and never changes any saved league data.
export function createSharedRead({request,validate=value=>value,timeoutMs=15000,label='Data',onTimeout=()=>{},retries=0,cacheMaxAgeMs=0}){
 let pending=null,generation=0,lastValue,lastSuccessAt=0,hasValue=false;
 function invalidate(){++generation;pending=null;lastValue=undefined;lastSuccessAt=0;hasValue=false;}
 function read(){
  if(cacheMaxAgeMs>0&&hasValue&&Date.now()-lastSuccessAt<cacheMaxAgeMs)return Promise.resolve(lastValue);
  if(pending)return pending.promise;
  const ticket=generation;
  const promise=(async()=>{
   for(let attempt=0;;attempt++){
    const controller=new AbortController();
    let timer;
    try{
     // Start the deadline before invoking the request; always remove the timer.
     const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{
      controller.abort();onTimeout();
      reject(new Error(`${label} took too long to load. Please retry. Your saved data has not been changed.`));
     },timeoutMs);});
     const value=await Promise.race([deadline,Promise.resolve().then(()=>request(controller.signal))]);
     if(ticket!==generation)throw new Error('Your account or data changed while loading. Please retry.');
     const validated=validate(value);
     if(cacheMaxAgeMs>0&&validated!==null&&validated!==undefined){lastValue=validated;lastSuccessAt=Date.now();hasValue=true;}
     return validated;
    }catch(error){
     if(ticket!==generation||attempt>=retries||!(controller.signal.aborted||/timeout|timed out|fetch failed|network|connection|failed to fetch/i.test(error?.message||'')))throw error;
     await new Promise(resolve=>setTimeout(resolve,650*(attempt+1)));
    }finally{clearTimeout(timer);}
   }
  })();
  pending={promise};
  promise.finally(()=>{if(pending?.promise===promise)pending=null;}).catch(()=>{});
  return promise;
 }
 return {read,invalidate};
}
