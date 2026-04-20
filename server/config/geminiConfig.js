

const { GoogleGenerativeAI } = require('@google/generative-ai');

const FREE_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash'
];

const PRO_MODELS = [
    'gemini-2.5-pro',
    'gemini-2.0-pro-exp'
];

const DEFAULT_FREE_MODEL = 'gemini-2.5-flash';
const DEFAULT_PRO_MODEL = 'gemini-2.5-pro';

function detectKeyType(apiKey) {
    if (!apiKey) return 'unknown';

    const keyLower = apiKey.toLowerCase();

    if (keyLower.includes('free') || keyLower.includes('trial')) {
        return 'free';
    }

    if (process.env.GEMINI_PLAN_TYPE === 'pro' || process.env.GEMINI_PLAN_TYPE === 'paid') {
        return 'pro';
    }

    if (process.env.GEMINI_PLAN_TYPE === 'free') {
        return 'free';
    }

    const explicitModel = process.env.GEMINI_MODEL;
    if (explicitModel) {
        if (PRO_MODELS.includes(explicitModel)) {
            return 'pro';
        }
        return 'free';
    }

    return 'free';
}

function getRecommendedModel(apiKey, explicitModel) {
    if (explicitModel) {
        return explicitModel;
    }

    const keyType = detectKeyType(apiKey);

    if (keyType === 'pro') {
        return process.env.GEMINI_PRO_MODEL || DEFAULT_PRO_MODEL;
    }

    return process.env.GEMINI_FREE_MODEL || DEFAULT_FREE_MODEL;
}

function createGenerativeModel(apiKey, modelName) {
    const genAI = new GoogleGenerativeAI(apiKey);

    const recommendedModel = getRecommendedModel(apiKey, modelName);

    const isProModel = PRO_MODELS.includes(recommendedModel);

    console.log(`🤖 Gemini Model Configuration:`);
    console.log(`   - API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`   - Detected Plan: ${detectKeyType(apiKey)}`);
    console.log(`   - Selected Model: ${recommendedModel}`);
    console.log(`   - Model Type: ${isProModel ? 'PRO (Paid)' : 'Free'}`);

    return {
        client: genAI,
        model: recommendedModel,
        modelType: isProModel ? 'pro' : 'free',
        isCompatible: true
    };
}

function getModelConfig() {
    const apiKey = process.env.GEMINI_API_KEY;
    const explicitModel = process.env.GEMINI_MODEL;

    return {
        apiKey: apiKey,
        model: getRecommendedModel(apiKey, explicitModel),
        planType: detectKeyType(apiKey),
        availableModels: {
            free: FREE_MODELS,
            pro: PRO_MODELS
        },
        defaults: {
            free: DEFAULT_FREE_MODEL,
            pro: DEFAULT_PRO_MODEL
        }
    };
}

module.exports = {
    FREE_MODELS,
    PRO_MODELS,
    DEFAULT_FREE_MODEL,
    DEFAULT_PRO_MODEL,
    detectKeyType,
    getRecommendedModel,
    createGenerativeModel,
    getModelConfig
};
