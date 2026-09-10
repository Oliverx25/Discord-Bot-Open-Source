const btnBase={position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'var(--space-2)',fontFamily:'var(--font-mono)',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',border:'1px solid transparent',borderRadius:'var(--radius-md)',cursor:'pointer',whiteSpace:'nowrap',textDecoration:'none',transition:'transform 90ms cubic-bezier(.2,.9,.1,1),box-shadow 90ms cubic-bezier(.2,.9,.1,1),background var(--dur-fast) var(--ease-standard),color var(--dur-fast) var(--ease-standard),border-color var(--dur-fast) var(--ease-standard)'};

const btnSizes={
  sm:{height:'32px',padding:'0 12px',fontSize:'11px'},
  md:{height:'38px',padding:'0 18px',fontSize:'12px'},
  lg:{height:'46px',padding:'0 24px',fontSize:'13px'}
};

const btnVariants={
  primary:{background:'var(--accent)',color:'var(--on-accent)',borderColor:'var(--accent)',boxShadow:'var(--shadow-hard)'},
  secondary:{background:'transparent',color:'var(--text-primary)',borderColor:'var(--border-strong)',boxShadow:'var(--shadow-hard-neutral)'},
  ghost:{background:'transparent',color:'var(--text-secondary)',borderColor:'transparent',boxShadow:'none'},
  destructive:{background:'transparent',color:'var(--danger)',borderColor:'var(--danger-border)',boxShadow:'var(--shadow-hard-danger)'}
};

const btnHover={
  primary:{background:'var(--accent-hover)',borderColor:'var(--accent-hover)'},
  secondary:{color:'var(--text-accent)',borderColor:'var(--accent)'},
  ghost:{background:'var(--bg-hover)',color:'var(--text-primary)'},
  destructive:{background:'var(--danger-bg)'}
};

export function Button({variant='primary',size='md',children,iconLeft,iconRight,loading=false,disabled=false,fullWidth=false,as='button',onClick,href,type='button',style,...rest}){
  const [hover,setHover]=React.useState(false);
  const [down,setDown]=React.useState(false);
  const off=disabled||loading;
  const physical=variant!=='ghost';
  const half='calc(var(--press-offset)) ';
  const s={...btnBase,...btnSizes[size],...btnVariants[variant],
    ...(hover&&!off?btnHover[variant]:null),
    ...(hover&&!off&&physical?{transform:'translate(2px,2px)',boxShadow:variant==='primary'?'2px 2px 0 var(--accent-shadow)':variant==='destructive'?'2px 2px 0 var(--danger-shadow)':'2px 2px 0 var(--border-subtle)'}:null),
    ...(down&&!off&&physical?{transform:'translate(4px,4px)',boxShadow:'0 0 0 transparent'}:null),
    ...(down&&!off&&!physical?{transform:'scale(var(--press-scale))'}:null),
    ...(off?{opacity:.4,cursor:'not-allowed',boxShadow:'none'}:null),
    ...(fullWidth?{width:'100%'}:null),...style};
  const Tag=href?'a':as;
  return React.createElement(Tag,{
    style:s,onClick:off?undefined:onClick,href,type:Tag==='button'?type:undefined,
    disabled:Tag==='button'?off:undefined,'aria-busy':loading||undefined,
    onMouseEnter:()=>setHover(true),onMouseLeave:()=>{setHover(false);setDown(false)},
    onMouseDown:()=>setDown(true),onMouseUp:()=>setDown(false),...rest},
    loading?React.createElement(Spinner,{key:'sp'}):iconLeft,
    React.createElement('span',{key:'l'},children),
    iconRight
  );
}

function Spinner(){
  return React.createElement('span',{style:{width:'12px',height:'12px',borderRadius:'var(--radius-pill)',border:'2px solid currentColor',borderTopColor:'transparent',display:'inline-block',animation:'tobot-spin 620ms linear infinite'}});
}
