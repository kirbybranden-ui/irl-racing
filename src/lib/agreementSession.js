// UI continuity only. Supabase RPC/RLS remains the authority for current-version access.
export const agreementReceiptKey='brl-agreement-receipt-v1';
export function createAgreementSession({storage,getSession,readStatus,onChange,legal=false}){
 let state={status:null,error:''},identity,epoch=0,running=false,inFlight=null;
 const publish=next=>{state=next;if(running)onChange(next);};
 const clearReceipt=()=>{try{storage?.removeItem(agreementReceiptKey);}catch{/* Storage may be unavailable. */}};
 function cached(userId){
  try{const receipt=JSON.parse(storage?.getItem(agreementReceiptKey)||'null');return userId&&receipt?.userId===userId&&receipt.accepted===true&&typeof receipt.version==='string'&&receipt.version&&typeof receipt.documentHash==='string'&&receipt.documentHash?receipt:null;}catch{return null;}
 }
 function remember(status){
  if(!status?.accepted||!status.userId){clearReceipt();return;}
  // No tokens, document, signatures, or other members' acceptance history in this cache.
  const {userId,version,documentHash,gamertag,acceptedAt}=status;
  try{storage?.setItem(agreementReceiptKey,JSON.stringify({userId,version,documentHash,gamertag,acceptedAt,accepted:true}));}catch{/* Continue with in-memory status. */}
 }
 function identify(userId,{signedOut=false}={}){
  if(identity===userId)return false;
  const previous=identity;identity=userId;++epoch;inFlight=null;
  // A transient INITIAL_SESSION(null) must never erase the receipt accepted on
  // a previous visit. A real SIGNED_OUT or switch to another signed-in user
  // does invalidate it. A receipt alone never authenticates anybody.
  if(signedOut||(previous&&userId&&previous!==userId))clearReceipt();
  publish({status:!legal?cached(userId):null,error:''});
  return true;
 }
 async function refresh(){
  if(!running)return;
  const bootEpoch=epoch;
  let session;
  try{session=await getSession();}catch(error){if(running&&bootEpoch===epoch&&!state.status?.accepted)publish({status:null,error:error.message});return;}
  // A sign-out/account switch while session lookup was pending must win.
  if(!running||bootEpoch!==epoch)return;
  identify(session?.user?.id||null);
  const ticket=epoch,userId=identity;
  if(inFlight?.epoch===ticket)return inFlight.promise;
  const promise=(async()=>{
   try{
    const next=await Promise.resolve().then(readStatus);
    if(!running||ticket!==epoch)return;
    if((next?.userId||null)!==userId)throw new Error('Your account changed. Please sign in again.');
    remember(next);publish({status:next,error:''});return next;
   }catch(error){
    if(!running||ticket!==epoch)return;
    // A temporary server/network/RPC failure must not sign out a user or
    // turn a verified, previously accepted account into the login form.
    // Keep access continuity while the server is unavailable; protected data
    // still requires Supabase authorization and RLS.
    if(state.status?.accepted&&!/jwt|token.*expired|not authenticated|account changed|invalid.*session/i.test(error.message))return;
    // Do not erase a legitimate receipt on server errors. Only an explicit
    // logout or account switch invalidates locally stored continuity data.
    publish({status:null,error:error.message});
   }finally{if(inFlight?.epoch===ticket)inFlight=null;}
  })();
  inFlight={epoch:ticket,promise};return promise;
 }
 return {
  start(){running=true;return refresh();},
  stop(){running=false;++epoch;inFlight=null;},
  refresh,
  authChanged(event,session){
   if(!running)return false;
   // Supabase can report INITIAL_SESSION(null) while restoring a session.
   // Do not discard a known account during that startup transition.
   if(event!=='SIGNED_OUT'&&!session?.user?.id&&identity)return false;
   const changed=identify(session?.user?.id||null,{signedOut:event==='SIGNED_OUT'});
   // INITIAL_SESSION, SIGNED_IN and TOKEN_REFRESHED for the same account must not blank the app.
   return changed||(!state.status&&event!=='TOKEN_REFRESHED');
  },
  agreementChanged(access){
   if(!running||!access?.agreementRequired||access.userId!==identity)return false;
   ++epoch;inFlight=null;clearReceipt();publish({status:null,error:''});return true;
  },
  recordAcceptance(next){
   if(!running||next?.userId!==identity||next.accepted!==true||!next.version||!next.documentHash)return false;
   ++epoch;inFlight=null;remember(next);publish({status:next,error:''});return true;
  },
  snapshot:()=>state,
 };
}
