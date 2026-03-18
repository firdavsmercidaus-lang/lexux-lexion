import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Globe, 
  Languages, 
  Cpu, 
  Terminal, 
  ChevronRight, 
  Activity,
  Zap,
  Layers,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { languages, dictionary, DictionaryEntry } from './data/dictionary';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('uz');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'word'>('word');
  const [systemStatus, setSystemStatus] = useState('READY');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [isNeuralLoading, setIsNeuralLoading] = useState(false);
  const [neuralResult, setNeuralResult] = useState<DictionaryEntry | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredDictionary = useMemo(() => {
    const filtered = dictionary.filter(entry => {
      if (entry.category !== selectedCategory) return false;
      
      const sourceVal = entry.translations[sourceLang]?.toLowerCase() || '';
      const targetVal = entry.translations[targetLang]?.toLowerCase() || '';
      return sourceVal.includes(searchQuery.toLowerCase()) || 
             targetVal.includes(searchQuery.toLowerCase());
    });

    // Sort alphabetically based on source language
    return filtered.sort((a, b) => {
      const aVal = a.translations[sourceLang] || '';
      const bVal = b.translations[sourceLang] || '';
      return aVal.localeCompare(bVal);
    });
  }, [searchQuery, sourceLang, targetLang]);

  const handleEntryClick = (entry: DictionaryEntry) => {
    setSelectedEntry(entry);
    setNeuralResult(null);
    setSystemStatus('ANALYZING');
    setTimeout(() => setSystemStatus('READY'), 800);
  };

  const handleNeuralSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsNeuralLoading(true);
    setSystemStatus('NEURAL_SYNC');
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the word "${searchQuery}" from ${languages.find(l => l.id === sourceLang)?.name} to all these languages: ${languages.map(l => l.name).join(', ')}. Return ONLY a JSON object with this structure: { "id": "${searchQuery.toLowerCase()}", "category": "word", "translations": { "en": "...", "uz": "...", "ru": "...", "de": "...", "fr": "...", "es": "...", "tr": "...", "ar": "...", "zh": "...", "ja": "..." } }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              category: { type: Type.STRING },
              translations: {
                type: Type.OBJECT,
                properties: languages.reduce((acc, lang) => ({ ...acc, [lang.id]: { type: Type.STRING } }), {})
              }
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      setNeuralResult(data);
      setSelectedEntry(data);
      setSystemStatus('READY');
    } catch (error) {
      console.error("Neural Search Error:", error);
      setSystemStatus('ERROR');
    } finally {
      setIsNeuralLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col p-4 gap-4 overflow-hidden relative">
      {/* Header Bar */}
      <header className="flex justify-between items-center edex-border glass-panel p-3 px-6 z-10">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-neon-cyan/20 rounded-sm border border-neon-cyan">
            <Cpu className="w-6 h-6 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-widest text-neon-cyan uppercase">Nexus Lexicon v4.0</h1>
            <p className="text-[10px] opacity-50 uppercase tracking-tighter">Neural Translation Interface // Secure Connection</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] opacity-50 uppercase">System Status</span>
            <span className={`text-xs font-bold ${systemStatus === 'READY' ? 'text-neon-green' : 'text-neon-amber'}`}>
              [ {systemStatus} ]
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] opacity-50 uppercase">Temporal Sync</span>
            <span className="text-xs font-bold text-neon-cyan">{currentTime}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Sidebar: Language Selection */}
        <aside className="w-72 flex flex-col gap-4 overflow-hidden">
          <div className="edex-border glass-panel p-4 flex flex-col gap-4 h-1/2">
            <div className="flex items-center gap-2 text-neon-cyan">
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Source Core</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {languages.map(lang => (
                <button
                  key={`source-${lang.id}`}
                  onClick={() => setSourceLang(lang.id)}
                  className={`w-full flex items-center justify-between p-2 mb-1 text-xs transition-all border border-transparent hover:border-neon-cyan/30 ${
                    sourceLang === lang.id ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{lang.flag}</span>
                    {lang.name}
                  </span>
                  {sourceLang === lang.id && <Zap className="w-3 h-3 fill-current" />}
                </button>
              ))}
            </div>
          </div>

          <div className="edex-border glass-panel p-4 flex flex-col gap-4 h-1/2">
            <div className="flex items-center gap-2 text-neon-amber">
              <Languages className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Target Core</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {languages.map(lang => (
                <button
                  key={`target-${lang.id}`}
                  onClick={() => setTargetLang(lang.id)}
                  className={`w-full flex items-center justify-between p-2 mb-1 text-xs transition-all border border-transparent hover:border-neon-amber/30 ${
                    targetLang === lang.id ? 'bg-neon-amber/20 border-neon-amber text-neon-amber' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{lang.flag}</span>
                    {lang.name}
                  </span>
                  {targetLang === lang.id && <Zap className="w-3 h-3 fill-current" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: Dictionary List */}
        <section className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory('word')}
              className={`flex-1 p-2 edex-border glass-panel text-[10px] font-bold uppercase tracking-widest transition-all ${
                selectedCategory === 'word' ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan' : 'opacity-50 hover:opacity-100'
              }`}
            >
              [ Sector: Lexicon ]
            </button>
          </div>

          <div className="edex-border glass-panel p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-cyan" />
              <input
                type="text"
                placeholder="SEARCHING DATABASE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-neon-cyan/30 p-3 pl-10 text-xs focus:outline-none focus:border-neon-cyan transition-all uppercase tracking-widest"
              />
            </div>
          </div>

          <div className="flex-1 edex-border glass-panel overflow-hidden flex flex-col">
            <div className="grid grid-cols-2 p-3 border-b border-neon-cyan/20 bg-neon-cyan/5 text-[10px] font-bold uppercase tracking-widest text-neon-cyan">
              <div>{languages.find(l => l.id === sourceLang)?.name}</div>
              <div>{languages.find(l => l.id === targetLang)?.name}</div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredDictionary.length > 0 ? (
                filteredDictionary.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => handleEntryClick(entry)}
                    className={`w-full grid grid-cols-2 p-4 text-left text-sm border-b border-white/5 transition-all hover:bg-white/5 group ${
                      selectedEntry?.id === entry.id && !neuralResult ? 'bg-neon-cyan/10 border-l-4 border-l-neon-cyan' : ''
                    }`}
                  >
                    <div className="font-bold flex items-center gap-2">
                      <ChevronRight className={`w-3 h-3 text-neon-cyan transition-transform ${selectedEntry?.id === entry.id && !neuralResult ? 'rotate-90' : ''}`} />
                      {entry.translations[sourceLang]}
                    </div>
                    <div className="text-neon-amber font-medium opacity-80 group-hover:opacity-100">
                      {entry.translations[targetLang]}
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
                  <Terminal className="w-12 h-12 opacity-30" />
                  <p className="text-xs uppercase tracking-[0.2em] opacity-50">Local Database Exhausted</p>
                  <button
                    onClick={handleNeuralSearch}
                    disabled={isNeuralLoading}
                    className="w-full p-3 edex-border bg-neon-cyan/10 text-neon-cyan text-[10px] font-bold uppercase tracking-widest hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
                  >
                    {isNeuralLoading ? '[ SYNCING NEURAL CORE... ]' : '[ INITIALIZE NEURAL TRANSLATION ]'}
                  </button>
                </div>
              )}
              
              {neuralResult && (
                <div className="p-4 bg-neon-cyan/5 border-t border-neon-cyan/20">
                  <div className="text-[10px] text-neon-cyan uppercase mb-2">Neural Result:</div>
                  <button
                    onClick={() => handleEntryClick(neuralResult)}
                    className={`w-full grid grid-cols-2 p-4 text-left text-sm border edex-border transition-all bg-neon-cyan/10 border-neon-cyan`}
                  >
                    <div className="font-bold flex items-center gap-2 text-neon-cyan">
                      <Zap className="w-3 h-3 animate-pulse" />
                      {neuralResult.translations[sourceLang]}
                    </div>
                    <div className="text-neon-amber font-bold">
                      {neuralResult.translations[targetLang]}
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Sidebar: Details & Stats */}
        <aside className="w-80 flex flex-col gap-4 overflow-hidden">
          <div className="edex-border glass-panel p-4 flex flex-col gap-4 h-1/2">
            <div className="flex items-center gap-2 text-neon-green">
              <Terminal className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Data Analysis</span>
            </div>
            
            <AnimatePresence mode="wait">
              {selectedEntry ? (
                <motion.div
                  key={selectedEntry.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-6"
                >
                  <div className="p-4 bg-white/5 border border-white/10 rounded-sm">
                    <span className="text-[10px] opacity-50 uppercase block mb-1">Primary Identifier</span>
                    <h2 className="text-2xl font-bold text-neon-cyan">{selectedEntry.translations[sourceLang]}</h2>
                  </div>

                  <div className="p-4 bg-neon-amber/10 border border-neon-amber/30 rounded-sm">
                    <span className="text-[10px] opacity-50 uppercase block mb-1">Target Translation</span>
                    <h2 className="text-2xl font-bold text-neon-amber">{selectedEntry.translations[targetLang]}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 border border-white/10 text-[10px] uppercase">
                      <span className="opacity-50 block">Sector</span>
                      <span>LEX-001</span>
                    </div>
                    <div className="p-2 border border-white/10 text-[10px] uppercase">
                      <span className="opacity-50 block">ID</span>
                      <span>{selectedEntry.id.toUpperCase()}</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex items-center justify-center opacity-20 italic text-xs text-center">
                  SELECT AN ENTRY TO INITIALIZE NEURAL ANALYSIS
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="edex-border glass-panel p-4 flex flex-col gap-4 h-1/2">
            <div className="flex items-center gap-2 text-neon-cyan">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">System Metrics</span>
            </div>
            
            <div className="flex-1 flex flex-col gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase">
                  <span>Database Load</span>
                  <span>{Math.floor(Math.random() * 20 + 40)}%</span>
                </div>
                <div className="h-1 bg-white/10 overflow-hidden">
                  <motion.div 
                    className="h-full bg-neon-cyan"
                    animate={{ width: ['40%', '60%', '45%'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase">
                  <span>Neural Sync</span>
                  <span>{Math.floor(Math.random() * 10 + 90)}%</span>
                </div>
                <div className="h-1 bg-white/10 overflow-hidden">
                  <motion.div 
                    className="h-full bg-neon-green"
                    animate={{ width: ['90%', '98%', '92%'] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/10 grid grid-cols-3 gap-2">
                {[Layers, Box, Zap].map((Icon, i) => (
                  <div key={i} className="flex flex-col items-center p-2 border border-white/5 bg-white/5">
                    <Icon className="w-4 h-4 text-neon-cyan mb-1" />
                    <span className="text-[8px] opacity-50">MOD-{i+1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-8 glass-panel edex-border flex items-center px-4 justify-between text-[9px] uppercase tracking-widest">
        <div className="flex gap-6">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse"></span>
            NETWORK: STABLE
          </span>
          <span className="opacity-50">ENCRYPTION: AES-256</span>
          <span className="opacity-50">USER: GUEST_01</span>
        </div>
        <div className="flex gap-4">
          <span>LATENCY: 12ms</span>
          <span className="text-neon-cyan">© 2026 NEXUS_CORP</span>
        </div>
      </footer>

      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-amber/10 blur-[120px] rounded-full"></div>
      </div>
    </div>
  );
}
