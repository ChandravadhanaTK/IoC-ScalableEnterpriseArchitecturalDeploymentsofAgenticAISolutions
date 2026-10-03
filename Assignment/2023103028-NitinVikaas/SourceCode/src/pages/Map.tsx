import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {ArrowUpRight,Check,Lock} from 'lucide-react';
import {api} from '../services/api';
import {campaignByLevel} from '../services/seed/campaign';
import {AnimatedNumber,Reveal} from '../components/motion-primitives';
import {VisualPanel} from '../components/hud/VisualPanel';

export function Map(){
  const nav=useNavigate();
  const {data:levels=[]}=useQuery({queryKey:['levels'],queryFn:api.getLevels});
  const forged=levels.filter(level=>level.status==='complete').length;
  const current=levels.find(level=>level.status==='current')||levels[0];
  const chapter=current?campaignByLevel[current.id]:campaignByLevel[1];
  return <div className="mx-auto max-w-[1400px] px-5 pb-24 sm:px-10">
    <header className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:items-end">
      <Reveal>
        <div className="badge text-accent">mission control · ultron campaign</div>
        <h1 className="serif mt-4 text-[clamp(3.2rem,8vw,7.5rem)] leading-[.93] tracking-[-.025em]"><span className="block text-white/55">Forge the suit.</span><span className="block italic">End the siege.</span></h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">Every system check powers a real armor subsystem. JARVIS will brief you, test your work, and send you closer to Ultron's core.</p>
      </Reveal>
      <Reveal delay={.15}>
        <section className="border-t border-white/15 pt-6">
          <div className="flex items-center gap-3"><span className="h-2 w-2 animate-pulse rounded-full bg-accent shadow-[0_0_14px_rgb(var(--accent-rgb))]"/><span className="badge text-accent">active operation</span></div>
          <div className="serif mt-4 text-4xl leading-tight">{chapter.mission}</div>
          <p className="mt-3 text-sm leading-6 text-slate-400">{chapter.threat}</p>
          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-white/10 pt-5">
            <div><div className="badge text-slate-500">armor forged</div><div className="serif mt-1 text-4xl">{forged}<span className="text-slate-600">/12</span></div></div>
            <div><div className="badge text-slate-500">current power</div><div className="mt-1 flex items-end gap-2"><AnimatedNumber value={820}/><span className="badge pb-1.5 text-accent">xp</span></div></div>
          </div>
          <div className="mt-5 h-px w-full bg-white/10"><div className="h-px bg-accent transition-all duration-1000" style={{width:`${(forged/12)*100}%`}}/></div>
        </section>
      </Reveal>
    </header>

    <div className="mt-16 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
      <VisualPanel src="/wp11132169.webp" alt="Engineering command room with live control displays" label="RECON FEED / BAY 03" detail="Ultron activity detected across the workshop network" className="h-64 sm:h-80"/>
      <div className="border-y border-accent/15 py-6 lg:px-6 lg:py-8">
        <div className="badge text-slate-500">operator note</div>
        <p className="mt-4 text-xl leading-relaxed text-slate-200">The suit is assembled in sequence. Clear a subsystem, inspect the evidence, then move closer to the core.</p>
        <div className="mt-8 border-t border-white/10 pt-4 badge text-accent">NEXT SIGNAL // {chapter.mission}</div>
      </div>
    </div>

    <ol className="mt-24 border-t border-white/10 sm:mt-32">
      {levels.map((level,index)=>{
        const story=campaignByLevel[level.id];
        const locked=level.status==='locked',isCurrent=level.status==='current',done=level.status==='complete';
        return <li key={level.id}><Reveal>
          <button disabled={locked} onClick={()=>nav(`/level/${level.id}`)} className={`focus-ring group grid w-full grid-cols-[3.5rem_1fr_auto] items-center gap-4 border-b border-white/10 py-7 text-left transition-colors duration-500 sm:grid-cols-[6.5rem_1fr_15rem_2rem] sm:gap-8 sm:py-9 ${locked?'cursor-not-allowed opacity-40':'hover:bg-white/[.025]'}`}>
            <span className={`serif text-5xl leading-none sm:text-7xl ${isCurrent?'text-accent':done?'text-sand':'text-white/25'}`}>{String(level.id).padStart(2,'0')}</span>
            <span className="min-w-0">
              <span className="badge block text-slate-500">{level.piece}{isCurrent&&<span className="ml-2 text-accent">· in progress</span>}{done&&<span className="ml-2 text-sand">· forged</span>}</span>
              <span className="serif mt-1 block text-3xl leading-tight transition-transform duration-500 group-hover:translate-x-2 sm:text-5xl">{story.mission}</span>
              <span className="mt-2 hidden max-w-xl text-sm leading-6 text-slate-500 sm:block">{story.threat}</span>
            </span>
            <span className="hidden text-right text-sm leading-6 text-slate-500 sm:block">{level.topic}<br/><span className="mono text-xs">{20+index*3} min · +{level.xp} xp</span></span>
            <span className="justify-self-end text-slate-500 transition-colors duration-500 group-hover:text-accent">{locked?<Lock size={17}/>:done?<Check size={19}/>:<ArrowUpRight size={21}/>}</span>
          </button>
        </Reveal></li>;
      })}
    </ol>
  </div>;
}
