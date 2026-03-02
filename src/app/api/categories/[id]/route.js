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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();

    // Verify ownership before update
    const existing = await prisma.category.findUnique({
      where: { id, tenant_id: payload.tenantId }
    });

    if (!existing) {
       return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

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

    if (!payload?.tenantId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!payload?.role || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'ADMIN' && payload.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Verify ownership before delete
    const existing = await prisma.category.findUnique({
      where: { id, tenant_id: payload.tenantId }
    });

    if (!existing) {
       return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { category_id: id, tenant_id: payload.tenantId }
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
