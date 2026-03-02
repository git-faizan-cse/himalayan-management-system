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

    if (!payload?.role || payload.role === 'STAFF') {
      return NextResponse.json({ error: 'Forbidden: Staff cannot edit products' }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();

    // Verify ownership
    const existing = await prisma.product.findUnique({
      where: { id, tenant_id: payload.tenantId },
      select: { current_stock: true }
    });

    if (!existing) {
       return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Prevent Accountant from modifying base current_stock directly
    if (payload.role === 'ACCOUNTANT' && data.current_stock !== undefined) {
       if (existing.current_stock !== parseFloat(data.current_stock)) {
          return NextResponse.json({ error: 'Forbidden: Accountants cannot manually modify base stock quantities' }, { status: 403 });
       }
    }

    const isAdminOrManager = payload.role === 'SUPER_ADMIN' || payload.role === 'ADMIN' || payload.role === 'MANAGER';

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        category_id: data.category_id,
        brand: data.brand || null,
        sku_code: data.sku_code || null,
        unit: data.unit,
        purchase_price: isAdminOrManager && data.purchase_price ? parseFloat(data.purchase_price) : undefined,
        selling_price: parseFloat(data.selling_price),
        gst_percent: parseFloat(data.gst_percent || 0),
        current_stock: data.current_stock !== undefined ? parseFloat(data.current_stock) : undefined, // Accountant guard
        min_stock_alert: parseFloat(data.min_stock_alert || 10),
        supplier_id: data.supplier_id || null,
      }
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);
    
    if (!payload?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!payload?.role || payload.role === 'STAFF' || payload.role === 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Forbidden: Only Managers or Admins can delete products' }, { status: 403 });
    }

    const { id } = await params;

    // Verify ownership before delete
    const existing = await prisma.product.findUnique({
      where: { id, tenant_id: payload.tenantId }
    });

    if (!existing) {
       return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
