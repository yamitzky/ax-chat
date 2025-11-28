'use client'

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

type Props = {
  onNewSession?: () => void;
};

export function NewSessionButton({ onNewSession }: Props) {
  const router = useRouter();

  const handleClick = () => {
    router.push('/');
    onNewSession?.();
  };

  return (
    <Button onClick={handleClick} className="w-full">
      <Plus className="w-4 h-4 mr-2" />
      新規チャット
    </Button>
  );
}
