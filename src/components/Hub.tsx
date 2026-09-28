import React, { useState } from 'react';
import { Novel } from '../types';
import { Plus, BookOpen } from 'lucide-react';

interface HubProps {
  novels: Novel[];
  onCreateNovel: (title: string) => void;
  onSelectNovel: (novel: Novel) => void;
}

export function Hub({ novels, onCreateNovel, onSelectNovel }: HubProps) {
  const [newTitle, setNewTitle] = useState('');

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FBFBFB] font-sans">
      <div className="max-w-md w-full p-8 bg-white border border-[#EEEEEE] rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">My Projects</h1>
        
        <div className="space-y-3 mb-8">
          {novels.map(novel => (
            <button 
              key={novel.id}
              onClick={() => onSelectNovel(novel)}
              className="w-full text-left p-4 border border-[#EEEEEE] rounded-lg hover:border-[#333] transition-all flex items-center gap-3"
            >
              <BookOpen className="w-5 h-5 text-[#888]" />
              <span className="font-medium">{novel.title}</span>
            </button>
          ))}
        </div>

        <div className="pt-6 border-t border-[#EEEEEE]">
          <h2 className="text-sm font-medium text-[#555] mb-3">Create New Project</h2>
          <div className="flex gap-2">
            <input 
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Novel title..."
              className="flex-1 px-3 py-2 border border-[#EEEEEE] rounded-lg focus:outline-none focus:border-[#333]"
            />
            <button 
              onClick={() => { if (newTitle) { onCreateNovel(newTitle); setNewTitle(''); } }}
              className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg flex items-center gap-2 hover:bg-[#333]"
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
