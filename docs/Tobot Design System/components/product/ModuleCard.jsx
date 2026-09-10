export function ModuleCard({name,description,icon,enabled=false,tier='free',stat,onToggle,onOpen,locked=false,celebrate=false,layout='card',index,style}){
  const [hover,setHover]=React.useState(false);
  const [down,setDown]=React.useState(false);
  const shadow=enabled?'var(--acid-800)':'var(--border-subtle)';
  const handlers={
    onClick:onOpen,
    onMouseEnter:()=>setHover(true),
    onMouseLeave:()=>{setHover(false);setDown(false)},
    onMouseDown:()=>setDown(true),
    onMouseUp:()=>setDown(false)
  };

  const badge=tier==='pro'?React.createElement('span',{key:'b',style:{display:'inline-flex',alignItems:'center',height:'17px',padding:'0 6px',
    borderRadius:'var(--radius-pill)',background:'var(--accent)',color:'var(--on-accent)',
    fontFamily:'var(--font-mono)',fontSize:'9px',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase'}},'Pro'):null;

  if(layout==='row'){
    const rowStyle={display:'grid',gridTemplateColumns:'26px 30px minmax(0,1fr) minmax(0,1.1fr) 190px 42px',gap:'var(--space-4)',
      alignItems:'center',padding:'11px var(--space-4)',borderBottom:'1px solid var(--border-subtle)',
      background:hover&&onOpen?'var(--bg-hover)':enabled?'transparent':'rgba(0,0,0,.18)',
      cursor:onOpen?'pointer':'default',opacity:locked?.75:1,
      transition:'background var(--dur-fast) var(--ease-standard)',...style};
    return React.createElement('div',{style:rowStyle,onClick:onOpen,onMouseEnter:()=>setHover(true),onMouseLeave:()=>setHover(false)},
      React.createElement('span',{key:'n',style:{fontFamily:'var(--font-mono)',fontSize:'11px',color:enabled?'var(--accent)':'var(--text-muted)'}},
        index!=null?String(index).padStart(2,'0'):''),
      React.createElement('span',{key:'i',style:{display:'flex',color:enabled?'var(--text-accent)':'var(--text-muted)'}},icon),
      React.createElement('span',{key:'t',style:{display:'flex',alignItems:'center',gap:'var(--space-2)',minWidth:0}},
        React.createElement('b',{style:{fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:700,
          color:enabled?'var(--text-primary)':'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},name),badge),
      React.createElement('span',{key:'d',style:{fontSize:'var(--text-caption)',color:'var(--text-muted)',
        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},description),
      React.createElement('span',{key:'s',style:{fontFamily:'var(--font-mono)',fontSize:'var(--text-mono-s)',
        color:enabled?'var(--text-secondary)':'var(--text-muted)'}},stat),
      React.createElement('span',{key:'w',onClick:e=>e.stopPropagation(),style:{display:'flex',justifyContent:'flex-end'}},onToggle));
  }

  const cardStyle={display:'flex',flexDirection:'column',gap:'var(--space-3)',padding:'var(--space-4)',
    background:'var(--bg-surface)',
    border:'1px solid '+(enabled?'var(--accent)':'var(--border-default)'),
    borderRadius:'var(--radius-lg)',cursor:onOpen?'pointer':'default',opacity:locked?.75:1,
    boxShadow:'4px 4px 0 '+shadow,
    transition:'transform 90ms cubic-bezier(.2,.9,.1,1),box-shadow 90ms cubic-bezier(.2,.9,.1,1),border-color var(--dur-fast) var(--ease-standard)',
    ...(hover&&onOpen?{transform:'translate(2px,2px)',boxShadow:'2px 2px 0 '+shadow}:null),
    ...(down&&onOpen?{transform:'translate(4px,4px)',boxShadow:'0 0 0 '+shadow}:null),
    ...style};

  return React.createElement('div',{style:cardStyle,...handlers},
    React.createElement('div',{key:'r',style:{display:'flex',alignItems:'flex-start',gap:'var(--space-3)'}},
      React.createElement('span',{key:'i',style:{position:'relative',display:'flex',alignItems:'center',justifyContent:'center',
        width:'34px',height:'34px',flexShrink:0,borderRadius:'var(--radius-sm)',
        background:enabled?'var(--accent)':'var(--bg-inset)',
        border:'1px solid '+(enabled?'var(--accent)':'var(--border-subtle)'),
        color:enabled?'var(--on-accent)':'var(--text-muted)'}},
        celebrate?React.createElement('span',{key:'s','aria-hidden':'true',style:{position:'absolute',top:'-9px',right:'-7px',
          fontFamily:'var(--font-mono)',fontSize:'13px',color:'var(--accent)',
          animation:'tobot-spark var(--dur-celebrate) var(--ease-spring) forwards'}},'\u2726'):null,
        icon),
      React.createElement('div',{key:'t',style:{flex:1,minWidth:0}},
        React.createElement('div',{key:'n',style:{display:'flex',alignItems:'center',gap:'var(--space-2)'}},
          React.createElement('span',{style:{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'16px',letterSpacing:'-.01em',color:'var(--text-primary)'}},name),badge),
        React.createElement('div',{key:'d',style:{marginTop:'3px',fontSize:'var(--text-caption)',color:'var(--text-secondary)',lineHeight:1.5}},description))),
    React.createElement('div',{key:'f',style:{display:'flex',alignItems:'center',justifyContent:'space-between',
      borderTop:'1px solid var(--border-subtle)',paddingTop:'11px'}},
      React.createElement('span',{key:'s',style:{fontFamily:'var(--font-mono)',fontSize:'var(--text-mono-s)',
        color:enabled?'var(--text-secondary)':'var(--text-muted)'}},stat),
      React.createElement('span',{key:'w',onClick:e=>e.stopPropagation(),style:{display:'flex',alignItems:'center',gap:'var(--space-2)'}},
        React.createElement('span',{key:'o',style:{fontFamily:'var(--font-mono)',fontSize:'9px',letterSpacing:'.14em',
          color:enabled?'var(--accent)':'var(--text-muted)'}},enabled?'ON':'OFF'),
        onToggle)));
}
