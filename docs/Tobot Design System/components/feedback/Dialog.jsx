export function Dialog({open=true,title,description,children,footer,onClose,width=460,tone='default'}){
  if(!open) return null;
  const scrim={position:'fixed',inset:0,background:'rgba(5,7,5,.75)',display:'flex',alignItems:'center',justifyContent:'center',padding:'var(--space-6)',zIndex:60};
  const panel={width:width+'px',maxWidth:'100%',
    backgroundColor:'var(--bg-raised)',
    backgroundImage:'radial-gradient(circle at 1px 1px,var(--bg-raised) 1.1px,transparent 1.2px),linear-gradient(135deg,rgba(198,255,61,.12),rgba(198,255,61,0) 62%)',
    backgroundSize:'3px 3px,100% 100%',backgroundRepeat:'repeat,no-repeat',
    border:'1px solid '+(tone==='danger'?'var(--danger-border)':'var(--border-default)'),
    borderRadius:'var(--radius-xl)',boxShadow:'var(--shadow-3)',
    animation:'tobot-fade-up var(--dur-base) var(--ease-out)'};
  return React.createElement('div',{style:scrim,onClick:onClose},
    React.createElement('div',{role:'dialog','aria-modal':true,style:panel,onClick:e=>e.stopPropagation()},
      React.createElement('div',{key:'h',style:{padding:'var(--space-6) var(--space-6) var(--space-4)'}},
        React.createElement('div',{key:'t',style:{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'var(--text-h3)',letterSpacing:'-.01em',color:'var(--text-primary)'}},title),
        description?React.createElement('div',{key:'d',style:{marginTop:'var(--space-2)',fontSize:'var(--text-body-s)',color:'var(--text-secondary)',lineHeight:1.6}},description):null),
      children?React.createElement('div',{key:'b',style:{padding:'0 var(--space-6) var(--space-4)'}},children):null,
      footer?React.createElement('div',{key:'f',style:{display:'flex',justifyContent:'flex-end',gap:'var(--space-3)',padding:'var(--space-4) var(--space-6) var(--space-6)',borderTop:'1px solid var(--border-subtle)',marginTop:'var(--space-2)'}},footer):null));
}
