import type { LLMProvider } from '@/lib/model-types';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;  // AIの思考プロセス（オプショナル）
};

export type SessionMetadata = {
  provider: LLMProvider;
  useWebSearch: boolean;
  createdAt: number;  // Unix timestamp
  updatedAt: number;
};

export type Session = {
  id: string;
  title: string;
  messages: Message[];
  metadata: SessionMetadata;
};

export type SessionListItem = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  provider: LLMProvider;
};
