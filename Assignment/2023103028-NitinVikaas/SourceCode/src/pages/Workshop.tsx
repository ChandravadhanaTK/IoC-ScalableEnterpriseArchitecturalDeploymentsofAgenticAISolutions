import {useQuery} from '@tanstack/react-query';
import {api} from '../services/api';
import {Shield,Zap} from 'lucide-react';
import {FbxArmorViewer} from '../components/workshop/FbxArmorViewer';
import {VisualPanel} from '../components/hud/VisualPanel';

export function Workshop(){
  const {data:levels=[]}=useQuery({queryKey:['levels'],queryFn:api.getLevels});
  const complete=levels.filter(level=>level.status==='complete').length;
  return <div className="mx-auto max-w-6xl p-5 sm:p-8">
    <div className="mb-7"><div className="badge text-accent">ARMOR WORKSHOP / ASSEMBLY BAY</div><h1 className="orbitron mt-2 text-5xl font-bold">Your intelligence suit</h1><p className="mt-2 max-w-2xl text-slate-500">{complete}/12 systems forged. Every component represents a concept you can explain and use.</p></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
      <section className="glass relative overflow-hidden rounded-3xl p-4 sm:p-6"><FbxArmorViewer reactorPowered={complete>=1}/></section>
      <section className="glass relative overflow-hidden rounded-3xl p-5 sm:p-6"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(233,180,76,.12),transparent_40%)]"/><div className="relative"><div className="badge text-sand">COMPONENT MAP</div><h2 className="orbitron mt-2 text-3xl">Assembly status</h2><p className="mt-2 text-sm leading-6 text-slate-500">Each cleared level powers another subsystem in the local armor schematic.</p><div className="mt-6 space-y-2">{levels.slice(0,6).map(level=><div key={level.id} className={`grid-card flex items-center gap-3 rounded-xl p-3 transition ${level.status==='complete'?'border-emerald-300/30 bg-emerald-300/[.04]':'opacity-70'}`}><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${level.status==='complete'?'border-emerald-300/40 bg-emerald-300/10 text-emerald-300':'border-white/10 text-slate-600'}`}><Shield size={16}/></div><div className="min-w-0 flex-1"><div className="badge truncate">{level.piece}</div><div className="truncate text-sm font-semibold">{level.name}</div></div><div className={`badge ${level.status==='complete'?'text-emerald-300':'text-slate-600'}`}>{level.status==='complete'?'FORGED':'STANDBY'}</div></div>)}</div><div className="mt-5 rounded-xl border border-gold/15 bg-gold/[.04] p-4"><div className="flex items-center gap-2"><Zap size={15} className="text-gold"/><div className="badge text-gold">NEXT SYSTEM</div></div><div className="mt-2 text-sm text-slate-300">{levels.find(level=>level.status==='current')?.piece||'Complete the next level'} awaits activation.</div></div></div></section>
    </div>
    <VisualPanel src="/iron-man-6221442_960_720.jpg" alt="Arc reactor detail used as a reference image" label="REFERENCE / CORE 01" detail="Reactor geometry informs the active assembly" className="mt-5 h-48 sm:h-64"/>
  </div>;
}
