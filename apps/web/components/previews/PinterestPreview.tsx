interface PinterestPreviewProps {
  content: string;
  title: string;
  boardName?: string;
  media?: string[];
}

export function PinterestPreview({ content, title, boardName = 'My Board', media }: PinterestPreviewProps) {
  return (
    <div className="max-w-[240px] overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="aspect-[2/3] bg-gray-100">
        {media && media.length > 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Pin Image
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Add an image
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold leading-tight">{title}</h3>
        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{content}</p>
        <p className="mt-2 text-xs text-gray-400">Board: {boardName}</p>
      </div>
    </div>
  );
}
