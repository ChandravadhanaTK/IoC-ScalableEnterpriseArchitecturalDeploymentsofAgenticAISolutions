import {useRef} from 'react';
import type {ReactNode} from 'react';
import {useNavigate} from 'react-router-dom';
import {motion,useMotionTemplate,useMotionValue,useReducedMotion,useScroll,useSpring,useTransform} from 'motion/react';
import type {MotionValue} from 'motion/react';
import {ArrowRight,ArrowUp} from 'lucide-react';
import {Reveal,TextLoop} from '../components/motion-primitives';

const ease:[number,number,number,number]=[.22,1,.36,1];

const chapters=[
  {eyebrow:'sequence 01',a:'Wake the',b:'reactor.'},
  {eyebrow:'sequence 04',a:'Reinforce the',b:'armor.'},
  {eyebrow:'sequence 08',a:'Restore the',b:'voice.'},
  {eyebrow:'sequence 11',a:'Find the',b:'evidence.'},
  {eyebrow:'sequence 12',a:'Confront',b:'Ultron.'},
];

export function Landing(){
  const navigate=useNavigate();
  const reduce=useReducedMotion();
  const enter=()=>{localStorage.setItem('armor-role','tony');navigate('/map')};
  return <div>
    <Hero onEnter={enter}/>
    {reduce?<StaticStory/>:<Story/>}
    <Difference/>
    <Finale onEnter={enter}/>
  </div>;
}

/* ───────── shared bits ───────── */

function Line({children,delay=0,className=''}:{children:ReactNode;delay?:number;className?:string}){
  return <span className="-mb-[.12em] block overflow-hidden pb-[.12em]"><motion.span className={`block ${className}`} initial={{y:'105%'}} animate={{y:0}} transition={{duration:1.1,delay,ease}}>{children}</motion.span></span>;
}

function Rings({draw,className=''}:{draw?:MotionValue<number>;className?:string}){
  const len=draw??1;
  const ticks=Array.from({length:72},(_,i)=>{const a=(i/72)*Math.PI*2;const long=i%6===0;const r1=long?268:274,r2=284;return {x1:300+Math.cos(a)*r1,y1:300+Math.sin(a)*r1,x2:300+Math.cos(a)*r2,y2:300+Math.sin(a)*r2,long}});
  return <svg viewBox="0 0 600 600" fill="none" className={className} aria-hidden="true">
    {ticks.map((t,i)=><line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.long?'rgba(243,239,230,.35)':'rgba(243,239,230,.14)'} strokeWidth="1"/>)}
    <motion.circle cx="300" cy="300" r="250" stroke="rgba(243,239,230,.22)" strokeWidth="1" pathLength={len}/>
    <motion.circle cx="300" cy="300" r="190" stroke="rgb(0,229,255)" strokeOpacity=".75" strokeWidth="1.5" pathLength={len}/>
    <motion.circle cx="300" cy="300" r="130" stroke="rgba(243,239,230,.3)" strokeWidth="1" strokeDasharray="2 7" pathLength={len}/>
    <motion.circle cx="300" cy="300" r="70" stroke="rgba(243,239,230,.5)" strokeWidth="1" pathLength={len}/>
    <circle cx="300" cy="300" r="22" fill="rgb(0,229,255)" fillOpacity=".9"/>
    <circle cx="300" cy="300" r="40" fill="rgb(0,229,255)" fillOpacity=".14"/>
  </svg>;
}

/* ───────── hero ───────── */

function Hero({onEnter}:{onEnter:()=>void}){
  const pointerX=useMotionValue(0);
  const pointerY=useMotionValue(0);
  const imageX=useSpring(useTransform(pointerX,[-1,1],[-14,14]),{stiffness:120,damping:22});
  const imageY=useSpring(useTransform(pointerY,[-1,1],[-8,8]),{stiffness:120,damping:22});
  const trackPointer=(event:React.PointerEvent<HTMLDivElement>)=>{
    const bounds=event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX-bounds.left)/bounds.width*2-1);
    pointerY.set((event.clientY-bounds.top)/bounds.height*2-1);
  };
  const resetPointer=()=>{pointerX.set(0);pointerY.set(0)};
  return <section className="relative flex min-h-[100dvh] flex-col justify-end overflow-hidden pb-14 pt-32 sm:pb-20">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_55%_at_72%_38%,rgba(0,229,255,.16),transparent_70%)]"/>
    <div onPointerMove={trackPointer} onPointerLeave={resetPointer} className="absolute inset-y-0 right-0 w-full overflow-hidden sm:w-[70%]">
      <motion.img style={{x:imageX,y:imageY,scale:1.06}} src="/wp11132169.webp" alt="Engineering command room with vehicles and control displays" className="pointer-events-none h-full w-full object-cover object-center opacity-55 mix-blend-screen"/>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#05080A_0%,rgba(5,8,10,.88)_20%,rgba(5,8,10,.18)_72%,rgba(5,8,10,.58)_100%)]"/>
      <div className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(0deg,transparent_0_5px,rgba(0,229,255,.1)_6px),linear-gradient(90deg,rgba(0,229,255,.08)_1px,transparent_1px)] [background-size:auto,40px_40px]"/>
      <div className="absolute inset-x-8 top-28 border-t border-accent/30 sm:inset-x-16 sm:top-36"><span className="badge bg-[#05080A] px-3 text-accent">visual feed / bay 03</span></div>
    </div>
    <motion.div initial={{opacity:0,scale:.9,rotate:-12}} animate={{opacity:1,scale:1,rotate:0}} transition={{duration:2,ease}} className="pointer-events-none absolute -right-[28vh] top-[2vh] z-[1] h-[86vh] w-[86vh] max-w-none opacity-25 sm:opacity-55"><Rings className="h-full w-full"/></motion.div>
    <div className="relative z-[2] mx-auto w-full max-w-[1400px] px-5 sm:px-10">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:1,delay:.2}} className="badge text-accent">operation / forge protocol</motion.div>
      <h1 className="serif mt-5 text-[clamp(3.6rem,11vw,10.5rem)] leading-[.92] tracking-[-.025em]">
        <Line delay={.25}>Build the suit.</Line>
        <Line delay={.4} className="italic text-accent">End Ultron.</Line>
      </h1>
      <div className="mt-10 flex flex-col gap-8 sm:mt-14 sm:flex-row sm:items-end sm:justify-between">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:1,delay:.9,ease}} className="max-w-md">
          <p className="text-lg leading-relaxed text-slate-300">Assemble twelve live systems, test them in the browser, and take a working intelligence suit to Ultron's core.</p>
          <p className="badge mt-4 text-slate-500">JARVIS // <span className="text-accent"><TextLoop interval={2.6}><span>systems await your command.</span><span>ultron is adapting.</span><span>build the evidence before the answer.</span></TextLoop></span></p>
        </motion.div>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:1,delay:1.05,ease}} className="flex items-center gap-6">
          <button onClick={onEnter} className="btn btn-primary focus-ring group flex items-center gap-3 px-7 py-4 text-base">Enter the forge <ArrowRight size={17} className="transition-transform duration-500 group-hover:translate-x-1"/></button>
          <span className="badge hidden items-center gap-3 text-slate-500 sm:flex">scroll<span className="relative block h-10 w-px overflow-hidden bg-white/15"><motion.span className="absolute inset-x-0 top-0 h-4 bg-white" animate={{y:[-16,40]}} transition={{duration:1.8,repeat:Infinity,ease:'easeInOut'}}/></span></span>
        </motion.div>
      </div>
    </div>
  </section>;
}

/* ───────── pinned scroll story ───────── */

function ChapterText({eyebrow,a,b}:{eyebrow:string;a:string;b:string}){
  return <div>
    <div className="badge text-accent">{eyebrow}</div>
    <h2 className="serif mt-5 text-[clamp(2.8rem,9vw,8.5rem)] leading-[.95] tracking-[-.025em]"><span className="block text-white/55">{a}</span><span className="block italic text-white">{b}</span></h2>
  </div>;
}

function Chapter({p,i,n,eyebrow,a,b}:{p:MotionValue<number>;i:number;n:number;eyebrow:string;a:string;b:string}){
  const s=i/n,e=(i+1)/n,f=.22/n;
  const stops=[s,s+f,e-f,e];
  const first=i===0,last=i===n-1;
  const opacity=useTransform(p,stops,[first?1:0,1,1,last?1:0]);
  const y=useTransform(p,stops,[first?0:44,0,0,last?0:-44]);
  const blur=useTransform(p,stops,[first?0:12,0,0,last?0:12]);
  const filter=useMotionTemplate`blur(${blur}px)`;
  return <motion.div style={{opacity,y,filter}} className="absolute inset-0 grid place-items-center px-6 text-center"><ChapterText eyebrow={eyebrow} a={a} b={b}/></motion.div>;
}

function Story(){
  const ref=useRef<HTMLDivElement>(null);
  const {scrollYProgress:p}=useScroll({target:ref,offset:['start start','end end']});
  const n=chapters.length;
  const draw=useTransform(p,[0,1],[.1,1]);
  const rot=useTransform(p,[0,1],[0,150]);
  const scale=useTransform(p,[0,1],[.8,1.12]);
  const glow=useTransform(p,[0,.5,1],[.15,.4,.7]);
  const count=useTransform(p,v=>String(Math.min(n,Math.floor(v*n)+1)).padStart(2,'0'));
  return <section ref={ref} style={{height:`${n*100}vh`}} className="relative">
    <div className="sticky top-0 h-[100dvh] min-h-[100dvh] overflow-hidden">
      <div className="absolute inset-0 grid place-items-center"><motion.div style={{opacity:glow,background:'radial-gradient(circle,rgba(0,229,255,.32),transparent 62%)'}} className="h-[95vmin] w-[95vmin] rounded-full blur-2xl"/></div>
      <div className="absolute inset-0 grid place-items-center"><motion.div style={{rotate:rot,scale}} className="h-[90vmin] w-[90vmin] opacity-60"><Rings draw={draw} className="h-full w-full"/></motion.div></div>
      {chapters.map((c,i)=><Chapter key={c.eyebrow} p={p} i={i} n={n} {...c}/>)}
      <div className="absolute inset-x-0 bottom-8"><div className="mx-auto flex max-w-[1400px] items-center gap-5 px-5 sm:px-10">
        <span className="mono text-xs tracking-widest text-slate-400"><motion.span>{count}</motion.span> / {String(n).padStart(2,'0')}</span>
        <div className="h-px flex-1 bg-white/10"><motion.div style={{scaleX:p}} className="h-px origin-left bg-accent"/></div>
        <span className="badge text-slate-500">keep scrolling</span>
      </div></div>
    </div>
  </section>;
}

function StaticStory(){
  return <section>{chapters.map(c=><div key={c.eyebrow} className="grid min-h-[70vh] place-items-center px-6 text-center"><ChapterText {...c}/></div>)}</section>;
}

/* ───────── difference + stats ───────── */

function Difference(){
  const stop=['passive lessons','slides','memorized answers'];
  const go=['live Python','working systems','agents','Ultron'];
  const stats=[['12','systems between you and the core'],['real','Python running in the browser'],['1','suit built under pressure']];
  return <section className="mx-auto max-w-[1400px] px-5 py-32 sm:px-10 sm:py-48">
    <Reveal><div className="badge text-accent">system doctrine</div></Reveal>
    <Reveal delay={.1}><h2 className="serif mt-5 text-[clamp(2.8rem,8vw,7.5rem)] leading-[.95] tracking-[-.025em]"><span className="block text-white/55">Understanding is only</span><span className="block italic">the first system check.</span></h2></Reveal>
    <div className="mt-16 grid gap-10 sm:mt-24 md:grid-cols-2">
      <Reveal><div className="flex flex-wrap gap-x-6 gap-y-3">{stop.map(w=><span key={w} className="border-b border-white/10 pb-2 text-base text-slate-500 line-through decoration-accent/70">{w}</span>)}</div></Reveal>
      <Reveal delay={.1}><div className="flex flex-wrap gap-x-6 gap-y-3">{go.map(w=><span key={w} className="border-b border-white/30 pb-2 text-base text-white">{w}</span>)}</div></Reveal>
    </div>
    <div className="mt-24 grid border-t border-white/10 sm:mt-36 sm:grid-cols-3">{stats.map(([big,small],i)=><Reveal key={big} delay={i*.1}><div className="border-b border-white/10 py-10 sm:border-b-0 sm:py-14 sm:pr-8"><div className="serif text-[clamp(4rem,9vw,8rem)] leading-none text-white">{big}</div><div className="badge mt-3 text-slate-500">{small}</div></div></Reveal>)}</div>
  </section>;
}

/* ───────── finale ───────── */

function Finale({onEnter}:{onEnter:()=>void}){
  return <section className="relative grid min-h-[92vh] place-items-center overflow-hidden px-6 py-32 text-center">
    <div className="pointer-events-none absolute inset-0" style={{background:'radial-gradient(50% 45% at 50% 100%,rgba(0,229,255,.18),transparent 70%)'}}/>
    <div className="relative">
      <Reveal><div className="badge text-accent">final sequence / command authority</div></Reveal>
      <Reveal delay={.1}><h2 className="serif mt-5 text-[clamp(4rem,14vw,13rem)] leading-[.9] tracking-[-.03em]">Bring the<br/><span className="italic text-accent">system online.</span></h2></Reveal>
      <Reveal delay={.2}><p className="mx-auto mt-8 max-w-md text-lg leading-relaxed text-slate-300">Build the evidence, earn the controls, and make the call when Ultron reaches the core.</p></Reveal>
      <Reveal delay={.3}><div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button onClick={onEnter} className="btn btn-primary focus-ring group flex items-center gap-3 px-8 py-4 text-base">Enter the forge <ArrowRight size={17} className="transition-transform duration-500 group-hover:translate-x-1"/></button>
        <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} className="btn focus-ring flex items-center gap-2 px-6 py-4 text-base text-slate-300">Read it again <ArrowUp size={16}/></button>
      </div></Reveal>
    </div>
  </section>;
}
