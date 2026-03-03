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

export async function PUT(req, { params }) {
  try {
    const admin = await requireSuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

    const { id } = await params;
    
    // Verify target user is a SUPER_ADMIN
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (targetUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Cannot edit non-platform users here.' }, { status: 403 });
    }

    const data = await req.json();

    const updateData = {
      name: data.name,
      email: data.email,
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
    console.error('Update platform user error:', error);
    return NextResponse.json({ error: 'Failed to update platform user.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const admin = await requireSuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

    const { id } = await params;

    // Prevent changing/deleting oneself
    if (admin.userId === id) {
      return NextResponse.json({ error: 'Cannot delete your own active session.' }, { status: 400 });
    }

    // Verify target user is a SUPER_ADMIN
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (targetUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Cannot delete non-platform users here.' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete platform user error:', error);
    return NextResponse.json({ error: 'Failed to delete platform user.' }, { status: 500 });
  }
}
