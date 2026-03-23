import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return NextResponse.json(
      { error: 'Missing token or email parameter' },
      { status: 400 },
    );
  }

  // In production: validate token, update email preferences in database
  // await prisma.emailPreference.update({ where: { email }, data: { unsubscribed: true } });

  console.log(`Unsubscribe request: ${email}`);

  // Redirect to a confirmation page
  return NextResponse.redirect(
    new URL(`/email-unsubscribed?email=${encodeURIComponent(email)}`, request.url),
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token: string; email: string; categories?: string[] };

    if (!body.token || !body.email) {
      return NextResponse.json(
        { error: 'Missing token or email' },
        { status: 400 },
      );
    }

    // In production: validate token and update preferences
    // const categories = body.categories ?? ['all'];

    console.log(`Unsubscribe API: ${body.email}`);

    return NextResponse.json({
      success: true,
      message: 'You have been unsubscribed successfully.',
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 },
    );
  }
}
