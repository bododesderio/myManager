interface TikTokPreviewProps {
  content: string;
  authorName: string;
  media?: string[];
}

export function TikTokPreview({ content, authorName, media }: TikTokPreviewProps) {
  return (
    <div className="relative max-w-[320px] overflow-hidden rounded-lg bg-black shadow-sm" style={{ aspectRatio: '9/16' }}>
      {media && media.length > 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-gray-500">
          Video Preview
        </div>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-gray-500">
          Add a video
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <p className="text-sm font-semibold text-white">@{authorName}</p>
        <p className="mt-1 text-xs text-white/80">
          {content.length > 150 ? `${content.slice(0, 150)}...` : content}
        </p>
      </div>
      <div className="absolute bottom-20 right-3 flex flex-col items-center gap-4">
        {['heart', 'comment', 'share', 'save'].map((action) => (
          <div key={action} className="flex flex-col items-center">
            <div className="h-8 w-8 rounded-full bg-white/20" />
            <span className="mt-1 text-[10px] text-white">{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
