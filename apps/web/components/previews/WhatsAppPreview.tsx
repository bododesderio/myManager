interface WhatsAppPreviewProps {
  content: string;
  businessName: string;
  media?: string[];
}

export function WhatsAppPreview({ content, businessName, media }: WhatsAppPreviewProps) {
  return (
    <div className="max-w-sm rounded-lg bg-[#e5ddd5] p-4 shadow-sm">
      <div className="mb-3 text-center">
        <p className="rounded-full bg-[#e1f2fb] px-3 py-1 text-xs text-gray-600">
          {businessName} &middot; Business Account
        </p>
      </div>
      <div className="ml-auto max-w-[80%] rounded-lg rounded-tr-none bg-[#dcf8c6] p-3 shadow-sm">
        {media && media.length > 0 && (
          <div className="mb-2 aspect-video rounded bg-gray-200">
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              Media
            </div>
          </div>
        )}
        <p className="text-sm">{content}</p>
        <p className="mt-1 text-right text-[10px] text-gray-500">Just now &#10003;&#10003;</p>
      </div>
    </div>
  );
}
