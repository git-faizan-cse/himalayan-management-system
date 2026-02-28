import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function GET(req) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    if (!sessionCookie) return NextResponse.json({ role: null });
    
    const payload = await verifySession(sessionCookie);
    return NextResponse.json({ role: payload?.role || null });
  } catch (e) {
    return NextResponse.json({ role: null });
  }
}
