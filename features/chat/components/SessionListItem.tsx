'use client'

import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionListItem as SessionListItemType } from '../types';
import { SessionTitleEditor } from './SessionTitleEditor';
import { useSessions } from '../hooks/use-sessions';

type Props = {
  session: SessionListItemType;
  isActive: boolean;
  onClick: () => void;
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  if (days < 7) return `${days}日前`;
  
  return new Date(timestamp).toLocaleDateString('ja-JP');
}

export function SessionListItem({ session, isActive, onClick }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const { updateTitle } = useSessions();

  const handleSave = async (newTitle: string) => {
    if (newTitle.trim() && newTitle !== session.title) {
      await updateTitle(session.id, newTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
      )}
    >
      {isEditing ? (
        <SessionTitleEditor
          title={session.title}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="flex items-center justify-between group">
          <span className="truncate flex-1">{session.title}</span>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(true);
              }
            }}
          >
            <Edit2 className="w-3 h-3" />
          </div>
        </div>
      )}
      <div className="text-xs text-muted-foreground mt-1">
        {formatRelativeTime(session.updatedAt)}
      </div>
    </button>
  );
}
