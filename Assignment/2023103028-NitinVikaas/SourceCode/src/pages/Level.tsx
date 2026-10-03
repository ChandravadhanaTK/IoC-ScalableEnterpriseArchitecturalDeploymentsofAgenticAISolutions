import {useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import CodeMirror from '@uiw/react-codemirror';
import {python} from '@codemirror/lang-python';
import {oneDark} from '@codemirror/theme-one-dark';
import {Check,ChevronRight,Code2,Lightbulb,Play,RotateCcw,Terminal,X,Zap} from 'lucide-react';
import {api} from '../services/api';
import {levels} from '../services/seed/data';
import {campaignByLevel} from '../services/seed/campaign';
import {levelOneChallenge} from '../services/python/challenges';
import {runPython,type PythonRunResult} from '../services/python/worker';
import {MatchGame} from '../components/match-game/MatchGame';
import {TextEffect,TextScramble,TransitionPanel} from '../components/motion-primitives';
import {VisualPanel} from '../components/hud/VisualPanel';

const concepts=[
  ['Variables','Names bind values to objects. Python is dynamically typed, so the name does not declare a fixed machine type.','x = 42\nname = "Tony"'],
  ['Control flow','Conditions and loops determine which instructions execute and how often.','if score >= 70:\n    pass_level()'],
  ['Functions','Functions package reusable behavior and accept inputs through parameters.','def forge(piece, power):\n    return f"{piece}: {power}%"'],
  ['Collections','Lists preserve order; dictionaries map keys to values.','armor = ["core", "gauntlet"]\nstatus = {"power": 92}'],
  ['Exceptions','Errors can be handled explicitly without hiding failures.','try:\n    run_system()\nexcept ValueError as err:\n    print(err)'],
];

export function Level(){
  const {id}=useParams();
  const levelNumber=Number(id||1);
  const level=levels[levelNumber-1];
  const story=campaignByLevel[levelNumber]||campaignByLevel[1];
  const challenge=levelNumber===1?levelOneChallenge:null;
  const nav=useNavigate();
  const {data:pairs=[]}=useQuery({queryKey:['match',levelNumber],queryFn:()=>api.getMatchSet(levelNumber)});
  const [step,setStep]=useState(0);
  const [score,setScore]=useState(0);
  const [code,setCode]=useState(()=>localStorage.getItem(`armor-code-${levelNumber}`)||challenge?.starterCode||'');
  const [output,setOutput]=useState('Runtime idle. Press Run to execute your code.');
  const [runState,setRunState]=useState<'idle'|'running'|'passed'|'failed'>('idle');
  const [tests,setTests]=useState<NonNullable<PythonRunResult['tests']>>([]);
  const [attempts,setAttempts]=useState(0);
  const [hintsUsed,setHintsUsed]=useState(0);
  const [forged,setForged]=useState(false);

  if(!level)return null;

  const saveCode=(value:string)=>{setCode(value);localStorage.setItem(`armor-code-${levelNumber}`,value)};
  const execute=async(submit=false)=>{
    if(!challenge)return;
    setRunState('running');
    setOutput(submit?'Running hidden tests...':'Starting Pyodide...');
    const result=await runPython(code,submit?challenge.tests:[],5000,submit?undefined:challenge.tests[0]?.numbers);
    const details=[result.stdout,result.stderr,result.traceback].filter(Boolean).join('\n');
    setOutput(details|| (result.timedOut?'Execution timeout.':'Execution complete with no printed output.'));
    setTests(result.tests||[]);
    if(submit){
      const passed=Boolean(result.tests?.length)&&result.tests?.every(test=>test.passed);
      setAttempts(value=>value+1);
      setRunState(passed?'passed':'failed');
      if(passed)setScore(100);
    }else setRunState(result.timedOut?'failed':'idle');
  };
  const complete=async()=>{
    if(runState!=='passed')return;
    await api.completeLevel(levelNumber);
    setForged(true);
  };
  const hint=challenge?.hints[hintsUsed];

  return <div className="mx-auto max-w-6xl p-5 sm:p-8">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div><div className="badge text-accent">LEVEL {String(levelNumber).padStart(2,'0')} / {level.topic.toUpperCase()}</div><TextEffect className="orbitron mt-2 text-5xl font-bold">{level.name}</TextEffect></div>
      <div className="badge text-slate-500">STEP {Math.min(step+1,4)}/4</div>
    </div>
    <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-accent transition-all" style={{width:`${((Math.min(step,3)+1)/4)*100}%`}}/></div>
    <VisualPanel src="/iron-man-6221442_960_720.jpg" alt="Reactor core visual reference" label={`MISSION IMAGE / LEVEL ${String(levelNumber).padStart(2,'0')}`} detail={story.armorUse} className="mb-6 h-44 sm:h-56"/>
    <TransitionPanel>
      {step===0&&<section className="glass corner rounded-2xl p-6 sm:p-8"><div className="grid gap-8 md:grid-cols-[1.2fr_.8fr]"><div><div className="badge text-gold">JARVIS MISSION BRIEFING / OPERATION {String(levelNumber).padStart(2,'0')}</div><h2 className="orbitron mt-3 text-4xl font-bold">{story.mission}</h2><p className="mt-3 max-w-2xl text-accent/80">THREAT: {story.threat}</p><p className="mt-4 max-w-2xl text-slate-400">{story.jarvis}</p><div className="mt-5 rounded-xl border border-accent/15 bg-accent/[.04] p-4"><div className="badge text-accent">TODAY'S OBJECTIVE</div><div className="mt-2 text-sm text-slate-300">{story.objective}</div><div className="mt-3 badge text-sand">ARMOR LINK / {story.armorUse}</div></div><button onClick={()=>setStep(1)} className="btn btn-primary mt-6 rounded-xl px-5 py-3 font-bold">Accept mission <ChevronRight size={16} className="inline"/></button></div><div className="grid place-items-center rounded-2xl border border-accent/10 bg-accent/[.025] p-8"><div className="relative grid h-40 w-40 place-items-center rounded-full border border-accent/30 bg-[radial-gradient(circle,rgba(0,229,255,.22),transparent_62%)]"><Zap size={42} className="text-accent"/><div className="pointer-events-none absolute inset-4 rounded-full border border-dashed border-sand/30 animate-[spin_12s_linear_infinite]"/></div><div className="mt-4 badge text-slate-500">REACTOR OUTPUT +{level.xp} XP</div></div></div></section>}
      {step===1&&<section><div className="mb-4 flex items-end justify-between"><div><div className="badge text-sand">CONCEPT DECK</div><h2 className="orbitron mt-1 text-3xl">Five systems to lock in</h2></div><button onClick={()=>setStep(2)} className="btn rounded-lg px-4 py-2 text-sm">Continue</button></div><div className="grid gap-3 md:grid-cols-2">{concepts.map((concept,index)=><article key={concept[0]} className="glass corner rounded-xl p-5"><div className="badge text-accent">0{index+1}</div><h3 className="orbitron mt-2 font-semibold">{concept[0]}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{concept[1]}</p><pre className="mono mt-4 overflow-auto rounded-lg border border-white/5 bg-black/30 p-3 text-xs leading-5 text-accent"><code>{concept[2]}</code></pre></article>)}</div></section>}
      {step===2&&<section><div className="mb-4"><div className="badge text-accent">CIRCUIT TRAINING / JARVIS CONTEXT</div><h2 className="orbitron mt-1 text-3xl">Connect the knowledge nodes</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{story.jarvis}</p><div className="mt-3 badge text-sand">MATCH LINK / {story.armorUse}</div></div><MatchGame pairs={pairs} onComplete={value=>{setScore(value);setStep(3)}}/></section>}
      {step===3&&challenge&&<section className="space-y-4"><div className="glass corner rounded-2xl p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="badge text-accent">PYTHON LAB / JARVIS FIELD TEST</div><h2 className="orbitron mt-2 text-3xl">{challenge.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{challenge.description}</p><div className="mt-3 rounded-lg border border-accent/15 bg-accent/[.04] p-3 text-sm text-accent">JARVIS LINK: {story.armorUse} {story.objective}</div></div><div className="badge text-slate-500">PYODIDE / 5S LIMIT</div></div><div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_.85fr]"><div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0b0e]"><div className="flex items-center justify-between border-b border-white/5 px-4 py-2"><span className="badge text-slate-500">challenge.py</span><Code2 size={15} className="text-accent"/></div><CodeMirror value={code} height="310px" extensions={[python()]} theme={oneDark} onChange={saveCode} basicSetup={{lineNumbers:true,bracketMatching:true,indentOnInput:true}} aria-label="Python challenge editor"/></div><div className="flex min-h-[310px] flex-col rounded-xl border border-white/10 bg-[#0a0b0e] p-4"><div className="mb-3 flex items-center gap-2 badge text-slate-500"><Terminal size={13}/> EXECUTION OUTPUT</div><pre className="mono flex-1 whitespace-pre-wrap text-xs leading-6 text-emerald-300">{output}</pre><div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-500"><span>{runState==='running'?'RUNNING':runState==='passed'?'ALL TESTS PASSED':runState==='failed'?'CHECK FAILED':'READY'}</span><span>{attempts} submission{attempts===1?'':'s'}</span></div></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><button onClick={()=>saveCode(challenge.starterCode)} className="btn rounded-lg px-3 py-2 text-xs"><RotateCcw size={13} className="mr-1 inline"/>Reset</button><div className="flex flex-wrap gap-2"><button onClick={()=>execute(false)} disabled={runState==='running'} className="btn rounded-lg px-4 py-2 text-sm"><Play size={14} className="mr-1 inline"/>Run</button><button onClick={()=>execute(true)} disabled={runState==='running'} className="btn btn-primary rounded-lg px-4 py-2 text-sm font-bold">Submit tests</button></div></div></div><div className="grid gap-4 lg:grid-cols-[1fr_.8fr]"><section className="glass rounded-xl p-5"><div className="mb-3 flex items-center gap-2"><div className="badge text-accent">TEST RESULTS</div><span className="badge text-slate-600">{tests.filter(test=>test.passed).length}/{tests.length||challenge.tests.length}</span></div>{tests.length?<div className="space-y-2">{tests.map(test=><div key={test.name} className="flex items-start gap-2 text-sm">{test.passed?<Check size={16} className="mt-0.5 text-emerald-300"/>:<X size={16} className="mt-0.5 text-rose-300"/>}<div><div className={test.passed?'text-emerald-200':'text-rose-300'}>{test.name}</div>{!test.passed&&<div className="mt-1 text-xs text-slate-500">{test.message}</div>}</div></div>)}</div>:<div className="text-sm text-slate-600">Submit your code to run the hidden cases.</div>}</section><section className="glass rounded-xl p-5"><div className="badge text-gold">MENTOR HINTS</div><p className="mt-2 text-sm text-slate-400">Hints are limited to three so the debugging work stays yours.</p>{hint?<button onClick={()=>setHintsUsed(value=>value+1)} className="btn mt-4 flex w-full items-start gap-2 rounded-lg p-3 text-left text-sm"><Lightbulb size={15} className="mt-0.5 shrink-0 text-gold"/><span>{hint}</span></button>:<div className="mt-4 text-xs text-slate-600">No hints remaining.</div>}<div className="mt-3 badge text-slate-600">{hintsUsed}/3 USED</div></section></div>{runState==='passed'&&!forged&&<section className="rounded-xl border border-emerald-300/25 bg-emerald-300/5 p-5"><div className="badge text-emerald-300">BOSS CHECK CLEARED</div><p className="mt-2 text-sm text-slate-300">The hidden cases passed. Forge the Arc Reactor to save Level 1 completion.</p><button onClick={complete} className="btn btn-primary mt-4 rounded-lg px-4 py-2 font-bold">Forge Arc Reactor <Zap size={14} className="inline"/></button></section>}{forged&&<section className="rounded-xl border border-gold/25 bg-gold/5 p-5"><div className="badge text-gold">ARMOR COMPONENT FORGED</div><TextScramble>Arc Reactor secured. Level 1 is complete.</TextScramble><button onClick={()=>nav('/workshop')} className="btn mt-4 rounded-lg px-4 py-2 text-sm">Open workshop</button></section>}</section>}
      {step===3&&!challenge&&<section className="glass rounded-2xl p-6"><div className="badge text-gold">LAB NOT READY</div><h2 className="orbitron mt-2 text-3xl">This level is locked</h2><p className="mt-2 text-slate-400">Complete Level 1 to unlock the next real challenge.</p><button onClick={()=>nav('/map')} className="btn mt-5 rounded-lg px-4 py-2">Return to level map</button></section>}
    </TransitionPanel>
    {score>0&&<div className="mt-4 badge text-emerald-300">MATCH CIRCUIT {score}% / CODE GATE {runState==='passed'?'PASSED':'PENDING'}</div>}
  </div>;
}
