import { truncateText } from '@/lib/utils/text';

export function generateTitle(firstMessage: string): string {
  const maxLength = 30;
  const trimmed = firstMessage.trim();
  return truncateText(trimmed, maxLength);
}
