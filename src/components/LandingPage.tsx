import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Target, 
  Zap, 
  MessageSquare, 
  TrendingUp, 
  Mic, 
  ShieldCheck, 
  ArrowRight, 
  Play,
  Check,
  ChevronRight,
  Star
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <MessageSquare className="text-blue-500" />,
      title: "VC Simulation",
      desc: "Practice with AI investors that challenge your assumptions."
    },
    {
      icon: <TrendingUp className="text-emerald-500" />,
      title: "Live Pitch Scoring",
      desc: "Get real-time feedback on clarity, market, and traction."
    },
    {
      icon: <Zap className="text-amber-500" />,
      title: "Smart Rewrites",
      desc: "Instantly see how to turn vague answers into data-driven wins."
    },
    {
      icon: <Mic className="text-purple-500" />,
      title: "Voice-based AI",
      desc: "Experience the verbal pressure of a real pitch meeting."
    }
  ];

  const steps = [
    { step: "01", title: "Start Simulation", desc: "Input your startup details and select your VC persona." },
    { step: "02", title: "Answer Questions", desc: "Engage in a high-stakes Q&A session with our AI Analyst." },
    { step: "03", title: "Get Your Report", desc: "Receive a full score breakdown and improved pitch version." }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled ? 'bg-[#020617]/80 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Target className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">PitchReady <span className="text-blue-500">AI</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <button 
            onClick={onStart}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 group"
          >
            Try Simulation
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
              <Star size={12} fill="currentColor" />
              The Future of Pitching
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight">
              Founders Don’t Fail — <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Their Pitches Do.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-lg leading-relaxed">
              Practice with AI investors. Get real feedback. <br />
              Raise your next round with absolute confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onStart}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 group"
              >
                Start Free Simulation
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a 
                href="#demo"
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                <Play size={20} fill="currentColor" />
                Watch Demo
              </a>
            </div>
            
            <div className="pt-8 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#020617] bg-gray-800 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="font-bold">Used by 1,000+ founders</div>
                <div className="text-gray-500">From YC, Antler, and Techstars</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-blue-600/20 blur-[60px] rounded-full -z-10" />
            <div className="bg-[#0F172A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden aspect-[4/3] flex flex-col">
              <div className="bg-white/5 border-b border-white/5 p-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                </div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live VC Simulation</div>
                <div className="w-8" />
              </div>
              <div className="flex-1 p-6 space-y-6 overflow-hidden">
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 max-w-[80%] space-y-2">
                    <div className="text-[10px] font-bold text-blue-400 uppercase">Aggressive VC</div>
                    <p className="text-sm text-gray-300">Your traction looks flat. Why should I believe this scales?</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-blue-600 rounded-2xl rounded-tr-none p-4 max-w-[80%]">
                    <p className="text-sm">We've grown 40% MoM with zero marketing spend...</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 max-w-[80%] space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">Live Feedback</span>
                    </div>
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <p className="text-[11px] text-emerald-300 italic">"Stronger Answer: Our 40% MoM organic growth proves a high viral coefficient..."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need to win</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Built by founders, for founders. Our AI engine is trained on thousands of real pitch decks and VC interactions.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-blue-600 rounded-[40px] p-12 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10 grid md:grid-cols-3 gap-12">
              {steps.map((s, i) => (
                <div key={i} className="space-y-4">
                  <div className="text-5xl font-black text-white/20">{s.step}</div>
                  <h3 className="text-2xl font-bold">{s.title}</h3>
                  <p className="text-blue-100/80 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-24">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
          <h2 className="text-3xl md:text-4xl font-bold">See It In Action</h2>
          <div className="max-w-4xl mx-auto aspect-video bg-white/5 border border-white/10 rounded-[40px] relative group cursor-pointer overflow-hidden shadow-2xl">
            <img 
              src="https://picsum.photos/seed/pitchdemo/1920/1080?blur=2" 
              alt="Demo Preview" 
              className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-600/40 group-hover:scale-110 transition-transform">
                <Play size={32} fill="currentColor" className="ml-1" />
              </div>
            </div>
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center">
              <div className="text-left">
                <div className="text-sm font-bold">PitchReady AI Walkthrough</div>
                <div className="text-xs text-gray-500">2:45 • Watch how EcoStream raised $1.2M</div>
              </div>
              <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest">Loom Demo</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Simple, Transparent Pricing</h2>
            <p className="text-gray-500">Start free. Upgrade when you're ready to win.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl flex flex-col">
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-xl font-bold">Free</h3>
                  <div className="text-3xl font-black mt-2">₹0</div>
                </div>
                <ul className="space-y-3">
                  {["Limited VC simulations", "Basic feedback", "Practice mode"].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                      <Check size={16} className="text-blue-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={onStart} className="w-full mt-8 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-all">Start Free</button>
            </div>

            {/* Pro */}
            <div className="bg-blue-600 p-8 rounded-3xl flex flex-col relative scale-105 shadow-2xl shadow-blue-600/20">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Most Popular</div>
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-xl font-bold">Pro Report</h3>
                  <div className="text-3xl font-black mt-2">₹99 <span className="text-sm font-normal opacity-60">/ report</span></div>
                </div>
                <ul className="space-y-3">
                  {["Detailed pitch analysis", "Strengths & weaknesses", "Improved pitch version", "Investor-ready feedback"].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-blue-100">
                      <Check size={16} className="text-white" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={onStart} className="w-full mt-8 py-3 rounded-xl font-bold bg-white text-blue-600 hover:bg-blue-50 transition-all">Unlock Report</button>
            </div>

            {/* Premium */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl flex flex-col opacity-60">
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-xl font-bold">VC Voice Premium</h3>
                  <div className="text-3xl font-black mt-2">₹499 <span className="text-sm font-normal opacity-60">/ month</span></div>
                  <div className="mt-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest">Coming Soon</div>
                </div>
                <ul className="space-y-3">
                  {["Real VC voice simulations", "Anupam Mittal-style investors", "Advanced questioning", "Unlimited reports"].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                      <Check size={16} className="text-blue-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button className="w-full mt-8 py-3 rounded-xl font-bold bg-white/5 text-gray-500 cursor-not-allowed">Notify Me</button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5 -z-10" />
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight">Practice Before It Matters.</h2>
          <p className="text-xl text-gray-400 max-w-xl mx-auto">Don't let your first real pitch be your first time practicing. Join 1,000+ founders winning with PitchReady.</p>
          <button 
            onClick={onStart}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all shadow-2xl shadow-blue-600/30 inline-flex items-center gap-3 group"
          >
            Start Your First Pitch Simulation
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Target className="text-white w-4 h-4" />
            </div>
            <span className="font-bold">PitchReady AI</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
          </div>
          <div className="text-sm text-gray-600">
            © 2026 PitchReady AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
