const HASHTAG_REGEX = /(?:^|\s)#([\p{L}\p{N}\p{M}_]+)/gu;

export function extractHashtags(text: string): string[] {
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = HASHTAG_REGEX.exec(text)) !== null) {
    const tag = match[1].toLowerCase();
    if (!matches.includes(tag)) {
      matches.push(tag);
    }
  }

  HASHTAG_REGEX.lastIndex = 0;
  return matches;
}

export function countHashtags(text: string): number {
  return extractHashtags(text).length;
}

export function removeHashtags(text: string): string {
  return text.replace(/(?:^|\s)#[\p{L}\p{N}\p{M}_]+/gu, '').trim();
}

export function appendHashtags(text: string, hashtags: string[]): string {
  const formatted = hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');
  return `${text}\n\n${formatted}`;
}
