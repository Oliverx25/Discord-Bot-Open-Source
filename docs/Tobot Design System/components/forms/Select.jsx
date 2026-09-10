export function Select({value,onChange,options=[],label,hint,placeholder='Select…',size='md',disabled=false,id,style,...rest}){
  const [focus,setFocus]=React.useState(false);
  const heights={sm:'30px',md:'38px',lg:'44px'};
  const s={appearance:'none',width:'100%',height:heights[size],padding:'0 30px 0 10px',
    background:'var(--bg-inset)',color:value?'var(--text-primary)':'var(--text-muted)',
    border:'1px solid '+(focus?'var(--accent)':'var(--border-default)'),borderRadius:'var(--radius-md)',
    fontFamily:'var(--font-body)',fontSize:size==='sm'?'var(--text-label)':'var(--text-body-s)',
    cursor:disabled?'not-allowed':'pointer',opacity:disabled?.5:1,outline:'none',
    transition:'border-color var(--dur-fast) var(--ease-standard)'};
  return React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:'var(--space-2)',...style}},
    label?React.createElement('label',{key:'l',htmlFor:id,style:{fontSize:'var(--text-label)',fontWeight:600,color:'var(--text-secondary)'}},label):null,
    React.createElement('div',{key:'w',style:{position:'relative'}},
      React.createElement('select',{key:'s',id,value,onChange,disabled,style:s,onFocus:()=>setFocus(true),onBlur:()=>setFocus(false),...rest},
        React.createElement('option',{key:'ph',value:'',disabled:true},placeholder),
        options.map(o=>React.createElement('option',{key:o.value,value:o.value},o.label))),
      React.createElement('span',{key:'c',style:{position:'absolute',right:'10px',top:0,height:'100%',display:'flex',alignItems:'center',color:'var(--text-muted)',pointerEvents:'none',fontSize:'10px'}},'\u25be')),
    hint?React.createElement('span',{key:'h',style:{fontSize:'var(--text-caption)',color:'var(--text-muted)'}},hint):null);
}
