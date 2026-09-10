function Modules(){
  const { Badge, Tag } = window.TobotDesignSystem_715bd9;
  const PRO=['Auto-mod','Economy','Pokémon'];
  return <Section id="modules" style={{borderBottom:'1px solid var(--border-subtle)'}}>
    <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'var(--space-8)'}}>
      <div>
        <div style={{display:'flex',gap:'12px',alignItems:'baseline'}}><span style={{fontFamily:'var(--font-mono)',fontSize:'11px',letterSpacing:'.16em',color:'var(--accent)'}}>02 /</span><Overline>El muro</Overline></div>
        <h2 style={{marginTop:'var(--space-4)',fontSize:'var(--text-display-m)',lineHeight:'var(--lh-display-m)',letterSpacing:'var(--ls-display-m)'}}>Dieciocho módulos que ya se conocen entre sí</h2>
      </div>
      <p style={{fontSize:'var(--text-body-s)',color:'var(--text-secondary)',maxWidth:'34ch'}}>
        Los niveles pagan en la economía. El auto-mod escribe en tus logs. Los formularios reparten roles. Nada que cablear.
      </p>
    </div>
    <div style={{marginTop:'var(--space-10)',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1px',background:'var(--border-subtle)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
      {MODULES.map(([ic,name,desc])=>
        <div key={name} style={{background:'var(--bg-surface)',padding:'var(--space-5)',display:'flex',gap:'var(--space-4)',alignItems:'flex-start'}}>
          <span style={{marginTop:'2px',color:PRO.includes(name)?'var(--text-accent)':'var(--text-muted)'}}><Icon n={ic} s={18}/></span>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'var(--space-2)'}}>
              <span style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'var(--text-h4)'}}>{name}</span>
              {PRO.includes(name)&&<Badge tone="pro" size="sm">Pro</Badge>}
            </div>
            <div style={{marginTop:'3px',fontSize:'var(--text-caption)',color:'var(--text-secondary)',lineHeight:1.5}}>{desc}</div>
          </div>
        </div>)}
    </div>
    <div style={{marginTop:'var(--space-6)',display:'flex',gap:'var(--space-2)',alignItems:'center',flexWrap:'wrap'}}>
      <span className="ov" style={{marginRight:'var(--space-2)'}}>Sustituye a</span>
      {['welcome bots','logging bots','levels bots','economy bots','automod bots','form bots'].map(t=><Tag key={t}>{t}</Tag>)}
    </div>
  </Section>;
}
window.Modules=Modules;
