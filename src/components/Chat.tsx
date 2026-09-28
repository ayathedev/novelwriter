import React, { useState } from 'react';
import { Send } from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage, Chapter, Character } from '../types';

interface ChatProps {
  activeChapter: Chapter | null;
  characters: Character[];
}

export function Chat({ activeChapter, characters }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context
      const context = `
        Current Chapter: ${activeChapter?.title || 'None'}
        Chapter Content: ${activeChapter?.content || 'Empty'}
        
        Characters:
        ${characters.map(c => `- ${c.name} (${c.role}): ${c.description}`).join('\\n')}
      `;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          context,
          history: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }))
        })
      });

      const data = await response.json();
      
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.text || "I'm sorry, I encountered an error.",
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA]">
      <div className="p-4 border-b border-[#EEEEEE] bg-white">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-xs font-bold uppercase tracking-tight text-[#666]">AI Collaborative Partner</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg shadow-sm ${
              msg.role === 'user' 
                ? 'bg-[#1A1A1A] text-white ml-8' 
                : 'bg-white border border-[#EEE] mr-8'
            }`}>
              {msg.role === 'user' ? (
                <p className="text-xs leading-normal">{msg.text}</p>
              ) : (
                <div className="prose prose-sm prose-stone text-xs text-[#555] leading-normal">
                  <Markdown>{msg.text}</Markdown>
                </div>
              )}
              <span className={`text-[10px] mt-2 block uppercase ${msg.role === 'user' ? 'text-[#666]' : 'text-[#BBB]'}`}>
                {msg.role === 'user' ? 'YOU' : 'AI ASSISTANT'}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-lg border border-[#EEE] shadow-sm mr-8 animate-pulse">
              <p className="text-xs text-[#555] leading-normal">Thinking...</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#EEEEEE] bg-white">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Discuss the scene..."
            className="w-full pl-4 pr-10 py-3 bg-[#F5F5F5] rounded-full text-xs border-none focus:ring-1 focus:ring-black outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1.5 w-7 h-7 bg-[#333] rounded-full flex items-center justify-center text-white disabled:opacity-50 transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
