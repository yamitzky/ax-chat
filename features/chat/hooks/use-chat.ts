import type { LLMProvider } from '@/lib/model-types';
import { useState } from 'react';
import { Message } from '../types';
import useStreamCompletion from './use-stream-completion';

export function useChat(options?: {
  provider?: LLMProvider;
  useWebSearch?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");

  // API通信フック (useStreamCompletion)
  const { mutateAsync, completion, thinking, isLoading } = useStreamCompletion(options);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const prompt = inputValue;
    const userMessage: Message = { role: 'user', content: prompt };
    
    // UIを即時更新
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    try {
      // 現在の履歴をAPIに送信
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const result = await mutateAsync({ prompt, history });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.answer,
        thinking: result.thought  // thoughtを保存
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Failed to get response." }]);
    }
  };

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    completion,
    thinking,  // リアルタイムのthoughtを公開
    handleSend
  };
}
