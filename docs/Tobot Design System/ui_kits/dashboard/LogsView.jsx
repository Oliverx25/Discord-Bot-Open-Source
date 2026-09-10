function LogsView(){
  const { Tabs, Badge, Input, Button, IconButton, Tag, Tooltip } = window.TobotDesignSystem_715bd9;
  const [range,setRange]=React.useState('24h');
  const rows=[['10:24:07','MSG_DELETE','success','#general','@tomas','1 mensaje · manual'],
    ['10:24:31','AUTOMOD','warning','#general','@rin','filter:links → timeout 10m'],
    ['10:25:02','WEBHOOK_401','danger','—','system','retry in 30s'],
    ['10:31:44','ROLE_ADD','success','#roles','@kaori','+@Verified via reaction'],
    ['10:33:12','MEMBER_JOIN','success','#welcome','@nao','card rendered · 84ms'],
    ['10:41:59','BAN','danger','#mod-log','@tomas','raid account · appeal open'],
    ['10:52:03','LEVEL_UP','success','#general','@kaori','lvl 41 → 42'],
    ['11:02:18','SCHEDULED','success','#anuncios','system','sent · Europe/Madrid'],
    ['11:14:40','AUTOMOD','warning','#memes','@dai','filter:mentions → warn'],
    ['11:20:05','MSG_EDIT','success','#general','@rin','diff stored']];
  const tone={success:'var(--success)',warning:'var(--warning)',danger:'var(--danger)'};
  return <>
    <Topbar title="Action logs" crumb="Adobos"
      actions={<><Input size="sm" placeholder="Filtrar eventos" prefix="?" style={{width:'190px'}}/>
        <Button size="sm" variant="secondary" iconLeft={<DIcon n="download" s={14}/>}>Exportar</Button></>}/>
    <div style={{padding:'var(--dash-pad)',display:'flex',flexDirection:'column',gap:'var(--space-4)',flex:1,minHeight:0}}>
      <div style={{display:'flex',alignItems:'center',gap:'var(--space-4)'}}>
        <Tabs variant="segmented" value={range} onChange={setRange} tabs={[{value:'1h',label:'1h'},{value:'24h',label:'24h'},{value:'7d',label:'7d'},{value:'30d',label:'30d'}]}/>
        <div style={{display:'flex',gap:'6px'}}>{['moderation','automod','roles','economy'].map(t=><Tag key={t} selected={t==='automod'} onClick={()=>{}}>{t}</Tag>)}</div>
        <span style={{marginLeft:'auto',fontFamily:'var(--font-mono)',fontSize:'var(--text-mono-s)',color:'var(--text-muted)'}}>18.930 eventos · retención 90d</span>
      </div>
      <div style={{border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg)',background:'var(--bg-surface)',overflow:'hidden',flex:1,minHeight:0,display:'flex',flexDirection:'column'}}>
        <div style={{display:'grid',gridTemplateColumns:'88px 140px 110px 120px 1fr 36px',gap:'12px',padding:'10px var(--space-4)',borderBottom:'1px solid var(--border-default)',background:'var(--bg-raised)'}}>
          {['Hora','Evento','Canal','Actor','Detalle',''].map(h=><span key={h} className="ov">{h}</span>)}
        </div>
        <div style={{overflowY:'auto'}}>
          {rows.map((r,i)=>
            <div key={i} style={{display:'grid',gridTemplateColumns:'88px 140px 110px 120px 1fr 36px',gap:'12px',alignItems:'center',padding:'9px var(--space-4)',borderBottom:'1px solid var(--border-subtle)',fontFamily:'var(--font-mono)',fontSize:'var(--text-mono-s)'}}>
              <span style={{color:'var(--text-muted)'}}>{r[0]}</span>
              <span style={{color:tone[r[2]]}}>{r[1]}</span>
              <span style={{color:'var(--text-secondary)'}}>{r[3]}</span>
              <span style={{color:'var(--text-secondary)'}}>{r[4]}</span>
              <span style={{color:'var(--text-primary)'}}>{r[5]}</span>
              <Tooltip label="Abrir caso" side="left"><IconButton size="sm" icon={<DIcon n="external-link" s={13}/>} label="Open"/></Tooltip>
            </div>)}
        </div>
      </div>
    </div>
  </>;
}
window.LogsView=LogsView;
