export interface User {
  uid: string;
  displayName: string | null;
  isAnonymous: boolean;
}

export interface Novel {
  id: string;
  title: string;
  synopsis: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Chapter {
  id: string;
  novelId: string;
  title: string;
  content: string;
  order: number;
  updatedAt: number;
}

export interface Character {
  id: string;
  novelId: string;
  name: string;
  role: string; // 'Protagonist', 'Antagonist', 'Supporting', etc.
  description: string;
  notes: string;
  link?: string;
}

export interface Version {
  id: string;
  chapterId: string;
  novelId: string;
  content: string;
  summary: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
