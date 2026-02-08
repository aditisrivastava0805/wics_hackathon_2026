import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

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
    const text = await res.text();
    let data: { joined?: boolean } = { joined: false };
    if (text && text.trim() !== '') {
      try {
        data = JSON.parse(text) as { joined?: boolean };
      } catch {
        // ignore
      }
    }
    return NextResponse.json({ joined: data.joined === true }, { status: 200 });
  } catch (error) {
    console.error('Backend rooms/joined error:', error);
    return NextResponse.json({ joined: false }, { status: 200 });
  }
}
