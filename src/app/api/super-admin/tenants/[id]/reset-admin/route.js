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

export async function POST(req, { params }) {
  try {
    const admin = await requireSuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

    const { id } = await params;
    
    // Find the primary Admin of the target tenant
    const targetAdmin = await prisma.user.findFirst({
      where: { tenant_id: id, role: 'ADMIN' },
      orderBy: { createdAt: 'asc' }
    });

    if (!targetAdmin) {
      return NextResponse.json({ error: 'No Admin account found for this tenant.' }, { status: 404 });
    }

    const { new_password } = await req.json();
    if (!new_password || new_password.trim() === '') {
      return NextResponse.json({ error: 'New password is required.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetAdmin.id },
        data: { password_hash: hashedPassword }
      });

      await tx.auditLog.create({
        data: {
          super_admin_id: admin.userId,
          action: 'TENANT_ADMIN_PASSWORD_RESET',
          entity_type: 'User',
          entity_id: targetAdmin.id,
          old_values: { state: "unknown_password" },
          new_values: { state: "forced_reset" }
        }
      });
    });

    return NextResponse.json({ success: true, message: `Password reset successfully for ${targetAdmin.email}.` });
  } catch (error) {
    console.error('Reset admin password error:', error);
    return NextResponse.json({ error: 'Failed to reset admin password.' }, { status: 500 });
  }
}
