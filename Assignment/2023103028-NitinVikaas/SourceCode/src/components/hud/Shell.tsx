import {useEffect,useState} from 'react';
import type {ReactNode} from 'react';
import {Link,NavLink,useLocation,useNavigate} from 'react-router-dom';
import {Activity,BookOpen,Map,Shield} from 'lucide-react';
import {apiMode} from '../../services/api';
import {TransitionPanel} from '../motion-primitives';

const nav=[['/map','Map',Map],['/workshop','Assembly',Shield],['/glossary','Glossary',BookOpen],['/progress','Status',Activity]] as const;

function Mark(){
  return <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.2"/><circle cx="16" cy="16" r="5" fill="rgb(var(--accent-rgb))"/><path d="M16 2v7M16 23v7M2 16h7M23 16h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
}

export function Shell({children}:{children:ReactNode}){
  const navigate=useNavigate();
  const {pathname}=useLocation();
  const home=pathname==='/';
  const signedIn=Boolean(localStorage.getItem('armor-role'));
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{
    const onScroll=()=>setScrolled(window.scrollY>24);
    onScroll();
    window.addEventListener('scroll',onScroll,{passive:true});
    return()=>window.removeEventListener('scroll',onScroll);
  },[]);
  useEffect(()=>{window.scrollTo({top:0,left:0,behavior:'auto'})},[pathname]);
  const solid=scrolled||!home;
  const enter=()=>{localStorage.setItem('armor-role','tony');navigate('/map')};
  const restart=()=>{localStorage.removeItem('armor-role');navigate('/')};

  return <div className="hud-bg grain min-h-screen">
    <header className={`fixed inset-x-0 top-0 z-40 border-b transition-all duration-500 ${solid?'border-accent/15 bg-[#05080A]/85 backdrop-blur-xl':'border-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:h-20 sm:px-10">
        <Link to="/" className="focus-ring flex items-center gap-3 rounded-full"><Mark/><span className="serif text-[26px] leading-none">Armor Forge</span></Link>
        {signedIn&&<nav className="hidden items-center gap-10 md:flex" aria-label="Primary">{nav.map(([to,label])=><NavLink key={to} to={to} className={({isActive})=>`link-u focus-ring text-sm tracking-wide ${isActive?'active text-white':'text-slate-400 hover:text-white'}`}>{label}</NavLink>)}</nav>}
        <div className="flex items-center gap-4">
          <span className="mono hidden text-[10px] uppercase tracking-[.18em] text-slate-600 sm:block">{apiMode}</span>
          {signedIn&&!home?<button onClick={restart} className="btn focus-ring px-4 py-2 text-sm text-slate-300">Restart</button>:<button onClick={enter} className="btn btn-primary focus-ring px-5 py-2 text-sm">{signedIn?'Continue':'Enter'} →</button>}
        </div>
      </div>
    </header>

    <main className={`min-h-screen ${home?'':'pt-24 sm:pt-32'} ${signedIn&&!home?'pb-28 md:pb-0':''}`}><TransitionPanel id={pathname}>{children}</TransitionPanel></main>

    <footer className={`border-t border-white/[.07] px-5 py-12 sm:px-10 ${signedIn&&!home?'mb-20 md:mb-0':''}`}>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="serif text-3xl">Armor Forge</div><div className="badge mt-1 text-slate-500">build the system. stop ultron.</div></div>
        {signedIn&&<div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-500">{nav.map(([to,label])=><Link key={to} to={to} className="link-u hover:text-white">{label}</Link>)}</div>}
        <div className="text-xs text-slate-600">© 2026 Armor Forge · local build / no accounts</div>
      </div>
    </footer>

    {signedIn&&!home&&<nav aria-label="Mobile" className="fixed inset-x-4 bottom-4 z-40 flex justify-around rounded-full border border-white/10 bg-[#14161B]/90 p-1.5 backdrop-blur-xl md:hidden">{nav.map(([to,label,Icon])=><NavLink key={to} to={to} className={({isActive})=>`grid flex-1 place-items-center gap-0.5 rounded-full px-2 py-2 text-[10px] tracking-wide ${isActive?'bg-white/10 text-white':'text-slate-500'}`}><Icon size={17}/>{label}</NavLink>)}</nav>}
  </div>;
}
