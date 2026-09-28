import React, { useState } from 'react';
import { Character } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface CharactersProps {
  characters: Character[];
  novelId: string | undefined;
  onAdd: (character: Omit<Character, 'id'>) => void;
  onDelete: (id: string) => void;
}

export function Characters({ characters, novelId, onAdd, onDelete }: CharactersProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newChar, setNewChar] = useState({ name: '', role: '', description: '', notes: '', link: '' });

  const handleAdd = () => {
    if (!novelId || !newChar.name) return;
    onAdd({
      ...newChar,
      novelId,
    });
    setNewChar({ name: '', role: '', description: '', notes: '', link: '' });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this character?")) {
      onDelete(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] overflow-y-auto">
      <div className="p-4 border-b border-[#EEEEEE] flex justify-between items-center sticky top-0 bg-white">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-tight text-[#666]">Characters</h3>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 bg-[#F5F5F5] text-[#888] rounded hover:bg-[#EEEEEE] transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {isAdding && (
          <div className="border border-[#EEEEEE] rounded p-3 bg-white shadow-sm space-y-3">
            <input 
              placeholder="Name" 
              className="w-full text-sm p-1.5 border border-[#EEEEEE] rounded outline-none focus:border-[#AAA]"
              value={newChar.name} onChange={e => setNewChar({...newChar, name: e.target.value})}
            />
            <input 
              placeholder="Role (e.g. Protagonist)" 
              className="w-full text-sm p-1.5 border border-[#EEEEEE] rounded outline-none focus:border-[#AAA]"
              value={newChar.role} onChange={e => setNewChar({...newChar, role: e.target.value})}
            />
            <textarea 
              placeholder="Description & Traits" 
              className="w-full text-sm p-1.5 border border-[#EEEEEE] rounded resize-none h-20 outline-none focus:border-[#AAA]"
              value={newChar.description} onChange={e => setNewChar({...newChar, description: e.target.value})}
            />
            <input 
              placeholder="Research Link (URL)" 
              className="w-full text-sm p-1.5 border border-[#EEEEEE] rounded outline-none focus:border-[#AAA]"
              value={newChar.link} onChange={e => setNewChar({...newChar, link: e.target.value})}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAdding(false)} className="text-xs text-[#888] hover:text-[#333]">Cancel</button>
              <button onClick={handleAdd} className="text-xs bg-[#1A1A1A] text-white px-2 py-1 rounded">Save</button>
            </div>
          </div>
        )}
 
        {characters.map(char => (
          <div key={char.id} className="bg-white border border-[#EEEEEE] rounded shadow-sm p-3 group relative">
            <button 
              onClick={() => handleDelete(char.id)}
              className="absolute top-2 right-2 p-1 text-[#AAA] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 shrink-0 rounded-full bg-[#E0E7FF] flex items-center justify-center text-[10px] font-bold text-[#4F46E5] uppercase">
                {char.name.substring(0, 2)}
              </div>
              <h4 className="font-medium text-sm text-[#333]">{char.name}</h4>
            </div>
            <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-[#AAA] mb-2">
              {char.role || 'Unknown'}
            </span>
            <p className="text-xs text-[#555] line-clamp-3 leading-normal mb-2">{char.description}</p>
            {char.link && (
              <a href={char.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Reference Link</a>
            )}
          </div>
        ))}
        {characters.length === 0 && !isAdding && (
          <p className="text-sm text-[#AAA] text-center py-4">No characters added yet.</p>
        )}
      </div>
    </div>
  );
}
