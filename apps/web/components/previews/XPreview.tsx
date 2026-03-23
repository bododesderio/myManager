interface XPreviewProps {
  content: string;
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  media?: string[];
}

export function XPreview({ content, authorName, authorHandle, media }: XPreviewProps) {
  const truncated = content.length > 280 ? `${content.slice(0, 280)}...` : content;

  return (
    <div className="max-w-md rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold">{authorName}</span>
            <span className="text-sm text-gray-500">{authorHandle}</span>
            <span className="text-sm text-gray-400">&middot; now</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed">{truncated}</p>
          {media && media.length > 0 && (
            <div className="mt-3 aspect-video rounded-xl bg-gray-100">
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Media Preview
              </div>
            </div>
          )}
          <div className="mt-3 flex justify-between text-xs text-gray-400">
            <span>Reply</span>
            <span>Repost</span>
            <span>Like</span>
            <span>Views</span>
            <span>Share</span>
          </div>
        </div>
      </div>
    </div>
  );
}
