interface InstagramPreviewProps {
  content: string;
  authorName: string;
  authorAvatar?: string;
  media?: string[];
}

export function InstagramPreview({ content, authorName, media }: InstagramPreviewProps) {
  return (
    <div className="max-w-md rounded-lg border bg-white shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
        <p className="text-sm font-semibold">{authorName}</p>
      </div>
      <div className="aspect-square bg-gray-100">
        {media && media.length > 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Media Preview
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Add an image or video
          </div>
        )}
      </div>
      <div className="space-y-2 px-4 py-3">
        <div className="flex gap-4 text-gray-800">
          <span className="text-sm">&#9825;</span>
          <span className="text-sm">&#9993;</span>
          <span className="text-sm">&#8682;</span>
        </div>
        <p className="text-sm">
          <span className="font-semibold">{authorName}</span>{' '}
          {content.length > 125 ? `${content.slice(0, 125)}...` : content}
        </p>
      </div>
    </div>
  );
}
