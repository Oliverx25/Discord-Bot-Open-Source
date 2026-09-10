export function Menu({trigger,items=[],align='left',width=200,open:openProp,onOpenChange,style}){
  const [openState,setOpen]=React.useState(false);
  const open=openProp!==undefined?openProp:openState;
  const set=v=>{onOpenChange?onOpenChange(v):setOpen(v)};
  const ref=React.useRef(null);
  React.useEffect(()=>{
    if(!open) return;
    const h=e=>{if(ref.current&&!ref.current.contains(e.target)) set(false)};
    document.addEventListener('mousedown',h);
    return ()=>document.removeEventListener('mousedown',h);
  });
  return React.createElement('div',{ref,style:{position:'relative',display:'inline-flex',...style}},
    React.createElement('span',{key:'t',onClick:()=>set(!open),style:{display:'inline-flex'}},trigger),
    open?React.createElement('div',{key:'m',role:'menu',style:{position:'absolute',top:'calc(100% + 6px)',
      [align==='right'?'right':'left']:0,zIndex:60,width:width+'px',padding:'4px',
      background:'var(--bg-raised)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-md)',
      boxShadow:'var(--shadow-2)',animation:'tobot-fade-up var(--dur-fast) var(--ease-out)'}},
      items.map((it,i)=>it.separator
        ?React.createElement('div',{key:i,style:{height:'1px',background:'var(--border-subtle)',margin:'4px 0'}})
        :React.createElement(MenuItem,{key:i,item:it,onPick:()=>{set(false);it.onSelect&&it.onSelect()}}))
    ):null);
}

function MenuItem({item,onPick}){
  const [hover,setHover]=React.useState(false);
  const danger=item.tone==='danger';
  return React.createElement('button',{type:'button',role:'menuitem',disabled:item.disabled,onClick:onPick,
    onMouseEnter:()=>setHover(true),onMouseLeave:()=>setHover(false),
    style:{all:'unset',boxSizing:'border-box',display:'flex',alignItems:'center',gap:'var(--space-3)',width:'100%',
      padding:'7px 9px',borderRadius:'var(--radius-sm)',cursor:item.disabled?'not-allowed':'pointer',
      opacity:item.disabled?.4:1,fontSize:'var(--text-body-s)',
      color:danger?'var(--danger)':'var(--text-secondary)',
      background:hover&&!item.disabled?(danger?'var(--danger-bg)':'var(--bg-hover)'):'transparent'}},
    item.icon?React.createElement('span',{key:'i',style:{display:'flex',color:'inherit'}},item.icon):null,
    React.createElement('span',{key:'l',style:{flex:1}},item.label),
    item.shortcut?React.createElement('span',{key:'s',style:{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-muted)'}},item.shortcut):null);
}
