export function Input({value,defaultValue,onChange,placeholder,label,hint,error,prefix,suffix,size='md',mono=false,disabled=false,multiline=false,rows=3,id,style,...rest}){
  const [focus,setFocus]=React.useState(false);
  const heights={sm:'30px',md:'38px',lg:'44px'};
  const wrap={display:'flex',alignItems:'center',gap:'var(--space-2)',
    background:'var(--bg-inset)',border:'1px solid '+(error?'var(--danger-border)':focus?'var(--accent)':'var(--border-default)'),
    borderRadius:'var(--radius-md)',padding:'0 10px',
    height:multiline?'auto':heights[size],opacity:disabled?.5:1,
    transition:'border-color var(--dur-fast) var(--ease-standard),box-shadow var(--dur-fast) var(--ease-standard)',
    boxShadow:focus&&!error?'0 0 0 3px var(--bg-tint-accent)':'none'};
  const field={all:'unset',flex:1,minWidth:0,color:'var(--text-primary)',
    fontFamily:mono?'var(--font-mono)':'var(--font-body)',
    fontSize:size==='sm'?'var(--text-label)':'var(--text-body-s)',lineHeight:1.5,
    padding:multiline?'8px 0':'0',resize:'vertical'};
  return React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:'var(--space-2)',...style}},
    label?React.createElement('label',{key:'l',htmlFor:id,style:{fontSize:'var(--text-label)',fontWeight:600,color:'var(--text-secondary)',letterSpacing:'var(--ls-label)'}},label):null,
    React.createElement('div',{key:'w',style:wrap},
      prefix?React.createElement('span',{key:'p',style:{color:'var(--text-muted)',display:'flex',fontFamily:'var(--font-mono)',fontSize:'var(--text-mono-s)'}},prefix):null,
      React.createElement(multiline?'textarea':'input',{key:'f',id,value,defaultValue,onChange,placeholder,disabled,rows:multiline?rows:undefined,style:field,
        onFocus:()=>setFocus(true),onBlur:()=>setFocus(false),...rest}),
      suffix?React.createElement('span',{key:'s',style:{color:'var(--text-muted)',display:'flex',fontSize:'var(--text-caption)'}},suffix):null),
    error||hint?React.createElement('span',{key:'h',style:{fontSize:'var(--text-caption)',color:error?'var(--danger)':'var(--text-muted)'}},error||hint):null);
}
