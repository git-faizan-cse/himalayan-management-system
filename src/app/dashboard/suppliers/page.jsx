"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({ name: "", phone: "", address: "" });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/suppliers");
      setSuppliers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", phone: "", address: "" });
    setOpen(true);
  };

  const openEditModal = (s) => {
    setEditingId(s.id);
    setFormData({ ...s });
    setOpen(true);
  };

  const saveSupplier = async () => {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/suppliers/${editingId}` : "/api/suppliers";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    setOpen(false);
    fetchSuppliers();
  };

  const deleteSupplier = async (id) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      fetchSuppliers();
    }
  };

  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || (s.phone||"").includes(search));

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Supplier Ledger</h2>
        <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{editingId ? "Edit Supplier" : "Add Supplier"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} /></div>
            <div className="space-y-2"><Label>Address</Label><Input value={formData.address} onChange={(e)=>setFormData({...formData, address: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveSupplier} className="bg-blue-600">Save Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Supplier Directory</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
            <Input placeholder="Search suppliers..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Info</TableHead>
                <TableHead>Total Payables</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-zinc-500">{s.phone || "No phone"} {s.address ? `• ${s.address}` : ""}</div>
                  </TableCell>
                  <TableCell className={s.total_payables > 0 ? "text-red-600 font-medium" : ""}>₹{s.total_payables}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(s)}><Pencil className="h-4 w-4 text-blue-600" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteSupplier(s.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
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
