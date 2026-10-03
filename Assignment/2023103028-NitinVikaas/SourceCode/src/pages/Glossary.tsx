import {useState} from 'react';
import {BookOpen,Search} from 'lucide-react';
import {glossary} from '../services/seed/data';
import {VisualPanel} from '../components/hud/VisualPanel';

export function Glossary(){
  const [query,setQuery]=useState('');
  const normalized=query.trim().toLowerCase();
  const list=glossary.filter(entry=>[entry.term,entry.definition,entry.study].some(value=>value.toLowerCase().includes(normalized)));

  return <div className="mx-auto max-w-[1400px] px-5 pb-24 sm:px-10">
    <header className="grid gap-10 border-b border-accent/15 pb-10 lg:grid-cols-[1fr_.65fr] lg:items-end">
      <div>
        <div className="badge text-accent">system index / study bay</div>
        <h1 className="orbitron mt-4 max-w-4xl text-[clamp(3rem,7vw,7rem)] leading-[.92]">Know what the suit is doing.</h1>
      </div>
      <div><p className="max-w-md text-base leading-7 text-slate-400">A working system is only as reliable as the concepts behind it. Open a component, inspect its failure modes, and connect it to the mission.</p><VisualPanel src="/061ult_ons_mas_mob_01_0.webp" alt="Close-up of the armor shell under inspection" label="REFERENCE IMAGE / NODE 07" detail="Surface integrity and sensor geometry" className="mt-6 h-44"/></div>
    </header>

    <div className="mt-8 flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
      <label className="relative block w-full sm:max-w-xl">
        <span className="sr-only">Search the system index</span>
        <Search className="pointer-events-none absolute left-0 top-3 text-accent" size={17}/>
        <input value={query} onChange={event=>setQuery(event.target.value)} className="focus-ring w-full border-b border-white/20 bg-transparent py-3 pl-8 pr-4 text-base outline-none placeholder:text-slate-600 focus:border-accent" placeholder="Search a concept, failure mode, or subsystem"/>
      </label>
      <div className="badge text-slate-500">{list.length} / {glossary.length} components visible</div>
    </div>

    {list.length===0?<div className="border-b border-white/10 py-20 text-slate-400">No component matches that search signal.</div>:<div className="grid gap-px bg-white/10 md:grid-cols-2 xl:grid-cols-3">
      {list.map((entry,index)=><article key={entry.term} className="bg-[#10191E] p-5 transition-colors hover:bg-[#18262B] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="badge text-accent">{String(index+1).padStart(2,'0')}</span>
          <BookOpen size={17} className="text-slate-600" aria-hidden="true"/>
        </div>
        <h2 className="orbitron mt-8 text-2xl">{entry.term}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">{entry.definition}</p>
        <details className="mt-6 border-t border-white/10 pt-4">
          <summary className="focus-ring cursor-pointer list-none text-xs font-semibold uppercase tracking-[.12em] text-accent">Open study notes</summary>
          <div className="mt-4 space-y-4">
            <div><div className="badge text-slate-500">why it matters</div><p className="mt-2 text-sm leading-6 text-slate-400">{entry.study}</p></div>
            <div><div className="badge text-slate-500">field example</div><pre className="mono mt-2 overflow-x-auto border-l border-accent/40 bg-black/20 p-3 text-xs leading-5 text-cyan-100"><code>{entry.example}</code></pre></div>
          </div>
        </details>
      </article>)}
    </div>}
  </div>;
}