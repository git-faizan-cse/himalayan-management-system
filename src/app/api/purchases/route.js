import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const purchases = await prisma.purchaseBill.findMany({
      include: {
        supplier: { select: { name: true } },
        items: { include: { product: { select: { name: true, unit: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(purchases);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { supplier_id, items, status, due_date } = data;

    let total_amount = 0;
    let total_gst = 0;

    for (const item of items) {
      const base = item.quantity * item.purchase_price_per_unit;
      const gst = (base * (item.gst_percent || 0)) / 100;
      item.gst_amount = gst;
      item.total = base + gst;
      total_amount += item.total;
      total_gst += gst;
    }

    // Generate bill number
    const count = await prisma.purchaseBill.count();
    const bill_number = `BILL-${String(count + 1).padStart(5, '0')}`;

    const purchase = await prisma.$transaction(async (tx) => {
      const bill = await tx.purchaseBill.create({
        data: {
          bill_number,
          supplier_id,
          total_amount,
          total_gst,
          status: status || 'DUE',
          due_date: due_date ? new Date(due_date) : null,
        }
      });

      for (const item of items) {
        await tx.purchaseItem.create({
          data: {
            purchase_id: bill.id,
            product_id: item.product_id,
            quantity: item.quantity,
            purchase_price_per_unit: item.purchase_price_per_unit,
            gst_amount: item.gst_amount,
            total: item.total,
          }
        });

        // Auto-increment stock
        await tx.product.update({
          where: { id: item.product_id },
          data: { current_stock: { increment: item.quantity } }
        });
      }

      // Update supplier total_payables if DUE
      if (status === 'DUE' || !status) {
        await tx.supplier.update({
          where: { id: supplier_id },
          data: { total_payables: { increment: total_amount } }
        });
      }

      return bill;
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error('Create purchase error:', error);
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
  }
}
