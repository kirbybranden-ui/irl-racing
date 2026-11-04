export function careerWorkspaceData(rawData, workspace) {
  const personalContracts=(rawData?.contracts||[]).filter(c=>c.driver_user===rawData?.me.user_id);
  const ownedIds = (rawData?.teams || []).filter(t=>t.owner_user===rawData?.me.user_id).map(t=>t.id);
  return !rawData || workspace === "admin" ? rawData : workspace === "owner" ? {...rawData, isSuperAdmin:false, manufacturerRoles:[],
    contracts:rawData.contracts.filter(c=>ownedIds.includes(c.team_id)), requests:rawData.requests.filter(q=>ownedIds.includes(q.team_id)),
    obligations:rawData.obligations.filter(o=>rawData.contracts.some(c=>c.id===o.contract_id&&ownedIds.includes(c.team_id))),
    payments:rawData.payments.filter(p=>rawData.teams.some(t=>ownedIds.includes(t.id)&&t.code===p.team)),
    agreements:rawData.agreements.filter(a=>ownedIds.includes(a.team_id)), claims:rawData.claims.filter(c=>ownedIds.includes(c.team_id)||rawData.agreements.some(a=>a.id===c.agreement_id&&ownedIds.includes(a.team_id))),
    loans:rawData.loans.filter(l=>ownedIds.includes(l.team_id)),
    leases:(rawData.leases||[]).filter(l=>ownedIds.includes(l.team_id)), leaseDuties:(rawData.leaseDuties||[]).filter(d=>(rawData.leases||[]).some(l=>l.id===d.lease_id&&ownedIds.includes(l.team_id))),
    manufacturerProposals:(rawData.manufacturerProposals||[]).filter(p=>ownedIds.includes(p.terms.teamId)||ownedIds.includes(p.terms.sourceTeamId)),
    numberChanges:(rawData.numberChanges||[]).filter(c=>ownedIds.includes(c.team_id)),
  } : { ...rawData, isSuperAdmin:false, manufacturerRoles:[],
    contracts: personalContracts,
    requests: rawData.requests.filter(r => r.driver_user === rawData.me.user_id),
    obligations: rawData.obligations.filter(o => personalContracts.some(c => c.id === o.contract_id)),
    payments: rawData.payments.filter(p => String(p.driver_id) === String(rawData.me.driver_id)),
    balances: rawData.balances.filter(b => b.kind === "driver" && String(b.subject) === String(rawData.me.driver_id)),
    agreements: [], claims: [], loans: [], budgets: [],
  };
}
