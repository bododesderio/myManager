import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'myManager - Social Media Management Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #7c3aed 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800, marginBottom: 16, display: 'flex' }}>
          myManager
        </div>
        <div style={{ fontSize: 28, opacity: 0.9, display: 'flex' }}>
          Social Media Management Platform
        </div>
      </div>
    ),
    { ...size },
  );
}
