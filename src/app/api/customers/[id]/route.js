import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const data = await req.json();

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
    const { id } = await params;
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
