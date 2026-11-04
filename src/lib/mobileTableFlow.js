// Derive labels from the table's own headings; no league data or values are rewritten.
export function tableColumnLabels(headerRows) {
  const grid=[];
  headerRows.forEach((row,r)=>{
    grid[r] ||= [];
    let col=0;
    row.forEach(cell=>{
      while(grid[r][col]!==undefined)col++;
      const label=String(cell.label||'').replace(/\s+/g,' ').trim();
      const rows=Math.max(1,Number(cell.rowSpan)||1),cols=Math.max(1,Number(cell.colSpan)||1);
      for(let y=r;y<r+rows;y++){
        grid[y] ||= [];
        for(let x=col;x<col+cols;x++)grid[y][x]=label;
      }
      col+=cols;
    });
  });
  const length=Math.max(0,...grid.map(row=>row.length));
  return Array.from({length},(_,col)=>[...new Set(grid.map(row=>row[col]).filter(Boolean))].join(' · '));
}
export function labelMobileTable(table) {
  if(table.closest('[data-brl-table-layout="fixed"],.agreement-paper,.brl-agreement-paper'))return;
  const headings=table.tHead?Array.from(table.tHead.rows):[];
  if(!headings.length){const row=table.rows[0];if(row&&Array.from(row.cells).every(c=>c.tagName==='TH'))headings.push(row);}
  const labels=tableColumnLabels(headings.map(row=>Array.from(row.cells).map(cell=>({label:cell.getAttribute('aria-label')||cell.textContent,colSpan:cell.colSpan,rowSpan:cell.rowSpan}))));
  table.dataset.brlMobileTable='flow';
  table.dataset.brlMobileInteractiveHead=headings.some(row=>row.querySelector?.('button,a,input,select,textarea,[tabindex],[role=button],[role=checkbox]')||Array.from(row.cells).some(cell=>typeof cell.onclick==='function'||cell.hasAttribute('aria-sort')))?'true':'false';
  const role=(node,value)=>{if(!node.hasAttribute('role'))node.setAttribute('role',value);};
  role(table,'table');
  Array.from(table.children).filter(e=>['THEAD','TBODY','TFOOT'].includes(e.tagName)).forEach(group=>role(group,'rowgroup'));
  for(const row of Array.from(table.rows)){
    role(row,'row');
    if(headings.includes(row)){
      row.dataset.brlMobileHeading='true';
      Array.from(row.cells).forEach(cell=>role(cell,'columnheader'));
      continue;
    }
    delete row.dataset.brlMobileHeading;
    let index=0;
    for(const cell of Array.from(row.cells)){
      role(cell,cell.tagName==='TH'?'rowheader':'cell');
      // Summary/empty rows spanning a table retain their full text without a false column label.
      cell.dataset.brlMobileLabel=cell.colSpan>1?'':labels[index]|| (index===0?'Details':`Column ${index+1}`);
      if(cell.colSpan>1)cell.dataset.brlMobileSpan='full';else delete cell.dataset.brlMobileSpan;
      index+=cell.colSpan;
    }
  }
}
