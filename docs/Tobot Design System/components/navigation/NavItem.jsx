export function NavItem({icon,label,active=false,badge,collapsed=false,onClick,style,...rest}){
  const [hover,setHover]=React.useState(false);
  const s={display:'flex',alignItems:'center',gap:'var(--space-3)',width:'100%',
    height:'34px',padding:collapsed?'0':'0 10px',justifyContent:collapsed?'center':'flex-start',
    background:active?'var(--bg-tint-accent)':hover?'var(--bg-hover)':'transparent',
    border:'1px solid transparent',borderLeft:'2px solid '+(active?'var(--accent)':'transparent'),
    borderRadius:'var(--radius-sm)',cursor:'pointer',
    color:active?'var(--text-primary)':'var(--text-secondary)',
    fontFamily:'var(--font-body)',fontSize:'var(--text-body-s)',fontWeight:active?600:500,
    transition:'background var(--dur-fast) var(--ease-standard),color var(--dur-fast) var(--ease-standard)',...style};
  return React.createElement('button',{type:'button',onClick,style:s,'aria-current':active||undefined,
    onMouseEnter:()=>setHover(true),onMouseLeave:()=>setHover(false),...rest},
    icon?React.createElement('span',{key:'i',style:{display:'flex',color:active?'var(--text-accent)':'var(--text-muted)',flexShrink:0}},icon):null,
    collapsed?null:React.createElement('span',{key:'l',style:{flex:1,textAlign:'left'}},label),
    !collapsed&&badge?React.createElement('span',{key:'b',style:{flexShrink:0}},badge):null);
}
