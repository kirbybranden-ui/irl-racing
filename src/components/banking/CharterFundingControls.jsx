import React, {useEffect, useState} from 'react';
import {bankMoney as money,bankCall} from '../../lib/banking';
import {getTeamFullName} from '../../data/teams';

function CharterRow({charter, roster, busy, run}) {
  const [team,setTeam]=useState(charter.team||'');
  const [teamTitle,setTeamTitle]=useState(Boolean(charter.team_champion));
  const [driverTitle,setDriverTitle]=useState(Boolean(charter.driver_champion));
  useEffect(()=>{setTeam(charter.team||'');setTeamTitle(Boolean(charter.team_champion));setDriverTitle(Boolean(charter.driver_champion));},[charter.team,charter.team_champion,charter.driver_champion]);
  const teams=[...new Set(roster.filter(d=>!d.retired&&d.manufacturer===charter.manufacturer).map(d=>d.team))].filter(t=>t&&!['Independent','IND'].includes(t));
  return <form onSubmit={e=>{e.preventDefault();run(()=>bankCall('assign_charter',{manufacturer_value:charter.manufacturer,slot_value:charter.slot,team_value:team,team_title:teamTitle,driver_title:driverTitle}),'Charter funding prepared.');}}>
    <h3>{charter.manufacturer} · {charter.tier} · {charter.capacity} seats</h3>
    <div className="bank-fields">
      <label>Team<select value={team} onChange={e=>{setTeam(e.target.value);setTeamTitle(false);setDriverTitle(false);}}><option value="">Vacant — allocation reserved</option>{teams.map(t=><option key={t} value={t}>{getTeamFullName(t)}</option>)}</select></label>
      <label>Defending team champion<select disabled={!team} value={teamTitle?'yes':'no'} onChange={e=>setTeamTitle(e.target.value==='yes')}><option value="no">No</option><option value="yes">Yes · $75,000 premium</option></select></label>
      <label>Defending driver champion's team<select disabled={!team} value={driverTitle?'yes':'no'} onChange={e=>setDriverTitle(e.target.value==='yes')}><option value="no">No</option><option value="yes">Yes · $50,000 premium</option></select></label>
    </div>
    <p>{charter.filledSeats||0} of {charter.capacity} seats filled. Championship premiums apply to this funding season only.</p>
    <button disabled={busy}>Save charter</button>
    {charter.fundedFunding!=null&&Number(charter.plannedFunding)>Number(charter.fundedFunding)&&<div><p>Already funded: {money(charter.fundedFunding)}. Revised agreement: {money(charter.plannedFunding)}. Applying the difference transfers the increase from the manufacturer and deducts funding tax.</p><button type="button" disabled={busy} onClick={()=>run(()=>bankCall('apply_charter_funding',{team_value:charter.team}),'Charter funding increase posted once.')}>Apply funding difference</button></div>}
  </form>;
}
export default function CharterFundingControls({charters=[],roster=[],busy,run}) {
  return <section aria-label="Manufacturer charter funding"><h3>Charters and defending champions</h3><p>Each manufacturer has two premier charters, one standard charter and one independent charter. Leave Ford's second premier charter vacant. Assign Ford's confirmed standard team here; unknown teams receive no automatic charter assignment.</p>
    {!charters.length&&<p>Use “Prepare current-season accounts” to load the charter list.</p>}
    {charters.map(c=><CharterRow key={`${c.season_id}:${c.manufacturer}:${c.slot}`} charter={c} roster={roster} busy={busy} run={run}/>)}
  </section>;
}
