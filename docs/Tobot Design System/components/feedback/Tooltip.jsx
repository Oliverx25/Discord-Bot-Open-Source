export function Tooltip({label,children,side='top',mono=false,style}){
  const [open,setOpen]=React.useState(false);
  const pos={
    top:{bottom:'calc(100% + 6px)',left:'50%',transform:'translateX(-50%)'},
    bottom:{top:'calc(100% + 6px)',left:'50%',transform:'translateX(-50%)'},
    left:{right:'calc(100% + 6px)',top:'50%',transform:'translateY(-50%)'},
    right:{left:'calc(100% + 6px)',top:'50%',transform:'translateY(-50%)'}
  }[side];
  return React.createElement('span',{style:{position:'relative',display:'inline-flex',...style},
    onMouseEnter:()=>setOpen(true),onMouseLeave:()=>setOpen(false),onFocus:()=>setOpen(true),onBlur:()=>setOpen(false)},
    children,
    open?React.createElement('span',{key:'t',role:'tooltip',style:{position:'absolute',...pos,zIndex:50,
      padding:'5px 8px',background:'var(--coal-800)',color:'var(--coal-50)',
      border:'1px solid var(--border-strong)',borderRadius:'var(--radius-sm)',
      fontFamily:mono?'var(--font-mono)':'var(--font-body)',fontSize:'var(--text-caption)',fontWeight:500,
      whiteSpace:'nowrap',boxShadow:'var(--shadow-2)',pointerEvents:'none',
      animation:'tobot-fade-up var(--dur-fast) var(--ease-out)'}},label):null);
}
