function Pricing(){
  const { Button, Badge, Slider } = window.TobotDesignSystem_715bd9;
  const [servers,setServers]=React.useState(3);
  const rival=servers*17, ours=6;
  const rows=[['Módulos incluidos','15 de 18','Los 18'],['Servidores por suscripción','Ilimitados','Ilimitados'],['Retención de logs','7 días','90 días'],['Mensajes programados','10','Ilimitados'],['Filtros de auto-mod','—','Con escalado'],['Economía y casino','—','Incluido'],['Plugin de Pokémon','—','Incluido'],['Soporte','Comunidad','Cola prioritaria']];
  return <Section id="pricing" style={{borderBottom:'1px solid var(--border-subtle)'}}>
    <div style={{display:'grid',gridTemplateColumns:'.9fr 1.1fr',gap:'var(--space-16)',alignItems:'start'}}>
      <div>
        <div style={{display:'flex',gap:'12px',alignItems:'baseline'}}><span style={{fontFamily:'var(--font-mono)',fontSize:'11px',letterSpacing:'.16em',color:'var(--accent)'}}>03 /</span><Overline>Pricing</Overline></div>
        <h2 style={{marginTop:'var(--space-4)',fontSize:'var(--text-display-m)',lineHeight:'var(--lh-display-m)',letterSpacing:'var(--ls-display-m)'}}>Por cuenta.<br/>No por servidor.</h2>
        <p style={{marginTop:'var(--space-5)',fontSize:'var(--text-body)',color:'var(--text-secondary)',maxWidth:'42ch'}}>
          Los demás te vuelven a cobrar por el mismo bot. Mueve el deslizador y mira lo que te cuesta.
        </p>
        <div style={{marginTop:'var(--space-8)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-lg)',padding:'var(--space-5)',background:'var(--bg-surface)'}}>
          <Slider label="Servidores que administras" min={1} max={12} value={servers} onChange={setServers} ticks={['1','12']}/>
          <div style={{marginTop:'var(--space-5)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-4)'}}>
            <div style={{padding:'var(--space-3)',borderRadius:'var(--radius-md)',border:'1px solid var(--border-subtle)'}}>
              <div className="ov">Stack típico</div>
              <div style={{fontFamily:'var(--font-mono)',fontSize:'22px',marginTop:'6px',color:'var(--danger)'}}>${rival}<span style={{fontSize:'12px',color:'var(--text-muted)'}}>/mo</span></div>
            </div>
            <div style={{padding:'var(--space-3)',borderRadius:'var(--radius-md)',border:'1px solid var(--border-accent)',background:'var(--bg-tint-accent)'}}>
              <div className="ov" style={{color:'var(--text-accent)'}}>Tobot Pro</div>
              <div style={{fontFamily:'var(--font-mono)',fontSize:'22px',marginTop:'6px'}}>${ours}<span style={{fontSize:'12px',color:'var(--text-muted)'}}>/mo</span></div>
            </div>
          </div>
        </div>
      </div>
      <div style={{border:'1px solid var(--border-default)',borderRadius:'var(--radius-lg)',overflow:'hidden',background:'var(--bg-surface)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr'}}>
          <div style={{padding:'var(--space-5)',borderBottom:'1px solid var(--border-default)'}}><span className="ov">Qué incluye</span></div>
          <div style={{padding:'var(--space-5)',borderBottom:'1px solid var(--border-default)',borderLeft:'1px solid var(--border-subtle)'}}>
            <Badge tone="free">Free</Badge>
            <div style={{fontFamily:'var(--font-mono)',fontSize:'var(--text-h3)',marginTop:'8px'}}>$0</div>
          </div>
          <div style={{padding:'var(--space-5)',borderBottom:'1px solid var(--border-accent)',borderLeft:'1px solid var(--border-subtle)',background:'var(--bg-tint-accent)'}}>
            <Badge tone="pro">Pro</Badge>
            <div style={{fontFamily:'var(--font-mono)',fontSize:'var(--text-h3)',marginTop:'8px'}}>$6<span style={{fontSize:'12px',color:'var(--text-muted)'}}>/mo</span></div>
          </div>
          {rows.map(([label,a,b],i)=>
            <React.Fragment key={label}>
              <div style={{padding:'12px var(--space-5)',borderBottom:'1px solid var(--border-subtle)',fontSize:'var(--text-body-s)'}}>{label}</div>
              <div style={{padding:'12px var(--space-5)',borderBottom:'1px solid var(--border-subtle)',borderLeft:'1px solid var(--border-subtle)',fontFamily:'var(--font-mono)',fontSize:'var(--text-mono-s)',color:a==='—'?'var(--text-muted)':'var(--text-secondary)'}}>{a}</div>
              <div style={{padding:'12px var(--space-5)',borderBottom:'1px solid var(--border-subtle)',borderLeft:'1px solid var(--border-subtle)',fontFamily:'var(--font-mono)',fontSize:'var(--text-mono-s)',background:'rgba(198,255,61,.05)'}}>{b}</div>
            </React.Fragment>)}
        </div>
        <div style={{display:'flex',gap:'var(--space-3)',padding:'var(--space-5)'}}>
          <Button variant="secondary" fullWidth>Empezar gratis</Button>
          <Button fullWidth>Pasar a Pro</Button>
        </div>
      </div>
    </div>
  </Section>;
}
window.Pricing=Pricing;
