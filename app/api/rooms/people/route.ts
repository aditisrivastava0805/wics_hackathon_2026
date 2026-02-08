import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

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
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Backend rooms/people error:', error);
    return NextResponse.json({ error: 'Failed to fetch room people' }, { status: 500 });
  }
}
