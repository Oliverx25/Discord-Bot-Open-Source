export function Tabs({tabs=[],value,onChange,variant='underline',size='md',style}){
  const under=variant==='underline';
  const wrap={display:'flex',gap:under?'var(--space-5)':'var(--space-1)',
    borderBottom:under?'1px solid var(--border-subtle)':'none',
    background:under?'transparent':'var(--bg-inset)',
    padding:under?0:'3px',borderRadius:under?0:'var(--radius-md)',
    border:under?undefined:'1px solid var(--border-subtle)',...style};
  return React.createElement('div',{role:'tablist',style:wrap},
    tabs.map(t=>{
      const on=value===t.value;
      const s=under
        ?{padding:'0 0 10px',background:'none',border:'none',borderBottom:'2px solid '+(on?'var(--accent)':'transparent'),marginBottom:'-1px',color:on?'var(--text-primary)':'var(--text-muted)'}
        :{padding:'0 12px',height:size==='sm'?'26px':'30px',border:'1px solid '+(on?'var(--border-default)':'transparent'),
          background:on?'var(--bg-raised)':'transparent',borderRadius:'var(--radius-sm)',color:on?'var(--text-primary)':'var(--text-muted)'};
      return React.createElement('button',{key:t.value,type:'button',role:'tab','aria-selected':on,
        onClick:()=>onChange&&onChange(t.value),
        style:{display:'inline-flex',alignItems:'center',gap:'var(--space-2)',cursor:'pointer',
          fontFamily:'var(--font-body)',fontSize:size==='sm'?'var(--text-label)':'var(--text-body-s)',fontWeight:600,
          transition:'color var(--dur-fast) var(--ease-standard),border-color var(--dur-fast) var(--ease-standard)',...s}},
        t.icon,t.label,
        t.count!=null?React.createElement('span',{key:'c',style:{fontFamily:'var(--font-mono)',fontSize:'var(--text-overline)',color:'var(--text-muted)'}},t.count):null);
    }));
}
