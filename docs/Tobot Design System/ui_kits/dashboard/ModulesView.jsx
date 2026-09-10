function ModulesView({notify,onOpen}){
  const { ModuleCard, Switch, Button, Tabs, Input, Badge, IconButton } = window.TobotDesignSystem_715bd9;
  const all=[['shield-alert','Auto-mod','Filtros y castigos escalonados.','pro','412 filtrados · 30d'],
    ['image','Welcome cards','Joins, salidas, bans y boosts en canvas.','free','1.204 renderizadas · 30d'],
    ['scroll-text','Action logs','Enrutado granular por canal.','free','18.930 eventos · 30d'],
    ['user-plus','Autoroles','Por reacción, botón y menú.','free','96 asignados · 30d'],
    ['trending-up','Niveles','XP de texto y voz.','free','Top: @kaori · nvl 42'],
    ['coins','Economía','Banco, trabajos, tienda y casino.','pro','Apagado'],
    ['clipboard-list','Formularios','Modales que escriben en un canal.','free','23 respuestas · 30d'],
    ['calendar-clock','Programados','Zona horaria por mensaje.','free','7 en cola'],
    ['terminal','Comandos custom','Tuyos, no nuestros.','free','14 comandos'],
    ['timer','Auto-borrado','Limpieza programada.','free','Apagado'],
    ['swords','Pokémon','PokéAPI y Smogon.','pro','Apagado'],
    ['webhook','Webhooks','Reenvía eventos a donde quieras.','free','3 endpoints']];
  const [on,setOn]=React.useState({'Auto-mod':1,'Welcome cards':1,'Action logs':1,'Autoroles':1,'Niveles':1,'Formularios':1,'Programados':1,'Comandos custom':1,'Webhooks':1});
  const [tab,setTab]=React.useState('all');
  const [view,setView]=React.useState('grid');
  const toggle=name=>{const next={...on};if(next[name]){delete next[name];notify(name+' desactivado','La configuración se conserva.','warning')}else{next[name]=1;notify(name+' activado','Aplicado a Adobos al instante.')}setOn(next)};
  const list=tab==='all'?all:tab==='on'?all.filter(m=>on[m[1]]):all.filter(m=>m[3]==='pro');
  return <>
    <Topbar title="Módulos" crumb="Adobos"
      actions={<><Input size="sm" placeholder="Buscar módulos" prefix="/" style={{width:'200px'}}/><Button size="sm" variant="secondary" iconLeft={<DIcon n="copy" s={14}/>}>Copiar a otro servidor</Button></>}/>
    <div style={{padding:'var(--dash-pad)',overflowY:'auto',flex:1}}>
      <div style={{display:'flex',alignItems:'center',gap:'var(--space-4)',marginBottom:'var(--space-4)'}}>
        <Tabs variant="segmented" value={tab} onChange={setTab} tabs={[{value:'all',label:'Todos',count:18},{value:'on',label:'Activos',count:Object.keys(on).length},{value:'pro',label:'Pro'}]}/>
        <span style={{marginLeft:'auto',fontFamily:'var(--font-mono)',fontSize:'var(--text-mono-s)',color:'var(--text-muted)'}}>los cambios se aplican al instante</span>
        <div style={{display:'flex',gap:'2px'}}>
          <IconButton size="sm" variant={view==='grid'?'outline':'ghost'} active={view==='grid'} icon={<DIcon n="layout-grid" s={14}/>} label="Rejilla" onClick={()=>setView('grid')}/>
          <IconButton size="sm" variant={view==='list'?'outline':'ghost'} active={view==='list'} icon={<DIcon n="list" s={14}/>} label="Lista" onClick={()=>setView('list')}/>
        </div>
      </div>
      {view==='grid'
        ?<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'16px'}}>
          {list.map(([ic,name,desc,tier,stat])=>
            <ModuleCard key={name} name={name} description={desc} tier={tier} enabled={!!on[name]} stat={stat}
              icon={<DIcon n={ic} s={18}/>} onOpen={name==='Auto-mod'?onOpen:undefined}
              onToggle={<Switch size="sm" checked={!!on[name]} onChange={()=>toggle(name)}/>}/>)}
        </div>
        :<div style={{border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg)',overflow:'hidden',background:'var(--bg-surface)'}}>
          {list.map(([ic,name,desc,tier,stat],i)=>
            <ModuleCard layout="row" index={i+1} key={name} name={name} description={desc} tier={tier} enabled={!!on[name]} stat={stat}
              icon={<DIcon n={ic} s={17}/>} onOpen={name==='Auto-mod'?onOpen:undefined}
              onToggle={<Switch size="sm" checked={!!on[name]} onChange={()=>toggle(name)}/>}/>)}
        </div>}
      <div style={{marginTop:'var(--space-5)',display:'flex',alignItems:'center',gap:'var(--space-3)',padding:'var(--space-4)',border:'1px dashed var(--border-default)',borderRadius:'var(--radius-lg)'}}>
        <span style={{color:'var(--text-muted)'}}><DIcon n="info"/></span>
        <span style={{color:'var(--text-secondary)'}}>Hay seis módulos más. Todo lo que actives aquí se puede copiar a tus otros dos servidores en un clic.</span>
        <Button size="sm" variant="ghost" style={{marginLeft:'auto'}}>Ver los 18</Button>
      </div>
    </div>
  </>;
}
window.ModulesView=ModulesView;
