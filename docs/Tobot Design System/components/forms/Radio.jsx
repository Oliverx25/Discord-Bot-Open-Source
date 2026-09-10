export function Radio({options=[],value,onChange,name,label,direction='column',disabled=false,style}){
  return React.createElement('div',{role:'radiogroup','aria-label':typeof label==='string'?label:undefined,style:{display:'flex',flexDirection:'column',gap:'var(--space-3)',...style}},
    label?React.createElement('span',{key:'l',style:{fontSize:'var(--text-label)',fontWeight:600,color:'var(--text-secondary)'}},label):null,
    React.createElement('div',{key:'o',style:{display:'flex',flexDirection:direction,gap:direction==='row'?'var(--space-5)':'var(--space-3)'}},
      options.map(o=>{
        const on=value===o.value;
        return React.createElement('label',{key:o.value,style:{display:'flex',gap:'var(--space-3)',alignItems:'flex-start',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.5:1}},
          React.createElement('input',{key:'i',type:'radio',name,checked:on,disabled,onChange:()=>onChange&&onChange(o.value),style:{position:'absolute',opacity:0,width:0,height:0}}),
          React.createElement('span',{key:'d',style:{width:'16px',height:'16px',flexShrink:0,borderRadius:'var(--radius-pill)',
            border:'1px solid '+(on?'var(--accent)':'var(--border-strong)'),background:'var(--bg-inset)',
            display:'flex',alignItems:'center',justifyContent:'center',transition:'border-color var(--dur-fast) var(--ease-standard)'},'aria-hidden':true},
            on?React.createElement('span',{style:{width:'8px',height:'8px',borderRadius:'var(--radius-pill)',background:'var(--accent)'}}):null),
          React.createElement('span',{key:'t',style:{display:'flex',flexDirection:'column',gap:'2px'}},
            React.createElement('span',{key:'a',style:{fontSize:'var(--text-body-s)',color:'var(--text-primary)'}},o.label),
            o.hint?React.createElement('span',{key:'b',style:{fontSize:'var(--text-caption)',color:'var(--text-muted)'}},o.hint):null));
      })));
}
