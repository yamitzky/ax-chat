import type { LLMProvider } from '@/lib/model-types';
import { useSessionRepository } from '@/lib/session/repository';
import { useCallback } from 'react';
import type { ChatSession, ChatSessionData } from '../types';

export function useUpdateLLMProvider() {
  const repository = useSessionRepository<ChatSessionData>();

  const updateLLMProvider = useCallback(
    async (session: ChatSession, newProvider: LLMProvider) => {
      await repository.save({
        ...session,
        data: {
          ...session.data,
          llmProvider: newProvider,
        },
        metadata: {
          ...session.metadata,
          updatedAt: Date.now(),
        },
      });
    },
    [repository]
  );

  return { updateLLMProvider };
}
