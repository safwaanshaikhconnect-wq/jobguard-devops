import React, { useState } from 'react';
import { Search, Globe, MapPin, Mail, ShieldCheck, ShieldAlert, Loader2, Building2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface CorporateIntel {
  name: string;
  official_domain: string;
  official_hq: string;
  email_pattern: string;
  is_verified: boolean;
  description: string;
}

export default function OsintSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CorporateIntel | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/search/intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      if (data.status === 'error') {
        setError(data.message);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Intelligence server is offline. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col font-mono max-w-4xl mx-auto w-full">
      {/* Header with ambient glow */}
      <div className="relative mb-10">
        <div
          className="absolute inset-0 -z-10 rounded-[20px]"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, rgba(239, 68, 68, 0.1), transparent 60%)`,
            filter: 'blur(40px)',
            transform: 'scale(1.1)',
          }}
        />
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-[0.2em] mb-2 flex items-center justify-center gap-2 md:gap-3" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            <Globe className="w-6 h-6 md:w-8 md:h-8 text-[#ef4444]" />
            OSINT_INTELLIGENCE
          </h2>
          <p className="text-[10px] md:text-xs tracking-widest uppercase" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>Global Business Registry & Domain Verification Portal</p>
        </div>
      </div>

      {/* Search bar — glass */}
      <div className="relative group mb-12">
        <form onSubmit={handleSearch} className="flex flex-col md:block">
          <div className="absolute inset-y-0 left-4 md:left-5 flex items-center pointer-events-none hidden md:flex">
            <Search className="w-4 h-4 md:w-5 md:h-5 group-focus-within:text-[#ef4444] transition-colors" style={{ color: 'rgba(255, 255, 255, 0.25)' }} />
          </div>
          <input
            type="text"
            className="w-full py-3 md:py-4 px-4 md:pl-14 pr-4 md:pr-40 text-sm md:text-lg uppercase tracking-widest font-mono outline-none transition-all mb-3 md:mb-0"
            style={{
              background: 'rgba(10, 10, 10, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              color: 'rgba(255, 255, 255, 0.85)',
            }}
            placeholder="SEARCH ENTITY (E.G. TATA MOTORS)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="md:absolute right-3 top-3 w-full md:w-auto px-5 py-3 md:py-2 text-xs font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '10px',
              color: 'rgba(239, 68, 68, 0.7)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = 'rgba(239, 68, 68, 0.9)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)'; }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "EXECUTE_LOOKUP"}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-4 text-sm flex items-center gap-3 mb-6"
          style={{
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '12px',
            color: 'rgba(239, 68, 68, 0.8)',
          }}
        >
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Result card — glass */}
      {result && (
        <div
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{
            background: 'rgba(10, 10, 10, 0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
          }}
        >
          <div className="p-5 md:p-8">
          {/* Company header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0 mb-8 pb-6" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <Building2 className="w-5 h-5 md:w-6 md:h-6 text-[#ef4444]" />
                <h3 className="text-xl md:text-2xl font-bold uppercase tracking-widest" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{result.name}</h3>
              </div>
              <p className="text-xs md:text-sm italic" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>{result.description}</p>
            </div>
            {result.is_verified ? (
              <div
                className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest flex-shrink-0"
                style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: '20px',
                  color: 'rgba(34, 197, 94, 0.8)',
                }}
              >
                <ShieldCheck className="w-4 h-4" /> VERIFIED_ENTITY
              </div>
            ) : (
              <div
                className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest flex-shrink-0"
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '20px',
                  color: 'rgba(245, 158, 11, 0.8)',
                }}
              >
                <ShieldAlert className="w-4 h-4" /> UNVERIFIED_ENTITY
              </div>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: Globe, label: 'OFFICIAL_DOMAIN', value: result.official_domain },
              { icon: MapPin, label: 'HQ_LOCATION', value: result.official_hq },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div
                  className="p-3 flex-shrink-0"
                  style={{
                    background: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.1)',
                    borderRadius: '10px',
                  }}
                >
                  <item.icon className="w-5 h-5 text-[#ef4444]" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold break-all" style={{ color: 'rgba(255, 255, 255, 0.25)' }}>{item.label}</label>
                  <div className="font-mono text-sm md:text-lg break-all" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{item.value}</div>
                </div>
              </div>
            ))}

            <div className="flex items-start gap-4 col-span-1 md:col-span-2">
              <div
                className="p-3 flex-shrink-0"
                style={{
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.1)',
                  borderRadius: '10px',
                }}
              >
                <Mail className="w-5 h-5 text-[#ef4444]" />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] uppercase tracking-widest font-bold break-all" style={{ color: 'rgba(255, 255, 255, 0.25)' }}>HR_EMAIL_CONVENTION</label>
                <div className="font-mono text-sm md:text-lg break-all" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{result.email_pattern}</div>
                <p className="text-[10px] mt-2 italic font-sans tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.2)' }}>Note: Any job offer from a domain NOT matching '{result.official_domain}' is highly suspect.</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="mt-20 flex flex-col items-center justify-center select-none" style={{ opacity: 0.06 }}>
          <div className="grid grid-cols-3 gap-8">
            <Building2 className="w-12 h-12" />
            <Globe className="w-12 h-12" />
            <MapPin className="w-12 h-12" />
          </div>
          <p className="mt-8 text-sm uppercase tracking-[0.4em]">Node ID: 8841 | Registry Offline</p>
        </div>
      )}
    </div>
  );
}
