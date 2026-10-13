import { NextResponse, type NextRequest } from 'next/server';
import { GOVERNORATES } from '@/lib/constants';

/** Proxy for the Tunisian municipalities API (keeps the browser on our origin and the response cached). */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') ?? '';
  // Only known governorates are forwarded — this must not become an open proxy.
  if (!(GOVERNORATES as readonly string[]).includes(name)) return NextResponse.json([], { status: 400 });
  try {
    const res = await fetch(`https://tn-municipality-api.vercel.app/api/municipalities?name=${encodeURIComponent(name)}`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) return NextResponse.json([], { status: 502 });
    return NextResponse.json(await res.json(), { headers: { 'Cache-Control': 'public, max-age=86400' } });
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
