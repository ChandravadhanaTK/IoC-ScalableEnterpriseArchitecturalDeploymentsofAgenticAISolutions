import {Activity,Check,Flame,Target,Trophy} from 'lucide-react';
import {useQuery} from '@tanstack/react-query';
import {api} from '../services/api';
import {campaignByLevel} from '../services/seed/campaign';
import {AnimatedNumber} from '../components/motion-primitives';
import {VisualPanel} from '../components/hud/VisualPanel';

export function Progress(){
  const {data:levels=[]}=useQuery({queryKey:['levels'],queryFn:api.getLevels});
  const forged=levels.filter(level=>level.status==='complete').length;
  const current=levels.find(level=>level.status==='current');
  const xp=Number(localStorage.getItem('armor-xp')||0);
  return <div className="mx-auto max-w-6xl p-5 sm:p-8">
    <div className="mb-7"><div className="badge text-accent">OPERATOR RECORD / LOCAL STATUS</div><h1 className="orbitron mt-2 text-5xl font-bold">Your campaign progress</h1><p className="mt-2 max-w-2xl text-slate-500">These values come from completed system checks and saved local runtime state. No simulated performance scores.</p></div>
    <VisualPanel src="/ironman_lob_mas_hlf_02_0.webp" alt="Close-up of armor eye sensor" label="STATUS IMAGE / CORE 01" detail="Power signal stable / operator record local" className="mb-5 h-56 sm:h-72"/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={<ZapIcon/>} label="XP EARNED" value={xp}/><Stat icon={<Flame/>} label="SYSTEMS FORGED" value={forged}/><Stat icon={<Target/>} label="MISSIONS OPEN" value={levels.filter(level=>level.status!=='locked').length}/><Stat icon={<Trophy/>} label="CAMPAIGN" text={forged===levels.length?'ULTRON READY':'IN PROGRESS'}/></div>
    <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <section className="glass rounded-2xl p-5"><div className="badge text-accent">MISSION RECORD</div><div className="mt-4 space-y-3">{levels.map(level=><div key={level.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[.02] p-3"><div className={`grid h-9 w-9 place-items-center rounded-lg ${level.status==='complete'?'bg-emerald-300/10 text-emerald-300':'bg-white/5 text-slate-600'}`}>{level.status==='complete'?<Check size={17}/>:<span className="badge">{String(level.id).padStart(2,'0')}</span>}</div><div className="min-w-0 flex-1"><div className="text-sm font-semibold">{campaignByLevel[level.id].mission}</div><div className="text-xs text-slate-600">{level.piece} / {level.status.toUpperCase()}</div></div><div className="badge text-slate-600">+{level.xp} XP</div></div>)}</div></section>
      <section className="glass rounded-2xl p-5"><div className="badge text-gold">NEXT OBJECTIVE</div>{current?<><h2 className="orbitron mt-3 text-3xl">{campaignByLevel[current.id].mission}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{campaignByLevel[current.id].objective}</p><div className="mt-5 rounded-xl border border-accent/15 bg-accent/[.04] p-4"><div className="badge text-accent">THREAT</div><div className="mt-2 text-sm text-slate-300">{campaignByLevel[current.id].threat}</div></div></>:<div className="mt-4 text-sm text-emerald-300">All campaign missions complete.</div>}</section>
    </div>
  </div>;
}

function ZapIcon(){return <Activity/>}
function Stat({icon,label,value,text}:{icon:React.ReactNode,label:string,value?:number,text?:string}){return <div className="glass rounded-xl p-5"><div className="text-accent">{icon}</div><div className="badge mt-4 text-slate-500">{label}</div>{text?<div className="orbitron mt-1 text-3xl">{text}</div>:<AnimatedNumber value={value||0}/>}</div>}