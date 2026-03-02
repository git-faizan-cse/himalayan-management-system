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

    const customers = await prisma.customer.findMany({
      where: { tenant_id: payload.tenantId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
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
    const newCustomer = await prisma.customer.create({
      data: {
        tenant_id: payload.tenantId,
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
