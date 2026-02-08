import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requester = searchParams.get('requester');
    const recipient = searchParams.get('recipient');
    const concert_id = searchParams.get('concert_id');
    if (!requester || !recipient) {
      return NextResponse.json({ status: 'none' });
    }
    const params = new URLSearchParams({ requester, recipient });
    if (concert_id) params.set('concert_id', concert_id);
    const res = await fetch(`${BACKEND_URL}/api/connect/status?${params.toString()}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Backend connect/status error:', error);
    return NextResponse.json({ status: 'none' }, { status: 200 });
  }
}
