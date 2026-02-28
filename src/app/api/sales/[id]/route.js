import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
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

// Mark invoice as PAID
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({ where: { id } });
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
