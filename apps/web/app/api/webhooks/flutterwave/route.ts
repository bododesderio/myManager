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

    switch (event.event) {
      case 'charge.completed':
        if (event.data.status === 'successful') {
          // Process successful payment
          // Update subscription status in database
          console.log(`Payment successful: ${event.data.tx_ref} - ${event.data.amount} ${event.data.currency}`);
        }
        break;

      case 'subscription.cancelled':
        // Handle subscription cancellation
        console.log(`Subscription cancelled: ${event.data.tx_ref}`);
        break;

      default:
        console.log(`Unhandled Flutterwave event: ${event.event}`);
    }

    return NextResponse.json({ status: 'received' });
  } catch (error) {
    console.error('Flutterwave webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
