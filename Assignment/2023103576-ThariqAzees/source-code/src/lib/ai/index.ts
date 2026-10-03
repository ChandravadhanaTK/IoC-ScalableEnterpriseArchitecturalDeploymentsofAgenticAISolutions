import OpenAI from 'openai';
import { ProfileEnhancementResult } from '../types';
import { matchProject as coreMatchProject, MatchInput, MatchResult } from '../../../index';

// Initialize OpenAI client safely
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY') {
    return null;
  }
  return new OpenAI({ apiKey });
};

/** Helper to call OpenAI with timeout */
async function callOpenAIWithTimeout<T>(
  fn: (openai: OpenAI) => Promise<T>,
  timeoutMs = 8000
): Promise<T | null> {
  const openai = getOpenAIClient();
  if (!openai) return null;

  try {
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('OpenAI request timed out')), timeoutMs)
    );
    return await Promise.race([fn(openai), timeoutPromise]);
  } catch (error) {
    console.warn('[AI Service Warning] OpenAI call failed or timed out:', error);
    return null;
  }
}

/** 1. AI PROFILE ENHANCER */
export async function enhanceProfileWithAI(params: {
  headline?: string;
  bio?: string;
  skills: string[];
  experienceLevel?: string;
  portfolio: { title: string; description: string; technologies: string[] }[];
}): Promise<ProfileEnhancementResult> {
  const prompt = `Analyze this freelancer profile and optimize it for high-paying client contracts:
Headline: ${params.headline || 'Not specified'}
Bio: ${params.bio || 'Not specified'}
Skills: ${params.skills.join(', ') || 'None listed'}
Experience Level: ${params.experienceLevel || 'INTERMEDIATE'}
Portfolio Work: ${params.portfolio.map(p => `${p.title} (${p.technologies.join(', ')}): ${p.description}`).join('; ')}

Return ONLY valid JSON matching this structure:
{
  "improvedHeadline": "A high-impact 1-line headline showcasing value and tech stack",
  "improvedBio": "A persuasive 2-3 paragraph professional bio emphasizing results, skills, and client outcome focus",
  "recommendedSkills": ["Skill1", "Skill2", "Skill3"],
  "improvementSuggestions": ["Actionable suggestion 1", "Actionable suggestion 2", "Actionable suggestion 3"]
}`;

  const aiResult = await callOpenAIWithTimeout(async (openai) => {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an elite Tech Career Coach & Profile Optimizer.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });
    const text = res.choices[0]?.message?.content;
    return text ? JSON.parse(text) as ProfileEnhancementResult : null;
  });

  if (aiResult) return aiResult;

  // Fallback intelligent enhancement
  const primarySkill = params.skills[0] || 'Software Developer';
  return {
    improvedHeadline: `Expert ${primarySkill} Specialist | Building High-Performance SaaS & Digital Products`,
    improvedBio: `${params.bio || 'Dedicated technology specialist crafting robust scalable solutions.'}\n\nOver my career, I focus on delivering clean, maintainable code and exceptional user experiences. I collaborate closely with engineering teams and clients to turn requirements into production-ready software.`,
    recommendedSkills: Array.from(new Set([...params.skills, 'TypeScript', 'System Architecture', 'CI/CD', 'REST APIs'])),
    improvementSuggestions: [
      'Add quantitative metrics to your portfolio descriptions (e.g., "Improved page speed by 40%")',
      'Highlight specific domain expertise like Fintech, HealthTech, or E-commerce',
      'Detail your availability and preferred team workflow in your bio'
    ]
  };
}

/** 2. AI PROJECT MATCHING */
export function calculateProjectMatch(params: MatchInput): MatchResult {
  return coreMatchProject(params);
}

/** 3. AI PROPOSAL GENERATOR */
export async function generateProposalWithAI(params: {
  projectTitle: string;
  projectDescription: string;
  requiredSkills: string[];
  freelancerName: string;
  freelancerSkills: string[];
  experienceLevel?: string;
  portfolio: { title: string; description: string; technologies: string[] }[];
}): Promise<string> {
  const prompt = `Write a persuasive, customized freelance proposal for this project:
Project Title: ${params.projectTitle}
Project Description: ${params.projectDescription}
Required Skills: ${params.requiredSkills.join(', ')}

Freelancer: ${params.freelancerName} (${params.experienceLevel || 'Intermediate'})
Freelancer Skills: ${params.freelancerSkills.join(', ')}
Relevant Work: ${params.portfolio.map(p => `${p.title}: ${p.description}`).join('; ')}

Format in clear, concise markdown paragraphs. Keep it professional, client-centric, directly addressing the project's pain points.`;

  const aiProposal = await callOpenAIWithTimeout(async (openai) => {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a top 1% Freelance Proposal Copywriter.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });
    return res.choices[0]?.message?.content || null;
  });

  if (aiProposal) return aiProposal;

  // Smart fallback template
  const matchingSkills = params.requiredSkills.filter(s => params.freelancerSkills.includes(s));
  return `Hi there,

I reviewed your project "${params.projectTitle}" and am confident I am a great fit for your requirements.

Why I am well-suited for this project:
• **Skill Alignment:** I have deep expertise in ${matchingSkills.length ? matchingSkills.join(', ') : params.freelancerSkills.slice(0, 3).join(', ')}.
• **Proven Track Record:** ${params.portfolio[0] ? `Recently completed "${params.portfolio[0].title}", where I ${params.portfolio[0].description.toLowerCase()}` : 'I focus on clean, scalable code and timely delivery.'}
• **Approach:** I will ensure quick communication, regular updates, and thorough testing throughout the development lifecycle.

I can start immediately and deliver high quality work according to your timeline. Let us connect to discuss the details!

Best regards,
${params.freelancerName}`;
}

/** 4. AI COMMUNITY MODERATION */
export async function moderatePostWithAI(body: string, category: string): Promise<{ verdict: 'SAFE' | 'REVIEW' | 'BLOCK'; reason: string }> {
  // Regex check for spam/suspicious URLs or explicit abuse
  const hasSuspiciousUrl = /(https?:\/\/[^\s]+)/gi.test(body) && /(scam|cheap|followers|money|crypto-free|click)/i.test(body);
  if (hasSuspiciousUrl) {
    return { verdict: 'REVIEW', reason: 'Flagged for suspicious external marketing URL.' };
  }

  const aiResult = await callOpenAIWithTimeout(async (openai) => {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a community content moderator for a professional developer platform. Classify content into SAFE, REVIEW (borderline spam/advertising), or BLOCK (hate speech, malware, illegal).' },
        { role: 'user', content: `Category: ${category}\nBody: ${body}` }
      ],
      response_format: { type: 'json_object' }
    });
    const text = res.choices[0]?.message?.content;
    return text ? JSON.parse(text) : null;
  });

  if (aiResult?.verdict) {
    return { verdict: aiResult.verdict, reason: aiResult.reason || 'AI moderation completed' };
  }

  // Safe fallback
  return { verdict: 'SAFE', reason: 'Content passes automated safety heuristics.' };
}

/** 5. AI FREELANCING ASSISTANT */
export async function askFreelancingAssistant(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
  const systemPrompt = `You are SkillBridge AI Freelancing Assistant, a friendly, practical, and highly knowledgeable career guide for tech freelancers and clients. Provide actionable advice on pricing, client communication, proposal writing, portfolio building, and upskilling. Keep answers clear, structured with bullet points, and practical.`;

  const aiReply = await callOpenAIWithTimeout(async (openai) => {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7
    });
    return res.choices[0]?.message?.content || null;
  });

  if (aiReply) return aiReply;

  // Fallback responses based on user query
  const lastUserQuery = messages[messages.length - 1]?.content.toLowerCase() || '';
  if (lastUserQuery.includes('price') || lastUserQuery.includes('rate') || lastUserQuery.includes('cost')) {
    return `💰 **Pricing Strategy Advice:**\n\n1. **Value-Based vs Hourly:** For fixed scope projects, price by estimated value rather than hours.\n2. **Benchmark Your Level:**\n   - Beginner: $30 - $50/hr\n   - Intermediate: $55 - $90/hr\n   - Expert: $95 - $150+/hr\n3. **Include Buffer:** Always add a 15-20% buffer for unexpected revisions or scope creep.`;
  }

  if (lastUserQuery.includes('portfolio')) {
    return `🎨 **Portfolio Optimization Tips:**\n\n1. **Quality over Quantity:** Showcase 3-4 deep case studies rather than 10 simple repos.\n2. **Show Impact:** Include metrics (e.g. "Reduced bundle size by 35%" or "Served 50k users").\n3. **Live Demos & Tech Stack:** Provide live links and clearly list technologies used.`;
  }

  return `🤖 **SkillBridge Assistant:**\n\nTo succeed as a freelancer on SkillBridge AI:\n• Keep your profile updated with your top skills and recent portfolio projects.\n• Tailor every proposal to the client's specific problem statement.\n• Build community reputation by contributing advice in the Community feed.`;
}
