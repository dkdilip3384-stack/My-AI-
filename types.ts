
export interface CodeSnippet {
  language: string;
  code: string;
  filename?: string;
  isRunnable?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  snippets?: CodeSnippet[];
  timestamp: number;
}

export interface EngineStatus {
  isInitialized: boolean;
  activeEnvironment: string;
  systemLoad: number;
}
