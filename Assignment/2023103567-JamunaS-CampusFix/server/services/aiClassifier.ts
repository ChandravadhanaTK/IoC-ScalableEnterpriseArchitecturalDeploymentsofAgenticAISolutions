import { GoogleGenAI } from '@google/genai';
import type { AIClassificationResult, IssueCategory, IssuePriority } from '../models/types.ts';

const VALID_CATEGORIES: IssueCategory[] = [
  'Hostel',
  'Classroom',
  'Laboratory',
  'Library',
  'Canteen',
  'Transport',
  'Electricity',
  'Water',
  'Internet',
  'Cleanliness',
  'Other',
];

const VALID_PRIORITIES: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical'];

/**
 * Intelligent rule-based fallback classifier
 */
export function classifyWithRules(title: string, description: string): AIClassificationResult {
  const text = `${title} ${description}`.toLowerCase();

  let category: IssueCategory = 'Other';
  let priority: IssuePriority = 'Medium';
  let department = 'General Administration';
  let reasoning = 'Categorized using campus facility classification rules.';

  // 1. Water & Plumbing
  if (
    text.includes('water') ||
    text.includes('leak') ||
    text.includes('pipe') ||
    text.includes('tap') ||
    text.includes('drain') ||
    text.includes('flush') ||
    text.includes('sewage') ||
    text.includes('overflow') ||
    text.includes('plumb')
  ) {
    if (text.includes('hostel') || text.includes('room') || text.includes('bathroom') || text.includes('washroom')) {
      category = 'Hostel';
    } else {
      category = 'Water';
    }
    department = 'Plumbing & Civil Maintenance';
    reasoning = 'Water, leakage, or plumbing keywords detected.';
  }
  // 2. Electricity & Power
  else if (
    text.includes('electric') ||
    text.includes('power') ||
    text.includes('light') ||
    text.includes('fan') ||
    text.includes('socket') ||
    text.includes('switch') ||
    text.includes('short circuit') ||
    text.includes('blackout') ||
    text.includes('voltage') ||
    text.includes('ac') ||
    text.includes('air conditioner')
  ) {
    category = 'Electricity';
    department = 'Electrical Works & Power Division';
    reasoning = 'Electrical fixture or power supply issue identified.';
  }
  // 3. Internet & Network
  else if (
    text.includes('wifi') ||
    text.includes('wi-fi') ||
    text.includes('internet') ||
    text.includes('network') ||
    text.includes('lan') ||
    text.includes('router') ||
    text.includes('speed') ||
    text.includes('connection')
  ) {
    category = 'Internet';
    department = 'Network & IT Infrastructure Cell';
    reasoning = 'Network connectivity or campus Wi-Fi disruption identified.';
  }
  // 4. Cleanliness & Sanitation
  else if (
    text.includes('garbage') ||
    text.includes('clean') ||
    text.includes('dirty') ||
    text.includes('trash') ||
    text.includes('smell') ||
    text.includes('stink') ||
    text.includes('pest') ||
    text.includes('cockroach') ||
    text.includes('waste') ||
    text.includes('dust')
  ) {
    category = 'Cleanliness';
    department = 'Sanitation & Housekeeping Division';
    reasoning = 'Hygiene, trash, or sanitation requirements detected.';
  }
  // 5. Hostel
  else if (
    text.includes('hostel') ||
    text.includes('warden') ||
    text.includes('mess') ||
    text.includes('bed') ||
    text.includes('room') ||
    text.includes('dorm')
  ) {
    category = 'Hostel';
    department = 'Hostel Administration & Estate Management';
    reasoning = 'Residential / hostel amenities issue detected.';
  }
  // 6. Classroom
  else if (
    text.includes('class') ||
    text.includes('projector') ||
    text.includes('bench') ||
    text.includes('whiteboard') ||
    text.includes('blackboard') ||
    text.includes('lectern') ||
    text.includes('audio') ||
    text.includes('mic')
  ) {
    category = 'Classroom';
    department = 'Academic Facilities & Audio-Visual Cell';
    reasoning = 'Classroom instructional equipment or furniture issue detected.';
  }
  // 7. Laboratory
  else if (
    text.includes('lab') ||
    text.includes('apparatus') ||
    text.includes('chemical') ||
    text.includes('equipment') ||
    text.includes('system') ||
    text.includes('computer') ||
    text.includes('multimeter') ||
    text.includes('oscilloscope')
  ) {
    category = 'Laboratory';
    department = 'Laboratory Technical Support & Safety Cell';
    reasoning = 'Laboratory equipment or hardware malfunction identified.';
  }
  // 8. Library
  else if (
    text.includes('library') ||
    text.includes('book') ||
    text.includes('reading room') ||
    text.includes('digital library') ||
    text.includes('kiosk')
  ) {
    category = 'Library';
    department = 'Central Library Services';
    reasoning = 'Library resources or facility issue identified.';
  }
  // 9. Canteen
  else if (
    text.includes('canteen') ||
    text.includes('food') ||
    text.includes('cafeteria') ||
    text.includes('drinking water') ||
    text.includes('snack')
  ) {
    category = 'Canteen';
    department = 'Campus Hospitality & Food Safety Committee';
    reasoning = 'Canteen hygiene or food service complaint identified.';
  }
  // 10. Transport
  else if (
    text.includes('bus') ||
    text.includes('transport') ||
    text.includes('shuttle') ||
    text.includes('driver') ||
    text.includes('parking') ||
    text.includes('vehicle')
  ) {
    category = 'Transport';
    department = 'Campus Transport Fleet Operations';
    reasoning = 'College bus or transit schedule issue identified.';
  }

  // Priority Assessment
  if (
    text.includes('fire') ||
    text.includes('spark') ||
    text.includes('shock') ||
    text.includes('electric shock') ||
    text.includes('severe') ||
    text.includes('emergency') ||
    text.includes('danger') ||
    text.includes('collapsed') ||
    text.includes('bleeding') ||
    text.includes('hazard')
  ) {
    priority = 'Critical';
    reasoning += ' Flagged Critical due to immediate safety risk.';
  } else if (
    text.includes('urgent') ||
    text.includes('broken') ||
    text.includes('overflow') ||
    text.includes('exam') ||
    text.includes('leaking') ||
    text.includes('stopped working') ||
    text.includes('immediate')
  ) {
    priority = 'High';
    reasoning += ' Flagged High due to high impact on daily student activities.';
  } else if (
    text.includes('minor') ||
    text.includes('slow') ||
    text.includes('flicker') ||
    text.includes('sometime') ||
    text.includes('suggestion')
  ) {
    priority = 'Low';
    reasoning += ' Evaluated as Low priority non-blocking concern.';
  }

  return {
    category,
    priority,
    department,
    reasoning,
    confidence: 0.88,
  };
}

/**
 * AI-powered Issue Classifier with Gemini API + Rule-based fallback
 */
export async function classifyIssue(
  title: string,
  description: string,
  providedCategory?: string,
  providedPriority?: string
): Promise<AIClassificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return classifyWithRules(title, description);
  }

  try {
    const ai = new GoogleGenAI({});
    const prompt = `You are the CampusFix AI Issue Classifier for a university campus facility management system.
Analyze the following student issue report and categorize it:

Title: "${title}"
Description: "${description}"
User Selected Category (optional): "${providedCategory || 'None'}"
User Selected Priority (optional): "${providedPriority || 'None'}"

Allowed Categories:
["Hostel", "Classroom", "Laboratory", "Library", "Canteen", "Transport", "Electricity", "Water", "Internet", "Cleanliness", "Other"]

Allowed Priorities:
["Low", "Medium", "High", "Critical"]

Appropriate Campus Departments:
- "Plumbing & Civil Maintenance"
- "Electrical Works & Power Division"
- "Network & IT Infrastructure Cell"
- "Sanitation & Housekeeping Division"
- "Hostel Administration & Estate Management"
- "Academic Facilities & Audio-Visual Cell"
- "Laboratory Technical Support & Safety Cell"
- "Central Library Services"
- "Campus Hospitality & Food Safety Committee"
- "Campus Transport Fleet Operations"
- "General Administration"

Respond ONLY with a JSON object in this exact schema:
{
  "category": "one of the allowed categories",
  "priority": "one of the allowed priorities",
  "department": "appropriate campus department name",
  "reasoning": "brief explanation (max 20 words)",
  "confidence": 0.95
}`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI classification timeout')), 3500)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : 'Other';
      const priority = VALID_PRIORITIES.includes(parsed.priority) ? parsed.priority : 'Medium';
      const department = parsed.department || 'General Administration';
      const reasoning = parsed.reasoning || 'Classified by Gemini AI model.';
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.95;

      return { category, priority, department, reasoning, confidence };
    }
  } catch (error) {
    console.warn('Gemini AI classification fallback triggered:', (error as Error).message);
  }

  return classifyWithRules(title, description);
}
