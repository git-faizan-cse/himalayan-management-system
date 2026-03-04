import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
export async function GET(req, { params }) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const purchase = await prisma.purchaseBill.findFirst({
      where: { id, tenant_id: payload.tenantId },
      include: {
        supplier: true,
        tenant: {
          select: { company_name: true, address: true, gst_number: true, phone: true, email: true }
        },
        items: {
          include: { product: { select: { name: true, unit: true } } }
        }
      }
    });

    if (!purchase) return NextResponse.json({ error: 'Purchase Bill not found' }, { status: 404 });
    return NextResponse.json(purchase);
  } catch (error) {
    console.error('Fetch purchase error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase bill' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (payload?.role !== 'SUPER_ADMIN' && payload?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Admins can edit purchase bills' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { supplier_id, items, total_amount, total_gst } = body;

    if (!supplier_id || !items || !items.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch old bill details verifying tenant access
      const oldBill = await tx.purchaseBill.findFirst({
        where: { id, tenant_id: payload.tenantId },
        include: { items: true }
      });

      if (!oldBill) throw new Error('Bill not found or unauthorized');

      // 2. Revert Old Stock Additions
      for (const oldItem of oldBill.items) {
        await tx.product.update({
          where: { id: oldItem.product_id },
          data: { current_stock: { decrement: oldItem.quantity } }
        });
      }

      // 3. Revert Old Supplier Ledgers
      if (oldBill.status === 'DUE') {
        await tx.supplier.update({
          where: { id: oldBill.supplier_id },
          data: { total_payables: { decrement: oldBill.total_amount } }
        });
      }

      // 4. Verify new products and Apply New Stock Additions
      for (const newItem of items) {
        const product = await tx.product.findFirst({
          where: { id: newItem.product_id, tenant_id: payload.tenantId },
          select: { id: true, name: true }
        });

        if (!product) {
          throw new Error(`Product not found or unauthorized: ${newItem.product_id}`);
        }

        await tx.product.update({
          where: { id: newItem.product_id },
          data: { current_stock: { increment: newItem.quantity } }
        });
      }

      // Verify supplier
      const supplier = await tx.supplier.findFirst({
        where: { id: supplier_id, tenant_id: payload.tenantId },
        select: { id: true }
      });

      if (!supplier) throw new Error('Supplier not found or unauthorized');

      // 5. Update Bill Record
      const updatedBill = await tx.purchaseBill.update({
        where: { id },
        data: {
          supplier_id,
          total_amount,
          total_gst,
        }
      });

      // 6. Replace Old Items
      await tx.purchaseItem.deleteMany({ where: { purchase_id: id } });
      await tx.purchaseItem.createMany({
        data: items.map(item => ({
          purchase_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          purchase_price_per_unit: item.purchase_price_per_unit,
          gst_amount: item.gst_amount,
          total: item.total
        }))
      });

      // 7. Apply New Supplier Ledgers
      if (oldBill.status === 'DUE') {
        await tx.supplier.update({
          where: { id: supplier_id },
          data: { total_payables: { increment: total_amount } }
        });
      }

      return updatedBill;
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Edit bill error:', error);
    if (error.message.includes('not found') || error.message.includes('unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!payload?.role || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'ADMIN' && payload.role !== 'MANAGER' && payload.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const bill = await prisma.purchaseBill.findFirst({
      where: { id, tenant_id: payload.tenantId }
    });

    if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.purchaseBill.update({
        where: { id },
        data: { status: 'PAID' }
      });

      if (bill.status === 'DUE') {
        await tx.supplier.update({
          where: { id: bill.supplier_id },
          data: { total_payables: { decrement: bill.total_amount } }
        });
        await tx.transaction.create({
          data: {
            tenant_id: payload.tenantId,
            type: 'PAYMENT_OUT',
            amount: bill.total_amount,
            reference_id: bill.supplier_id,
            description: `Payment made for bill ${bill.bill_number}`
          }
        });
      }
      return b;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Mark bill paid error:', error);
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}
