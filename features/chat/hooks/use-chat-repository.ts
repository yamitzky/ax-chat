import { useSessionRepository } from '@/lib/session/repository';
import type { ChatSessionRepository } from '../infrastructure/chat-session-repository';
import type { ChatSessionData } from '../types';

export function useChatRepository(): ChatSessionRepository {
  return useSessionRepository<ChatSessionData>() as ChatSessionRepository;
}
