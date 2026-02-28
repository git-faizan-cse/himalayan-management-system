import { NextResponse } from 'next/server';

export async function POST(req) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  response.cookies.delete('himalaya_session');

  return response;
}
