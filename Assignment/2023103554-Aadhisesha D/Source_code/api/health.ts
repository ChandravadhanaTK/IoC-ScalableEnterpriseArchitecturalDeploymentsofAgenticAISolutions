import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    status: 'ok',
    provider: 'gemini',
    model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite',
    apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
  });
}
