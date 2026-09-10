const tstTones={
  success:{bd:'var(--success-border)',fg:'var(--success)'},
  danger:{bd:'var(--danger-border)',fg:'var(--danger)'},
  warning:{bd:'var(--warning-border)',fg:'var(--warning)'},
  info:{bd:'var(--info-border)',fg:'var(--info)'}
};

export function Toast({tone='success',title,description,action,onDismiss,icon,style}){
  const t=tstTones[tone]||tstTones.info;
  return React.createElement('div',{role:'status',style:{display:'flex',gap:'var(--space-3)',alignItems:'flex-start',
    minWidth:'280px',maxWidth:'420px',padding:'var(--space-3) var(--space-4)',
    background:'var(--bg-raised)',border:'1px solid var(--border-default)',borderLeft:'2px solid '+t.bd,
    borderRadius:'var(--radius-md)',boxShadow:'var(--shadow-2)',
    animation:'tobot-fade-up var(--dur-base) var(--ease-out)',...style}},
    icon?React.createElement('span',{key:'i',style:{color:t.fg,display:'flex',marginTop:'1px'}},icon):null,
    React.createElement('div',{key:'c',style:{flex:1}},
      React.createElement('div',{key:'t',style:{fontSize:'var(--text-body-s)',fontWeight:600,color:'var(--text-primary)'}},title),
      description?React.createElement('div',{key:'d',style:{marginTop:'2px',fontSize:'var(--text-caption)',color:'var(--text-secondary)',lineHeight:1.5}},description):null,
      action?React.createElement('div',{key:'a',style:{marginTop:'var(--space-2)'}},action):null),
    onDismiss?React.createElement('button',{key:'x',type:'button','aria-label':'Dismiss',onClick:onDismiss,
      style:{all:'unset',cursor:'pointer',color:'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:'14px',lineHeight:1}},'\u00d7'):null);
}
