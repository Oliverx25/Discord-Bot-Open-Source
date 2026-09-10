export function CommandPalette({open=true,commands=[],placeholder='Escribe un comando o busca un módulo…',onClose,onRun,hint='⌘K',style}){
  const [q,setQ]=React.useState('');
  const [i,setI]=React.useState(0);
  const list=commands.filter(c=>(c.label+' '+(c.group||'')).toLowerCase().includes(q.toLowerCase()));
  React.useEffect(()=>{setI(0)},[q]);
  if(!open) return null;
  const key=e=>{
    if(e.key==='ArrowDown'){e.preventDefault();setI(v=>Math.min(v+1,list.length-1))}
    if(e.key==='ArrowUp'){e.preventDefault();setI(v=>Math.max(v-1,0))}
    if(e.key==='Enter'&&list[i]){onRun&&onRun(list[i]);onClose&&onClose()}
    if(e.key==='Escape'){onClose&&onClose()}
  };
  return React.createElement('div',{onClick:onClose,style:{position:'fixed',inset:0,zIndex:80,
    background:'rgba(5,7,5,.75)',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:'12vh'}},
    React.createElement('div',{onClick:e=>e.stopPropagation(),role:'dialog',
      style:{width:'540px',maxWidth:'92vw',background:'var(--bg-raised)',border:'1px solid var(--border-default)',
        borderRadius:'var(--radius-xl)',boxShadow:'var(--shadow-3)',overflow:'hidden',
        animation:'tobot-fade-up var(--dur-base) var(--ease-out)',...style}},
      React.createElement('div',{key:'i',style:{display:'flex',alignItems:'center',gap:'var(--space-3)',
        padding:'var(--space-4)',borderBottom:'1px solid var(--border-subtle)'}},
        React.createElement('span',{key:'s',style:{fontFamily:'var(--font-mono)',color:'var(--accent)',fontSize:'13px'}},'>'),
        React.createElement('input',{key:'f',autoFocus:true,value:q,placeholder,onChange:e=>setQ(e.target.value),onKeyDown:key,
          style:{all:'unset',flex:1,fontFamily:'var(--font-mono)',fontSize:'var(--text-body-s)',color:'var(--text-primary)'}}),
        React.createElement('span',{key:'k',style:{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-muted)',
          border:'1px solid var(--border-default)',borderRadius:'var(--radius-xs)',padding:'2px 5px'}},hint)),
      React.createElement('div',{key:'l',style:{maxHeight:'320px',overflowY:'auto',padding:'6px'}},
        list.length?list.map((c,idx)=>React.createElement('div',{key:idx,onMouseEnter:()=>setI(idx),
          onClick:()=>{onRun&&onRun(c);onClose&&onClose()},
          style:{display:'flex',alignItems:'center',gap:'var(--space-3)',padding:'8px 10px',borderRadius:'var(--radius-sm)',
            cursor:'pointer',background:idx===i?'var(--bg-tint-accent)':'transparent',
            color:idx===i?'var(--text-primary)':'var(--text-secondary)'}},
          c.icon?React.createElement('span',{key:'ic',style:{display:'flex',color:idx===i?'var(--text-accent)':'var(--text-muted)'}},c.icon):null,
          React.createElement('span',{key:'lb',style:{flex:1,fontSize:'var(--text-body-s)'}},c.label),
          c.group?React.createElement('span',{key:'g',style:{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-muted)'}},c.group):null,
          c.shortcut?React.createElement('span',{key:'sc',style:{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-muted)'}},c.shortcut):null))
        :React.createElement('div',{style:{padding:'var(--space-6)',textAlign:'center',fontFamily:'var(--font-mono)',
          fontSize:'var(--text-mono-s)',color:'var(--text-muted)'}},'sin resultados para "'+q+'"')),
      React.createElement('div',{key:'f2',style:{display:'flex',gap:'var(--space-4)',padding:'8px var(--space-4)',
        borderTop:'1px solid var(--border-subtle)',fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-muted)'}},
        React.createElement('span',{key:'a'},'↑↓ navegar'),React.createElement('span',{key:'b'},'↵ ejecutar'),React.createElement('span',{key:'c'},'esc cerrar'))));
}
