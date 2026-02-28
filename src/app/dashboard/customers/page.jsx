"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({ name: "", phone: "", address: "", credit_limit: 0 });
  const [userRole, setUserRole] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      setCustomers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchCustomers(); 
    fetch("/api/auth/me").then(r => r.json()).then(d => setUserRole(d.role));
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", phone: "", address: "", credit_limit: 0 });
    setOpen(true);
  };

  const openEditModal = (c) => {
    setEditingId(c.id);
    setFormData({ ...c });
    setOpen(true);
  };

  const saveCustomer = async () => {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    setOpen(false);
    fetchCustomers();
  };

  const deleteCustomer = async (id) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      await fetch(`/api/customers/${id}`, { method: "DELETE" });
      fetchCustomers();
    }
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone||"").includes(search));

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customer Ledger</h2>
        <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{editingId ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} /></div>
            <div className="space-y-2"><Label>Address</Label><Input value={formData.address} onChange={(e)=>setFormData({...formData, address: e.target.value})} /></div>
            <div className="space-y-2"><Label>Credit Limit (₹)</Label><Input type="number" value={formData.credit_limit} onChange={(e)=>setFormData({...formData, credit_limit: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveCustomer} className="bg-blue-600">Save Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Customer Directory</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
            <Input placeholder="Search customers..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Info</TableHead>
                <TableHead>Total Purchases</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Credit Limit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-zinc-500">{c.phone || "No phone"} {c.address ? `• ${c.address}` : ""}</div>
                  </TableCell>
                  <TableCell>₹{c.total_purchases}</TableCell>
                  <TableCell className={c.outstanding_amount > 0 ? "text-red-600 font-medium" : ""}>₹{c.outstanding_amount}</TableCell>
                  <TableCell>₹{c.credit_limit || 0}</TableCell>
                  <TableCell className="text-right">
                    {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(c)}><Pencil className="h-4 w-4 text-blue-600" /></Button>
                    )}
                    {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                      <Button variant="ghost" size="icon" onClick={() => deleteCustomer(c.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
