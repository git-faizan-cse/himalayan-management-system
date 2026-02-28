import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const data = await req.json();

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        brand: data.brand || null,
        sku_code: data.sku_code || null,
        unit: data.unit,
        purchase_price: parseFloat(data.purchase_price),
        selling_price: parseFloat(data.selling_price),
        gst_percent: parseFloat(data.gst_percent || 0),
        current_stock: parseFloat(data.current_stock || 0),
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
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
