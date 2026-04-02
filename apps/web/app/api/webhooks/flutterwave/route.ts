import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { timingSafeEqual } from 'crypto';

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

interface FlutterwaveEvent {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: string;
    customer: {
      email: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    const signature = request.headers.get('verif-hash');

    if (!secretHash || !signature || !safeCompare(signature, secretHash)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = (await request.json()) as FlutterwaveEvent;
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    const upstream = await fetch(`${apiUrl}/api/v1/billing/webhook/flutterwave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'verif-hash': signature,
      },
      body: JSON.stringify(event),
      cache: 'no-store',
    });

    const data = await upstream.json().catch(() => ({ status: 'received' }));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error('Flutterwave webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
