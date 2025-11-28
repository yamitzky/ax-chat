import { useState } from 'react';
import { Message } from '../types';
import useStreamCompletion from './use-stream-completion';
import type { LLMProvider } from '@/lib/model-types';

export function useChat(options?: {
  provider?: LLMProvider;
  useWebSearch?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");

  // API通信フック (useStreamCompletion)
  const { mutateAsync, completion, isLoading } = useStreamCompletion(options);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const prompt = inputValue;
    const userMessage: Message = { role: 'user', content: prompt };
    
    // UIを即時更新
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    try {
      const response = await mutateAsync(prompt);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
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
    handleSend
  };
}
