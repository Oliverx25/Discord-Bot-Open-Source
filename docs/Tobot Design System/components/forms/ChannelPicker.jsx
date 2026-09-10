export function ChannelPicker({label,hint,options=[],value=[],onChange,kind='channel',placeholder='Buscar…',multiple=true,max,disabled=false,style}){
  const [q,setQ]=React.useState('');
  const [open,setOpen]=React.useState(false);
  const ref=React.useRef(null);
  const sigil=kind==='role'?'@':kind==='channel'?'#':'';
  React.useEffect(()=>{
    if(!open) return;
    const h=e=>{if(ref.current&&!ref.current.contains(e.target)) setOpen(false)};
    document.addEventListener('mousedown',h);
    return ()=>document.removeEventListener('mousedown',h);
  });
  const picked=options.filter(o=>value.includes(o.value));
  const list=options.filter(o=>!value.includes(o.value)&&o.label.toLowerCase().includes(q.toLowerCase()));
  const add=v=>{if(max&&value.length>=max) return; onChange&&onChange(multiple?[...value,v]:[v]); setQ('')};
  const remove=v=>onChange&&onChange(value.filter(x=>x!==v));
  return React.createElement('div',{ref,style:{display:'flex',flexDirection:'column',gap:'var(--space-2)',position:'relative',...style}},
    label?React.createElement('label',{key:'l',style:{fontSize:'var(--text-label)',fontWeight:600,color:'var(--text-secondary)'}},label):null,
    React.createElement('div',{key:'w',onClick:()=>!disabled&&setOpen(true),
      style:{display:'flex',flexWrap:'wrap',gap:'6px',alignItems:'center',minHeight:'38px',padding:'5px 8px',
        background:'var(--bg-inset)',border:'1px solid '+(open?'var(--accent)':'var(--border-default)'),
        borderRadius:'var(--radius-md)',cursor:disabled?'not-allowed':'text',opacity:disabled?.5:1,
        boxShadow:open?'0 0 0 3px var(--bg-tint-accent)':'none',
        transition:'border-color var(--dur-fast) var(--ease-standard)'}},
      picked.map(o=>React.createElement('span',{key:o.value,
        style:{display:'inline-flex',alignItems:'center',gap:'6px',height:'24px',padding:'0 7px',
          background:'var(--bg-raised)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-sm)',
          fontFamily:'var(--font-mono)',fontSize:'var(--text-label)',color:'var(--text-primary)'}},
        React.createElement('span',{key:'s',style:{color:'var(--text-muted)'}},sigil),o.label,
        React.createElement('button',{key:'x',type:'button','aria-label':'Quitar',onClick:e=>{e.stopPropagation();remove(o.value)},
          style:{all:'unset',cursor:'pointer',color:'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:'12px'}},'\u00d7'))),
      React.createElement('input',{key:'i',value:q,disabled,placeholder:picked.length?'':placeholder,
        onChange:e=>{setQ(e.target.value);setOpen(true)},onFocus:()=>setOpen(true),
        style:{all:'unset',flex:1,minWidth:'70px',fontFamily:'var(--font-mono)',fontSize:'var(--text-label)',color:'var(--text-primary)'}})),
    open&&list.length?React.createElement('div',{key:'d',role:'listbox',
      style:{position:'absolute',top:'100%',left:0,right:0,zIndex:60,marginTop:'4px',maxHeight:'168px',overflowY:'auto',
        padding:'4px',background:'var(--bg-raised)',border:'1px solid var(--border-default)',
        borderRadius:'var(--radius-md)',boxShadow:'var(--shadow-2)',animation:'tobot-fade-up var(--dur-fast) var(--ease-out)'}},
      list.map(o=>React.createElement(PickerOption,{key:o.value,option:o,sigil,onPick:()=>add(o.value)}))):null,
    hint?React.createElement('span',{key:'h',style:{fontSize:'var(--text-caption)',color:'var(--text-muted)'}},hint):null);
}

function PickerOption({option,sigil,onPick}){
  const [hover,setHover]=React.useState(false);
  return React.createElement('button',{type:'button',role:'option',onClick:onPick,
    onMouseEnter:()=>setHover(true),onMouseLeave:()=>setHover(false),
    style:{all:'unset',boxSizing:'border-box',display:'flex',alignItems:'center',gap:'8px',width:'100%',
      padding:'6px 8px',borderRadius:'var(--radius-sm)',cursor:'pointer',
      fontFamily:'var(--font-mono)',fontSize:'var(--text-label)',
      color:hover?'var(--text-primary)':'var(--text-secondary)',background:hover?'var(--bg-hover)':'transparent'}},
    React.createElement('span',{key:'s',style:{color:'var(--text-muted)'}},sigil),
    React.createElement('span',{key:'l',style:{flex:1}},option.label),
    option.meta?React.createElement('span',{key:'m',style:{fontSize:'10px',color:'var(--text-muted)'}},option.meta):null);
}
