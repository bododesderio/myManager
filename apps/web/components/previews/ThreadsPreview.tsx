interface ThreadsPreviewProps {
  content: string;
  authorName: string;
  authorHandle: string;
  media?: string[];
}

export function ThreadsPreview({ content, authorName, authorHandle, media }: ThreadsPreviewProps) {
  const truncated = content.length > 500 ? `${content.slice(0, 500)}...` : content;

  return (
    <div className="max-w-md border-b bg-white px-4 py-4">
      <div className="flex gap-3">
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold">{authorName}</span>
            <span className="text-sm text-gray-400">&middot; now</span>
          </div>
          <p className="text-sm text-gray-500">{authorHandle}</p>
          <p className="mt-2 text-sm leading-relaxed">{truncated}</p>
          {media && media.length > 0 && (
            <div className="mt-3 aspect-video rounded-xl bg-gray-100">
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Media Preview
              </div>
            </div>
          )}
          <div className="mt-3 flex gap-6 text-xs text-gray-400">
            <span>Reply</span>
            <span>Repost</span>
            <span>Like</span>
            <span>Share</span>
          </div>
        </div>
      </div>
    </div>
  );
}
