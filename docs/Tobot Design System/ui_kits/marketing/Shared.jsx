function Icon({n,s=16,c}){
  const r=React.useRef(null);
  React.useEffect(()=>{
    if(!r.current||!window.lucide)return;
    r.current.innerHTML='';
    const key=n.split('-').map(p=>p[0].toUpperCase()+p.slice(1)).join('');
    const def=lucide[key]; if(!def)return;
    const el=lucide.createElement(def);
    el.setAttribute('width',s);el.setAttribute('height',s);el.setAttribute('stroke-width',2);
    r.current.appendChild(el);
  },[n,s]);
  return <span ref={r} style={{display:'flex',color:c}}/>;
}
function Overline({children,style}){return <div className="ov" style={style}>{children}</div>}
function Section({children,style,id}){return <section id={id} style={{padding:'var(--section-y) 0',...style}}><div className="wrap">{children}</div></section>}
const MODULES=[['message-square','Embeds & messages','Visual builder, no JSON'],['image','Welcome cards','Canvas-rendered joins, bans, boosts'],['user-plus','Autoroles','Reaction, button and menu roles'],['scroll-text','Action logs','Per-channel routing and webhooks'],['shield-alert','Auto-mod','Filters with escalating punishment'],['timer','Auto-delete','Scheduled channel cleanup'],['clipboard-list','Forms','Interactive modals, answers to a channel'],['calendar-clock','Scheduled messages','Per-message timezone'],['terminal','Custom commands','Yours, not ours'],['trending-up','Levels','Text and voice XP'],['coins','Economy','Bank, jobs, shop'],['dices','Casino','Roulette, blackjack, coinflip'],['gavel','Moderation','Backed by Discord audit log'],['users-round','Role builder','Hierarchy without the fights'],['swords','Pokémon','PokéAPI and Smogon data'],['mouse-pointer-click','Buttons & menus','Components on any message'],['webhook','Webhooks','Fan out anywhere'],['bar-chart-3','Server stats','Who talks, where, when']];
Object.assign(window,{Icon,Overline,Section,MODULES});
