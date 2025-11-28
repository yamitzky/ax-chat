'use client'

import { usePathname } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useSessions } from '../hooks/use-sessions';
import { SessionListItem } from './SessionListItem';
import { NewSessionButton } from './NewSessionButton';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function SessionSidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const { sessions, switchSession } = useSessions();

  // 現在のセッションIDをURLから取得
  const currentSessionId = pathname === '/' ? null : pathname.slice(1);

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <div
        className={cn(
          "fixed z-50 h-screen w-64 border-r bg-card flex flex-col transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b shrink-0">
          <NewSessionButton onNewSession={onClose} />
        </div>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
            {sessions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                履歴がありません
              </div>
            ) : (
              sessions.map(session => (
                <SessionListItem
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSessionId}
                  onClick={() => {
                    switchSession(session.id);
                    onClose();
                  }}
                />
              ))
            )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
