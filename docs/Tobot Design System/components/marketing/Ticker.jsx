export function Ticker({items=[],separator='\u2726',speed=26,tone='accent',height=30,style}){
  const text=items.length?items.join('  '+separator+'  ')+'  '+separator+'  ':'';
  const run=text.repeat(3);
  const tones={
    accent:{background:'var(--accent)',color:'var(--on-accent)'},
    inverse:{background:'var(--bg-inset)',color:'var(--text-accent)'},
    quiet:{background:'var(--bg-surface)',color:'var(--text-muted)'}
  };
  return React.createElement('div',{style:{height:height+'px',display:'flex',alignItems:'center',overflow:'hidden',
    borderTop:'1px solid var(--border-subtle)',borderBottom:'1px solid var(--border-subtle)',...tones[tone],...style}},
    React.createElement('div',{style:{display:'flex',gap:'36px',whiteSpace:'nowrap',
      fontFamily:'var(--font-mono)',fontSize:'11px',fontWeight:700,letterSpacing:'.14em',textTransform:'uppercase',
      animation:'tobot-ticker '+speed+'s linear infinite'}},
      React.createElement('span',{key:'a'},run),React.createElement('span',{key:'b'},run)));
}
