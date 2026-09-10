export function Checkbox({checked=false,onChange,label,hint,disabled=false,indeterminate=false,style,...rest}){
  const box={width:'16px',height:'16px',flexShrink:0,borderRadius:'var(--radius-xs)',
    border:'1px solid '+(checked||indeterminate?'var(--accent)':'var(--border-strong)'),
    background:checked||indeterminate?'var(--accent)':'var(--bg-inset)',
    display:'flex',alignItems:'center',justifyContent:'center',
    color:'var(--on-accent)',fontSize:'11px',fontWeight:700,lineHeight:1,
    transition:'background var(--dur-fast) var(--ease-standard),border-color var(--dur-fast) var(--ease-standard)'};
  return React.createElement('label',{style:{display:'flex',gap:'var(--space-3)',alignItems:'flex-start',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.5:1,...style}},
    React.createElement('input',{key:'i',type:'checkbox',checked,onChange,disabled,style:{position:'absolute',opacity:0,width:0,height:0},...rest}),
    React.createElement('span',{key:'b',style:box,'aria-hidden':true},indeterminate?'\u2013':checked?'\u2713':''),
    label?React.createElement('span',{key:'l',style:{display:'flex',flexDirection:'column',gap:'2px'}},
      React.createElement('span',{key:'t',style:{fontSize:'var(--text-body-s)',color:'var(--text-primary)'}},label),
      hint?React.createElement('span',{key:'h',style:{fontSize:'var(--text-caption)',color:'var(--text-muted)'}},hint):null):null);
}
