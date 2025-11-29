import type { ChatSessionRepository } from '../infrastructure/chat-session-repository';
import type { ChatSession, Message } from '../types';

export async function appendMessage(
  session: ChatSession,
  message: Partial<Message>,
  repository: ChatSessionRepository
): Promise<void> {
  const messageWithMeta: Message = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    createdAt: Date.now(),
    role: message.role!,
    content: message.content!,
    thinking: message.thinking,
  };

  await repository.addMessage(messageWithMeta);
  await repository.save({
    ...session,
    metadata: { ...session.metadata, updatedAt: Date.now() },
  });
}
