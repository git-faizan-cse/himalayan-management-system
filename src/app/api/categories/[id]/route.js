import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);
    if (!payload?.role || (payload.role !== 'ADMIN' && payload.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null
      }
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);
    if (!payload?.role || (payload.role !== 'ADMIN' && payload.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { category_id: id }
    });

    if (productCount > 0) {
      return NextResponse.json({ error: 'Cannot delete category with existing products' }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
