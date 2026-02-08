import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const concert_id = searchParams.get('concert_id');
    const user_email = searchParams.get('user_email');
    if (!concert_id || !user_email) {
      return NextResponse.json({ error: 'Missing concert_id or user_email' }, { status: 400 });
    }
    const url = `${BACKEND_URL}/api/rooms/people?concert_id=${encodeURIComponent(concert_id)}&user_email=${encodeURIComponent(user_email)}`;
    const res = await fetch(url);
    const text = await res.text();
    let data: { people?: unknown[]; error?: string } = { people: [] };
    if (text && text.trim() !== '') {
      try {
        data = JSON.parse(text) as { people?: unknown[]; error?: string };
      } catch {
        data = { people: [] };
      }
    }
    if (!res.ok) {
      return NextResponse.json(data.people ? data : { people: [] }, { status: 200 });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Backend rooms/people error:', error);
    return NextResponse.json({ people: [] }, { status: 200 });
  }
}
