import React, { useState } from 'react';
import { ShieldAlert, Activity, FileText, Search, Terminal, Lock, User } from 'lucide-react';
import JobAnalyzer from './components/JobAnalyzer';
import Chatbot from './components/Chatbot';
import BackgroundEffects from './components/BackgroundEffects';
import OsintSearch from './components/OsintSearch';
import LiveTerminal from './components/LiveTerminal';

export default function App() {
  const [activeTab, setActiveTab] = useState('analyzer');
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('jg_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [logs, setLogs] = useState<any[]>(() => [
    { id: '1', type: 'info', timestamp: new Date().toISOString(), message: 'JOBGUARD_CORE OS [VERSION 2.0.4] INITIALIZED.' },
    { id: '2', type: 'debug', timestamp: new Date().toISOString(), message: 'ESTABLISHING SECURE TUNNEL TO INTELLIGENCE CLUSTERS...' },
    { id: '3', type: 'success', timestamp: new Date().toISOString(), message: 'GROQ_MODEL/LLAMA_3.3_70B: CONNECTED.' },
    { id: '4', type: 'success', timestamp: new Date().toISOString(), message: 'CYBER_THREAT_API/VIRUSTOTAL: READY.' },
    { id: '5', type: 'success', timestamp: new Date().toISOString(), message: 'ENSEMBLE_ML/HUGGINGFACE: SYNCHRONIZED.' },
    { id: '6', type: 'info', timestamp: new Date().toISOString(), message: 'SYSTEM STATUS: OPTIMAL. LISTENING FOR ANALYSIS TRIGGERS...' }
  ]);

  React.useEffect(() => {
    const bc = new BroadcastChannel('jobguard_logs');
    bc.onmessage = (event) => {
      const newLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...event.data
      };
      setLogs(prev => [...prev.slice(-100), newLog]);
    };
    return () => bc.close();
  }, []);

  const saveToHistory = (result: any, jobUrl: string) => {
    const newEntry = {
      id: `CASE-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      company: result.company_name || 'UNKNOWN',
      verdict: result.verdict,
      score: result.fraud_score,
      url: jobUrl || 'N/A',
      location: result.location,
      title: result.job_title
    };
    const updatedHistory = [newEntry, ...history].slice(0, 50);
    setHistory(updatedHistory);
    localStorage.setItem('jg_history', JSON.stringify(updatedHistory));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'analyzer':
        return <JobAnalyzer onAnalysisComplete={saveToHistory} />;
      case 'dashboard':
        return (
          <div className="h-full flex flex-col font-mono max-w-4xl mx-auto w-full">
            {/* Ambient glow */}
            <div className="relative">
              <div
                className="absolute inset-0 -z-10 rounded-[20px]"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, rgba(239, 68, 68, 0.1), transparent 60%)`,
                  filter: 'blur(40px)',
                  transform: 'scale(1.1)',
                }}
              />

              {/* Glass header card */}
              <div
                className="mb-8 text-center flex flex-col items-center p-8"
                style={{
                  background: 'rgba(10, 10, 10, 0.6)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                }}
              >
                <h2 className="text-2xl font-bold uppercase tracking-[0.3em] mb-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Threat Intelligence Dashboard</h2>
                <div className="h-px w-20 bg-[#ef4444] mb-2" />
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>Real-time log of local investigations and security anomalies.</p>
                {history.length > 0 && (
                  <button
                    onClick={() => { setHistory([]); localStorage.removeItem('jg_history'); }}
                    className="mt-4 px-5 py-2 text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer"
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      borderRadius: '20px',
                      color: 'rgba(239, 68, 68, 0.6)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = 'rgba(239, 68, 68, 0.9)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.color = 'rgba(239, 68, 68, 0.6)'; }}
                  >
                    ⌫ PURGE_RECORDS
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="grid grid-cols-1 gap-3">
                {history.length > 0 ? (
                  history.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer group relative overflow-hidden transition-all duration-300"
                      style={{
                        background: 'rgba(10, 10, 10, 0.5)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.15)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.06)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div className="absolute top-0 left-0 w-[2px] h-full bg-[#ef4444] opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderRadius: '2px 0 0 2px' }} />
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 w-full md:w-auto">
                        <div className="text-[10px] font-bold tracking-tighter w-auto md:w-20 flex flex-row md:flex-col gap-2 md:gap-0" style={{ color: 'rgba(255, 255, 255, 0.25)' }}>
                          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                          <span style={{ color: 'rgba(255, 255, 255, 0.12)' }}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold uppercase tracking-wide truncate max-w-full md:max-w-[200px]" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{item.company}</div>
                          <div className="text-[10px] mt-0.5 truncate max-w-[200px] md:max-w-[250px] italic font-sans" style={{ color: 'rgba(255, 255, 255, 0.2)' }}>{item.url}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 md:gap-8 flex-shrink-0 mt-3 md:mt-0">
                        <div className="text-right">
                          <div className={`text-xs font-bold font-mono tracking-widest uppercase ${
                            item.verdict === 'SAFE' ? 'text-[#22c55e]' : 
                            item.verdict === 'SUSPICIOUS' ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                          }`}>
                            {item.verdict}
                          </div>
                          <div className="text-[10px] mt-1 tracking-[0.2em] font-bold uppercase" style={{ color: 'rgba(255, 255, 255, 0.12)' }}>Score: {item.score}/100</div>
                        </div>
                        <div className="text-[#1a1a1a] group-hover:text-[#ef4444] transition-colors hidden md:block">
                          <Activity className="w-5 h-5 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20" style={{ opacity: 0.08 }}>
                    <Activity className="w-16 h-16 mb-4" />
                    <p className="text-sm uppercase tracking-[0.3em]">NO_DATA_DETECTED</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'search':
        return <OsintSearch />;
      case 'terminal':
        return <LiveTerminal logs={logs} />;
      default:
        return <JobAnalyzer onAnalysisComplete={saveToHistory} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0a0a0a] relative z-0 text-[#f5f5f5] font-mono selection:bg-[#ef4444]/30">
      <aside className="order-last md:order-first w-full md:w-16 h-16 md:h-auto flex-shrink-0 bg-[#0a0a0a] border-t md:border-t-0 md:border-r border-[#2a2a2a] flex md:flex-col items-center justify-around md:justify-start py-0 md:py-6 z-20 shadow-[-0_0_20px_rgba(0,0,0,0.5)] md:shadow-2xl">
        <div className="hidden md:flex mb-10 text-[#ef4444]">
          <ShieldAlert className="w-7 h-7 cursor-pointer hover:scale-110 transition-transform" onClick={() => setActiveTab('analyzer')} />
        </div>
        <nav className="flex md:flex-col gap-4 md:gap-8 w-full md:w-auto flex-1 md:flex-none justify-around md:justify-start items-center">
          <button onClick={() => setActiveTab('analyzer')} className={`transition-all duration-300 p-2 md:p-0 ${activeTab === 'analyzer' ? 'text-[#ef4444] scale-110' : 'text-[#2a2a2a] hover:text-[#f5f5f5]'}`}>
            <FileText className="w-6 h-6 md:w-5 md:h-5" />
          </button>
          <button onClick={() => setActiveTab('dashboard')} className={`transition-all duration-300 p-2 md:p-0 ${activeTab === 'dashboard' ? 'text-[#ef4444] scale-110' : 'text-[#2a2a2a] hover:text-[#f5f5f5]'}`}>
            <Activity className="w-6 h-6 md:w-5 md:h-5" />
          </button>
          <button onClick={() => setActiveTab('search')} className={`transition-all duration-300 p-2 md:p-0 ${activeTab === 'search' ? 'text-[#ef4444] scale-110' : 'text-[#2a2a2a] hover:text-[#f5f5f5]'}`}>
            <Search className="w-6 h-6 md:w-5 md:h-5" />
          </button>
          <button onClick={() => setActiveTab('terminal')} className={`transition-all duration-300 p-2 md:p-0 ${activeTab === 'terminal' ? 'text-[#ef4444] scale-110' : 'text-[#2a2a2a] hover:text-[#f5f5f5]'}`}>
            <Terminal className="w-6 h-6 md:w-5 md:h-5" />
          </button>
        </nav>
        <div className="hidden md:block mt-auto text-[#2a2a2a]">
          <button className="hover:text-[#f5f5f5] transition-colors"><Lock className="w-5 h-5" /></button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 z-10 overflow-hidden h-[calc(100vh-4rem)] md:h-screen">
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-md flex-shrink-0">
          <div className="font-mono text-[8px] md:text-[9px] font-bold tracking-[0.3em] md:tracking-[0.5em] uppercase text-[#737373] flex items-center">
            <span className="hidden sm:inline">JOB_GUARD_SYSTEM </span>
            <span className="sm:hidden">JG_SYS </span>
            <span className="mx-2 md:mx-4 text-[#1a1a1a]">||</span> 
            <span className="text-[#f5f5f5] animate-pulse truncate max-w-[100px] sm:max-w-none">{activeTab.toUpperCase().replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]"></div>
              <span className="font-mono text-[9px] text-[#737373] tracking-widest font-bold">CORE_ENVELOPE_SECURE</span>
            </div>
            <div className="w-8 h-8 rounded-sm border border-[#2a2a2a] flex items-center justify-center text-[#2a2a2a] hover:text-[#f5f5f5] hover:border-[#f5f5f5] transition-all cursor-crosshair">
              <User className="w-4 h-4" />
            </div>
          </div>
        </header>

        <main className="flex-1 bg-[#050505] p-4 md:p-6 lg:p-12 overflow-y-auto relative z-0 scrollbar-thin scrollbar-thumb-[#1a1a1a]">
          <BackgroundEffects />
          <div className="h-full animate-in fade-in duration-700">
            {renderContent()}
          </div>
        </main>
      </div>

      <Chatbot />
    </div>
  );
}
