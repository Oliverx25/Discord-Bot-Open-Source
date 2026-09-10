const alTone={
  info:{fg:'var(--info)',bd:'var(--info-border)',bg:'var(--info-bg)'},
  success:{fg:'var(--success)',bd:'var(--success-border)',bg:'var(--success-bg)'},
  warning:{fg:'var(--warning)',bd:'var(--warning-border)',bg:'var(--warning-bg)'},
  danger:{fg:'var(--danger)',bd:'var(--danger-border)',bg:'var(--danger-bg)'}
};

export function Alert({tone='info',title,children,icon,action,onDismiss,style}){
  const t=alTone[tone];
  return React.createElement('div',{role:'note',style:{display:'flex',gap:'var(--space-3)',alignItems:'flex-start',
    padding:'var(--space-3) var(--space-4)',background:t.bg,border:'1px solid '+t.bd,
    borderRadius:'var(--radius-md)',...style}},
    icon?React.createElement('span',{key:'i',style:{color:t.fg,display:'flex',marginTop:'2px'}},icon):null,
    React.createElement('div',{key:'c',style:{flex:1,minWidth:0}},
      title?React.createElement('div',{key:'t',style:{fontSize:'var(--text-body-s)',fontWeight:600,color:'var(--text-primary)'}},title):null,
      children?React.createElement('div',{key:'b',style:{marginTop:title?'2px':0,fontSize:'var(--text-caption)',color:'var(--text-secondary)',lineHeight:1.55}},children):null,
      action?React.createElement('div',{key:'a',style:{marginTop:'var(--space-3)'}},action):null),
    onDismiss?React.createElement('button',{key:'x',type:'button','aria-label':'Cerrar',onClick:onDismiss,
      style:{all:'unset',cursor:'pointer',color:'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:'14px',lineHeight:1}},'\u00d7'):null);
}
