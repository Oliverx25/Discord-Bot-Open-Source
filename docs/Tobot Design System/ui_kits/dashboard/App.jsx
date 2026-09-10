function App(){
  const { Toast, Button } = window.TobotDesignSystem_715bd9;
  const servers=[{id:'ado',tag:'AD',name:'Adobos',members:'12,480'},{id:'gg',tag:'GG',name:'Rocket Lobby',members:'3,102'},{id:'es',tag:'ES',name:'Hispano Devs',members:'8,740'}];
  const [server,setServer]=React.useState('ado');
  const [view,setView]=React.useState('modules');
  const [toast,setToast]=React.useState(null);
  const notify=(t,d,tone='success')=>{setToast({t,d,tone});clearTimeout(window.__tt);window.__tt=setTimeout(()=>setToast(null),3200)};
  const cur=servers.find(s=>s.id===server);
  const views={
    modules:<window.ModulesView notify={notify} onOpen={()=>setView('automod')}/>,
    automod:<window.ModuleDetail notify={notify} onBack={()=>setView('modules')}/>,
    logs:<window.LogsView/>,
    billing:<window.BillingView servers={servers}/>
  };
  const body=views[view]||<window.Empty view={view}/>;
  return <div style={{display:'flex',height:'100vh',fontSize:'var(--text-body-s)'}}>
    <ServerRail servers={servers} active={server} onPick={id=>{setServer(id);setView('modules')}}/>
    <Sidebar view={view} onView={setView} server={cur}/>
    <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>{body}</div>
    {toast&&<div style={{position:'fixed',right:'20px',bottom:'20px',zIndex:80}}>
      <Toast tone={toast.tone} icon={<DIcon n={toast.tone==='success'?'check':'alert-triangle'}/>} title={toast.t} description={toast.d} onDismiss={()=>setToast(null)}/></div>}
  </div>;
}
function Empty({view}){
  const { Button } = window.TobotDesignSystem_715bd9;
  return <><Topbar title={view[0].toUpperCase()+view.slice(1)} crumb="Adobos"/>
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'var(--space-4)',color:'var(--text-muted)'}}>
      <DIcon n="square-dashed" s={28}/>
      <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'var(--text-h3)',color:'var(--text-primary)'}}>Aquí todavía no hay nada</div>
      <p style={{maxWidth:'34ch',textAlign:'center',color:'var(--text-secondary)'}}>Esta pantalla no forma parte del kit. Sí lo son Módulos, Auto-mod, Action logs y Plan y facturación.</p>
      <Button variant="secondary" size="sm">Volver a módulos</Button>
    </div></>;
}
Object.assign(window,{App,Empty});
