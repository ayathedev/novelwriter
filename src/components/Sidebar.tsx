import React, { useRef } from 'react';
import { Chapter } from '../types';
import { FileText, Plus, Book, Settings, Download, Upload } from 'lucide-react';
import { jsPDF } from "jspdf";

interface SidebarProps {
  chapters: Chapter[];
  activeChapter: Chapter | null;
  onSelectChapter: (chapter: Chapter) => void;
  onCreateChapter: () => void;
  onExport: () => string | null;
  onImport: (data: string) => void;
  onCloseProject: () => void;
  onReorder: (chapters: Chapter[]) => void;
  onOpenExportModal?: () => void;
}

export function Sidebar({ 
  chapters, 
  activeChapter, 
  onSelectChapter, 
  onCreateChapter, 
  onExport, 
  onImport, 
  onCloseProject, 
  onReorder,
  onOpenExportModal 
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedChapter, setDraggedChapter] = React.useState<Chapter | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const filteredChapters = chapters.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleDragStart = (chapter: Chapter) => {
    setDraggedChapter(chapter);
  };

  const handleDragOver = (e: React.DragEvent, targetChapter: Chapter) => {
    e.preventDefault();
    if (!draggedChapter || draggedChapter.id === targetChapter.id) return;

    const items = [...chapters];
    const fromIndex = items.indexOf(draggedChapter);
    const toIndex = items.indexOf(targetChapter);
    
    items.splice(fromIndex, 1);
    items.splice(toIndex, 0, draggedChapter);
    
    const reordered = items.map((c, i) => ({ ...c, order: i }));
    onReorder(reordered);
  };
  const exportToPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    
    // Title Page
    doc.setFontSize(24);
    doc.text("Novel Manuscript", 105, 140, { align: "center" });
    doc.addPage();
    
    // Chapters
    doc.setFontSize(12);
    chapters.forEach((chap, idx) => {
      doc.setFontSize(16);
      doc.text(chap.title, 20, 20);
      y = 35;
      doc.setFontSize(12);
      
      const lines = doc.splitTextToSize(chap.content, 170);
      doc.text(lines, 20, y);
      
      if (idx < chapters.length - 1) {
        doc.addPage();
      }
    });
    
    doc.save("manuscript.pdf");
  };

  const handleExportData = () => {
    const data = onExport();
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-novel-data.json';
    link.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onImport(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-64 border-r border-[#EEEEEE] bg-white flex flex-col h-full shrink-0">
      <div className="p-6 pb-2">
        <button 
            onClick={onCloseProject}
            className="text-[11px] uppercase tracking-widest font-bold text-[#AAA] mb-4 flex items-center gap-2 hover:text-[#1A1A1A] transition-colors"
        >
          <Book className="w-4 h-4" />
          Novel Writer
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-6 mb-2">
           <input
             type="text"
             placeholder="Search chapters..."
             className="w-full text-sm p-2 border border-[#EEEEEE] rounded outline-none focus:border-[#AAA] mb-2"
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
           />
        </div>
        <div className="px-6 mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#AAA] uppercase tracking-widest">Chapters</span>
          <button 
            onClick={onCreateChapter}
            className="p-1 rounded hover:bg-[#F5F5F5] text-[#888] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <ul className="space-y-1 px-4">
          {filteredChapters.map(chapter => (
            <li 
              key={chapter.id}
              draggable
              onDragStart={() => handleDragStart(chapter)}
              onDragOver={(e) => handleDragOver(e, chapter)}
              onDragEnd={() => setDraggedChapter(null)}
            >
              <button
                onClick={() => onSelectChapter(chapter)}
                className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 text-sm transition-colors cursor-grab active:cursor-grabbing ${
                  activeChapter?.id === chapter.id 
                    ? 'bg-[#F5F5F5] text-[#1A1A1A] font-medium' 
                    : 'text-[#777] hover:bg-[#FAFAFA]'
                }`}
              >
                <FileText className="w-4 h-4 opacity-70" />
                <span className="truncate">{chapter.title}</span>
              </button>
            </li>
          ))}
          {filteredChapters.length === 0 && (
            <div className="px-4 py-2 text-sm text-[#AAA] italic">No chapters found.</div>
          )}
        </ul>
      </div>

      <div className="p-4 border-t border-[#F5F5F5] space-y-2">
        <button 
          onClick={onOpenExportModal || exportToPDF}
          className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold bg-[#1A1A1A] text-white hover:bg-[#333] rounded-xl transition-all shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Export / Import</span>
          </div>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">PDF • MD</span>
        </button>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImportData} 
          className="hidden" 
          accept=".json,.md,.txt"
        />
        <button 
          onClick={onOpenExportModal || exportToPDF}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#777] hover:text-[#1A1A1A] hover:bg-[#F5F5F5] rounded-lg transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Manuscript Settings & Export
        </button>
      </div>
    </div>
  );
}
