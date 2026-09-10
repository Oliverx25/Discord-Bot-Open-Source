function DIcon({n,s=16,c}){
  const r=React.useRef(null);
  React.useEffect(()=>{if(!r.current||!window.lucide)return;r.current.innerHTML='';
    const k=n.split('-').map(p=>p[0].toUpperCase()+p.slice(1)).join('');const d=lucide[k];if(!d)return;
    const el=lucide.createElement(d);el.setAttribute('width',s);el.setAttribute('height',s);el.setAttribute('stroke-width',2);r.current.appendChild(el);},[n,s]);
  return <span ref={r} style={{display:'flex',color:c}}/>;
}

function ServerRail({servers,active,onPick}){
  return <div style={{width:'56px',flexShrink:0,background:'var(--bg-inset)',borderRight:'1px solid var(--border-subtle)',display:'flex',flexDirection:'column',alignItems:'center',padding:'10px 0',gap:'8px'}}>
    <div style={{width:'34px',height:'34px',borderRadius:'var(--radius-md)',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span className="wm" style={{fontSize:'20px',color:'var(--on-accent)'}}>t</span></div>
    <div style={{width:'20px',height:'1px',background:'var(--border-default)',margin:'4px 0'}}/>
    {servers.map(s=>
      <button key={s.id} onClick={()=>onPick(s.id)} title={s.name}
        style={{all:'unset',cursor:'pointer',width:'34px',height:'34px',borderRadius:'var(--radius-md)',
          display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontWeight:700,fontSize:'13px',
          background:active===s.id?'var(--bg-tint-accent)':'var(--bg-raised)',
          border:'1px solid '+(active===s.id?'rgba(198,255,61,.35)':'var(--border-subtle)'),
          color:active===s.id?'var(--text-accent)':'var(--text-secondary)'}}>{s.tag}</button>)}
    <button style={{all:'unset',cursor:'pointer',width:'34px',height:'34px',borderRadius:'var(--radius-md)',border:'1px dashed var(--border-strong)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)'}}><DIcon n="plus" s={15}/></button>
  </div>;
}

function Sidebar({view,onView,server}){
  const { NavItem, Badge } = window.TobotDesignSystem_715bd9;
  const groups=[['Servidor',[['layout-grid','Módulos','modules'],['scroll-text','Action logs','logs'],['bar-chart-3','Estadísticas','stats']]],
    ['Moderación',[['shield-alert','Auto-mod','automod'],['gavel','Casos','cases'],['users-round','Roles','roles']]],
    ['Comunidad',[['trending-up','Niveles','levels'],['coins','Economía','economy'],['image','Welcome cards','cards']]],
    ['Cuenta',[['credit-card','Plan y facturación','billing'],['settings','Ajustes','settings']]]];
  const pro={automod:1,economy:1};
  return <div style={{width:'var(--sidebar-w)',flexShrink:0,background:'var(--bg-surface)',borderRight:'1px solid var(--border-subtle)',display:'flex',flexDirection:'column'}}>
    <div style={{height:'var(--topbar-h)',display:'flex',alignItems:'center',gap:'10px',padding:'0 14px',borderBottom:'1px solid var(--border-subtle)'}}>
      <div style={{width:'26px',height:'26px',borderRadius:'var(--radius-sm)',background:'var(--bg-raised)',border:'1px solid var(--border-default)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontWeight:700,fontSize:'12px'}}>{server.tag}</div>
      <div style={{minWidth:0}}>
        <div style={{fontSize:'var(--text-label)',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{server.name}</div>
        <div style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-muted)'}}>{server.members} members</div>
      </div>
      <span style={{marginLeft:'auto',color:'var(--text-muted)'}}><DIcon n="chevrons-up-down" s={14}/></span>
    </div>
    <div style={{padding:'12px 10px',overflowY:'auto',flex:1}}>
      {groups.map(([g,items])=>
        <div key={g} style={{marginBottom:'14px'}}>
          <div className="ov" style={{padding:'0 10px 6px'}}>{g}</div>
          <div style={{display:'grid',gap:'2px'}}>
            {items.map(([ic,label,id])=>
              <NavItem key={id} icon={<DIcon n={ic}/>} label={label} active={view===id} onClick={()=>onView(id)}
                badge={pro[id]?<Badge tone="pro" size="sm">Pro</Badge>:null}/>)}
          </div>
        </div>)}
    </div>
    <div style={{padding:'12px',borderTop:'1px solid var(--border-subtle)'}}>
      <div style={{border:'1px solid var(--border-accent)',background:'var(--bg-tint-accent)',borderRadius:'var(--radius-md)',padding:'10px'}}>
        <div style={{fontSize:'var(--text-label)',fontWeight:600}}>Pro cubre tus 3 servidores</div>
        <div style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-secondary)',marginTop:'3px'}}>Renueva 12 sep · $6/mo</div>
      </div>
    </div>
  </div>;
}

function Topbar({title,crumb,actions}){
  const { IconButton, Tooltip } = window.TobotDesignSystem_715bd9;
  return <div style={{height:'var(--topbar-h)',flexShrink:0,borderBottom:'1px solid var(--border-subtle)',background:'var(--bg-base)',display:'flex',alignItems:'center',gap:'var(--space-4)',padding:'0 var(--dash-pad)'}}>
    <div style={{flexShrink:0,minWidth:0}}>
      {crumb&&<div style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-muted)',whiteSpace:'nowrap'}}>{crumb}</div>}
      <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'var(--text-h3)',letterSpacing:'-.01em',whiteSpace:'nowrap',lineHeight:1.15}}>{title}</div>
    </div>
    <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'var(--space-2)'}}>
      {actions}
      <Tooltip label="Estado del bot: en línea"><span style={{display:'inline-flex',alignItems:'center',gap:'6px',fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-muted)',padding:'0 8px'}}>
        <span style={{width:'6px',height:'6px',borderRadius:'999px',background:'var(--success)'}}/>42ms</span></Tooltip>
      <IconButton icon={<DIcon n="book-open"/>} label="Docs" variant="ghost"/>
      <div style={{width:'26px',height:'26px',borderRadius:'999px',background:'var(--coal-700)',border:'1px solid var(--border-default)'}}/>
    </div>
  </div>;
}
Object.assign(window,{DIcon,ServerRail,Sidebar,Topbar});
