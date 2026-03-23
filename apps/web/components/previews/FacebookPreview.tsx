interface FacebookPreviewProps {
  content: string;
  authorName: string;
  authorAvatar?: string;
  media?: string[];
}

export function FacebookPreview({ content, authorName, media }: FacebookPreviewProps) {
  return (
    <div className="max-w-md rounded-lg border bg-white shadow-sm">
      <div className="flex items-center gap-3 px-4 pt-3">
        <div className="h-10 w-10 rounded-full bg-blue-100" />
        <div>
          <p className="text-sm font-semibold">{authorName}</p>
          <p className="text-xs text-gray-500">Just now &middot; Public</p>
        </div>
      </div>
      <p className="px-4 py-3 text-sm">{content}</p>
      {media && media.length > 0 && (
        <div className="aspect-video bg-gray-100">
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Media Preview
          </div>
        </div>
      )}
      <div className="flex border-t px-4 py-2 text-xs text-gray-500">
        <button className="flex-1 py-1 text-center hover:bg-gray-50">Like</button>
        <button className="flex-1 py-1 text-center hover:bg-gray-50">Comment</button>
        <button className="flex-1 py-1 text-center hover:bg-gray-50">Share</button>
      </div>
    </div>
  );
}
