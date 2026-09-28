import React from 'react';
import { Chapter, Version } from '../types';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';

interface VersionsProps {
  activeChapter: Chapter | null;
  versions: Version[];
  onRestore: (content: string) => void;
}

export function Versions({ activeChapter, versions, onRestore }: VersionsProps) {
  if (!activeChapter) return null;

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] overflow-y-auto">
      <div className="p-4 border-b border-[#EEEEEE] sticky top-0 bg-white">
        <h3 className="text-xs font-bold uppercase tracking-tight text-[#666]">Version History</h3>
        <p className="text-xs text-[#888] mt-1">Track changes to '{activeChapter.title}'</p>
      </div>

      <div className="p-4 space-y-4">
        {versions.map(v => (
          <div key={v.id} className="bg-white border border-[#EEEEEE] rounded p-3 relative shadow-sm">
            <div className="flex items-center gap-1 text-xs text-[#AAA] mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{format(new Date(v.timestamp), "MMM d, h:mm a")}</span>
            </div>
            <p className="text-sm font-medium text-[#333] mb-2">{v.summary}</p>
            <button 
              onClick={() => {
                if (confirm("Restore this version? Unsaved changes will be lost.")) {
                  onRestore(v.content);
                }
              }}
              className="text-xs text-[#555] hover:text-[#1A1A1A] underline"
            >
              Restore this version
            </button>
          </div>
        ))}
        {versions.length === 0 && (
          <p className="text-sm text-[#AAA] text-center py-4">No saved versions for this chapter.</p>
        )}
      </div>
    </div>
  );
}
