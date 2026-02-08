import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

function safeParseJson(text: string, fallback: object): object {
  if (!text || text.trim() === '') return fallback;
  try {
    return JSON.parse(text) as object;
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const concert_id = searchParams.get('concert_id');
    if (!concert_id) {
      return NextResponse.json({ error: 'Missing concert_id' }, { status: 400 });
    }
    const res = await fetch(`${BACKEND_URL}/api/rooms/chat?concert_id=${encodeURIComponent(concert_id)}`);
    const text = await res.text();
    const data = safeParseJson(text, { messages: [] });
    return NextResponse.json(data, { status: res.ok ? res.status : 200 });
  } catch (error) {
    console.error('Backend rooms/chat GET error:', error);
    return NextResponse.json({ messages: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/rooms/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const data = safeParseJson(text, { error: 'Failed to send message' });
    return NextResponse.json(data, { status: res.ok ? res.status : 500 });
  } catch (error) {
    console.error('Backend rooms/chat POST error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
