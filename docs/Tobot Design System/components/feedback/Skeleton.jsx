export function Skeleton({width='100%',height=12,radius='var(--radius-sm)',lines=1,gap=8,circle=false,style}){
  const one=(i)=>React.createElement('div',{key:i,style:{
    width:lines>1&&i===lines-1?'62%':(typeof width==='number'?width+'px':width),
    height:(circle?width:height)+(typeof height==='number'?'px':''),
    borderRadius:circle?'var(--radius-pill)':radius,
    background:'var(--bg-raised)',border:'1px solid var(--border-subtle)',
    animation:'tobot-skeleton 1.4s ease-in-out infinite',animationDelay:(i*120)+'ms'}});
  if(lines<=1) return React.createElement('div',{style:{...style}},one(0));
  return React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:gap+'px',...style}},
    Array.from({length:lines},(_,i)=>one(i)));
}
