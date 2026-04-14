import React, { useState, useRef } from 'react';
import { Shield, AlertTriangle, XOctagon, CheckCircle2, XCircle, Loader2, Link as LinkIcon, FileText, ChevronRight, ClipboardCheck, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { API_BASE_URL } from '../config';

interface Check {
  name: string;
  status: 'pass' | 'fail' | 'unknown';
  detail: string;
}

interface AnalysisResult {
  verdict: 'SAFE' | 'SUSPICIOUS' | 'HIGH RISK';
  fraud_score: number;
  checks: Check[];
  red_flags: string[];
  green_flags: string[];
  summary: string;
  company_name?: string;
  job_title?: string;
  salary?: string;
  location?: string;
  contact_email?: string;
}

export default function JobAnalyzer({ onAnalysisComplete }: { onAnalysisComplete?: (result: any, url: string) => void }) {
  const [jobText, setJobText] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  // New States for Verification Request System
  const [evidenceInputs, setEvidenceInputs] = useState<Record<string, string>>({});
  const [reloading, setReloading] = useState(false);
  const [isFinalVerdict, setIsFinalVerdict] = useState(false);
  const caseIdRef = useRef(`CASE-${Math.floor(1000 + Math.random() * 9000)}-IDENTIFIED`);

  const emitLog = (type: 'info' | 'warn' | 'error' | 'success' | 'debug', message: string) => {
    const bc = new BroadcastChannel('jobguard_logs');
    bc.postMessage({ type, message, timestamp: new Date().toISOString() });
    bc.close();
  };

  const handleAnalyze = async () => {
    if (!jobText.trim() && !jobUrl.trim()) {
      setError('Please provide either a job description or a URL.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setIsFinalVerdict(false);
    setEvidenceInputs({});

    emitLog('info', `PHASE_1: INITIATING MULTI-SENSOR ANALYSIS FOR TARGET...`);

    try {
      const res = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_text: jobText, job_url: jobUrl })
      });
      if (!res.ok) throw new Error(`Backend Error ${res.status}: Analysis connection established but rejected.`);
      const fetchedData = await res.json();
      emitLog('success', 'ALL SENSORS: DATA AGGREGATION SUCCESSFUL.');
      setResult(fetchedData);
if (onAnalysisComplete) {
        onAnalysisComplete(fetchedData, jobUrl);
      }
    } catch (err: any) {
      console.error(err);
      emitLog('error', `FATAL: CONNECTION_LOST_TO_CORE_SOCKET. Error: ${err?.message || err}`);
      setError(`Failed to analyze: ${err?.message || 'Unknown error'}. Please check your API key.`);
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    const hasAnyInput = Object.values(evidenceInputs).some(val => (val as string).trim().length > 0);
    if (!hasAnyInput) {
      emitLog('error', 'INSUFFICIENT_DATA: Provide at least one verification input to proceed');
      return;
    }

    setReloading(true);
    emitLog('info', 'FINAL_VERDICT_PROTOCOL: PROCESSING NEW EVIDENCE...');

    try {
      const res = await fetch(`${API_BASE_URL}/reanalyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          job_text: jobText, 
          job_url: jobUrl,
          evidence: evidenceInputs,
          company_name: result?.company_name,
          job_title: result?.job_title,
          salary: result?.salary,
          location: result?.location,
          contact_email: result?.contact_email
        })
      });
      
      if (!res.ok) throw new Error('Reanalysis failed');
      const data = await res.json();
      
      setResult(data);
      setIsFinalVerdict(true);
      emitLog('success', 'INVESTIGATION_CLOSED: FINAL_VERDICT_ESTABLISHED.');
      
      // Scroll to top to show final result
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      emitLog('error', 'SYSTEM_FAILURE during evidence reprocessed.');
    } finally {
      setReloading(false);
    }
  };

  const getRequestedItems = () => {
    if (!result) return [];
    const items = [];
    
    const mcaFailed = result.checks.some(c => c.name.includes('MCA') && c.status === 'fail');
    const emailFailed = result.checks.some(c => c.name.includes('Email') && c.status === 'fail');
    const domainFailed = result.checks.some(c => c.name.includes('Domain') && c.status === 'fail');
    const aiFailed = result.checks.some(c => (c.name.includes('AI Pattern') || c.name.includes('Ensemble')) && c.status === 'fail');
    const salaryFailed = result.checks.some(c => c.name.includes('Salary') && c.status === 'fail');
    
    if (mcaFailed) {
      items.push({ id: 'cin', label: 'Company CIN number (Find at mca.gov.in)', placeholder: 'U12345KA2023PTC123456' });
      items.push({ id: 'linkedin', label: 'Screenshot/Link of company LinkedIn page', placeholder: 'linkedin.com/company/example' });
    }
    if (emailFailed) {
      items.push({ id: 'website', label: 'Official company website URL', placeholder: 'https://corporate-site.com' });
      items.push({ id: 'email_comm', label: 'Any official email communication received', placeholder: 'Paste email headers or content here' });
    }
    if (domainFailed) {
      items.push({ id: 'cert', label: 'Company registration certificate', placeholder: 'Paste certificate details or description' });
      items.push({ id: 'offer', label: 'Any official offer letter details', placeholder: 'Document ID or signature details' });
    }
    if (salaryFailed) {
      items.push({ id: 'role_exp', label: 'Industry role and years of experience', placeholder: 'e.g. Senior Backend, 5 years' });
      items.push({ id: 'location_input', label: 'Specific office location verification', placeholder: 'e.g. Building Name, Sector' });
    }
    if (aiFailed) {
      items.push({ id: 'orig_url', label: 'Full original job posting URL', placeholder: 'Original site link' });
      items.push({ id: 'recruiter', label: 'Recruiter name and phone number', placeholder: 'Name/Phone from WhatsApp or call' });
    }

    // Default items if score is suspicious but no specific failures (e.g. salary high)
    if (items.length === 0) {
      items.push({ id: 'role_exp', label: 'Industry role and years of experience', placeholder: 'e.g. Senior Backend, 5 years' });
      items.push({ id: 'location_input', label: 'Job Location Verification', placeholder: 'Specific office floor/building' });
    }

    return items;
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'SAFE': return 'text-[#22c55e] border-[#22c55e]';
      case 'SUSPICIOUS': return 'text-[#f59e0b] border-[#f59e0b]';
      case 'HIGH RISK': return 'text-[#ef4444] border-[#ef4444]';
      default: return 'text-[#737373] border-[#2a2a2a]';
    }
  };

  if (!result) {
    const wordCount = jobText.trim() ? jobText.trim().split(/\s+/).length : 0;
    const charCount = jobText.length;

    return (
      <div className="w-full max-w-3xl mx-auto mt-10">
        
        {/* Main Application Header */}
        <div className="mb-6 md:mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-[0.2em] mb-2 flex items-center justify-center gap-2 md:gap-3 px-2" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
            <Shield className="w-6 h-6 md:w-8 md:h-8 text-[#ef4444] flex-shrink-0" />
            <span className="truncate">JOB_GUARD_<span className="text-[#ef4444]">CORE</span></span>
          </h1>
          <p className="text-xs tracking-widest uppercase font-mono" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            Automated Employment Fraud Detection Matrix
          </p>
        </div>

        {/* Ambient glow behind the glass card */}
        <div className="relative">
          <div
            className="absolute inset-0 -z-10 rounded-[20px]"
            style={{
              background: `radial-gradient(ellipse at 70% 40%, rgba(239, 68, 68, 0.15), transparent 70%),
                           radial-gradient(ellipse at 30% 70%, rgba(200, 40, 40, 0.1), transparent 70%)`,
              filter: 'blur(40px)',
              transform: 'scale(1.15)',
            }}
          />

          {/* Glass card */}
          <div
            className="relative flex-1 flex flex-col p-5 md:p-8 w-full max-w-full"
            style={{
              background: 'rgba(10, 10, 10, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
            }}
          >
            <div className="mb-6">
              <div className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: 'rgba(239, 68, 68, 0.8)' }}>[ INVESTIGATION ]</div>
              <h2 className="text-2xl font-mono font-bold uppercase tracking-tight mb-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>SUBMIT TARGET</h2>
              <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.35)' }}>Paste a job posting URL or description to begin fraud analysis</p>
            </div>

            <div className="space-y-4">
              {/* URL Input — glass-matched */}
              <div
                className="flex items-center px-4 py-3 transition-all"
                style={{
                  background: 'rgba(5, 5, 5, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                }}
              >
                <span className="font-mono text-xs md:text-sm mr-2 md:mr-3 whitespace-nowrap" style={{ color: 'rgba(239, 68, 68, 0.7)' }}>URL &gt;</span>
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://company.com/careers/job-post"
                  className="w-full bg-transparent text-xs md:text-sm font-mono outline-none min-w-0"
                  style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                />
              </div>

              <div className="text-center font-mono text-xs" style={{ color: 'rgba(255, 255, 255, 0.15)' }}>── OR ──</div>

              {/* Glassmorphism Textarea */}
              <div className="relative">
                <textarea
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  placeholder="Start writing something amazing..."
                  className="w-full resize-none text-sm font-mono outline-none"
                  style={{
                    minHeight: '300px',
                    background: 'rgba(5, 5, 5, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    paddingBottom: '48px',
                    color: 'rgba(255, 255, 255, 0.85)',
                    scrollbarWidth: 'none',
                  }}
                />

                {/* Bottom bar: word/char count + formatting hints */}
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-3"
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '0 0 12px 12px',
                    background: 'rgba(5, 5, 5, 0.4)',
                  }}
                >
                  <div className="flex items-center gap-2 md:gap-4 font-mono text-[9px] md:text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.25)' }}>
                    <span>{wordCount} words</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline">{charCount} chars</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {['B', 'I', 'U'].map((hint) => (
                      <span
                        key={hint}
                        className="flex items-center justify-center text-[10px] font-mono px-2.5 py-1 cursor-default select-none"
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '20px',
                          color: 'rgba(255, 255, 255, 0.2)',
                          fontWeight: hint === 'B' ? 700 : 400,
                          fontStyle: hint === 'I' ? 'italic' : 'normal',
                          textDecoration: hint === 'U' ? 'underline' : 'none',
                        }}
                      >
                        {hint}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full font-bold py-3.5 font-mono tracking-widest uppercase transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.7), rgba(180, 30, 30, 0.6))',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  color: 'rgba(255, 255, 255, 0.95)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.85), rgba(200, 40, 40, 0.7))'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.7), rgba(180, 30, 30, 0.6))'; }}
              >
                {error && (
                  <div className="mb-4 p-4 bg-[#ef4444]/15 border border-[#ef4444]/30 rounded-lg text-[#ef4444] text-xs font-mono animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="font-bold">SYSTEM_ERROR DETECTED</span>
                    </div>
                    {error}
                  </div>
                )}

                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : '🔒 RUN ANALYSIS'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const caseId = isFinalVerdict ? "CASE UPDATED - FINAL VERDICT" : caseIdRef.current;
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  return (
    <div className="w-full max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8">
        <div className="break-all">
          <h1 className="text-xl sm:text-3xl md:text-5xl font-mono font-bold text-white mb-2 tracking-tight uppercase">
            {caseId}
          </h1>
          <div className="flex items-center gap-2 text-[#737373] font-mono text-xs mb-3">
            <Loader2 className="w-3 h-3" />
            <span>{timestamp}</span>
            {isFinalVerdict && <span className="text-[#22c55e] ml-2 font-bold">[ DATA_VERIFIED ]</span>}
          </div>
        </div>

        <div className="mt-6 md:mt-0 flex items-start gap-8 text-right">
          <div>
            <div className="text-[#737373] font-mono text-xs tracking-widest uppercase mb-2">FRAUD SCORE</div>
            <div className="flex items-baseline justify-end gap-1 font-mono">
              <span className={`text-5xl font-bold leading-none ${result.fraud_score > 60 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>{result.fraud_score}</span>
              <span className="text-[#737373] text-lg">/100</span>
            </div>
          </div>
          <div>
            <div className="text-[#737373] font-mono text-xs tracking-widest uppercase mb-2 text-center">VERDICT</div>
            <div className={`inline-flex items-center justify-center px-4 py-2 border-2 ${getVerdictColor(result.verdict)}`}>
              <span className="text-lg font-mono font-bold tracking-widest uppercase">{result.verdict}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: CASE_FILE */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-sm p-6">
          <div className="text-[#737373] font-mono text-sm mb-6">&gt;_ CASE_FILE_RECORDS</div>
          <div className="space-y-4">
            {[
              { icon: Shield, label: 'Company', val: result.company_name },
              { icon: FileText, label: 'Role', val: result.job_title },
              { icon: AlertTriangle, label: 'Pay', val: result.salary },
              { icon: XOctagon, label: 'Geo', val: result.location },
              { icon: CheckCircle2, label: 'Mail', val: result.contact_email }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-[#2a2a2a]/50">
                <div className="flex items-center gap-2 text-[#737373] font-mono text-xs">
                  <item.icon className="w-3 h-3" /> {item.label}
                </div>
                <span className="font-mono text-xs text-[#f5f5f5] uppercase">{item.val || 'NULL'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: FLAGS */}
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-sm p-6 overflow-hidden">
          <div className="text-[#f59e0b] font-mono text-sm mb-6 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> ⚠ SECURITY_TIMELINE
          </div>
          <div className="space-y-3">
            {result.red_flags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2 bg-[#ef4444]/5 p-2 border border-[#ef4444]/10">
                <span className="text-[#ef4444] font-mono text-xs font-bold font-mono">[!]</span>
                <span className="text-[#737373] font-mono text-xs leading-loose">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline View */}
      <div className="w-full mt-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-sm p-6">
        <div className="text-[#3b82f6] font-mono text-sm mb-6 flex items-center gap-2">
          <Search className="w-4 h-4" /> &gt;_ SENSOR_PIPELINE_(LIVE)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {result.checks.map((check, i) => (
            <div key={i} className={`p-4 border border-[#2a2a2a] bg-[#0a0a0a] ${check.status === 'fail' ? 'border-[#ef4444]/20' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono text-[#737373] uppercase">{check.name}</span>
                <span className={`text-[9px] font-mono font-bold uppercase ${check.status === 'pass' ? 'text-[#22c55e]' : check.status === 'fail' ? 'text-[#ef4444]' : 'text-[#737373]'}`}>[{check.status}]</span>
              </div>
              <p className="text-[11px] font-mono text-[#737373] whitespace-pre-line leading-relaxed">{check.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Verification Request System */}
      {result.verdict === 'SUSPICIOUS' && !isFinalVerdict && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mt-8 bg-[#111111] border border-[#f59e0b] border-l-4 rounded-sm p-8 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
        >
          <div className="flex items-center gap-3 text-[#f59e0b] font-mono font-bold text-lg mb-4">
            <ClipboardCheck className="w-6 h-6" />
            &gt; ADDITIONAL_VERIFICATION_REQUIRED
          </div>
          
          <p className="font-mono text-[#737373] text-sm leading-relaxed mb-8 max-w-3xl">
            Our sensors have flagged this posting as <span className="text-[#f59e0b]">SUSPICIOUS</span>. 
            Confidence is insufficient for a final verdict. 
            Submit additional evidence to complete the investigation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {getRequestedItems().map((item) => (
              <div key={item.id} className="space-y-2">
                <label className="block text-xs font-mono text-[#f59e0b] uppercase tracking-wider">
                  [ ] {item.label}
                </label>
                <input
                  type="text"
                  value={evidenceInputs[item.id] || ''}
                  onChange={(e) => setEvidenceInputs({...evidenceInputs, [item.id]: e.target.value})}
                  placeholder={item.placeholder}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#f59e0b] p-3 text-sm font-mono text-[#f5f5f5] outline-none transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center">
            <button
              onClick={handleReanalyze}
              disabled={reloading}
              className="w-full md:w-auto px-6 md:px-12 py-4 bg-[#f59e0b] hover:bg-[#d97706] text-[#000] font-bold text-xs md:text-sm font-mono tracking-widest uppercase transition-all disabled:opacity-50"
            >
              {reloading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  REANALYZING_EVIDENCE...
                </span>
              ) : (
                '[ REANALYZE WITH EVIDENCE ]'
              )}
            </button>
            <p className="mt-3 text-[10px] font-mono text-[#737373]">
              FINAL_VERDICT_MODE: INCONCLUSIVE_STATE_REMOVAL_ENABLED
            </p>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="mt-10 flex justify-center gap-4">
        <button
          onClick={() => {
            setResult(null);
            setJobText('');
            setJobUrl('');
            setIsFinalVerdict(false);
          }}
          className="px-6 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#737373] font-mono text-xs uppercase tracking-widest hover:text-white transition-colors"
        >
          &lt; NEW_INVESTIGATION
        </button>
      </div>
    </div>
  );
}
