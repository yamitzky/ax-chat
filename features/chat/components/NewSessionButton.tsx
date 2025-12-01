'use client'

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useChatSessionOperations } from '../operations/use-chat-session-operations';

type Props = {
  onNewSession?: () => void;
};

export function NewSessionButton({ onNewSession }: Props) {
  const { switchSession } = useChatSessionOperations();

  const handleClick = () => {
    switchSession(null);
    onNewSession?.();
  };

  return (
    <Button onClick={handleClick} className="w-full">
      <Plus className="w-4 h-4 mr-2" />
      新規チャット
    </Button>
  );
}
