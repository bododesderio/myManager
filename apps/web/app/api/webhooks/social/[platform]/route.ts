import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { timingSafeEqual } from 'crypto';

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

interface SocialWebhookRouteProps {
  params: Promise<{ platform: string }>;
}

export async function GET(request: NextRequest, { params }: SocialWebhookRouteProps) {
  const { platform } = await params;

  // Handle webhook verification challenges (Facebook, Instagram, etc.)
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token && verifyToken && safeCompare(token, verifyToken)) {
    console.log(`Webhook verified for ${platform}`);
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest, { params }: SocialWebhookRouteProps) {
  try {
    const { platform } = await params;
    const payload = await request.json();

    const supportedPlatforms = [
      'facebook', 'instagram', 'x', 'linkedin', 'tiktok',
      'pinterest', 'youtube', 'whatsapp', 'threads', 'gbp',
    ];

    if (!supportedPlatforms.includes(platform)) {
      return NextResponse.json({ error: `Unsupported platform: ${platform}` }, { status: 400 });
    }

    // Process webhook based on platform
    console.log(`Received ${platform} webhook:`, JSON.stringify(payload).slice(0, 200));

    // In production: validate signature, enqueue processing job
    // await queueWebhookProcessing(platform, payload);

    return NextResponse.json({ status: 'received', platform });
  } catch (error) {
    console.error(`Social webhook processing failed for platform:`, error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
