interface Campaign {
  id: string;
  name: string;
  color: string;
  startDay: number;
  endDay: number;
}

interface CampaignBarProps {
  campaigns: Campaign[];
}

export function CampaignBar({ campaigns }: CampaignBarProps) {
  return (
    <div className="space-y-1">
      {campaigns.map((campaign) => {
        const widthPercent = ((campaign.endDay - campaign.startDay + 1) / 31) * 100;
        const leftPercent = ((campaign.startDay - 1) / 31) * 100;

        return (
          <div key={campaign.id} className="relative h-6">
            <div
              className="absolute top-0 flex h-full items-center rounded-full px-3 text-xs font-medium text-white"
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                backgroundColor: campaign.color,
                minWidth: '80px',
              }}
            >
              <span className="truncate">{campaign.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
