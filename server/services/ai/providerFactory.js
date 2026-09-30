import { GeminiProvider } from './geminiProvider.js';

let instance = null;

export function getAIProvider() {
  if (instance) return instance;

  const providerName = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

  switch (providerName) {
    case 'gemini':
      instance = new GeminiProvider();
      break;
    default:
      throw new Error(
        `Unknown AI_PROVIDER "${providerName}". This build supports "gemini".`
      );
  }

  return instance;
}
