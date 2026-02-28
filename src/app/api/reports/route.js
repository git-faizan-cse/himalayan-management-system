import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    let data = [];
    let sheetName = "Report";

    if (type === 'sales') {
      const invoices = await prisma.invoice.findMany({
        include: { customer: true, items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
      });
      data = invoices.map(inv => ({
        "Invoice Number": inv.invoice_number,
        "Date": new Date(inv.createdAt).toISOString().split('T')[0],
        "Customer": inv.customer.name,
        "Status": inv.status,
        "Total GST": inv.total_gst,
        "Total Amount": inv.total_amount,
        "Items Count": inv.items.length
      }));
      sheetName = "Sales_Invoices";

    } else if (type === 'inventory') {
      const products = await prisma.product.findMany({
        include: { supplier: true },
        orderBy: { name: 'asc' }
      });
      data = products.map(p => ({
        "SKU": p.sku_code || "N/A",
        "Product Name": p.name,
        "Category": p.category,
        "Stock": p.current_stock,
        "Unit": p.unit,
        "Purchase Price": p.purchase_price,
        "Selling Price": p.selling_price,
        "Inventory Value": p.current_stock * p.purchase_price,
        "Supplier": p.supplier ? p.supplier.name : "N/A"
      }));
      sheetName = "Inventory_Valuation";

    } else if (type === 'ledgers') {
      const [customers, suppliers] = await Promise.all([
        prisma.customer.findMany({ orderBy: { name: 'asc' } }),
        prisma.supplier.findMany({ orderBy: { name: 'asc' } })
      ]);
      
      const cData = customers.map(c => ({
        "Type": "Customer",
        "Name": c.name,
        "Phone": c.phone || "—",
        "Total Business": c.total_purchases,
        "Outstanding (Receivable)": c.outstanding_amount
      }));
      
      const sData = suppliers.map(s => ({
        "Type": "Supplier",
        "Name": s.name,
        "Phone": s.phone || "—",
        "Total Business": "—",
        "Outstanding (Payable)": s.total_payables
      }));
      
      data = [...cData, ...sData];
      sheetName = "Business_Ledgers";

    } else if (type === 'expenses') {
         const expenses = await prisma.transaction.findMany({
             where: { type: 'EXPENSE' },
             orderBy: { date: 'desc' }
         });
         data = expenses.map(e => ({
             "Date": new Date(e.date).toISOString().split('T')[0],
             "Category": e.expense_category,
             "Amount": e.amount,
             "Description": e.description || "—"
         }));
         sheetName = "Expenses";
    }
    else {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Generate Excel Workbook
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Write to buffer
    const buf = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Return as downloadable file
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
