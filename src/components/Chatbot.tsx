import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API_BASE_URL } from '../config';
export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, text: string}[]>([
    { role: 'model', text: 'SYSTEM ONLINE. JobGuard Assistant ready. Input query or suspicious data.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', text: data.reply || 'ERROR: No response from server.' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'ERROR: Connection to analysis server lost.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-6 right-6 bg-primary text-primary-foreground p-4 border border-[var(--color-border)] hover:bg-red-600 transition-colors z-50 flex items-center justify-center rounded-full md:rounded-none shadow-lg md:shadow-none"
        aria-label="Open Chat"
      >
        <MessageSquare size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-24 md:bottom-24 right-4 md:right-6 w-[calc(100vw-2rem)] sm:w-80 md:w-96 bg-[var(--color-card)] border border-[var(--color-border)] flex flex-col overflow-hidden z-50 rounded-lg md:rounded-none shadow-2xl"
            style={{ height: '500px', maxHeight: 'calc(100vh - 8rem)' }}
          >
            <div className="bg-[var(--color-surface)] p-4 border-b border-[var(--color-border)] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-primary" size={20} />
                <h3 className="font-mono font-bold text-sm tracking-widest uppercase text-[var(--color-foreground)]">Terminal</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--color-background)]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 text-sm font-mono whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-[var(--color-surface)] text-[var(--color-foreground)] border border-[var(--color-border)]' 
                      : 'bg-[var(--color-card)] text-[var(--color-foreground)] border border-[var(--color-border)] border-l-2 border-l-primary'
                  }`}>
                    {msg.role === 'model' && <div className="text-[10px] text-primary mb-1 uppercase tracking-widest">SYS_MSG</div>}
                    {msg.role === 'user' && <div className="text-[10px] text-[var(--color-muted-foreground)] mb-1 uppercase tracking-widest text-right">USR_INPUT</div>}
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--color-card)] border border-[var(--color-border)] border-l-2 border-l-primary p-3 flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span className="text-sm font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">Processing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter query..."
                  className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] px-4 py-2 text-sm font-mono focus:outline-none focus:border-primary text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]"
                />
                <button 
                  type="submit" 
                  disabled={isLoading || !input.trim()}
                  className="bg-primary text-primary-foreground p-2 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10 transition-colors"
                >
                  <Send size={18} className="ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
