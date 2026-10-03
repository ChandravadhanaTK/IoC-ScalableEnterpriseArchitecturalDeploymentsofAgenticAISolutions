import { GoogleGenerativeAI } from '@google/generative-ai';

export const getGeminiApiKey = (): string => {
  const customKey = localStorage.getItem('plantcare_gemini_api_key');
  if (customKey && customKey.trim().length > 0) {
    return customKey.trim();
  }
  return import.meta.env.VITE_GEMINI_API_KEY || '';
};

export const setGeminiApiKey = (key: string) => {
  if (key) {
    localStorage.setItem('plantcare_gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('plantcare_gemini_api_key');
  }
};

export const getGeminiClient = (): GoogleGenerativeAI | null => {
  const apiKey = getGeminiApiKey();
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};
