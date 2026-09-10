const TZ=[
  {value:'Europe/Madrid',label:'Europe/Madrid',offset:'UTC+2'},
  {value:'Europe/London',label:'Europe/London',offset:'UTC+1'},
  {value:'America/Mexico_City',label:'America/Mexico_City',offset:'UTC-6'},
  {value:'America/Bogota',label:'America/Bogota',offset:'UTC-5'},
  {value:'America/Argentina/Buenos_Aires',label:'America/Buenos_Aires',offset:'UTC-3'},
  {value:'America/New_York',label:'America/New_York',offset:'UTC-4'},
  {value:'America/Los_Angeles',label:'America/Los_Angeles',offset:'UTC-7'},
  {value:'Asia/Tokyo',label:'Asia/Tokyo',offset:'UTC+9'}
];

export function TimezoneSelect({value,onChange,label='Zona horaria',hint,zones=TZ,preview,disabled=false,style}){
  const z=zones.find(t=>t.value===value);
  return React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:'var(--space-2)',...style}},
    label?React.createElement('label',{key:'l',style:{fontSize:'var(--text-label)',fontWeight:600,color:'var(--text-secondary)'}},label):null,
    React.createElement('div',{key:'w',style:{display:'flex',gap:'var(--space-2)',alignItems:'stretch'}},
      React.createElement('select',{key:'s',value:value||'',disabled,onChange:e=>onChange&&onChange(e.target.value),
        style:{appearance:'none',flex:1,height:'38px',padding:'0 30px 0 10px',background:'var(--bg-inset)',
          color:'var(--text-primary)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-md)',
          fontFamily:'var(--font-mono)',fontSize:'var(--text-label)',cursor:disabled?'not-allowed':'pointer',outline:'none'}},
        zones.map(t=>React.createElement('option',{key:t.value,value:t.value},t.label+'  '+t.offset))),
      React.createElement('span',{key:'o',style:{display:'inline-flex',alignItems:'center',padding:'0 10px',
        background:'var(--bg-raised)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-md)',
        fontFamily:'var(--font-mono)',fontSize:'var(--text-label)',color:'var(--text-accent)'}},z?z.offset:'—')),
    preview?React.createElement('span',{key:'p',style:{fontFamily:'var(--font-mono)',fontSize:'var(--text-caption)',color:'var(--text-muted)'}},preview):null,
    hint?React.createElement('span',{key:'h',style:{fontSize:'var(--text-caption)',color:'var(--text-muted)'}},hint):null);
}
