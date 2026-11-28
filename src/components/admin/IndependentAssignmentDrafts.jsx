import React, {useEffect,useState} from 'react';
export default function IndependentAssignmentDrafts({supabase}) {
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [form,setForm]=useState({driver_user:'',mode:'temporary',manufacturer:'Toyota',car_number:'',intended_team_name:'',bypass_requested:true,reserve_owner_points:true,notes:''});
 const change=(key,value)=>setForm(f=>({...f,[key]:value}));
 const rpc=async(action,payload={})=>{const r=await supabase.rpc('brl_independent_draft_action',{p_action:action,p_payload:payload});if(r.error)throw r.error;return r.data;};
 const load=async()=>setData(await rpc('read'));
 useEffect(()=>{let live=true;rpc('read').then(x=>{if(live)setData(x)}).catch(e=>{if(live)setError(e.message)});return()=>{live=false};},[supabase]);
 const run=async(action,payload)=>{setBusy(true);setError('');try{await rpc(action,payload);await load();if(action==='create')change('driver_user','');}catch(e){setError(e.message||String(e));}finally{setBusy(false);}};
 return <section style={{border:'1px solid #ddd',borderRadius:16,padding:16,marginBottom:16,background:'#fff',color:'#111827'}}>
 <h3>Independent assignments — draft preview</h3><p>Drafts only. No race eligibility, number reservation, salary or points changes are made. A proposed number is not a confirmed lease.</p>
 {error&&<p role="alert">{error}</p>}
 <button type="button" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await load();}catch(e){setError(e.message||String(e));}finally{setBusy(false);}}}>Refresh assignments</button>
 {data&&<><form onSubmit={e=>{e.preventDefault();run('create',{...form,car_number:Number(form.car_number)});}} style={{display:'grid',gap:10}}>
 <label>Approved driver <select required value={form.driver_user} onChange={e=>change('driver_user',e.target.value)}><option value="">Select driver</option>{data.drivers.map(d=><option key={d.user_id} value={d.user_id}>{d.gamertag}</option>)}</select></label>
 <label>Assignment type <select value={form.mode} onChange={e=>change('mode',e.target.value)}><option value="temporary">Temporary independent</option><option value="permanent">Permanent independent</option></select></label>
 <label>Manufacturer <select value={form.manufacturer} onChange={e=>change('manufacturer',e.target.value)}>{['Toyota','Ford','Chevrolet'].map(x=><option key={x}>{x}</option>)}</select></label>
 <label>Proposed car number <input required type="number" min="1" max="99" step="1" value={form.car_number} onChange={e=>change('car_number',e.target.value)}/></label>
 {form.mode==='temporary'&&<><label>Future team (optional) <input value={form.intended_team_name} onChange={e=>change('intended_team_name',e.target.value)} placeholder="Unknown / pending placement"/></label><label><input type="checkbox" checked={form.bypass_requested} onChange={e=>change('bypass_requested',e.target.checked)}/> Request contract bypass</label><label><input type="checkbox" checked={form.reserve_owner_points} onChange={e=>change('reserve_owner_points',e.target.checked)}/> Reserve eligible owner points</label></>}
 <label>Notes <textarea value={form.notes} onChange={e=>change('notes',e.target.value)}/></label><button disabled={busy} type="submit">Save assignment draft</button></form>
 <h4>Season assignments</h4>{data.assignments.length===0&&<p>No assignments yet.</p>}{data.assignments.map(a=><div key={a.id} style={{borderTop:'1px solid #ddd',padding:'10px 0'}}><strong>{a.gamertag}</strong> · #{a.car_number} · {a.mode} · {a.status}<div>{a.mode==='permanent'?'Permanent independent':(a.intended_team_name||'Pending placement')}</div>{a.status==='draft'&&<button disabled={busy} onClick={()=>{if(window.confirm('Cancel this draft?'))run('cancel',{id:a.id});}}>Cancel draft</button>}</div>)}</>}
 </section>;
}
