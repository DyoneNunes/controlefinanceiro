const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

describe('AI Integration Test', () => {
  it('should receive a response from Gemini API', async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Se não houver chave (ambiente de CI sem segredo), o teste pula para não falhar o build por falta de config
    if (!apiKey) {
      console.warn('GEMINI_API_KEY não encontrada. Pulando teste de integração real.');
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
      const result = await model.generateContent("Responda apenas com a palavra: OK");
      const response = await result.response;
      const text = response.text();
      
      expect(text.trim()).toContain("OK");
    } catch (error) {
      throw new Error(`Falha na comunicação com a IA: ${error.message}`);
    }
  }, 20000); // Timeout de 20s para a IA responder
});
