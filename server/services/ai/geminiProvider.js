import { GoogleGenAI } from '@google/genai';
import { AIProvider } from './providerInterface.js';

export class GeminiProvider extends AIProvider {
  constructor() {
    super();

    if (!process.env.GEMINI_API_KEY) {
      console.warn(
        '[geminiProvider] GEMINI_API_KEY is not set. AI calls will fail until it is configured in server/.env'
      );
    }

    this.client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Gemini 2.5 Flash is a stable, multimodal model with structured-output support.
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  async complete({ system, messages, maxTokens = 4000, json = false }) {
    const finalSystem = json
      ? `${system}\n\nCRITICAL: Respond with ONLY valid JSON. No markdown code fences, no preamble, no commentary. The entire response body must be parseable by JSON.parse().`
      : system;

    const contents = messages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [
        {
          text:
            typeof message.content === 'string'
              ? message.content
              : JSON.stringify(message.content),
        },
      ],
    }));

    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: {
        systemInstruction: finalSystem,
        maxOutputTokens: maxTokens,
        ...(json ? { responseMimeType: 'application/json' } : {}),
      },
    });

    return response.text || '';
  }

  async completeWithImage({ system, prompt, base64Image, mediaType }) {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mediaType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        systemInstruction: system,
        maxOutputTokens: 2000,
      },
    });

    return response.text || '';
  }
}
