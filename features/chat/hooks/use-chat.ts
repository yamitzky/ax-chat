import type { LLMProvider } from '@/lib/model-types';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Message, Session } from '../types';
import useStreamCompletion from './use-stream-completion';
import { useSession, createSession as dbCreateSession, saveSession as dbSaveSession } from './use-session-db';
import { generateTitle } from '../utils/title-generator';

export function useChat(options?: {
  sessionId?: string | null;
  provider?: LLMProvider;
  useWebSearch?: boolean;
}) {
  const router = useRouter();
  const currentSessionId = options?.sessionId ?? null;
  const provider = options?.provider ?? 'gemini-flash';
  const useWebSearch = options?.useWebSearch ?? true;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // 自動送信済みフラグ
  const autoSentRef = useRef(false);
  // 前回のセッションIDを追跡
  const prevSessionIdRef = useRef<string | null>(null);

  const session = useSession(currentSessionId);
  const { mutateAsync, completion, thinking, isLoading } = useStreamCompletion({ provider, useWebSearch });

  // セッションID変更時、初期化フラグをリセット
  useEffect(() => {
    if (prevSessionIdRef.current !== currentSessionId) {
      setIsInitialized(false);
      autoSentRef.current = false;
      prevSessionIdRef.current = currentSessionId;
    }
  }, [currentSessionId]);

  // DBからメモリにロード
  useEffect(() => {
    if (session && !isInitialized) {
      setMessages(session.messages);
      setIsInitialized(true);
    } else if (!session && currentSessionId && !isInitialized) {
      // セッションIDがあるがDBにない場合（まだロード中の可能性があるので何もしない）
    } else if (!currentSessionId) {
      // トップページ（セッションなし）
      setMessages([]);
      setInputValue("");
      setIsInitialized(false);
    }
  }, [session, currentSessionId, isInitialized]);

  // 自動送信（初回セッション作成直後）
  useEffect(() => {
    if (!session || !isInitialized || autoSentRef.current || isLoading) return;

    // メッセージが1件のみ & ユーザーメッセージのみ
    if (session.messages.length === 1 && session.messages[0].role === 'user') {
      autoSentRef.current = true;
      const userMessage = session.messages[0];

      (async () => {
        try {
          const result = await mutateAsync({
            prompt: userMessage.content,
            history: []
          });

          const newMessages: Message[] = [
            userMessage,
            {
              role: 'assistant',
              content: result.answer,
              thinking: result.thought,
            }
          ];

          setMessages(newMessages);

          // DBに保存
          await dbSaveSession({
            ...session,
            messages: newMessages,
            metadata: {
              ...session.metadata,
              updatedAt: Date.now(),
            },
          });
        } catch (err) {
          console.error('Auto-send error:', err);
          const errorMessages: Message[] = [
            userMessage,
            { role: 'assistant', content: "Error: Failed to get response." }
          ];
          setMessages(errorMessages);

          // エラーメッセージもDBに保存
          await dbSaveSession({
            ...session,
            messages: errorMessages,
            metadata: {
              ...session.metadata,
              updatedAt: Date.now(),
            },
          });
        }
      })();
    }
  }, [session, isInitialized, isLoading, mutateAsync]);

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!inputValue.trim() || isLoading || isCreatingSession) return;

    const prompt = inputValue;
    const userMessage: Message = { role: 'user', content: prompt };

    // 初回送信（セッション作成）
    if (!currentSessionId) {
      setIsCreatingSession(true);

      try {
        const now = Date.now();
        const newSessionId = crypto.randomUUID();

        const newSession: Session = {
          id: newSessionId,
          title: generateTitle(prompt),
          messages: [userMessage],
          metadata: {
            provider,
            useWebSearch,
            createdAt: now,
            updatedAt: now,
          },
        };

        // DBに保存
        await dbCreateSession(newSession);

        // 入力をクリア
        setInputValue("");

        // URL遷移（自動送信は次のuseEffectで実行される）
        router.push(`/${newSessionId}`);
      } catch (err) {
        console.error('Session creation error:', err);
        alert('セッションの作成に失敗しました。もう一度お試しください。');
      } finally {
        setIsCreatingSession(false);
      }

      return;
    }

    // 既存セッションの通常送信
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    try {
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const result = await mutateAsync({ prompt, history });

      const newMessages: Message[] = [
        ...messages,
        userMessage,
        {
          role: 'assistant',
          content: result.answer,
          thinking: result.thought,
        }
      ];

      setMessages(newMessages);

      // DBに保存
      if (session) {
        await dbSaveSession({
          ...session,
          messages: newMessages,
          metadata: {
            ...session.metadata,
            updatedAt: Date.now(),
          },
        });
      }
    } catch (err) {
      console.error('Send error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Error: Failed to get response."
      }]);
    }
  }, [inputValue, isLoading, isCreatingSession, currentSessionId, messages, provider, useWebSearch, router, mutateAsync, session]);

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading: isLoading || isCreatingSession,
    completion,
    thinking,
    handleSend
  };
}
