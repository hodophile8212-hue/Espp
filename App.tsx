
import React, { useState, useEffect, useCallback } from 'react';
import AIAssistant from './components/AIAssistant';
import CodeSnippet from './components/CodeSnippet';
import { LEDStatus } from './types';

const App: React.FC = () => {
  const [ipAddress, setIpAddress] = useState('192.168.1.100');
  const [status, setStatus] = useState<LEDStatus>(LEDStatus.UNKNOWN);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // Improved ping function for local networks
  const pingDevice = useCallback(async () => {
    setIsPinging(true);
    const start = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      // Using no-cors allows us to detect 'opaque' responses from local devices 
      // even if they don't have proper CORS headers on the root path.
      await fetch(`http://${ipAddress}/`, {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      const end = performance.now();
      setLatency(Math.round(end - start));
      setError(null);
      return true;
    } catch (err: any) {
      setLatency(null);
      if (err.name !== 'AbortError') {
         setError("Device unreachable. Check IP or WiFi.");
      }
      return false;
    } finally {
      setIsPinging(false);
    }
  }, [ipAddress]);

  // Auto-ping every 10 seconds to keep connection state fresh
  useEffect(() => {
    const interval = setInterval(pingDevice, 10000);
    return () => clearInterval(interval);
  }, [pingDevice]);

  const controlLed = async (command: 'on' | 'off') => {
    setIsLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Note: Command endpoints MUST have Access-Control-Allow-Origin: * in ESP code
      const response = await fetch(`http://${ipAddress}/${command}`, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setStatus(command === 'on' ? LEDStatus.ON : LEDStatus.OFF);
        pingDevice(); // Refresh latency
      } else {
        throw new Error(`Device error: ${response.status}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.name === 'AbortError' 
        ? "Timeout. Is the ESP8266 still connected?" 
        : "Connection failed. Please verify the ESP IP address.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <i className="fas fa-microchip text-xl"></i>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm">ESP Control Center</h1>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${latency ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {latency ? 'Linked' : 'Searching...'}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={pingDevice}
            disabled={isPinging}
            className={`px-4 py-2 rounded-2xl border flex items-center gap-2 transition-all active:scale-95 ${
              latency ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            {isPinging ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wifi"></i>}
            <span className="text-xs font-black">{latency ? `${latency}ms` : 'PING'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Target IP Card */}
          <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Device Address</h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <i className="fas fa-globe absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input 
                  type="text" 
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="e.g. 192.168.1.15"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
                />
              </div>
            </div>
          </section>

          {/* Primary Toggle UI */}
          <section className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-200 text-center relative overflow-hidden">
            <div className={`absolute top-0 inset-x-0 h-1 transition-all ${isLoading ? 'bg-indigo-600 animate-pulse' : 'bg-transparent'}`}></div>
            
            <div className="flex flex-col items-center gap-10">
              <div className="relative group">
                <div className={`w-44 h-44 rounded-full flex items-center justify-center transition-all duration-700 ${
                  status === LEDStatus.ON 
                    ? 'bg-indigo-600 shadow-[0_0_80px_rgba(79,70,229,0.3)]' 
                    : 'bg-slate-50 shadow-inner border border-slate-100'
                }`}>
                  <i className={`fas fa-power-off text-6xl transition-all duration-500 ${
                    status === LEDStatus.ON ? 'text-white' : 'text-slate-200'
                  }`}></i>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Main LED</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">ESP8266 GPIO 2</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <button 
                  onClick={() => controlLed('on')}
                  disabled={isLoading}
                  className={`py-5 rounded-2xl font-black text-xs tracking-widest transition-all active:scale-95 shadow-xl ${
                    status === LEDStatus.ON 
                    ? 'bg-indigo-600 text-white shadow-indigo-200 ring-4 ring-indigo-50' 
                    : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  ACTIVATE
                </button>
                <button 
                  onClick={() => controlLed('off')}
                  disabled={isLoading}
                  className={`py-5 rounded-2xl font-black text-xs tracking-widest transition-all active:scale-95 shadow-xl ${
                    status === LEDStatus.OFF 
                    ? 'bg-slate-900 text-white shadow-slate-300 ring-4 ring-slate-50' 
                    : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  DEACTIVATE
                </button>
              </div>

              {error && (
                <div className="w-full bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-[11px] font-bold flex items-center justify-center gap-2">
                  <i className="fas fa-triangle-exclamation"></i>
                  {error}
                </div>
              )}
            </div>
          </section>

          <section className="bg-slate-950 p-6 rounded-[2rem] shadow-2xl">
            <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Embedded Code</h2>
            <CodeSnippet />
          </section>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-6">
          <AIAssistant />
          
          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
            <h3 className="text-indigo-900 font-black text-sm mb-3 flex items-center gap-2 uppercase tracking-tight">
              <i className="fas fa-rocket"></i>
              APK Builder Instructions
            </h3>
            <ul className="text-xs text-indigo-700 space-y-3 font-medium">
              <li className="flex gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] flex-shrink-0">1</span>
                Download the 'dist' artifact from your GitHub Action.
              </li>
              <li className="flex gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] flex-shrink-0">2</span>
                Use a tool like Capacitor.js or a PWA wrapper.
              </li>
              <li className="flex gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] flex-shrink-0">3</span>
                Ensure 'Cleartext Traffic' (HTTP) is enabled in AndroidManifest.xml.
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Floating Status Bar */}
      <div className="fixed bottom-6 inset-x-6 max-w-md mx-auto bg-white/80 backdrop-blur-xl px-6 py-4 rounded-[2rem] shadow-2xl border border-slate-200 flex items-center justify-between z-40">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase">Target</span>
          <span className="text-sm font-mono font-bold text-slate-900">{ipAddress}</span>
        </div>
        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex items-center gap-3">
           <div className="text-right">
             <span className="block text-[10px] font-black text-slate-400 uppercase">Latency</span>
             <span className={`text-xs font-bold ${latency && latency < 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
               {latency ? `${latency} ms` : 'Disconnected'}
             </span>
           </div>
           <div className={`w-3 h-3 rounded-full ${latency ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-slate-300'}`}></div>
        </div>
      </div>
    </div>
  );
};

export default App;
