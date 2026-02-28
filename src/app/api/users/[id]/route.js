import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifySession } from '@/lib/auth';

async function requireAdmin(req) {
  const sessionCookie = req.cookies.get('himalaya_session')?.value;
  if (!sessionCookie) return null;
  const payload = await verifySession(sessionCookie);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

export async function PUT(req, { params }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

    const { id } = await params;
    const data = await req.json();

    const updateData = {
      name: data.name,
      email: data.email,
      role: data.role,
    };

    if (data.password && data.password.trim() !== "") {
      updateData.password_hash = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

    const { id } = await params;

    // Prevent changing/deleting oneself
    if (admin.userId === id) {
      return NextResponse.json({ error: 'Cannot delete your own admin account.' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
