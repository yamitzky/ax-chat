import type { LLMProvider } from '@/lib/model-types';
import { useCallback, useMemo, useState } from 'react';
import { useChatSession } from './use-chat-session-queries';
import { useSendMessage } from './use-send-message';
import { useUpdateLLMProvider } from './use-update-llm-provider';
import type { Message } from '../types';

export function useChat(options?: {
  sessionId?: string | null;
  useWebSearch?: boolean;
}) {
  const sessionId = options?.sessionId ?? null;
  const useWebSearch = options?.useWebSearch ?? true;

  // 1. Query: セッション購読（DBがSSoT）
  const { session, messages: dbMessages } = useChatSession(sessionId);

  // 2. セッション状態を直接参照
  const llmProvider = session?.data.llmProvider ?? 'gemini-flash';

  // 3. Operations
  const {
    sendMessage,
    completion,
    thinking,
    isStreaming,
  } = useSendMessage({ llmProvider, useWebSearch });

  const { updateLLMProvider } = useUpdateLLMProvider();

  // 4. UI状態
  const [inputValue, setInputValue] = useState('');

  // 5. 表示用メッセージ（DB + ストリーミング中のメッセージ）
  const messages = useMemo(() => {
    if (!isStreaming) return dbMessages;

    // ストリーミング中は、一時的なアシスタントメッセージを追加
    const streamingMessage: Message = {
      id: 'streaming',
      sessionId: sessionId || '',
      role: 'assistant',
      content: completion,
      thinking,
      createdAt: Date.now(),
    };

    return [...dbMessages, streamingMessage];
  }, [dbMessages, isStreaming, completion, thinking, sessionId]);

  // メッセージ送信ハンドラー
  const handleSend = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!inputValue.trim() || isStreaming) return;

      const content = inputValue;
      setInputValue(''); // 楽観的にクリア

      try {
        await sendMessage(content, session);
      } catch (err) {
        console.error('Send error:', err);
        // エラー時は inputValue を復元してもいい
      }
    },
    [inputValue, isStreaming, sendMessage, session]
  );

  // LLMプロバイダー変更ハンドラー
  const handleLLMProviderChange = useCallback(
    async (newProvider: LLMProvider) => {
      if (!session) return;
      await updateLLMProvider(session, newProvider);
    },
    [session, updateLLMProvider]
  );

  return {
    messages, // ストリーミング中のメッセージを含む
    inputValue,
    setInputValue,
    isLoading: isStreaming,
    handleSend,
    llmProvider,
    handleProviderChange: handleLLMProviderChange,
  };
}
