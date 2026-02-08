import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const musicOnly = searchParams.get('music_only') ?? 'true';
    const max = searchParams.get('max') ?? '50';
    const url = `${BACKEND_URL}/api/events?music_only=${musicOnly}&max=${max}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch events' },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch events from backend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
