export type AgentEvent={id:string;runId:string;timestamp:string;agent:string;type:string;tool?:string;confidence:number;durationMs:number;tokens:number;costUsd:number;state:string};
export const agents={
 mentor:{name:'JARVIS Mentor',tools:['search_glossary','get_level_context'],confidence:.96},
 quiz:{name:'Quiz Forge',tools:['pick_questions','adapt_difficulty'],confidence:.91},
 reviewer:{name:'Code Reviewer',tools:['run_code','run_tests','explain_error'],confidence:.94},
 analyst:{name:'Progress Analyst',tools:['compute_mastery','recommend_next'],confidence:.89},
 guardrail:{name:'Guardrail Agent',tools:['policy_check','rate_limit','topic_filter'],confidence:.99}
};
export function event(agent:keyof typeof agents,tool:string,state='completed'):AgentEvent{const a=agents[agent];return{id:crypto.randomUUID(),runId:`AF-${Date.now().toString(36)}`,timestamp:new Date().toISOString(),agent:a.name,type:'tool',tool,confidence:a.confidence,durationMs:Math.round(40+Math.random()*180),tokens:Math.round(40+Math.random()*160),costUsd:.0001,state}}
