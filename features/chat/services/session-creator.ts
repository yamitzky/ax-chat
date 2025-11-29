import type { LLMProvider } from '@/lib/ai/providers';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { ChatSessionRepository } from '../infrastructure/chat-session-repository';
import type { ChatSession } from '../types';
import { generateTitle } from '../utils/title-generator';

type CreateSessionOptions = {
  llmProvider: LLMProvider;
  useWebSearch: boolean;
};

export async function createAndNavigateToSession(
  content: string,
  options: CreateSessionOptions,
  repository: ChatSessionRepository,
  router: AppRouterInstance
): Promise<ChatSession> {
  const now = Date.now();
  const newSessionId = crypto.randomUUID();

  const newSession: ChatSession = {
    id: newSessionId,
    title: generateTitle(content),
    data: {
      llmProvider: options.llmProvider,
      useWebSearch: options.useWebSearch,
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
    },
  };

  await repository.create(newSession);
  router.replace(`/${newSessionId}`);

  return newSession;
}
