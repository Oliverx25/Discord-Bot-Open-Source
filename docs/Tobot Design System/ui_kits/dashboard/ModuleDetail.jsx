function ModuleDetail({notify,onBack}){
  const { Card, Button, Switch, Input, Select, Checkbox, Radio, Tabs, Badge, Tag, Dialog, IconButton, Tooltip } = window.TobotDesignSystem_715bd9;
  const [tab,setTab]=React.useState('settings');
  const [enabled,setEnabled]=React.useState(true);
  const [punish,setPunish]=React.useState('mute');
  const [confirm,setConfirm]=React.useState(false);
  return <>
    <Topbar title="Auto-mod" crumb="Adobos · Módulos"
      actions={<><Badge tone="pro">Pro</Badge><Switch checked={enabled} onChange={e=>{setEnabled(e.target.checked);notify(e.target.checked?'Auto-mod activado':'Auto-mod desactivado','Aplicado al instante.',e.target.checked?'success':'warning')}} label="Activo"/><Button size="sm" variant="ghost" onClick={onBack}>Volver</Button></>}/>
    <div style={{padding:'var(--dash-pad)',overflowY:'auto',flex:1}}>
      <Tabs value={tab} onChange={setTab} tabs={[{value:'settings',label:'Ajustes'},{value:'rules',label:'Escalado',count:3},{value:'logs',label:'Reciente',count:24}]} style={{marginBottom:'var(--space-5)'}}/>
      <div style={{display:'grid',gridTemplateColumns:'1.3fr .7fr',gap:'var(--space-4)',alignItems:'start'}}>
        <div style={{display:'grid',gap:'var(--space-4)'}}>
          <Card title="Filtros" subtitle="Se aplican a cada mensaje nuevo dentro del alcance.">
            <div style={{display:'grid',gap:'10px'}}>
              <Checkbox checked label="Enlaces de invitación" hint="Salvo los partners de abajo."/>
              <Checkbox checked label="Menciones masivas" hint="Más de 5 en un mensaje."/>
              <Checkbox label="Texto repetido"/>
              <Checkbox checked label="Lista de palabras" hint="42 palabras · 3 regex"/>
            </div>
            <div style={{marginTop:'var(--space-4)',display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}}>
              <span className="ov" style={{marginRight:'4px'}}>Permitidos</span>
              {['discord.gg/adobos','youtube.com','twitch.tv'].map(t=><Tag key={t} mono onRemove={()=>{}}>{t}</Tag>)}
              <Button size="sm" variant="ghost" iconLeft={<DIcon n="plus" s={13}/>}>Añadir</Button>
            </div>
          </Card>
          <Card title="Castigo" subtitle="Primera infracción, antes del escalado.">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-5)'}}>
              <Radio label="Al infringir" name="p" value={punish} onChange={setPunish}
                options={[{value:'warn',label:'Avisar',hint:'MD al miembro'},{value:'mute',label:'Timeout',hint:'10 minutos'},{value:'kick',label:'Expulsar'},{value:'ban',label:'Banear',hint:'Requiere Ban Members'}]}/>
              <div style={{display:'grid',gap:'var(--space-4)'}}>
                <Select label="Registrar en" value="mod" options={[{value:'mod',label:'#mod-log'},{value:'audit',label:'#audit-trail'}]}/>
                <Input label="Borrar el mensaje tras" defaultValue="0" mono suffix="segundos" hint="0 lo borra al instante."/>
              </div>
            </div>
          </Card>
          <Card title="Alcance" subtitle="Canales y roles que este módulo ignora." tone="default"
            footer={<><Button size="sm">Guardar alcance</Button><Button size="sm" variant="ghost">Restablecer</Button><span style={{marginLeft:'auto',fontFamily:'var(--font-mono)',fontSize:'11px',color:'var(--text-muted)'}}>Editado hace 4h por @tomas</span></>}>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {['#mod-chat','#staff','#bot-tests'].map(t=><Tag key={t} mono icon={<DIcon n="hash" s={12}/>} onRemove={()=>{}}>{t.slice(1)}</Tag>)}
              {['@Moderator','@Admin'].map(t=><Tag key={t} mono onRemove={()=>{}}>{t}</Tag>)}
            </div>
          </Card>
        </div>
        <div style={{display:'grid',gap:'var(--space-4)'}}>
          <Card tone="raised" padding="md">
            <div className="ov">Últimos 30 días</div>
            <div style={{display:'grid',gap:'10px',marginTop:'12px'}}>
              {[['Mensajes filtrados','412'],['Timeouts aplicados','37'],['Falsos positivos','2'],['Reglas escaladas','9']].map(([k,v])=>
                <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                  <span style={{color:'var(--text-secondary)',fontSize:'var(--text-caption)'}}>{k}</span>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:'var(--text-body-s)'}}>{v}</span></div>)}
            </div>
          </Card>
          <Card tone="accent" padding="md">
            <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'var(--text-h4)'}}>Cópialo a tus otros servidores</div>
            <p style={{marginTop:'6px',fontSize:'var(--text-caption)',color:'var(--text-secondary)',lineHeight:1.5}}>Rocket Lobby e Hispano Devs están en la misma suscripción. Mismos filtros, un clic.</p>
            <Button size="sm" style={{marginTop:'12px'}} iconRight={<DIcon n="arrow-right" s={14}/>}>Copiar configuración</Button>
          </Card>
          <Card padding="md">
            <div className="ov">Zona peligrosa</div>
            <p style={{margin:'8px 0 12px',fontSize:'var(--text-caption)',color:'var(--text-secondary)'}}>Borra todos los filtros, reglas y listas de permitidos de este servidor.</p>
            <Button size="sm" variant="destructive" onClick={()=>setConfirm(true)}>Reiniciar auto-mod</Button>
          </Card>
        </div>
      </div>
    </div>
    <Dialog open={confirm} tone="danger" title="¿Reiniciar auto-mod?" onClose={()=>setConfirm(false)}
      description="Se van todos los filtros, reglas de escalado y permitidos de Adobos. Tus otros servidores no se tocan."
      footer={<><Button variant="ghost" onClick={()=>setConfirm(false)}>Cancelar</Button>
        <Button variant="destructive" onClick={()=>{setConfirm(false);notify('Auto-mod reiniciado','Filtros borrados en Adobos.','danger')}}>Restablecer</Button></>}/>
  </>;
}
window.ModuleDetail=ModuleDetail;
