import Image from 'next/image';
import { TestimonialCarousel } from './TestimonialCarousel';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function getBrandConfig() {
  try {
    const res = await fetch(`${API_URL}/api/v1/brand`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

interface AuthBrandPanelProps {
  headline?: string;
  subtext?: string;
}

export async function AuthBrandPanel({ headline, subtext }: AuthBrandPanelProps) {
  const brand = await getBrandConfig();

  const features = [
    'Schedule posts across 10 platforms',
    'AI-powered captions and hashtags',
    'Team collaboration and approvals',
    'Built for African businesses',
  ];

  return (
    <div
      className="hidden lg:flex w-[480px] shrink-0 min-h-screen flex-col justify-center items-center px-10 relative overflow-hidden"
      style={{ backgroundColor: '#7F77DD' }}
    >
      {/* Top logo */}
      <div className="absolute top-8 left-8">
        <Image src="/images/logo-white.svg" alt={brand?.app_name || 'myManager'} width={120} height={28} />
      </div>

      {/* Center content */}
      <div className="max-w-sm w-full">
        <h2 className="text-[22px] font-extrabold text-white leading-tight">
          {headline || 'The smarter way to manage social media'}
        </h2>
        <p className="text-[13px] text-white/70 mt-2">
          {subtext || brand?.app_tagline || 'Post once. Reach everywhere.'}
        </p>

        {/* Dashboard image */}
        <div className="mt-6 rounded-lg overflow-hidden shadow-2xl border border-white/20">
          <Image
            src="/images/hero-dashboard.svg"
            alt="Dashboard"
            width={800}
            height={500}
            className="w-full h-auto"
          />
        </div>

        {/* Feature bullets */}
        <ul className="mt-5 space-y-2">
          {features.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-green-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[11px] text-white/80">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom testimonial carousel */}
      <div className="absolute bottom-6 left-8 right-8">
        <TestimonialCarousel />
      </div>
    </div>
  );
}
