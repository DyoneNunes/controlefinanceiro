const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config({ path: '../../.env' });

const API_KEY = process.env.GEMINI_API_KEY;

async function runBateriaTestes() {
  console.log("--- INICIANDO BATERIA DE TESTES ---");
  
  try {
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const listData = await listResponse.json();
    
    if (listData.error) {
      console.error("Erro ao listar modelos:", listData.error.message);
      return;
    }

    const availableModels = listData.models
      .filter(m => m.supportedGenerationMethods.includes("generateContent"))
      .map(m => m.name.replace('models/', ''));

    console.log(`Encontrados ${availableModels.length} modelos candidatos.`);

    const genAI = new GoogleGenerativeAI(API_KEY);

    for (const modelName of availableModels) {
      process.stdout.write(`Testando ${modelName}... `);
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await Promise.race([
          model.generateContent("Diga 'OK'"),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
        ]);
        const text = await result.response.text();
        console.log(`✅ FUNCIONOU! Resposta: ${text.trim()}`);
      } catch (err) {
        console.log(`❌ FALHOU: ${err.message.replace(/\n/g, ' ')}`);
      }
    }

  } catch (globalErr) {
    console.error("Erro global no script:", globalErr);
  }
}

runBateriaTestes();
