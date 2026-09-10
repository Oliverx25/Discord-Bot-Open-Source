const TO_FACES={
  idle:['  ┌───────────┐','  │  ◕   ◕  │','  │     ▿     │','  └──┬───┬──┘','     ╰───╯'],
  work:['  ┌───────────┐','  │  ◔   ◔  │','  │    ═══    │','  └──┬───┬──┘','     ╰───╯'],
  ok:['  ┌───────────┐','  │  ^   ^  │','  │     ‿     │','  └──┬───┬──┘','     ╰───╯'],
  alert:['  ┌───────────┐','  │  ◉   ◉  │','  │     ◇     │','  └──┬───┬──┘','     ╰───╯'],
  sleep:['  ┌───────────┐','  │  ─   ─  │','  │     ·     │','  └──┬───┬──┘','     ╰───╯']
};

export function EmptyState({title,description,action,secondaryAction,mood='idle',mascot=true,celebrate=false,compact=false,style}){
  return React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',
    gap:'var(--space-4)',padding:compact?'var(--space-8)':'var(--space-12) var(--space-8)',...style}},
    mascot?React.createElement('div',{key:'m',style:{position:'relative'}},
      celebrate?React.createElement('span',{key:'s','aria-hidden':'true',style:{position:'absolute',top:'-6px',right:'14%',
        fontFamily:'var(--font-mono)',fontSize:'16px',color:'var(--accent)',
        animation:'tobot-spark var(--dur-celebrate) var(--ease-spring) forwards'}},'\u2726'):null,
      React.createElement('pre',{key:'f',style:{margin:0,fontFamily:'var(--font-mono)',fontSize:compact?'11px':'13px',
        lineHeight:1.25,color:'var(--accent)',textShadow:'0 0 18px rgba(198,255,61,.30)'}},(TO_FACES[mood]||TO_FACES.idle).join('\n'))):null,
    React.createElement('div',{key:'t',style:{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'var(--text-h3)',letterSpacing:'-.01em'}},title),
    description?React.createElement('p',{key:'d',style:{margin:0,maxWidth:'44ch',fontSize:'var(--text-body-s)',color:'var(--text-secondary)',lineHeight:1.6}},description):null,
    (action||secondaryAction)?React.createElement('div',{key:'a',style:{display:'flex',gap:'var(--space-3)',marginTop:'var(--space-2)'}},action,secondaryAction):null);
}
