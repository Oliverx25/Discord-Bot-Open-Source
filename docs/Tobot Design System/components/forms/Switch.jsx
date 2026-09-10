export function Switch({checked=false,onChange,label,hint,size='md',disabled=false,style,...rest}){
  const w=size==='sm'?32:40, h=size==='sm'?18:22, k=h-6;
  const track={width:w+'px',height:h+'px',flexShrink:0,borderRadius:'var(--radius-pill)',
    background:checked?'var(--accent)':'var(--bg-inset)',
    border:'1px solid '+(checked?'var(--accent)':'var(--border-strong)'),
    position:'relative',transition:'background var(--dur-fast) var(--ease-standard),border-color var(--dur-fast) var(--ease-standard)'};
  const knob={position:'absolute',top:'2px',left:checked?(w-k-4)+'px':'2px',width:k+'px',height:k+'px',
    borderRadius:'var(--radius-pill)',background:checked?'var(--on-accent)':'var(--coal-400)',
    transition:'left var(--dur-fast) var(--ease-snap),background var(--dur-fast) var(--ease-standard)'};
  return React.createElement('label',{style:{display:'inline-flex',gap:'var(--space-3)',alignItems:'center',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.5:1,...style}},
    React.createElement('input',{key:'i',type:'checkbox',role:'switch',checked,disabled,onChange,style:{position:'absolute',opacity:0,width:0,height:0},...rest}),
    React.createElement('span',{key:'t',style:track,'aria-hidden':true},React.createElement('span',{style:knob})),
    label?React.createElement('span',{key:'l',style:{display:'flex',flexDirection:'column'}},
      React.createElement('span',{key:'a',style:{fontSize:'var(--text-body-s)',fontWeight:500,color:'var(--text-primary)'}},label),
      hint?React.createElement('span',{key:'b',style:{fontSize:'var(--text-caption)',color:'var(--text-muted)'}},hint):null):null);
}
