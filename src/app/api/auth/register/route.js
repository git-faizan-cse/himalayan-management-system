import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const body = await req.json();
    const { businessName, ownerName, email, username, password } = body;

    if (!businessName || !ownerName || !email || !username || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // 1. Check for existing username or email globally
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email or Username already in use.' }, { status: 400 });
    }

    // 2. Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 3. Create Tenant and Admin User in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          company_name: businessName,
          subscription: 'ACTIVE',
        }
      });

      // Create Admin User for this Tenant
      const user = await tx.user.create({
        data: {
          tenant_id: tenant.id,
          name: ownerName,
          username,
          email,
          password_hash,
          role: 'ADMIN',
        }
      });

      return { tenant, user };
    });

    return NextResponse.json({
      success: true,
      message: 'Business registered successfully.',
      tenantId: result.tenant.id
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Something went wrong during registration.' }, { status: 500 });
  }
}
