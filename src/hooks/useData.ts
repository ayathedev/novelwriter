import { useEffect, useState } from "react";
import { Novel, Chapter, Character, Version } from "../types";
import { useAuth } from "./useAuth";

const STORAGE_KEY = "novel_writer_data";

export function useData() {
  const { user } = useAuth();
  
  const [novels, setNovels] = useState<Novel[]>([]);
  const [activeNovel, setActiveNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  // Load all data
  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const savedData = localStorage.getItem(STORAGE_KEY);
    const data = savedData ? JSON.parse(savedData) : { novels: [], chapters: [], characters: [], versions: [] };
    
    setNovels(data.novels.filter((n: Novel) => n.userId === user.uid));
    setLoading(false);
  }, [user]);

  const selectNovel = (novel: Novel) => {
    setActiveNovel(novel);
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    setChapters(savedData.chapters.filter((c: Chapter) => c.novelId === novel.id));
    setCharacters(savedData.characters.filter((c: Character) => c.novelId === novel.id));
    setVersions(savedData.versions.filter((v: Version) => v.novelId === novel.id));
  };

  const createNovel = (title: string) => {
    if (!user) return;
    const newNovel = { 
        id: Date.now().toString(), 
        title, 
        synopsis: "", 
        userId: user.uid, 
        createdAt: Date.now(), 
        updatedAt: Date.now() 
    };
    
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{ "novels": [], "chapters": [], "characters": [], "versions": [] }');
    savedData.novels.push(newNovel);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    setNovels([...novels, newNovel]);
    selectNovel(newNovel);
  };

  const saveData = (data: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Refresh local states
    if (activeNovel) {
      setChapters(data.chapters.filter((c: Chapter) => c.novelId === activeNovel.id));
      setCharacters(data.characters.filter((c: Character) => c.novelId === activeNovel.id));
      setVersions(data.versions.filter((v: Version) => v.novelId === activeNovel.id));
    }
  };

  const createChapter = async () => {
    if (!activeNovel) return;
    const newOrder = chapters.length > 0 ? Math.max(...chapters.map(c => c.order)) + 1 : 1;
    const newChap = { id: Date.now().toString(), novelId: activeNovel.id, title: `Chapter ${newOrder}`, content: "", order: newOrder, updatedAt: Date.now() };
    
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    savedData.chapters.push(newChap);
    saveData(savedData);
    setChapters([...chapters, newChap]);
    setActiveChapter(newChap);
  };

  const saveChapter = async (chapterId: string, content: string, title?: string) => {
    if (!activeNovel) return;
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const chapterIndex = savedData.chapters.findIndex((c: Chapter) => c.id === chapterId);
    if (chapterIndex === -1) return;
    
    savedData.chapters[chapterIndex] = { ...savedData.chapters[chapterIndex], content, updatedAt: Date.now(), ...(title !== undefined && { title }) };
    saveData(savedData);
    setChapters(savedData.chapters.filter((c: Chapter) => c.novelId === activeNovel.id));
  };

  const createVersion = async (chapterId: string, content: string, summary: string) => {
    if (!activeNovel) return;
    const newVersion = { id: Date.now().toString(), novelId: activeNovel.id, chapterId, content, summary, timestamp: Date.now() };
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    savedData.versions.push(newVersion);
    saveData(savedData);
  };

  const addCharacter = (character: Omit<Character, 'id'>) => {
    if (!activeNovel) return;
    const newChar = { ...character, id: Date.now().toString(), novelId: activeNovel.id };
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    savedData.characters.push(newChar);
    saveData(savedData);
    setCharacters([...characters, newChar]);
  };

  const importChapters = (newChaptersList: { title: string; content: string }[]) => {
    if (!activeNovel || newChaptersList.length === 0) return;
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    let maxOrder = chapters.length > 0 ? Math.max(...chapters.map(c => c.order)) : 0;
    
    const createdChapters: Chapter[] = newChaptersList.map((item, idx) => ({
      id: (Date.now() + idx).toString(),
      novelId: activeNovel.id,
      title: item.title || `Imported Chapter ${maxOrder + idx + 1}`,
      content: item.content || '',
      order: maxOrder + idx + 1,
      updatedAt: Date.now()
    }));

    savedData.chapters = [...(savedData.chapters || []), ...createdChapters];
    saveData(savedData);
    setChapters(prev => [...prev, ...createdChapters]);
    if (!activeChapter && createdChapters.length > 0) {
      setActiveChapter(createdChapters[0]);
    }
  };

  const deleteCharacter = (id: string) => {
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    savedData.characters = savedData.characters.filter((c: Character) => c.id !== id);
    saveData(savedData);
    setCharacters(savedData.characters.filter((c: Character) => c.novelId === activeNovel?.id));
  };

  const reorderChapters = (reorderedChapters: Chapter[]) => {
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    // Update the orders in the data
    const updatedChapters = savedData.chapters.map((c: Chapter) => {
      const reordered = reorderedChapters.find(rc => rc.id === c.id);
      return reordered ? { ...c, order: reordered.order } : c;
    });

    savedData.chapters = updatedChapters;
    saveData(savedData);
    setChapters(reorderedChapters.sort((a, b) => a.order - b.order));
  };

  const exportData = () => {
    return localStorage.getItem(STORAGE_KEY);
  };

  const importData = (data: string) => {
    localStorage.setItem(STORAGE_KEY, data);
    window.location.reload(); // Refresh to load new data
  };

  return {
    novels,
    activeNovel,
    setActiveNovel,
    selectNovel,
    createNovel,
    chapters,
    characters,
    versions,
    activeChapter,
    setActiveChapter,
    createChapter,
    saveChapter,
    createVersion,
    addCharacter,
    deleteCharacter,
    reorderChapters,
    exportData,
    importData,
    importChapters,
    loading
  };
}
