import React, { useState, useEffect, useRef } from 'react';
import { Chapter } from '../types';
import { Save } from 'lucide-react';
import { cn } from '../lib/utils';

interface EditorProps {
  chapter: Chapter | null;
  onSave: (id: string, content: string, title?: string) => void;
  onCreateVersion: (id: string, content: string, summary: string) => void;
  darkMode: boolean;
}

export function Editor({ chapter, onSave, onCreateVersion, darkMode }: EditorProps) {
  const [content, setContent] = useState(chapter?.content || '');
  const [title, setTitle] = useState(chapter?.title || '');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormat = (type: 'bold' | 'italic') => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd } = textareaRef.current;
    const selectedText = content.substring(selectionStart, selectionEnd);
    const wrapper = type === 'bold' ? '**' : '*';
    const newText = content.substring(0, selectionStart) + wrapper + selectedText + wrapper + content.substring(selectionEnd);
    setContent(newText);
    textareaRef.current.focus();
  };

  useEffect(() => {
    setContent(chapter?.content || '');
    setTitle(chapter?.title || '');
  }, [chapter?.id]); // Only reset when chapter ID changes

  // Auto-save debounced
  useEffect(() => {
    if (!chapter) return;
    const timeout = setTimeout(() => {
      if (content !== chapter.content || title !== chapter.title) {
        onSave(chapter.id, content, title);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [content, title, chapter, onSave]);

  const handleManualSave = async () => {
    if (!chapter) return;
    setIsSaving(true);
    await onSave(chapter.id, content, title);
    setIsSaving(false);
  };

  const handleSaveVersion = async () => {
    if (!chapter) return;
    const summary = prompt("Enter a brief summary for this version:");
    if (summary) {
      await onCreateVersion(chapter.id, content, summary);
      alert("Version saved!");
    }
  };

  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#888] bg-[#FBFBFB]">
        <p>Select or create a chapter to begin writing.</p>
      </div>
    );
  }

  return (
    <div className={cn("flex-1 flex flex-col h-full relative", darkMode ? "bg-[#121212]" : "bg-white")}>
      <header className={cn("h-14 border-b flex items-center justify-between px-8 shrink-0", darkMode ? "border-[#333]" : "border-[#EEEEEE]")}>
        <div className="flex items-center gap-4 flex-1">
          <span className={cn("text-xs font-mono", darkMode ? "text-[#666]" : "text-[#AAA]")}>{isSaving ? 'SAVING...' : 'SAVED'}</span>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className={cn("text-sm font-semibold outline-none flex-1 bg-transparent placeholder-[#AAA]", darkMode ? "text-[#E0E0E0]" : "text-[#333]")}
            placeholder="Chapter Title"
          />
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => handleFormat('bold')} className={cn("text-xs px-2 py-1 rounded border", darkMode ? "border-[#444] text-[#AAA]" : "border-[#EEEEEE] text-[#555]")}>B</button>
          <button onClick={() => handleFormat('italic')} className={cn("text-xs px-2 py-1 rounded border", darkMode ? "border-[#444] text-[#AAA]" : "border-[#EEEEEE] text-[#555]")}>I</button>
          <span className={cn("text-xs", darkMode ? "text-[#888]" : "text-[#999]")}>{content.split(/\s+/).filter(w => w.length > 0).length} words</span>
          <button 
            onClick={handleSaveVersion}
            className={cn("text-xs px-3 py-1.5 rounded-full border transition-colors", darkMode ? "border-[#444] text-[#AAA] hover:bg-[#222]" : "border-[#EEEEEE] text-[#555] hover:bg-[#F5F5F5]")}
          >
            Save Version
          </button>
          <button 
            onClick={handleManualSave}
            className={cn("px-4 py-1.5 text-xs rounded-full font-medium flex items-center gap-1 transition-colors", darkMode ? "bg-white text-[#121212] hover:bg-gray-200" : "bg-[#1A1A1A] text-white hover:bg-[#333]")}
          >
            <Save className="w-3 h-3" />
            Save
          </button>
        </div>
      </header>
      
      <section className="flex-1 overflow-y-auto p-16">
        <div className="max-w-2xl mx-auto h-full">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your masterpiece..."
            className={cn("w-full h-full resize-none outline-none font-serif text-xl leading-relaxed placeholder-[#CCC] bg-transparent", darkMode ? "text-[#E0E0E0]" : "text-[#222]")}
          />
        </div>
      </section>
    </div>
  );
}
