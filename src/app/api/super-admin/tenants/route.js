import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);
    
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Super Admin Only' }, { status: 403 });
    }

    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error('Fetch tenants error:', error);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Super Admin Only' }, { status: 403 });
    }

    const { targetTenantId, subscription } = await req.json();

    if (!targetTenantId || !subscription) {
      return NextResponse.json({ error: 'Tenant ID and Subscription status are required' }, { status: 400 });
    }

    // Protect the system owner tenant from accidental suspension
    if (targetTenantId === payload.tenantId) {
       return NextResponse.json({ error: 'Cannot alter your own tenant subscription status' }, { status: 400 });
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: targetTenantId },
      data: { subscription }
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error('Update tenant error:', error);
    return NextResponse.json({ error: 'Failed to update tenant status' }, { status: 500 });
  }
}
