import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const expenses = await prisma.transaction.findMany({
      where: { type: 'EXPENSE' },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const expense = await prisma.transaction.create({
      data: {
        type: 'EXPENSE',
        amount: parseFloat(data.amount),
        expense_category: data.expense_category,
        description: data.description || null,
        date: data.date ? new Date(data.date) : new Date(),
      }
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
