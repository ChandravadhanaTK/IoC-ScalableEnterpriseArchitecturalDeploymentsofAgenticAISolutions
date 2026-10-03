import { analyzeResume } from './agents/resumeAgent.js';
import { matchJob } from './agents/matchingAgent.js';
import { createPlan } from './agents/preparationAgent.js';
import { addItem } from './store.js';
import { id, now } from './utils.js';

export function runPipeline({ resume, jobDescription }) {
  const traceId = id('trace');
  const started = Date.now();
  const steps = [];
  const span = (agent, state, result) => steps.push({ agent, state, timestamp: now(), durationMs: 0, result });

  try {
    const resumeResult = analyzeResume(resume);
    span('Resume Analysis Agent', resumeResult.injectionDetected ? 'BLOCKED' : 'COMPLETED', {
      skillsFound: resumeResult.skills.length,
      injectionDetected: resumeResult.injectionDetected
    });
    if (resumeResult.injectionDetected) {
      throw new Error('Potential prompt injection detected in the supplied resume text. Remove instruction-like content and retry.');
    }

    const matchResult = matchJob(resumeResult.skills, jobDescription);
    span('Job Matching Agent', 'COMPLETED', { score: matchResult.score, missing: matchResult.missingSkills.length });

    const plan = createPlan(matchResult.missingSkills);
    span('Preparation Agent', 'COMPLETED', { weeks: plan.length });

    const result = {
      traceId,
      state: 'AWAITING_APPROVAL',
      profile: resumeResult,
      match: matchResult,
      preparationPlan: plan,
      message: 'Pipeline completed. Review the generated plan before creating an application.'
    };

    addItem('traces', {
      id: traceId, createdAt: now(), status: 'COMPLETED', totalDurationMs: Date.now() - started,
      steps
    });
    return result;
  } catch (error) {
    addItem('traces', {
      id: traceId, createdAt: now(), status: 'FAILED', totalDurationMs: Date.now() - started,
      steps, error: error.message
    });
    throw Object.assign(new Error(error.message), { traceId });
  }
}
