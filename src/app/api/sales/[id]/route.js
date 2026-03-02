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
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenant_id: payload.tenantId },
      include: {
        customer: true,
        items: {
          include: { product: { select: { name: true, unit: true } } }
        }
      }
    });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload?.tenantId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ONLY ADMIN CAN EDIT FINALIZED INVOICES
    if (payload?.role !== 'SUPER_ADMIN' && payload?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Admins can edit invoices' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { customer_id, items, total_amount, total_gst } = body;

    if (!customer_id || !items || !items.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify Customer ownership
    const customer = await prisma.customer.findFirst({
      where: { id: customer_id, tenant_id: payload.tenantId },
      select: { id: true }
    });

    if (!customer) {
      return NextResponse.json({ error: `Customer not found or unauthorized.` }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch old invoice details verifying tenant
      const oldInvoice = await tx.invoice.findFirst({
        where: { id, tenant_id: payload.tenantId },
        include: { items: true }
      });

      if (!oldInvoice) {
        throw new Error('Invoice not found');
      }

      // 2. Revert Old Stock Deductions
      for (const oldItem of oldInvoice.items) {
        await tx.product.update({
          where: { id: oldItem.product_id },
          data: { current_stock: { increment: oldItem.quantity } }
        });
      }

      // 3. Revert Old Customer Ledgers
      await tx.customer.update({
        where: { id: oldInvoice.customer_id },
        data: {
          total_purchases: { decrement: oldInvoice.total_amount },
          ...(oldInvoice.status === 'CREDIT' ? { outstanding_amount: { decrement: oldInvoice.total_amount } } : {})
        }
      });

      // 4. Apply New Stock Deductions (and Validate)
      for (const newItem of items) {
        const product = await tx.product.findFirst({ where: { id: newItem.product_id, tenant_id: payload.tenantId } });
        if (!product || product.current_stock < newItem.quantity) {
          throw new Error(`Insufficient stock or unauthorized for product: ${product?.name || newItem.product_id}`);
        }

        await tx.product.update({
          where: { id: newItem.product_id },
          data: { current_stock: { decrement: newItem.quantity } }
        });
      }

      // 5. Update Invoice Record
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          customer_id,
          total_amount,
          total_gst,
        }
      });

      // 6. Replace Old Items
      await tx.invoiceItem.deleteMany({ where: { invoice_id: id } });
      await tx.invoiceItem.createMany({
        data: items.map(item => ({
          invoice_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_per_unit: item.price_per_unit,
          gst_amount: item.gst_amount,
          total: item.total
        }))
      });

      // 7. Apply New Customer Ledgers
      await tx.customer.update({
        where: { id: customer_id },
        data: {
          total_purchases: { increment: total_amount },
          ...(oldInvoice.status === 'CREDIT' ? { outstanding_amount: { increment: total_amount } } : {})
        }
      });

      return updatedInvoice;
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Edit invoice error:', error);
    if (error.message.includes('Insufficient stock') || error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

// Mark invoice as PAID
export async function PATCH(req, { params }) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload?.tenantId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!payload?.role || payload.role === 'STAFF') {
      return NextResponse.json({ error: 'Forbidden: Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const invoice = await prisma.invoice.findFirst({ where: { id, tenant_id: payload.tenantId } });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const updated = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id },
        data: { status: 'PAID' }
      });

      // If previously credit, reduce outstanding
      if (invoice.status === 'CREDIT') {
        await tx.customer.update({
          where: { id: invoice.customer_id },
          data: { outstanding_amount: { decrement: invoice.total_amount } }
        });

        // Log as incoming payment
        await tx.transaction.create({
          data: {
            tenant_id: payload.tenantId,
            type: 'PAYMENT_IN',
            amount: invoice.total_amount,
            reference_id: invoice.customer_id,
            description: `Payment received for invoice ${invoice.invoice_number}`
          }
        });
      }

      return inv;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Mark paid error:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
