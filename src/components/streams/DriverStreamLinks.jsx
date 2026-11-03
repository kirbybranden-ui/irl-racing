import React,{useEffect,useState} from 'react';
import {readStreamDirectory,safeStreamLink,streamPlatforms} from '../../lib/memberStreams';
import '../../styles/memberStreams.css';
export default function DriverStreamLinks({driverId,isSelf=false}){
 const [streams,setStreams]=useState([]),[error,setError]=useState('');
 useEffect(()=>{let live=true,sequence=0;async function refresh(){const request=++sequence;try{const rows=await readStreamDirectory();if(live&&request===sequence){setStreams(rows.filter(s=>String(s.driver_id)===String(driverId)));setError('');}}catch(e){if(live&&request===sequence)setError(e.message);}}refresh();window.addEventListener('brl:streams-changed',refresh);window.addEventListener('focus',refresh);const timer=setInterval(refresh,60000);return()=>{live=false;clearInterval(timer);window.removeEventListener('brl:streams-changed',refresh);window.removeEventListener('focus',refresh);};},[driverId]);
 if(!streams.length&&!isSelf)return null;
 return <section className="driver-stream-links"><h3>Watch my stream</h3>{streams.length?<div className="member-stream-actions">{streams.map(s=><a className={`member-stream-link member-stream-link--${s.platform}`} key={s.id} href={safeStreamLink(s.stream_url,s.platform)} target="_blank" rel="noopener noreferrer">{streamPlatforms[s.platform]} ↗</a>)}</div>:<p>No channels published yet.</p>}{isSelf&&<a href="/career#streams">Add or edit my stream links</a>}{error&&isSelf&&<p role="alert">{error}</p>}</section>;
}
