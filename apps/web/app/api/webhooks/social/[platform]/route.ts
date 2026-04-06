import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

interface SocialWebhookRouteProps {
  params: Promise<{ platform: string }>;
}

const META_WEBHOOK_PLATFORMS = new Set(['facebook', 'instagram', 'threads', 'whatsapp']);
const KNOWN_PLATFORMS = new Set([
  'facebook', 'instagram', 'threads', 'whatsapp',
  'x', 'linkedin', 'tiktok', 'pinterest', 'youtube', 'google-business',
]);

function getForwardSecret(): string | null {
  return process.env.WEBHOOK_FORWARD_SECRET ?? null;
}

function verifyMetaSignature(platform: string, payload: string, signature: string | null): boolean {
  if (!META_WEBHOOK_PLATFORMS.has(platform)) {
    return false;
  }

  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appSecret || !signature) {
    return false;
  }

  const expected = `sha256=${createHmac('sha256', appSecret).update(payload).digest('hex')}`;
  return safeCompare(signature, expected);
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
    const rawBody = await request.text();

    if (!KNOWN_PLATFORMS.has(platform)) {
      return NextResponse.json(
        { error: `Unknown platform: ${platform}` },
        { status: 400 },
      );
    }

    // For Meta platforms, verify the provider signature
    let signatureVerified = false;
    if (META_WEBHOOK_PLATFORMS.has(platform)) {
      const providerSignature = request.headers.get('x-hub-signature-256');
      if (!verifyMetaSignature(platform, rawBody, providerSignature)) {
        return NextResponse.json({ error: 'Invalid provider signature' }, { status: 401 });
      }
      signatureVerified = true;
    }

    const forwardSecret = getForwardSecret();
    if (!forwardSecret) {
      return NextResponse.json({ error: 'Webhook forward secret is not configured' }, { status: 500 });
    }

    const timestamp = Date.now().toString();
    const forwardSignature = createHmac('sha256', forwardSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');

    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    const upstream = await fetch(`${apiUrl}/api/v1/webhooks/social/${platform}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-mymanager-webhook-timestamp': timestamp,
        'x-mymanager-webhook-signature': forwardSignature,
        'x-mymanager-webhook-verified': signatureVerified ? 'true' : 'false',
      },
      body: rawBody,
      cache: 'no-store',
    });

    const data = await upstream.json().catch(() => ({ status: 'accepted', platform }));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error(`Social webhook processing failed for platform:`, error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
