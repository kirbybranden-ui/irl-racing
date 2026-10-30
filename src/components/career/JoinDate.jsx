import React, {useState} from "react";
export default function JoinDate({member}) {
 const stamp=member?.created_at;
 if(!stamp)return <span>Join date unavailable</span>;
 const d=new Date(stamp);
 if(Number.isNaN(d.getTime()))return <span>Join date unavailable</span>;
 const label=member.login_kind==="legacy"?"Account imported":"Joined";
 return <span>{label}: <time dateTime={stamp} title={d.toISOString()}>{new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",second:"2-digit",timeZoneName:"short"}).format(d)}</time></span>;
}
export function MemberRegistrationLog({data}) {
 const [search,setSearch]=useState("");
 if(!data.isSuperAdmin)return null;
 const members=[...(data.members||[])].filter(m=>`${m.gamertag} ${m.kind} ${m.status}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
 return <details className="career-card"><summary><strong>Member registration dates</strong></summary><p>Original app-registration timestamps, shown in Eastern league time. Imported legacy accounts show their import date because their earlier join date is not recorded.</p><label>Find a member<input className="career-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Gamertag, application type or status"/></label><div className="career-grid" style={{marginTop:16}}>{members.map(m=><section className="career-card" key={m.user_id}><h3>{m.gamertag}</h3><p>{m.kind} · {m.status}</p><p><JoinDate member={m}/></p></section>)}</div>{!members.length&&<p>No matching members.</p>}</details>;
}
