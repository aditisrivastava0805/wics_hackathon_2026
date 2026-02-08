import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxies to Flask backend GET /api/events (SerpAPI Google Events - Concerts in Austin).
 * Set BACKEND_URL in .env.local (e.g. http://localhost:5001) when using external events.
 */
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const musicOnly = searchParams.get('music_only') ?? 'true';
    const max = searchParams.get('max') ?? '50';
    const url = `${BACKEND_URL}/api/events?music_only=${musicOnly}&max=${max}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    const text = await res.text();

    // Backend may return empty, non-JSON, or 403 (e.g. SerpAPI rate limit) – never assume valid JSON
    let data: { data?: unknown; error?: string } = { data: [] };
    if (text && text.trim() !== '') {
      try {
        data = JSON.parse(text) as { data?: unknown; error?: string };
      } catch {
        console.error('Backend returned non-JSON:', text.slice(0, 200));
      }
    }

    // On 4xx/5xx, always return 200 with empty list so UI shows "no events" instead of error
    if (!res.ok) {
      console.warn(`Backend /api/events returned ${res.status} – check Flask terminal for SerpAPI errors`);
      return NextResponse.json({ data: [] }, { status: 200 });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch events from backend:', error);
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
