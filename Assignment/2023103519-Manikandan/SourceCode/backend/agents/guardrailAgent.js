/**
 * Security & Guardrail Agent
 * Evaluates inputs & execution payloads for PII, prompt injections, and risk scoring.
 */
function evaluateSafety({ userGoal }) {
  const goalLower = userGoal.toLowerCase();
  
  // 1. Check for prompt injection patterns
  const injectionPatterns = [
    'ignore previous instructions',
    'system prompt override',
    'drop database',
    'rm -rf',
    'bypass security'
  ];

  const hasInjection = injectionPatterns.some(pattern => goalLower.includes(pattern));
  
  if (hasInjection) {
    return {
      isSafe: false,
      riskScore: 0.98,
      reason: 'PROMPT_INJECTION_DETECTED',
      violationType: 'SECURITY_SHIELD_BLOCK'
    };
  }

  // 2. Check risk score based on intent
  let riskScore = 0.15; // default low risk
  if (goalLower.includes('delete') || goalLower.includes('drop') || goalLower.includes('deploy') || goalLower.includes('override')) {
    riskScore = 0.82;
  } else if (goalLower.includes('update') || goalLower.includes('write') || goalLower.includes('script')) {
    riskScore = 0.55;
  }

  // 3. PII Scrubbing (Regex detection)
  const piiRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b|\b\d{3}-\d{2}-\d{4}\b/;
  const hasPII = piiRegex.test(userGoal);

  return {
    isSafe: true,
    riskScore,
    containsPII: hasPII,
    sanitizedGoal: hasPII ? userGoal.replace(piiRegex, '[PII-SCRUBBED]') : userGoal
  };
}

module.exports = { evaluateSafety };
