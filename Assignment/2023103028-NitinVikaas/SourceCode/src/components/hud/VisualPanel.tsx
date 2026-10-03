import {motion} from 'motion/react';

type VisualPanelProps={
  src:string;
  alt:string;
  label:string;
  detail:string;
  className?:string;
};

export function VisualPanel({src,alt,label,detail,className=''}:VisualPanelProps){
  return <figure className={`group relative isolate overflow-hidden border border-accent/20 bg-[#071014] ${className}`}>
    <motion.img src={src} alt={alt} whileHover={{scale:1.045}} transition={{duration:.7,ease:[.22,1,.36,1]}} className="h-full w-full object-cover opacity-70 grayscale-[.25] mix-blend-screen"/>
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,10,.72),transparent_55%,rgba(5,8,10,.3)),linear-gradient(0deg,rgba(5,8,10,.78),transparent_45%)]"/>
    <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(0deg,transparent_0_5px,rgba(0,229,255,.1)_6px),linear-gradient(90deg,rgba(0,229,255,.08)_1px,transparent_1px)] [background-size:auto,40px_40px]"/>
    <figcaption className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 sm:inset-x-6 sm:bottom-6">
      <div><div className="badge text-accent">{label}</div><div className="mt-1 text-sm text-slate-300">{detail}</div></div>
      <span className="badge text-slate-500">LOCAL FEED</span>
    </figcaption>
  </figure>;
}