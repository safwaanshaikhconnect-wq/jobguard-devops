import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, ShieldCheck, Cpu, Database, Globe, Command } from 'lucide-react';

interface LogEntry {
  id: string;
  type: 'info' | 'warn' | 'error' | 'success' | 'debug';
  message: string;
  timestamp: string;
}

interface LiveTerminalProps {
  logs: LogEntry[];
}

export default function LiveTerminal({ logs }: LiveTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-[#22c55e]';
      case 'warn': return 'text-[#f59e0b]';
      case 'error': return 'text-[#ef4444]';
      case 'debug': return 'text-[#737373]';
      default: return 'text-[#f5f5f5]';
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return <ShieldCheck className="w-3 h-3" />;
      case 'debug': return <Cpu className="w-3 h-3" />;
      case 'info': return <Globe className="w-3 h-3" />;
      default: return <Command className="w-3 h-3" />;
    }
  };

  return (
    <div className="h-full flex flex-col font-mono bg-[#050505] border border-[#1a1a1a] rounded-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
      {/* Terminal Header */}
      <div className="bg-[#0a0a0a] px-3 md:px-4 py-2 md:py-3 border-b border-[#1a1a1a] flex flex-col md:flex-row items-start md:items-center justify-between select-none gap-2 md:gap-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3 h-3 md:w-4 md:h-4 text-[#ef4444]" />
          <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.4em] font-bold text-[#f5f5f5]">RAW_INTELLIGENCE_STREAM_v.2.0</span>
        </div>
        <div className="flex items-center gap-2 md:gap-6 text-[8px] md:text-[9px] uppercase tracking-widest text-[#2a2a2a] font-bold">
            <span className="flex items-center gap-1 md:gap-2 text-[#22c55e]"><div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" /> SENSOR_ARMED</span>
            <span className="hidden sm:inline">NODE_ID: JG-4491</span>
            <span className="text-[#f5f5f5] bg-[#ef4444] px-1.5 py-0.5 rounded-[2px] ml-auto md:ml-0">SECURE</span>
        </div>
      </div>

      {/* Terminal Buffer */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 md:space-y-1.5 bg-[#050505] scrollbar-thin scrollbar-thumb-[#1a1a1a]"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex flex-col md:flex-row gap-1 md:gap-4 text-[10px] md:text-[11px] leading-relaxed group hover:bg-[#111111]/50 transition-colors py-1 md:py-0.5 relative pl-2 md:pl-0">
            <div className="absolute left-0 top-0 w-[1px] h-full bg-[#ef4444] opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-[#1a1a1a] select-none font-bold tabular-nums">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
            <span className={`flex items-center gap-3 ${getLogColor(log.type)}`}>
              <span className="opacity-30">{getLogIcon(log.type)}</span>
              <span className="font-bold uppercase tracking-tighter w-14">[{log.type}]</span>
              <span className="tracking-widest filter brightness-125">{log.message}</span>
            </span>
          </div>
        ))}
        {/* Blinking Cursor */}
        <div className="flex gap-4 text-[11px] py-2">
          <span className="text-[#1a1a1a] font-bold">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
          <div className="w-2 h-4 bg-[#ef4444] animate-pulse shadow-[0_0_8px_#ef4444]" />
        </div>
      </div>

      {/* Footer / Stats */}
      <div className="bg-[#0a0a0a] px-3 md:px-5 py-2 border-t border-[#1a1a1a] flex flex-wrap gap-4 md:gap-10 select-none opacity-40">
        <div className="flex items-center gap-2">
          <Database className="w-3 h-3 text-[#737373]" />
          <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-bold">Buffer: {logs.length}/100</span>
        </div>
        <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3 text-[#737373]" />
            <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-bold font-mono">Kernel_0.4.1</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
            <Command className="w-3 h-3 text-[#737373]" />
            <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-bold truncate max-w-[80px] md:max-w-none">X86_64_INST_READY_V2</span>
        </div>
      </div>
    </div>
  );
}
