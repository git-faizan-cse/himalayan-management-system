import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!payload?.role || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'ADMIN' && payload.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden: Only Admins and Managers can edit customers' }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();

    // Verify ownership
    const existing = await prisma.customer.findUnique({
      where: { id, tenant_id: payload.tenantId }
    });

    if (!existing) {
       return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
        credit_limit: parseFloat(data.credit_limit || 0),
      }
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!payload?.role || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'ADMIN' && payload.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden: Only Admins and Managers can delete customers' }, { status: 403 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.customer.findUnique({
      where: { id, tenant_id: payload.tenantId }
    });

    if (!existing) {
       return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete customer error:', error);
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Cannot delete customer with existing invoices.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
