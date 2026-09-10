export function Card({children,title,subtitle,actions,footer,padding='md',tone='default',interactive=false,style,...rest}){
  const [hover,setHover]=React.useState(false);
  const pads={none:'0',sm:'var(--space-3)',md:'var(--space-5)',lg:'var(--space-6)'};
  const tones={
    default:{background:'var(--bg-surface)',borderColor:'var(--border-subtle)'},
    raised:{background:'var(--bg-raised)',borderColor:'var(--border-default)',boxShadow:'var(--shadow-1)'},
    accent:{background:'var(--bg-tint-accent)',borderColor:'var(--border-accent)'},
    inset:{background:'var(--bg-inset)',borderColor:'var(--border-subtle)'}
  };
  const s={border:'1px solid',borderRadius:'var(--radius-lg)',color:'var(--text-primary)',
    transition:'border-color var(--dur-fast) var(--ease-standard),transform var(--dur-fast) var(--ease-out)',
    ...tones[tone],
    ...(interactive?{cursor:'pointer'}:null),
    ...(interactive&&hover?{borderColor:'var(--border-strong)',transform:'translateY(var(--lift-y))'}:null),
    ...style};
  const hasHeader=title||subtitle||actions;
  return React.createElement('div',{style:s,onMouseEnter:()=>setHover(true),onMouseLeave:()=>setHover(false),...rest},
    hasHeader?React.createElement('div',{key:'h',style:{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'var(--space-4)',padding:pads[padding],paddingBottom:children?'var(--space-3)':pads[padding]}},
      React.createElement('div',{key:'t'},
        title?React.createElement('div',{key:'t1',style:{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'var(--text-h4)',letterSpacing:'-.005em'}},title):null,
        subtitle?React.createElement('div',{key:'t2',style:{marginTop:'var(--space-1)',fontSize:'var(--text-body-s)',color:'var(--text-secondary)'}},subtitle):null),
      actions?React.createElement('div',{key:'a',style:{display:'flex',gap:'var(--space-2)',flexShrink:0}},actions):null):null,
    children?React.createElement('div',{key:'b',style:{padding:pads[padding],paddingTop:hasHeader?0:pads[padding]}},children):null,
    footer?React.createElement('div',{key:'f',style:{borderTop:'1px solid var(--border-subtle)',padding:pads[padding],display:'flex',alignItems:'center',gap:'var(--space-3)'}},footer):null
  );
}
