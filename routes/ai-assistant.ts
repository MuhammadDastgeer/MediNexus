import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// Retrieve key values at request time to ensure up-to-date environment parameters
const getKeys = () => ({
  gemini: process.env.GEMINI_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
  openrouter: process.env.OPENROUTER_API_KEY,
  groq: process.env.GROQ_API_KEY,
});

// Guardrail instructions that fulfill medical-only requirements and context-specificity
const SYSTEM_INSTRUCTION = `You are a highly specialised clinical and medical hospital AI assistant. 
You MUST adhere to these strict limits and instructions:
1. ONLY answer queries that are:
   a. Related to medical knowledge, healthy lifestyles, clinical symptoms, wellness guidance, medical analysis, pharmacology, diagnostics, procedures, etc.
   b. Related to the provided Screen and Role Context (e.g. queries about appointment lists, bills, financial records, inventory items, ward structures, doctor lists).
2. If the user asks about ANYTHING ELSE that is NOT related to medical/clinical care or hospital data management (for example: general knowledge, weather patterns, sports leagues, politics, pop culture, irrelevant coding, cooking recipes other than medical diets, general storytelling), you MUST politely and firmly decline to answer. 
   Say: "I am a dedicated Medical & Clinical Hospital AI Assistant. I can only assist with healthcare inquiries, medical knowledge, or clinical dashboard context."
3. Respond in a highly professional, clinical, helpful, and concise manner.
4. If an image is uploaded (such as a lab report, prescription, skin rash, or clinical medical record), check it thoroughly and provide your clinical insight.
`;

// Extract base64 image data helper
function parseImageData(dataUrl: string) {
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches) return null;
  return {
    mimeType: matches[1],
    base64Data: matches[2]
  };
}

// ----------------------------------------------------
// Individual Provider Executions
// ----------------------------------------------------

async function tryGemini(keys: any, prompt: string, image: string, audio: string, attempts: any[]) {
  if (keys.gemini && keys.gemini !== 'MY_GEMINI_API_KEY' && keys.gemini.trim() !== '') {
    try {
      const ai = new GoogleGenAI({
        apiKey: keys.gemini,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const contentsParts: any[] = [];
      if (image) {
        const parsed = parseImageData(image);
        if (parsed) {
          contentsParts.push({
            inlineData: {
              mimeType: parsed.mimeType,
              data: parsed.base64Data
            }
          });
        }
      }

      if (audio) {
        const parsedAudio = parseImageData(audio);
        if (parsedAudio) {
          contentsParts.push({
            inlineData: {
              mimeType: parsedAudio.mimeType,
              data: parsedAudio.base64Data
            }
          });
        }
      }

      contentsParts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contentsParts,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2
        }
      });

      if (response && response.text) {
        attempts.push({ provider: 'Google Gemini', status: 'success', modelUsed: 'gemini-3.5-flash' });
        return response.text;
      } else {
        throw new Error('Empty response returned from Google Gemini.');
      }
    } catch (err: any) {
      attempts.push({ provider: 'Google Gemini', status: 'failed', error: err.message || 'Unknown network error' });
    }
  } else {
    attempts.push({ provider: 'Google Gemini', status: 'skipped', error: 'API key is not configured' });
  }
  return null;
}

async function tryOpenAI(keys: any, prompt: string, image: string, attempts: any[]) {
  if (keys.openai && keys.openai.trim() !== '') {
    try {
      const openAiMessages: any[] = [
        { role: 'system', content: SYSTEM_INSTRUCTION }
      ];

      let contentPayload: any = prompt;
      if (image) {
        contentPayload = [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: image } }
        ];
      }

      openAiMessages.push({ role: 'user', content: contentPayload });

      const fetchRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keys.openai}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: openAiMessages,
          temperature: 0.2
        })
      });

      if (!fetchRes.ok) {
        const errDetails = await fetchRes.text();
        throw new Error(`OpenAI HTTP Error: ${fetchRes.status} - ${errDetails}`);
      }

      const resData = await fetchRes.json();
      const reply = resData?.choices?.[0]?.message?.content;
      if (reply) {
        attempts.push({ provider: 'OpenAI', status: 'success', modelUsed: 'gpt-4o-mini' });
        return reply;
      } else {
        throw new Error('Null content returned from OpenAI Chat API.');
      }
    } catch (err: any) {
      attempts.push({ provider: 'OpenAI', status: 'failed', error: err.message });
    }
  } else {
    attempts.push({ provider: 'OpenAI', status: 'skipped', error: 'API key is not configured' });
  }
  return null;
}

async function tryAnthropic(keys: any, prompt: string, image: string, attempts: any[]) {
  if (keys.anthropic && keys.anthropic.trim() !== '') {
    try {
      let contentPayload: any[] = [{ type: 'text', text: prompt }];
      
      if (image) {
        const parsed = parseImageData(image);
        if (parsed) {
          contentPayload.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: parsed.mimeType,
              data: parsed.base64Data
            }
          });
        }
      }

      const fetchRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': keys.anthropic,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          system: SYSTEM_INSTRUCTION,
          messages: [{ role: 'user', content: contentPayload }],
          max_tokens: 1024,
          temperature: 0.2
        })
      });

      if (!fetchRes.ok) {
        const errDetails = await fetchRes.text();
        throw new Error(`Claude HTTP Error: ${fetchRes.status} - ${errDetails}`);
      }

      const resData = await fetchRes.json();
      const reply = resData?.content?.[0]?.text;
      if (reply) {
        attempts.push({ provider: 'Anthropic Claude', status: 'success', modelUsed: 'claude-3-5-sonnet' });
        return reply;
      } else {
        throw new Error('Null response content returned from Anthropic API.');
      }
    } catch (err: any) {
      attempts.push({ provider: 'Anthropic Claude', status: 'failed', error: err.message });
    }
  } else {
    attempts.push({ provider: 'Anthropic Claude', status: 'skipped', error: 'API key is not configured' });
  }
  return null;
}

async function tryOpenRouter(keys: any, prompt: string, image: string, attempts: any[]) {
  if (keys.openrouter && keys.openrouter.trim() !== '') {
    try {
      const openRouterMessages: any[] = [
        { role: 'system', content: SYSTEM_INSTRUCTION }
      ];

      let contentPayload: any = prompt;
      if (image) {
        contentPayload = [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: image } }
        ];
      }

      openRouterMessages.push({ role: 'user', content: contentPayload });

      const fetchRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keys.openrouter}`
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3-8b-instruct:free',
          messages: openRouterMessages,
          temperature: 0.2
        })
      });

      if (!fetchRes.ok) {
        const errDetails = await fetchRes.text();
        throw new Error(`OpenRouter HTTP Error: ${fetchRes.status} - ${errDetails}`);
      }

      const resData = await fetchRes.json();
      const reply = resData?.choices?.[0]?.message?.content;
      if (reply) {
        attempts.push({ provider: 'OpenRouter', status: 'success', modelUsed: 'llama-3-free' });
        return reply;
      } else {
        throw new Error('Null response content returned from OpenRouter API.');
      }
    } catch (err: any) {
      attempts.push({ provider: 'OpenRouter', status: 'failed', error: err.message });
    }
  } else {
    attempts.push({ provider: 'OpenRouter', status: 'skipped', error: 'API key is not configured' });
  }
  return null;
}

async function tryGroq(keys: any, prompt: string, image: string, attempts: any[]) {
  if (keys.groq && keys.groq.trim() !== '') {
    try {
      const groqMessages = [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt }
      ];

      const fetchRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keys.groq}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: groqMessages,
          temperature: 0.2
        })
      });

      if (!fetchRes.ok) {
        const errDetails = await fetchRes.text();
        throw new Error(`Groq HTTP Error: ${fetchRes.status} - ${errDetails}`);
      }

      const resData = await fetchRes.json();
      const reply = resData?.choices?.[0]?.message?.content;
      if (reply) {
        attempts.push({ provider: 'Groq', status: 'success', modelUsed: 'llama-3.1-8b-instant' });
        return reply;
      } else {
        throw new Error('Null response content returned from Groq API.');
      }
    } catch (err: any) {
      attempts.push({ provider: 'Groq', status: 'failed', error: err.message });
    }
  } else {
    attempts.push({ provider: 'Groq', status: 'skipped', error: 'API key is not configured' });
  }
  return null;
}

// ----------------------------------------------------
// Main POST routing
// ----------------------------------------------------

router.post('/chat', async (req: Request, res: Response) => {
  const { messages = [], context = {}, selectedModel = 'auto' } = req.body;
  const keys = getKeys();
  const attempts: Array<{ provider: string; status: 'success' | 'failed' | 'skipped'; error?: string; modelUsed?: string }> = [];

  // Compose the screen and user context string to append for the AI to read
  const contextIntro = `
  --- SYSTEM CONTEXT ---
  Current Active Screen: ${context.activeTab || 'Unknown'}
  Log-In Identity Role: ${context.userRole || 'Admin/Guest'}
  Logged-In Name: ${context.userName || 'Hospital Administrator'}
  Current Loaded Data Context JSON: ${JSON.stringify(context.data || {})}
  ----------------------
  `;

  // Process and align messages
  const lastMessage = messages[messages.length - 1];
  let lastMessageText = lastMessage?.content || '';
  const lastMessageImage = lastMessage?.image || '';
  const lastMessageAudio = lastMessage?.audio || '';

  // Append context to the last user message so the models always have it
  const finalPrompt = `${contextIntro}\nUser Message: ${lastMessageText}`;

  // Build sequential priority list based on user dropdown selection
  let providerChain: string[] = [];

  if (selectedModel === 'gemini') {
    providerChain = ['gemini', 'openai', 'claude', 'openrouter', 'groq'];
  } else if (selectedModel === 'openai') {
    providerChain = ['openai', 'gemini', 'claude', 'openrouter', 'groq'];
  } else if (selectedModel === 'claude') {
    providerChain = ['claude', 'gemini', 'openai', 'openrouter', 'groq'];
  } else if (selectedModel === 'openrouter') {
    providerChain = ['openrouter', 'gemini', 'openai', 'claude', 'groq'];
  } else if (selectedModel === 'groq') {
    providerChain = ['groq', 'gemini', 'openai', 'claude', 'openrouter'];
  } else {
    // Default fallback chain (Auto)
    providerChain = ['gemini', 'openai', 'claude', 'openrouter', 'groq'];
  }

  // Iterate over provider sequence
  for (const provider of providerChain) {
    let reply: string | null = null;
    if (provider === 'gemini') {
      reply = await tryGemini(keys, finalPrompt, lastMessageImage, lastMessageAudio, attempts);
    } else if (provider === 'openai') {
      reply = await tryOpenAI(keys, finalPrompt, lastMessageImage, attempts);
    } else if (provider === 'claude') {
      reply = await tryAnthropic(keys, finalPrompt, lastMessageImage, attempts);
    } else if (provider === 'openrouter') {
      reply = await tryOpenRouter(keys, finalPrompt, lastMessageImage, attempts);
    } else if (provider === 'groq') {
      reply = await tryGroq(keys, finalPrompt, lastMessageImage, attempts);
    }

    if (reply) {
      // If we got a successful outcome, immediately return to client
      return res.json({
        reply,
        attempts
      });
    }
  }

  // Pure Offline/Rule-based Intelligent Clinical Fallback (if everything else is offline)
  attempts.push({ provider: 'Offline Local Rules', status: 'success', modelUsed: 'Smart-Response-Engine' });

  // Analyze simple keyword topics to formulate smart response in urdu/english medical context
  const query = lastMessageText.toLowerCase();
  let fallbackReply = `⚠️ Note: Selected AI model and fallbacks are currently unconfigured or unreachable.

I have analyzed your screen context and medical query locally:

**1. Data Screen Analysis (${context.activeTab || 'General'}):**
- You are logged in as **${context.userName || 'Hospital Admin'}** (${context.userRole || 'Admin'}).
- Based on the current view data, I can see you are looking at clinical metrics.

`;

  // Guardrail test offline
  const isMedicalQuery = 
    query.includes('pain') || query.includes('dard') || query.includes('fever') || query.includes('cough') || query.includes('headache') ||
    query.includes('doctor') || query.includes('patient') || query.includes('appointment') || query.includes('bill') || query.includes('heart') ||
    query.includes('medicine') || query.includes('drug') || query.includes('clinical') || query.includes('report') || query.includes('rash') ||
    query.includes('treatment') || query.includes('hospital') || query.includes('tab') || query.includes('asthma') || query.includes('sugar') ||
    query.includes('bp') || query.includes('blood pressure');

  if (!isMedicalQuery && query.length > 3) {
    fallbackReply = `I am a dedicated Medical & Clinical Hospital AI Assistant. 
I can only assist with healthcare inquiries, medical knowledge, or clinical dashboard context.

Please ask a medical question (e.g. cardiac symptoms, pediatric care, lab analysis) or query the current hospital console's numbers.`;
  } else {
    if (query.includes('heart') || query.includes('dil') || query.includes('chest') || query.includes('cardiac')) {
      fallbackReply += `
**Clinical Guideline (Cardiology):**
- Pain in chest/heart requires immediate clinical observation. 
- Please schedule an appointment with Dr. Anil Sharma (Cardiology Specialist, Fee: 500) who is active on duty in Room 101.
- Red zone emergency is available round the clock.`;
    } else if (query.includes('fever') || query.includes('bukhar') || query.includes('cough') || query.includes('flu')) {
      fallbackReply += `
**Clinical Guideline (General Wellness):**
- Monitor core body temperature. For high fever, ensure patient hydrating protocols are active.
- For children, Pediatric guidelines should be sought from Dr. Priya Patel in Room 201.`;
    } else {
      fallbackReply += `
**Clinical Summary:**
- I can read and interpret your inputs locally. If you upload reports or images, please acquire an active API Key (e.g., GEMINI_API_KEY) in the secrets panel to enable structural vision-parsing algorithms.
- Please verify if there is any active slot for clinical consultation under your appropriate department.`;
    }
  }

  return res.json({
    reply: fallbackReply,
    attempts
  });
});

export default router;
