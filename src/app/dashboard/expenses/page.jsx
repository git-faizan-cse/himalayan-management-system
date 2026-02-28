"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EXPENSE_CATEGORIES = ["Transport", "Rent", "Electricity", "Labor Salary", "Miscellaneous", "Maintenance", "Office Supplies", "Taxes & Fees"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ expense_category: "", amount: 0, description: "", date: new Date().toISOString().split("T")[0] });

  const fetchExpenses = async () => {
    setLoading(true);
    const res = await fetch("/api/expenses");
    setExpenses(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const saveExpense = async () => {
    if (!form.expense_category || !form.amount) { alert("Category and amount required."); return; }
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setOpen(false);
    fetchExpenses();
  };

  const deleteExpense = async (id) => {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    fetchExpenses();
  };

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  const filtered = expenses.filter(e =>
    (e.expense_category || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expense Tracker</h2>
          <p className="text-sm text-zinc-500 mt-1">Total Logged: <strong className="text-red-600">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></p>
        </div>
        <Button onClick={() => { setForm({ expense_category: "", amount: 0, description: "", date: new Date().toISOString().split("T")[0] }); setOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Log Expense
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Log New Expense</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={form.expense_category} onValueChange={(val) => setForm(f => ({ ...f, expense_category: val }))}>
                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹) *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes / Description</Label>
              <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveExpense} className="bg-blue-600">Save Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Expense Log</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
            <Input placeholder="Search..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount (₹)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-zinc-500">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-zinc-500">No expenses logged yet.</TableCell></TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{new Date(e.date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-medium">{e.expense_category}</span>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">{e.description || "—"}</TableCell>
                    <TableCell className="font-semibold text-red-600">₹{e.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteExpense(e.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
