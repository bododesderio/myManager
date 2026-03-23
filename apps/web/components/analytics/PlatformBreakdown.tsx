interface PlatformStat {
  platform: string;
  followers: number;
  engagement: number;
  posts: number;
}

interface PlatformBreakdownProps {
  platforms: PlatformStat[];
}

export function PlatformBreakdown({ platforms }: PlatformBreakdownProps) {
  const totalFollowers = platforms.reduce((sum, p) => sum + p.followers, 0);

  return (
    <div className="rounded-brand border bg-white p-6 shadow-sm">
      <h3 className="font-heading text-lg font-semibold">Platform Breakdown</h3>
      <div className="mt-4 space-y-4">
        {platforms.map((platform) => {
          const percentage = totalFollowers > 0 ? (platform.followers / totalFollowers) * 100 : 0;
          return (
            <div key={platform.platform}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{platform.platform}</span>
                <span className="text-gray-500">{platform.followers.toLocaleString()} followers</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-brand-primary"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="mt-1 flex gap-4 text-xs text-gray-400">
                <span>{platform.engagement.toLocaleString()} engagements</span>
                <span>{platform.posts} posts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
