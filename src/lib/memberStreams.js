import {supabase} from './supabase';
export const streamPlatforms={twitch:'Twitch',youtube:'YouTube',kick:'Kick'};
export function safeStreamLink(value,platform){try{const u=new URL(value);const allowed={twitch:['twitch.tv','www.twitch.tv'],youtube:['youtube.com','www.youtube.com','m.youtube.com','youtu.be'],kick:['kick.com','www.kick.com']};return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&allowed[platform]?.includes(u.hostname)?u.href:'';}catch{return '';}}
export async function readStreamDirectory(){const {data,error}=await supabase.rpc('brl_stream_directory');if(error)throw new Error(error.message);return (Array.isArray(data)?data:[]).filter(s=>safeStreamLink(s.stream_url,s.platform));}
export async function readMyStreams(){const {data,error}=await supabase.rpc('brl_my_streams');if(error)throw new Error(error.message);return data;}
export async function saveMyStreams(payload){const {data,error}=await supabase.rpc('brl_save_my_streams',{payload});if(error)throw new Error(error.message);window.dispatchEvent(new Event('brl:streams-changed'));return data;}
