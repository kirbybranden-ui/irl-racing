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
 function identify(userId){
  if(identity===userId)return false;
  const previous=identity;identity=userId;++epoch;inFlight=null;
  if(previous!==undefined)clearReceipt();
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
    if(state.status?.accepted&&!/jwt|token.*expired|not authenticated|account changed|invalid.*session/i.test(error.message))return;
    clearReceipt();publish({status:null,error:error.message});
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
   const changed=identify(session?.user?.id||null);
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
