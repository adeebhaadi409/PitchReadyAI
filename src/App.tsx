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
  Loader2
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";

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
  rewrite?: { original: string; improved: string };
}

interface LiveScores {
  market: number;
  traction: number;
  founder: number;
  businessModel: number;
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

// --- Gemini Setup ---
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const SYSTEM_PROMPT = `You are a venture capital analyst evaluating a startup.

You must:
- Ask sharp, probing questions
- Challenge unclear answers
- Push for numbers, not vague statements
- Think like you are deciding whether to invest

Tone:
Direct, analytical, slightly critical but helpful.

Focus on:
- Market size and clarity
- Traction and growth
- Founder strength
- Business model
- Differentiation

Do not be generic. Act like a real VC in a pitch meeting.

OUTPUT FORMAT:
Every response MUST be a valid JSON object.
For regular chat turns:
{
  "type": "chat",
  "content": "Your sharp question or follow-up here.",
  "scores": { "market": number, "traction": number, "founder": number, "businessModel": number },
  "rewrite": { "original": "user's last answer", "improved": "how it should have been said with numbers and clarity" } // Only if the last answer was weak
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
  const [activeTab, setActiveTab] = useState<'input' | 'coach' | 'report'>('input');
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [liveScores, setLiveScores] = useState<LiveScores>(() => {
    const saved = localStorage.getItem('pitchReady_liveScores');
    return saved ? JSON.parse(saved) : { market: 0, traction: 0, founder: 0, businessModel: 0 };
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
    const saved = localStorage.getItem('pitchReady_messages');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        role: 'ai',
        content: "I'm your VC Analyst. I've seen your initial pitch data. Let's see if this actually holds water. Ready to be grilled?",
        timestamp: Date.now()
      }
    ];
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
    localStorage.setItem('pitchReady_messages', JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('pitchReady_liveScores', JSON.stringify(liveScores));
  }, [liveScores]);

  useEffect(() => {
    localStorage.setItem('pitchReady_initialScore', initialScore.toString());
  }, [initialScore]);

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
    setActiveTab('coach');
    
    try {
      const context = `Startup Name: ${pitchData.startupName}\nProblem: ${pitchData.problem}\nTarget Customer: ${pitchData.targetCustomer}\nTraction: ${pitchData.traction}\nTeam: ${pitchData.team}`;
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Based on this startup data, give me an initial baseline score (0-100) and your first sharp question. Output as JSON: { "initialScore": number, "question": "string", "scores": { "market": number, "traction": number, "founder": number, "businessModel": number } }\n\nContext: ${context}` }] }],
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text || "{}");
      if (data.initialScore) setInitialScore(data.initialScore);
      if (data.scores) setLiveScores(data.scores);
      
      const aiMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: data.question || "Let's start. What's your actual competitive advantage?",
        timestamp: Date.now()
      };
      setMessages([aiMsg]);
    } catch (error) {
      console.error(error);
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
    
    try {
      const context = `Startup Name: ${demoData.startupName}\nProblem: ${demoData.problem}\nTarget Customer: ${demoData.targetCustomer}\nTraction: ${demoData.traction}\nTeam: ${demoData.team}`;
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Generate a full VC Investment Report for this demo startup. It should be a high-quality, detailed report. Output as JSON: { "type": "report", "report": { ... } }\n\nContext: ${context}` }] }],
        config: { 
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json" 
        }
      });

      const data = JSON.parse(response.text || "{}");
      if (data.report) {
        setReportData(data.report);
        setInitialScore(data.report.initialScore || 65);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const resetSession = () => {
    if (window.confirm("Are you sure you want to reset the entire session? This will clear all chat history and report data.")) {
      localStorage.removeItem('pitchReady_data');
      localStorage.removeItem('pitchReady_report');
      localStorage.removeItem('pitchReady_messages');
      localStorage.removeItem('pitchReady_liveScores');
      localStorage.removeItem('pitchReady_initialScore');
      window.location.reload();
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setChatInput('');
    setIsTyping(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const context = `Startup Name: ${pitchData.startupName}\nProblem: ${pitchData.problem}\nTarget Customer: ${pitchData.targetCustomer}\nTraction: ${pitchData.traction}\nTeam: ${pitchData.team}\nInitial Baseline Score: ${initialScore}`;
      
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: 'user', parts: [{ text: `Context: ${context}\n\nUser Message: ${chatInput}` }] }
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || "{}");
      
      if (data.type === 'report') {
        setReportData(data.report);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'ai',
          content: data.content || "Analysis complete. Check the report.",
          timestamp: Date.now()
        }]);
      } else {
        if (data.scores) setLiveScores(data.scores);
        const aiResponse: Message = {
          id: Date.now().toString(),
          role: 'ai',
          content: data.content,
          timestamp: Date.now(),
          rewrite: data.rewrite
        };
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error("Gemini Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
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
      case 'coach':
        const overallLiveScore = Math.round((liveScores.market + liveScores.traction + liveScores.founder + liveScores.businessModel) / 4);
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col max-w-5xl mx-auto gap-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A]">VC Interrogation</h1>
                <p className="text-sm text-gray-500">The analyst is pressure-testing your assumptions.</p>
              </div>
              <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Live Score</div>
                  <div className="text-2xl font-black text-[#6C63FF]">{overallLiveScore}</div>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-[#6C63FF]/20 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-2 border-[#6C63FF] border-t-transparent animate-spin-slow" />
                  <Target size={16} className="text-[#6C63FF]" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
              <div className="lg:col-span-3 flex flex-col min-h-[500px]">
                <Card className="flex-1 flex flex-col p-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg) => {
                      const isVCInsight = msg.role === 'ai' && (
                        msg.content.toLowerCase().includes('vc expect') || 
                        msg.content.toLowerCase().includes('vcs look for') ||
                        msg.content.toLowerCase().includes('seed-stage') ||
                        msg.content.toLowerCase().includes('series a') ||
                        msg.content.toLowerCase().includes('saas') ||
                        msg.content.toLowerCase().includes('mrr')
                      );

                      return (
                        <div key={msg.id} className="space-y-3">
                          <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm relative ${
                              msg.role === 'user' 
                                ? 'bg-[#6C63FF] text-white rounded-tr-none shadow-md' 
                                : isVCInsight 
                                  ? 'bg-indigo-50 text-indigo-900 rounded-tl-none border border-indigo-200 shadow-sm'
                                  : 'bg-gray-100 text-[#0F172A] rounded-tl-none border border-gray-200'
                            }`}>
                              {isVCInsight && (
                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                                  <Target size={10} />
                                  VC Insider Insight
                                </div>
                              )}
                              {msg.content}
                            </div>
                          </div>
                          {msg.rewrite && (
                            <div className="flex justify-start ml-4">
                              <div className="max-w-[75%] bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs">
                                <div className="font-bold text-blue-600 mb-1 flex items-center gap-1">
                                  <TrendingUp size={12} />
                                  Rewrite Suggestion
                                </div>
                                <div className="text-gray-400 line-through mb-1">"{msg.rewrite.original}"</div>
                                <div className="text-blue-900 font-medium italic">"{msg.rewrite.improved}"</div>
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
                          <span>Analyst is typing...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="relative">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={isTyping ? "Analyst is thinking..." : "Answer the analyst..."}
                        disabled={isTyping}
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-[#6C63FF] outline-none transition-all text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={isTyping || !chatInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#6C63FF] text-white rounded-lg flex items-center justify-center hover:bg-[#5a52e0] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Metrics</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Market Clarity', value: liveScores.market },
                      { label: 'Traction', value: liveScores.traction },
                      { label: 'Founder Fit', value: liveScores.founder },
                      { label: 'Business Model', value: liveScores.businessModel },
                    ].map((metric) => (
                      <div key={metric.label} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-gray-500">{metric.label}</span>
                          <span className="text-[#6C63FF]">{metric.value}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${metric.value}%` }}
                            className="h-full bg-[#6C63FF]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                <div className="p-4 bg-indigo-900 rounded-2xl text-white space-y-2">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Analyst Note</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    The analyst is looking for specific numbers. Avoid "we hope to" or "we think". Use "we have" and "our data shows".
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
                onClick={() => setActiveTab('coach')}
                className="bg-[#6C63FF] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#6C63FF]/20"
              >
                Go to AI Coach
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
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
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
            label="AI Coach" 
            active={activeTab === 'coach'} 
            onClick={() => setActiveTab('coach')} 
          />
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Report" 
            active={activeTab === 'report'} 
            onClick={() => setActiveTab('report')} 
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

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-10 pb-24 md:pb-10">
        <div className="max-w-7xl mx-auto h-full">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-1 flex items-center justify-between z-50">
        <MobileNavItem 
          icon={PlusCircle} 
          active={activeTab === 'input'} 
          onClick={() => setActiveTab('input')} 
        />
        <MobileNavItem 
          icon={MessageSquare} 
          active={activeTab === 'coach'} 
          onClick={() => setActiveTab('coach')} 
        />
        <MobileNavItem 
          icon={LayoutDashboard} 
          active={activeTab === 'report'} 
          onClick={() => setActiveTab('report')} 
        />
      </nav>

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
