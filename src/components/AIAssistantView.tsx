import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Bot, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Image as ImageIcon, 
  X,
  RefreshCw,
  ShieldAlert,
  Mic,
  ArrowUp,
  Upload,
  Volume2,
  StopCircle,
  FileText,
  Activity,
  UserCheck,
  Stethoscope,
  HeartPulse,
  Play,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Attempt {
  provider: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  modelUsed?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string; // base64 string
  audio?: string; // base64 string
  voiceRecorded?: boolean;
  audioUrl?: string;
  audioSize?: string;
  audioDuration?: number;
  attempts?: Attempt[];
  timestamp: Date;
  docName?: string;
  docType?: string;
  docSize?: string;
  docContent?: string;
}

interface AIAssistantViewProps {
  contextData: {
    activeTab: string;
    userRole: string;
    userName: string;
    data: any;
  };
  backendApiEndpoint?: string;
  restrictFileTypes?: boolean;
}

// Mock Clinical Images/Scans to let users test Vision capability easily inside the sandbox
const SAMPLE_CLINICAL_SCANS = [
  {
    id: 'chest_xray',
    name: '🩻 Chest X-Ray (Normal Roster)',
    url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 'derma_rash',
    name: '🔬 Skin Dermatology Rash',
    url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 'prescription',
    name: '📝 Handwritten Rx Prescription',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
  }
];

// Presets for Voice Recording transcribed requests 
const MOCK_TRANSCRIPTS = [
  "Check Dr. Priya Patel's schedule for tomorrow and tell me if she is treating any chest congestion patients.",
  "Write an analysis on the pending bills for Ward-A and check if any medicines in our pharmacy are low on stock.",
  "What is the recommended pharmacological treatment for a patient presenting with an acute asthma attack and allergic rhinitis?"
];

interface Chip {
  label: string;
  icon: string;
  prompt: string;
}

const getChipsForTab = (tab: string): Chip[] => {
  const normalized = tab ? tab.toLowerCase() : '';
  const customChips: Chip[] = [];

  if (normalized === 'dashboard') {
    customChips.push(
      { label: 'Dashboard Health Check', icon: '⚡', prompt: 'Provide a comprehensive health check-up assessment based on current hospital statistics in our dashboard context.' },
      { label: "Tomorrow's Appts Load", icon: '📅', prompt: "What is the schedule load of doctor Priya Patel's patient appointments for tomorrow? Identify any critical peak hours." },
      { label: 'Ward Occupancy Breakdown', icon: '👥', prompt: 'Check patient status distributions and show a breakdown of active ward occupants.' }
    );
  } else if (normalized === 'appointments') {
    customChips.push(
      { label: 'Overdue Appointments', icon: '📅', prompt: 'Summarize any pending appointments that have overdue status or require urgent rescheduled action.' },
      { label: 'Available Doctors Roster', icon: '👨‍⚕️', prompt: 'Analyze doctor roster statuses and check who is available for immediate patient consultation.' },
      { label: "Today's Clinic Peak Hours", icon: '🕒', prompt: 'Tell me which departments have the highest volume of patient appointments scheduled today.' }
    );
  } else if (normalized === 'patients') {
    customChips.push(
      { label: 'Active Patients Summary', icon: '🩺', prompt: 'Give me a breakdown of currently admitted active patients, summarizing their conditions and ages.' },
      { label: 'High Risk Patients', icon: '⚠️', prompt: 'Are there patient records presenting critical or severe statuses? Summarize their recent logs.' },
      { label: 'Aging Demographics Spec', icon: '📈', prompt: 'Analyze our patient age patterns to inspect specialized pediatric or geriatric trends.' }
    );
  } else if (normalized.includes('bill')) {
    customChips.push(
      { label: 'High Pending Bills', icon: '💰', prompt: 'Identify patient billing records with high outstanding or pending payments.' },
      { label: 'Collection Efficiency Report', icon: '📊', prompt: 'Provide a report comparing completed collected fees versus pending amounts.' },
      { label: 'Unpaid Invoices Breakdown', icon: '💳', prompt: 'Which departments or appointments have the largest unpaid billing logs?' }
    );
  } else if (normalized.includes('invent') || normalized.includes('pharmacy')) {
    customChips.push(
      { label: 'Low Stock Safeguard', icon: '🧱', prompt: 'Confirm which critical pharmacological items in the inventory have stock levels below their warning threshold limit.' },
      { label: 'Pharmacy Spends Analysis', icon: '💊', prompt: 'Report on our pharmacy inventory categories and identify our highest value assets.' },
      { label: 'Replenishment Schedule', icon: '📦', prompt: 'Based on active stock counts versus minimum thresholds, formulate a pharmacy replenishment priority order.' }
    );
  } else if (normalized === 'doctors') {
    customChips.push(
      { label: 'Doctor Specialty Loads', icon: '🩺', prompt: 'Give me a breakdown of doctors grouped by their specialty and active status.' },
      { label: 'On-Call Availability', icon: '⏰', prompt: 'Check if we have enough on-call specialized physicians available right now.' }
    );
  } else if (normalized.includes('depart')) {
    customChips.push(
      { label: 'Department Patient Loads', icon: '🏢', prompt: 'Summarize the department-wise load of appointments and bed placements.' },
      { label: 'Emergency Room Stats', icon: '🚨', prompt: 'Verify emergency department indicators and critical case allocations.' }
    );
  }

  // Always append the standard/global suggested clinical chips requested by user
  return [
    ...customChips,
    { label: 'Clinic Appointments', icon: '🗂️', prompt: 'Analyze pending hospital appointments in our dashboard context.' },
    { label: 'Allergy & Cough Guidance', icon: '💊', prompt: 'Outline general clinical drug guidance for a cough and skin allergies.' },
    { label: 'Billing Standing', icon: '📊', prompt: 'Review our total pending clinical bills versus collected amounts.' },
    { label: 'Pharmacy Inventory', icon: '🧱', prompt: 'Generate a summary list of medication inventory items with low-stock count.' }
  ];
};

const PlayAudioButton: React.FC<{ url: string }> = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;
    
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
    };
  }, [url]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.warn("Audio play error:", err));
      setIsPlaying(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-2 bg-teal-500 hover:bg-teal-400 text-white rounded-full transition-all focus:outline-none hover:scale-110 active:scale-90 flex items-center justify-center cursor-pointer shadow-xs"
      id="audio-play-trigger-btn"
    >
      {isPlaying ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
    </button>
  );
};

export default function AIAssistantView({ 
  contextData, 
  backendApiEndpoint = '/api/ai-assistant/chat', 
  restrictFileTypes = false 
}: AIAssistantViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello there! I am your **Clinical & Hospital Management AI Assistant**. 

I can assist you with:
- **Medical & Clinical Queries**: Diagnostic indicators, healthy guidelines, clinical procedures, or drug info.
- **Hospital Administration & Data**: Active appointment summaries, billing standings, department levels, or staff counts from your current screen.
- **Vision Recognition**: Upload an image of a clinical prescription, lab report, or diagnostic screen to analyze.

*Security Guideline:* To maintain focus, I will politely decline any off-topic queries that are not related to medical science or hospital context. Let me know how I can help you today!`,
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState<string | null>(null);
  const [docType, setDocType] = useState<string | null>(null);
  const [docSize, setDocSize] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<{
    blob: Blob;
    url: string;
    size: string;
    duration: number;
    base64?: string;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const isSendingRef = useRef(false);

  const [isSending, setIsSending] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('auto');

  // Multi-model live attempt status records (for developer insight and verification)
  const [latestAttempts, setLatestAttempts] = useState<Attempt[]>([
    { provider: 'Google Gemini', status: 'skipped', error: 'Not run yet' },
    { provider: 'OpenAI', status: 'skipped', error: 'Not run yet' },
    { provider: 'Anthropic Claude', status: 'skipped', error: 'Not run yet' },
    { provider: 'OpenRouter', status: 'skipped', error: 'Not run yet' },
    { provider: 'Groq', status: 'skipped', error: 'Not run yet' }
  ]);

  // Voice Recording Simulation states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingSecondsRef = useRef<number>(0);
  const shouldSubmitRef = useRef<boolean>(false);
  const selectedTranscriptRef = useRef<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isRecording]);

  // Voice recording timer simulation
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          const nextVal = prev + 1;
          recordingSecondsRef.current = nextVal;
          if (nextVal >= 15) {
            // Auto stop at 15s
            stopVoiceRecording(true);
            return 15;
          }
          return nextVal;
        });
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);



  // Quick Action trigger
  const executeQuickAction = (text: string) => {
    if (isSending) return;
    sendMessage(text);
  };

  // Compress and resize images on client-side to prevent large payload transmit errors (avoiding 413 bodies)
  const resizeAndCompressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 1024px for swift, legibly sharp vision analysis
          const MAX_DIM = 1024;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Dynamic JPEG quality compression down to 0.75 for ultra-fast light weight
            const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Process any selected or dropped file (image or document)
  const processSelectedFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      alert("File exceeds the maximum limit of 8MB.");
      return;
    }

    if (restrictFileTypes) {
      const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
      const isExcel = file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.xlsx') || file.type.includes('excel') || file.type.includes('spreadsheet') || file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (!isCsv && !isExcel) {
        alert("In this specialized assistant, only CSV and Excel spreadsheets are supported for analysis. PDFs and clinical images are restricted.");
        return;
      }
    }

    // Clear previous selection first
    removeAttachedFile();

    if (file.type.startsWith('image/')) {
      setImageFile(file);
      resizeAndCompressImage(file).then((compressedBase64) => {
        setImagePreview(compressedBase64);
      }).catch((err) => {
        console.error("Compression failed:", err);
        // Fallback to standard reader
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    } else {
      setDocFile(file);
      setDocName(file.name);
      
      const sizeInKb = (file.size / 1024).toFixed(1);
      const readableSize = parseFloat(sizeInKb) > 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
        : `${sizeInKb} KB`;
      setDocSize(readableSize);

      const extension = file.name.split('.').pop()?.toUpperCase() || 'DOC';
      setDocType(extension);

      // Read text contents for raw text, CSV, JSON, spreadsheet representation or XML files
      const lowerName = file.name.toLowerCase();
      if (
        file.type.includes('text') || 
        file.type.includes('csv') || 
        lowerName.endsWith('.csv') || 
        lowerName.endsWith('.txt') || 
        lowerName.endsWith('.json') || 
        lowerName.endsWith('.xml') || 
        lowerName.endsWith('.tsv')
      ) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setDocContent(event.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        // For binary files (like PDF or Excel sheets), read as binary/base64 or provide a brief text marker
        setDocContent(`[Raw binary file attachment of type ${file.type || 'unknown'}]`);
      }
    }
  };

  // Remove current attachment (photo, document, or audio states)
  const removeAttachedFile = () => {
    setImageFile(null);
    setImagePreview(null);
    setDocFile(null);
    setDocName(null);
    setDocType(null);
    setDocSize(null);
    setDocContent(null);
    setRecordedAudio(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Keep removeImage matching removeAttachedFile for compatibility
  const removeImage = removeAttachedFile;

  // Handle standard file picker selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Drag and drop image file handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Clear transient stream memory
  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Chat history cleared. How can I assist you with clinical, medical, or administrative inquiries?`,
        timestamp: new Date()
      }
    ]);
  };

  // Helper to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Start Voice recording with MediaRecorder
  const startVoiceRecording = async () => {
    if (isSending) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const sizeInKb = (audioBlob.size / 1024).toFixed(1);

        let base64String = '';
        try {
          base64String = await blobToBase64(audioBlob);
        } catch (base64Err) {
          console.error("Base64 audio load failed:", base64Err);
        }

        const audioObj = {
          blob: audioBlob,
          url: audioUrl,
          size: `${sizeInKb} KB`,
          duration: recordingSecondsRef.current || 1,
          base64: base64String
        };

        setRecordedAudio(audioObj);

        if (shouldSubmitRef.current) {
          // Send immediately with only the typed text (if any) or blank (if only voice)
          const textToSend = selectedTranscriptRef.current || input || "";
          sendMessage(textToSend, audioObj);
          shouldSubmitRef.current = false;
          selectedTranscriptRef.current = '';
        }
      };

      recordingSecondsRef.current = 0;
      setIsRecording(true);
      mediaRecorder.start();
    } catch (err) {
      console.error("Microphone hardware error:", err);
      alert("Microphone hardware is not available or permission was denied. Please connect a microphone and grant permission in browser.");
    }
  };

  // Stop recording and process
  const stopVoiceRecording = (submit: boolean) => {
    setIsRecording(false);
    shouldSubmitRef.current = submit;

    // Do NOT generate any arbitrary simulated text transcripts or autofill the chatbox input.
    // If there is existing typed input, we preserve it, otherwise it stays empty.
    selectedTranscriptRef.current = input.trim();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
  };



  // Multi-model delivery action
  const sendMessage = async (overrideText?: string, overrideAudio?: {
    blob: Blob;
    url: string;
    size: string;
    duration: number;
    base64?: string;
  }) => {
    const textToSend = overrideText !== undefined ? overrideText : input;
    const audioToUse = overrideAudio !== undefined ? overrideAudio : recordedAudio;
    if (!textToSend.trim() && !imagePreview && !docName && !audioToUse) return;

    const userMsgId = 'user-' + Date.now();
    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      image: imagePreview || undefined,
      audio: audioToUse?.base64 || undefined,
      docName: docName || undefined,
      docType: docType || undefined,
      docSize: docSize || undefined,
      docContent: docContent || undefined,
      voiceRecorded: !!audioToUse,
      audioUrl: audioToUse?.url || undefined,
      audioSize: audioToUse?.size || undefined,
      audioDuration: audioToUse?.duration || undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    removeAttachedFile();
    setIsSending(true);

    try {
      const chatPayload = {
        messages: messages.concat(newUserMessage).map(m => ({
          role: m.role,
          content: m.docName 
            ? `[Document Attached: ${m.docName} (${m.docType}, ${m.docSize})]\n${m.docContent ? `Document Content:\n${m.docContent}\n\n` : ''}${m.content}`
            : m.content,
          image: m.image,
          audio: m.audio
        })),
        context: contextData,
        selectedModel
      };

      const response = await fetch(backendApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chatPayload)
      });

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}`);
      }

      const resData = await response.json();
      
      if (resData.attempts) {
        setLatestAttempts(resData.attempts);
      }

      const assistantMsg: Message = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: resData.reply || "Unable to formulate response from downstream services.",
        attempts: resData.attempts,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: `⚠️ System error: (${err.message}). No fallback endpoints could respond. 

Please request support or review active API parameter credentials.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col min-h-0 h-full w-full text-slate-800 overflow-hidden pb-1" 
      id="ai-assistant-container-parent"
    >
      {/* HEADER CONTROL AND CHAT */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden focus-within:border-teal-500/35 transition-all min-h-0" 
        id="chat-subpanel-left"
      >
        {/* Chat Title bar */}
        <div className="px-4 py-3 sm:px-6 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-4" id="chat-header-bar">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500 text-white rounded-2xl shadow-md shadow-teal-500/10">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">Clinical Hospital AI Assistant</h2>
              <p className="text-xs text-slate-500 font-medium">Transient Secure Stream • Medical Validation Guardrails Active</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3" id="header-settings-actions">
            <button 
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-red-600 hover:bg-slate-105 rounded-xl transition-all cursor-pointer bg-white border border-slate-200 shadow-sm"
              title="Clear current stream history"
              id="clear-chat-history-btn"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Messaging Stream Area */}
        <div 
          className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-0 transition-all relative scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 scrollbar-track-slate-50 border-b border-slate-100 ${dragActive ? 'bg-teal-50/20 border-2 border-dashed border-teal-400' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          id="messaging-stream-viewport"
          style={{ scrollBehavior: 'smooth' }}
        >
          {dragActive && (
            <div className="absolute inset-0 bg-teal-50/60 flex flex-col items-center justify-center pointer-events-none z-10">
              <p className="text-sm font-semibold text-teal-700 animate-pulse">Release to upload your diagnostic file scan</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 25, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: 'spring', stiffness: 130, damping: 15 }}
                className={`flex gap-4 max-w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                id={`message-row-${msg.id}`}
              >
                {/* Assistant Avatar */}
                {msg.role === 'assistant' && (
                  <div className="h-9 w-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-600/10 self-end">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                {/* Bubble */}
                <div className={`flex flex-col space-y-2 max-w-[85%] sm:max-w-[75%] rounded-3xl p-5 ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-br-none shadow-lg shadow-slate-950/5' 
                    : 'bg-slate-50 text-slate-800 rounded-bl-none border border-slate-100'
                }`}>
                  {/* Image attachment inside bubble */}
                  {msg.image && (
                    <div className="relative mb-3 rounded-2xl overflow-hidden border border-slate-200/50 bg-black/5 max-h-64 w-fit">
                      <img 
                        src={msg.image} 
                        alt="Uploaded file scan" 
                        className="object-contain max-h-64 rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Document attachment inside bubble */}
                  {msg.docName && (
                    <div className={`flex items-center gap-3 mb-3 p-3 rounded-2xl border ${
                      msg.role === 'user' 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-teal-50/50 border-teal-100/80 text-slate-800'
                    } max-w-sm`}>
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        msg.role === 'user' ? 'bg-white/10 text-white' : 'bg-teal-500 text-white'
                      }`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${msg.role === 'user' ? 'text-white' : 'text-slate-800'}`}>
                          {msg.docName}
                        </p>
                        <p className={`text-[10px] font-mono ${msg.role === 'user' ? 'text-slate-300' : 'text-slate-500'}`}>
                          {msg.docType} • {msg.docSize}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Audio attachment inside bubble */}
                  {msg.voiceRecorded && msg.audioUrl && (
                    <div className={`flex items-center gap-3 mb-3 p-3 rounded-2xl border ${
                      msg.role === 'user' 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-teal-50/50 border-teal-100/80 text-slate-800'
                    } max-w-sm`}>
                      <div className="shrink-0 flex items-center justify-center">
                        <PlayAudioButton url={msg.audioUrl} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${msg.role === 'user' ? 'text-white' : 'text-slate-800'}`}>
                          Voice Snippet
                        </p>
                        <p className={`text-[10px] font-mono ${msg.role === 'user' ? 'text-slate-300' : 'text-slate-500'}`}>
                          {msg.audioSize || 'Unknown size'} • 00:{msg.audioDuration ? (msg.audioDuration < 10 ? '0' + msg.audioDuration : msg.audioDuration) : '00'}s
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Message content */}
                  {msg.content && msg.content.trim() !== '' && (
                    <div className="text-[13.5px] whitespace-pre-wrap leading-relaxed space-y-2.5 mt-2">
                      {msg.content.split('\n\n').map((paragraph, idx) => {
                        if (!paragraph.trim()) return null;
                        if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('* ')) {
                          const items = paragraph.split('\n');
                          return (
                            <ul key={idx} className="list-disc pl-5 space-y-1.5 my-2">
                              {items.map((item, itemIdx) => {
                                const cleanedItem = item.replace(/^[-*]\s+/, '');
                                return <li key={itemIdx}>{parseBoldText(cleanedItem)}</li>;
                              })}
                            </ul>
                          );
                        }
                        return <p key={idx}>{parseBoldText(paragraph)}</p>;
                      })}
                    </div>
                  )}

                  <span className={`text-[10px] block font-mono tracking-wider ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>


                </div>

                {/* User Avatar */}
                {msg.role === 'user' && (
                  <div className="h-9 w-9 rounded-2xl bg-teal-50 text-teal-600 border border-teal-150 flex items-center justify-center shrink-0 self-end">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}

            {isSending && (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 130, damping: 15 }}
                className="flex gap-4 justify-start"
                id="message-loader-bubble"
              >
                <div className="h-9 w-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-slate-50 text-slate-800 rounded-3xl rounded-bl-none border border-slate-100 p-5 max-w-[200px] flex items-center gap-2">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Formulating...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* LIVE AUDIO RECORDING MOCK SCREEN INDICATOR OVERLAY */}
        <AnimatePresence>
          {isRecording && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-teal-50/80 border-t border-teal-100 px-6 py-4 flex items-center justify-between"
              id="voice-mic-active-bar"
            >
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <span className="absolute h-10 w-10 rounded-full bg-red-400 animate-ping opacity-75" />
                  <div className="relative h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <Mic className="h-4 w-4 animate-pulse" />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-teal-850 uppercase tracking-wider">Clinical Audio Recording In Action...</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-500 font-mono">00:{recordingSeconds < 10 ? '0' + recordingSeconds : recordingSeconds} / 00:15s</span>
                    <span className="text-[10px] text-teal-600 font-medium animate-pulse">• Waveform active</span>
                  </div>
                </div>

                {/* Animated Voice/Audio level visualization */}
                <div className="hidden sm:flex items-center gap-0.5 ml-6 h-4">
                  <span className="w-0.5 h-2.5 bg-teal-600 rounded animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-0.5 h-4 bg-teal-600 rounded animate-bounce" style={{ animationDelay: '100ms' }} />
                  <span className="w-0.5 h-1.5 bg-teal-600 rounded animate-bounce" style={{ animationDelay: '200ms' }} />
                  <span className="w-0.5 h-3 bg-teal-600 rounded animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="w-0.5 h-4 bg-teal-600 rounded animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-0.5 h-2 bg-teal-600 rounded animate-bounce" style={{ animationDelay: '250ms' }} />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => stopVoiceRecording(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded-xl transition-all cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => stopVoiceRecording(true)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-xl transition-all cursor-pointer font-medium flex items-center gap-1"
                >
                  <StopCircle className="h-3.5 w-3.5" />
                  Stop & Process Speech
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Context and Guardrail indicator on bottom of chat */}
        <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2" id="chat-context-microinfo">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-teal-600" />
            <span>Hospital Screen: <strong>{contextData.activeTab.toUpperCase()}</strong> context loaded with <strong>real database summary objects</strong>.</span>
          </div>
          <span className="font-mono text-[10px] bg-teal-100/60 text-teal-800 px-2 py-0.5 rounded-full font-semibold">Validation Guardrail Level: HIGH</span>
        </div>

        {/* CHAT INPUT FORM (STYLING DIRECTLY INSPIRED BY THE UPLOADED SCREENSHOT) */}
        <div className="p-3 sm:p-5 border-t border-slate-100 bg-white shadow-inner flex flex-col gap-2.5 shrink-0 min-h-0" id="chat-input-controls-parent">
          
          {/* Quick Tab-Sensitive & Suggested Chips */}
          <div className="mb-1 sm:mb-2" id="quick-chips-wrapper">
            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider px-0.5 select-none">
              <Sparkles className="h-3 w-3 text-teal-600 animate-pulse" />
              <span>
                {input.trim() ? "Active Search Matches & Intelligent Options:" : `Suggested for ${contextData.activeTab.toUpperCase()}:`}
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 touch-pan-x scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent" id="quick-chips-scroll-grid">
              {(() => {
                const defaultChips = getChipsForTab(contextData.activeTab);
                let displayChips = defaultChips;
                if (input.trim()) {
                  const cleanSearch = input.toLowerCase().trim();
                  const filtered = defaultChips.filter(chip =>
                    chip.label.toLowerCase().includes(cleanSearch) || 
                    chip.prompt.toLowerCase().includes(cleanSearch)
                  );
                  if (filtered.length > 0) {
                    displayChips = filtered;
                  } else {
                    const truncateStr = (str: string, len: number) => str.length > len ? str.substring(0, len) + "..." : str;
                    displayChips = [
                      { 
                        label: `Ask clinical model: "${truncateStr(input, 20)}"`, 
                        icon: '✨', 
                        prompt: input 
                      },
                      { 
                        label: `Check "${truncateStr(input, 15)}" pharmacy/logs`, 
                        icon: '💊', 
                        prompt: `Find hospital resources, medication records, or catalog items matching: ${input}` 
                      },
                      { 
                        label: `Clinical procedure for "${truncateStr(input, 15)}"`, 
                        icon: '🩺', 
                        prompt: `Formulate a clinical treatment workflow and risk factors assessment for: ${input}` 
                      }
                    ];
                  }
                }
                return displayChips.map((chip, index) => (
                  <button
                    key={index}
                    onClick={() => executeQuickAction(chip.prompt)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 border border-slate-200 rounded-full text-[11px] text-slate-700 font-medium whitespace-nowrap cursor-pointer transition-all active:scale-95 shadow-xs shrink-0 select-none"
                    title={chip.prompt}
                    id={`quick-chip-item-${index}`}
                  >
                    <span className="text-xs shrink-0">{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ));
              })()}
            </div>
          </div>

          <AnimatePresence>
            {imagePreview && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative inline-flex items-center gap-2.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs max-w-fit" 
                id="attached-preview-wrapper"
              >
                <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img src={imagePreview} alt="Attached Miniature" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col pr-5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-700">Diagnostic Scan Attached</span>
                  <span className="text-[8px] sm:text-[9px] text-teal-600 font-mono tracking-wider uppercase animate-pulse">Ready for vision analysis</span>
                </div>
                <button 
                  onClick={removeAttachedFile}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full border border-slate-200 cursor-pointer shadow-xs transition-all hover:scale-110 active:scale-90"
                  title="Remove Attached Image"
                  id="remove-attached-image-btn"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </motion.div>
            )}

            {docName && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative inline-flex items-center gap-2.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs max-w-fit" 
                id="attached-doc-preview-wrapper"
              >
                <div className="relative h-11 w-11 rounded-lg bg-teal-500 text-white flex items-center justify-center border border-teal-600 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col pr-5 max-w-[150px] sm:max-w-[240px]">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 truncate">{docName}</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono">{docType} • {docSize}</span>
                  <span className="text-[8px] sm:text-[9px] text-teal-600 font-mono tracking-wider uppercase animate-pulse font-semibold">Ready for context ingestion</span>
                </div>
                <button 
                  onClick={removeAttachedFile}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full border border-slate-200 cursor-pointer shadow-xs transition-all hover:scale-110 active:scale-90"
                  title="Remove Attached Document"
                  id="remove-attached-doc-btn"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </motion.div>
            )}

            {recordedAudio && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative inline-flex items-center gap-2.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs max-w-fit" 
                id="attached-audio-preview"
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <PlayAudioButton url={recordedAudio.url} />
                </div>
                <div className="flex flex-col pr-5 max-w-[150px] sm:max-w-[240px]">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-700">Audio Recording Snippet</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono">{recordedAudio.size} • 00:{recordedAudio.duration < 10 ? '0' + recordedAudio.duration : recordedAudio.duration}s</span>
                  <span className="text-[8px] sm:text-[9px] text-teal-600 font-mono tracking-wider uppercase animate-pulse font-semibold">Ready for voice transmission</span>
                </div>
                <button 
                  onClick={removeAttachedFile}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full border border-slate-200 cursor-pointer shadow-xs transition-all hover:scale-110 active:scale-90"
                  title="Remove Attached Audio"
                  id="remove-attached-audio-btn"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Screenshot-Style Custom Input Bar Box Wrapper */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="relative flex items-center border border-slate-220 rounded-[24px] bg-slate-50/40 p-1 focus-within:ring-2 focus-within:ring-teal-500/10 focus-within:border-teal-500 transition-all gap-1.5" 
            id="screenshot-input-box-wrapper"
          >
            {/* Input prompt area */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask anything..."
              rows={1}
              className="flex-1 min-w-0 bg-transparent py-2 px-2.5 sm:py-3 sm:px-4 text-[13px] sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none min-h-[38px] max-h-[100px] scrollbar-none"
              id="prompt-textarea-input"
            />

            {/* Icons Actions Row aligned horizontally (matching screenshot group) */}
            <div className="flex items-center gap-1 sm:gap-1.5 pr-1 shrink-0" id="inner-action-strip">
              
              {/* MICROPHONE VOICE BUTTON */}
              <button
                type="button"
                onClick={startVoiceRecording}
                disabled={isRecording}
                className={`p-2 sm:p-2.5 rounded-full hover:scale-105 active:scale-95 transition-all text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs cursor-pointer ${
                  isRecording ? 'opacity-50 pointer-events-none animate-pulse' : ''
                }`}
                title="Voice Recording"
                id="mic-action-btn"
              >
                <Mic className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
              </button>

              {/* DIRECT FILE UPLOAD BUTTON */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 sm:p-2.5 rounded-full hover:scale-105 active:scale-95 transition-all text-slate-600 hover:text-teal-600 bg-white border border-slate-200 hover:border-teal-200 hover:bg-teal-50/20 shadow-2xs cursor-pointer"
                title="Upload Image/Document"
                id="direct-file-upload-btn"
              >
                <Upload className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
              </button>

              {/* Hidden classic file input for image analysis and documents (Excel, CSV, doc, pdf, txt, etc.) */}
              <input 
                type="file" 
                accept={restrictFileTypes ? ".csv,.xls,.xlsx" : "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json,.xml"} 
                onChange={handleImageChange} 
                ref={fileInputRef} 
                className="hidden" 
                id="hidden-screenshot-file-input"
              />

              {/* ARROW UP SEND ACTION BUTTON */}
              <button
                type="submit"
                disabled={isSending || (!input.trim() && !imagePreview && !docName && !recordedAudio)}
                className="p-2 sm:p-2.5 bg-slate-900 hover:bg-teal-600 hover:shadow-lg hover:shadow-teal-600/10 text-white rounded-full transition-all shrink-0 cursor-pointer disabled:opacity-30 disabled:pointer-events-none hover:scale-105 active:scale-95 animate-fade-in"
                id="arrow-send-message-btn"
              >
                <ArrowUp className="h-3.5 sm:h-4 w-3.5 sm:w-4 stroke-[2.5]" />
              </button>

            </div>
          </form>
        </div>
      </motion.div>




    </motion.div>
  );
}

// Simple regex parser for inline bold text e.g. **text** -> matching React elements safely
function parseBoldText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-950">{p.slice(2, -2)}</strong>;
        }
        return p;
      })}
    </>
  );
}
