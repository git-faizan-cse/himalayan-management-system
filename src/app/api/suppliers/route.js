import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const suppliers = await prisma.supplier.findMany({
      where: { tenant_id: payload.tenantId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload?.tenantId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!payload?.role || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'ADMIN' && payload.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden: Only Admins and Managers can add suppliers' }, { status: 403 });
    }

    const data = await req.json();
    const newSupplier = await prisma.supplier.create({
      data: {
        tenant_id: payload.tenantId,
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
      }
    });
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
