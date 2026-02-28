import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      salesToday,
      salesMonth,
      purchasesMonth,
      totalReceivables,
      totalPayables,
      totalExpenses,
      allProducts,
      topProducts,
      recentInvoices,
    ] = await Promise.all([
      prisma.invoice.aggregate({ _sum: { total_amount: true }, where: { createdAt: { gte: startOfToday } } }),
      prisma.invoice.aggregate({ _sum: { total_amount: true, total_gst: true }, where: { createdAt: { gte: startOfMonth } } }),
      prisma.purchaseBill.aggregate({ _sum: { total_amount: true }, where: { createdAt: { gte: startOfMonth } } }),
      prisma.customer.aggregate({ _sum: { outstanding_amount: true } }),
      prisma.supplier.aggregate({ _sum: { total_payables: true } }),
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'EXPENSE', date: { gte: startOfMonth } } }),
      prisma.product.findMany({ select: { id: true, name: true, current_stock: true, min_stock_alert: true, category: true, purchase_price: true } }),
      prisma.invoiceItem.groupBy({
        by: ['product_id'],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } } }
      })
    ]);

    // Low stock: filter in JS to avoid raw query issues
    const lowStock = allProducts.filter(p => p.current_stock <= p.min_stock_alert);

    // Total Inventory Value
    const totalInvested = allProducts.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0);

    // Resolve top product names
    const productIds = topProducts.map(t => t.product_id);
    const productDetails = allProducts.filter(p => productIds.includes(p.id));
    const topProductsResolved = topProducts.map(t => ({
      ...t,
      product: productDetails.find(p => p.id === t.product_id),
    }));

    const monthlyPurchases = purchasesMonth._sum.total_amount || 0;
    const monthlyExpenses = totalExpenses._sum.amount || 0;
    const monthSalesTotal = salesMonth._sum.total_amount || 0;
    const monthSalesGST = salesMonth._sum.total_gst || 0;
    const estimatedProfit = monthSalesTotal - monthSalesGST - monthlyPurchases - monthlyExpenses;

    return NextResponse.json({
      salesToday: salesToday._sum.total_amount || 0,
      salesMonth: monthSalesTotal,
      salesGSTMonth: monthSalesGST,
      purchasesMonth: monthlyPurchases,
      expensesMonth: monthlyExpenses,
      estimatedProfit,
      totalReceivables: totalReceivables._sum.outstanding_amount || 0,
      totalPayables: totalPayables._sum.total_payables || 0,
      lowStockItems: lowStock,
      totalInvested,
      topProducts: topProductsResolved,
      recentInvoices,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
