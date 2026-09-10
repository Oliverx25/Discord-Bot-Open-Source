function BillingView({servers}){
  const { Card, Button, Badge, Switch, Tag } = window.TobotDesignSystem_715bd9;
  return <>
    <Topbar title="Plan y facturación" crumb="Cuenta · tomas@adobos.gg"/>
    <div style={{padding:'var(--dash-pad)',overflowY:'auto',flex:1,display:'grid',gap:'var(--space-4)',gridTemplateColumns:'1.4fr .6fr',alignItems:'start'}}>
      <div style={{display:'grid',gap:'var(--space-4)'}}>
        <Card tone="accent" padding="lg">
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'var(--space-6)'}}>
            <div>
              <Badge tone="pro">Pro</Badge>
              <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'var(--text-h2)',marginTop:'10px'}}>$6 al mes, todos tus servidores</div>
              <p style={{marginTop:'8px',color:'var(--text-secondary)',maxWidth:'46ch'}}>Se cobra a tu cuenta, no por servidor. Añade una cuarta comunidad mañana y esta cifra no se mueve.</p>
            </div>
            <div style={{textAlign:'right',fontFamily:'var(--font-mono)',fontSize:'var(--text-mono-s)',color:'var(--text-secondary)'}}>
              <div>Renueva 12 sep 2026</div><div style={{marginTop:'4px'}}>Visa ···· 4242</div>
            </div>
          </div>
        </Card>
        <Card title="Servidores cubiertos" subtitle="Todo lo de esta cuenta, sin coste extra." padding="md">
          <div style={{display:'grid',gap:'8px'}}>
            {servers.map(s=>
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 12px',background:'var(--bg-inset)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)'}}>
                <span style={{width:'24px',height:'24px',borderRadius:'var(--radius-sm)',background:'var(--bg-raised)',border:'1px solid var(--border-default)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontWeight:700,fontSize:'11px'}}>{s.tag}</span>
                <span style={{fontWeight:600}}>{s.name}</span>
                <span style={{fontFamily:'var(--font-mono)',fontSize:'11px',color:'var(--text-muted)'}}>{s.members} miembros</span>
                <Badge tone="success" size="sm" dot style={{marginLeft:'auto'}}>Pro activo</Badge>
              </div>)}
            <button style={{all:'unset',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',padding:'10px 12px',border:'1px dashed var(--border-strong)',borderRadius:'var(--radius-md)',color:'var(--text-muted)'}}>
              <DIcon n="plus" s={14}/> Añade otro servidor — siguen siendo $6
            </button>
          </div>
        </Card>
        <Card title="Facturas" padding="md">
          <div style={{display:'grid',gap:'2px',fontFamily:'var(--font-mono)',fontSize:'var(--text-mono-s)'}}>
            {[['12 ago 2026','$6.00','Pagada'],['12 jul 2026','$6.00','Pagada'],['12 jun 2026','$6.00','Pagada']].map(([d,a,s])=>
              <div key={d} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border-subtle)'}}>
                <span style={{color:'var(--text-secondary)'}}>{d}</span><span>{a}</span><span style={{color:'var(--success)'}}>{s}</span></div>)}
          </div>
        </Card>
      </div>
      <div style={{display:'grid',gap:'var(--space-4)'}}>
        <Card title="Uso" padding="md">
          <div style={{display:'grid',gap:'12px'}}>
            {[['Retención de logs','90 días','var(--accent)',.6],['Mensajes programados','7 / ilimitados','var(--secondary)',.1],['Comandos ejecutados (30d)','24.910','var(--success)',.8]].map(([k,v,c,p])=>
              <div key={k}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'var(--text-caption)'}}>
                  <span style={{color:'var(--text-secondary)'}}>{k}</span><span style={{fontFamily:'var(--font-mono)'}}>{v}</span></div>
                <div style={{marginTop:'6px',height:'4px',borderRadius:'999px',background:'var(--bg-inset)',overflow:'hidden'}}>
                  <div style={{width:(p*100)+'%',height:'100%',background:c}}/></div>
              </div>)}
          </div>
        </Card>
        <Card title="Preferencias de facturación" padding="md">
          <div style={{display:'grid',gap:'10px'}}>
            <Switch checked label="Envíame la factura por email"/>
            <Switch checked={false} label="Facturación anual" hint="Dos meses gratis"/>
          </div>
          <Button size="sm" variant="secondary" fullWidth style={{marginTop:'14px'}}>Cambiar método de pago</Button>
          <Button size="sm" variant="ghost" fullWidth style={{marginTop:'6px'}}>Cancelar Pro</Button>
        </Card>
      </div>
    </div>
  </>;
}
window.BillingView=BillingView;
