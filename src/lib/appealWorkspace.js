export function appealWorkspaceData(data, staffMode=false) {
  if(!data || staffMode)return data;
  return {...data,isAdmin:false,legacy:[],cases:data.cases.filter(c=>c.appellant===data.userId||c.panel.includes(data.userId)).map(c=>({...c,canCoordinate:false}))};
}
