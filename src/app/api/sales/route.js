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

    const invoices = await prisma.invoice.findMany({
      where: {
        tenant_id: payload.tenantId,
      },
      include: {
        customer: { select: { name: true } },
        items: {
          include: { product: { select: { name: true, unit: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload?.tenantId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { customer_id, items, status } = data;

    // Calculate totals from items and verify stock
    let total_amount = 0;
    let total_gst = 0;

    for (const item of items) {
      // Verify Stock and Ownership
      const product = await prisma.product.findUnique({
        where: { id: item.product_id, tenant_id: payload.tenantId },
        select: { name: true, current_stock: true }
      });

      if (!product) {
        return NextResponse.json({ error: `Product ID not found or unauthorized.` }, { status: 400 });
      }
      
      if (product.current_stock < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for "${product.name}". Requested: ${item.quantity}, Available: ${product.current_stock}` 
        }, { status: 400 });
      }

      const line_total = item.quantity * item.price_per_unit;
      const gst_amount = (line_total * item.gst_percent) / 100;
      item.gst_amount = gst_amount;
      item.total = line_total + gst_amount;
      total_amount += item.total;
      total_gst += gst_amount;
    }

    // Generate invoice number specific to the tenant
    const count = await prisma.invoice.count({
      where: { tenant_id: payload.tenantId }
    });
    const invoice_number = `INV-${String(count + 1).padStart(5, '0')}`;

    // Verify Customer ownership
    const customer = await prisma.customer.findUnique({
      where: { id: customer_id, tenant_id: payload.tenantId },
      select: { id: true }
    });

    if (!customer) {
      return NextResponse.json({ error: `Customer not found or unauthorized.` }, { status: 400 });
    }

    // Create invoice and its items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          tenant_id: payload.tenantId,
          invoice_number,
          customer_id,
          total_amount,
          total_gst,
          status: status || 'CREDIT',
        }
      });

      // Create items and deduct stock
      for (const item of items) {
        await tx.invoiceItem.create({
          data: {
            invoice_id: inv.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price_per_unit: item.price_per_unit,
            gst_amount: item.gst_amount,
            total: item.total,
          }
        });

        // Auto-deduct stock
        await tx.product.update({
          where: { id: item.product_id },
          data: { current_stock: { decrement: item.quantity } }
        });
      }

      // Update customer outstanding if it's a credit sale
      if (status === 'CREDIT') {
        await tx.customer.update({
          where: { id: customer_id },
          data: {
            outstanding_amount: { increment: total_amount },
            total_purchases: { increment: total_amount },
          }
        });
      } else {
        await tx.customer.update({
          where: { id: customer_id },
          data: { total_purchases: { increment: total_amount } }
        });
      }

      return inv;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
