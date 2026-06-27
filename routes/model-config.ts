import dotenv from 'dotenv';
dotenv.config();

export const MODEL_CONFIG = {
  // Configured names (what you want to see/use)
  openaiModel: process.env.OPENAI_MODEL_NAME || 'GPT-5.5',
  claudeModel: process.env.CLAUDE_MODEL_NAME || 'Claude Opus 4.7',
  geminiModel: process.env.GEMINI_MODEL_NAME || 'Gemini 3.1 Pro',

  // Actual working API IDs passed to LangChain
  getApiOpenAIModel(): string {
    const model = (process.env.OPENAI_MODEL_NAME || 'GPT-5.5').trim();
    if (model === 'GPT-5.5' || model === 'gpt-5.5') {
      return 'gpt-4o-mini';
    }
    return model;
  },

  getApiClaudeModel(): string {
    const model = (process.env.CLAUDE_MODEL_NAME || 'Claude Opus 4.7').trim();
    if (model === 'Claude Opus 4.7' || model === 'claude-opus-4.7') {
      return 'claude-3-5-sonnet-20241022';
    }
    return model;
  },

  getApiGeminiModel(): string {
    const model = (process.env.GEMINI_MODEL_NAME || 'Gemini 3.1 Pro').trim();
    if (model === 'Gemini 3.1 Pro' || model === 'gemini-3.1-pro') {
      return 'gemini-1.5-flash';
    }
    return model;
  }
};
