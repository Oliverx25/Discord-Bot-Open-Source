const bdTones={
  neutral:{bg:'var(--bg-hover)',fg:'var(--text-secondary)',bd:'var(--border-default)'},
  accent:{bg:'var(--bg-tint-accent)',fg:'var(--text-accent)',bd:'var(--border-accent)'},
  success:{bg:'var(--success-bg)',fg:'var(--success)',bd:'var(--success-border)'},
  warning:{bg:'var(--warning-bg)',fg:'var(--warning)',bd:'var(--warning-border)'},
  danger:{bg:'var(--danger-bg)',fg:'var(--danger)',bd:'var(--danger-border)'},
  info:{bg:'var(--info-bg)',fg:'var(--info)',bd:'var(--info-border)'},
  free:{bg:'var(--bg-hover)',fg:'var(--text-secondary)',bd:'var(--border-strong)'},
  pro:{bg:'var(--accent)',fg:'var(--on-accent)',bd:'var(--accent)'}
};

export function Badge({children,tone='neutral',size='md',dot=false,uppercase=true,style,...rest}){
  const t=bdTones[tone];
  const sm=size==='sm';
  const s={display:'inline-flex',alignItems:'center',gap:'var(--space-1)',
    height:sm?'18px':'22px',padding:sm?'0 6px':'0 8px',
    background:t.bg,color:t.fg,border:'1px solid '+t.bd,borderRadius:'var(--radius-pill)',
    fontFamily:'var(--font-mono)',fontSize:sm?'10px':'11px',
    fontWeight:700,letterSpacing:uppercase?'var(--ls-overline)':'.01em',
    textTransform:uppercase?'uppercase':'none',whiteSpace:'nowrap',...style};
  return React.createElement('span',{style:s,...rest},
    dot?React.createElement('span',{key:'d',style:{width:'5px',height:'5px',borderRadius:'var(--radius-pill)',background:'currentColor'}}):null,
    children);
}
