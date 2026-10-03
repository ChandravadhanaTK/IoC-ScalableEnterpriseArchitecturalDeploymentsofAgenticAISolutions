import type {ApiClient} from '../../types/api';
import {levels,matchSets} from '../seed/data';

const wait=(n=220)=>new Promise(resolve=>setTimeout(resolve,n));
const key='armor-forge-demo';

export const mockApi:ApiClient={
  async getLevels(){
    await wait();
    const saved=JSON.parse(localStorage.getItem(key)||'{}');
    return levels.map(level=>({...level,status:saved.completed?.includes(level.id)?'complete':level.id===1||saved.completed?.includes(level.id-1)?'current':'locked'}));
  },
  async getMatchSet(level){await wait(160);return matchSets[level]},
  async submitMatch(level,score){await wait(180);const xp=Number(localStorage.getItem('armor-xp')||0)+Math.round(score*2);localStorage.setItem('armor-xp',String(xp));return{xp}},
  async completeLevel(level){
    await wait(150);
    const saved=JSON.parse(localStorage.getItem(key)||'{}');
    saved.completed=[...(saved.completed||[]),level].filter((value,index,array)=>array.indexOf(value)===index);
    localStorage.setItem(key,JSON.stringify(saved));
  },
  async resetDemo(){localStorage.removeItem(key);localStorage.removeItem('armor-xp')},
};
