import {z} from 'zod';
export const Role=z.enum(['tony','pepper','fury']); export type Role=z.infer<typeof Role>;
export const Level=z.object({id:z.number(),name:z.string(),piece:z.string(),topic:z.string(),accent:z.string(),description:z.string(),xp:z.number(),status:z.enum(['locked','current','complete'])}); export type Level=z.infer<typeof Level>;
export const MatchPair=z.object({id:z.string(),term:z.string(),definition:z.string()}); export type MatchPair=z.infer<typeof MatchPair>;
export type PythonTestCase={name:string,numbers:number[],expected:number};
export type PythonTestResult={name:string,passed:boolean,message:string};
export interface ApiClient{getLevels():Promise<Level[]>; getMatchSet(level:number):Promise<MatchPair[]>; submitMatch(level:number,score:number):Promise<{xp:number}>; completeLevel(level:number):Promise<void>; resetDemo():Promise<void>}
