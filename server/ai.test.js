/* eslint-disable no-undef */
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

describe('AI Integration Test', () => {
  it('should receive a response from Gemini API', async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('GEMINI_API_KEY não encontrada no segredo do GitHub. Pulando teste real.');
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
      const result = await model.generateContent("Diga 'OK'");
      const response = await result.response;
      const text = response.text();
      
      expect(text.trim().toUpperCase()).toContain("OK");
    } catch (error) {
      throw new Error(`Falha na IA: ${error.message}`);
    }
  }, 30000); // Timeout aumentado para 30s
});
