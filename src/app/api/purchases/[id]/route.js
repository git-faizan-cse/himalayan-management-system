import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const bill = await prisma.purchaseBill.findUnique({ where: { id } });
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
