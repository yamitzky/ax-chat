import type { LLMProvider } from '@/lib/ai/providers';
import { useCallback } from 'react';
import type { ChatSession } from '../../types';
import { useChatRepository } from '../use-chat-repository';

export function useUpdateLLMProvider() {
  const repository = useChatRepository();

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
