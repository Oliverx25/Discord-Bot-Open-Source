function Hero(){
  const { Button, Badge } = window.TobotDesignSystem_715bd9;
  const stack=[['welcome bot','$3 · por servidor'],['logging bot','$4 · por servidor'],['levels bot','$3 · por servidor'],['economy bot','gratis, con ads'],['automod bot','$5 · por servidor'],['forms bot','$2 · por servidor']];
  return <section style={{borderBottom:'1px solid var(--border-subtle)',backgroundColor:'var(--bg-base)',backgroundImage:'radial-gradient(circle at 1px 1px,var(--bg-base) 1.1px,transparent 1.2px),var(--dither-gradient)',backgroundSize:'3px 3px,100% 100%',backgroundRepeat:'repeat,no-repeat'}}>
    <div className="wrap" style={{display:'grid',gridTemplateColumns:'1.15fr .85fr',gap:'var(--space-16)',padding:'104px 24px 88px',alignItems:'start'}}>
      <div>
        <div style={{display:'flex',gap:'12px',alignItems:'baseline'}}><span style={{fontFamily:'var(--font-mono)',fontSize:'11px',letterSpacing:'.16em',color:'var(--accent)'}}>01 /</span><Overline>El problema</Overline></div>
        <h1 style={{marginTop:'var(--space-5)',fontSize:'var(--text-display-l)',lineHeight:'var(--lh-display-l)',letterSpacing:'var(--ls-display-l)',fontWeight:800}}>
          Seis bots hacen el trabajo.<br/>Con uno<span style={{color:'var(--accent)'}}> debería bastar.</span>
        </h1>
        <p style={{marginTop:'var(--space-6)',fontSize:'var(--text-body-l)',lineHeight:1.6,color:'var(--text-secondary)',maxWidth:'52ch'}}>
          Moderación, logs, bienvenidas, niveles, economía, formularios y automatización en un solo sitio. Una suscripción cubre todos tus servidores, no uno.
        </p>
        <div style={{marginTop:'var(--space-8)',display:'flex',gap:'var(--space-3)',alignItems:'center'}}>
          <Button size="lg">Añadir a Discord</Button>
          <Button size="lg" variant="secondary">Ver los 18 módulos</Button>
        </div>
        <div style={{marginTop:'var(--space-5)',fontFamily:'var(--font-mono)',fontSize:'var(--text-mono-s)',color:'var(--text-muted)'}}>
          // sin tarjeta · 15 de 18 módulos gratis para siempre, en todos tus servidores
        </div>
      </div>
      <div style={{border:'1px solid var(--border-default)',borderRadius:'var(--radius-lg)',background:'var(--bg-surface)',overflow:'hidden'}}>
        <div style={{padding:'var(--space-4) var(--space-5)',borderBottom:'1px solid var(--border-subtle)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span className="ov">Tu stack actual</span>
          <span style={{fontFamily:'var(--font-mono)',fontSize:'var(--text-mono-s)',color:'var(--danger)'}}>$17/mo × 3 servidores</span>
        </div>
        {stack.map(([n,p],i)=>
          <div key={n} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px var(--space-5)',borderBottom:'1px solid var(--border-subtle)',opacity:.55}}>
            <span style={{fontSize:'var(--text-body-s)',textDecoration:'line-through',textDecorationColor:'var(--danger)'}}>{n}</span>
            <span style={{fontFamily:'var(--font-mono)',fontSize:'var(--text-mono-s)',color:'var(--text-muted)'}}>{p}</span>
          </div>)}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'var(--space-4) var(--space-5)',background:'var(--bg-tint-accent)',borderTop:'1px solid var(--accent)'}}>
          <span className="wm" style={{fontSize:'20px'}}>tobot<span style={{color:'var(--accent)'}}>.</span></span>
          <span style={{fontFamily:'var(--font-mono)',fontSize:'var(--text-mono)',color:'var(--text-primary)'}}>$6/mo · TODOS tus servidores</span>
        </div>
      </div>
    </div>
  </section>;
}
window.Hero=Hero;
