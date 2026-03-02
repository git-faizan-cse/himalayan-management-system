import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifySession } from '@/lib/auth';

// Helper to check if requester is ADMIN or SUPER_ADMIN and explicitly return tenant_id
async function requireAdmin(req) {
  const sessionCookie = req.cookies.get('himalaya_session')?.value;
  if (!sessionCookie) return null;
  const payload = await verifySession(sessionCookie);
  if (!payload || !['ADMIN', 'SUPER_ADMIN'].includes(payload.role)) return null;
  return payload;
}

export async function PUT(req, { params }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

    const { id } = await params;
    
    // Verify target user belongs to this admin's tenant (or is SUPER_ADMIN editing themselves)
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (admin.role !== 'SUPER_ADMIN' && targetUser.tenant_id !== admin.tenantId) {
      return NextResponse.json({ error: 'Forbidden: Cannot edit users outside your business.' }, { status: 403 });
    }

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
    if (admin.role === 'SUPER_ADMIN') return NextResponse.json({ error: 'Super Admin cannot delete users from here.' }, { status: 403 });

    const { id } = await params;

    // Prevent changing/deleting oneself
    if (admin.userId === id) {
      return NextResponse.json({ error: 'Cannot delete your own admin account.' }, { status: 400 });
    }

    // Verify target user belongs to this admin's tenant
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (targetUser.tenant_id !== admin.tenantId) {
      return NextResponse.json({ error: 'Forbidden: Cannot delete users outside your business.' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
