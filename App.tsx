
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Activity, Copy, Power, Download,
  Smartphone, Shield, Hexagon, Sparkles,
  Loader2, Cpu, Network, Terminal, Wifi, Save,
  Code, Play, RotateCw, Edit3, Package, CheckCircle2, AlertTriangle,
  Globe, Zap, Wand2, Layers, Database, Music,
  Cpu as CpuIcon, Aperture, BrainCircuit, Rocket, Cloud, Share2, ArrowRight,
  DownloadCloud, X
} from 'lucide-react';
import { codingAssistant } from './services/geminiService.ts';
import { ChatMessage, CodeSnippet } from './types.ts';

// --- VISUAL COMPONENTS ---

const NeuralBackground = ({ activeCore }: { activeCore: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    // Core Colors
    let color = '245, 158, 11'; // Amber (Nexus)
    if (activeCore === 'TITAN') color = '239, 68, 68'; // Red/Orange (Titan)
    if (activeCore === 'QUANTUM') color = '168, 85, 247'; // Purple (Quantum)

    const particles: {x: number, y: number, vx: number, vy: number}[] = [];
    for(let i=0; i<50; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        });
    }

    const animate = () => {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(0,0,width,height);
        
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            if(p.x < 0 || p.x > width) p.vx *= -1;
            if(p.y < 0 || p.y > height) p.vy *= -1;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1, 0, Math.PI*2);
            ctx.fillStyle = `rgba(${color}, 0.5)`;
            ctx.fill();

            // Connect
            particles.forEach((p2, j) => {
                if(i !== j) {
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if(dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(${color}, 0.15)`;
                        ctx.stroke();
                    }
                }
            });
        });
        requestAnimationFrame(animate);
    };
    const animId = requestAnimationFrame(animate);

    const handleResize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animId);
    };
  }, [activeCore]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-50 transition-colors duration-1000" />;
};

const HexStream = () => {
    const [lines, setLines] = useState<string[]>([]);
    useEffect(() => {
        const interval = setInterval(() => {
            const hex = Array(4).fill(0).map(() => 
                "0x" + Math.floor(Math.random()*16777215).toString(16).toUpperCase().padStart(6, '0')
            ).join(' ');
            setLines(prev => [hex, ...prev].slice(0, 20));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="font-mono text-[10px] text-green-900/60 overflow-hidden h-full flex flex-col pointer-events-none select-none">
            {lines.map((l, i) => <div key={i}>{l}</div>)}
        </div>
    );
};

const CpuGraph = ({ activeCore }: { activeCore: string }) => {
    let colorClass = 'bg-amber-500/40';
    if (activeCore === 'TITAN') colorClass = 'bg-red-500/40';
    if (activeCore === 'QUANTUM') colorClass = 'bg-purple-500/40';

    return (
        <div className="flex items-end gap-0.5 h-8 w-24">
            {[...Array(12)].map((_, i) => (
                <div key={i} 
                    className={`w-1.5 ${colorClass} animate-pulse`} 
                    style={{
                        height: `${Math.random() * 100}%`,
                        animationDuration: `${0.5 + Math.random()}s`
                    }} 
                />
            ))}
        </div>
    );
};

// --- MAIN APP ---

const App: React.FC = () => {
  const [booting, setBooting] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("IDLE");
  const [activeAppCode, setActiveAppCode] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Core System State
  const [activeCore, setActiveCore] = useState<'NEXUS' | 'TITAN' | 'QUANTUM'>('NEXUS');

  // IDE State
  const [viewMode, setViewMode] = useState<'preview' | 'code' | 'build'>('preview');
  const [editableCode, setEditableCode] = useState('');
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [buildProgress, setBuildProgress] = useState(0);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildComplete, setBuildComplete] = useState(false);
  
  // Cloud Deploy State
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  
  // System Install Modal
  const [showInstallModal, setShowInstallModal] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const buildLogRef = useRef<HTMLDivElement>(null);

  // Initial Boot
  useEffect(() => {
    setTimeout(() => {
        setBooting(false);
        setMessages([{
            id: 'init', role: 'ai', timestamp: Date.now(),
            content: "V6000 SYSTEM ONLINE.\n\nType your app idea (e.g., 'Make a Snake Game').\nI will code it, and you can Install it on your phone."
        }]);
    }, 2000);
  }, []);

  // Scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);
  
  // Auto-scroll build logs
  useEffect(() => {
    if (buildLogRef.current) buildLogRef.current.scrollTop = buildLogRef.current.scrollHeight;
  }, [buildLogs]);

  // Sync editable code when active app changes
  useEffect(() => {
    if (activeAppCode) {
        setEditableCode(activeAppCode);
    }
  }, [activeAppCode]);

  const handleSendMessage = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    setMessages(p => [...p, { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() }]);
    setInput('');
    setLoading(true);
    
    // Custom Loading Text based on Core
    if (activeCore === 'TITAN') {
        setLoadingText("TITAN REASONING..."); // Indicates deep thinking
    } else if (activeCore === 'QUANTUM') {
        setLoadingText("IMAGINING POSSIBILITIES...");
    } else {
        setLoadingText("COMPILING...");
    }

    const response = await codingAssistant(text, messages, activeCore);

    setMessages(p => [...p, { 
        id: Date.now().toString(), role: 'ai', 
        content: response.text, snippets: response.snippets, timestamp: Date.now() 
    }]);
    setLoading(false);
    setLoadingText("IDLE");

    const runnable = response.snippets.find(s => s.isRunnable);
    if (runnable) {
        setActiveAppCode(runnable.code);
        setViewMode('preview');
        setShowPreview(true);
        // Reset build state
        setBuildComplete(false);
        setDeployedUrl(null);
    }
  };

  const handleDownload = (code: string, filename: string) => {
      const blob = new Blob([code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'nexus_app.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleRecompile = () => {
      setActiveAppCode(editableCode);
      setViewMode('preview');
  };

  const startBuildProcess = () => {
      setIsBuilding(true);
      setBuildComplete(false);
      setDeployedUrl(null);
      setBuildLogs([]);
      setBuildProgress(0);
      
      const steps = [
          `Initializing ${activeCore} Compiler...`,
          "Checking global dependencies...",
          "Fetching latest CDN manifests...",
          "Optimizing for Android 15 / iOS 18...",
          "> Task :app:preBuild UP-TO-DATE",
          "> Task :app:compileDebugJavaWithJavac",
          "Injecting PWA Mobile Manifest...",
          "> Task :app:processDebugResources",
          "Optimizing graphics...",
          "> Task :app:dexBuilderDebug",
          "Converting bytecode to Dex...",
          "> Task :app:packageDebug",
          "Signing with debug key...",
          "BUILD SUCCESSFUL in 4s"
      ];

      let currentStep = 0;
      const interval = setInterval(() => {
          if (currentStep >= steps.length) {
              clearInterval(interval);
              setIsBuilding(false);
              setBuildComplete(true);
              setBuildProgress(100);
              return;
          }
          setBuildLogs(prev => [...prev, steps[currentStep]]);
          setBuildProgress(Math.round(((currentStep + 1) / steps.length) * 100));
          currentStep++;
      }, 300);
  };

  const handleDeploy = () => {
      setIsDeploying(true);
      setTimeout(() => {
          setIsDeploying(false);
          setDeployedUrl(`https://nexus-cloud.dev/v6000/${Math.random().toString(36).substring(7)}`);
      }, 2500);
  };

  const handleStyleInject = (style: string) => {
      setInput(prev => {
          const prefix = prev.trim().length > 0 ? prev + " with " : "";
          return prefix + style;
      });
  };

  const QuickAction = ({ label, prompt }: { label: string, prompt: string }) => (
    <button 
      onClick={() => handleSendMessage(prompt)}
      disabled={loading}
      className={`px-3 py-1.5 bg-black border text-[10px] font-mono tracking-wider transition-all uppercase whitespace-nowrap flex items-center gap-2
         ${activeCore === 'TITAN' ? 'border-red-900/50 text-red-500 hover:bg-red-900/20' : 
           activeCore === 'QUANTUM' ? 'border-purple-900/50 text-purple-500 hover:bg-purple-900/20' : 
           'border-amber-900/50 text-amber-500 hover:bg-amber-900/20'}
      `}
    >
       {label}
    </button>
  );

  const StyleChip = ({ label, icon: Icon }: { label: string, icon: any }) => (
      <button 
        onClick={() => handleStyleInject(label)}
        className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] text-slate-400 hover:text-white flex items-center gap-1.5 transition-all whitespace-nowrap"
      >
          <Icon size={10} className={
              activeCore === 'TITAN' ? "text-red-400" : 
              activeCore === 'QUANTUM' ? "text-purple-400" : "text-amber-400"
          } /> + {label}
      </button>
  );

  const CoreSelector = () => (
      <div className="mb-6 space-y-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
             <BrainCircuit size={12} /> Neural Core
          </div>
          
          <button 
            onClick={() => setActiveCore('NEXUS')}
            className={`w-full text-left p-2 rounded border transition-all ${activeCore === 'NEXUS' ? 'bg-amber-900/20 border-amber-500 text-amber-400' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300'}`}
          >
              <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider">NEXUS-7</span>
                  {activeCore === 'NEXUS' && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"/>}
              </div>
              <div className="text-[9px] opacity-70 mt-1 font-mono">Capacity: Rapid | Speed: 100%</div>
          </button>

          <button 
            onClick={() => setActiveCore('TITAN')}
            className={`w-full text-left p-2 rounded border transition-all ${activeCore === 'TITAN' ? 'bg-red-900/20 border-red-500 text-red-400' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300'}`}
          >
              <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider">TITAN-X</span>
                  {activeCore === 'TITAN' && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"/>}
              </div>
              <div className="text-[9px] opacity-70 mt-1 font-mono">Capacity: Deep Reasoning | Logic: 100%</div>
          </button>

          <button 
            onClick={() => setActiveCore('QUANTUM')}
            className={`w-full text-left p-2 rounded border transition-all ${activeCore === 'QUANTUM' ? 'bg-purple-900/20 border-purple-500 text-purple-400' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300'}`}
          >
              <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider">QUANTUM-Z</span>
                  {activeCore === 'QUANTUM' && <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"/>}
              </div>
              <div className="text-[9px] opacity-70 mt-1 font-mono">Capacity: Imagination | Experimental</div>
          </button>
      </div>
  );

  if (booting) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-amber-500 font-mono">
         <div className="text-center">
            <div className="text-4xl font-bold tracking-[0.5em] animate-pulse mb-4">V6000</div>
            <div className="text-xs text-amber-800">LOADING CORE MODULES...</div>
            <div className="mt-8 w-64 h-1 bg-gray-900 mx-auto overflow-hidden">
                <div className="h-full bg-amber-600 w-full animate-[translateX_1s_ease-in-out_infinite]" style={{ transformOrigin: 'left' }}></div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#020202] text-slate-300 font-sans flex overflow-hidden relative">
      <NeuralBackground activeCore={activeCore} />
      
      {/* SYSTEM INSTALL MODAL */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#111] border border-green-500/30 rounded-lg max-w-sm w-full p-6 relative shadow-2xl shadow-green-900/20">
             <button onClick={() => setShowInstallModal(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white"><X size={18}/></button>
             
             <div className="flex items-center gap-3 mb-4 text-green-400">
               <DownloadCloud size={24} />
               <h2 className="text-lg font-bold tracking-wider uppercase font-[Cinzel]">Install V6000</h2>
             </div>

             <p className="text-slate-400 text-xs mb-4 leading-relaxed">
               You are currently running V6000 in a browser. To install it as a native application on your device, follow these steps:
             </p>

             <div className="space-y-4">
               <div className="flex items-start gap-3 bg-white/5 p-3 rounded">
                  <div className="w-6 h-6 rounded bg-green-900/50 flex items-center justify-center text-green-400 font-bold text-xs shrink-0">1</div>
                  <div className="text-xs text-slate-300">
                    Open your <strong>Browser Menu</strong> (3 dots in top right or Share icon on iOS).
                  </div>
               </div>
               <div className="flex items-start gap-3 bg-white/5 p-3 rounded">
                  <div className="w-6 h-6 rounded bg-green-900/50 flex items-center justify-center text-green-400 font-bold text-xs shrink-0">2</div>
                  <div className="text-xs text-slate-300">
                    Select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.
                  </div>
               </div>
               <div className="flex items-start gap-3 bg-white/5 p-3 rounded">
                  <div className="w-6 h-6 rounded bg-green-900/50 flex items-center justify-center text-green-400 font-bold text-xs shrink-0">3</div>
                  <div className="text-xs text-slate-300">
                    V6000 will be installed on your app list. Launch it directly to use full screen!
                  </div>
               </div>
             </div>
             
             <button 
               onClick={() => setShowInstallModal(false)}
               className="mt-6 w-full py-2 bg-green-600 hover:bg-green-500 text-black font-bold uppercase tracking-widest text-xs rounded transition-colors"
             >
               Understood
             </button>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <div className="hidden lg:flex w-64 border-r border-white/5 bg-black/40 flex-col backdrop-blur-sm z-10">
         <div className="p-4 border-b border-white/5">
             <div className={`font-bold text-xl tracking-widest font-[Cinzel] transition-colors
                ${activeCore === 'TITAN' ? 'text-red-500' : activeCore === 'QUANTUM' ? 'text-purple-500' : 'text-amber-500'}
             `}>NEXUS</div>
             <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-1">
                 <div className={`w-2 h-2 rounded-full animate-pulse
                    ${activeCore === 'TITAN' ? 'bg-red-500' : activeCore === 'QUANTUM' ? 'bg-purple-500' : 'bg-green-500'}
                 `}></div>
                 SYSTEM OPTIMAL
             </div>
         </div>
         
         <div className="p-4 space-y-6 flex-grow overflow-hidden custom-scrollbar overflow-y-auto">
             
             {/* CORE SELECTOR ADDED HERE */}
             <CoreSelector />

             <div>
                 <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Globe size={12} className="text-blue-500 animate-pulse" /> Live Trend Sync
                 </div>
                 <div className="text-[9px] font-mono text-blue-400/80 mb-2">
                     Source: Global Wide Web<br/>
                     Status: <span className="text-green-500">CONNECTED</span>
                 </div>
                 <CpuGraph activeCore={activeCore} />
             </div>
             <div>
                 <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Network size={12} /> Neural Stream
                 </div>
                 <div className="h-24 border border-white/5 bg-black/50 p-2 rounded">
                     <HexStream />
                 </div>
             </div>
             <div>
                 <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Wifi size={12} /> Uplink
                 </div>
                 <div className="text-xs font-mono text-slate-600">
                     Latency: 12ms<br/>
                     Packets: 4092/s<br/>
                     Encryption: AES-256
                 </div>
             </div>
         </div>

         <div className="p-4 border-t border-white/5 text-[9px] text-slate-600 font-mono">
             ID: USER_ALPHA_01<br/>
             SESSION: SECURE
         </div>
      </div>

      {/* CENTER - CHAT */}
      <div className={`flex-grow flex flex-col relative z-10 transition-all duration-500 ${showPreview ? 'w-1/3' : 'w-full'}`}>
        
        {/* Header */}
        <header className="h-16 border-b border-white/5 bg-black/20 backdrop-blur flex items-center px-6 justify-between">
            <div className={`flex items-center gap-2 transition-colors ${activeCore === 'TITAN' ? 'text-red-500/80' : activeCore === 'QUANTUM' ? 'text-purple-500/80' : 'text-amber-500/80'}`}>
                <Terminal size={16} />
                <span className="text-xs font-mono tracking-[0.2em] uppercase">Command Interface [{activeCore}]</span>
            </div>
            <div className="flex items-center gap-4">
               {loading && <span className={`text-xs font-mono animate-pulse ${activeCore === 'TITAN' ? 'text-red-500' : activeCore === 'QUANTUM' ? 'text-purple-500' : 'text-amber-500'}`}>{loadingText}</span>}
               
               {/* NEW INSTALL BUTTON */}
               <button 
                  onClick={() => setShowInstallModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-900/20 border border-green-900/50 rounded hover:bg-green-900/40 transition-colors group"
               >
                   <DownloadCloud size={14} className="text-green-500 group-hover:animate-bounce" />
                   <span className="text-[10px] font-bold text-green-400 uppercase hidden sm:inline">Install System</span>
               </button>

               <button onClick={() => window.location.reload()}><Power size={18} className="text-red-900 hover:text-red-500" /></button>
            </div>
        </header>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-4 space-y-6 custom-scrollbar" ref={scrollRef}>
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded p-4 border ${msg.role === 'user' ? 'bg-white/5 border-white/10' : 'bg-[#08080a] border-white/5'}`}>
                        <div className="text-[10px] font-mono opacity-50 mb-2 uppercase tracking-widest">
                            {msg.role === 'user' ? '> CREATOR INPUT' : '> NEXUS OUTPUT'}
                        </div>
                        <div className="whitespace-pre-wrap text-sm font-light leading-relaxed font-[Rajdhani]">
                            {msg.content}
                        </div>
                        {msg.snippets?.map((s, i) => (
                            <div key={i} className="mt-4 border border-green-900/30 bg-green-950/5 rounded p-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-green-500 font-mono">{s.filename}</span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => { setActiveAppCode(s.code); setViewMode('build'); setShowPreview(true); }}
                                            className="px-2 py-1 bg-blue-900/20 text-blue-400 text-[10px] uppercase font-bold border border-blue-900/50 hover:bg-blue-500 hover:text-black transition-colors flex items-center gap-1"
                                        >
                                            <Package size={10} /> BUILD APK
                                        </button>
                                        {s.isRunnable && (
                                            <button 
                                                onClick={() => { setActiveAppCode(s.code); setViewMode('preview'); setShowPreview(true); }}
                                                className="px-2 py-1 bg-green-900/20 text-green-400 text-[10px] uppercase font-bold border border-green-900/50 hover:bg-green-500 hover:text-black transition-colors"
                                            >
                                                RUN
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {!s.isRunnable && <div className="text-[10px] font-mono text-slate-500 truncate">{s.code.substring(0,50)}...</div>}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5 bg-black/60 backdrop-blur">
            {/* Style Injectors */}
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar mb-2 px-1">
                <StyleChip label="Glassmorphism" icon={Sparkles} />
                <StyleChip label="Cyberpunk" icon={Zap} />
                <StyleChip label="Mobile Native" icon={Smartphone} />
                <StyleChip label="Animations" icon={Wand2} />
                <StyleChip label="Database" icon={Database} />
                <StyleChip label="Sound FX" icon={Music} />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar border-b border-white/5 mb-3">
                <QuickAction label="Trending Game" prompt="Search for the latest trending simple game and build a version of it." />
                <QuickAction label="Chat App" prompt="Create a WhatsApp-style chat app." />
                <QuickAction label="Video Player" prompt="Create a modern video player UI." />
            </div>
            <div className={`flex items-center gap-3 bg-[#0a0a0c] border border-white/10 p-3 rounded transition-colors ${
                activeCore === 'TITAN' ? 'hover:border-red-500/30' : 
                activeCore === 'QUANTUM' ? 'hover:border-purple-500/30' : 
                'hover:border-amber-500/30'
            }`}>
                <Activity size={16} className={`${loading ? 'animate-spin' : ''} ${activeCore === 'TITAN' ? 'text-red-500' : activeCore === 'QUANTUM' ? 'text-purple-500' : 'text-amber-500'}`} />
                <input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder={`Command ${activeCore} Core...`}
                    className={`flex-grow bg-transparent border-none outline-none font-mono text-sm placeholder:text-slate-700 ${activeCore === 'TITAN' ? 'text-red-100' : activeCore === 'QUANTUM' ? 'text-purple-100' : 'text-amber-100'}`}
                    disabled={loading}
                />
                <button onClick={() => handleSendMessage()} disabled={loading}>
                    <Send size={16} className={`${activeCore === 'TITAN' ? 'text-red-600 hover:text-red-400' : activeCore === 'QUANTUM' ? 'text-purple-600 hover:text-purple-400' : 'text-amber-600 hover:text-amber-400'}`} />
                </button>
            </div>
        </div>
      </div>

      {/* RIGHT - PREVIEW / IDE / BUILDER */}
      {showPreview && (
          <div className="w-full md:w-1/2 lg:w-[45%] border-l border-white/10 bg-[#050505] flex flex-col z-20 shadow-2xl animate-in slide-in-from-right">
              {/* Tool Bar */}
              <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#0a0a0c]">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                        <Shield size={12} /> ANDROID_STUDIO_V2.1
                    </span>
                    <div className="flex bg-black/50 rounded border border-white/10 p-0.5">
                        <button 
                            onClick={() => setViewMode('preview')}
                            className={`px-3 py-1 text-[10px] uppercase font-bold rounded flex items-center gap-1.5 transition-all ${viewMode === 'preview' ? 'bg-green-900/30 text-green-400' : 'text-slate-500 hover:text-white'}`}
                        >
                            <Play size={10} /> Preview
                        </button>
                        <button 
                            onClick={() => setViewMode('code')}
                            className={`px-3 py-1 text-[10px] uppercase font-bold rounded flex items-center gap-1.5 transition-all ${viewMode === 'code' ? 'bg-amber-900/30 text-amber-400' : 'text-slate-500 hover:text-white'}`}
                        >
                            <Code size={10} /> Source
                        </button>
                        <button 
                            onClick={() => setViewMode('build')}
                            className={`px-3 py-1 text-[10px] uppercase font-bold rounded flex items-center gap-1.5 transition-all ${viewMode === 'build' ? 'bg-blue-900/30 text-blue-400' : 'text-slate-500 hover:text-white'}`}
                        >
                            <Package size={10} /> Build
                        </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {viewMode === 'code' && (
                        <button onClick={handleRecompile} className="text-green-500 hover:text-green-300 flex items-center gap-1 px-2 py-1 bg-green-900/10 border border-green-900/30 rounded text-[10px] uppercase font-bold">
                            <RotateCw size={10} /> Recompile
                        </button>
                    )}
                    <button onClick={() => setShowPreview(false)} className="text-slate-500 hover:text-white p-1.5 hover:bg-white/5 rounded"><Activity size={14}/></button>
                  </div>
              </div>

              {/* Content Area */}
              <div className="flex-grow flex items-center justify-center bg-[#0d0d10] relative overflow-hidden">
                  
                  {/* PREVIEW MODE */}
                  {viewMode === 'preview' && (
                     <div className="relative w-[360px] h-[700px] bg-black border-[6px] border-[#222] rounded-[30px] shadow-2xl overflow-hidden ring-1 ring-white/10 scale-90 sm:scale-100 transition-transform">
                          {activeAppCode && (
                              <iframe 
                                srcDoc={activeAppCode}
                                className="w-full h-full"
                                title="Preview"
                              />
                          )}
                      </div>
                  )}

                  {/* CODE MODE */}
                  {viewMode === 'code' && (
                      <div className="absolute inset-0 flex flex-col">
                          <textarea 
                              value={editableCode}
                              onChange={(e) => setEditableCode(e.target.value)}
                              className="flex-grow w-full h-full bg-[#0a0a0c] text-green-400 font-mono text-xs p-4 outline-none resize-none border-none custom-scrollbar"
                              spellCheck={false}
                          />
                      </div>
                  )}

                  {/* BUILD MODE (APK Simulation + Deploy) */}
                  {viewMode === 'build' && (
                      <div className="absolute inset-0 flex flex-col p-6 bg-[#08080a]">
                          <div className="flex-grow border border-white/10 bg-black rounded p-4 font-mono text-xs overflow-y-auto mb-4" ref={buildLogRef}>
                              <div className="text-slate-500 mb-2">/usr/bin/gradle build --release</div>
                              {buildLogs.length === 0 && !isBuilding && !buildComplete && (
                                  <div className="text-slate-600 mt-4 text-center">Ready to build package. Click 'Start Build' to begin.</div>
                              )}
                              {buildLogs.map((log, i) => (
                                  <div key={i} className={`${log.includes('SUCCESSFUL') ? 'text-green-400' : 'text-slate-300'}`}>{log}</div>
                              ))}
                              {isBuilding && <div className="animate-pulse text-amber-500">_</div>}
                          </div>
                          
                          {/* Build Controls */}
                          <div className="border-t border-white/10 pt-4">
                              <div className="flex justify-between items-center mb-4">
                                  <div className="text-xs text-slate-400">
                                      {isBuilding ? 'Compiling Resources...' : buildComplete ? 'Build Complete' : 'Status: Idle'}
                                  </div>
                                  <div className="text-xs text-slate-400">{buildProgress}%</div>
                              </div>
                              <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-6">
                                  <div className={`h-full transition-all duration-300 ${activeCore === 'TITAN' ? 'bg-red-500' : activeCore === 'QUANTUM' ? 'bg-purple-500' : 'bg-green-500'}`} style={{ width: `${buildProgress}%` }}></div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                  {!isBuilding && !buildComplete && (
                                      <button 
                                          onClick={startBuildProcess}
                                          className="col-span-2 py-3 bg-blue-900/20 border border-blue-900/50 hover:bg-blue-600 hover:text-black text-blue-400 font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                                      >
                                          <Play size={14} /> Start Build
                                      </button>
                                  )}
                              </div>

                              {/* DEPLOYMENT & INSTALL CARD */}
                              {buildComplete && (
                                  <div className="mt-4 animate-in fade-in slide-in-from-bottom-4">
                                      <div className="bg-[#111] border border-white/10 rounded-lg p-4">
                                          <div className="flex items-center gap-2 mb-3 text-white font-bold text-xs uppercase tracking-widest">
                                              <Smartphone size={14} className="text-green-500" />
                                              Installation Guide
                                          </div>
                                          
                                          <div className="space-y-3">
                                              {/* Step 1: Download */}
                                              <div className="flex items-center gap-3">
                                                  <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-[10px] font-mono">1</div>
                                                  <button 
                                                    onClick={() => handleDownload(activeAppCode!, 'nexus_universal_app.html')}
                                                    className="flex-grow text-left px-3 py-2 bg-green-900/20 hover:bg-green-900/30 border border-green-900/50 rounded flex items-center justify-between group transition-all"
                                                  >
                                                      <span className="text-[10px] text-green-400 font-bold uppercase">Download App File</span>
                                                      <Download size={12} className="text-green-500 group-hover:scale-110 transition-transform" />
                                                  </button>
                                              </div>

                                              {/* Step 2: Transfer */}
                                              <div className="flex items-center gap-3">
                                                  <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-[10px] font-mono">2</div>
                                                  <div className="flex-grow text-[10px] text-slate-400">
                                                      Send file to your phone <span className="text-slate-600">(WhatsApp / Email)</span>
                                                  </div>
                                                  <Share2 size={12} className="text-slate-600" />
                                              </div>

                                              {/* Step 3: Install */}
                                              <div className="flex items-center gap-3">
                                                  <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-[10px] font-mono">3</div>
                                                  <div className="flex-grow text-[10px] text-slate-400">
                                                      Open in Chrome & Tap <span className="text-white font-bold">"Add to Home Screen"</span>
                                                  </div>
                                                  <ArrowRight size={12} className="text-slate-600" />
                                              </div>
                                          </div>
                                      </div>

                                      <button 
                                          onClick={handleDeploy}
                                          disabled={isDeploying || !!deployedUrl}
                                          className={`w-full mt-3 py-2 font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 border rounded
                                              ${deployedUrl 
                                                  ? 'bg-purple-900/10 border-purple-500/30 text-purple-400 cursor-default' 
                                                  : 'bg-black border-white/10 text-slate-500 hover:text-white'}
                                          `}
                                      >
                                          {isDeploying ? <Loader2 size={12} className="animate-spin" /> : deployedUrl ? <Rocket size={12} /> : <Cloud size={12} />}
                                          {isDeploying ? 'Deploying...' : deployedUrl ? 'Deployed to Cloud (Sim)' : 'Alternative: Cloud Deploy'}
                                      </button>

                                      {deployedUrl && (
                                          <div className="mt-2 text-center text-[9px] text-purple-400 font-mono animate-pulse">
                                              {deployedUrl}
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

export default App;
