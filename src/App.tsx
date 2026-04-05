/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect, useRef } from "react";
import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  Send, 
  Target,
  PlusCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
  LogOut,
  Loader2,
  Mic,
  MicOff,
  CreditCard,
  Zap,
  Bell,
  Check,
  ShieldCheck,
  X,
  Volume2,
  VolumeX
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import LandingPage from "./components/LandingPage";

// --- Types ---
interface PitchData {
  startupName: string;
  problem: string;
  targetCustomer: string;
  traction: string;
  team: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  rewrite?: { 
    original: string; 
    improved: string;
    feedback: {
      weak: string;
      missing: string;
      good: string;
    }
  };
}

interface LiveScores {
  clarity: number;
  market: number;
  traction: number;
  confidence: number;
}

interface ReportData {
  verdict: string;
  risk: 'Low' | 'Medium' | 'High';
  initialScore: number;
  finalScore: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  missingSignals: string[];
  improvements: string[];
  vcExpectations: string[];
  rewrites: { original: string; improved: string }[];
}

interface VCPersona {
  id: string;
  name: string;
  description: string;
  traits: string;
}

const VC_PERSONAS: VCPersona[] = [
  {
    id: 'aggressive',
    name: 'Aggressive VC',
    description: 'Pushy, challenges everything, and expects quick, sharp answers.',
    traits: 'You are an aggressive, high-pressure investor. You interrupt, challenge every assumption, and push for hard numbers. You have no patience for fluff.'
  },
  {
    id: 'friendly',
    name: 'Friendly VC',
    description: 'Supportive and encouraging, but asks deep, probing questions.',
    traits: 'You are a supportive, founder-friendly investor. You ask probing questions in a gentle way, but you still expect deep insight and clarity.'
  },
  {
    id: 'analytical',
    name: 'Analytical VC',
    description: 'Numbers-focused, data-driven, and obsessed with unit economics.',
    traits: 'You are a data-driven, analytical investor. You care about CAC, LTV, churn, and market sizing. You want to see the math behind the vision.'
  }
];

// --- Gemini Setup ---
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const SYSTEM_PROMPT = `You are an AI assistant that helps users generate startup pitch decks from GitHub repositories. Always respond clearly and helpfully. Never return empty responses.

You are also a venture capital analyst evaluating a startup.
You must:
- Ask sharp, probing questions
- Challenge unclear answers
- Push for numbers, not vague statements
- Think like you are deciding whether to invest

Tone:
Direct, analytical, slightly critical but helpful.

Focus on:
- Clarity (0-10): How clear and concise is the answer?
- Market Understanding (0-10): Does the founder understand their market and customers?
- Traction (0-10): Are there real numbers, users, or revenue?
- Confidence (0-10): Does the founder sound sure of their vision?

SCORING LOGIC:
- If answer is vague → reduce clarity
- If no numbers → reduce traction score
- If specific and data-driven → increase score

Do not be generic. Act like a real VC in a pitch meeting.

OUTPUT FORMAT:
Every response MUST be a valid JSON object.
For regular chat turns:
{
  "type": "chat",
  "content": "Your sharp question or follow-up here.",
  "scores": { "clarity": number, "market": number, "traction": number, "confidence": number },
  "rewrite": { 
    "original": "user's last answer", 
    "improved": "how it should have been said with numbers and clarity",
    "feedback": {
      "weak": "1 line on what was weak",
      "missing": "1 line on what was missing",
      "good": "1 line on what was good"
    }
  }
}

For the final evaluation (after 5-6 turns):
{
  "type": "report",
  "content": "Final wrap-up message.",
  "report": {
    "verdict": "1-2 line sharp VC verdict",
    "risk": "Low" | "Medium" | "High",
    "initialScore": number,
    "finalScore": number,
    "grade": "A" | "B" | "C" | "D" | "F",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "missingSignals": ["..."],
    "improvements": ["..."],
    "vcExpectations": ["... based on stage (Pre-seed/Seed) ..."],
    "rewrites": [{"original": "...", "improved": "..."}]
  }
}
`;

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? "bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/20" 
        : "text-gray-500 hover:bg-gray-100 hover:text-[#6C63FF]"
    }`}
  >
    <Icon size={20} />
    <span className="font-semibold text-sm">{label}</span>
  </button>
);

const MobileNavItem = ({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors ${
      active ? "text-[#6C63FF]" : "text-gray-400"
    }`}
  >
    <Icon size={24} />
    <div className={`w-1 h-1 rounded-full mt-1 ${active ? "bg-[#6C63FF]" : "bg-transparent"}`} />
  </button>
);

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

const InputField = ({ label, value, onChange, placeholder, type = "text", multiline = false }: any) => (
  <div className="space-y-1.5">
    <label className="text-sm font-bold text-[#0F172A] ml-1">{label}</label>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/10 outline-none transition-all resize-none text-sm"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/10 outline-none transition-all text-sm"
      />
    )}
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'input' | 'simulation' | 'report' | 'pricing'>('landing');
  const [selectedPersona, setSelectedPersona] = useState<VCPersona>(VC_PERSONAS[0]);
  const [isSimulationStarted, setIsSimulationStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem('pitchReady_voiceEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [liveScores, setLiveScores] = useState<LiveScores>(() => {
    const saved = localStorage.getItem('pitchReady_liveScores');
    return saved ? JSON.parse(saved) : { clarity: 0, market: 0, traction: 0, confidence: 0 };
  });
  const [initialScore, setInitialScore] = useState<number>(() => {
    const saved = localStorage.getItem('pitchReady_initialScore');
    return saved ? Number(saved) : 0;
  });

  const [pitchData, setPitchData] = useState<PitchData>(() => {
    const saved = localStorage.getItem('pitchReady_data');
    return saved ? JSON.parse(saved) : {
      startupName: '',
      problem: '',
      targetCustomer: '',
      traction: '',
      team: ''
    };
  });

  const [reportData, setReportData] = useState<ReportData | null>(() => {
    const saved = localStorage.getItem('pitchReady_report');
    return saved ? JSON.parse(saved) : null;
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('pitchSession');
    return saved ? JSON.parse(saved) : [];
  });

  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('pitchReady_data', JSON.stringify(pitchData));
  }, [pitchData]);

  useEffect(() => {
    localStorage.setItem('pitchReady_report', JSON.stringify(reportData));
  }, [reportData]);

  useEffect(() => {
    localStorage.setItem('pitchSession', JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('pitchReady_liveScores', JSON.stringify(liveScores));
  }, [liveScores]);

  useEffect(() => {
    localStorage.setItem('pitchReady_initialScore', initialScore.toString());
  }, [initialScore]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    localStorage.setItem('pitchReady_voiceEnabled', JSON.stringify(isVoiceEnabled));
  }, [isVoiceEnabled]);

  const speak = (text: string, personaId: string) => {
    if (!isVoiceEnabled || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice properties based on persona
    if (personaId === 'aggressive') {
      utterance.rate = 1.1;
      utterance.pitch = 0.85;
    } else if (personaId === 'analytical') {
      utterance.rate = 0.9;
      utterance.pitch = 0.95;
    } else {
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    }

    // Try to find a good English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                         voices.find(v => v.lang.startsWith('en')) ||
                         voices[0];
    
    if (englishVoice) utterance.voice = englishVoice;

    window.speechSynthesis.speak(utterance);
  };

  const loadDemoStartup = () => {
    setPitchData({
      startupName: 'EcoStream',
      problem: 'Water waste in industrial cooling systems costs companies $4B annually.',
      targetCustomer: 'Manufacturing plants in SE Asia and North America.',
      traction: '$12k MRR from 3 pilot customers. 40% MoM growth.',
      team: 'CEO: Ex-Tesla Engineer. CTO: PhD in Hydrology from MIT.'
    });
    setCurrentStep(4);
  };

  const startAnalysis = async () => {
    setIsTyping(true);
    setActiveTab('simulation');
    setIsSimulationStarted(true);
    
    const callInitialAI = async (retry = true): Promise<string> => {
      try {
        const context = `Startup Name: ${pitchData.startupName}\nProblem: ${pitchData.problem}\nTarget Customer: ${pitchData.targetCustomer}\nTraction: ${pitchData.traction}\nTeam: ${pitchData.team}`;
        const personaPrompt = `${SYSTEM_PROMPT}\n\nAct like a venture capitalist. ${selectedPersona.traits}. Ask tough, specific startup questions. Challenge vague answers. Focus on: Clarity, Market Understanding, Traction, Confidence.`;
        
        const response = await genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: 'user', parts: [{ text: `Based on this startup data, give me an initial baseline score (0-100) and your first sharp question as this VC persona. Output as JSON: { "initialScore": number, "question": "string", "scores": { "clarity": number, "market": number, "traction": number, "confidence": number } }\n\nContext: ${context}` }] }],
          config: { 
            systemInstruction: personaPrompt,
            responseMimeType: "application/json" 
          }
        });

        const text = response.text;
        console.log("Initial Analysis Response:", text);

        if (!text || text.trim() === "" || text === "{}") {
          if (retry) {
            console.warn("Empty response received for initial analysis, retrying once...");
            return await callInitialAI(false);
          }
          throw new Error("Empty response from AI for initial analysis after retry");
        }
        return text;
      } catch (error) {
        console.error("Initial Analysis API Error:", error);
        throw error;
      }
    };

    try {
      const aiText = await callInitialAI();
      const data = JSON.parse(aiText);
      if (data.initialScore) setInitialScore(data.initialScore);
      if (data.scores) setLiveScores(data.scores);
      
      const aiMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: data.question || "Let's start. What's your actual competitive advantage?",
        timestamp: Date.now()
      };
      setMessages([aiMsg]);
      setTimeout(() => speak(aiMsg.content, selectedPersona.id), 1000);
    } catch (error) {
      console.error("Start Analysis Error:", error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: "Something went wrong starting the analysis. Please try again.",
        timestamp: Date.now()
      };
      setMessages([errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const runDemoAnalysis = async () => {
    setIsTyping(true);
    const demoData = {
      startupName: 'EcoStream',
      problem: 'Water waste in industrial cooling systems costs companies $4B annually.',
      targetCustomer: 'Manufacturing plants in SE Asia and North America.',
      traction: '$12k MRR from 3 pilot customers. 40% MoM growth.',
      team: 'CEO: Ex-Tesla Engineer. CTO: PhD in Hydrology from MIT.'
    };
    setPitchData(demoData);
    setActiveTab('report');
    
    const callDemoAI = async (retry = true): Promise<string> => {
      try {
        const context = `Startup Name: ${demoData.startupName}\nProblem: ${demoData.problem}\nTarget Customer: ${demoData.targetCustomer}\nTraction: ${demoData.traction}\nTeam: ${demoData.team}`;
        console.log("Demo Analysis Request:", context);

        const response = await genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: 'user', parts: [{ text: `Generate a full VC Investment Report for this demo startup. It should be a high-quality, detailed report. Output as JSON: { "type": "report", "report": { ... } }\n\nContext: ${context}` }] }],
          config: { 
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: "application/json" 
          }
        });

        const text = response.text;
        console.log("Demo Analysis Response:", text);

        if (!text || text.trim() === "" || text === "{}") {
          if (retry) {
            console.warn("Empty response received for demo analysis, retrying once...");
            return await callDemoAI(false);
          }
          throw new Error("Empty response from AI for demo analysis after retry");
        }
        return text;
      } catch (error) {
        console.error("Demo Analysis API Error:", error);
        throw error;
      }
    };

    try {
      const aiText = await callDemoAI();
      const data = JSON.parse(aiText);
      if (data.report) {
        setReportData(data.report);
        setInitialScore(data.report.initialScore || 65);
      }
    } catch (error) {
      console.error("Run Demo Analysis Error:", error);
      alert("Something went wrong generating the demo report. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const resetSession = () => {
    if (window.confirm("Are you sure you want to reset the entire session? This will clear all chat history and report data.")) {
      localStorage.removeItem('pitchReady_data');
      localStorage.removeItem('pitchReady_report');
      localStorage.removeItem('pitchSession');
      localStorage.removeItem('pitchReady_liveScores');
      localStorage.removeItem('pitchReady_initialScore');
      window.location.reload();
    }
  };

  const evaluatePitch = (answerText: string) => {
    let score = {
      clarity: 0,
      market: 0,
      traction: 0,
      confidence: 0
    };

    if (!answerText.trim()) {
      console.log("Empty input, skipping score update.");
      return liveScores;
    }

    const text = answerText.toLowerCase();

    // CLARITY
    if (text.length > 20) score.clarity += 5;
    if (text.includes("because") || text.includes("we help")) score.clarity += 5;

    // MARKET UNDERSTANDING
    if (text.includes("market") || text.includes("users") || text.includes("customers")) score.market += 5;
    if (text.match(/\d+/)) score.market += 5; // numbers present

    // TRACTION
    if (text.includes("revenue") || text.includes("growth") || text.includes("users")) score.traction += 5;
    if (text.match(/\d+/)) score.traction += 5;

    // CONFIDENCE
    if (text.length > 30) score.confidence += 5;
    if (!text.includes("maybe") && !text.includes("probably")) score.confidence += 5;

    console.log("Pitch Score Calculated:", score);
    return score;
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;

    const userMessageText = chatInput;
    
    // Evaluate pitch immediately after user response
    const newScores = evaluatePitch(userMessageText);
    setLiveScores(newScores);

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setChatInput('');
    setShowInput(false);
    
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsTyping(true);

    const callAI = async (retry = true): Promise<string> => {
      try {
        const history = messages.map(msg => ({
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

        const context = `Startup Name: ${pitchData.startupName}\nProblem: ${pitchData.problem}\nTarget Customer: ${pitchData.targetCustomer}\nTraction: ${pitchData.traction}\nTeam: ${pitchData.team}\nInitial Baseline Score: ${initialScore}`;
        const personaPrompt = `${SYSTEM_PROMPT}\n\nAct like a venture capitalist. ${selectedPersona.traits}. Ask tough, specific startup questions. Challenge vague answers. Focus on: Clarity, Market Understanding, Traction, Confidence. After each answer, give feedback on the answer and then ask a follow-up question.`;

        const response = await genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            ...history,
            { role: 'user', parts: [{ text: `Context: ${context}\n\nUser Message: ${userMessageText}` }] }
          ],
          config: {
            systemInstruction: personaPrompt,
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        });

        const text = response.text;
        console.log("AI Response:", text);

        if (!text || text.trim() === "" || text === "{}") {
          if (retry) {
            console.warn("Empty response received, retrying once...");
            return await callAI(false);
          }
          throw new Error("Empty response from AI after retry");
        }

        return text;
      } catch (error) {
        console.error("AI API Error:", error);
        throw error;
      }
    };

    try {
      const aiResponseText = await callAI();
      const data = JSON.parse(aiResponseText);
      
      if (data.type === 'report') {
        setReportData(data.report);
        const finalContent = data.content || "Analysis complete. Check the report.";
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'ai',
          content: finalContent,
          timestamp: Date.now()
        }]);
        setTimeout(() => speak(finalContent, selectedPersona.id), 1000);
      } else {
        const aiResponse: Message = {
          id: Date.now().toString(),
          role: 'ai',
          content: data.content || "I understand. Let's dig deeper into another aspect.",
          timestamp: Date.now(),
          rewrite: data.rewrite
        };
        setMessages(prev => [...prev, aiResponse]);
        setTimeout(() => speak(aiResponse.content, selectedPersona.id), 1000);
      }
    } catch (error) {
      console.error("Chatbot Error:", error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: "Something went wrong. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleMicClick = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setShowInput(true);
    }, 1500);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingPage onStart={() => setActiveTab('input')} />;
      case 'input':
        const steps = [
          { 
            label: "Startup Identity", 
            fields: [
              { key: 'startupName', label: 'Startup Name', placeholder: 'e.g. PitchReady AI' }
            ] 
          },
          { 
            label: "The Problem", 
            fields: [
              { key: 'problem', label: 'Problem Statement', placeholder: 'What pain point are you solving? (e.g., Water waste in industrial cooling costs $4B annually)', multiline: true }
            ] 
          },
          { 
            label: "Target Customer", 
            fields: [
              { key: 'targetCustomer', label: 'Target Customer', placeholder: 'Who are your customers? (e.g., D2C brands doing $10k+ monthly revenue)' }
            ] 
          },
          { 
            label: "Traction", 
            fields: [
              { key: 'traction', label: 'Traction (Users/Revenue)', placeholder: 'Current revenue, users, or key milestones (e.g., $12k MRR, 3 pilot customers)' }
            ] 
          },
          { 
            label: "The Team", 
            fields: [
              { key: 'team', label: 'Team Background', placeholder: 'Why is your team the right one? (e.g., CEO: Ex-Tesla Engineer, CTO: PhD in Hydrology)', multiline: true }
            ] 
          }
        ];

        const progress = ((currentStep + 1) / steps.length) * 100;

        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A]">Pitch Input</h1>
                <p className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}: {steps[currentStep].label}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={runDemoAnalysis}
                  className="bg-white text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
                >
                  Load Demo Startup
                </button>
              </div>
            </div>

            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-[#6C63FF]"
              />
            </div>

            <Card className="space-y-6">
              {steps[currentStep].fields.map((field: any) => (
                <InputField 
                  key={field.key}
                  label={field.label} 
                  placeholder={field.placeholder} 
                  multiline={field.multiline}
                  value={(pitchData as any)[field.key]}
                  onChange={(val: string) => setPitchData({...pitchData, [field.key]: val})}
                />
              ))}
              
              <div className="flex justify-between pt-4">
                <button 
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all"
                >
                  Back
                </button>
                {currentStep < steps.length - 1 ? (
                  <button 
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="bg-[#6C63FF] text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#6C63FF]/20 hover:bg-[#5a52e0] transition-all"
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    onClick={startAnalysis}
                    className="bg-[#6C63FF] text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#6C63FF]/20 hover:bg-[#5a52e0] transition-all flex items-center gap-2"
                  >
                    Start Analysis
                    <TrendingUp size={16} />
                  </button>
                )}
              </div>
            </Card>
          </motion.div>
        );
      case 'simulation':
        if (!isSimulationStarted && messages.length === 0) {
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-[#0F172A]">VC Pitch Simulation</h1>
                <p className="text-gray-500">Select your investor persona and prepare for the interrogation.</p>
              </div>

              <Card className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-[#0F172A]">Choose Your Investor</label>
                  <div className="grid grid-cols-1 gap-4">
                    {VC_PERSONAS.map((persona) => (
                      <button
                        key={persona.id}
                        onClick={() => setSelectedPersona(persona)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          selectedPersona.id === persona.id 
                            ? "border-[#6C63FF] bg-indigo-50" 
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-[#0F172A]">{persona.name}</span>
                          {selectedPersona.id === persona.id && <CheckCircle2 size={18} className="text-[#6C63FF]" />}
                        </div>
                        <p className="text-xs text-gray-500">{persona.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={startAnalysis}
                  className="w-full bg-[#6C63FF] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#6C63FF]/20 hover:bg-[#5a52e0] transition-all flex items-center justify-center gap-2"
                >
                  Enter Pitch Room
                  <MessageSquare size={18} />
                </button>
              </Card>
            </motion.div>
          );
        }

        const totalScore = liveScores.clarity + liveScores.market + liveScores.traction + liveScores.confidence;
        const scoreColor = totalScore < 15 ? 'text-red-500' : totalScore < 30 ? 'text-yellow-500' : 'text-green-500';
        const scoreBorder = totalScore < 15 ? 'border-red-200' : totalScore < 30 ? 'border-yellow-200' : 'border-green-200';

        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col max-w-5xl mx-auto gap-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A]">Pitching: {selectedPersona.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-gray-500">The investor is evaluating your startup in real-time.</p>
                  <div className="h-4 w-px bg-gray-200" />
                  <button 
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      isVoiceEnabled ? 'text-[#6C63FF]' : 'text-gray-400'
                    }`}
                  >
                    {isVoiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                    Voice Mode {isVoiceEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
              <div className={`flex items-center gap-4 bg-white p-4 rounded-2xl border ${scoreBorder} shadow-sm transition-colors duration-500`}>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pitch Score</div>
                  <div className={`text-2xl font-black ${scoreColor}`}>{totalScore}<span className="text-sm text-gray-300 ml-0.5">/40</span></div>
                </div>
                <div className={`w-10 h-10 rounded-full border-2 ${scoreColor.replace('text', 'border')}/20 flex items-center justify-center relative`}>
                  <div className={`absolute inset-0 rounded-full border-2 ${scoreColor.replace('text', 'border')} border-t-transparent animate-spin-slow`} />
                  <Target size={16} className={scoreColor} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
              <div className="lg:col-span-3 flex flex-col min-h-[500px]">
                <Card className="flex-1 flex flex-col p-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg) => {
                      return (
                        <div key={msg.id} className="space-y-3">
                          <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm relative ${
                              msg.role === 'user' 
                                ? 'bg-[#6C63FF] text-white rounded-tr-none shadow-md' 
                                : 'bg-gray-100 text-[#0F172A] rounded-tl-none border border-gray-200'
                            }`}>
                              {msg.role === 'ai' && (
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                                    <User size={10} />
                                    {selectedPersona.name}
                                  </div>
                                  <button 
                                    onClick={() => speak(msg.content, selectedPersona.id)}
                                    className="text-indigo-400 hover:text-indigo-600 transition-colors p-1"
                                    title="Replay Voice"
                                  >
                                    <Volume2 size={12} />
                                  </button>
                                </div>
                              )}
                              {msg.content}
                            </div>
                          </div>
                          {msg.rewrite && (
                            <div className="flex justify-start ml-4">
                              <div className="max-w-[85%] bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
                                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                                  <TrendingUp size={14} />
                                  Pitch Feedback
                                </div>
                                
                                {msg.rewrite.feedback && (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="p-2 rounded-lg bg-red-50 border border-red-100">
                                      <div className="text-[10px] font-bold text-red-600 uppercase mb-1">Weak</div>
                                      <p className="text-[11px] text-red-900 leading-tight">{msg.rewrite.feedback.weak}</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                                      <div className="text-[10px] font-bold text-amber-600 uppercase mb-1">Missing</div>
                                      <p className="text-[11px] text-amber-900 leading-tight">{msg.rewrite.feedback.missing}</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                                      <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Good</div>
                                      <p className="text-[11px] text-emerald-900 leading-tight">{msg.rewrite.feedback.good}</p>
                                    </div>
                                  </div>
                                )}

                                <div className="pt-2 border-t border-gray-50">
                                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Stronger Answer</div>
                                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50 text-emerald-900 text-xs font-medium italic leading-relaxed">
                                    "{msg.rewrite.improved}"
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 text-[#0F172A] rounded-2xl rounded-tl-none px-4 py-3 text-sm border border-gray-200 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#6C63FF]" />
                          <span>{selectedPersona.name} is thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <AnimatePresence mode="wait">
                      {!showInput ? (
                        <motion.div 
                          key="mic-area"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex flex-col items-center justify-center py-4 space-y-3"
                        >
                          {isListening ? (
                            <div className="flex flex-col items-center space-y-3">
                              <div className="relative">
                                <div className="absolute inset-0 bg-[#6C63FF]/20 rounded-full animate-ping" />
                                <div className="relative w-16 h-16 bg-[#6C63FF] text-white rounded-full flex items-center justify-center shadow-lg">
                                  <Mic size={24} className="animate-pulse" />
                                </div>
                              </div>
                              <span className="text-sm font-bold text-[#6C63FF] animate-pulse">Listening...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center space-y-2">
                              <button 
                                onClick={handleMicClick}
                                disabled={isTyping}
                                className="w-16 h-16 bg-white border-2 border-gray-100 text-gray-400 rounded-full flex items-center justify-center hover:border-[#6C63FF] hover:text-[#6C63FF] transition-all shadow-sm group disabled:opacity-50"
                              >
                                <Mic size={24} className="group-hover:scale-110 transition-transform" />
                              </button>
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Voice input simulated</span>
                                <span className="text-[9px] text-gray-300 italic">Click to speak</span>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="input-area"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative"
                        >
                          <input 
                            autoFocus
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type what you 'spoke'..."
                            className="w-full pl-4 pr-24 py-3 rounded-xl border border-[#6C63FF] outline-none transition-all text-sm shadow-sm"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <button 
                              onClick={() => setShowInput(false)}
                              className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={handleSendMessage}
                              disabled={!chatInput.trim()}
                              className="w-8 h-8 bg-[#6C63FF] text-white rounded-lg flex items-center justify-center hover:bg-[#5a52e0] transition-colors disabled:bg-gray-300"
                            >
                              <Send size={16} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Scoring</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Clarity', value: liveScores.clarity, color: 'bg-blue-500' },
                      { label: 'Market Understanding', value: liveScores.market, color: 'bg-indigo-500' },
                      { label: 'Traction', value: liveScores.traction, color: 'bg-emerald-500' },
                      { label: 'Confidence', value: liveScores.confidence, color: 'bg-amber-500' },
                    ].map((metric) => (
                      <div key={metric.label} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-gray-500">{metric.label}</span>
                          <span className="text-gray-900">{metric.value}/10</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(metric.value / 10) * 100}%` }}
                            className={`h-full ${metric.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Total Score</span>
                    <span className={`text-lg font-black ${scoreColor}`}>{totalScore}<span className="text-[10px] text-gray-400 font-bold ml-0.5">/40</span></span>
                  </div>
                </Card>
                <div className="p-4 bg-indigo-900 rounded-2xl text-white space-y-2">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Pitch Tip</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {selectedPersona.id === 'aggressive' ? "Don't get defensive. Stick to the facts and numbers." : 
                     selectedPersona.id === 'analytical' ? "Focus on unit economics and CAC/LTV ratios." :
                     "Be authentic and show your deep understanding of the customer."}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'report':
        if (isTyping && !reportData) {
          return (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="max-w-5xl mx-auto flex flex-col items-center justify-center py-32 text-center space-y-6"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-gray-100 border-t-[#6C63FF] animate-spin" />
                <Target className="absolute inset-0 m-auto text-[#6C63FF]" size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-[#0F172A]">Generating Investment Report</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Our VC Analyst is synthesizing your pitch data, market signals, and interrogation results into a comprehensive evaluation.
                </p>
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-[#6C63FF] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-[#6C63FF] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-[#6C63FF] rounded-full animate-bounce" />
              </div>
            </motion.div>
          );
        }

        if (!reportData) {
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl mx-auto flex flex-col items-center justify-center py-20 text-center space-y-4"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <FileText size={40} />
              </div>
              <h2 className="text-2xl font-bold text-[#0F172A]">No Report Generated Yet</h2>
              <p className="text-gray-500 max-w-md">
                Complete a coaching session with our AI Analyst to generate your investment readiness report.
              </p>
              <button 
                onClick={() => setActiveTab('simulation')}
                className="bg-[#6C63FF] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#6C63FF]/20"
              >
                Go to VC Simulation
              </button>
            </motion.div>
          );
        }

        const scoreImprovement = reportData.finalScore - reportData.initialScore;

        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-[#0F172A]">Investment Report</h1>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    reportData.risk === 'Low' ? 'bg-green-100 text-green-700' :
                    reportData.risk === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {reportData.risk} Risk
                  </div>
                </div>
                <p className="text-sm text-gray-500">Analysis for {pitchData.startupName || 'your startup'}.</p>
              </div>
              
              <div className="flex items-center gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Final Score</div>
                    <div className="text-4xl font-black text-[#6C63FF]">{reportData.finalScore}</div>
                  </div>
                  <div className="w-16 h-16 rounded-full border-4 border-[#6C63FF]/20 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-4 border-[#6C63FF] border-t-transparent animate-spin-slow" />
                    <span className="text-xl font-black text-[#6C63FF]">{reportData.grade}</span>
                  </div>
                </div>
                <div className="h-10 w-px bg-gray-100" />
                <div className="text-center">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Improvement</div>
                  <div className="text-xl font-bold text-green-500 flex items-center justify-center gap-1">
                    <TrendingUp size={16} />
                    +{scoreImprovement}
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-indigo-900 text-white border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target size={120} />
              </div>
              <div className="relative z-10 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">VC Verdict</div>
                <p className="text-xl font-medium leading-relaxed italic">
                  "{reportData.verdict}"
                </p>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="space-y-4 border-l-4 border-l-[#22C55E]">
                <div className="flex items-center gap-2 text-[#22C55E]">
                  <CheckCircle2 size={20} />
                  <h3 className="font-bold">Key Strengths</h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  {reportData.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2">• {s}</li>
                  ))}
                </ul>
              </Card>

              <Card className="space-y-4 border-l-4 border-l-orange-400">
                <div className="flex items-center gap-2 text-orange-400">
                  <AlertCircle size={20} />
                  <h3 className="font-bold">Weaknesses</h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  {reportData.weaknesses.map((w, i) => (
                    <li key={i} className="flex gap-2">• {w}</li>
                  ))}
                </ul>
              </Card>

              <Card className="space-y-4 border-l-4 border-l-red-400">
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle size={20} />
                  <h3 className="font-bold">Missing Signals</h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  {reportData.missingSignals.map((m, i) => (
                    <li key={i} className="flex gap-2">• {m}</li>
                  ))}
                </ul>
              </Card>

              <Card className="lg:col-span-2 space-y-4 border-l-4 border-l-blue-500">
                <div className="flex items-center gap-2 text-blue-500">
                  <TrendingUp size={20} />
                  <h3 className="font-bold">Rewrite Suggestions</h3>
                </div>
                <div className="space-y-4">
                  {reportData.rewrites.map((r, i) => (
                    <div key={i} className="p-4 bg-blue-50 rounded-2xl space-y-2">
                      <div className="text-[10px] font-bold text-blue-400 uppercase">Original Answer</div>
                      <p className="text-sm text-gray-500 italic">"{r.original}"</p>
                      <div className="text-[10px] font-bold text-blue-600 uppercase">Improved Version</div>
                      <p className="text-sm text-blue-900 font-bold">"{r.improved}"</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="space-y-4 border-l-4 border-l-indigo-900 bg-indigo-50/30">
                <div className="flex items-center gap-2 text-indigo-900">
                  <Target size={20} />
                  <h3 className="font-bold">VC Expectations</h3>
                </div>
                <ul className="space-y-3 text-sm text-indigo-900/80">
                  {reportData.vcExpectations.map((exp, i) => (
                    <li key={i} className="flex gap-2">• {exp}</li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className="text-center pt-8 no-print">
              <button 
                onClick={() => window.print()}
                className="text-[#6C63FF] font-bold text-sm hover:underline flex items-center gap-2 mx-auto"
              >
                Download Full PDF Report
                <FileText size={16} />
              </button>
            </div>
          </motion.div>
        );
      case 'pricing':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-12 py-8"
          >
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-black text-[#0F172A]">Simple, Transparent Pricing</h1>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                Start free. Upgrade when you're ready to win.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
              {/* Free Plan */}
              <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="space-y-4 flex-1">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0F172A]">Free</h3>
                    <div className="text-3xl font-black text-[#0F172A] mt-1">₹0</div>
                  </div>
                  <ul className="space-y-3 pt-4">
                    {[
                      "Limited VC simulations",
                      "Basic feedback",
                      "Practice mode"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check size={16} className="text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <button 
                  onClick={() => setActiveTab('input')}
                  className="w-full mt-8 py-3 rounded-xl font-bold border-2 border-gray-100 text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Start Free
                </button>
              </Card>

              {/* Pro Report */}
              <Card className="flex flex-col h-full border-2 border-green-500 shadow-xl shadow-green-500/10 relative scale-105 z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Most Popular
                </div>
                <div className="space-y-4 flex-1">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0F172A]">Pro Report</h3>
                    <div className="text-3xl font-black text-[#0F172A] mt-1">₹99 <span className="text-sm text-gray-400 font-normal">/ report</span></div>
                  </div>
                  <ul className="space-y-3 pt-4">
                    {[
                      "Detailed pitch analysis",
                      "Strengths & weaknesses",
                      "Improved pitch version",
                      "Investor-ready feedback"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check size={16} className="text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <button 
                  onClick={() => setShowPricingModal(true)}
                  className="w-full mt-8 py-3 rounded-xl font-bold bg-green-500 text-white shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all"
                >
                  Unlock Report
                </button>
              </Card>

              {/* Future Plan */}
              <Card className="flex flex-col h-full hover:shadow-md transition-shadow opacity-80">
                <div className="space-y-4 flex-1">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Mic size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-[#0F172A]">VC Voice Premium</h3>
                    </div>
                    <div className="text-3xl font-black text-[#0F172A] mt-1">₹499 <span className="text-sm text-gray-400 font-normal">/ month</span></div>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold uppercase tracking-widest">Coming Soon</span>
                  </div>
                  <ul className="space-y-3 pt-4">
                    {[
                      "Real VC voice simulations",
                      "Anupam Mittal-style investors",
                      "Advanced questioning",
                      "Unlimited reports"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check size={16} className="text-indigo-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <button 
                  onClick={() => setToast({ message: "You'll be notified when this launches!", type: 'info' })}
                  className="w-full mt-8 py-3 rounded-xl font-bold bg-indigo-900 text-white hover:bg-indigo-950 transition-all flex items-center justify-center gap-2"
                >
                  <Bell size={16} />
                  Notify Me
                </button>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-gray-400 text-sm font-medium italic">
                "Even one better pitch can change your startup’s future."
              </p>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className={`min-h-screen ${activeTab === 'landing' ? 'bg-[#020617]' : 'bg-[#F8FAFC]'} flex flex-col md:flex-row`}>
      {/* Desktop Sidebar */}
      {activeTab !== 'landing' && (
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 fixed h-full">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-[#6C63FF] rounded-lg flex items-center justify-center">
              <Target className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-[#0F172A]">PitchReady</span>
          </div>

          <div className="flex-1 space-y-2">
            <SidebarItem 
              icon={PlusCircle} 
              label="Pitch Input" 
              active={activeTab === 'input'} 
              onClick={() => setActiveTab('input')} 
            />
            <SidebarItem 
              icon={MessageSquare} 
              label="VC Simulation" 
              active={activeTab === 'simulation'} 
              onClick={() => setActiveTab('simulation')} 
            />
            <SidebarItem 
              icon={FileText} 
              label="Investment Report" 
              active={activeTab === 'report'} 
              onClick={() => setActiveTab('report')} 
            />
            <SidebarItem 
              icon={CreditCard} 
              label="Pricing" 
              active={activeTab === 'pricing'} 
              onClick={() => setActiveTab('pricing')} 
            />
          </div>

          <div className="pt-6 border-t border-gray-100 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-gray-600 transition-colors">
              <User size={20} />
              <span className="font-semibold text-sm">Profile</span>
            </button>
            <button 
              onClick={resetSession}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-semibold text-sm">Reset Session</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 ${activeTab !== 'landing' ? 'md:ml-64 p-4 md:p-10 pb-24 md:pb-10' : ''}`}>
        <div className={`${activeTab !== 'landing' ? 'max-w-7xl mx-auto h-full' : ''}`}>
          {renderContent()}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {activeTab !== 'landing' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-1 flex items-center justify-between z-50">
          <MobileNavItem 
            icon={PlusCircle} 
            active={activeTab === 'input'} 
            onClick={() => setActiveTab('input')} 
          />
          <MobileNavItem 
            icon={MessageSquare} 
            active={activeTab === 'simulation'} 
            onClick={() => setActiveTab('simulation')} 
          />
          <MobileNavItem 
            icon={FileText} 
            active={activeTab === 'report'} 
            onClick={() => setActiveTab('report')} 
          />
          <MobileNavItem 
            icon={CreditCard} 
            active={activeTab === 'pricing'} 
            onClick={() => setActiveTab('pricing')} 
          />
        </nav>
      )}

      {/* Modals & Toasts */}
      <AnimatePresence>
        {showPricingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPricingModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                  <ShieldCheck size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-[#0F172A]">Unlock Pro Report</h3>
                  <p className="text-gray-500">Generate a comprehensive investment readiness report for your startup.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                  <span className="font-bold text-gray-600">Total Amount</span>
                  <span className="text-2xl font-black text-[#0F172A]">₹99</span>
                </div>
                <button 
                  onClick={() => {
                    setShowPricingModal(false);
                    setToast({ message: "Payment gateway integration coming soon!", type: 'info' });
                  }}
                  className="w-full bg-[#6C63FF] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#6C63FF]/20 hover:bg-[#5a52e0] transition-all"
                >
                  Pay & Generate Report
                </button>
                <button 
                  onClick={() => setShowPricingModal(false)}
                  className="text-sm font-bold text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 bg-indigo-900 text-white rounded-full shadow-2xl flex items-center gap-3 whitespace-nowrap"
          >
            <Zap size={16} className="text-indigo-300" />
            <span className="text-sm font-bold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @media print {
          aside, nav, .no-print, button {
            display: none !important;
          }
          main {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .max-w-7xl {
            max-width: 100% !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
