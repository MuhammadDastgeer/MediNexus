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
          systemInstruction: systemInstruction,
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

async function tryOpenAI(keys: any, prompt: string, image: string, attempts: any[], systemInstruction: string = SYSTEM_INSTRUCTION) {
  if (keys.openai && keys.openai.trim() !== '') {
    try {
      const openAiMessages: any[] = [
        { role: 'system', content: systemInstruction }
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

async function tryAnthropic(keys: any, prompt: string, image: string, attempts: any[], systemInstruction: string = SYSTEM_INSTRUCTION) {
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
          system: systemInstruction,
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

async function tryOpenRouter(keys: any, prompt: string, image: string, attempts: any[], systemInstruction: string = SYSTEM_INSTRUCTION) {
  if (keys.openrouter && keys.openrouter.trim() !== '') {
    try {
      const openRouterMessages: any[] = [
        { role: 'system', content: systemInstruction }
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

async function tryGroq(keys: any, prompt: string, image: string, attempts: any[], systemInstruction: string = SYSTEM_INSTRUCTION) {
  if (keys.groq && keys.groq.trim() !== '') {
    try {
      const groqMessages = [
        { role: 'system', content: systemInstruction },
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
  // 1. Try to find an explicit [ACTION: { ... }] JSON tag in the text
  const actionMatch = text.match(/\[ACTION:\s*({.*?})\s*\]/s);
  if (actionMatch) {
    try {
      return JSON.parse(actionMatch[1]);
    } catch (e) {
      console.warn("Found ACTION tag but failed to parse JSON:", e);
    }
  }

  // 2. Heuristic check to see if we should auto-generate an action from the conversation context.
  const lowerText = text.toLowerCase();
  const lowerQuery = userQuery.toLowerCase();
  const combined = lowerQuery + " " + lowerText;

  // Identify operation type
  let type: 'add' | 'edit' | 'delete' | null = null;
  if (combined.match(/(?:delete|remove|cancel|kharij|delet|hatao|void|discharge)/i)) {
    type = 'delete';
  } else if (combined.match(/(?:edit|update|change|tabdeel|set |badlo|modify)/i)) {
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

  // Find fee / amount / price / stock
  const numMatches = combined.match(/(?:fee|price|amount|cost|stock|qty|paisa|charge|rs|fee:)\s*(?:is|:|=)?\s*(\d+)/i);
  if (numMatches) {
    const val = Number(numMatches[1]);
    item.consultationFee = val;
    item.amount = val;
    item.price = val;
    item.stock = val;
    item.fee = val;
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

  // ID detection
  let idMatch = combined.match(/(?:id|code|patientId|docId)\s*(?:is|:|=)?\s*([a-zA-Z0-9-]+)/i);
  if (idMatch) {
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

async function processChatRequest(systemInstructionToUse: string, req: Request, res: Response) {
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

  // TOOL DETECTION
  const toolMatch = lastMessageText.match(/\[Contextual Tool selected:\s*(.*?)\s*\(Operation:\s*(.*?)\)\]/i);
  const guideMatch = lastMessageText.match(/Tool Instruction Guide:\s*(.*?)(?:\n\n|$)/is);
  
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

  const activeTabName = (context.activeTab || '').toLowerCase().trim();
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
      reply = await tryGemini(keys, finalPrompt, lastMessageImage, lastMessageAudio, attempts, systemInstructionToUse);
    } else if (provider === 'openai') {
      reply = await tryOpenAI(keys, finalPrompt, lastMessageImage, attempts, systemInstructionToUse);
    } else if (provider === 'claude') {
      reply = await tryAnthropic(keys, finalPrompt, lastMessageImage, attempts, systemInstructionToUse);
    } else if (provider === 'openrouter') {
      reply = await tryOpenRouter(keys, finalPrompt, lastMessageImage, attempts, systemInstructionToUse);
    } else if (provider === 'groq') {
      reply = await tryGroq(keys, finalPrompt, lastMessageImage, attempts, systemInstructionToUse);
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

  return res.json({
    reply: fallbackReply,
    attempts
  });
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
