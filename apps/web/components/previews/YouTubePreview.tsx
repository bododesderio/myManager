interface YouTubePreviewProps {
  title: string;
  description: string;
  channelName: string;
  media?: string[];
}

export function YouTubePreview({ title, description, channelName, media }: YouTubePreviewProps) {
  return (
    <div className="max-w-md overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="relative aspect-video bg-gray-900">
        {media && media.length > 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Video Thumbnail
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Add a video
          </div>
        )}
        <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
          0:00
        </div>
      </div>
      <div className="flex gap-3 p-3">
        <div className="h-9 w-9 flex-shrink-0 rounded-full bg-red-600" />
        <div>
          <h3 className="text-sm font-semibold leading-tight line-clamp-2">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">{channelName}</p>
          <p className="text-xs text-gray-500">0 views &middot; Just now</p>
          <p className="mt-2 text-xs text-gray-500 line-clamp-2">{description}</p>
        </div>
      </div>
    </div>
  );
}
