import React,{useEffect,useState} from 'react';
import {readMyStreams,saveMyStreams} from '../../lib/memberStreams';
import '../../styles/memberStreams.css';
const blank={twitchUrl:'',youtubeUrl:'',kickUrl:'',description:'',isPublished:false};
export default function MemberStreamSettings(){
 const [form,setForm]=useState(blank),[profile,setProfile]=useState(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{let live=true;readMyStreams().then(p=>{if(live){setProfile(p);setForm({...blank,...p});}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[]);
 const update=(name,value)=>{setForm(p=>({...p,[name]:value}));setMessage('');};
 return <section className="member-stream-settings"><h2>My stream links</h2><p>Link your public channels once. When published, the same links appear on your driver profile and the league streaming page.</p>{loading?<p role="status">Loading your stream settings…</p>:profile?<form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');setMessage('');try{const next=await saveMyStreams({twitchUrl:form.twitchUrl,youtubeUrl:form.youtubeUrl,kickUrl:form.kickUrl,description:form.description,isPublished:form.isPublished});setProfile(next);setForm({...blank,...next});setMessage(next.isPublished?(next.eligible&&next.hasDriverProfile?'Saved. Your driver profile and the streaming page now use these links.':'Saved. Your links will appear after approval and an active driver profile.'): 'Saved. Your member stream links are not published.');}catch(e){setError(e.message);}finally{setBusy(false);}}}>
 <p>Saving for <strong>{profile.gamertag}</strong>. Your identity, team and car number are linked automatically.</p>
 {[['twitchUrl','Twitch channel','https://www.twitch.tv/yourchannel'],['youtubeUrl','YouTube channel or live video','https://www.youtube.com/@yourchannel'],['kickUrl','Kick channel','https://kick.com/yourchannel']].map(([name,label,placeholder])=><label key={name}>{label}<input type="text" inputMode="url" autoComplete="url" maxLength={500} value={form[name]} placeholder={placeholder} onChange={e=>update(name,e.target.value)}/></label>)}
 <label>Stream description <span>({form.description.length}/160)</span><textarea maxLength={160} value={form.description} onChange={e=>update('description',e.target.value)} placeholder="Driver POV, race-night streams, or what viewers can expect."/></label>
 <label className="member-stream-check"><input type="checkbox" checked={form.isPublished} onChange={e=>update('isPublished',e.target.checked)}/>Show my channels on my driver profile and the streaming page.</label>
 <p className="member-stream-muted">Use channels you own or are authorized to share. Share public links only—never stream keys, dashboard links or passwords. Saving a channel does not mark it live.</p>
 {!profile.hasDriverProfile&&<p>Your links stay saved here until an active driver profile is available.</p>}
 <div className="member-stream-actions"><button disabled={busy}>{busy?'Saving…':'Save stream links'}</button><a href="/streams">View league streams</a></div>
 </form>:null}{error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}</section>;
}
