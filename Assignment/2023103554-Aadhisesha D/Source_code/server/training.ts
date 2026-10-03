import type {
  Difficulty,
  PlacementAnalysis,
  QuestionType,
  TrainingEvaluation,
  TrainingQuestion,
  TrainingRequest,
} from '../src/types/placement';
import { callGemini, now, runId } from './placementAnalysis.js';

const questionSchema = {
  type: 'object', properties: {
    id: { type: 'string' }, type: { type: 'string', enum: ['mcq','coding','technical','behavioral','project','system-design','case'] },
    difficulty: { type: 'string', enum: ['easy','medium','hard'] }, title: { type: 'string' }, prompt: { type: 'string' },
    options: { type: 'array', items: { type: 'string' } }, answerIndex: { type: 'integer' }, starterCode: { type: 'string' },
    examples: { type: 'array', items: { type: 'object', properties: { input:{type:'string'}, output:{type:'string'} }, required:['input','output'] } },
    timeLimitMinutes: { type: 'integer' }, skills: { type: 'array', items: { type:'string' } }, evaluationRubric: { type:'array', items: { type:'string' } },
    hints: { type: 'array', items: { type:'string' } }, referenceAnswer: { type: 'string' }, referenceExplanation: { type: 'string' },
  }, required:['id','type','difficulty','title','prompt','timeLimitMinutes','skills','evaluationRubric'],
} as const;

const evaluationSchema = {
  type: 'object', properties: {
    score: { type:'integer' }, verdict: { type:'string', enum:['strong','good','needs-work','redo'] }, feedback:{type:'string'},
    strengths:{type:'array',items:{type:'string'}}, improvements:{type:'array',items:{type:'string'}}, idealAnswer:{type:'string'},
    criteria:{type:'array',items:{type:'object',properties:{name:{type:'string'},score:{type:'number'},feedback:{type:'string'}},required:['name','score','feedback']}}, tested:{type:'boolean'},
  }, required:['score','verdict','feedback','strengths','improvements','idealAnswer'],
} as const;

function clamp(n: unknown, fallback=60) {
  const value = Number(n);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : fallback;
}
function asArray(value: unknown): string[] { return Array.isArray(value) ? value.map(String).map((x)=>x.trim()).filter(Boolean) : []; }
function safe(value: unknown, fallback=''): string { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }
function normalizeQuestion(raw: any, requestedType: QuestionType, difficulty: Difficulty): TrainingQuestion {
  return {
    id: safe(raw?.id, runId('Q')), type: ['mcq','coding','technical','behavioral','project','system-design','case'].includes(raw?.type) ? raw.type : requestedType,
    difficulty: ['easy','medium','hard'].includes(raw?.difficulty) ? raw.difficulty : difficulty,
    title: safe(raw?.title, 'Role-specific practice question'), prompt: safe(raw?.prompt, 'Explain your approach and the trade-offs you considered.'),
    options: asArray(raw?.options).slice(0,5), answerIndex: Number.isInteger(raw?.answerIndex) ? raw.answerIndex : undefined,
    starterCode: safe(raw?.starterCode, ''), examples: Array.isArray(raw?.examples) ? raw.examples.slice(0,3).map((x:any)=>({input:safe(x?.input,''),output:safe(x?.output,'')})) : [],
    timeLimitMinutes: Math.min(45, Math.max(3, Number(raw?.timeLimitMinutes) || (requestedType === 'coding' ? 25 : 8))), skills: asArray(raw?.skills).slice(0,6),
    evaluationRubric: asArray(raw?.evaluationRubric).slice(0,6),
    hints: asArray(raw?.hints).slice(0,3),
    referenceAnswer: safe(raw?.referenceAnswer, ''),
    referenceExplanation: safe(raw?.referenceExplanation, ''),
  };
}
function normalizeEval(raw:any): TrainingEvaluation {
  const score = clamp(raw?.score);
  const verdict: TrainingEvaluation['verdict'] = ['strong','good','needs-work','redo'].includes(raw?.verdict) ? raw.verdict : score >= 80 ? 'strong' : score >= 65 ? 'good' : score >= 45 ? 'needs-work' : 'redo';
  const criteria = Array.isArray(raw?.criteria) ? raw.criteria.map((item:any) => ({ name: safe(item?.name, 'Criterion'), score: Math.min(10, Math.max(0, Number(item?.score) || 0)), feedback: safe(item?.feedback, 'No criterion feedback supplied.') })).slice(0, 8) : undefined;
  return { score, verdict, feedback:safe(raw?.feedback,'Review the reasoning and make the explanation more evidence-driven.'), strengths:asArray(raw?.strengths).slice(0,5), improvements:asArray(raw?.improvements).slice(0,5), idealAnswer:safe(raw?.idealAnswer,'A strong answer is concise, structured and grounded in the role requirements.'), criteria, tested: raw?.tested === true ? true : raw?.tested === false ? false : undefined };
}

function demoQuestion(req: TrainingRequest): TrainingQuestion {
  const role = req.job.role || 'Software Engineer';
  const focus = req.job.focusAreas[0]?.area || req.skillGap.priorityGaps[0]?.skill || 'Core fundamentals';
  const skills = req.job.requiredSkills.slice(0,3);
  const variant = (req.recentQuestionIds || []).length + 1;
  const base = { difficulty:req.difficulty, skills:skills.length ? skills : [focus], evaluationRubric:['Correctness','Role relevance','Clarity','Trade-offs'], hints:['Start by identifying the key constraint in the question.','Break the problem into smaller decisions and compare the trade-offs.','Check your approach against edge cases and the stated requirements.'] };
  if (req.type === 'mcq') {
    const topic = skills[0] || focus;
    const variants = [
      { prompt: `Which approach best demonstrates sound reasoning when choosing an implementation for ${topic}?`, options: [`Pick the shortest code even if complexity is poor`, `Choose based on constraints, correctness, complexity and operational trade-offs`, `Use the newest library regardless of requirements`, `Optimize before validating correctness`] },
      { prompt: `A ${role} service must handle growing traffic for ${topic}. Which decision should come first?`, options: [`Measure constraints and define correctness before selecting the design`, `Choose the most complex architecture immediately`, `Ignore failure modes until production`, `Copy the implementation from an unrelated system`] },
      { prompt: `During a code review focused on ${topic}, which feedback is most valuable?`, options: [`The variable names are short`, `The code uses the newest syntax`, `The approach meets requirements and makes its performance trade-offs explicit`, `The diff has as few lines as possible`] },
      { prompt: `When an implementation for ${topic} passes the happy path but has unclear edge-case behavior, what should the engineer do?`, options: [`Ship it because the main example works`, `Remove the tests to reduce maintenance`, `Clarify requirements and test boundary conditions before optimizing`, `Replace it with a random library`] },
      { prompt: `Which evidence most strongly supports an engineering choice involving ${topic}?`, options: [`A confident explanation with no measurements`, `A benchmark or reasoning tied to representative constraints`, `The number of lines changed`, `Whether the approach is fashionable`] },
    ];
    const selectedVariant = variants[(variant - 1) % variants.length];
    return { ...base, id:runId('Q'), type:'mcq', title:`${role} / ${topic} screening ${variant}`, prompt:selectedVariant.prompt, options:selectedVariant.options, answerIndex:1, timeLimitMinutes:5, referenceAnswer:selectedVariant.options[1], referenceExplanation:'Strong engineering decisions are grounded in requirements, correctness, evidence and explicit trade-offs.' };
  }
  if (req.type === 'coding') return { ...base, id:runId('Q'), type:'coding', title:`${role} / coding drill ${variant}`, prompt:`Given an array of integers, return the length of the longest contiguous subarray containing no duplicate values. Explain your algorithm and its time complexity. Keep the solution production-ready for the role.` , starterCode:'function longestUniqueSegment(nums) {\n  // write your solution\n}', examples:[{input:'[1, 2, 1, 3]',output:'3'},{input:'[4, 5, 6, 6]',output:'3'}], timeLimitMinutes:25, referenceAnswer:'Use a sliding window and a map of the latest index for each value. Move the left boundary past duplicates and track the maximum window length.', referenceExplanation:'This runs in O(n) time and O(n) space and handles duplicates, empty input, and repeated values without checking every pair.' };
  if (req.type === 'system-design') return { ...base, id:runId('Q'), type:'system-design', title:`${role} / lightweight system design`, prompt:`Design a small job-application tracker service that receives an application event, stores the latest stage, and exposes the current status to a web client. Cover API shape, persistence, idempotency, failure handling and observability.`, timeLimitMinutes:20 };
  if (req.type === 'behavioral') return { ...base, id:runId('Q'), type:'behavioral', title:`${role} / behavioral`, prompt:`Tell me about a situation where a project changed scope after you had already started implementing it. Explain what you changed, how you communicated it and what you learned.`, timeLimitMinutes:7 };
  if (req.type === 'project') return { ...base, id:runId('Q'), type:'project', title:`${role} / project deep dive`, prompt:`Pick the project on your resume that is closest to the target role. Explain its architecture, the hardest technical problem you solved, one trade-off you made, and one production improvement you would make now.`, timeLimitMinutes:8 };
  if (req.type === 'case') return { ...base, id:runId('Q'), type:'case', title:`${role} / debugging case`, prompt:`A service has a sudden increase in response latency after a new release. Walk through your debugging plan from symptom to root cause, including what telemetry you would inspect first.`, timeLimitMinutes:10 };
  return { ...base, id:runId('Q'), type:'technical', title:`${role} / focused technical`, prompt:`Explain ${focus} as it applies to the target role. Use one concrete example and compare two implementation choices where relevant.`, timeLimitMinutes:8 };
}

export async function generateTrainingQuestion(req: TrainingRequest): Promise<TrainingQuestion> {
  const requestedQuestionSchema = {
    ...questionSchema,
    properties: {
      ...questionSchema.properties,
      type: { type: 'string', enum: [req.type] },
      ...(req.type === 'mcq' ? {
        options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
        answerIndex: { type: 'integer', enum: [0, 1, 2, 3] },
      } : {}),
    },
    required: req.type === 'mcq'
      ? [...questionSchema.required, 'options', 'answerIndex']
      : questionSchema.required,
  } as const;
  const sessionSeed = req.recentQuestionFingerprints?.find(fp => fp.startsWith('SESSION:')) ?? `SESSION:${Date.now()}`;
  const recent = (req.recentQuestionIds || []).slice(-8).join(', ');
  const recentFingerprints = (req.recentQuestionFingerprints || []).filter(fp => !fp.startsWith('SESSION:')).slice(-8).join('\n');
  const result = await callGemini(
    `You are the Role Training Agent for PlacementPilot. Session ID: ${sessionSeed} — use this as entropy to ensure a unique question every call.\n\nCreate exactly one ${req.type} question at ${req.difficulty} difficulty, and set the returned type to exactly "${req.type}". The question must be realistic, role-specific, and different from the recent fingerprints. For an MCQ, include exactly 4 options and a correct answerIndex from 0 to 3. For a coding question, include clear constraints and useful starterCode or examples. For other types, write an open-ended prompt suitable for that interview format.\n\nROLE: ${JSON.stringify(req.job)}\nSKILL GAP: ${JSON.stringify(req.skillGap)}\nCANDIDATE: ${JSON.stringify(req.resume)}\nDIFFICULTY: ${req.difficulty}\nRECENT IDS TO AVOID: ${recent}\nRECENT FINGERPRINTS (do NOT reuse these topics/scenarios):\n${recentFingerprints}`,
    requestedQuestionSchema,
    `Return one valid ${req.type} question object. Match the requested type exactly${req.type === 'mcq' ? ', with exactly four options and answerIndex from 0 to 3' : ''}.`
  );
  return normalizeQuestion(result.data, req.type, req.difficulty);
}

export async function evaluateTrainingAnswer(req: TrainingRequest): Promise<TrainingEvaluation> {
  if (!req.question) throw new Error('A question is required for evaluation.');
  const answer = safe(req.answer, '');
  if (!answer && req.selectedOption == null) throw new Error('Please submit an answer first.');
  const result = await callGemini(`You are the Training Evaluator for PlacementPilot. Evaluate the candidate answer against the role-specific question and rubric. Be strict, evidence-based and fair. Score 0-100 and return criterion-level scores. Do not award high scores for keywords or confident tone. Penalize incorrect claims and missing critical requirements. For MCQ, treat the selected option as the answer. For coding, distinguish incorrect, correct-but-inefficient, correct-and-efficient and optimal approaches; assess code conceptually and set tested=false because code was not executed. Never claim test cases passed without execution.\nROLE: ${JSON.stringify(req.job)}\nQUESTION: ${JSON.stringify(req.question)}\nANSWER: ${JSON.stringify(answer)}\nSELECTED OPTION: ${req.selectedOption ?? 'none'}\nRUBRIC: ${JSON.stringify(req.question.evaluationRubric)}`, evaluationSchema, 'Return a valid evaluation object with score, verdict, feedback, strengths, improvements and idealAnswer.');
  return normalizeEval(result.data);
}
