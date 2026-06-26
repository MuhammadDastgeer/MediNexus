import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import dotenv from 'dotenv';
import db from '../db.js';

// Load environment variables from .env file
dotenv.config();

const router = Router();

// Robust key-cleaning helper to strip accidental quotes and trim spacing
const cleanKey = (key?: string) => {
  if (!key) return '';
  return key.replace(/^["']|["']$/g, '').trim();
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
1. ONLY answer queries that are:
   a. Related to medical knowledge, healthy lifestyles, clinical symptoms, wellness guidance, medical analysis, pharmacology, diagnostics, procedures, etc.
   b. Related to the provided Screen and Role Context (e.g. queries about appointment lists, bills, financial records, inventory items, ward structures, doctor lists).
2. If the user asks about ANYTHING ELSE that is NOT related to medical/clinical care, healthcare, or hospital data management (for example: general knowledge, weather, sports, politics, pop culture, irrelevant coding, cooking recipes, general storytelling, or general file contents of a non-medical file/image/document):
   - You MUST detect the language of the user's message/query.
   - You MUST reply to them in that EXACT SAME LANGUAGE stating ONLY that you can only answer medical questions.
   - Do NOT provide any other information, explanation, or reasoning.
   - Examples of exact matching replies for non-medical queries per language detected:
     * Roman Urdu / Roman Hindi / Hinglish (e.g., "kya haal hai", "gaana sunao", "France ka capital kya hai", "ap kya kr skte ho"): "Only medical questions ka answer da sakta hu"
     * English (e.g., "Hello, tell me a joke", "What is the capital of...", "write a poem", "how to code"): "I can only answer medical questions."
     * Urdu Script (Nastaliq, e.g., "آپ کیا کر سکتے ہیں؟", "فرانس کا دارالحکومت"): "صرف طبی سوالات کے جوابات دے سکتا ہوں۔"
     * Hindi Script (Devanagari, e.g., "आप क्या कर सकते हैं?", "फ्रांस की राजधानी क्या है?"): "मैं केवल चिकित्सा संबंधी प्रश्नों के उत्तर दे 😊क्ता हूँ।"
     * Spanish (e.g., "¿Cuál es la capital...", "¿Qué puedes hacer?"): "Solo puedo responder a preguntas médicas."
     * French (e.g., "Quelle est la capitale...", "Que pouvez-vous faire?"): "Je ne peux répondre qu'aux questions médicales."
     * German (e.g., "Was kannst du tun?"): "Ich kann nur medizinische Fragen beantworten."
     * Arabic (e.g., "ما هي عاصمة فرنسا؟"): "يمكنني فقط الإجابة على الأسئلة الطبية."
     * Other languages: Translate the phrase "I can only answer medical questions" or "Only medical questions ka answer da sakta hu" into that language, and output ONLY that phrase.
3. Respond in a highly professional, clinical, helpful, and concise manner.
4. If an image or any other document file is uploaded (such as a lab report, prescription, skin rash, clinical medical records, spreadsheets with hospital/patient metrics, csv data of symptoms), check it thoroughly and provide your clinical insight. If the file content is not related to healthcare/medical/hospital records, treat it as a non-medical query and reply ONLY in the same language as the user's accompanying message/query using the translation as specified in Rule 2.
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

async function tryGemini(keys: any, prompt: string, image: string, audio: string, attempts: any[], systemInstruction: string = SYSTEM_INSTRUCTION) {
  if (keys.gemini && keys.gemini !== 'MY_GEMINI_API_KEY' && keys.gemini.trim() !== '') {
    try {
      const model = new ChatGoogleGenerativeAI({
        model: 'gemini-3.5-flash',
        apiKey: keys.gemini,
        temperature: 0.2,
      });

      let contentPayload: any = prompt;
      if (image || audio) {
        contentPayload = [{ type: 'text', text: prompt }];
        if (image) {
          const parsed = parseImageData(image);
          if (parsed) {
            contentPayload.push({
              type: 'image_url',
              image_url: {
                url: `data:${parsed.mimeType};base64,${parsed.base64Data}`
              }
            });
          }
        }
        if (audio) {
          const parsedAudio = parseImageData(audio);
          if (parsedAudio) {
            contentPayload.push({
              type: 'image_url',
              image_url: {
                url: `data:${parsedAudio.mimeType};base64,${parsedAudio.base64Data}`
              }
            });
          }
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

        attempts.push({ provider: 'Google Gemini (LangChain)', status: 'success', modelUsed: 'gemini-3.5-flash' });
        return replyText;
      } else {
        throw new Error('Empty response returned from Google Gemini via LangChain.');
      }
    } catch (err: any) {
      console.error("tryGemini LangChain Error details:", err);
      attempts.push({ provider: 'Google Gemini (LangChain)', status: 'failed', error: err.message || 'Unknown network error' });
    }
  } else {
    attempts.push({ provider: 'Google Gemini (LangChain)', status: 'skipped', error: 'API key is not configured' });
  }
  return null;
}

async function tryOpenAI(keys: any, prompt: string, image: string, attempts: any[], systemInstruction: string = SYSTEM_INSTRUCTION) {
  if (keys.openai && keys.openai.trim() !== '') {
    try {
      const model = new ChatOpenAI({
        model: 'gpt-4o-mini',
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

        attempts.push({ provider: 'OpenAI (LangChain)', status: 'success', modelUsed: 'gpt-4o-mini' });
        return replyText;
      } else {
        throw new Error('Empty response returned from OpenAI via LangChain.');
      }
    } catch (err: any) {
      console.error("tryOpenAI LangChain Error details:", err);
      attempts.push({ provider: 'OpenAI (LangChain)', status: 'failed', error: err.message || 'Unknown network error' });
    }
  } else {
    attempts.push({ provider: 'OpenAI (LangChain)', status: 'skipped', error: 'API key is not configured' });
  }
  return null;
}

async function tryAnthropic(keys: any, prompt: string, image: string, attempts: any[], systemInstruction: string = SYSTEM_INSTRUCTION) {
  if (keys.anthropic && keys.anthropic.trim() !== '') {
    try {
      const model = new ChatAnthropic({
        model: 'claude-3-5-sonnet-20241022',
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

        attempts.push({ provider: 'Anthropic Claude (LangChain)', status: 'success', modelUsed: 'claude-3-5-sonnet' });
        return replyText;
      } else {
        throw new Error('Empty response returned from Anthropic Claude via LangChain.');
      }
    } catch (err: any) {
      console.error("tryAnthropic LangChain Error details:", err);
      attempts.push({ provider: 'Anthropic Claude (LangChain)', status: 'failed', error: err.message || 'Unknown network error' });
    }
  } else {
    attempts.push({ provider: 'Anthropic Claude (LangChain)', status: 'skipped', error: 'API key is not configured' });
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

  return `You are a highly specialised clinical and medical hospital AI assistant. 
Category / Current Tab Focus: [${category}]
Current Tab Role: ${domainFocus}

CRITICAL MANDATORY INSTRUCTIONS & SCOPE RESTRICTIONS:
1. You are accessed from the specific, specialized [${category}] tab. You MUST ONLY answer queries (whether typed or SPOKEN via voice audio) that are directly related to the current "${category}" tab's roles, operations, data management, listing, creating/adding new records, editing/updating records, or deleting/deactivating records.
2. You are STRICTLY FORBIDDEN from answering any other general medical questions, miscellaneous general knowledge, coding, weather, or ANY query that does not concern managing, editing, adding, or deleting data in this specific "${category}" tab.
3. If the user asks ANY other general, clinical, or unrelated question (even if it is medical, and even if they spoke it in a VOICE/AUDIO query) that is not about this specific "${category}" tab's operations and data:
   - You MUST politely refuse to answer.
   - You MUST instruct them that this assistant only performs "${category}" tab operations and they should go to the main "AI Assistant" tab to ask other questions.
   - Example replies (in Hindi/Urdu/English depending on the language they asked):
     * English: "This assistant is restricted strictly to "${category}" operations and data. For other general or clinical questions, please go to the main \"AI Assistant\" tab."
     * Hindi/Urdu/Roman Urdu (Hinglish): "Yeh assistant sirf "${category}" tab ke operations aur data se mutalik jawab de sakta hai. Kisi aur qism ke clinical ya general sawal ke liye, barah-e-maherbani main \"AI Assistant\" tab par jayen."
4. Respond in a very concise, helpful, and professional clinical manner, referencing data context when asked about current items. Keep it short.
5. Voice / Audio Query Processing Guidance:
   - If the user sent a VOICE/AUDIO query, first transcribe and comprehend what they said.
   - If their spoken query is related to this current "${category}" tab, answer their question directly.
   - If their spoken query belongs to a DIFFERENT tab (such as talking about "billing/paisa/invoice/amount" while in "staff" tab, or speaking about "staff/doctor/nurse/duty" while in "billing" tab, or speaking about "ward/bed/room occupancy" while in "inventory" tab):
     * You MUST identify which tab their spoken query corresponds to.
     * State clearly what they talked about in the voice snippet (e.g. transcribing/summarizing their spoken request in Roman Urdu/Hindi or English).
     * Provide a helpful, concise response to their question using your general capability as a hospital assistant, so they get their answer immediately.
     * Explicitly inform them that you are automatically redirecting them to that relevant tab now so they can view the correct context and data.
     * At the very end of your response, you MUST append EXACTLY this trigger tag: \`[NAVIGATE: <tab_name>-ai]\` (e.g., \`[NAVIGATE: billing-ai]\`, \`[NAVIGATE: staff-ai]\`, \`[NAVIGATE: appointments-ai]\`, \`[NAVIGATE: ipd-wards-ai]\`, \`[NAVIGATE: inventory-ai]\`, \`[NAVIGATE: doctors-ai]\`, \`[NAVIGATE: patients-ai]\`, \`[NAVIGATE: consultation-ai]\`).
     * Keep it highly helpful, concise, and in the language they spoke (Urdu, Hindi, Roman Urdu, or English).
`;
};

function detectAndParseAction(text: string, userQuery: string, currentTab: string): any {
  // 1. Try to find an explicit [ACTION: { ... }] JSON tag (case-insensitive, optional brackets)
  const actionMatch = text.match(/\[?ACTION:\s*({.*?})\s*\]?/is);
  if (actionMatch) {
    try {
      return JSON.parse(actionMatch[1]);
    } catch (e) {
      console.warn("Found ACTION tag but failed to parse JSON:", e);
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

function checkRoleCapability(userRole: string, activeTabName: string, queryText: string, toolType?: string, toolTab?: string): { allowed: boolean, reason?: string, UrduReason?: string } {
  const role = userRole.toLowerCase().trim();
  if (role === 'admin' || !role) {
    return { allowed: true };
  }
  
  // If the query is purely clinical / medical advice, we always allow it!
  const isGeneralMedicalAdvice = 
    queryText.toLowerCase().includes('pain') || queryText.toLowerCase().includes('dard') || 
    queryText.toLowerCase().includes('fever') || queryText.toLowerCase().includes('cough') || 
    queryText.toLowerCase().includes('headache') || queryText.toLowerCase().includes('heart') || 
    queryText.toLowerCase().includes('medicine') || queryText.toLowerCase().includes('drug') || 
    queryText.toLowerCase().includes('clinical') || queryText.toLowerCase().includes('report') || 
    queryText.toLowerCase().includes('rash') || queryText.toLowerCase().includes('treatment') || 
    queryText.toLowerCase().includes('asthma') || queryText.toLowerCase().includes('sugar') || 
    queryText.toLowerCase().includes('bp') || queryText.toLowerCase().includes('blood pressure') ||
    queryText.toLowerCase().includes('symptom') || queryText.toLowerCase().includes('prescription') ||
    queryText.toLowerCase().includes('allergy') || queryText.toLowerCase().includes('guidance') ||
    queryText.toLowerCase().includes('flu') || queryText.toLowerCase().includes('bukhar') ||
    queryText.toLowerCase().includes('pneumonia') || queryText.toLowerCase().includes('tb') ||
    queryText.toLowerCase().includes('infection');

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

  // If there is no operation detected and it's general medical advice, always allow!
  if (!opType && isGeneralMedicalAdvice) {
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
    const allowedTabs = ['appointments', 'consultation', 'billing', 'patients', 'blogs'];
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

function retrieveRelevantDocs(query: string, data: any): string {
  if (!data || typeof data !== 'object') return '';

  const matchedDocs: string[] = [];
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery || lowerQuery.length < 2) return '';

  // 1. Search patients
  if (Array.isArray(data.allPatients)) {
    const matchedPatients = data.allPatients.filter((p: any) => 
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

  // 2. Search appointments
  if (Array.isArray(data.allAppointments)) {
    const matchedAppointments = data.allAppointments.filter((a: any) =>
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

  // 3. Search Bills
  if (Array.isArray(data.allBills)) {
    const matchedBills = data.allBills.filter((b: any) =>
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

  // 4. Search Inventory
  if (Array.isArray(data.allInventory)) {
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

  // 5. Search Doctors
  if (Array.isArray(data.allDoctors)) {
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

  // 6. Search Staff
  if (Array.isArray(data.allStaff)) {
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

  // 7. Search Wards
  if (Array.isArray(data.allWards)) {
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

  // 8. Search Enquiries
  if (Array.isArray(data.allEnquiries)) {
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

async function processChatRequest(systemInstructionToUse: string, req: Request, res: Response) {
  try {
    const rawBody = req.body || {};
    const messages = Array.isArray(rawBody.messages) ? rawBody.messages : [];
    const context = rawBody.context && typeof rawBody.context === 'object' ? rawBody.context : {};
    const selectedModel = typeof rawBody.selectedModel === 'string' ? rawBody.selectedModel : 'auto';

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

    // Process and align messages safely
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    let lastMessageText = lastMessage && typeof lastMessage.content === 'string' ? lastMessage.content : '';
    const lastMessageImage = lastMessage && typeof lastMessage.image === 'string' ? lastMessage.image : '';
    const lastMessageAudio = lastMessage && typeof lastMessage.audio === 'string' ? lastMessage.audio : '';

  // TOOL DETECTION
  const toolMatch = lastMessageText.match(/\[Contextual Tool selected:\s*(.*?)\s*\(Operation:\s*(.*?)\)\]/i);
  const guideMatch = lastMessageText.match(/Tool Instruction Guide:\s*(.*?)(?:\n\n|$)/is);

  // ROLE-BASED CONSOLE TAB RESTRICTION SECURITY CHECKS
  const userRole = (context.userRole || '').toLowerCase().trim();
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

  if (isTabSpecific && !lastMessageAudio) {
    const query = lastMessageText.toLowerCase();
    
    // Check if the query is general and unrelated to this specific tab's core operations.
    // We allow basic greeting, or questions targeting operations such as add, edit, delete, roles, data list, or containing key words of the tab name.
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

    // Let's list general check verbs and also the specific category terms
    const hasCategoryKeywords = 
      query.includes(activeTabName) || 
      (activeTabName === 'doctors' && (query.includes('doctor') || query.includes('doc') || query.includes('roster') || query.includes('dr.'))) ||
      (activeTabName === 'staff' && (query.includes('staff') || query.includes('member') || query.includes('nurse') || query.includes('shazib') || query.includes('duty') || query.includes('roster'))) ||
      (activeTabName === 'appointments' && (query.includes('appoint') || query.includes('book') || query.includes('slot'))) ||
      (activeTabName === 'billing' && (query.includes('bill') || query.includes('invoice') || query.includes('collect') || query.includes('payment') || query.includes('amount') || query.includes('billon') || query.includes('paisa'))) ||
      (activeTabName === 'inventory' && (query.includes('invent') || query.includes('stock') || query.includes('medicine') || query.includes('drug') || query.includes('pharma'))) ||
      (activeTabName === 'patients' && (query.includes('patient') || query.includes('sick') || query.includes('admit') || query.includes('allergic'))) ||
      (activeTabName === 'consultation' && (query.includes('consult') || query.includes('prescribe') || query.includes('visit') || query.includes('symptom'))) ||
      (activeTabName === 'ipd-wards' && (query.includes('ward') || query.includes('bed') || query.includes('room') || query.includes('occupy')));

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
      query.includes('role') || 
      query.includes('naya') || 
      query.includes('nayi') || 
      query.includes('tab') || 
      query.includes('data') ||
      toolMatch !== null; // Selected tool is always valid for the tab operations

    if (!isBasicGreeting && !hasCategoryKeywords && !hasOperationKeywords) {
      // The query is unrelated to this tab! Return a polite rejection directing them to the main AI Assistant tab.
      const responseText = `This specialized assistant is strictly restricted to "${activeTabName}" operations (add, edit, delete, and list tasks). For other general, general clinical, or miscellaneous questions, please visit the main "AI Assistant" tab.
      
(Yeh assistant sirf "${activeTabName}" tab ke operations aur data se mutalik jawab de sakta hai. Kisi aur qism ke general ya clinical sawal ke liye, barah-e-maherbani main "AI Assistant" tab par jayen.)`;
      return res.json({
        reply: responseText,
        attempts: [{ provider: 'Specialized Tab Constraint Checks', status: 'success', modelUsed: 'Static-Filter-Rules' }]
      });
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
    const ragData = retrieveRelevantDocs(lastMessageText, context.data);
    if (ragData) {
      finalPrompt = `${ragData}\n\n${finalPrompt}`;
    }
  }

  // Build sequential priority list based on user dropdown selection
  let providerChain: string[] = [];

  if (selectedModel === 'gemini') {
    providerChain = ['gemini', 'openai', 'claude'];
  } else if (selectedModel === 'openai') {
    providerChain = ['openai', 'claude', 'gemini'];
  } else if (selectedModel === 'claude') {
    providerChain = ['claude', 'openai', 'gemini'];
  } else {
    // Default fallback chain (Auto) - Prioritize OpenAI first, then Claude, then Google Gemini fallback
    providerChain = ['openai', 'claude', 'gemini'];
  }

  // Iterate over provider sequence
  for (const provider of providerChain) {
    let reply: string | null = null;
    if (provider === 'gemini') {
      reply = await tryGemini(keys, finalPrompt, lastMessageImage, lastMessageAudio, attempts, systemInstructionToUse);
    } else if (provider === 'openai') {
      reply = await tryOpenAI(keys, finalPrompt, lastMessageImage, attempts, systemInstructionToUse);
    } else if (provider === 'claude') {
      reply = await tryAnthropic(keys, finalPrompt, lastMessageImage, attempts, systemInstructionToUse);
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
  let fallbackReply = `⚠️ Note: Selected AI model and fallbacks are currently unconfigured or unreachable.

I have analyzed your screen context and medical query locally:

**1. Data Screen Analysis (${context.activeTab || 'General'}):**
- You are logged in as **${context.userName || 'Hospital Admin'}** (${context.userRole || 'Admin'}).
- Based on the current view data, I can see you are looking at clinical metrics.

`;

  // Guardrail test offline
  const hasAttachment = !!lastMessageImage || !!lastMessageAudio || query.includes('[document attached:') || query.includes('document content:');
  const isMedicalQuery = 
    hasAttachment ||
    query.includes('pain') || query.includes('dard') || query.includes('fever') || query.includes('cough') || query.includes('headache') ||
    query.includes('doctor') || query.includes('patient') || query.includes('appointment') || query.includes('bill') || query.includes('heart') ||
    query.includes('medicine') || query.includes('drug') || query.includes('clinical') || query.includes('report') || query.includes('rash') ||
    query.includes('treatment') || query.includes('hospital') || query.includes('tab') || query.includes('asthma') || query.includes('sugar') ||
    query.includes('bp') || query.includes('blood pressure');

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
      fallbackReply = `صرف طبی سوالات کے جوابات دے سکتا ہوں۔`;
    } else if (hasHindiDev) {
      fallbackReply = `मैं केवल चिकित्सा संबंधी प्रश्नों के उत्तर दे सकता हूँ।`;
    } else if (hasSpanish) {
      fallbackReply = `Solo puedo responder a preguntas médicas.`;
    } else if (hasRomanUrdu) {
      fallbackReply = `Only medical questions ka answer da sakta hu`;
    } else {
      fallbackReply = `I can only answer medical questions.`;
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
  return processChatRequest(SYSTEM_INSTRUCTION, req, res);
});

// Category-Specific Independent API Routers for each section
router.post('/:category/chat', async (req: Request, res: Response) => {
  const { category } = req.params;
  const customInstruction = getCategoryInstruction(category);
  return processChatRequest(customInstruction, req, res);
});

export default router;
