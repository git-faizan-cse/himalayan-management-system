import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const purchases = await prisma.purchaseBill.findMany({
      where: { tenant_id: payload.tenantId },
      include: {
        supplier: { select: { name: true } },
        tenant: { 
          select: { company_name: true, address: true, gst_number: true, phone: true, email: true } 
        },
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
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload?.tenantId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!payload?.role || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'ADMIN' && payload.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden: Only Admins/Managers can create purchases' }, { status: 403 });
    }

    const data = await req.json();
    const { supplier_id, items, status, due_date } = data;

    // Verify supplier ownership
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplier_id, tenant_id: payload.tenantId },
      select: { id: true }
    });

    if (!supplier) {
      return NextResponse.json({ error: `Supplier not found or unauthorized.` }, { status: 400 });
    }

    let total_amount = 0;
    let total_gst = 0;

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { id: item.product_id, tenant_id: payload.tenantId },
        select: { id: true }
      });
      if (!product) {
        return NextResponse.json({ error: `Product not found or unauthorized.` }, { status: 400 });
      }

      const base = item.quantity * item.purchase_price_per_unit;
      const gst = (base * (item.gst_percent || 0)) / 100;
      item.gst_amount = gst;
      item.total = base + gst;
      total_amount += item.total;
      total_gst += gst;
    }

    // Generate bill number
    const count = await prisma.purchaseBill.count({ where: { tenant_id: payload.tenantId } });
    const bill_number = `BILL-${String(count + 1).padStart(5, '0')}`;

    const purchase = await prisma.$transaction(async (tx) => {
      const bill = await tx.purchaseBill.create({
        data: {
          tenant_id: payload.tenantId,
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
