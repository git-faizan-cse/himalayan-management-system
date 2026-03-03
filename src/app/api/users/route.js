import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifySession } from '@/lib/auth';

// Helper to check if requester is ADMIN and explicitly return tenant_id
async function requireAdmin(req) {
  const sessionCookie = req.cookies.get('himalaya_session')?.value;
  if (!sessionCookie) return null;
  const payload = await verifySession(sessionCookie);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

export async function GET(req) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });

    // This route is purely for the tenant to see their own users.
    const query = { tenant_id: admin.tenantId };

    const users = await prisma.user.findMany({
      where: query,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized. Shop Admin access required.' }, { status: 403 });

    const data = await req.json();
    
    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        tenant_id: admin.tenantId, // Force strict data isolation
        name: data.name,
        username: data.email, // Auto-fill globally unique username using email
        email: data.email,
        password_hash: hashedPassword,
        role: data.role || 'STAFF',
      },
      select: { id: true, name: true, email: true, role: true } // Don't return password hash
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
