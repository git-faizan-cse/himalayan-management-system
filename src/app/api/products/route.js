import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req) {
  try {
    const products = await prisma.product.findMany({
      include: {
        supplier: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    // Only Managers & Admins should add products ideally, but we keep it open for STAFF if needed
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
