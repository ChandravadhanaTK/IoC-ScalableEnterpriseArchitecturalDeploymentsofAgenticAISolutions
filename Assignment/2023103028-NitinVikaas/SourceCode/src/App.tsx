import {BrowserRouter,Navigate,Route,Routes,useLocation} from 'react-router-dom';
import {Shell} from './components/hud/Shell';
import {Landing} from './pages/Landing';
import {Map} from './pages/Map';
import {Level} from './pages/Level';
import {Workshop} from './pages/Workshop';
import {Glossary} from './pages/Glossary';
import {Progress} from './pages/Progress';

function Guard({children}:{children:React.ReactNode}){
  const location=useLocation();
  if(!localStorage.getItem('armor-role')&&location.pathname!=='/')return <Navigate to="/" replace/>;
  return <>{children}</>;
}

export default function App(){return <BrowserRouter><Routes><Route path="/" element={<Shell><Landing/></Shell>}/><Route path="/map" element={<Guard><Shell><Map/></Shell></Guard>}/><Route path="/level/:id" element={<Guard><Shell><Level/></Shell></Guard>}/><Route path="/workshop" element={<Guard><Shell><Workshop/></Shell></Guard>}/><Route path="/glossary" element={<Guard><Shell><Glossary/></Shell></Guard>}/><Route path="/progress" element={<Guard><Shell><Progress/></Shell></Guard>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></BrowserRouter>}
