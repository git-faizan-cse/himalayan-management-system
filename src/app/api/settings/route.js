import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function PUT(req) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    
    const payload = await verifySession(sessionCookie);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Shop Owners can edit business settings.' }, { status: 403 });
    }

    const { company_name, address, gst_number, phone, email, invoice_prefix } = await req.json();

    if (!company_name) return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });

    const updatedTenant = await prisma.tenant.update({
      where: { id: payload.tenantId },
      data: {
        company_name,
        address,
        gst_number,
        phone,
        email,
        invoice_prefix: invoice_prefix || 'INV',
      },
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

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error('Update tenant settings error:', error);
    return NextResponse.json({ error: 'Failed to update business settings.' }, { status: 500 });
  }
}
