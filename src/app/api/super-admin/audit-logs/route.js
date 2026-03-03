import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req) {
  try {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    const payload = await verifySession(sessionCookie);
    
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Super Admin Only' }, { status: 403 });
    }

    // Limit to the most recent 500 audit logs to prevent payload bloat
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500, 
    });

    // Manually augment with the Super Admin's email for context
    const superAdminIds = [...new Set(logs.map(log => log.super_admin_id))];
    const superAdmins = await prisma.user.findMany({
      where: { id: { in: superAdminIds } },
      select: { id: true, email: true, name: true }
    });
    
    const adminMap = Object.fromEntries(superAdmins.map(admin => [admin.id, admin]));

    const augmentedLogs = logs.map(log => ({
      ...log,
      super_admin: adminMap[log.super_admin_id] || { name: 'Unknown', email: 'unknown@system' }
    }));

    return NextResponse.json(augmentedLogs);
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
