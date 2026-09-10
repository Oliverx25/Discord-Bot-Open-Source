export function Accordion({items=[],defaultOpen=0,allowMultiple=false,style}){
  const [open,setOpen]=React.useState(allowMultiple?(defaultOpen>=0?[defaultOpen]:[]):defaultOpen);
  const isOpen=i=>allowMultiple?open.includes(i):open===i;
  const toggle=i=>allowMultiple
    ?setOpen(o=>o.includes(i)?o.filter(x=>x!==i):[...o,i])
    :setOpen(o=>o===i?-1:i);
  return React.createElement('div',{style:{borderTop:'1px solid var(--border-subtle)',...style}},
    items.map((it,i)=>React.createElement('div',{key:i,style:{borderBottom:'1px solid var(--border-subtle)'}},
      React.createElement('button',{type:'button','aria-expanded':isOpen(i),onClick:()=>toggle(i),
        style:{all:'unset',boxSizing:'border-box',cursor:'pointer',width:'100%',display:'flex',alignItems:'center',
          justifyContent:'space-between',gap:'var(--space-4)',padding:'var(--space-4) 0'}},
        React.createElement('span',{key:'q',style:{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'var(--text-h4)',color:'var(--text-primary)'}},it.title),
        React.createElement('span',{key:'i',style:{fontFamily:'var(--font-mono)',fontSize:'14px',color:isOpen(i)?'var(--accent)':'var(--text-muted)',transition:'color var(--dur-fast) var(--ease-standard)'}},isOpen(i)?'\u2212':'+')),
      isOpen(i)?React.createElement('div',{key:'a',style:{paddingBottom:'var(--space-4)',maxWidth:'62ch',
        fontSize:'var(--text-body-s)',color:'var(--text-secondary)',lineHeight:1.6,
        animation:'tobot-fade-up var(--dur-fast) var(--ease-out)'}},it.content):null)));
}
