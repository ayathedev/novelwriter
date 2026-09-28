/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Chat } from './components/Chat';
import { Characters } from './components/Characters';
import { Versions } from './components/Versions';
import { Hub } from './components/Hub';
import { ExportImportModal } from './components/ExportImportModal';
import { MessageSquare, Users, History, Book } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const { user, loading: authLoading, login } = useAuth();
  const { 
    novels,
    activeNovel,
    setActiveNovel,
    selectNovel,
    createNovel,
    chapters, 
    characters, 
    activeChapter, 
    setActiveChapter: setActiveChapterData, 
    createChapter, 
    saveChapter,
    createVersion,
    versions,
    addCharacter,
    deleteCharacter,
    reorderChapters,
    exportData,
    importData,
    importChapters,
    loading: dataLoading
  } = useData();

  const [activeTab, setActiveTab] = useState<'chat' | 'characters' | 'versions' | 'notes'>('chat');
  const [darkMode, setDarkMode] = useState(false);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [novelNotes, setNovelNotes] = useState({ text: '', link: '' });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeChapter) saveChapter(activeChapter.id, activeChapter.content, activeChapter.title);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeChapter, saveChapter]);

  if (authLoading) {
    return (
      <div className={cn("h-screen w-full flex items-center justify-center font-sans", darkMode ? "bg-[#121212] text-[#888]" : "bg-[#FBFBFB] text-[#888]")}>
        <p className="animate-pulse">Loading workspace...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={cn("h-screen w-full flex items-center justify-center font-sans", darkMode ? "bg-[#121212] text-[#E0E0E0]" : "bg-[#FBFBFB] text-[#1A1A1A]")}>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="absolute top-4 right-4 z-50 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        <div className={cn("p-10 border rounded-xl flex flex-col items-center gap-6 max-w-sm w-full shadow-sm text-center", darkMode ? "bg-[#1A1A1A] border-[#333]" : "bg-white border-[#EEEEEE]")}>
          <div className={cn("w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1.5 mb-2", darkMode ? "bg-[#444]" : "bg-[#333]")}>
            <div className="w-6 h-0.5 bg-white"></div>
            <div className="w-4 h-0.5 bg-white"></div>
            <div className="w-5 h-0.5 bg-white"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold mb-2">Novel Writer</h1>
            <p className="text-sm text-[#888] leading-relaxed">Sign in to synchronize your manuscript and collaborate with the AI.</p>
          </div>
          <button 
            onClick={login}
            className={cn("w-full mt-2 py-3 text-sm rounded-full font-medium transition-colors", darkMode ? "bg-white text-[#1A1A1A] hover:bg-gray-200" : "bg-[#1A1A1A] text-white hover:bg-[#333]")}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className={cn("h-screen w-full flex items-center justify-center font-sans", darkMode ? "bg-[#121212] text-[#888]" : "bg-[#FBFBFB] text-[#888]")}>
        <p className="animate-pulse">Loading manuscript...</p>
      </div>
    );
  }

  if (!activeNovel) {
    return (
      <div className={cn("h-screen w-full font-sans", darkMode ? "bg-[#121212] text-[#E0E0E0]" : "bg-[#FBFBFB] text-[#1A1A1A]")}>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="absolute top-4 right-4 z-50 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        <Hub novels={novels} onCreateNovel={createNovel} onSelectNovel={selectNovel} />
      </div>
    );
  }

  return (
    <div className={cn("flex h-screen w-full font-sans overflow-hidden transition-colors duration-200", darkMode ? "bg-[#121212] text-[#E0E0E0]" : "bg-[#FBFBFB] text-[#1A1A1A]")}>
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-4 right-16 z-50 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
      >
        {darkMode ? "☀️" : "🌙"}
      </button>
      <button 
        onClick={() => setIsDistractionFree(!isDistractionFree)}
        className="absolute top-4 right-4 z-50 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
      >
        {isDistractionFree ? "👁️" : "🙈"}
      </button>
      
      {!isDistractionFree && (
        <Sidebar 
          chapters={chapters}
          activeChapter={activeChapter}
          onSelectChapter={setActiveChapterData}
          onCreateChapter={createChapter}
          onExport={exportData}
          onImport={importData}
          onCloseProject={() => setActiveNovel(null)}
          onReorder={reorderChapters}
          onOpenExportModal={() => setIsExportModalOpen(true)}
        />
      )}
      
      <main className={cn("flex-1 border-r flex flex-col overflow-hidden", darkMode ? "border-[#333] bg-[#1A1A1A]" : "border-[#EEEEEE] bg-white")}>
        <Editor 
          chapter={activeChapter}
          onSave={saveChapter}
          onCreateVersion={createVersion}
          darkMode={darkMode}
        />
      </main>

      {!isDistractionFree && (
        <aside className={cn("w-80 border-l flex flex-col shrink-0", darkMode ? "border-[#333] bg-[#121212]" : "border-[#EEEEEE] bg-[#FAFAFA]")}>
          <div className={cn("flex border-b", darkMode ? "border-[#333] bg-[#1A1A1A]" : "border-[#EEEEEE] bg-white")}>
            <button 
              onClick={() => setActiveTab('chat')}
              className={cn("flex-1 py-3 flex justify-center items-center gap-2 border-b-2 text-sm font-medium transition-colors", activeTab === 'chat' ? (darkMode ? "border-white text-white" : "border-[#1A1A1A] text-[#1A1A1A]") : "border-transparent text-[#888] hover:text-[#333] hover:bg-[#F5F5F5]")}
            >
              <MessageSquare className="w-4 h-4" /> Chat
            </button>
            <button 
              onClick={() => setActiveTab('characters')}
              className={cn("flex-1 py-3 flex justify-center items-center gap-2 border-b-2 text-sm font-medium transition-colors", activeTab === 'characters' ? (darkMode ? "border-white text-white" : "border-[#1A1A1A] text-[#1A1A1A]") : "border-transparent text-[#888] hover:text-[#333] hover:bg-[#F5F5F5]")}
            >
              <Users className="w-4 h-4" /> Cast
            </button>
            <button 
              onClick={() => setActiveTab('versions')}
              className={cn("flex-1 py-3 flex justify-center items-center gap-2 border-b-2 text-sm font-medium transition-colors", activeTab === 'versions' ? (darkMode ? "border-white text-white" : "border-[#1A1A1A] text-[#1A1A1A]") : "border-transparent text-[#888] hover:text-[#333] hover:bg-[#F5F5F5]")}
            >
              <History className="w-4 h-4" /> Hist
            </button>
            <button 
              onClick={() => setActiveTab('notes')}
              className={cn("flex-1 py-3 flex justify-center items-center gap-2 border-b-2 text-sm font-medium transition-colors", activeTab === 'notes' ? (darkMode ? "border-white text-white" : "border-[#1A1A1A] text-[#1A1A1A]") : "border-transparent text-[#888] hover:text-[#333] hover:bg-[#F5F5F5]")}
            >
              <Book className="w-4 h-4" /> Notes
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'chat' && <Chat activeChapter={activeChapter} characters={characters} />}
            {activeTab === 'characters' && (
              <Characters 
                characters={characters} 
                novelId={activeNovel?.id} 
                onAdd={addCharacter} 
                onDelete={deleteCharacter} 
              />
            )}
            {activeTab === 'versions' && (
              <Versions 
                activeChapter={activeChapter} 
                versions={versions.filter(v => v.chapterId === activeChapter?.id)}
                onRestore={(content) => saveChapter(activeChapter!.id, content)} 
              />
            )}
            {activeTab === 'notes' && (
              <div className="flex flex-col gap-2 h-full">
                <input
                  type="text"
                  placeholder="Reference Link (URL)..."
                  value={novelNotes.link}
                  onChange={(e) => setNovelNotes({...novelNotes, link: e.target.value})}
                  className={cn("w-full p-2 border border-transparent focus:border-[#EEE] rounded outline-none bg-transparent text-sm", darkMode ? "text-[#E0E0E0]" : "text-[#1A1A1A]")}
                />
                <textarea 
                  value={novelNotes.text}
                  onChange={(e) => setNovelNotes({...novelNotes, text: e.target.value})}
                  className={cn("w-full flex-1 p-2 border border-transparent focus:border-[#EEE] rounded outline-none resize-none bg-transparent", darkMode ? "text-[#E0E0E0]" : "text-[#1A1A1A]")}
                  placeholder="Write your general novel notes, plot ideas, or research here..."
                />
                {novelNotes.link && (
                  <a href={novelNotes.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline p-2">Visit Reference</a>
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        novel={activeNovel}
        chapters={chapters}
        characters={characters}
        activeChapter={activeChapter}
        novelNotes={novelNotes}
        userName={user?.displayName || 'Author'}
        onExportJson={exportData}
        onImportJson={importData}
        onImportChapters={importChapters}
        onUpdateActiveChapterContent={(content) => {
          if (activeChapter) {
            saveChapter(activeChapter.id, content, activeChapter.title);
          }
        }}
        darkMode={darkMode}
      />
    </div>
  );
}