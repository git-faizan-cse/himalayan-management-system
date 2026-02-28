import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req, { params }) {
  try {
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
    const { id } = await params;
    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete supplier error:', error);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}
