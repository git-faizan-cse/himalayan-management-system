import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    if (!sessionCookie) return NextResponse.json({ role: null, tenantId: null, tenantName: null });
    
    const payload = await verifySession(sessionCookie);
    if (!payload) return NextResponse.json({ role: null, tenantId: null, tenantName: null });

    let tenant = null;
    if (payload.tenantId) {
      tenant = await prisma.tenant.findUnique({
        where: { id: payload.tenantId },
        select: { 
          id: true,
          company_name: true,
          address: true,
          gst_number: true,
          phone: true,
          email: true,
          invoice_prefix: true
        }
      });
    }

    return NextResponse.json({ 
      role: payload.role || null,
      tenantId: payload.tenantId || null,
      tenantName: tenant?.company_name || null,
      tenant: tenant || null
    });
  } catch (e) {
    return NextResponse.json({ role: null, tenantId: null, tenantName: null });
  }
}
