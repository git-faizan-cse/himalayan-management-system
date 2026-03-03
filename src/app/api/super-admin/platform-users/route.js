import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifySession } from '@/lib/auth';

async function requireSuperAdmin(req) {
  const sessionCookie = req.cookies.get('himalaya_session')?.value;
  if (!sessionCookie) return null;
  const payload = await verifySession(sessionCookie);
  if (!payload || payload.role !== 'SUPER_ADMIN') return null;
  return payload;
}

export async function GET(req) {
  try {
    const admin = await requireSuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });

    // Fetch exclusively platform users
    const users = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
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
    console.error('Fetch platform users error:', error);
    return NextResponse.json({ error: 'Failed to fetch platform users.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireSuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });

    const data = await req.json();
    
    // Validate required fields
    if (!data.name || !data.email || !data.password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use.' }, { status: 400 });
    }

    // Check if username (email prefix) exists globally
    const username = data.email.split('@')[0];
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    const finalUsername = existingUsername ? data.email : username; // fallback to full email if username taken

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        tenant_id: admin.tenantId, // Super Admins belong to the master platform tenant
        name: data.name,
        username: finalUsername,
        email: data.email,
        password_hash: hashedPassword,
        role: 'SUPER_ADMIN', // Force role
      },
      select: { id: true, name: true, email: true, role: true }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Create platform user error:', error);
    return NextResponse.json({ error: 'Failed to create platform user.' }, { status: 500 });
  }
}
