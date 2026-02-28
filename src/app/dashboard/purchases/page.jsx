"use client";

import { useEffect, useState } from "react";
import { Plus, X, CheckCircle, Search, Pencil, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { PurchaseBillPDF } from "@/components/PurchaseBillPDF";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [form, setForm] = useState({
    supplier_id: "",
    status: "DUE",
    due_date: "",
    items: [{ product_id: "", purchase_price_per_unit: 0, quantity: 1, gst_percent: 0 }],
  });

  const fetchAll = async () => {
    setLoading(true);
    const [pur, sup, prod, me] = await Promise.all([
      fetch("/api/purchases").then(r => r.json()),
      fetch("/api/suppliers").then(r => r.json()),
      fetch("/api/products").then(r => r.json()),
      fetch("/api/auth/me").then(r => r.json()),
    ]);
    
    // Fetch full details (items) for each purchase bill
    const fullBills = await Promise.all(pur.map(async b => {
        const req = await fetch(`/api/purchases/${b.id}`);
        if(req.ok) return await req.json();
        return b; // fallback if fetching fails somehow
    }));
    
    setPurchases(fullBills);
    setSuppliers(sup);
    setProducts(prod);
    setUserRole(me.role);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openNewBill = () => {
    setEditingId(null);
    setForm({ supplier_id: "", status: "DUE", due_date: "", items: [{ product_id: "", purchase_price_per_unit: 0, quantity: 1, gst_percent: 0 }] });
    setOpen(true);
  };

  const openEditBill = (bill) => {
    setEditingId(bill.id);
    setForm({
      supplier_id: bill.supplier_id,
      status: bill.status,
      due_date: bill.due_date ? new Date(bill.due_date).toISOString().split('T')[0] : "",
      items: bill.items.map(i => ({
        product_id: i.product_id,
        purchase_price_per_unit: i.purchase_price_per_unit,
        quantity: i.quantity,
        gst_percent: i.product?.gst_percent || 0,
        total: i.total,
        gst_amount: i.gst_amount
      }))
    });
    setOpen(true);
  };

  const addRow = () => {
    setForm(f => ({ ...f, items: [...f.items, { product_id: "", purchase_price_per_unit: 0, quantity: 1, gst_percent: 0 }] }));
  };

  const removeRow = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === "product_id") {
        const prod = products.find(p => p.id === value);
        if (prod) {
          items[idx].purchase_price_per_unit = prod.purchase_price;
          items[idx].gst_percent = prod.gst_percent;
        }
      }
      return { ...f, items };
    });
  };

  const getLineTotals = (item) => {
    const base = item.quantity * item.purchase_price_per_unit;
    const gst = (base * (item.gst_percent || 0)) / 100;
    return { base, gst, total: base + gst };
  };

  const grandTotal = form.items.reduce((acc, item) => acc + getLineTotals(item).total, 0);
  const grandGST = form.items.reduce((acc, item) => acc + getLineTotals(item).gst, 0);

  const savePurchase = async () => {
    if (!form.supplier_id || form.items.some(i => !i.product_id)) {
      alert("Please select a supplier and fill all product rows.");
      return;
    }
    
    const payload = {
      ...form,
      total_amount: grandTotal,
      total_gst: grandGST,
      items: form.items.map(i => {
        const t = getLineTotals(i);
        return { ...i, total: t.total, gst_amount: t.gst };
      })
    };

    const url = editingId ? `/api/purchases/${editingId}` : "/api/purchases";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if(!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to save bill.");
        return;
    }
    
    setOpen(false);
    fetchAll();
  };

  const markPaid = async (id) => {
    if (!confirm("Mark this bill as PAID?")) return;
    await fetch(`/api/purchases/${id}`, { method: "PATCH" });
    fetchAll();
  };

  const filtered = purchases.filter(p =>
    p.bill_number.toLowerCase().includes(search.toLowerCase()) ||
    (p.supplier?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Purchase Bills</h2>
        <Button onClick={openNewBill} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> New Purchase Bill
        </Button>
      </div>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingId ? "Edit Purchase Bill" : "Enter Purchase Bill"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 py-2">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={form.supplier_id} onValueChange={(val) => setForm(f => ({ ...f, supplier_id: val }))}>
                <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={form.status} onValueChange={(val) => setForm(f => ({ ...f, status: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">PAID</SelectItem>
                  <SelectItem value="DUE">DUE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date (if DUE)</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-sm font-semibold mb-2">Items Received</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Purchase Price (₹)</TableHead>
                  <TableHead>GST %</TableHead>
                  <TableHead>Total (₹)</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.items.map((item, idx) => {
                  const { total } = getLineTotals(item);
                  return (
                    <TableRow key={idx}>
                      <TableCell className="min-w-[180px]">
                        <Select value={item.product_id} onValueChange={(val) => updateItem(idx, "product_id", val)}>
                          <SelectTrigger className="text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="w-16 text-xs" value={item.quantity} min={1} onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value))} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="w-24 text-xs" value={item.purchase_price_per_unit} onChange={(e) => updateItem(idx, "purchase_price_per_unit", parseFloat(e.target.value))} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="w-16 text-xs" value={item.gst_percent} onChange={(e) => updateItem(idx, "gst_percent", parseFloat(e.target.value))} />
                      </TableCell>
                      <TableCell className="font-medium">₹{total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeRow(idx)} disabled={form.items.length === 1}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Button variant="ghost" className="mt-2 text-blue-600" onClick={addRow}>
              <Plus className="mr-1 h-4 w-4" /> Add Row
            </Button>
          </div>

          <div className="border-t pt-4 text-sm text-right pr-2 space-y-1">
            <div>GST Input Credit: <strong className="text-amber-600">₹{grandGST.toFixed(2)}</strong></div>
            <div className="text-lg font-bold">Total: ₹{grandTotal.toFixed(2)}</div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={savePurchase} className="bg-blue-600 hover:bg-blue-700 text-white">{editingId ? "Update Bill" : "Save Purchase Bill"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Purchase Bills</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
            <Input placeholder="Search bills..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>GST Credit (₹)</TableHead>
                <TableHead>Total (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-6 text-zinc-500">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-6 text-zinc-500">No purchase bills yet.</TableCell></TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-blue-600">{p.bill_number}</TableCell>
                    <TableCell>{p.supplier?.name}</TableCell>
                    <TableCell>{new Date(p.createdAt).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>{p.due_date ? new Date(p.due_date).toLocaleDateString('en-IN') : '—'}</TableCell>
                    <TableCell className="text-amber-600">₹{p.total_gst.toFixed(2)}</TableCell>
                    <TableCell className="font-bold">₹{p.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "PAID" ? "default" : "destructive"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-1">
                      {userRole === 'ADMIN' && (
                        <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50" onClick={() => openEditBill(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {p.status === "DUE" && (
                        <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => markPaid(p.id)}>
                          <CheckCircle className="mr-1 h-3 w-3" /> Mark Paid
                        </Button>
                      )}

                      <Button size="sm" variant="outline" asChild>
                        <PDFDownloadLink document={<PurchaseBillPDF bill={p} />} fileName={`${p.bill_number}.pdf`}>
                          {({ loading }) => loading ? "Loading..." : <><Printer className="h-4 w-4 mr-1 text-zinc-600" /> Print PDF</>}
                        </PDFDownloadLink>
                      </Button>
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
