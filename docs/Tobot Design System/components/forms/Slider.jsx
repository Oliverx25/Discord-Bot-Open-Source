export function Slider({value=0,min=0,max=100,step=1,label,valueLabel,unit,onChange,disabled=false,ticks,style}){
  const pct=((value-min)/(max-min))*100;
  return React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:'var(--space-3)',...style}},
    (label||valueLabel!==undefined)?React.createElement('div',{key:'l',style:{display:'flex',justifyContent:'space-between',alignItems:'baseline'}},
      React.createElement('span',{key:'a',style:{fontFamily:'var(--font-mono)',fontSize:'10px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-muted)',fontWeight:700}},label),
      React.createElement('span',{key:'b',style:{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:'var(--text-h3)',color:'var(--text-primary)'}},
        (valueLabel!==undefined?valueLabel:value),
        unit?React.createElement('span',{style:{fontSize:'11px',color:'var(--text-muted)',marginLeft:'4px'}},unit):null)):null,
    React.createElement('input',{key:'i',type:'range',min,max,step,value,disabled,
      onChange:e=>onChange&&onChange(Number(e.target.value)),
      style:{width:'100%',accentColor:'var(--accent)',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.5:1,
        background:'linear-gradient(to right,var(--accent) '+pct+'%,var(--bg-inset) '+pct+'%)',height:'4px',borderRadius:'var(--radius-pill)'}}),
    ticks?React.createElement('div',{key:'t',style:{display:'flex',justifyContent:'space-between',fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-muted)'}},
      ticks.map((t,i)=>React.createElement('span',{key:i},t))):null);
}
