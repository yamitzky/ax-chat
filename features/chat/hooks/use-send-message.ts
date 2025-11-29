import type { LLMProvider } from '@/lib/model-types';
import { useSessionRepository, type SessionRepository } from '@/lib/session/repository';
import { useStreamFetch } from '@/lib/stream/use-stream-fetch';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { ChatSession, ChatSessionData, Message } from '../types';
import { generateTitle } from '../utils/title-generator';

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
  const repository = useSessionRepository<ChatSessionData>(); // 汎用Repository（型パラメータ指定）
  const { fetchStream, data, isStreaming } = useStreamFetch<ChatRequest, ChatResponse>();

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
      // 2. 以降は共通のフロー
      const userMessage: Message = { role: 'user', content };
      session = await appendMessages(session, userMessage, repository);
      const aiMessage = await streamMessage(
        content,
        session.data.messages,  // session.data.messages に変更
        options,
        fetchStream
      );

      await appendMessages(session, aiMessage, repository);

      return session.id;
    },
    [fetchStream, repository, router, options]
  );

  return {
    sendMessage,
    completion: data?.answer ?? '',
    thinking: data?.thought,
    isStreaming,
  };
}

// ヘルパー関数: 新規セッション作成とナビゲーション
async function createAndNavigateToSession(
  content: string,
  options: SendMessageOptions,
  repository: SessionRepository<ChatSessionData>,
  router: ReturnType<typeof useRouter>
): Promise<ChatSession> {
  const now = Date.now();
  const newSessionId = crypto.randomUUID();

  const newSession: ChatSession = {
    id: newSessionId,
    title: generateTitle(content),
    data: {
      messages: [],
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

// ヘルパー関数: ストリーミングでAIメッセージ取得
async function streamMessage(
  content: string,
  history: Message[],
  options: SendMessageOptions,
  fetchStream: (url: string, req: ChatRequest) => Promise<ChatResponse>
): Promise<Message> {
  const result = await fetchStream('/api/chat', {
    prompt: content,
    history: history.map((msg) => ({ role: msg.role, content: msg.content })),
    llmProvider: options.llmProvider,
    useWebSearch: options.useWebSearch,
  });

  return {
    role: 'assistant',
    content: result.answer,
    thinking: result.thought,
  };
}

// ヘルパー関数: メッセージをセッションに追加保存
async function appendMessages(
  session: ChatSession,
  message: Message,
  repository: SessionRepository<ChatSessionData>
): Promise<ChatSession> {
  const updatedSession: ChatSession = {
    ...session,
    data: {
      ...session.data,
      messages: [...session.data.messages, message],
    },
    metadata: {
      ...session.metadata,
      updatedAt: Date.now(),
    },
  };

  await repository.save(updatedSession);
  return updatedSession;
}
