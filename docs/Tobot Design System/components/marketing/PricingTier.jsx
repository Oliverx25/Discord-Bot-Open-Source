export function PricingTier({name,price,period='/mo',tagline,features=[],cta,featured=false,badge,note,style}){
  return React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:'var(--space-5)',
    padding:'var(--space-6)',borderRadius:'var(--radius-lg)',
    background:featured?'var(--bg-tint-accent)':'var(--bg-surface)',
    border:'1px solid '+(featured?'var(--accent)':'var(--border-subtle)'),...style}},
    React.createElement('div',{key:'h'},
      React.createElement('div',{key:'n',style:{display:'flex',alignItems:'center',gap:'var(--space-2)'}},
        React.createElement('span',{style:{fontFamily:'var(--font-mono)',fontSize:'11px',fontWeight:700,letterSpacing:'.14em',textTransform:'uppercase',color:featured?'var(--text-accent)':'var(--text-muted)'}},name),
        badge),
      React.createElement('div',{key:'p',style:{display:'flex',alignItems:'baseline',gap:'4px',marginTop:'var(--space-3)'}},
        React.createElement('span',{style:{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:'40px',lineHeight:1,color:'var(--text-primary)'}},price),
        React.createElement('span',{style:{fontFamily:'var(--font-mono)',fontSize:'12px',color:'var(--text-muted)'}},period)),
      tagline?React.createElement('p',{key:'t',style:{margin:'var(--space-3) 0 0',fontSize:'var(--text-body-s)',color:'var(--text-secondary)',lineHeight:1.55}},tagline):null),
    React.createElement('div',{key:'f',style:{display:'flex',flexDirection:'column',gap:'var(--space-2)',borderTop:'1px solid var(--border-subtle)',paddingTop:'var(--space-4)'}},
      features.map((ft,i)=>{
        const off=typeof ft==='object'&&ft.included===false;
        const label=typeof ft==='object'?ft.label:ft;
        return React.createElement('div',{key:i,style:{display:'flex',gap:'var(--space-3)',alignItems:'flex-start',
          fontSize:'var(--text-body-s)',color:off?'var(--text-muted)':'var(--text-secondary)'}},
          React.createElement('span',{key:'m',style:{fontFamily:'var(--font-mono)',fontSize:'11px',lineHeight:1.6,
            color:off?'var(--text-muted)':'var(--accent)'}},off?'\u2014':'\u2713'),
          React.createElement('span',{key:'l'},label));
      })),
    React.createElement('div',{key:'c',style:{marginTop:'auto',display:'flex',flexDirection:'column',gap:'var(--space-3)'}},
      cta,
      note?React.createElement('span',{style:{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-muted)',textAlign:'center'}},note):null));
}
