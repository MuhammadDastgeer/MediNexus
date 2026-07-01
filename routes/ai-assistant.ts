import dotenv from 'dotenv';
dotenv.config();

import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import db from '../db.js';
import { MODEL_CONFIG } from './model-config.js';

const router = Router();

// Robust key-cleaning helper to strip accidental quotes and trim spacing
const cleanKey = (key?: string) => {
  if (!key) return '';
  const cleaned = key.replace(/^["']|["']$/g, '').trim();
  if (
    cleaned.includes('*') || 
    cleaned.toLowerCase().includes('placeholder') || 
    cleaned.toLowerCase().includes('your_') || 
    cleaned.toLowerCase().includes('your-') ||
    cleaned.toLowerCase().includes('insert_here') ||
    cleaned === 'undefined' ||
    cleaned === 'null' ||
    cleaned === ''
  ) {
    return '';
  }
  return cleaned;
};

// Map error strings to standard, clean user-friendly categories to avoid leaking raw exceptions
const sanitizeAttemptError = (msg?: string): string => {
  const lower = (msg || '').toLowerCase();
  if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('key') || lower.includes('auth')) {
    return 'Invalid Credentials';
  }
  if (lower.includes('429') || lower.includes('quota') || lower.includes('limit') || lower.includes('too many requests')) {
    return 'Quota Exceeded';
  }
  return 'Service Unavailable';
};

// Retrieve key values at request time with auto-correcting routing to fix accidental key mix-ups
const getKeys = () => {
  const rawGemini = cleanKey(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const rawOpenai = cleanKey(process.env.OPENAI_API_KEY);
  const rawAnthropic = cleanKey(process.env.ANTHROPIC_API_KEY);

  // Initialize correct targets with raw values as defaults
  let gemini = rawGemini;
  let openai = rawOpenai;
  let anthropic = rawAnthropic;

  const allRawKeys = [rawGemini, rawOpenai, rawAnthropic].filter(k => k !== '');

  // Detect and dynamically assign based on signature prefixes
  for (const key of allRawKeys) {
    if (key.startsWith('AIzaSy')) {
      gemini = key;
    } else if (key.startsWith('sk-ant-')) {
      anthropic = key;
    } else if (key.startsWith('sk-')) {
      openai = key;
    }
  }

  const keys = { gemini, openai, anthropic };

  console.log('[API KEYS DIAGNOSTIC] Loaded keys status (after smart auto-routing):', {
    gemini: keys.gemini ? `Loaded (len: ${keys.gemini.length})` : 'Missing',
    openai: keys.openai ? `Loaded (len: ${keys.openai.length})` : 'Missing',
    anthropic: keys.anthropic ? `Loaded (len: ${keys.anthropic.length})` : 'Missing',
  });
  return keys;
};

// Guardrail instructions that fulfill medical-only requirements and context-specificity
const SYSTEM_INSTRUCTION = `You are a highly specialised clinical and medical hospital AI assistant. 
You MUST adhere to these strict limits and instructions:
1. ONLY answer queries (including text, voice, documents, and images) that are:
   a. Related to medical knowledge, healthy lifestyles, clinical symptoms, wellness guidance, medical analysis, pharmacology, diagnostics, procedures, etc.
   b. Related to this hospital website/app itself, its design, features, pages, tabs, active clinical views, or how to use the system (e.g., how to schedule appointments, register patients, check billing records, manage ward beds or stock inventories).
2. If the user asks about ANYTHING ELSE that is NOT related to medical/clinical care, healthcare, or this hospital website/application (for example: general knowledge, weather, sports, politics, pop culture, unrelated software coding, cooking recipes, general storytelling, etc.):
   - You MUST detect the language of the user's message/query.
   - You MUST reply to them in that EXACT SAME LANGUAGE stating ONLY that you can only answer medical and hospital website questions.
   - Do NOT provide any other information, explanation, or reasoning.
   - Examples of exact matching replies for non-medical/non-website queries per language detected:
     * Roman Urdu / Roman Hindi / Hinglish (e.g., "kya haal hai", "gaana sunao", "France ka capital kya hai", "ap kya kr skte ho"): "Only medical aur hospital website questions ka answer da sakta hu"
     * English (e.g., "Hello, tell me a joke", "What is the capital of...", "write a poem", "how to code"): "I can only answer medical or hospital website-related questions."
     * Urdu Script (Nastaliq, e.g., "آپ کیا کر سکتے ہیں؟", "فرانس کا دارالحکومت"): "صرف طبی اور ہسپتال کی ویب سائٹ کے سوالات کے جوابات دے سکتا ہوں۔"
     * Hindi Script (Devanagari, e.g., "आप क्या कर सकते हैं?", "फ्रांस की राजधानी क्या है?"): "मैं केवल चिकित्सा और अस्पताल वेबसाइट संबंधी प्रश्नों के उत्तर दे सकता हूँ।"
     * Spanish (e.g., "¿Cuál es la capital...", "¿Qué puedes hacer?"): "Solo puedo responder a preguntas médicas o de la web del hospital."
     * French (e.g., "Quelle est la capitale...", "Que pouvez-vous faire?"): "Je ne peux répondre qu'aux questions médicales ou liées au site de l'hôpital."
     * German (e.g., "Was kannst du tun?"): "Ich kann nur medizinische oder Krankenhaus-Website-Fragen beantworten."
     * Arabic (e.g., "ما هي عاصمة فرنسا؟"): "يمكنني فقط الإجابة على الأسئلة الطبية أو المتعلقة بموقع المستشفى."
     * Other languages: Translate the phrase "I can only answer medical or hospital website-related questions" or "Only medical aur hospital website questions ka answer da sakta hu" into that language, and output ONLY that phrase.
3. Respond in a highly professional, clinical, helpful, and concise manner.
4. If an image or any other document file is uploaded (such as a lab report, prescription, skin rash, clinical medical records, spreadsheets with hospital/patient metrics, csv data of symptoms), check it thoroughly and provide your clinical insight. If the file content is not related to healthcare/medical/hospital records or website features, treat it as a non-medical query and reply ONLY in the same language as the user's accompanying message/query using the translation as specified in Rule 2.
5. Voice / Audio (and Typed Text) Navigation and Tab-switching Guidance:
   - If the user sent a voice/audio query OR typed a query inquiring about or referencing a specific tab/domain (e.g., 'billing/paisa', 'appointments/consulting/doctor duty', 'wardbed/occupancy', 'medicine stock/pharmacy inventory count', 'patient records', etc.):
     * You MUST understand what they said or typed.
     * State clearly what they talked/typed about.
     * Tell them that you are automatically redirecting them to that relevant tab now so they can view the correct context and data.
     * At the very end of your response, you MUST append EXACTLY this trigger tag: '[NAVIGATE: <tab_name>-ai]' (e.g., '[NAVIGATE: billing-ai]', '[NAVIGATE: staff-ai]', '[NAVIGATE: appointments-ai]', '[NAVIGATE: ipd-wards-ai]', '[NAVIGATE: inventory-ai]', '[NAVIGATE: doctors-ai]', '[NAVIGATE: patients-ai]', '[NAVIGATE: consultation-ai]').
     * Keep it highly helpful, concise, and in the language they spoke (Urdu, Hindi, Roman Urdu, or English).
6. DATABASE ACTIONS (Add, Edit, Delete):
   - If the user provides details and requests to ADD, CREATE, REGISTER, EDIT, UPDATE, DELETE, CANCEL, or VOID a record in this specific tab (e.g., Doctors, Patients, Staff, Appointments, Bills/Invoices, Inventory, Enquiries, Blog Posts, Departments, Wards):
   - Once they have provided all necessary details, you MUST append exactly this trigger tag at the very end of your response:
     [ACTION: {"type": "add" | "edit" | "delete", "tab": "<tab_name>", "id": "<id_to_edit_or_delete_if_applicable>", "item": { ...fields... }}]
   - The <tab_name> can be: 'appointments', 'patients', 'doctors', 'staff', 'billing', 'inventory', 'departments', 'enquiries', 'medical-tourism', 'blogs', 'support', 'ipd-wards'.
   - In 'item', include fields matching the typescript interface. For example:
     * For 'patients': {"name": "...", "age": 30, "gender": "Male"|"Female"|"Other", "phone": "...", "status": "New"|"Follow-up"}
     * For 'appointments': {"patientName": "...", "doctorName": "...", "specialization": "...", "date": "...", "time": "...", "status": "Scheduled"|"Confirmed"|"Completed"|"Cancelled"}
     * For 'doctors': {"name": "Dr. ...", "specialization": "...", "status": "On Duty"|"Off Duty", "phone": "...", "consultationFee": 500}
     * For 'staff': {"name": "...", "role": "...", "department": "...", "status": "Active"|"Inactive"}
     * For 'billing': {"patientName": "...", "amount": 1000, "status": "Paid"|"Pending"}
     * For 'inventory': {"name": "...", "category": "...", "stock": 50, "minStock": 10, "price": 100}
     * For 'blogs': {"title": "...", "content": "...", "author": "...", "status": "Published"|"Draft"}
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

async function tryGemini(keys: any, prompt: string, image: string, audio: string, attempts: any[], systemInstruction: string = SYSTEM_INSTRUCTION, isFallback: boolean = false) {
  if (keys.gemini && keys.gemini !== 'MY_GEMINI_API_KEY' && keys.gemini.trim() !== '') {
    let apiModel = isFallback ? 'gemini-3.1-flash-lite' : MODEL_CONFIG.getApiGeminiModel();
    // Safety check to ensure we map to supported @google/genai model names
    if (apiModel.includes('gemini-1.5') || apiModel.includes('gemini-2.0') || apiModel === 'gemini-3.5-flash' || apiModel === 'gemini-3.1-pro-preview') {
      // Normal map
    } else {
      apiModel = 'gemini-3.5-flash';
    }
    const configName = isFallback ? 'Gemini 3.1 Flash Lite' : MODEL_CONFIG.geminiModel;
    try {
      const ai = new GoogleGenAI({
        apiKey: keys.gemini,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let contents: any = prompt;
      if (image || audio) {
        const parts: any[] = [{ text: prompt }];
        if (image) {
          const parsed = parseImageData(image);
          if (parsed) {
            parts.push({
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
            parts.push({
              inlineData: {
                mimeType: parsedAudio.mimeType,
                data: parsedAudio.base64Data
              }
            });
          }
        }
        contents = parts;
      }

      const response = await ai.models.generateContent({
        model: apiModel,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2,
        }
      });

      if (response && response.text) {
        attempts.push({ provider: `${configName} (Google)`, status: 'success', modelUsed: configName });
        return response.text;
      } else {
        throw new Error(`Empty response returned from ${configName} via native @google/genai.`);
      }
    } catch (err: any) {
      console.log(`[AI Engine] Gemini (${configName}) request status: Unavailable (Handled)`, err.message);
      attempts.push({ provider: `${configName} (Google)`, status: 'failed', error: sanitizeAttemptError(err.message) });
      
      if (!isFallback) {
        console.log('[tryGemini] Attempting automatic fallback to Gemini 3.1 Flash Lite due to primary model error...');
        return tryGemini(keys, prompt, image, audio, attempts, systemInstruction, true);
      }
    }
  } else {
    attempts.push({ provider: `${MODEL_CONFIG.geminiModel} (Google)`, status: 'skipped', error: 'API key is not configured' });
  }
  return null;
}

async function tryOpenAI(keys: any, prompt: string, image: string, attempts: any[], systemInstruction: string = SYSTEM_INSTRUCTION) {
  if (keys.openai && keys.openai.trim() !== '') {
    const apiModel = MODEL_CONFIG.getApiOpenAIModel();
    const configName = MODEL_CONFIG.openaiModel;
    try {
      const model = new ChatOpenAI({
        model: apiModel,
        apiKey: keys.openai,
        temperature: 0.2,
      });

      let contentPayload: any = prompt;
      if (image) {
        const parsed = parseImageData(image);
        if (parsed) {
          contentPayload = [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${parsed.mimeType};base64,${parsed.base64Data}`
              }
            }
          ];
        }
      }

      const response = await model.invoke([
        ["system", systemInstruction],
        ["human", contentPayload]
      ]);

      if (response && response.content) {
        const replyText = typeof response.content === 'string' 
          ? response.content 
          : JSON.stringify(response.content);

        attempts.push({ provider: `${configName} (OpenAI)`, status: 'success', modelUsed: configName });
        return replyText;
      } else {
        throw new Error(`Empty response returned from ${configName} via LangChain.`);
      }
    } catch (err: any) {
      console.log(`[AI Engine] OpenAI (${configName}) request status: Unavailable (Handled)`);
      attempts.push({ provider: `${configName} (OpenAI)`, status: 'failed', error: sanitizeAttemptError(err.message) });
    }
  } else {
    attempts.push({ provider: `${MODEL_CONFIG.openaiModel} (OpenAI)`, status: 'skipped', error: 'API key is not configured' });
  }
  return null;
}

async function tryAnthropic(keys: any, prompt: string, image: string, attempts: any[], systemInstruction: string = SYSTEM_INSTRUCTION) {
  if (keys.anthropic && keys.anthropic.trim() !== '') {
    const apiModel = MODEL_CONFIG.getApiClaudeModel();
    const configName = MODEL_CONFIG.claudeModel;
    try {
      const model = new ChatAnthropic({
        model: apiModel,
        apiKey: keys.anthropic,
        temperature: 0.2,
      });

      let contentPayload: any = prompt;
      if (image) {
        const parsed = parseImageData(image);
        if (parsed) {
          contentPayload = [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${parsed.mimeType};base64,${parsed.base64Data}`
              }
            }
          ];
        }
      }

      const response = await model.invoke([
        ["system", systemInstruction],
        ["human", contentPayload]
      ]);

      if (response && response.content) {
        const replyText = typeof response.content === 'string' 
          ? response.content 
          : JSON.stringify(response.content);

        attempts.push({ provider: `${configName} (Anthropic)`, status: 'success', modelUsed: configName });
        return replyText;
      } else {
        throw new Error(`Empty response returned from ${configName} via LangChain.`);
      }
    } catch (err: any) {
      console.log(`[AI Engine] Anthropic (${configName}) request status: Unavailable (Handled)`);
      attempts.push({ provider: `${configName} (Anthropic)`, status: 'failed', error: sanitizeAttemptError(err.message) });
    }
  } else {
    attempts.push({ provider: `${MODEL_CONFIG.claudeModel} (Anthropic)`, status: 'skipped', error: 'API key is not configured' });
  }
  return null;
}

// ----------------------------------------------------
// Main POST routing & Category Helpers
// ----------------------------------------------------

const getCategoryInstruction = (category: string): string => {
  const specializedPROMPTS: Record<string, string> = {
    'appointments': 'You are a scheduling and hospital consultation queue planner. Focus on doctor slots, booking confirmations, overdue checkups, peak clinic hours, and roster allocations.',
    'consultation': 'You are a healthcare specialist in general medicine and patient diagnosis. Focus on pharmacology advice, symptoms, secondary wellness guidelines, treatment prescriptions, and follow-up consultation timelines.',
    'billing': 'You are a clinical finance and accounts controller. Focus on payment efficiency, collected funds, outstanding bills, department billing statistics, and patient invoices.',
    'inventory': 'You are a pharmacy and medical inventory officer. Focus on stock counts, replenishment schedules, critical medicine shortages, procurement, and asset valuations.',
    'ipd-wards': 'You are an IPD (In-Patient Department) ward and bed coordinator. Focus on ward allocations, room statuses, bed occupancies, and patient admission flows.',
    'staff': 'You are a medical staffing coordinator. Focus on doctor rosters, duty nursing shifts, staff schedules, allocations, and emergency coverage.',
    'doctors': 'You are a medical roster superintendent. Focus on medical specializations, on-call charts, doctor availabilities, and room assignments.',
    'patients': 'You are a patient care coordinator. Focus on patient profiles, demographic stats (geriatric, pediatric), high-risk clinical conditions, and registrations.',
    'departments': 'You are a departmental clinic manager. Focus on patient loading by department, specialization demands, clinic rooms, and hospital operational charts.',
    'enquiries': 'You are a clinic desk receptionist. Focus on booking leads, diagnostic enquiries, lead pipelines, response tracking, and general hospital FAQs.',
    'medical-tourism': 'You are an international patient tourism officer. Focus on package rates, cross-border plans, traveler stays, and specialized surgical queries.',
    'blogs': 'You are a health media writer. Focus on disease prevention guides, patient blogs, health habits, medical awareness posts, and news.',
    'reports': 'You are a hospital data analyst. Focus on performance charts, statistical diagnostics data, trend analyses, and performance reports.',
    'finance': 'You are a hospital chief financial analyst. Focus on transaction ledgers, cash flows, bills processing, expense charts, and overall revenue.',
    'configure-hospital': 'You are an IT hospital configurations administrator. Focus on general clinic parameters, system schedules, active features, and configuration settings.',
    'support': 'You are a hospital technical helpdesk assistant. Focus on user access, tech tickets, password issues, and system error resolution.'
  };

  const domainFocus = specializedPROMPTS[category] || 'You are a clinical specialist and healthcare workflow assistant.';

  return `You are a highly specialised clinical and medical hospital AI assistant operating using LangChain constructs. 
Category / Current Tab Focus: [${category}]
Current Tab Role: ${domainFocus}

CRITICAL MANDATORY INSTRUCTIONS & SCOPE RESTRICTIONS:
1. You are accessed from the specific, specialized [${category}] tab. You MUST ONLY answer queries (whether typed or spoken via voice audio) that are directly related to the current "${category}" tab's roles, operations, data management, listing, creating/adding new records, editing/updating records, or deleting/deactivating records in this specific tab.
2. DATABASE CRUD ACTIONS (Add, Edit, Delete):
   - You MUST fully support adding, editing/updating, and deleting/cancelling records inside this specific "${category}" tab via both text commands and spoken voice commands!
   - When the user expresses a clear intent to perform a CRUD action (whether they type or speak it), first formulate a polite confirmation response. At the very end of your response, you MUST append exactly this trigger tag:
     [ACTION: {"type": "add" | "edit" | "delete", "tab": "${category}", "id": "<id_to_edit_or_delete_if_applicable>", "item": { ...fields... }}]
   - Keep the fields matching the data model of the current "${category}" tab.
3. REDIRECTING OTHER TAB QUESTIONS:
   - If the user asks a question or gives a command that belongs to a DIFFERENT tab (for example, asking about "billing/paisa/invoice" while on the "appointments" or "staff" tab, or asking about "medicine stock/inventory" while on the "billing" tab, etc.):
     * You MUST refuse politely.
     * Tell them to navigate to that specific tab to ask their question or perform that action.
     * Use their detected language (Urdu/Hindi, Roman Urdu, or English).
     * Example: "Barah-e-maherbani aap billing tab par ja kar ye billing se mutalik sawal karein." or "This belongs to the billing tab. Please go to the billing tab to ask this question."
4. REDIRECTING GENERAL MEDICAL QUESTIONS:
   - If the user asks a general clinical or medical question (for example: "fever ka ilaj kya hai?", "what are symptoms of flu?", "blood pressure monitor kaise karein?") while on this specialized "${category}" tab:
     * You MUST refuse politely.
     * Tell them that this assistant only performs "${category}" operations, and they should go to the main "AI Assistant" tab for general medical queries.
     * Example: "Barah-e-maherbani aap main \"AI Assistant\" tab par ja kar ye medical/clinical sawal karein." or "Please go to the main \"AI Assistant\" tab to ask general medical questions."
5. Voice / Audio Query Processing:
   - If the user sent a VOICE/AUDIO query, first transcribe and comprehend what they said.
   - If their spoken query is related to this current "${category}" tab, answer/perform action directly.
   - If their spoken query belongs to a different tab, provide a redirection instruction as defined in rule 3, and append exactly this trigger tag: \`[NAVIGATE: <tab_name>-ai]\`.
6. Respond in a highly professional, concise, and helpful clinical tone. Keep responses short and directly focused.
`;
};

function detectAndParseAction(text: string, userQuery: string, currentTab: string): any {
  // 1. Try to find an explicit [ACTION: { ... }] JSON tag (case-insensitive, optional brackets) with robust brace balancing
  const actionIdx = text.toUpperCase().indexOf('ACTION:');
  if (actionIdx !== -1) {
    const firstBraceIdx = text.indexOf('{', actionIdx);
    if (firstBraceIdx !== -1) {
      let braceCount = 0;
      let endBraceIdx = -1;
      for (let i = firstBraceIdx; i < text.length; i++) {
        if (text[i] === '{') {
          braceCount++;
        } else if (text[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            endBraceIdx = i;
            break;
          }
        }
      }
      if (endBraceIdx !== -1) {
        const jsonStr = text.slice(firstBraceIdx, endBraceIdx + 1);
        try {
          return JSON.parse(jsonStr);
        } catch (e) {
          console.warn("Found ACTION tag but failed to parse JSON with brace balancing:", e);
        }
      }
    }
  }

  // 2. Scan for any loose JSON containing "type" and "tab" in the text
  const jsonMatches = text.match(/{[^{}]*"type"\s*:[^{}]*"tab"\s*:[^{}]*}/gs) || text.match(/{[^{}]*"tab"\s*:[^{}]*"type"\s*:[^{}]*}/gs);
  if (jsonMatches) {
    for (const jsonStr of jsonMatches) {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed && parsed.type && parsed.tab) {
          return parsed;
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  // 3. Heuristic check to see if we should auto-generate an action from the conversation context.
  const lowerText = text.toLowerCase();
  const lowerQuery = userQuery.toLowerCase();
  // We use the user's query for intent and operation detection to prevent false-positives from long conversational model responses
  const combined = lowerQuery;

  // Identify operation type
  let type: 'add' | 'edit' | 'delete' | null = null;
  if (combined.match(/(?:delete|remove|cancel|kharij|delet|hatao|void|discharge)/i)) {
    type = 'delete';
  } else if (combined.match(/(?:edit|update|change|tabdeel|set |badlo|modify|fees|fee|price)/i)) {
    type = 'edit';
  } else if (combined.match(/(?:add|create|register|nayi|naya|shamil|insert|admit|add ho)/i)) {
    type = 'add';
  }

  if (!type) return null;

  // Identify category/tab
  let tab: string | null = null;
  if (combined.includes('patient') || combined.includes('mariiz') || combined.includes('mizaj') || currentTab === 'patients') {
    tab = 'patients';
  } else if (combined.includes('doctor') || combined.includes('dr.') || combined.includes('dr ') || combined.includes('hakeem') || combined.includes('tabeeb') || currentTab === 'doctors') {
    tab = 'doctors';
  } else if (combined.includes('appointment') || combined.includes('booking') || combined.includes('mulaqat') || currentTab === 'appointments') {
    tab = 'appointments';
  } else if (combined.includes('staff') || combined.includes('nurse') || combined.includes('ward boy') || combined.includes('employee') || currentTab === 'staff') {
    tab = 'staff';
  } else if (combined.includes('bill') || combined.includes('paisa') || combined.includes('fee') || combined.includes('invoice') || combined.includes('billing') || combined.includes('transaction') || currentTab === 'billing') {
    tab = 'billing';
  } else if (combined.includes('inventory') || combined.includes('medicine') || combined.includes('dawa') || combined.includes('stock') || combined.includes('item') || currentTab === 'inventory') {
    tab = 'inventory';
  } else if (combined.includes('enquiry') || combined.includes('enquiries') || combined.includes('sawal') || combined.includes('puchtaach') || currentTab === 'enquiries') {
    tab = 'enquiries';
  } else if (combined.includes('blog') || combined.includes('post') || combined.includes('article') || combined.includes('khabar') || currentTab === 'blogs') {
    tab = 'blogs';
  } else if (combined.includes('department') || combined.includes('shoba') || combined.includes('dept') || currentTab === 'departments') {
    tab = 'departments';
  } else if (combined.includes('ward') || combined.includes('bed') || combined.includes('ipd') || combined.includes('room') || currentTab === 'ipd-wards') {
    tab = 'ipd-wards';
  }

  if (!tab) {
    tab = currentTab || 'patients';
  }

  // Parse fields
  const item: Record<string, any> = {};

  // Try parsing name/title with precise patterns
  let nameValue = '';
  const namePatterns = [
    /(?:name|naam|doctor|patient|staff|dr\.|mr\.|ms\.)\s*(?:is|:|=)?\s*([a-zA-Z\s]+)(?:,|$|\n|age|phone|fee)/i,
    /(?:add|register|update|delete|edit)\s+(?:patient|doctor|staff|dr\.|mr\.)\s+([a-zA-Z\s]+)/i,
    /([a-zA-Z\s]+)\s+(?:ko add|ko edit|ko update|ko delete|ko remove)/i
  ];

  for (const pattern of namePatterns) {
    const match = userQuery.match(pattern) || text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 2 && !candidate.toLowerCase().includes('patient') && !candidate.toLowerCase().includes('doctor') && !candidate.toLowerCase().includes('staff')) {
        nameValue = candidate;
        break;
      }
    }
  }

  if (!nameValue) {
    // Word list uppercase heuristics (e.g. capitalized names: "Dr. Shazib")
    const words = userQuery.split(/\s+/);
    const capitalized = words.filter(w => w && w[0] === w[0].toUpperCase() && !['Add', 'Create', 'Register', 'Update', 'Delete', 'Remove', 'Doctor', 'Patient', 'Staff', 'Hi', 'Hello', 'Please'].includes(w));
    if (capitalized.length > 0) {
      nameValue = capitalized.join(' ');
    }
  }

  if (nameValue) {
    item.name = nameValue;
    item.patientName = nameValue;
    item.doctorName = nameValue;
  }

  // Find age
  let ageMatch = combined.match(/(?:age|umer|saal)\s*(?:is|:|=)?\s*(\d+)/i);
  if (!ageMatch) {
    ageMatch = combined.match(/(\d+)\s*(?:years|saal|age)/i);
  }
  if (ageMatch) {
    item.age = Number(ageMatch[1]);
  }

  // Find phone
  const phoneMatch = combined.match(/(\d{4}-?\d{7})/) || combined.match(/(\d{10,11})/);
  if (phoneMatch) {
    item.phone = phoneMatch[1];
  }

  // Find fee / amount / price / stock / stand-alone digit
  let numVal: number | null = null;
  const numMatches = combined.match(/(?:fee|price|amount|cost|stock|qty|paisa|charge|rs|fee:)\s*(?:is|:|=)?\s*(\d+)/i);
  if (numMatches) {
    numVal = Number(numMatches[1]);
  } else {
    // Standalone 3-5 digit number in query (e.g., "600")
    const standaloneNum = combined.match(/\b(\d{3,5})\b/);
    if (standaloneNum) {
      numVal = Number(standaloneNum[1]);
    }
  }

  if (numVal !== null) {
    item.consultationFee = numVal;
    item.amount = numVal;
    item.price = numVal;
    item.stock = numVal;
    item.fee = numVal;
  }

  // Find specialization / department
  const specMatch = combined.match(/(?:specialization|speciality|dept|department|shoba)\s*(?:is|:|=)?\s*([a-zA-Z\s]+)/i);
  if (specMatch) {
    item.specialization = specMatch[1].trim();
    item.department = specMatch[1].trim();
  }

  // Gender
  if (combined.includes('female') || combined.includes('aurat') || combined.includes('larki')) {
    item.gender = 'Female';
    item.patientGender = 'Female';
  } else if (combined.includes('male') || combined.includes('mard') || combined.includes('larka')) {
    item.gender = 'Male';
    item.patientGender = 'Male';
  }

  // ID detection & DB matching fallback for edits / deletes
  let matchedId = '';
  if (nameValue && (type === 'edit' || type === 'delete')) {
    try {
      if (tab === 'patients') {
        const row: any = db.prepare("SELECT id FROM patients WHERE name LIKE ? COLLATE NOCASE LIMIT 1").get('%' + nameValue + '%');
        if (row) matchedId = row.id;
      } else if (tab === 'doctors') {
        const row: any = db.prepare("SELECT id FROM doctors WHERE name LIKE ? COLLATE NOCASE LIMIT 1").get('%' + nameValue + '%');
        if (row) matchedId = row.id;
      } else if (tab === 'appointments') {
        const row: any = db.prepare("SELECT id FROM appointments WHERE (patientName LIKE ? OR doctorName LIKE ?) COLLATE NOCASE LIMIT 1").get('%' + nameValue + '%', '%' + nameValue + '%');
        if (row) matchedId = row.id;
      } else if (tab === 'staff') {
        const row: any = db.prepare("SELECT id FROM staff WHERE name LIKE ? COLLATE NOCASE LIMIT 1").get('%' + nameValue + '%');
        if (row) matchedId = row.id;
      } else if (tab === 'billing') {
        const row: any = db.prepare("SELECT id FROM bills WHERE patientName LIKE ? COLLATE NOCASE LIMIT 1").get('%' + nameValue + '%');
        if (row) matchedId = row.id;
      } else if (tab === 'inventory') {
        const row: any = db.prepare("SELECT id FROM inventory WHERE name LIKE ? COLLATE NOCASE LIMIT 1").get('%' + nameValue + '%');
        if (row) matchedId = row.id;
      }
    } catch (dbErr) {
      console.warn("Offline SQL ID lookup failed:", dbErr);
    }
  }

  let idMatch = combined.match(/(?:id|code|patientId|docId)\s*(?:is|:|=)?\s*([a-zA-Z0-9-]+)/i);
  if (matchedId) {
    item.id = matchedId;
  } else if (idMatch) {
    item.id = idMatch[1].trim();
  } else {
    item.id = nameValue ? nameValue.toLowerCase().replace(/\s+/g, '-') : 'ID-' + Math.floor(1000 + Math.random() * 9000);
  }

  return {
    type,
    tab,
    id: item.id,
    item
  };
}

function isMedicalQuery(query: string): boolean {
  const lowerQ = query.toLowerCase().trim();
  const medicalKeywords = [
    // English symptoms, medications, health topics
    'pain', 'fever', 'cough', 'headache', 'heart', 'medicine', 'drug', 'clinical', 'report', 'rash', 
    'treatment', 'asthma', 'sugar', 'bp', 'blood pressure', 'symptom', 'prescription', 'allergy', 
    'guidance', 'flu', 'pneumonia', 'tb', 'infection', 'disease', 'cancer', 'diabetic', 'diabetes', 
    'stomach', 'ache', 'throat', 'cold', 'vomit', 'nausea', 'diarrhea', 'injury', 'wound', 'bleeding', 
    'fracture', 'bone', 'muscle', 'skin', 'eye', 'ear', 'nose', 'kidney', 'liver', 'lungs', 'brain', 
    'mental', 'stress', 'anxiety', 'depression', 'dose', 'tablet', 'capsule', 'syrup', 'injection', 
    'vaccine', 'surgery', 'operation', 'therapy', 'physio', 'medical', 'health', 'sick', 'ill', 
    'diagnosis', 'prognosis', 'cholesterol', 'hypertension', 'stroke', 'cardiac', 'pulmonary', 
    'hepatitis', 'ulcer', 'migraine', 'dizziness', 'fatigue', 'swelling', 'inflammation', 'sprain', 
    'burn', 'allergen', 'weight', 'diet', 'calories', 'nutrition', 'exercise', 'sleep', 'hygiene',
    'sore', 'paracetamol', 'panadol', 'disprin', 'calpol', 'brufen', 'aspirin', 'insulin', 'antibiotic', 
    'antiseptic', 'pregnancy', 'pregnant', 'remedy', 'cure', 'viral', 'bacterial', 'germ', 'virus',
    'sickness', 'illness', 'tabiyat', 'tabiat',
    
    // Urdu/Roman Urdu terms
    'dard', 'bukhar', 'khanis', 'khansi', 'zukam', 'nazla', 'sar dard', 'pet', 'pait', 'dil', 
    'guda', 'gurda', 'jigar', 'phepra', 'phephre', 'demagh', 'zehn', 'marz', 'beemari', 'bimari', 
    'ilaj', 'ilaaj', 'dawa', 'dawaein', 'goli', 'sharbat', 'teeka', 'nuskha', 'parhaiz', 'khoon', 'blood', 
    'hadi', 'patha', 'jild', 'aankh', 'kaan', 'naak', 'gala', 'kharash', 'ultians', 'ulti', 'ultee', 'matli', 
    'thakan', 'soojan', 'zakham', 'chot', 'bimar', 'mareez', 'sehat', 'tandurusti', 'shifa', 
    'garm', 'thanda'
  ];

  return medicalKeywords.some(keyword => lowerQ.includes(keyword));
}

function isGreetingOrPolite(query: string): boolean {
  const lowerQ = query.toLowerCase().trim();
  const greetings = [
    'hello', 'hi', 'hey', 'salam', 'aoa', 'adaab', 'how are you', 'kya hal', 'kaise ho',
    'ok', 'okay', 'thanks', 'thank you', 'shukriya'
  ];
  return greetings.some(g => lowerQ === g || lowerQ.startsWith(g + ' ') || lowerQ.endsWith(' ' + g));
}

function getTabsFromQuery(query: string): string[] {
  const lowerQ = query.toLowerCase().trim();
  const tabs: string[] = [];
  if (lowerQ.includes('appointment')) tabs.push('appointments');
  if (lowerQ.includes('bill') || lowerQ.includes('invoice') || lowerQ.includes('payment') || lowerQ.includes('fee')) tabs.push('billing');
  if (lowerQ.includes('patient') || lowerQ.includes('register')) tabs.push('patients');
  if (lowerQ.includes('doctor') || lowerQ.includes('specialist')) tabs.push('doctors');
  if (lowerQ.includes('staff') || lowerQ.includes('nurse') || lowerQ.includes('cleaner') || lowerQ.includes('karkun')) tabs.push('staff');
  if (lowerQ.includes('inventory') || lowerQ.includes('stock') || lowerQ.includes('pharmacy') || lowerQ.includes('mal-godaam')) tabs.push('inventory');
  if (lowerQ.includes('ward') || lowerQ.includes('bed') || lowerQ.includes('room') || lowerQ.includes('occupancy') || lowerQ.includes('bistar')) tabs.push('ipd-wards');
  if (lowerQ.includes('consultation') || lowerQ.includes('prescribe')) tabs.push('consultation');
  if (lowerQ.includes('blog')) tabs.push('blogs');
  if (lowerQ.includes('report') || lowerQ.includes('analytic')) tabs.push('reports');
  if (lowerQ.includes('finance') || lowerQ.includes('ledger') || lowerQ.includes('revenue')) tabs.push('finance');
  if (lowerQ.includes('department')) tabs.push('departments');
  if (lowerQ.includes('enquiry') || lowerQ.includes('lead') || lowerQ.includes('ticket')) tabs.push('enquiries');
  if (lowerQ.includes('tourism')) tabs.push('medical-tourism');
  if (lowerQ.includes('configure') || lowerQ.includes('setting')) tabs.push('configure-hospital');
  return tabs;
}

function checkRoleCapability(userRole: string, activeTabName: string, queryText: string, toolType?: string, toolTab?: string): { allowed: boolean, reason?: string, UrduReason?: string } {
  const role = userRole.toLowerCase().trim();
  if (role === 'admin' || !role) {
    return { allowed: true };
  }
  
  // If the query is purely clinical / medical advice, we always allow it!
  const isGeneralMedicalAdvice = isMedicalQuery(queryText);

  // Detect target tab of the operation.
  // We check the toolTab first, otherwise fall back to activeTabName, or look at keywords in the queryText.
  let targetTab = (toolTab || activeTabName || '').toLowerCase().trim();
  if (!targetTab || targetTab === 'general' || targetTab === 'general-ai' || targetTab === 'ai-assistant') {
    // try to guess the target tab based on query keywords
    const lowerQ = queryText.toLowerCase();
    if (lowerQ.includes('appointment')) targetTab = 'appointments';
    else if (lowerQ.includes('bill') || lowerQ.includes('invoice') || lowerQ.includes('payment') || lowerQ.includes('fee')) targetTab = 'billing';
    else if (lowerQ.includes('patient') || lowerQ.includes('register')) targetTab = 'patients';
    else if (lowerQ.includes('doctor') || lowerQ.includes('specialist')) targetTab = 'doctors';
    else if (lowerQ.includes('staff') || lowerQ.includes('nurse')) targetTab = 'staff';
    else if (lowerQ.includes('inventory') || lowerQ.includes('stock') || lowerQ.includes('medicine')) targetTab = 'inventory';
    else if (lowerQ.includes('ward') || lowerQ.includes('bed') || lowerQ.includes('room')) targetTab = 'ipd-wards';
    else if (lowerQ.includes('consultation') || lowerQ.includes('prescribe')) targetTab = 'consultation';
    else if (lowerQ.includes('blog')) targetTab = 'blogs';
    else if (lowerQ.includes('report') || lowerQ.includes('analytic')) targetTab = 'reports';
    else if (lowerQ.includes('finance') || lowerQ.includes('ledger')) targetTab = 'finance';
    else if (lowerQ.includes('department')) targetTab = 'departments';
    else if (lowerQ.includes('enquiry') || lowerQ.includes('ticket')) targetTab = 'enquiries';
    else if (lowerQ.includes('tourism')) targetTab = 'medical-tourism';
    else if (lowerQ.includes('configure') || lowerQ.includes('setting')) targetTab = 'configure-hospital';
  }

  // Detect operation type: add, edit, delete, view
  let opType = (toolType || '').toLowerCase().trim();
  if (!opType) {
    const lowerQ = queryText.toLowerCase();
    if (lowerQ.includes('add') || lowerQ.includes('create') || lowerQ.includes('register') || lowerQ.includes('new') || lowerQ.includes('admit') || lowerQ.includes('naya') || lowerQ.includes('shamil')) {
      opType = 'add';
    } else if (lowerQ.includes('edit') || lowerQ.includes('update') || lowerQ.includes('change') || lowerQ.includes('modify') || lowerQ.includes('badal') || lowerQ.includes('set')) {
      opType = 'edit';
    } else if (lowerQ.includes('delete') || lowerQ.includes('remove') || lowerQ.includes('cancel') || lowerQ.includes('hatao') || lowerQ.includes('kharij') || lowerQ.includes('void')) {
      opType = 'delete';
    } else if (lowerQ.includes('list') || lowerQ.includes('show') || lowerQ.includes('view') || lowerQ.includes('summary') || lowerQ.includes('check') || lowerQ.includes('dekh')) {
      opType = 'view';
    }
  }

  // If it's a medical query, always allow!
  if (isGeneralMedicalAdvice) {
    return { allowed: true };
  }

  // Apply restrictions based on role:
  if (role === 'patient') {
    const allowedTabs = ['appointments', 'billing', 'patients', 'doctors'];
    if (targetTab && !allowedTabs.includes(targetTab)) {
      return {
        allowed: false,
        reason: `The "${targetTab.toUpperCase()}" view and operations are not accessible from the Patient Console.`,
        UrduReason: `Yeh "${targetTab.toUpperCase()}" section aur iske operations Patient console ke ijazat me nahi hain. Aap apni appointments aur billing tak mehdood rahein.`
      };
    }
    
    // Check specific operations on allowed tabs
    if (targetTab === 'appointments') {
      if (opType === 'delete' || opType === 'edit') {
        return {
          allowed: false,
          reason: `Patients are only permitted to view or book/add appointments. Editing status or deleting appointments is restricted.`,
          UrduReason: `Aap appointments sirf dekh ya book (add) kar sakte hain. Appointment status tabdeel karna ya delete karna Patient console me allowed nahi hai.`
        };
      }
    }
    if (targetTab === 'billing') {
      if (opType === 'add' || opType === 'edit' || opType === 'delete') {
        return {
          allowed: false,
          reason: `Patients are only permitted to view their bills. Invoicing or modifying bills is restricted.`,
          UrduReason: `Aap billing details sirf dekh sakte hain. Naya bill banana ya bills ko edit/delete karna Patient console me allowed nahi hai.`
        };
      }
    }
    if (targetTab === 'patients') {
      if (opType === 'add' || opType === 'edit' || opType === 'delete') {
        return {
          allowed: false,
          reason: `Patients are only permitted to view their own profile context. Modifying or deleting patients is restricted.`,
          UrduReason: `Aap patient profile sirf dekh sakte hain. Naye patients register karna ya clinical files edit/delete karna restricted hai.`
        };
      }
    }
    if (targetTab === 'doctors') {
      if (opType === 'add' || opType === 'edit' || opType === 'delete') {
        return {
          allowed: false,
          reason: `Patients can view doctors list but cannot add, edit, or delete doctor profiles.`,
          UrduReason: `Aap doctor list dekh sakte hain, par doctors ke profiles add, edit, ya delete nahi kar sakte.`
        };
      }
    }
  }

  if (role === 'doctor') {
    const allowedTabs = ['appointments', 'consultation', 'doctors', 'patients', 'staff', 'blogs', 'ipd-wards'];
    if (targetTab && !allowedTabs.includes(targetTab)) {
      return {
        allowed: false,
        reason: `The "${targetTab.toUpperCase()}" view and operations are not accessible from the Doctor Console.`,
        UrduReason: `Yeh "${targetTab.toUpperCase()}" section aur iske operations Doctor console me available nahi hain. Aap clinical consultations, appointments, aur patient logs tak mehdood rahein.`
      };
    }
    
    // Check specific operations on allowed tabs
    if (targetTab === 'appointments') {
      if (opType === 'delete') {
        return {
          allowed: false,
          reason: `Doctors can view and update appointment consultation records, but deleting appointments is restricted.`,
          UrduReason: `Aap appointments status update (edit) kar sakte hain, par appointments ko cancel/delete karna Doctor console me restricted hai.`
        };
      }
    }
    if (targetTab === 'doctors') {
      if (opType === 'add' || opType === 'delete') {
        return {
          allowed: false,
          reason: `Doctors are only permitted to view profiles or edit their own profile. Adding or deleting doctor registrations is restricted.`,
          UrduReason: `Aap apna profile update kar sakte hain, par naye doctors register karna ya unhe delete karna restricted hai.`
        };
      }
    }
    if (targetTab === 'patients') {
      if (opType === 'add' || opType === 'delete') {
        return {
          allowed: false,
          reason: `Doctors can view patient logs but cannot register new patient entries or delete patient profiles.`,
          UrduReason: `Aap patients ke logs aur diagnostics dekh sakte hain, par naya patient register karna ya record delete karna restricted hai.`
        };
      }
    }
    if (targetTab === 'staff') {
      if (opType === 'add' || opType === 'edit' || opType === 'delete') {
        return {
          allowed: false,
          reason: `Doctors can view staff schedules, but adding, editing, or deleting staff profiles is restricted.`,
          UrduReason: `Aap staff duty roster dekh sakte hain, par staff profiles create, edit, ya delete nahi kar sakte.`
        };
      }
    }
    if (targetTab === 'blogs') {
      if (opType === 'delete') {
        return {
          allowed: false,
          reason: `Doctors can write and edit clinical blog posts, but deleting posts is restricted.`,
          UrduReason: `Aap blog posts write/edit kar sakte hain, par delete karna restricted hai.`
        };
      }
    }
  }

  if (role === 'staff') {
    const allowedTabs = ['appointments', 'consultation', 'billing', 'patients', 'blogs', 'inventory', 'staff'];
    if (targetTab && !allowedTabs.includes(targetTab)) {
      return {
        allowed: false,
        reason: `The "${targetTab.toUpperCase()}" view and operations are not accessible from the Staff Console.`,
        UrduReason: `Yeh "${targetTab.toUpperCase()}" section aur iske operations Staff console ke direct authority me nahi hain. Apne dynamic booking, invoices, aur patient profile registers tak mehdood rahein.`
      };
    }

    // Check specific operations on allowed tabs
    if (targetTab === 'consultation') {
      if (opType === 'add' || opType === 'edit') {
        return {
          allowed: false,
          reason: `Staff members can view clinical consultations but cannot write prescriptions or log medical diagnosis notes.`,
          UrduReason: `Consultation notes aur prescriptions likhna sirf Doctors ka kaam hai. Aap in logs ko sirf dekh sakte hain.`
        };
      }
    }
    if (targetTab === 'patients') {
      if (opType === 'delete') {
        return {
          allowed: false,
          reason: `Staff members can register and edit patient profiles, but deleting patients is strictly restricted to Administrators.`,
          UrduReason: `Aap patient register ya edit kar sakte hain, par patient records ko permanently delete karna restricted hai.`
        };
      }
    }
  }

  return { allowed: true };
}

function retrieveRelevantDocs(query: string, data: any, userRole: string = 'admin', userName: string = ''): string {
  if (!data || typeof data !== 'object') return '';

  const matchedDocs: string[] = [];
  const lowerQuery = query.toLowerCase().trim();
  const role = userRole.toLowerCase().trim();
  const patientNameLower = userName.toLowerCase().trim();

  if (!lowerQuery || lowerQuery.length < 2) return '';

  // 1. Search patients (Allowed for: admin, patient, staff, doctor)
  // For patient: must ONLY search/match their own profile!
  if (Array.isArray(data.allPatients)) {
    let listToSearch = data.allPatients;
    if (role === 'patient') {
      listToSearch = listToSearch.filter((p: any) => p.name && p.name.toLowerCase().trim() === patientNameLower);
    }
    const matchedPatients = listToSearch.filter((p: any) => 
      (p.name && p.name.toLowerCase().includes(lowerQuery)) ||
      (p.id && p.id.toLowerCase().includes(lowerQuery)) ||
      (p.bloodGroup && p.bloodGroup.toLowerCase().includes(lowerQuery)) ||
      (p.phone && p.phone.toLowerCase().includes(lowerQuery))
    );
    if (matchedPatients.length > 0) {
      matchedDocs.push(`[Matched Patients in Records]:\n` + matchedPatients.map((p: any) => 
        `- Patient Name: ${p.name}, ID: ${p.id}, Age: ${p.age}, Gender: ${p.gender}, Status: ${p.status}, Contact: ${p.phone || 'N/A'}, Blood Group: ${p.bloodGroup || 'N/A'}`
      ).join('\n'));
    }
  }

  // 2. Search appointments (Allowed for: admin, patient, staff, doctor)
  // For patient: must ONLY search/match their own appointments!
  if (Array.isArray(data.allAppointments)) {
    let listToSearch = data.allAppointments;
    if (role === 'patient') {
      listToSearch = listToSearch.filter((a: any) => a.patient && a.patient.toLowerCase().trim() === patientNameLower);
    }
    const matchedAppointments = listToSearch.filter((a: any) =>
      (a.patient && a.patient.toLowerCase().includes(lowerQuery)) ||
      (a.doctor && a.doctor.toLowerCase().includes(lowerQuery)) ||
      (a.specialization && a.specialization.toLowerCase().includes(lowerQuery)) ||
      (a.id && a.id.toLowerCase().includes(lowerQuery))
    );
    if (matchedAppointments.length > 0) {
      matchedDocs.push(`[Matched Appointments in Records]:\n` + matchedAppointments.map((a: any) =>
        `- Appt ID: ${a.id} for Patient ${a.patient} with Dr. ${a.doctor} (${a.specialization}) on ${a.date} at ${a.time}. Status: ${a.status}. Reason: ${a.reason || 'N/A'}`
      ).join('\n'));
    }
  }

  // 3. Search Bills (Allowed for: admin, patient, staff, doctor)
  // For patient: must ONLY search/match their own bills!
  if (Array.isArray(data.allBills)) {
    let listToSearch = data.allBills;
    if (role === 'patient') {
      listToSearch = listToSearch.filter((b: any) => b.patient && b.patient.toLowerCase().trim() === patientNameLower);
    }
    const matchedBills = listToSearch.filter((b: any) =>
      (b.patient && b.patient.toLowerCase().includes(lowerQuery)) ||
      (b.id && b.id.toLowerCase().includes(lowerQuery)) ||
      (b.status && b.status.toLowerCase().includes(lowerQuery))
    );
    if (matchedBills.length > 0) {
      matchedDocs.push(`[Matched Billing Invoices]:\n` + matchedBills.map((b: any) =>
        `- Invoice ${b.id} for Patient ${b.patient}: Total Amount: ${b.amount}, Collected: ${b.collectedAmount}, Pending: ${b.pendingAmount}, Status: ${b.status}`
      ).join('\n'));
    }
  }

  // 4. Search Inventory (Allowed for: admin ONLY)
  if (role === 'admin' && Array.isArray(data.allInventory)) {
    const matchedInventory = data.allInventory.filter((i: any) =>
      (i.name && i.name.toLowerCase().includes(lowerQuery)) ||
      (i.category && i.category.toLowerCase().includes(lowerQuery)) ||
      (i.id && i.id.toLowerCase().includes(lowerQuery)) ||
      (i.supplier && i.supplier.toLowerCase().includes(lowerQuery))
    );
    if (matchedInventory.length > 0) {
      matchedDocs.push(`[Matched Inventory Items]:\n` + matchedInventory.map((i: any) =>
        `- Item: ${i.name} (ID: ${i.id}, Category: ${i.category}, Stock: ${i.stock}/${i.minStock} (Min), Price: ${i.price}, Selling Price: ${i.sellingPrice}, Supplier: ${i.supplier || 'N/A'})`
      ).join('\n'));
    }
  }

  // 5. Search Doctors (Allowed for: admin, patient, doctor)
  if ((role === 'admin' || role === 'patient' || role === 'doctor') && Array.isArray(data.allDoctors)) {
    const matchedDoctors = data.allDoctors.filter((d: any) =>
      (d.name && d.name.toLowerCase().includes(lowerQuery)) ||
      (d.specialization && d.specialization.toLowerCase().includes(lowerQuery)) ||
      (d.id && d.id.toLowerCase().includes(lowerQuery))
    );
    if (matchedDoctors.length > 0) {
      matchedDocs.push(`[Matched Doctors]:\n` + matchedDoctors.map((d: any) =>
        `- Dr. ${d.name} (ID: ${d.id}, Specialization: ${d.specialization}, Status: ${d.status}, Experience: ${d.experience || 'N/A'} yrs, Consulting Fee/Salary: ${d.salary || 'N/A'}, Phone: ${d.phone || 'N/A'})`
      ).join('\n'));
    }
  }

  // 6. Search Staff (Allowed for: admin, doctor, staff)
  if ((role === 'admin' || role === 'doctor' || role === 'staff') && Array.isArray(data.allStaff)) {
    const matchedStaff = data.allStaff.filter((s: any) =>
      (s.name && s.name.toLowerCase().includes(lowerQuery)) ||
      (s.role && s.role.toLowerCase().includes(lowerQuery)) ||
      (s.department && s.department.toLowerCase().includes(lowerQuery)) ||
      (s.id && s.id.toLowerCase().includes(lowerQuery))
    );
    if (matchedStaff.length > 0) {
      matchedDocs.push(`[Matched Clinical/Admin Staff]:\n` + matchedStaff.map((s: any) =>
        `- Staff: ${s.name} (ID: ${s.id}, Role: ${s.role}, Department: ${s.department}, Status: ${s.status}, Contact: ${s.phone || 'N/A'})`
      ).join('\n'));
    }
  }

  // 7. Search Wards (Allowed for: admin, doctor)
  if ((role === 'admin' || role === 'doctor') && Array.isArray(data.allWards)) {
    const matchedWards = data.allWards.filter((w: any) =>
      (w.name && w.name.toLowerCase().includes(lowerQuery)) ||
      (w.type && w.type.toLowerCase().includes(lowerQuery)) ||
      (w.id && w.id.toLowerCase().includes(lowerQuery))
    );
    if (matchedWards.length > 0) {
      matchedDocs.push(`[Matched Wards]:\n` + matchedWards.map((w: any) =>
        `- Ward: ${w.name} (ID: ${w.id}, Type: ${w.type}, Beds Occupied: ${w.occupiedBeds}/${w.totalBeds}, Price/Day: ${w.pricePerDay || 'N/A'})`
      ).join('\n'));
    }
  }

  // 8. Search Enquiries (Allowed for: admin ONLY)
  if (role === 'admin' && Array.isArray(data.allEnquiries)) {
    const matchedEnqs = data.allEnquiries.filter((e: any) =>
      (e.name && e.name.toLowerCase().includes(lowerQuery)) ||
      (e.subject && e.subject.toLowerCase().includes(lowerQuery)) ||
      (e.id && e.id.toLowerCase().includes(lowerQuery))
    );
    if (matchedEnqs.length > 0) {
      matchedDocs.push(`[Matched Desk Enquiries]:\n` + matchedEnqs.map((e: any) =>
        `- Enq ID: ${e.id} from ${e.name} (${e.email || 'N/A'}). Subject: ${e.subject}. Status: ${e.status}. Message: ${e.message || 'N/A'}`
      ).join('\n'));
    }
  }

  if (matchedDocs.length === 0) {
    return '';
  }

  return `\n=== RAG DATABASE MATCHED ENTITIES (Dynamic Query Result) ===\n` + 
         `These entries match the user query/context terms of "${lowerQuery}" and are retrieved dynamically from the active screen lists:\n\n` + 
         matchedDocs.join('\n\n') + 
         `\n==========================================================\n`;
}

function shouldBlockQuery(role: string, query: string, isGeneralAssistant: boolean): boolean {
  const normalizedQuery = (query || '').trim();
  if (normalizedQuery.length < 2) {
    return false;
  }

  // 1. If it's a medical/clinical question, ALWAYS ALLOW! No block!
  if (isMedicalQuery(normalizedQuery)) {
    return false;
  }

  // 2. If it's a basic greeting or polite comment, ALWAYS ALLOW! No block!
  if (isGreetingOrPolite(normalizedQuery)) {
    return false;
  }

  // 3. If it's general assistant (not logged in console assistant):
  // General Assistant is ONLY allowed to answer medical queries or greetings.
  // Since it's not medical and not greeting, block it!
  if (isGeneralAssistant) {
    return true;
  }

  // 4. Console checks (Patient, Staff, Doctor, Admin)
  const normalizedRole = (role || '').toLowerCase().trim();
  if (normalizedRole === 'admin' || !normalizedRole) {
    return false; // Admin has all tabs open, so no block
  }

  // Let's check which tabs are referenced by the query
  const referencedTabs = getTabsFromQuery(normalizedQuery);
  if (referencedTabs.length === 0) {
    // It's a non-medical query that does not ask about any hospital tab/data (e.g. general knowledge, math, programming).
    // The user instruction: "medical ka qestion ager ni ho or ager wo tab os consolo ma open ni ho per bol not founnd"
    // Since it's not a medical query and no open tab matches, block it!
    return true;
  }

  // Check if ALL referenced tabs are open/allowed for this role:
  let allowedTabs: string[] = [];
  if (normalizedRole === 'patient') {
    allowedTabs = ['appointments', 'billing', 'patients', 'doctors'];
  } else if (normalizedRole === 'staff') {
    allowedTabs = ['appointments', 'consultation', 'billing', 'patients', 'blogs', 'inventory', 'staff'];
  } else if (normalizedRole === 'doctor') {
    allowedTabs = ['appointments', 'consultation', 'doctors', 'patients', 'staff', 'blogs', 'ipd-wards'];
  }

  // If any referenced tab is not allowed for the role, block it!
  const hasDisallowedTab = referencedTabs.some(tab => !allowedTabs.includes(tab));
  if (hasDisallowedTab) {
    return true;
  }

  // All referenced tabs are open and allowed in this console! Do not block!
  return false;
}

function checkDisallowedTabQuery(role: string, query: string): { disallowed: boolean } {
  const blocked = shouldBlockQuery(role, query, false);
  return { disallowed: blocked };
}

function checkGeneralAssistantQuery(query: string): { allowed: boolean } {
  const blocked = shouldBlockQuery('', query, true);
  return { allowed: !blocked };
}

async function processChatRequest(systemInstructionToUse: string, req: Request, res: Response, isGeneralAssistant: boolean = false) {
  try {
    const rawBody = req.body || {};
    const messages = Array.isArray(rawBody.messages) ? rawBody.messages : [];
    const context = rawBody.context && typeof rawBody.context === 'object' ? rawBody.context : {};
    const selectedModel = typeof rawBody.selectedModel === 'string' ? rawBody.selectedModel : 'auto';

    const keys = getKeys();
    const attempts: Array<{ provider: string; status: 'success' | 'failed' | 'skipped'; error?: string; modelUsed?: string }> = [];

    const userRole = (context.userRole || '').toLowerCase().trim();
    const userName = (context.userName || '').trim();

    // SENSITIVE DATA AND TAB SANITIZATION FOR CONSOLES (Patient, Staff, Doctor)
    if (context.data && typeof context.data === 'object') {
      if (userRole === 'patient') {
        const patientNameLower = userName.toLowerCase().trim();
        
        // 1. Only allow patient's own profile inside patientsSummary/allPatients
        if (Array.isArray(context.data.allPatients)) {
          context.data.allPatients = context.data.allPatients.filter((p: any) =>
            p.name && p.name.toLowerCase().trim() === patientNameLower
          );
        }
        if (Array.isArray(context.data.patientsSummary)) {
          context.data.patientsSummary = context.data.patientsSummary.filter((p: any) =>
            p.name && p.name.toLowerCase().trim() === patientNameLower
          );
        }

        // 2. Only allow patient's own appointments inside appointmentsSummary/allAppointments
        if (Array.isArray(context.data.allAppointments)) {
          context.data.allAppointments = context.data.allAppointments.filter((a: any) =>
            a.patient && a.patient.toLowerCase().trim() === patientNameLower
          );
        }
        if (Array.isArray(context.data.appointmentsSummary)) {
          context.data.appointmentsSummary = context.data.appointmentsSummary.filter((a: any) =>
            a.patient && a.patient.toLowerCase().trim() === patientNameLower
          );
        }

        // 3. Only allow patient's own bills inside billsSummary/allBills
        if (Array.isArray(context.data.allBills)) {
          context.data.allBills = context.data.allBills.filter((b: any) =>
            b.patient && b.patient.toLowerCase().trim() === patientNameLower
          );
        }
        if (Array.isArray(context.data.billsSummary)) {
          context.data.billsSummary = context.data.billsSummary.filter((b: any) =>
            b.patient && b.patient.toLowerCase().trim() === patientNameLower
          );
        }

        // 4. Delete all disallowed tab data for Patient completely
        delete context.data.allInventory;
        delete context.data.inventorySummary;
        delete context.data.allStaff;
        delete context.data.staffSummary;
        delete context.data.allWards;
        delete context.data.wardsSummary;
        delete context.data.allDepartments;
        delete context.data.departmentsSummary;
        delete context.data.allEnquiries;
        delete context.data.enquiriesSummary;
        delete context.data.allFinance;
        delete context.data.financeSummary;
        delete context.data.allTransactions;
        delete context.data.transactionsSummary;
        delete context.data.allMedicalTourism;
        delete context.data.medicalTourismSummary;
      } else if (userRole === 'staff') {
        // Delete all disallowed tab data for Staff completely (Staff can see appointments, consultations, billing, staff, patients, blogs)
        delete context.data.allInventory;
        delete context.data.inventorySummary;
        delete context.data.allWards;
        delete context.data.wardsSummary;
        delete context.data.allDoctors;
        delete context.data.doctorsSummary;
        delete context.data.allDepartments;
        delete context.data.departmentsSummary;
        delete context.data.allEnquiries;
        delete context.data.enquiriesSummary;
        delete context.data.allFinance;
        delete context.data.financeSummary;
        delete context.data.allTransactions;
        delete context.data.transactionsSummary;
        delete context.data.allMedicalTourism;
        delete context.data.medicalTourismSummary;
      } else if (userRole === 'doctor') {
        // Delete all disallowed tab data for Doctor completely (Doctor can see appointments, consultations, doctors, patients, staff, blogs, ipd-wards, billing)
        delete context.data.allInventory;
        delete context.data.inventorySummary;
        delete context.data.allDepartments;
        delete context.data.departmentsSummary;
        delete context.data.allEnquiries;
        delete context.data.enquiriesSummary;
        delete context.data.allFinance;
        delete context.data.financeSummary;
        delete context.data.allTransactions;
        delete context.data.transactionsSummary;
        delete context.data.allMedicalTourism;
        delete context.data.medicalTourismSummary;
      }
    }

    // Compose the screen and user context string to append for the AI to read
    const contextIntro = `
    --- SYSTEM CONTEXT ---
    Current Active Screen: ${context.activeTab || 'Unknown'}
    Log-In Identity Role: ${context.userRole || 'Admin/Guest'}
    Logged-In Name: ${context.userName || 'Hospital Administrator'}
    Current Loaded Data Context JSON: ${JSON.stringify(context.data || {})}
    ----------------------
    `;

    // Process and align messages safely
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    let lastMessageText = lastMessage && typeof lastMessage.content === 'string' ? lastMessage.content : '';
    const lastMessageImage = lastMessage && typeof lastMessage.image === 'string' ? lastMessage.image : '';
    const lastMessageAudio = lastMessage && typeof lastMessage.audio === 'string' ? lastMessage.audio : '';

    // Programmatic role-based tab data query blocking
    const disallowedCheck = checkDisallowedTabQuery(userRole, lastMessageText);
    if (disallowedCheck.disallowed) {
      return res.json({
        reply: `**Not Found**`,
        attempts: [{ provider: 'Role-Based Console Access Guard', status: 'success', modelUsed: 'Static-Access-Rules' }]
      });
    }

    // Programmatic general assistant medical-only constraint
    if (isGeneralAssistant) {
      const generalCheck = checkGeneralAssistantQuery(lastMessageText);
      if (!generalCheck.allowed) {
        return res.json({
          reply: `I am strictly restricted to answering medical and clinical questions only. Please ask a health or medical-related question.

(Main sirf medical aur clinical sawalat ke jawab de sakta hoon. Barah-e-maherbani sehat se mutalik sawal pouchein.)`,
          attempts: [{ provider: 'Strict Console Medical Guard', status: 'success', modelUsed: 'Static-Access-Rules' }]
        });
      }

      if (isGreetingOrPolite(lastMessageText)) {
        const greetingReply = `Hello ${userName || 'there'}! I am your Clinical AI Assistant. How can I help you with your health or medical questions today?

(Assalam-o-Alaikum ${userName || ''}! Main aapka Clinical AI Assistant hoon. Aaj main aapki sehat ya medical ke mutalik kya madad kar sakta hoon?)`;
        return res.json({
          reply: greetingReply,
          attempts: [{ provider: 'Quick Console Greeting', status: 'success', modelUsed: 'Static-Access-Rules' }]
        });
      }
    }

  // TOOL DETECTION
  const toolMatch = lastMessageText.match(/\[Contextual Tool selected:\s*(.*?)\s*\(Operation:\s*(.*?)\)\]/i);
  const guideMatch = lastMessageText.match(/Tool Instruction Guide:\s*(.*?)(?:\n\n|$)/is);

  // ROLE-BASED CONSOLE TAB RESTRICTION SECURITY CHECKS
  const activeTabName = (context.activeTab || '').toLowerCase().trim();
  
  let checkToolType = undefined;
  if (toolMatch) {
    checkToolType = toolMatch[2];
  }

  const roleCheck = checkRoleCapability(userRole, activeTabName, lastMessageText, checkToolType);
  if (!roleCheck.allowed) {
    const responseText = `${roleCheck.reason}
    
    (${roleCheck.UrduReason})`;
    return res.json({
      reply: responseText,
      attempts: [{ provider: `${context.userRole || 'User'} Console Guardrails`, status: 'success', modelUsed: 'Static-Filter-Rules' }]
    });
  }
  
  let isToolWithNoDetails = false;
  let toolLabel = '';
  let toolType = '';
  let toolPrompt = '';
  let userProvidedDetails = '';

  
  if (toolMatch) {
    toolLabel = toolMatch[1];
    toolType = toolMatch[2];
    if (guideMatch) {
      toolPrompt = guideMatch[1].trim();
    }
    
    const guideIndex = lastMessageText.indexOf('Tool Instruction Guide:');
    if (guideIndex !== -1) {
      const rest = lastMessageText.slice(guideIndex + 'Tool Instruction Guide:'.length);
      const afterGuideIndex = rest.indexOf('\n\n');
      if (afterGuideIndex !== -1) {
        userProvidedDetails = rest.slice(afterGuideIndex + 2).trim();
        if (!userProvidedDetails) {
          isToolWithNoDetails = true;
        }
      } else {
        isToolWithNoDetails = true;
      }
    } else {
      isToolWithNoDetails = true;
    }
  }

  const isTabSpecific = activeTabName && 
                        activeTabName !== 'general' && 
                        activeTabName !== 'general-ai' && 
                        activeTabName !== 'ai-assistant';

  if (isTabSpecific) {
    const query = lastMessageText.toLowerCase();
    
    // Only apply static text check if we have text input, to let un-transcribed audio/images proceed to live multimodal models if available
    if (query.trim().length > 0) {
      let referredOtherTab: string | null = null;
      let otherTabUrdu = '';
      let otherTabEng = '';

      // Check if they are referring to other tabs
      if (activeTabName !== 'billing' && (query.includes('bill') || query.includes('invoice') || query.includes('paisa') || query.includes('rupees') || query.includes('payment') || query.includes('amount') || query.includes('billon') || query.includes('finance') || query.includes('transaction'))) {
        referredOtherTab = 'billing';
        otherTabUrdu = 'Billing / Invoice';
        otherTabEng = 'Billing / Finance';
      } else if (activeTabName !== 'inventory' && (query.includes('inventory') || query.includes('stock') || query.includes('medicine') || query.includes('drug') || query.includes('pharma') || query.includes('paracetamol') || query.includes('tablet') || query.includes('syrup') || query.includes('drug list'))) {
        referredOtherTab = 'inventory';
        otherTabUrdu = 'Inventory (Medicine Stock)';
        otherTabEng = 'Inventory / Medicines';
      } else if (activeTabName !== 'doctors' && (query.includes('doctor') || query.includes('dr.') || query.includes('roster') || query.includes('specializ') || query.includes('surgeon') || query.includes('physician') || query.includes('availab'))) {
        referredOtherTab = 'doctors';
        otherTabUrdu = 'Doctors';
        otherTabEng = 'Doctors';
      } else if (activeTabName !== 'patients' && (query.includes('patient') || query.includes('sick') || query.includes('allergic') || query.includes('blood group') || query.includes('bloodgroup') || query.includes('admit') || query.includes('all Patients'))) {
        referredOtherTab = 'patients';
        otherTabUrdu = 'Patients';
        otherTabEng = 'Patients';
      } else if (activeTabName !== 'staff' && (query.includes('staff') || query.includes('member') || query.includes('nurse') || query.includes('duty') || query.includes('timings') || query.includes('salary') || query.includes('cleaner') || query.includes('duty list'))) {
        referredOtherTab = 'staff';
        otherTabUrdu = 'Staff';
        otherTabEng = 'Staff';
      } else if (activeTabName !== 'ipd-wards' && (query.includes('ward') || query.includes('bed') || query.includes('room') || query.includes('occupy') || query.includes('room fee') || query.includes('beds'))) {
        referredOtherTab = 'ipd-wards';
        otherTabUrdu = 'IPD Wards';
        otherTabEng = 'IPD Wards';
      } else if (activeTabName !== 'appointments' && (query.includes('appointment') || query.includes('booking') || query.includes('slot') || query.includes('schedule'))) {
        referredOtherTab = 'appointments';
        otherTabUrdu = 'Appointments';
        otherTabEng = 'Appointments';
      } else if (activeTabName !== 'consultation' && (query.includes('consult') || query.includes('prescribe') || query.includes('visit') || query.includes('symptom'))) {
        referredOtherTab = 'consultation';
        otherTabUrdu = 'Consultation';
        otherTabEng = 'Consultation';
      }

      if (referredOtherTab) {
        const responseText = `This specialized assistant on the **"${activeTabName}"** console is strictly restricted to current active data and operations. 
Your query concerns the **${otherTabEng}** tab. Please go to the **${otherTabEng}** tab to perform actions or ask questions about its records.

(Yeh assistant sirf **"${activeTabName}"** tab ke data aur operations ke liye restricted hai. Aap ka sawal **${otherTabUrdu}** tab se mutalik hai. Barah-e-maherbani aap **${otherTabUrdu}** tab par ja kar ye sawal ya action karein.)

[NAVIGATE: ${referredOtherTab}-ai]`;

        return res.json({
          reply: responseText,
          attempts: [{ provider: 'Specialized Console Routing', status: 'success', modelUsed: 'Static-Filter-Rules' }]
        });
      }

      // Block general clinical queries on specialized tabs
      const isGeneralClinicalKeyword = query.includes('fever') || query.includes('cough') || query.includes('bukhar') || query.includes('flu') || query.includes('cold') || query.includes('asthma') || query.includes('diabetes') || query.includes('cancer') || query.includes('pain') || query.includes('headache') || query.includes('treatment') || query.includes('prevention') || query.includes('symptoms');
      
      const isBasicGreeting = query.length < 15 && (
        query.includes('hi') || 
        query.includes('hello') || 
        query.includes('hey') || 
        query.includes('salaam') || 
        query.includes('aoa') || 
        query.includes('help') || 
        query.includes('intro') ||
        query.trim() === '?'
      );

      const hasCategoryKeywords = 
        query.includes(activeTabName) || 
        (activeTabName === 'doctors' && (query.includes('doctor') || query.includes('doc') || query.includes('dr.'))) ||
        (activeTabName === 'staff' && (query.includes('staff') || query.includes('member') || query.includes('nurse'))) ||
        (activeTabName === 'patients' && (query.includes('patient') || query.includes('sick'))) ||
        (activeTabName === 'billing' && (query.includes('bill') || query.includes('invoice') || query.includes('paisa') || query.includes('payment') || query.includes('amount'))) ||
        (activeTabName === 'inventory' && (query.includes('invent') || query.includes('stock') || query.includes('medicine') || query.includes('drug'))) ||
        (activeTabName === 'appointments' && (query.includes('appoint') || query.includes('book'))) ||
        (activeTabName === 'ipd-wards' && (query.includes('ward') || query.includes('bed') || query.includes('room')));

      const hasOperationKeywords = 
        query.includes('add') || 
        query.includes('create') || 
        query.includes('edit') || 
        query.includes('update') || 
        query.includes('delete') || 
        query.includes('remove') || 
        query.includes('list') || 
        query.includes('show') || 
        query.includes('modify') || 
        query.includes('change') || 
        query.includes('details') || 
        query.includes('naya') || 
        query.includes('nayi') || 
        query.includes('data') ||
        toolMatch !== null;

      if (isGeneralClinicalKeyword && !hasCategoryKeywords && !hasOperationKeywords && !isBasicGreeting) {
        const responseText = `General medical and clinical questions can only be answered on the main "AI Assistant" tab. This console is dedicated strictly to managing "${activeTabName}" data and operations.

(General medical ya clinical sawalat ke jawab sirf main "AI Assistant" tab par diye ja sakte hain. Yeh console sirf "${activeTabName}" tab ke data aur operations ke liye dedicated hai. Barah-e-maherbani aap main "AI Assistant" tab par ja kar ye sawal karein.)`;

        return res.json({
          reply: responseText,
          attempts: [{ provider: 'General Clinical Redirection', status: 'success', modelUsed: 'Static-Filter-Rules' }]
        });
      }

      // If query is completely unrelated and not basic greeting
      if (!isBasicGreeting && !hasCategoryKeywords && !hasOperationKeywords && !isGeneralClinicalKeyword && !lastMessageImage) {
        const responseText = `This specialized assistant is restricted strictly to "${activeTabName}" data and operations. For other questions, please go to the main "AI Assistant" tab.

(Yeh assistant sirf "${activeTabName}" tab ke data aur operations se mutalik jawab de sakta hai. Kisi aur qism ke sawal ke liye, barah-e-maherbani main "AI Assistant" tab par jayen.)`;

        return res.json({
          reply: responseText,
          attempts: [{ provider: 'Specialized Tab Constraint Checks', status: 'success', modelUsed: 'Static-Filter-Rules' }]
        });
      }
    }
  }

  // Append context to the last user message so the models always have it
  let finalPrompt = '';
  if (isToolWithNoDetails) {
    finalPrompt = `${contextIntro}
User selected the tool: "${toolLabel}" (${toolType} Operation)
Tool Guideline/Instruction: "${toolPrompt}"

CRITICAL INSTRUCTION: The user has selected this contextual tool from the dropdown menu but has NOT provided any text or details in their message (the text input was left completely empty).
Because of this, you must NOT perform or simulate the operation yet. Instead, follow these steps:
1. Greet them in a friendly, encouraging, and professional clinical coordinator tone.
2. Clearly state that you see they want to run the "${toolLabel}" tool/operation.
3. List clearly and concisely, with clean bullet points, the exact parameters and details required from them to proceed with this "${toolType.toUpperCase()}" action on this screen. (For example, if registering a patient: ask for patient name, age, gender, contact number, blood group, etc. If booking an appointment: ask for slot timing, doctor name, patient name. If deleting: ask for target ID/name).
4. Provide a simple, copy-pasteable example of how they can type and submit these details in their next message.
5. Write your response in a clear bilingual/Roman Urdu/English layout so it is extremely easy to read.`;
  } else if (toolMatch && userProvidedDetails) {
    finalPrompt = `${contextIntro}
User selected the tool: "${toolLabel}" (${toolType} Operation)
Tool Guideline/Instruction: "${toolPrompt}"
User Provided Details: "${userProvidedDetails}"

CRITICAL INSTRUCTION: The user has selected the tool and provided the details required to execute it.
Please parse these details, simulate or execute the "${toolType.toUpperCase()}" operation successfully in your response (e.g., draft or confirm the record creation, modification, or deletion), and state clearly in a friendly clinical coordinator tone that the operation has been registered/processed. Show them the final record details or confirmation.`;
  } else if (!lastMessageText.trim() && lastMessageAudio) {
    finalPrompt = `${contextIntro}\n(The user has submitted a voice audio query. Please listen to the attached audio, understand or transcribe their query, and reply directly with a text response based on what they spoke.)`;
  } else if (!lastMessageText.trim() && lastMessageImage) {
    finalPrompt = `${contextIntro}\n(The user has uploaded a clinical image/scan without typing any message. Please analyze this image/scan thoroughly and provide your medical or clinical diagnostic insights.)`;
  } else {
    finalPrompt = `${contextIntro}\nUser Message: ${lastMessageText}`;
  }

  // ----------------------------------------------------
  // Dynamic RAG context retrieval
  // ----------------------------------------------------
  if (lastMessageText && typeof lastMessageText === 'string') {
    const ragData = retrieveRelevantDocs(lastMessageText, context.data, userRole, userName);
    if (ragData) {
      finalPrompt = `${ragData}\n\n${finalPrompt}`;
    }
  }

  // Construct dynamic system instructions based on role console constraints
  let roleSystemPrompt = '';
  if (isGeneralAssistant) {
    roleSystemPrompt = `

CRITICAL GENERAL ASSISTANT RULE:
- You are answering queries in the General AI Assistant.
- You are STRICTLY RESTRICTED to ONLY answer clinical, wellness, and medical questions (e.g., medical advice, healthy lifestyle, disease symptoms, treatments, drug information).
- You are STRICTLY FORBIDDEN from discussing, listing, searching, or revealing any hospital records, data, appointments, patient lists, billing records, staff details, ward bed occupancy, or pharmacy/medicine stock inventories.
- If the user asks about ANY data, database records, hospital statistics, lists, registers, or any other non-medical query (like general knowledge, history, programming, math, pop culture, capital of a country, etc.), you MUST reply with exactly: "**Not Found**" or "not found" (or "Data Not Found" / "Record Not Found" in Urdu/Roman Urdu if asked in Urdu). Do not explain or apologize. Just say: "**Not Found**".
`;
  } else if (userRole === 'patient') {
    roleSystemPrompt = `

CRITICAL PATIENT CONSOLE SECURITY & PERMISSION RULES:
- You are answering queries in the Patient Console.
- You can answer general medical or clinical questions (e.g., treatment, advice, medicines for symptoms).
- For hospital data, you ONLY have access to the logged-in patient's own records (Appointments, Bills, and Patient Profile for "${userName}").
- You are STRICTLY FORBIDDEN from accessing, discussing, or revealing any other patients' data, staff records, ward/bed occupancies, pharmacy/medicine stock inventories, hospital finances, enquiries, departments, or other disallowed tabs.
- If the user asks about other patients' records, or asks for data belonging to any disallowed tabs (like inventory, staff, wards, finance, configure-hospital, enquiries, departments), you MUST reply with exactly: "Not Found" or "not found" (or "Data Not Found" / "Record Not Found" in Urdu/Roman Urdu if they asked in Urdu). Do not hallucinate or try to guess this data.

DATABASE ACTION PERMISSIONS FOR PATIENT ROLE:
- Allowed Actions (Permitted):
  * Book Appointment Slot (type: add) under your own patient name.
  * Edit My Profile (type: edit) for your own profile details.
- Disallowed Actions (Restricted):
  * You CANNOT add/edit/delete staff profiles, doctor profiles, invoices/billing, inventory/stock, departments, or other patients.
  * You CANNOT delete/cancel appointments.
- If the user tries to command or request any disallowed action, you MUST immediately refuse with a polite message: "I do not have permission to perform this action in the Patient Console." (or Urdu equivalent: "Patient console me is action ki ijazat nahi hai.") and NEVER output any "[ACTION: ...]" JSON tags for disallowed actions.
`;
  } else if (userRole === 'staff') {
    roleSystemPrompt = `

CRITICAL STAFF CONSOLE SECURITY & PERMISSION RULES:
- You are answering queries in the Staff Console.
- You can answer general medical or clinical questions.
- For hospital data, you ONLY have access to the data of tabs open/available to Staff: Appointments, Consultations, Billing, Staff directory, Patients profiles, Inventory/Pharmacy stock, and Blogs.
- You DO NOT have access to, and are STRICTLY FORBIDDEN from discussing or revealing data of disallowed tabs: IPD Wards (Beds/occupancy), Doctors details, Departments load, Enquiries/leads, Medical Tourism, Finance/revenue statistics, Configure Hospital settings, or Reports.
- If the user asks for data belonging to any of these disallowed tabs (e.g., ward beds, doctor details, finance revenue), you MUST reply with exactly: "Not Found" or "not found" (or "Data Not Found" / "Record Not Found" in Urdu/Roman Urdu if they asked in Urdu). Do not hallucinate or try to guess this data.

DATABASE ACTION PERMISSIONS FOR STAFF ROLE:
- Allowed Actions (Permitted):
  * Register New Patient (type: add) and Edit Patient Profile (type: edit).
  * Book Appointment Slot (type: add) and Reschedule Appointment Slot (type: edit).
  * Generate New Invoice (type: add) and Edit Invoice Details (type: edit).
  * Add Stock Item (type: add) and Edit Stock Details (type: edit).
- Disallowed Actions (Restricted):
  * You CANNOT delete or archive patient profiles (delete patients).
  * You CANNOT cancel or delete appointment slots (delete appointments).
  * You CANNOT cancel, void, or delete billing invoices (delete billing).
  * You CANNOT delete or remove expired stock (delete inventory).
  * You CANNOT add, edit, or delete staff members or doctor profiles.
  * You CANNOT write clinical prescriptions or log clinical consultations.
- If the user tries to command or request any disallowed action, you MUST immediately refuse with a polite message: "I do not have permission to perform this action in the Staff Console." (or Urdu equivalent: "Staff console me is action ki ijazat nahi hai.") and NEVER output any "[ACTION: ...]" JSON tags for disallowed actions.
`;
  } else if (userRole === 'doctor') {
    roleSystemPrompt = `

CRITICAL DOCTOR CONSOLE SECURITY & PERMISSION RULES:
- You are answering queries in the Doctor Console.
- You can answer general medical or clinical questions.
- For hospital data, you ONLY have access to the data of tabs open/available to Doctors: Appointments, Consultations, Doctors list, Patients profiles, Staff directory, Blogs, and IPD Wards.
- You DO NOT have access to, and are STRICTLY FORBIDDEN from discussing or revealing data of disallowed tabs: Inventory (Pharmacy stock/items), Departments load, Enquiries/leads, Medical Tourism, Finance/revenue statistics, Configure Hospital settings, or Reports.
- If the user asks for data belonging to any of these disallowed tabs (e.g., inventory stock, enquiries, finance revenue, hospital configuration), you MUST reply with exactly: "Not Found" or "not found" (or "Data Not Found" / "Record Not Found" in Urdu/Roman Urdu if they asked in Urdu). Do not hallucinate or try to guess this data.

DATABASE ACTION PERMISSIONS FOR DOCTOR ROLE:
- Allowed Actions (Permitted):
  * Log Clinical Consultation (type: add) and Modify Prescription Notes (type: edit).
  * Update Doctor Details (type: edit) for your own profile.
  * Reschedule/Update Appointment status or notes (type: edit).
- Disallowed Actions (Restricted):
  * You CANNOT register new patient profiles or delete patient files (add/delete patients).
  * You CANNOT cancel or delete appointment slots (delete appointments).
  * You CANNOT add or delete doctor profiles.
  * You CANNOT add, edit, or delete staff profiles, billing/invoices, inventory/stock, or departments.
- If the user tries to command or request any disallowed action, you MUST immediately refuse with a polite message: "I do not have permission to perform this action in the Doctor Console." (or Urdu equivalent: "Doctor console me is action ki ijazat nahi hai.") and NEVER output any "[ACTION: ...]" JSON tags for disallowed actions.
`;
  }

  const finalSystemInstruction = systemInstructionToUse + roleSystemPrompt;

  // Build sequential priority list based on user dropdown selection
  let providerChain: string[] = [];

  if (selectedModel === 'gemini') {
    providerChain = ['gemini', 'openai', 'claude'];
  } else if (selectedModel === 'openai') {
    providerChain = ['openai', 'claude', 'gemini'];
  } else if (selectedModel === 'claude') {
    providerChain = ['claude', 'openai', 'gemini'];
  } else {
    // Default fallback chain (Auto) - Prioritize Gemini first (native AI Studio model), then OpenAI, then Claude
    providerChain = ['gemini', 'openai', 'claude'];
  }

  // Iterate over provider sequence
  for (const provider of providerChain) {
    let reply: string | null = null;
    if (provider === 'gemini') {
      reply = await tryGemini(keys, finalPrompt, lastMessageImage, lastMessageAudio, attempts, finalSystemInstruction);
    } else if (provider === 'openai') {
      reply = await tryOpenAI(keys, finalPrompt, lastMessageImage, attempts, finalSystemInstruction);
    } else if (provider === 'claude') {
      reply = await tryAnthropic(keys, finalPrompt, lastMessageImage, attempts, finalSystemInstruction);
    }

    if (reply) {
      const parsedAction = detectAndParseAction(reply, lastMessageText, activeTabName);
      // If we got a successful outcome, immediately return to client
      return res.json({
        reply,
        action: parsedAction || undefined,
        attempts
      });
    }
  }

  // Pure Offline/Rule-based Intelligent Clinical Fallback (if everything else is offline)
  attempts.push({ provider: 'Offline Local Rules', status: 'success', modelUsed: 'Smart-Response-Engine' });

  // If a tool was selected, provide a precise offline response for it!
  if (isToolWithNoDetails) {
    let offlineDetailsReply = `📋 **Selected Action: ${toolLabel}** (Operation: ${toolType.toUpperCase()})
*(Selected AI model is currently offline/unconfigured, but I can guide you locally!)*

Aap ne ye tool select kiya hai, lekin text box me koi details nahi likhi hain. Is task ko complete karne ke liye mujhe niche di gayi details chahiye:

`;

    if (toolType.toLowerCase() === 'add') {
      offlineDetailsReply += `- **Name / Title**: (e.g., Doctor/Staff/Patient ka Full Name, ya Medicine/Item Name)
- **Department / Location**: (e.g., Cardiology, Ward A, Room 101, Pharmacy)
- **Key Parameters / Contact**: (e.g., Phone number, Consulting fee, Bed number, Stock quantity, or Salary)

**Example Format to send next:**
\`Name: Dr. Shazib, Department: Cardiology, Fee: 500, Room: 101\`

*Barah-e-maherbani ye details chat box me type kar ke send karein taake hum naya record successfully register/add kar sakein.*`;
    } else if (toolType.toLowerCase() === 'edit') {
      offlineDetailsReply += `- **Target Record Name / ID**: (Kis entry ko edit/update karna hai?)
- **Fields to Update**: (Phone number, Shift timings, Bed allotment, Fee, or Stock count)
- **New Value**: (Naya data kya set karna hai?)

**Example Format to send next:**
\`Update Doctor Dr. Shazib: set Fee to 600, set Room to 105\`

*Barah-e-maherbani update details send karein taake hum records update kar sakein.*`;
    } else if (toolType.toLowerCase() === 'delete') {
      offlineDetailsReply += `- **Record Name / ID**: (Kis entry, invoice, ya reservation ko cancel/delete karna hai?)
- **Reason (Optional)**: (Cancel ya delete karne ki wajah)

**Example Format to send next:**
\`Delete patient record for ID: PT-9082\`

*Barah-e-maherbani delete hone wale record ka Name/ID bataiye taake hum use database se remove kar sakein.*`;
    } else {
      offlineDetailsReply += `- **Search Filters / Parameters**: (Kis criteria ke mutabik list dekhna chahte hain?)

*Barah-e-maherbani list filter criteria likh kar send karein.*`;
    }

    return res.json({
      reply: offlineDetailsReply,
      attempts
    });
  }

  if (toolMatch && userProvidedDetails) {
    // Basic parser for key-value formats like Name: Dr. Shazib, Age: 30, phone: 12345
    const parsedItem: Record<string, any> = {};
    const pairs = userProvidedDetails.split(/,|\n/);
    pairs.forEach(p => {
      const parts = p.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim().toLowerCase();
        let value: any = parts.slice(1).join(':').trim();
        // Convert to number if applicable
        if (!isNaN(value as any) && value !== '') {
          value = Number(value);
        }
        
        // Map common key aliases to standard typescript properties
        if (key.includes('name') || key === 'nam' || key.includes('patient') || key.includes('doctor') || key.includes('staff')) {
          parsedItem.name = value;
          parsedItem.patientName = value;
          parsedItem.doctorName = value;
        } else if (key.includes('age') || key === 'umer') {
          parsedItem.age = Number(value) || 30;
        } else if (key.includes('gender') || key === 'jins') {
          parsedItem.gender = value;
        } else if (key.includes('phone') || key.includes('contact') || key === 'no') {
          parsedItem.phone = String(value);
        } else if (key.includes('fee') || key === 'paisa' || key.includes('charge')) {
          parsedItem.consultationFee = Number(value) || 500;
          parsedItem.fee = Number(value) || 500;
        } else if (key.includes('dept') || key.includes('special') || key.includes('role')) {
          parsedItem.specialization = value;
          parsedItem.department = value;
          parsedItem.role = value;
        } else if (key.includes('amount') || key.includes('cost') || key.includes('price')) {
          parsedItem.amount = Number(value) || 1000;
          parsedItem.price = Number(value) || 1000;
        } else if (key.includes('stock') || key.includes('qty')) {
          parsedItem.stock = Number(value) || 10;
        } else if (key.includes('status')) {
          parsedItem.status = value;
        } else if (key.includes('id') || key.includes('code')) {
          parsedItem.id = String(value);
        } else {
          // generic fallback
          const cleanedKey = key.replace(/[^a-zA-Z0-9]/g, '');
          if (cleanedKey) {
            parsedItem[cleanedKey] = value;
          }
        }
      }
    });

    // Ensure we have some default fields if not parsed
    if (!parsedItem.name && !parsedItem.patientName && !parsedItem.doctorName) {
      parsedItem.name = userProvidedDetails.slice(0, 30);
      parsedItem.patientName = userProvidedDetails.slice(0, 30);
      parsedItem.doctorName = userProvidedDetails.slice(0, 30);
    }
    if (!parsedItem.id) {
      parsedItem.id = 'ID-' + Math.floor(1000 + Math.random() * 9000);
    }

    let offlineSuccessReply = `✅ **Operation Simulated Successfully!**
**Tool**: ${toolLabel} (${toolType.toUpperCase()})

Aap ki di gayi details ke mutabik task process ho chuka hai:
- **Provided Data**: \`${userProvidedDetails}\`
- **Resulting Entry**: ${parsedItem.name || parsedItem.id} has been registered.
- **Status**: Registered & Saved successfully!

*(Note: AI API unconfigured hone ki wajah se ye offline simulation hai, lekin aap ka provided data successfully read aur align kar liya gaya hai!)*`;

    const actionObj = {
      type: toolType.toLowerCase(),
      tab: activeTabName,
      id: parsedItem.id || String(parsedItem.name || ''),
      item: parsedItem
    };

    return res.json({
      reply: offlineSuccessReply,
      action: actionObj,
      attempts
    });
  }

  // Analyze simple keyword topics to formulate smart response in urdu/english medical context
  const query = lastMessageText.toLowerCase();
  let fallbackReply = `⚠️ Note: Selected AI model is currently unconfigured, but I can read and reply to your screen's active console data!

**1. Data Screen Analysis (${context.activeTab || 'General'}):**
- You are logged in as **${context.userName || 'Hospital Admin'}** (${context.userRole || 'Admin'}).
`;

  // Dynamically attach the active tab's output data showing on the user's console
  if (activeTabName === 'doctors' && Array.isArray(context.data?.doctorsSummary)) {
    const list = context.data.doctorsSummary.map((d: any) => `- **Dr. ${d.name}** (${d.specialization}) - Status: **${d.status}** (ID: ${d.id})`).join('\n');
    fallbackReply += `\n**📋 Active Doctors Duty List (Live Console Output):**\n${list || '*No doctor entries found.*'}\n`;
  } else if (activeTabName === 'patients' && Array.isArray(context.data?.patientsSummary)) {
    const list = context.data.patientsSummary.map((p: any) => `- **${p.name}** (Age: ${p.age}, Gender: ${p.gender}) - Status: **${p.status}** (ID: ${p.id})`).join('\n');
    fallbackReply += `\n**📋 Active Patients Care List (Live Console Output):**\n${list || '*No patient entries found.*'}\n`;
  } else if (activeTabName === 'staff' && Array.isArray(context.data?.staffSummary)) {
    const list = context.data.staffSummary.map((s: any) => `- **${s.name}** (${s.role}, ${s.department}) - Status: **${s.status}** (ID: ${s.id})`).join('\n');
    fallbackReply += `\n**📋 Active Medical Staff List (Live Console Output):**\n${list || '*No staffing entries found.*'}\n`;
  } else if (activeTabName === 'billing' && Array.isArray(context.data?.billsSummary)) {
    const list = context.data.billsSummary.map((b: any) => `- **${b.patient}** - Bill Amount: **${b.amount}**, Pending: **${b.pendingAmount}**, Status: **${b.status}** (ID: ${b.id})`).join('\n');
    fallbackReply += `\n**📋 Active Bills & Invoices List (Live Console Output):**\n${list || '*No billing records found.*'}\n`;
  } else if (activeTabName === 'inventory' && Array.isArray(context.data?.inventorySummary)) {
    const list = context.data.inventorySummary.map((i: any) => `- **${i.name}** (${i.category}) - Stock Level: **${i.stock}/${i.minStock}**, Price: **${i.price}** (ID: ${i.id})`).join('\n');
    fallbackReply += `\n**📋 Active Pharmacy & Medicine Inventory (Live Console Output):**\n${list || '*No inventory records found.*'}\n`;
  } else if (activeTabName === 'appointments' && Array.isArray(context.data?.appointmentsSummary)) {
    const list = context.data.appointmentsSummary.map((a: any) => `- **${a.patient}** with Dr. ${a.doctor} (${a.specialization}) at ${a.time} - Status: **${a.status}** (ID: ${a.id})`).join('\n');
    fallbackReply += `\n**📋 Active Appointments List (Live Console Output):**\n${list || '*No appointment slots found.*'}\n`;
  } else if (activeTabName === 'ipd-wards' && Array.isArray(context.data?.wardsSummary)) {
    const list = context.data.wardsSummary.map((w: any) => `- **${w.name}** (${w.type}) - Bed Occupancy: **${w.occupiedBeds}/${w.totalBeds}** (Price/Day: ${w.pricePerDay}) (ID: ${w.id})`).join('\n');
    fallbackReply += `\n**📋 Active Wards & Beds List (Live Console Output):**\n${list || '*No wards records found.*'}\n`;
  } else {
    fallbackReply += `- Based on the current view data, I can see you are looking at clinical metrics.`;
  }

  fallbackReply += `\n\n`;

  // Guardrail test offline
  const hasAttachment = !!lastMessageImage || !!lastMessageAudio || query.includes('[document attached:') || query.includes('document content:');
  const isMedicalQuery = 
    hasAttachment ||
    query.includes('pain') || query.includes('dard') || query.includes('fever') || query.includes('cough') || query.includes('headache') ||
    query.includes('doctor') || query.includes('patient') || query.includes('appointment') || query.includes('bill') || query.includes('heart') ||
    query.includes('medicine') || query.includes('drug') || query.includes('clinical') || query.includes('report') || query.includes('rash') ||
    query.includes('treatment') || query.includes('hospital') || query.includes('tab') || query.includes('asthma') || query.includes('sugar') ||
    query.includes('bp') || query.includes('blood pressure') || query.includes('website') || query.includes('page') || query.includes('feature') ||
    query.includes('screen') || query.includes('how to') || query.includes('tarika') || query.includes('help') || query.includes('system') ||
    query.includes('app');

  if (lastMessageAudio && attempts.every(att => att.status !== 'success')) {
    fallbackReply = `⚠️ Note: No live AI model keys are currently configured to process other languages or perform actual speech recognition.
    
I received your actual voice message successfully! However, to listen to, transcribe, and dynamically answer your clinical voice query, please configure a valid **GEMINI_API_KEY** in the chat/platform settings.

Once the API Key is supplied, Google Gemini will listen to your audio query and provide full clinical and language-based answers!

*(Aap ki voice message hume mil gayi hai! Magar is awaz ko sunne aur samajhne ke liye, settings panel me valid **GEMINI_API_KEY** configure karein taake model isko direct translate aur process kar sake.)*`;
    return res.json({
      reply: fallbackReply,
      attempts
    });
  }

  if (!isMedicalQuery && query.length > 3) {
    const hasSpanish = /\b(hola|que|como|capital|escribir|presidente|deporte|tiempo|clima)\b/i.test(query);
    const hasUrduArabic = /[\u0600-\u06FF]/.test(query);
    const hasHindiDev = /[\u0900-\u097F]/.test(query);
    const hasRomanUrdu = /\b(kya|tum|mujhse|hai|hein|kar|sakte|sunao|gana|haal|kaise|shairi|da|sakta)\b/i.test(query);

    if (hasUrduArabic) {
      fallbackReply = `صرف طبی اور ہسپتال کی ویب سائٹ کے سوالات کے جوابات دے سکتا ہوں۔`;
    } else if (hasHindiDev) {
      fallbackReply = `मैं केवल चिकित्सा और अस्पताल वेबसाइट संबंधी प्रश्नों के उत्तर दे सकता हूँ।`;
    } else if (hasSpanish) {
      fallbackReply = `Solo puedo responder a preguntas médicas o de la web del hospital.`;
    } else if (hasRomanUrdu) {
      fallbackReply = `Only medical aur hospital website questions ka answer da sakta hu`;
    } else {
      fallbackReply = `I can only answer medical or hospital website-related questions.`;
    }
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

  const parsedAction = detectAndParseAction(fallbackReply, lastMessageText, activeTabName);

    return res.json({
      reply: fallbackReply,
      action: parsedAction || undefined,
      attempts
    });
  } catch (err: any) {
    console.error("CRITICAL error in processChatRequest:", err);
    return res.status(500).json({
      reply: `⚠️ System Exception: ${err.message || 'Unknown server error occurred.'}\n\nPlease check your input/parameters or try re-sending.`,
      attempts: [{ provider: 'Express Global Error Guard', status: 'failed', error: err.message || 'Server Exception' }]
    });
  }
}

// Default Global Chat POST Route
router.post('/chat', async (req: Request, res: Response) => {
  return processChatRequest(SYSTEM_INSTRUCTION, req, res, true);
});

// Separate login endpoint for the AI Assistant custom users
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailNormalized = email.trim().toLowerCase();

    // 1. Try checking custom AI Assistant users first (the separate db)
    const customUser = db.prepare('SELECT * FROM ai_users WHERE email = ?').get(emailNormalized) as any;
    if (customUser) {
      if (customUser.password === password) {
        return res.json({
          success: true,
          role: 'patient',
          isAiUser: true,
          data: {
            id: customUser.id,
            name: customUser.name,
            email: customUser.email,
            phone: customUser.phone,
            age: customUser.age,
            gender: customUser.gender,
            dob: customUser.dob,
            bloodGroup: customUser.bloodGroup,
            address: customUser.address,
            registeredAt: customUser.registeredAt
          }
        });
      } else {
        return res.status(401).json({ error: 'Incorrect password.' });
      }
    }

    // 2. Try checking clinical Patients table
    const patientUser = db.prepare('SELECT * FROM patients WHERE LOWER(email) = ?').get(emailNormalized) as any;
    if (patientUser) {
      if (patientUser.password === password) {
        return res.json({
          success: true,
          role: 'patient',
          data: patientUser
        });
      } else {
        return res.status(401).json({ error: 'Incorrect password.' });
      }
    }

    // 3. Try checking Doctors table
    const doctorUser = db.prepare('SELECT * FROM doctors WHERE LOWER(email) = ?').get(emailNormalized) as any;
    if (doctorUser) {
      if (doctorUser.password === password) {
        return res.json({
          success: true,
          role: 'doctor',
          data: doctorUser
        });
      } else {
        return res.status(401).json({ error: 'Incorrect password.' });
      }
    }

    // 4. Try checking Staff table
    const staffUser = db.prepare('SELECT * FROM staff WHERE LOWER(email) = ?').get(emailNormalized) as any;
    if (staffUser) {
      if (staffUser.password === password) {
        return res.json({
          success: true,
          role: 'staff',
          data: staffUser
        });
      } else {
        return res.status(401).json({ error: 'Incorrect password.' });
      }
    }

    return res.status(404).json({ error: 'No user account found with this email address.' });
  } catch (err: any) {
    console.error('Error in custom ai-assistant login:', err);
    return res.status(500).json({ error: err.message || 'Server login error' });
  }
});

// Separate signup endpoint for the AI Assistant custom users
router.post('/signup', (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, age, gender, dob, bloodGroup, address, alsoRegisterAsPatient, hospitalId, hospitalName } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'Name, email, password, and phone number are required.' });
    }

    const emailNormalized = email.trim().toLowerCase();

    // Check if user already exists in ai_users
    const existing = db.prepare('SELECT * FROM ai_users WHERE email = ?').get(emailNormalized);
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered. Please login.' });
    }

    // Insert new user
    const id = `ai-usr-${Date.now()}`;
    const registeredAt = new Date().toISOString();
    const ageVal = Number(age) || 25;

    db.prepare(`
      INSERT INTO ai_users (id, name, email, password, phone, age, gender, dob, bloodGroup, address, registeredAt, hospitalId, hospitalName)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name.trim(),
      emailNormalized,
      password,
      phone.trim(),
      ageVal,
      gender || 'Male',
      dob || null,
      bloodGroup || null,
      address || null,
      registeredAt,
      hospitalId || null,
      hospitalName || null
    );

    // If check button was clicked, we ALSO register as patient in clinical patients database
    if (alsoRegisterAsPatient) {
      db.prepare(`
        INSERT OR REPLACE INTO patients (
          id, name, age, gender, phone, registeredAt, status, 
          wardId, roomId, bedNumber, dob, bloodGroup, address, email, password, hospitalId, hospitalName
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        name.trim(),
        ageVal,
        gender || 'Male',
        phone.trim(),
        registeredAt,
        'Active',
        null,
        null,
        null,
        dob || null,
        bloodGroup || null,
        address || null,
        emailNormalized,
        password,
        hospitalId || null,
        hospitalName || null
      );
    }

    const user = {
      id,
      name: name.trim(),
      email: emailNormalized,
      password: password,
      phone: phone.trim(),
      age: ageVal,
      gender: gender || 'Male',
      dob,
      bloodGroup,
      address,
      registeredAt,
      hospitalId,
      hospitalName
    };

    return res.json({ success: true, user });
  } catch (err: any) {
    console.error('Error in custom ai-assistant signup:', err);
    return res.status(500).json({ error: err.message || 'Server signup error' });
  }
});

// Category-Specific Independent API Routers for each section
router.post('/:category/chat', async (req: Request, res: Response) => {
  const { category } = req.params;
  const customInstruction = getCategoryInstruction(category);
  return processChatRequest(customInstruction, req, res);
});

export default router;
