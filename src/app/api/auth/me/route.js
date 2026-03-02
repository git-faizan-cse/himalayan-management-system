import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    if (!sessionCookie) return NextResponse.json({ role: null, tenantId: null, tenantName: null });
    
    const payload = await verifySession(sessionCookie);
    if (!payload) return NextResponse.json({ role: null, tenantId: null, tenantName: null });

    let tenantName = null;
    if (payload.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: payload.tenantId },
        select: { company_name: true }
      });
      if (tenant) {
        tenantName = tenant.company_name;
      }
    }

    return NextResponse.json({ 
      role: payload.role || null,
      tenantId: payload.tenantId || null,
      tenantName 
    });
  } catch (e) {
    return NextResponse.json({ role: null, tenantId: null, tenantName: null });
  }
}
