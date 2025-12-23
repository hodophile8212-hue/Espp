
import React, { useState, useRef, useEffect } from 'react';
import { getSetupGuidance } from '../services/geminiService';
import { ChatMessage } from '../types';

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I can help you set up your ESP8266 or troubleshoot connection issues. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const response = await getSetupGuidance(userMsg);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-indigo-600 text-white flex items-center gap-2">
        <i className="fas fa-robot"></i>
        <h2 className="font-semibold">Hardware AI Assistant</h2>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
            }`}>
              {m.content.split('\n').map((line, idx) => (
                <p key={idx} className={idx > 0 ? 'mt-2' : ''}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-.5s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about wiring, code, or IP issues..."
          className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading}
          className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};

export default AIAssistant;
