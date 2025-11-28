export function generateTitle(firstMessage: string): string {
  const maxLength = 30;
  const trimmed = firstMessage.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.slice(0, maxLength) + '...';
}
