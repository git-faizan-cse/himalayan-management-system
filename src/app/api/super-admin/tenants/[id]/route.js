import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

async function requireSuperAdmin(req) {
  const sessionCookie = req.cookies.get('himalaya_session')?.value;
  if (!sessionCookie) return null;
  const payload = await verifySession(sessionCookie);
  if (!payload || payload.role !== 'SUPER_ADMIN') return null;
  return payload;
}

export async function GET(req, { params }) {
  try {
    const admin = await requireSuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

    const { id } = await params;
    
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } }
      }
    });

    if (!tenant) return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    return NextResponse.json(tenant);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tenant details.' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const admin = await requireSuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

    const { id } = await params;
    const data = await req.json();

    const oldTenant = await prisma.tenant.findUnique({ where: { id } });
    if (!oldTenant) return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });

    const updatedTenant = await prisma.$transaction(async (tx) => {
      const updated = await tx.tenant.update({
        where: { id },
        data: {
          company_name: data.company_name,
          address: data.address,
          gst_number: data.gst_number,
          phone: data.phone,
          email: data.email,
          invoice_prefix: data.invoice_prefix,
        }
      });

      await tx.auditLog.create({
        data: {
          super_admin_id: admin.userId,
          action: 'TENANT_UPDATED',
          entity_type: 'Tenant',
          entity_id: id,
          old_values: { company_name: oldTenant.company_name, address: oldTenant.address, gst_number: oldTenant.gst_number, phone: oldTenant.phone, email: oldTenant.email, invoice_prefix: oldTenant.invoice_prefix },
          new_values: { company_name: updated.company_name, address: updated.address, gst_number: updated.gst_number, phone: updated.phone, email: updated.email, invoice_prefix: updated.invoice_prefix }
        }
      });

      return updated;
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error('Update tenant error:', error);
    return NextResponse.json({ error: 'Failed to update tenant.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const admin = await requireSuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

    const { id } = await params;

    const oldTenant = await prisma.tenant.findUnique({ where: { id } });
    if (!oldTenant) return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });

    // Ensure we don't delete the platform root tenant if it exists
    if (oldTenant.company_name.toLowerCase().includes('himalayan')) {
      return NextResponse.json({ error: 'Cannot delete the core platform tenant.' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Soft delete by flagging, and forcefully suspend them.
      await tx.tenant.update({
        where: { id },
        data: { is_deleted: true, subscription: 'SUSPENDED' }
      });

      await tx.auditLog.create({
        data: {
          super_admin_id: admin.userId,
          action: 'TENANT_SOFT_DELETED',
          entity_type: 'Tenant',
          entity_id: id,
          old_values: { is_deleted: false, subscription: oldTenant.subscription },
          new_values: { is_deleted: true, subscription: 'SUSPENDED' }
        }
      });
    });

    return NextResponse.json({ success: true, message: 'Tenant successfully deactivated and soft deleted.' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    return NextResponse.json({ error: 'Failed to delete tenant.' }, { status: 500 });
  }
}
