const ibSizes={sm:'28px',md:'34px',lg:'40px'};
const ibVariants={
  ghost:{background:'transparent',color:'var(--text-secondary)',borderColor:'transparent'},
  outline:{background:'var(--bg-surface)',color:'var(--text-primary)',borderColor:'var(--border-default)',boxShadow:'var(--shadow-hard-neutral)'},
  solid:{background:'var(--accent)',color:'var(--on-accent)',borderColor:'var(--accent)',boxShadow:'var(--shadow-hard)'}
};

export function IconButton({icon,label,variant='ghost',size='md',disabled=false,active=false,onClick,style,...rest}){
  const [hover,setHover]=React.useState(false);
  const d=ibSizes[size];
  const s={display:'inline-flex',alignItems:'center',justifyContent:'center',width:d,height:d,
    border:'1px solid transparent',borderRadius:'var(--radius-md)',cursor:disabled?'not-allowed':'pointer',
    opacity:disabled?.4:1,transition:'background var(--dur-fast) var(--ease-standard),color var(--dur-fast) var(--ease-standard)',
    ...ibVariants[variant],
    ...(active?{background:'var(--bg-tint-accent)',color:'var(--text-accent)'}:null),
    ...(hover&&!disabled?{background:variant==='solid'?'var(--accent-hover)':'var(--bg-hover)',color:variant==='solid'?'var(--on-accent)':'var(--text-primary)'}:null),
    ...style};
  return React.createElement('button',{type:'button','aria-label':label,title:label,disabled,onClick,style:s,
    onMouseEnter:()=>setHover(true),onMouseLeave:()=>setHover(false),...rest},icon);
}
