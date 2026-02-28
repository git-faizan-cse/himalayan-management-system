import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);
    const isAdminOrManager = payload?.role === 'ADMIN' || payload?.role === 'MANAGER';

    const products = await prisma.product.findMany({
      include: {
        supplier: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Strip purchase_price for non-admin/manager
    const sanitizedProducts = products.map(p => ({
      ...p,
      purchase_price: isAdminOrManager ? p.purchase_price : null
    }));

    return NextResponse.json(sanitizedProducts);
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);
    if (!payload?.role || payload.role === 'STAFF') {
      return NextResponse.json({ error: 'Forbidden: Staff cannot create products' }, { status: 403 });
    }

    const data = await req.json();

    const newProduct = await prisma.product.create({
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

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
