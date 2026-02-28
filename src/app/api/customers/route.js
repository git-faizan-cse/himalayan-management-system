import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const newCustomer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
        credit_limit: parseFloat(data.credit_limit || 0),
        // outstanding_amount and total_purchases default to 0 in schema
      }
    });
    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
