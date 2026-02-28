"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, X, Search, CheckCircle, AlertCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/InvoicePDF";

export default function SalesPage() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    customer_id: "",
    status: "CREDIT",
    items: [{ product_id: "", price_per_unit: 0, quantity: 1, gst_percent: 18, unit: "" }],
  });

  const fetchAll = async () => {
    setLoading(true);
    const [inv, cust, prod] = await Promise.all([
      fetch("/api/sales").then(r => r.json()),
      fetch("/api/customers").then(r => r.json()),
      fetch("/api/products").then(r => r.json()),
    ]);
    // Fetch full details for products in invoices
    const fullInvoices = await Promise.all(inv.map(async i => {
        const fullInvReq = await fetch(`/api/sales/${i.id}`);
        return await fullInvReq.json();
    }));
    setInvoices(fullInvoices);
    setCustomers(cust);
    setProducts(prod);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openNewInvoice = () => {
    setForm({
      customer_id: "",
      status: "CREDIT",
      items: [{ product_id: "", price_per_unit: 0, quantity: 1, gst_percent: 18, unit: "" }],
    });
    setOpen(true);
  };

  const addRow = () => {
    setForm(f => ({ ...f, items: [...f.items, { product_id: "", price_per_unit: 0, quantity: 1, gst_percent: 18, unit: "" }] }));
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
          items[idx].price_per_unit = prod.selling_price;
          items[idx].gst_percent = prod.gst_percent;
          items[idx].unit = prod.unit;
        }
      }
      return { ...f, items };
    });
  };

  const getLineTotals = (item) => {
    const base = item.quantity * item.price_per_unit;
    const gst = (base * item.gst_percent) / 100;
    return { base, gst, total: base + gst };
  };

  const grandTotal = form.items.reduce((acc, item) => acc + getLineTotals(item).total, 0);
  const grandGST = form.items.reduce((acc, item) => acc + getLineTotals(item).gst, 0);

  const saveInvoice = async () => {
    if (!form.customer_id || form.items.some(i => !i.product_id)) {
      alert("Please select a customer and fill all product fields.");
      return;
    }
    
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || "Failed to create invoice.");
        return;
      }
      
      setOpen(false);
      fetchAll();
    } catch (error) {
      alert("An error occurred while saving the invoice.");
    }
  };

  const markPaid = async (id) => {
    if (!confirm("Mark this invoice as PAID?")) return;
    await fetch(`/api/sales/${id}`, { method: "PATCH" });
    fetchAll();
  };

  const filtered = invoices.filter(inv =>
    inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    (inv.customer?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Sales & GST Invoices</h2>
        <Button onClick={openNewInvoice} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> New Invoice
        </Button>
      </div>

      {/* Invoice Creation Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-xl">Create GST Invoice</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={form.customer_id} onValueChange={(val) => setForm(f => ({ ...f, customer_id: val }))}>
                <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.phone ? ` • ${c.phone}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={form.status} onValueChange={(val) => setForm(f => ({ ...f, status: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">PAID (Cash)</SelectItem>
                  <SelectItem value="CREDIT">CREDIT (Due)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-4">
            <div className="text-sm font-semibold mb-2">Invoice Items</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Rate (₹)</TableHead>
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
                      <TableCell className="min-w-[160px]">
                        <Select value={item.product_id} onValueChange={(val) => updateItem(idx, "product_id", val)}>
                          <SelectTrigger className="text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500">{item.unit || "—"}</TableCell>
                      <TableCell>
                        <Input type="number" className="w-16 text-xs" value={item.quantity} min={1} onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value))} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="w-24 text-xs" value={item.price_per_unit} onChange={(e) => updateItem(idx, "price_per_unit", parseFloat(e.target.value))} />
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

          {/* Totals */}
          <div className="border-t pt-4 mt-2 space-y-1 text-sm text-right pr-2">
            <div>Subtotal (excl. GST): <strong>₹{(grandTotal - grandGST).toFixed(2)}</strong></div>
            <div>Total GST: <strong className="text-amber-600">₹{grandGST.toFixed(2)}</strong></div>
            <div className="text-lg font-bold">Grand Total: ₹{grandTotal.toFixed(2)}</div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveInvoice} className="bg-blue-600 hover:bg-blue-700 text-white">Save Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Invoice List</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
            <Input placeholder="Search invoices..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>GST (₹)</TableHead>
                <TableHead>Total (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-6 text-zinc-500">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-6 text-zinc-500">No invoices yet.</TableCell></TableRow>
              ) : (
                filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-semibold text-blue-600">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.customer?.name}</TableCell>
                    <TableCell>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="text-amber-600">₹{inv.total_gst.toFixed(2)}</TableCell>
                    <TableCell className="font-bold">₹{inv.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === "PAID" ? "default" : "destructive"}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-1">
                      {inv.status === "CREDIT" && (
                        <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => markPaid(inv.id)}>
                          <CheckCircle className="mr-1 h-3 w-3" /> Mark Paid
                        </Button>
                      )}
                      
                      <Button size="sm" variant="outline" asChild>
                        <PDFDownloadLink document={<InvoicePDF invoice={inv} />} fileName={`${inv.invoice_number}.pdf`}>
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
