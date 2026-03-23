interface LinkedInPreviewProps {
  content: string;
  authorName: string;
  authorTitle?: string;
  authorAvatar?: string;
  media?: string[];
}

export function LinkedInPreview({ content, authorName, authorTitle = 'Social Media Manager', media }: LinkedInPreviewProps) {
  return (
    <div className="max-w-md rounded-lg border bg-white shadow-sm">
      <div className="flex items-start gap-3 px-4 pt-4">
        <div className="h-12 w-12 flex-shrink-0 rounded-full bg-blue-700" />
        <div>
          <p className="text-sm font-semibold">{authorName}</p>
          <p className="text-xs text-gray-500">{authorTitle}</p>
          <p className="text-xs text-gray-400">Just now &middot; Connections</p>
        </div>
      </div>
      <p className="px-4 py-3 text-sm leading-relaxed">
        {content.length > 300 ? `${content.slice(0, 300)}... see more` : content}
      </p>
      {media && media.length > 0 && (
        <div className="aspect-video bg-gray-100">
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Media Preview
          </div>
        </div>
      )}
      <div className="flex border-t px-4 py-2 text-xs text-gray-500">
        <button className="flex-1 py-1.5 text-center hover:bg-gray-50">Like</button>
        <button className="flex-1 py-1.5 text-center hover:bg-gray-50">Comment</button>
        <button className="flex-1 py-1.5 text-center hover:bg-gray-50">Repost</button>
        <button className="flex-1 py-1.5 text-center hover:bg-gray-50">Send</button>
      </div>
    </div>
  );
}
