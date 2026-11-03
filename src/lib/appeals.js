import {supabase} from './supabase';
export const appealLabels={intake_review:'Verifying original ruling',late_review:'Late filing — exception review',under_review:'Panel review',awaiting_information:'More information requested',voting:'Evidence locked — voting',decided:'Decision published',withdrawn:'Withdrawn'};
export function safeAppealLink(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')?u.href:'';}catch{return '';}}
export async function readAppeals(){const {data,error}=await supabase.rpc('brl_appeal_read');if(error)throw new Error(error.message);return data;}
export async function appealAction(action,payload){const {data,error}=await supabase.rpc('brl_appeal_action',{action,payload});if(error)throw new Error(error.message);window.dispatchEvent(new Event('brl:appeals-changed'));return data;}
export async function uploadAppealEvidence(data,c,file,note){
 const allowed=['video/mp4','video/webm','image/jpeg','image/png','image/webp','application/pdf'];
 if(!allowed.includes(file.type)||file.size>52428800||!file.size)throw new Error('Choose an MP4, WebM, PNG, JPEG, WebP or PDF up to 50 MB.');
 const ext={ 'video/mp4':'mp4','video/webm':'webm','image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'}[file.type];
 const path=`${data.userId}/${c.id}/${crypto.randomUUID()}.${ext}`;
 const {error}=await supabase.storage.from('brl-appeal-evidence').upload(path,file,{upsert:false,contentType:file.type});
 if(error)throw new Error(error.message);
 try{return await appealAction('file_evidence',{id:c.id,path,note});}catch(error){throw new Error(`The file uploaded but was not attached: ${error.message} Refresh the case before retrying. Unattached files are not visible to reviewers.`);}
}
export async function openAppealFile(path){const {data,error}=await supabase.storage.from('brl-appeal-evidence').createSignedUrl(path,120);if(error)throw new Error(error.message);return data.signedUrl;}
