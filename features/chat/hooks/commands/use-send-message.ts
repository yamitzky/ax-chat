import type { LLMProvider } from '@/lib/ai/providers';
import { useStreamFetch } from '@/lib/stream/use-stream-fetch';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { ChatSession, Message } from '../../types';
import { createAndNavigateToSession } from '../../services/session-creator';
import { appendMessage } from '../../services/message-appender';
import { useChatRepository } from '../use-chat-repository';

type SendMessageOptions = {
  llmProvider: LLMProvider;  // より明確な命名
  useWebSearch: boolean;
};

type ChatRequest = {
  prompt: string;
  history: Array<{ role: string; content: string }>;
  llmProvider: LLMProvider;  // より明確な命名
  useWebSearch: boolean;
};

type ChatResponse = {
  answer: string;
  thought?: string;
};

export function useSendMessage(options: SendMessageOptions) {
  const router = useRouter();
  const repository = useChatRepository();
  const { fetchStream, isStreaming, abort } = useStreamFetch<ChatRequest, ChatResponse>();

  const sendMessage = useCallback(
    async (
      content: string,
      currentSession: ChatSession | undefined  // ChatSession型を使用
    ): Promise<string> => {
      // 1. セッション確定（新規なら作成して遷移）
      let session = currentSession;
      if (!session) {
        session = await createAndNavigateToSession(
          content,
          options,
          repository,
          router
        );
      }

      // 2. ユーザーメッセージを保存
      const userMessage: Partial<Message> = { role: 'user', content };
      await appendMessage(session, userMessage, repository);

      // 3. ストリーミング実行（onStream内でDB更新）
      const history = await repository.getMessages(session.id);

      // AIメッセージをoptimistic update
      const streamingMessageId = crypto.randomUUID();
      await repository.addMessage({
        id: streamingMessageId,
        sessionId: session.id,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      });

      await fetchStream(
        '/api/chat',
        {
          prompt: content,
          history: history.map((msg) => ({ role: msg.role, content: msg.content })),
          llmProvider: options.llmProvider,
          useWebSearch: options.useWebSearch,
        },
        {
          onStream: async (_, accumulated) => {
            // 各チャンク受信時にDB更新
            await repository.updateMessage(streamingMessageId, {
              content: accumulated.answer || '',
              thinking: accumulated.thought,
            });
          },
        }
      );

      // 4. セッションの updatedAt を更新
      await repository.save({
        ...session,
        metadata: { ...session.metadata, updatedAt: Date.now() },
      });

      return session.id;
    },
    [fetchStream, repository, router, options]
  );

  return {
    sendMessage,
    isStreaming,
    abort,
  };
}
