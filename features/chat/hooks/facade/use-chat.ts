import type { LLMProvider } from '@/lib/ai/providers';
import { useCallback, useState } from 'react';
import { useChatSession } from '../queries/use-chat-session-queries';
import { useSendMessage } from '../commands/use-send-message';
import { useUpdateLLMProvider } from '../commands/use-update-llm-provider';

export function useChat(options?: {
  sessionId?: string | null;
  useWebSearch?: boolean;
}) {
  const sessionId = options?.sessionId ?? null;
  const useWebSearch = options?.useWebSearch ?? true;

  // 1. Query: セッション購読（DBがSSoT）
  const { session, messages } = useChatSession(sessionId);

  // 2. セッション状態を直接参照
  const llmProvider = session?.data.llmProvider ?? 'gemini-flash';

  // 3. Operations
  const {
    sendMessage,
    isStreaming,
    abort,
  } = useSendMessage({ llmProvider, useWebSearch });

  const { updateLLMProvider } = useUpdateLLMProvider();

  // 4. UI状態
  const [inputValue, setInputValue] = useState('');

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
    handleAbort: abort,
    llmProvider,
    handleProviderChange: handleLLMProviderChange,
  };
}
