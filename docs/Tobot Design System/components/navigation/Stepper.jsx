export function Stepper({steps=[],current=0,orientation='horizontal',onStepClick,style}){
  const row=orientation==='horizontal';
  return React.createElement('div',{style:{display:'flex',flexDirection:row?'row':'column',
    alignItems:row?'center':'stretch',gap:row?'var(--space-3)':'var(--space-2)',...style}},
    steps.map((s,i)=>{
      const done=i<current, now=i===current;
      const mark={width:'22px',height:'22px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
        borderRadius:'var(--radius-sm)',fontFamily:'var(--font-mono)',fontSize:'11px',fontWeight:700,
        background:now?'var(--accent)':done?'var(--bg-tint-accent)':'var(--bg-inset)',
        color:now?'var(--on-accent)':done?'var(--text-accent)':'var(--text-muted)',
        border:'1px solid '+(now||done?'var(--accent)':'var(--border-default)')};
      return React.createElement(React.Fragment,{key:i},
        React.createElement('button',{type:'button',onClick:onStepClick?()=>onStepClick(i):undefined,
          style:{all:'unset',display:'flex',alignItems:'center',gap:'var(--space-3)',
            cursor:onStepClick?'pointer':'default'}},
          React.createElement('span',{key:'m',style:mark},done?'\u2713':String(i+1)),
          React.createElement('span',{key:'l',style:{fontSize:'var(--text-body-s)',fontWeight:now?600:400,
            color:now?'var(--text-primary)':done?'var(--text-secondary)':'var(--text-muted)'}},typeof s==='string'?s:s.label)),
        i<steps.length-1?React.createElement('span',{key:'r',style:row
          ?{flex:1,height:'1px',background:i<current?'var(--accent)':'var(--border-default)',minWidth:'16px'}
          :{width:'1px',height:'14px',marginLeft:'11px',background:i<current?'var(--accent)':'var(--border-default)'}}):null);
    }));
}
