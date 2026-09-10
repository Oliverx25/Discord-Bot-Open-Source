function Nav(){
  const { Button, Badge, Ticker } = window.TobotDesignSystem_715bd9;
  return <><Ticker items={['One bot, one bill','18 módulos','15 gratis','Por cuenta, no por servidor']}/>
  <header style={{position:'sticky',top:0,zIndex:40,background:'rgba(8,10,8,.88)',borderBottom:'1px solid var(--border-subtle)',backdropFilter:'blur(6px)'}}>
    <div className="wrap" style={{height:'62px',display:'flex',alignItems:'center',gap:'var(--space-8)'}}>
      <span className="wm" style={{fontSize:'24px'}}>tobot<span style={{color:'var(--accent)'}}>.</span></span>
      <nav style={{display:'flex',gap:'var(--space-6)'}}>
        {['Módulos','Pricing','Docs','Changelog'].map(l=>
          <a key={l} href={'#'+l.toLowerCase()} className="ov" style={{color:'var(--text-muted)',borderBottom:'none'}}>{l}</a>)}
      </nav>
      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'var(--space-4)'}}>
        <span className="ov">18 módulos · 15 gratis</span>
        <Button variant="ghost" size="sm">Log in</Button>
        <Button variant="primary" size="sm">Añadir a Discord</Button>
      </div>
    </div>
  </header></>;
}
window.Nav=Nav;
