import { getGeminiConfig, loadLocalEnvironment, geminiChatJson, GeminiRequestError } from './server/gemini';
import { handlePlacementAnalysis } from './server/placementAnalysis';

loadLocalEnvironment();

const config = getGeminiConfig();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  assert(config.apiKey, 'GEMINI_API_KEY is missing.');
  assert(config.model, 'GEMINI_MODEL is missing.');
  assert(config.baseUrl, 'GEMINI_BASE_URL is missing.');

  console.log(`Gemini integration test: model=${config.model}`);
  try {
    const direct = await geminiChatJson<{ status: string }>('Respond with status "GEMINI_OK".', {
      type: 'object', properties: { status: { type: 'string' } }, required: ['status'],
    });
    assert(direct.data.status === 'GEMINI_OK', 'The Gemini response did not contain GEMINI_OK.');
    console.log('Direct Gemini request: PASS (structured response received)');
  } catch (error) {
    console.error('Gemini integration test failed');
    if (error instanceof GeminiRequestError) {
      console.error(`Status: ${error.statusCode}`);
      console.error(`Message: ${error.message}`);
    } else {
      console.error(`Message: ${error instanceof Error ? error.message : 'Unknown failure'}`);
    }
    throw error;
  }

  if (process.argv.includes('--direct')) return;
  const result = await handlePlacementAnalysis({
    resumeText: 'Software engineer with Java, Python, TypeScript, React, SQL, Node.js, and Docker. Built REST APIs, deployed web applications, and collaborated using Git. Education: BS Computer Science. Project: a full-stack task manager with a React interface and Node.js API.',
    jobDescription: 'Full Stack Engineer responsible for building frontend features with React and TypeScript, backend services with Node.js, REST APIs, and SQL data models. Requirements include Git, data structures and algorithms, code review, testing, and collaboration across product and engineering.',
    careerGoal: 'Full Stack Engineer',
  });
  assert(result.resume && result.job && result.skillGap && result.interview && result.careerPlan && result.agentRun, 'Placement analysis response is missing a required section.');
  assert(result.agentRun.status === 'completed', 'Placement analysis did not complete.');
  assert(result.agentRun.steps.length > 0 && result.agentRun.steps.every((step) => step.status === 'completed'), 'One or more agent steps did not complete.');
  assert(result.careerPlan.sevenDayPlan.length === 7, 'The preparation plan does not contain seven days.');
  console.log(`PlacementPilot workflow: PASS (${result.agentRun.steps.length} agent steps; resume, job, skillGap, interview, planner and agentRun verified)`);
}

main().catch((error: unknown) => {
  if (error instanceof GeminiRequestError) console.error(`PlacementPilot workflow failed (HTTP ${error.statusCode}): ${error.message}`);
  else console.error(`PlacementPilot workflow failed: ${error instanceof Error ? error.message : 'Unknown failure'}`);
  process.exitCode = 1;
});
