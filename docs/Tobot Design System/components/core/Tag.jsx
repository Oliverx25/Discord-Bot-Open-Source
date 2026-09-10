export function Tag({children,onRemove,icon,mono=false,selected=false,onClick,style,...rest}){
  const [hover,setHover]=React.useState(false);
  const s={display:'inline-flex',alignItems:'center',gap:'var(--space-2)',height:'26px',padding:'0 8px',
    background:selected?'var(--bg-tint-agave)':'var(--bg-raised)',
    border:'1px solid '+(selected?'var(--secondary)':'var(--border-default)'),
    borderRadius:'var(--radius-sm)',color:selected?'var(--text-primary)':'var(--text-secondary)',
    fontFamily:mono?'var(--font-mono)':'var(--font-body)',fontSize:'var(--text-label)',fontWeight:mono?400:500,
    cursor:onClick?'pointer':'default',
    transition:'border-color var(--dur-fast) var(--ease-standard),background var(--dur-fast) var(--ease-standard)',
    ...(hover&&onClick?{borderColor:'var(--border-strong)'}:null),...style};
  return React.createElement('span',{style:s,onClick,onMouseEnter:()=>setHover(true),onMouseLeave:()=>setHover(false),...rest},
    icon,children,
    onRemove?React.createElement('button',{key:'x',type:'button','aria-label':'Remove',onClick:e=>{e.stopPropagation();onRemove(e)},
      style:{all:'unset',cursor:'pointer',lineHeight:1,padding:'0 1px',color:'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:'13px'}},'\u00d7'):null);
}
