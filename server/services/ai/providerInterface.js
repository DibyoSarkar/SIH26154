// Every AI provider must implement this shape. The rest of the app
// (aiService.js and everything above it) only ever talks to this interface,
// never to a specific vendor SDK. To add OpenAI or Gemini: create
// openaiProvider.js / geminiProvider.js implementing the same two methods,
// then register it in providerFactory.js.
export class AIProvider {
  /**
   * @param {object} params
   * @param {string} params.system - system prompt
   * @param {Array<{role:'user'|'assistant', content:string|Array}>} params.messages
   * @param {number} [params.maxTokens]
   * @param {boolean} [params.json] - if true, provider should push the model toward strict JSON output
   * @returns {Promise<string>} raw text response
   */
  async complete({ system, messages, maxTokens, json }) {
    throw new Error('Not implemented');
  }

  /**
   * Vision-capable completion for image OCR / understanding.
   * @param {object} params
   * @param {string} params.system
   * @param {string} params.prompt
   * @param {string} params.base64Image
   * @param {string} params.mediaType - e.g. image/png
   */
  async completeWithImage({ system, prompt, base64Image, mediaType }) {
    throw new Error('Not implemented');
  }
}
