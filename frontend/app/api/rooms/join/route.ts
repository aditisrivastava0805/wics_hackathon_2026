import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data: Record<string, unknown> = { error: 'Failed to join room' };
    if (text && text.trim() !== '') {
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        data = { error: text.slice(0, 200) || 'Invalid response' };
      }
    }
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status >= 400 ? res.status : 500 });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Backend rooms/join error:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
