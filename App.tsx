
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

  const pingDevice = useCallback(async () => {
    setIsPinging(true);
    setError(null);
    const start = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`http://${ipAddress}/`, {
        method: 'GET',
        mode: 'no-cors', // Use no-cors for simple ping to avoid CORS issues on root
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const end = performance.now();
      setLatency(Math.round(end - start));
      return true;
    } catch (err: any) {
      setLatency(null);
      setError("Device unreachable. Check IP or Network.");
      return false;
    } finally {
      setIsPinging(false);
    }
  }, [ipAddress]);

  const controlLed = async (command: 'on' | 'off') => {
    setIsLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`http://${ipAddress}/${command}`, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setStatus(command === 'on' ? LEDStatus.ON : LEDStatus.OFF);
        // Refresh latency after action
        pingDevice();
      } else {
        throw new Error(`Device error: ${response.status}`);
      }
    } catch (err: any) {
      setError(err.name === 'AbortError' 
        ? "Timeout. ESP8266 didn't respond." 
        : "Failed to connect. Ensure phone/PC is on the same WiFi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <i className="fas fa-bolt-lightning text-xl"></i>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm md:text-base">ESP8266 Dashboard</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Deploy Ready</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={pingDevice}
            disabled={isPinging}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
              latency ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            {isPinging ? (
              <i className="fas fa-spinner fa-spin text-xs"></i>
            ) : (
              <i className="fas fa-signal text-xs"></i>
            )}
            <span className="text-[10px] font-bold">
              {latency ? `${latency}ms` : 'PING'}
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Device Controls */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Connection Settings */}
          <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Network Config</h2>
              {latency && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ONLINE</span>}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <i className="fas fa-link absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input 
                  type="text" 
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="ESP IP (e.g. 192.168.4.1)"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
                />
              </div>
              <button 
                onClick={pingDevice}
                className="bg-indigo-50 text-indigo-600 px-5 rounded-2xl font-bold text-xs hover:bg-indigo-100 active:scale-95 transition-all"
              >
                TEST
              </button>
            </div>
          </section>

          {/* Control Hub */}
          <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200 text-center relative overflow-hidden">
            <div className={`absolute inset-x-0 top-0 h-1 transition-all duration-500 ${isLoading ? 'bg-indigo-600 animate-pulse' : 'bg-transparent'}`}></div>
            
            <div className="flex flex-col items-center gap-8">
              {/* LED State Indicator */}
              <div className="relative group">
                <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-700 ${
                  status === LEDStatus.ON 
                    ? 'bg-indigo-50 shadow-[0_0_60px_rgba(79,70,229,0.2)] scale-105' 
                    : 'bg-slate-50 shadow-inner'
                }`}>
                  <div className={`text-6xl transition-all duration-500 ${
                    status === LEDStatus.ON ? 'text-indigo-600 drop-shadow-lg' : 'text-slate-200'
                  }`}>
                    <i className={status === LEDStatus.ON ? "fas fa-lightbulb" : "far fa-lightbulb"}></i>
                  </div>
                </div>
                {status === LEDStatus.ON && (
                  <div className="absolute inset-0 w-40 h-40 rounded-full border-4 border-indigo-400/20 animate-ping"></div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">System Control</h3>
                <p className="text-xs text-slate-400 font-medium">Built-in LED (Active Low)</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <button 
                  onClick={() => controlLed('on')}
                  disabled={isLoading}
                  className={`py-5 rounded-2xl font-black text-sm flex flex-col items-center gap-2 transition-all active:scale-95 shadow-lg ${
                    status === LEDStatus.ON 
                    ? 'bg-indigo-600 text-white shadow-indigo-200' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <i className="fas fa-toggle-on text-xl"></i>
                  POWER ON
                </button>
                <button 
                  onClick={() => controlLed('off')}
                  disabled={isLoading}
                  className={`py-5 rounded-2xl font-black text-sm flex flex-col items-center gap-2 transition-all active:scale-95 shadow-lg ${
                    status === LEDStatus.OFF 
                    ? 'bg-slate-900 text-white shadow-slate-300' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <i className="fas fa-toggle-off text-xl"></i>
                  POWER OFF
                </button>
              </div>

              {error && (
                <div className="w-full bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-xs font-bold animate-bounce-short">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  {error}
                </div>
              )}
            </div>
          </section>

          {/* Firmware Setup */}
          <section className="bg-slate-900 p-1 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200">
            <div className="p-6 bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">ESP8266 Firmware</h2>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20">C++ / ARDUINO</span>
              </div>
              <CodeSnippet />
            </div>
          </section>
        </div>

        {/* Right: Intelligence & Help */}
        <div className="lg:col-span-5 space-y-6">
          <AIAssistant />
          
          <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <i className="fas fa-mobile-screen-button"></i>
              </div>
              <h3 className="font-bold">APK Ready</h3>
            </div>
            <p className="text-sm text-indigo-100 leading-relaxed opacity-90">
              This app is optimized for full-screen mobile usage. 
              If using a local router without internet, ensure your phone connects to the ESP8266 Access Point or both are on the same local subnet.
            </p>
          </div>
        </div>
      </main>

      {/* Mobile Floating Action Bar */}
      <div className="fixed bottom-6 inset-x-4 max-w-lg mx-auto bg-white/90 backdrop-blur-xl px-6 py-4 rounded-3xl shadow-2xl border border-slate-200 flex items-center justify-between z-40">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ESP Target</span>
          <span className="text-sm font-mono font-bold text-slate-900">{ipAddress}</span>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="text-right">
             <span className="block text-[10px] font-black text-slate-400 uppercase">Latency</span>
             <span className={`text-sm font-bold ${latency && latency < 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
               {latency ? `${latency} ms` : '--'}
             </span>
           </div>
           <div className={`w-3 h-3 rounded-full ${latency ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
        </div>
      </div>
    </div>
  );
};

export default App;
