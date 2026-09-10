function Faq(){
  const { Button, Accordion } = window.TobotDesignSystem_715bd9;
  const [open,setOpen]=React.useState(0);
  const qs=[['¿La capa gratis es una prueba?','No. Quince módulos son gratis sin límite de tiempo y sin cobro por servidor. Pro añade tres módulos pesados, más retención de logs y cola prioritaria.'],
    ['¿Qué pasa si dejo de pagar?','Los módulos Pro se apagan y tu configuración se queda. No se borra nada y no se secuestra nada.'],
    ['¿Puedo self-hostearlo?','Sí. Es un solo proceso Node que mantiene el socket del gateway y sirve el dashboard. El plan alojado existe para que no tengas que hacerlo.'],
    ['¿Una suscripción cubre de verdad todos mis servidores?','Sí, los de tu cuenta. Tres comunidades, una factura. Esa es toda la idea.']];
  return <>
    <Section style={{borderBottom:'1px solid var(--border-subtle)'}}>
      <div style={{display:'grid',gridTemplateColumns:'.7fr 1.3fr',gap:'var(--space-16)'}}>
        <div><div style={{display:'flex',gap:'12px',alignItems:'baseline'}}><span style={{fontFamily:'var(--font-mono)',fontSize:'11px',letterSpacing:'.16em',color:'var(--accent)'}}>04 /</span><Overline>Preguntas</Overline></div><h2 style={{marginTop:'var(--space-4)',fontSize:'var(--text-h1)',lineHeight:'var(--lh-h1)'}}>Respondidas antes de que preguntes</h2></div>
        <Accordion items={qs.map(([title,content])=>({title,content}))}/>
      </div>
    </Section>
    <Section style={{textAlign:'center'}}>
      <h2 style={{fontSize:'var(--text-display-m)',lineHeight:'var(--lh-display-m)',letterSpacing:'var(--ls-display-m)',maxWidth:'20ch',margin:'0 auto'}}>Enciende un módulo. Luego decides.</h2>
      <div style={{marginTop:'var(--space-6)',display:'flex',gap:'var(--space-3)',justifyContent:'center'}}>
        <Button size="lg">Añadir a Discord</Button>
        <Button size="lg" variant="ghost">Leer los docs</Button>
      </div>
    </Section>
  </>;
}
function Footer(){
  return <footer style={{borderTop:'1px solid var(--border-subtle)',padding:'var(--space-10) 0'}}>
    <div className="wrap" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'var(--space-8)',flexWrap:'wrap'}}>
      <span className="wm" style={{fontSize:'20px'}}>tobot<span style={{color:'var(--accent)'}}>.</span></span>
      <div style={{display:'flex',gap:'var(--space-6)',fontSize:'var(--text-caption)'}}>
        {['Status','Docs','Changelog','Terms','Privacy'].map(l=><a key={l} href="#" style={{color:'var(--text-muted)',borderBottom:'none'}}>{l}</a>)}
      </div>
      <span style={{fontFamily:'var(--font-mono)',fontSize:'var(--text-overline)',color:'var(--text-muted)'}}>Hecho para el servidor Adobos. Ahora para el tuyo.</span>
    </div>
  </footer>;
}
Object.assign(window,{Faq,Footer});
