interface GBPPreviewProps {
  content: string;
  businessName: string;
  postType?: 'update' | 'offer' | 'event';
  media?: string[];
}

export function GBPPreview({ content, businessName, postType = 'update', media }: GBPPreviewProps) {
  return (
    <div className="max-w-md rounded-lg border bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="h-10 w-10 rounded-full bg-blue-500" />
        <div>
          <p className="text-sm font-semibold">{businessName}</p>
          <p className="text-xs capitalize text-gray-500">{postType} &middot; Just now</p>
        </div>
      </div>
      {media && media.length > 0 && (
        <div className="aspect-video bg-gray-100">
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Media Preview
          </div>
        </div>
      )}
      <div className="px-4 py-3">
        <p className="text-sm leading-relaxed">{content}</p>
        {postType === 'offer' && (
          <button className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            View Offer
          </button>
        )}
      </div>
    </div>
  );
}
