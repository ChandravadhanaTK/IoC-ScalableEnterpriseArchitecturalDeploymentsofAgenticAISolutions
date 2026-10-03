import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';
export const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const FALLBACK_GEMINI_MODELS = ['gemini-flash-lite-latest', 'gemini-2.5-flash'];

type JsonSchema = {
  type?: string;
  properties?: Readonly<Record<string, JsonSchema>>;
  required?: readonly string[];
  items?: JsonSchema;
  enum?: readonly unknown[];
  minItems?: number;
  maxItems?: number;
};

export class GeminiRequestError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'GeminiRequestError';
  }
}

export function clientError(error: unknown) {
  if (error instanceof GeminiRequestError) return { statusCode: error.statusCode, message: error.message };
  const detail = error instanceof Error ? error.message : '';
  if (/too short|required|specify|submit an answer/i.test(detail)) return { statusCode: 400, message: detail };
  return { statusCode: 500, message: 'The request could not be completed. Please check the input and retry.' };
}

export function loadLocalEnvironment() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const entry = line.trim();
      if (!entry || entry.startsWith('#')) continue;
      const separator = entry.indexOf('=');
      if (separator < 1) continue;
      const name = entry.slice(0, separator).trim();
      let value = entry.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (process.env[name] === undefined) process.env[name] = value;
    }
  } catch {
    // Deployed environments provide variables directly.
  }
}

export function getGeminiConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY?.trim() || '',
    model: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    baseUrl: (process.env.GEMINI_BASE_URL?.trim() || DEFAULT_GEMINI_BASE_URL).replace(/\/+$/, ''),
  };
}

function validateValue(value: unknown, schema: JsonSchema, path = 'response'): string | undefined {
  if (schema.enum && !schema.enum.includes(value)) return `${path} is not an allowed value`;
  if (schema.type === 'object') {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return `${path} must be an object`;
    const object = value as Record<string, unknown>;
    for (const key of schema.required || []) if (!(key in object)) return `${path}.${key} is required`;
    for (const [key, childSchema] of Object.entries(schema.properties || {})) {
      if (key in object) {
        const error = validateValue(object[key], childSchema, `${path}.${key}`);
        if (error) return error;
      }
    }
    return undefined;
  }
  if (schema.type === 'array') {
    if (!Array.isArray(value)) return `${path} must be an array`;
    if (schema.minItems !== undefined && value.length < schema.minItems) return `${path} must contain at least ${schema.minItems} items`;
    if (schema.maxItems !== undefined && value.length > schema.maxItems) return `${path} must contain no more than ${schema.maxItems} items`;
    if (schema.items) for (let i = 0; i < value.length; i += 1) {
      const error = validateValue(value[i], schema.items, `${path}[${i}]`);
      if (error) return error;
    }
  }
  if (schema.type === 'string' && typeof value !== 'string') return `${path} must be a string`;
  if (schema.type === 'boolean' && typeof value !== 'boolean') return `${path} must be a boolean`;
  if (schema.type === 'integer' && !Number.isInteger(value)) return `${path} must be an integer`;
  if (schema.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) return `${path} must be a number`;
  return undefined;
}

function parseJson(text: string, schema: JsonSchema): unknown {
  const candidate = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  let value: unknown;
  try { value = JSON.parse(candidate); } catch { throw new GeminiRequestError('Gemini returned invalid JSON. Please retry.', 502); }
  const validationError = validateValue(value, schema);
  if (validationError) throw new GeminiRequestError(`Gemini returned incomplete structured output (${validationError}).`, 502);
  return value;
}

function toGeminiSchema(schema: JsonSchema): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (schema.type) result.type = schema.type.toUpperCase();
  if (schema.properties) {
    result.properties = Object.fromEntries(Object.entries(schema.properties).map(([key, value]) => [key, toGeminiSchema(value)]));
  }
  if (schema.required) result.required = [...schema.required];
  if (schema.items) result.items = toGeminiSchema(schema.items);
  // Gemini response schemas only accept string enum values. Numeric enums
  // remain enforced by validateValue after the response is parsed.
  if (schema.enum && schema.enum.every((value) => typeof value === 'string')) result.enum = [...schema.enum];
  // Gemini's responseSchema supports array items, but not JSON Schema's
  // minItems/maxItems keywords. Keep those constraints in validateValue so
  // the provider receives only the supported schema subset.
  return result;
}

function providerMessage(status: number) {
  if (status === 400) return 'Gemini rejected the request. Check the model and structured output configuration.';
  if (status === 401 || status === 403) return 'Gemini API authentication failed. Check GEMINI_API_KEY.';
  if (status === 404) return 'The configured Gemini model was not found. Check GEMINI_MODEL.';
  if (status === 429) return 'Gemini rate limit reached. Please retry shortly.';
  if (status >= 500) return 'Gemini is temporarily unavailable. Please retry.';
  return `Gemini request failed (${status}).`;
}

export async function geminiChatJson<T>(prompt: string, schema: JsonSchema, retryInstruction = 'Return a complete JSON object satisfying every required field.') {
  const { apiKey, model, baseUrl } = getGeminiConfig();
  if (!apiKey) throw new GeminiRequestError('GEMINI_API_KEY is not configured on the server.', 503);
  const request = async (text: string, requestModel: string) => {
    const response = await fetch(`${baseUrl}/models/${encodeURIComponent(requestModel)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: { temperature: 0.35, responseMimeType: 'application/json', responseSchema: toGeminiSchema(schema) },
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error(`Gemini request failed for ${requestModel} (${response.status}): ${detail.slice(0, 300)}`);
      throw new GeminiRequestError(providerMessage(response.status), response.status >= 500 ? 503 : response.status);
    }
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const textOutput = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    if (!textOutput.trim()) throw new GeminiRequestError('Gemini returned an empty response. Please retry.', 502);
    return parseJson(textOutput, schema) as T;
  };
  const started = Date.now();
  const models = [model, ...FALLBACK_GEMINI_MODELS.filter((candidate) => candidate !== model)];
  let lastError: unknown;
  try {
    const requestText = `${prompt}\n\nReturn only one valid JSON object matching this schema:\n${JSON.stringify(schema)}`;
    for (const candidateModel of models) {
      try {
        return { data: await request(requestText, candidateModel), tokens: undefined, durationMs: Date.now() - started, usedModel: candidateModel };
      } catch (error) {
        lastError = error;
        if (!(error instanceof GeminiRequestError) || ![404, 429, 503].includes(error.statusCode)) throw error;
      }
    }
    throw lastError;
  } catch (error) {
    if (!(error instanceof GeminiRequestError) || !/invalid JSON|incomplete structured output/i.test(error.message)) throw error;
    return { data: await request(`${prompt}\n\nREPAIR: ${retryInstruction}\nSchema:\n${JSON.stringify(schema)}`, model), tokens: undefined, durationMs: Date.now() - started, usedModel: model };
  }
}
