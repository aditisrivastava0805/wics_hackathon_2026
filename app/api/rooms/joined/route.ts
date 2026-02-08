import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const concert_id = searchParams.get('concert_id');
    const user_email = searchParams.get('user_email');
    if (!concert_id || !user_email) {
      return NextResponse.json({ joined: false });
    }
    const res = await fetch(
      `${BACKEND_URL}/api/rooms/joined?concert_id=${encodeURIComponent(concert_id)}&user_email=${encodeURIComponent(user_email)}`
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Backend rooms/joined error:', error);
    return NextResponse.json({ joined: false }, { status: 200 });
  }
}
