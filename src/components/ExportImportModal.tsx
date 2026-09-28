import React, { useState, useRef } from 'react';
import { Chapter, Character, Novel } from '../types';
import { 
  Download, 
  Upload, 
  X, 
  FileText, 
  FileCode, 
  FileType, 
  Database, 
  Check, 
  AlertCircle, 
  BookOpen, 
  Settings2, 
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { cn } from '../lib/utils';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  novel: Novel | null;
  chapters: Chapter[];
  characters: Character[];
  activeChapter: Chapter | null;
  novelNotes?: { text: string; link: string };
  userName?: string;
  onExportJson: () => string | null;
  onImportJson: (data: string) => void;
  onImportChapters: (chaptersList: { title: string; content: string }[]) => void;
  onUpdateActiveChapterContent?: (content: string) => void;
  darkMode?: boolean;
}

type ExportFormat = 'pdf' | 'markdown' | 'txt' | 'json';
type ExportScope = 'full' | 'active_chapter';

export function ExportImportModal({
  isOpen,
  onClose,
  novel,
  chapters,
  characters,
  activeChapter,
  novelNotes,
  userName = 'Author',
  onExportJson,
  onImportJson,
  onImportChapters,
  onUpdateActiveChapterContent,
  darkMode = false,
}: ExportImportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  
  // Export Settings State
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [scope, setScope] = useState<ExportScope>('full');
  const [authorName, setAuthorName] = useState(userName || 'Author');
  const [includeCover, setIncludeCover] = useState(true);
  const [includeTOC, setIncludeTOC] = useState(true);
  const [includeCharacters, setIncludeCharacters] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [pdfFont, setPdfFont] = useState<'times' | 'helvetica' | 'courier'>('times');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'md_txt' | 'json'>('md_txt');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{ title: string; content: string }[] | null>(null);
  const [importTargetMode, setImportTargetMode] = useState<'append' | 'replace_active'>('append');

  if (!isOpen) return null;

  // Compute manuscript metrics
  const targetChapters = scope === 'full' ? chapters : (activeChapter ? [activeChapter] : []);
  const totalWords = targetChapters.reduce((acc, chap) => {
    const words = chap.content.trim() ? chap.content.trim().split(/\s+/).length : 0;
    return acc + words;
  }, 0);
  const totalCharacters = targetChapters.reduce((acc, chap) => acc + (chap.content ? chap.content.length : 0), 0);
  const estimatedPages = Math.max(1, Math.ceil(totalWords / 275)); // Standard novel ~275 words per page

  // --- Export Generators ---

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    
    try {
      if (format === 'json') {
        const rawJson = onExportJson();
        if (!rawJson) throw new Error('No data available to export');
        downloadFile(rawJson, `${(novel?.title || 'novel').toLowerCase().replace(/\s+/g, '-')}-backup.json`, 'application/json');
      } else if (format === 'markdown') {
        generateMarkdownExport();
      } else if (format === 'txt') {
        generateTextExport();
      } else if (format === 'pdf') {
        generatePdfExport();
      }
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Failed to export: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateMarkdownExport = () => {
    const novelTitle = novel?.title || 'Manuscript';
    let md = '';

    if (scope === 'full') {
      md += `# ${novelTitle}\n\n`;
      md += `**Author:** ${authorName}\n\n`;
      md += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
      md += `**Word Count:** ${totalWords.toLocaleString()} words\n\n`;
      
      if (novel?.synopsis) {
        md += `## Synopsis\n\n${novel.synopsis}\n\n`;
      }

      if (includeTOC && chapters.length > 0) {
        md += `## Table of Contents\n\n`;
        chapters.forEach((ch, idx) => {
          md += `${idx + 1}. [${ch.title}](#${encodeURIComponent(ch.title.toLowerCase().replace(/\s+/g, '-'))})\n`;
        });
        md += `\n---\n\n`;
      }

      chapters.forEach((ch, idx) => {
        md += `## ${ch.title}\n\n`;
        md += `${ch.content || '*[Empty chapter]*'}\n\n`;
        if (idx < chapters.length - 1) {
          md += `\n---\n\n`;
        }
      });

      if (includeCharacters && characters.length > 0) {
        md += `\n---\n\n## Appendix: Dramatis Personae\n\n`;
        characters.forEach((char) => {
          md += `### ${char.name} (${char.role || 'Supporting'})\n`;
          if (char.description) md += `${char.description}\n\n`;
          if (char.notes) md += `*Notes:* ${char.notes}\n\n`;
          if (char.link) md += `*Reference:* [${char.link}](${char.link})\n\n`;
        });
      }

      if (includeNotes && novelNotes?.text) {
        md += `\n---\n\n## Appendix: Worldbuilding & Notes\n\n${novelNotes.text}\n\n`;
        if (novelNotes.link) {
          md += `*Research Link:* [${novelNotes.link}](${novelNotes.link})\n\n`;
        }
      }
    } else {
      const chapter = activeChapter || chapters[0];
      md += `# ${chapter?.title || 'Chapter'}\n\n`;
      md += `*From novel: ${novelTitle} by ${authorName}*\n\n`;
      md += `${chapter?.content || ''}\n`;
    }

    const safeFilename = `${(novelTitle).toLowerCase().replace(/[^a-z0-9]/gi, '_')}${scope === 'active_chapter' ? `_${activeChapter?.title || 'chapter'}` : ''}.md`;
    downloadFile(md, safeFilename, 'text/markdown;charset=utf-8');
  };

  const generateTextExport = () => {
    const novelTitle = novel?.title || 'Manuscript';
    let txt = '';

    if (scope === 'full') {
      txt += `${novelTitle.toUpperCase()}\n`;
      txt += `by ${authorName}\n`;
      txt += `Date: ${new Date().toLocaleDateString()}\n`;
      txt += `Word Count: ${totalWords.toLocaleString()} words\n`;
      txt += `==================================================\n\n\n`;

      chapters.forEach((ch) => {
        txt += `\n\n--------------------------------------------------\n`;
        txt += `${ch.title.toUpperCase()}\n`;
        txt += `--------------------------------------------------\n\n`;
        txt += `${ch.content || ''}\n\n`;
      });
    } else {
      const chapter = activeChapter || chapters[0];
      txt += `${chapter?.title.toUpperCase() || 'CHAPTER'}\n`;
      txt += `Novel: ${novelTitle} | Author: ${authorName}\n\n`;
      txt += `${chapter?.content || ''}\n`;
    }

    const safeFilename = `${(novelTitle).toLowerCase().replace(/[^a-z0-9]/gi, '_')}${scope === 'active_chapter' ? `_${activeChapter?.title || 'chapter'}` : ''}.txt`;
    downloadFile(txt, safeFilename, 'text/plain;charset=utf-8');
  };

  const generatePdfExport = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 22;
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 6.5;

    doc.setFont(pdfFont);

    // 1. Cover / Title Page
    if (scope === 'full' && includeCover) {
      doc.setFontSize(26);
      doc.text(novel?.title || 'Manuscript', pageWidth / 2, 90, { align: 'center' });

      doc.setFontSize(14);
      doc.text(`by ${authorName}`, pageWidth / 2, 110, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`${totalWords.toLocaleString()} Words • ${chapters.length} Chapters`, pageWidth / 2, 230, { align: 'center' });
      doc.text(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth / 2, 238, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      doc.addPage();
    }

    // 2. Table of Contents
    if (scope === 'full' && includeTOC && chapters.length > 1) {
      doc.setFontSize(18);
      doc.text('Table of Contents', margin, 35);
      doc.setLineWidth(0.3);
      doc.line(margin, 40, margin + 45, 40);

      doc.setFontSize(11);
      let tocY = 55;
      chapters.forEach((ch, idx) => {
        if (tocY > pageHeight - 30) {
          doc.addPage();
          tocY = 35;
        }
        const chapterNum = `${idx + 1}.`;
        doc.text(chapterNum, margin, tocY);
        doc.text(ch.title, margin + 10, tocY);
        tocY += 8;
      });

      doc.addPage();
    }

    // 3. Chapters
    const chaptersToPrint = scope === 'full' ? chapters : (activeChapter ? [activeChapter] : []);

    chaptersToPrint.forEach((ch, chapIndex) => {
      if (chapIndex > 0 || (scope === 'full' && (includeCover || includeTOC))) {
        // Already on a fresh page
      }

      let cursorY = 40;

      // Chapter Heading
      doc.setFontSize(18);
      doc.text(ch.title, pageWidth / 2, cursorY, { align: 'center' });
      
      cursorY += 8;
      doc.setLineWidth(0.2);
      doc.setDrawColor(180, 180, 180);
      doc.line(pageWidth / 2 - 20, cursorY, pageWidth / 2 + 20, cursorY);
      cursorY += 15;

      // Chapter Content
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);

      const paragraphs = (ch.content || '').split('\n');
      
      paragraphs.forEach((p) => {
        const trimmed = p.trim();
        if (!trimmed) {
          cursorY += lineHeight * 0.8;
          return;
        }

        // Split text into fitted lines
        const lines = doc.splitTextToSize(trimmed, contentWidth);

        lines.forEach((line: string) => {
          if (cursorY > pageHeight - margin - 15) {
            doc.addPage();
            cursorY = margin + 10;
          }
          doc.text(line, margin, cursorY);
          cursorY += lineHeight;
        });

        cursorY += lineHeight * 0.4;
      });

      if (chapIndex < chaptersToPrint.length - 1) {
        doc.addPage();
      }
    });

    // 4. Character Appendix (if included)
    if (scope === 'full' && includeCharacters && characters.length > 0) {
      doc.addPage();
      let charY = 35;
      doc.setFontSize(18);
      doc.text('Dramatis Personae', margin, charY);
      doc.setLineWidth(0.3);
      doc.line(margin, charY + 5, margin + 45, charY + 5);
      charY += 20;

      characters.forEach((char) => {
        if (charY > pageHeight - 40) {
          doc.addPage();
          charY = 30;
        }

        doc.setFontSize(12);
        doc.setFont(pdfFont, 'bold');
        doc.text(`${char.name} — ${char.role || 'Character'}`, margin, charY);
        charY += 6;

        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(10);
        if (char.description) {
          const descLines = doc.splitTextToSize(char.description, contentWidth);
          descLines.forEach((l: string) => {
            doc.text(l, margin, charY);
            charY += 5;
          });
        }
        if (char.notes) {
          const noteLines = doc.splitTextToSize(`Notes: ${char.notes}`, contentWidth);
          noteLines.forEach((l: string) => {
            doc.text(l, margin, charY);
            charY += 5;
          });
        }
        charY += 5;
      });
    }

    // 5. Add Page Numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      // Skip page number on cover page
      if (i === 1 && scope === 'full' && includeCover) continue;

      doc.setFontSize(9);
      doc.setTextColor(140, 140, 140);
      doc.text(`${i}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
      
      // Top header (novel title)
      if (i > 1) {
        doc.text(novel?.title || 'Manuscript', margin, 14);
      }
    }

    const safeFilename = `${(novel?.title || 'manuscript').toLowerCase().replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(safeFilename);
  };

  // --- Smart Import Logic ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportStatus(null);
    setParsedPreview(null);

    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          if (!parsed.novels && !parsed.chapters) {
            throw new Error('Invalid backup file format: missing novels/chapters structure');
          }
          setImportStatus(`Valid backup found with ${parsed.chapters?.length || 0} chapters and ${parsed.characters?.length || 0} characters.`);
          setParsedPreview(null);
          // Set to trigger restore directly or via button
        } catch (err: any) {
          setImportError('Failed to parse JSON backup: ' + err.message);
        }
      };
      reader.readAsText(file);
    } else {
      // Markdown or Text file
      reader.onload = (event) => {
        try {
          const rawText = event.target?.result as string;
          const parsedChapters = parseMarkdownOrText(rawText, file.name);
          if (parsedChapters.length === 0) {
            throw new Error('No readable content found in file.');
          }
          setParsedPreview(parsedChapters);
          setImportStatus(`Parsed ${parsedChapters.length} chapter(s) from "${file.name}".`);
        } catch (err: any) {
          setImportError('Failed to read file: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const parseMarkdownOrText = (raw: string, filename: string): { title: string; content: string }[] => {
    const lines = raw.split(/\r?\n/);
    const chapters: { title: string; content: string }[] = [];
    
    let currentTitle = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    let currentLines: string[] = [];
    let foundExplicitChapter = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check for Markdown headers or standard chapter headings
      const headerMatch = line.match(/^#{1,3}\s+(Chapter\s+\d+|.+)/i) || line.match(/^(Chapter\s+\d+[:\s\w]*)$/i);

      if (headerMatch) {
        if (currentLines.length > 0 || foundExplicitChapter) {
          const textContent = currentLines.join('\n').trim();
          if (textContent || foundExplicitChapter) {
            chapters.push({
              title: currentTitle,
              content: textContent,
            });
          }
        }
        currentTitle = headerMatch[1].replace(/^#+\s*/, '').trim();
        currentLines = [];
        foundExplicitChapter = true;
      } else {
        currentLines.push(line);
      }
    }

    // Add trailing chapter
    if (currentLines.length > 0 || chapters.length === 0) {
      chapters.push({
        title: currentTitle,
        content: currentLines.join('\n').trim(),
      });
    }

    return chapters;
  };

  const confirmImport = () => {
    if (importType === 'json' || fileInputRef.current?.files?.[0]?.name.endsWith('.json')) {
      const file = fileInputRef.current?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onImportJson(content);
        onClose();
      };
      reader.readAsText(file);
    } else if (parsedPreview && parsedPreview.length > 0) {
      if (importTargetMode === 'replace_active' && activeChapter && onUpdateActiveChapterContent) {
        onUpdateActiveChapterContent(parsedPreview.map(c => c.content).join('\n\n'));
      } else {
        onImportChapters(parsedPreview);
      }
      setImportStatus(`Successfully imported ${parsedPreview.length} chapter(s)!`);
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className={cn(
          "w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border transition-all",
          darkMode ? "bg-[#181818] border-[#333] text-[#E0E0E0]" : "bg-white border-[#E5E5E5] text-[#1A1A1A]"
        )}
      >
        {/* Modal Header */}
        <div className={cn("flex items-center justify-between px-6 py-4 border-b", darkMode ? "border-[#2A2A2A]" : "border-[#EEEEEE]")}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", darkMode ? "bg-white/10" : "bg-black/5")}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Manuscript Export & Import</h2>
              <p className="text-xs text-[#888]">
                {novel?.title || 'Active Novel'} • {chapters.length} Chapters • {totalWords.toLocaleString()} Words
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={cn("p-2 rounded-full transition-colors", darkMode ? "hover:bg-white/10 text-[#888] hover:text-white" : "hover:bg-black/5 text-[#888] hover:text-black")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className={cn("flex border-b px-6", darkMode ? "border-[#2A2A2A] bg-[#141414]" : "border-[#EEEEEE] bg-[#FAFAFA]")}>
          <button
            onClick={() => setActiveTab('export')}
            className={cn(
              "flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'export'
                ? (darkMode ? "border-white text-white" : "border-[#1A1A1A] text-[#1A1A1A]")
                : "border-transparent text-[#888] hover:text-[#555]"
            )}
          >
            <Download className="w-4 h-4" />
            Export Manuscript
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={cn(
              "flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'import'
                ? (darkMode ? "border-white text-white" : "border-[#1A1A1A] text-[#1A1A1A]")
                : "border-transparent text-[#888] hover:text-[#555]"
            )}
          >
            <Upload className="w-4 h-4" />
            Import & Restore
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'export' ? (
            <div className="space-y-6">
              {/* Format Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#888] block mb-3">
                  1. Select Export Format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormat('pdf')}
                    className={cn(
                      "p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all",
                      format === 'pdf'
                        ? (darkMode ? "border-white bg-white/10 ring-1 ring-white" : "border-[#1A1A1A] bg-black/5 ring-1 ring-[#1A1A1A]")
                        : (darkMode ? "border-[#333] hover:border-[#555]" : "border-[#E5E5E5] hover:border-[#CCC]")
                    )}
                  >
                    <FileType className="w-6 h-6 text-red-500" />
                    <div>
                      <div className="text-xs font-semibold">PDF Document</div>
                      <div className="text-[10px] text-[#888]">Formatted book</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('markdown')}
                    className={cn(
                      "p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all",
                      format === 'markdown'
                        ? (darkMode ? "border-white bg-white/10 ring-1 ring-white" : "border-[#1A1A1A] bg-black/5 ring-1 ring-[#1A1A1A]")
                        : (darkMode ? "border-[#333] hover:border-[#555]" : "border-[#E5E5E5] hover:border-[#CCC]")
                    )}
                  >
                    <FileCode className="w-6 h-6 text-blue-500" />
                    <div>
                      <div className="text-xs font-semibold">Markdown (.md)</div>
                      <div className="text-[10px] text-[#888]">Obsidian / Ulysses</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('txt')}
                    className={cn(
                      "p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all",
                      format === 'txt'
                        ? (darkMode ? "border-white bg-white/10 ring-1 ring-white" : "border-[#1A1A1A] bg-black/5 ring-1 ring-[#1A1A1A]")
                        : (darkMode ? "border-[#333] hover:border-[#555]" : "border-[#E5E5E5] hover:border-[#CCC]")
                    )}
                  >
                    <FileText className="w-6 h-6 text-amber-500" />
                    <div>
                      <div className="text-xs font-semibold">Plain Text (.txt)</div>
                      <div className="text-[10px] text-[#888]">Universal draft</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('json')}
                    className={cn(
                      "p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all",
                      format === 'json'
                        ? (darkMode ? "border-white bg-white/10 ring-1 ring-white" : "border-[#1A1A1A] bg-black/5 ring-1 ring-[#1A1A1A]")
                        : (darkMode ? "border-[#333] hover:border-[#555]" : "border-[#E5E5E5] hover:border-[#CCC]")
                    )}
                  >
                    <Database className="w-6 h-6 text-emerald-500" />
                    <div>
                      <div className="text-xs font-semibold">Project JSON</div>
                      <div className="text-[10px] text-[#888]">Full raw backup</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Scope & Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#888] block mb-2">
                    Scope
                  </label>
                  <div className={cn("p-1 rounded-xl border flex gap-1", darkMode ? "border-[#333] bg-[#121212]" : "border-[#E5E5E5] bg-[#F9F9F9]")}>
                    <button
                      type="button"
                      onClick={() => setScope('full')}
                      className={cn(
                        "flex-1 py-1.5 px-3 text-xs rounded-lg font-medium transition-all",
                        scope === 'full'
                          ? (darkMode ? "bg-white text-black shadow-xs" : "bg-white text-black shadow-xs")
                          : "text-[#888] hover:text-[#555]"
                      )}
                    >
                      Entire Novel ({chapters.length} Ch)
                    </button>
                    <button
                      type="button"
                      onClick={() => setScope('active_chapter')}
                      className={cn(
                        "flex-1 py-1.5 px-3 text-xs rounded-lg font-medium transition-all",
                        scope === 'active_chapter'
                          ? (darkMode ? "bg-white text-black shadow-xs" : "bg-white text-black shadow-xs")
                          : "text-[#888] hover:text-[#555]"
                      )}
                    >
                      Current Chapter
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#888] block mb-2">
                    Author Attribution
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Author Name"
                    className={cn(
                      "w-full text-xs p-2.5 rounded-xl border outline-none transition-colors",
                      darkMode ? "bg-[#121212] border-[#333] focus:border-white" : "bg-white border-[#E5E5E5] focus:border-black"
                    )}
                  />
                </div>
              </div>

              {/* Format-Specific Customizations */}
              {format === 'pdf' && (
                <div className={cn("p-4 rounded-xl border space-y-3", darkMode ? "border-[#2E2E2E] bg-[#141414]" : "border-[#EEEEEE] bg-[#FAFAFA]")}>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Settings2 className="w-4 h-4 text-[#888]" />
                    PDF Book Layout Options
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={includeCover} 
                        onChange={(e) => setIncludeCover(e.target.checked)} 
                        className="rounded accent-black"
                      />
                      <span>Title & Cover Page</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={includeTOC} 
                        onChange={(e) => setIncludeTOC(e.target.checked)} 
                        className="rounded accent-black"
                      />
                      <span>Table of Contents</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={includeCharacters} 
                        onChange={(e) => setIncludeCharacters(e.target.checked)} 
                        className="rounded accent-black"
                      />
                      <span>Cast Appendix</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-xs text-[#888]">Typography:</span>
                    <div className="flex gap-2">
                      {(['times', 'helvetica', 'courier'] as const).map((fontName) => (
                        <button
                          key={fontName}
                          type="button"
                          onClick={() => setPdfFont(fontName)}
                          className={cn(
                            "px-2.5 py-1 text-xs rounded border capitalize transition-colors",
                            pdfFont === fontName
                              ? (darkMode ? "bg-white text-black border-white" : "bg-black text-white border-black")
                              : (darkMode ? "border-[#333] text-[#888]" : "border-[#E5E5E5] text-[#666]")
                          )}
                        >
                          {fontName === 'times' ? 'Classic Serif' : fontName === 'helvetica' ? 'Clean Sans' : 'Typewriter'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {format === 'markdown' && (
                <div className={cn("p-4 rounded-xl border space-y-2", darkMode ? "border-[#2E2E2E] bg-[#141414]" : "border-[#EEEEEE] bg-[#FAFAFA]")}>
                  <div className="text-xs font-semibold">Markdown Options</div>
                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={includeTOC} 
                        onChange={(e) => setIncludeTOC(e.target.checked)} 
                        className="rounded accent-black"
                      />
                      <span>Generate Markdown TOC</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={includeCharacters} 
                        onChange={(e) => setIncludeCharacters(e.target.checked)} 
                        className="rounded accent-black"
                      />
                      <span>Include Character Appendix</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={includeNotes} 
                        onChange={(e) => setIncludeNotes(e.target.checked)} 
                        className="rounded accent-black"
                      />
                      <span>Include Novel Notes</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Stats Summary Bar */}
              <div className={cn("p-4 rounded-xl flex items-center justify-between text-xs", darkMode ? "bg-[#1F1F1F]" : "bg-[#F3F4F6]")}>
                <div className="flex gap-4 sm:gap-6">
                  <div>
                    <span className="text-[#888] block text-[10px] uppercase tracking-wider">Words</span>
                    <span className="font-bold text-sm">{totalWords.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#888] block text-[10px] uppercase tracking-wider">Est. Pages</span>
                    <span className="font-bold text-sm">~{estimatedPages}</span>
                  </div>
                  <div>
                    <span className="text-[#888] block text-[10px] uppercase tracking-wider">Chapters</span>
                    <span className="font-bold text-sm">{targetChapters.length}</span>
                  </div>
                </div>
                <div className="text-right text-[#888] text-[11px] hidden sm:block">
                  Ready to download in <span className="font-semibold uppercase">{format}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Import Type Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#888] block mb-3">
                  Import Source
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setImportType('md_txt');
                      setParsedPreview(null);
                      setImportError(null);
                      setImportStatus(null);
                    }}
                    className={cn(
                      "p-4 rounded-xl border flex items-center gap-3 text-left transition-all",
                      importType === 'md_txt'
                        ? (darkMode ? "border-white bg-white/10 ring-1 ring-white" : "border-[#1A1A1A] bg-black/5 ring-1 ring-[#1A1A1A]")
                        : (darkMode ? "border-[#333]" : "border-[#E5E5E5]")
                    )}
                  >
                    <FileCode className="w-6 h-6 text-blue-500 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">Markdown / Text (.md, .txt)</div>
                      <div className="text-[11px] text-[#888]">Import manuscript chapters</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImportType('json');
                      setParsedPreview(null);
                      setImportError(null);
                      setImportStatus(null);
                    }}
                    className={cn(
                      "p-4 rounded-xl border flex items-center gap-3 text-left transition-all",
                      importType === 'json'
                        ? (darkMode ? "border-white bg-white/10 ring-1 ring-white" : "border-[#1A1A1A] bg-black/5 ring-1 ring-[#1A1A1A]")
                        : (darkMode ? "border-[#333]" : "border-[#E5E5E5]")
                    )}
                  >
                    <Database className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">Full Backup (.json)</div>
                      <div className="text-[11px] text-[#888]">Restore entire novel workspace</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.005]",
                  darkMode 
                    ? "border-[#333] hover:border-[#666] bg-[#141414]" 
                    : "border-[#D1D5DB] hover:border-[#9CA3AF] bg-[#FAFAFA]"
                )}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept={importType === 'json' ? '.json' : '.md,.txt,.markdown'}
                />
                <div className={cn("p-4 rounded-full mb-3", darkMode ? "bg-white/10" : "bg-black/5")}>
                  <Upload className="w-6 h-6 text-[#888]" />
                </div>
                <div className="text-sm font-semibold mb-1">
                  Click to choose a file or drag & drop
                </div>
                <div className="text-xs text-[#888]">
                  {importType === 'json' ? 'Accepts .json backup file' : 'Accepts .md, .markdown, or .txt files'}
                </div>
              </div>

              {/* Import Feedback */}
              {importStatus && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}

              {importError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Chapter Preview for Markdown/Txt */}
              {parsedPreview && parsedPreview.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">Detected Chapters ({parsedPreview.length})</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          name="import_mode" 
                          checked={importTargetMode === 'append'} 
                          onChange={() => setImportTargetMode('append')}
                          className="accent-black"
                        />
                        <span>Append as New Chapters</span>
                      </label>
                      {activeChapter && (
                        <label className="flex items-center gap-1.5 cursor-pointer ml-2">
                          <input 
                            type="radio" 
                            name="import_mode" 
                            checked={importTargetMode === 'replace_active'} 
                            onChange={() => setImportTargetMode('replace_active')}
                            className="accent-black"
                          />
                          <span>Replace Current Chapter</span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className={cn("max-h-40 overflow-y-auto rounded-xl border p-2 space-y-1.5", darkMode ? "border-[#2E2E2E] bg-[#121212]" : "border-[#E5E5E5] bg-[#F9F9F9]")}>
                    {parsedPreview.map((c, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-black/5 dark:hover:bg-white/5">
                        <span className="font-medium truncate">{i + 1}. {c.title}</span>
                        <span className="text-[#888] text-[11px] shrink-0 ml-2">
                          {c.content.trim() ? c.content.trim().split(/\s+/).length : 0} words
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={cn("px-6 py-4 border-t flex items-center justify-between", darkMode ? "border-[#2A2A2A] bg-[#141414]" : "border-[#EEEEEE] bg-[#FAFAFA]")}>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "px-4 py-2 text-xs font-medium rounded-xl transition-colors",
              darkMode ? "hover:bg-white/10 text-[#AAA]" : "hover:bg-black/5 text-[#666]"
            )}
          >
            Cancel
          </button>

          {activeTab === 'export' ? (
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className={cn(
                "px-5 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm",
                exportSuccess 
                  ? "bg-emerald-600 text-white" 
                  : (darkMode ? "bg-white text-black hover:bg-gray-200" : "bg-[#1A1A1A] text-white hover:bg-[#333]"),
                isExporting ? "opacity-75 cursor-not-allowed" : ""
              )}
            >
              {isExporting ? (
                <span>Generating {format.toUpperCase()}...</span>
              ) : exportSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download {format.toUpperCase()}</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={confirmImport}
              disabled={!parsedPreview && !importStatus}
              className={cn(
                "px-5 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm",
                (parsedPreview || importStatus)
                  ? (darkMode ? "bg-white text-black hover:bg-gray-200" : "bg-[#1A1A1A] text-white hover:bg-[#333]")
                  : "opacity-40 cursor-not-allowed bg-gray-400 text-white"
              )}
            >
              <Upload className="w-4 h-4" />
              <span>Confirm & Apply Import</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
