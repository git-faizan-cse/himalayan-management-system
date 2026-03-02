import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifySession } from '@/lib/auth';

export async function POST(req) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);

    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Super Admin Only' }, { status: 403 });
    }

    const body = await req.json();
    const { company_name, admin_name, admin_email, admin_username, admin_password } = body;

    if (!company_name || !admin_name || !admin_email || !admin_username || !admin_password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Check for existing username or email globally
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: admin_email }, { username: admin_username }]
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email or Username already in use.' }, { status: 400 });
    }

    // Hash password
    const password_hash = await bcrypt.hash(admin_password, 10);

    // Create Tenant (ACTIVE by default for manual creation) and Admin User in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          company_name,
          subscription: 'ACTIVE',
        }
      });

      const user = await tx.user.create({
        data: {
          tenant_id: tenant.id,
          name: admin_name,
          username: admin_username,
          email: admin_email,
          password_hash,
          role: 'ADMIN',
        }
      });

      return { tenant, user };
    });

    return NextResponse.json({
      success: true,
      message: 'Business created successfully.',
      tenant: result.tenant
    }, { status: 201 });

  } catch (error) {
    console.error('Manual manual creation error:', error);
    return NextResponse.json({ error: 'Failed to create business manually.' }, { status: 500 });
  }
}
