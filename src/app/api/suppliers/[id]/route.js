import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload?.role || (payload.role !== 'ADMIN' && payload.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden: Only Admins and Managers can edit suppliers' }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
      }
    });

    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error('Update supplier error:', error);
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload?.role || (payload.role !== 'ADMIN' && payload.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden: Only Admins and Managers can delete suppliers' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete supplier error:', error);
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Cannot delete supplier with existing purchase bills.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}
