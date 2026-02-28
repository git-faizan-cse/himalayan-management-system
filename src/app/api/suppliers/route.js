import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const newSupplier = await prisma.supplier.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
      }
    });
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
