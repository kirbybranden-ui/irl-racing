// Keep display continuity only for the same authenticated identity. The server still authorizes every operation.
export function accessAfterFailure(previous,userId,error){
 return {access:previous?.userId&&previous.userId===userId?previous:null,loading:false,error:error?.message||'Account verification is temporarily unavailable.'};
}
export function identityChanged(previousId,event,session){return event==='SIGNED_OUT'||previousId!==(session?.user?.id||null);}
