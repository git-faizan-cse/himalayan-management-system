"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [formData, setFormData] = useState({
    name: "", category: "PVC", brand: "", sku_code: "", unit: "piece",
    purchase_price: 0, selling_price: 0, gst_percent: 18, current_stock: 0, min_stock_alert: 10
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roleRes, prodRes] = await Promise.all([
        fetch("/api/auth/me").then(r => r.json()),
        fetch("/api/products").then(r => r.json())
      ]);
      setUserRole(roleRes.role);
      setProducts(prodRes);
    } catch (error) {
      console.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: "", category: "PVC", brand: "", sku_code: "", unit: "piece",
      purchase_price: 0, selling_price: 0, gst_percent: 18, current_stock: 0, min_stock_alert: 10
    });
    setOpen(true);
  };

  const openEditModal = (p) => {
    setEditingId(p.id);
    setFormData({ ...p });
    setOpen(true);
  };

  const saveProduct = async () => {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/products/${editingId}` : "/api/products";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
       const err = await res.json();
       alert(err.error || "Failed to save product due to permissions.");
       return;
    }

    setOpen(false);
    fetchData();
  };

  const deleteProduct = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
         const err = await res.json();
         alert(err.error || "Failed to delete product due to permissions.");
         return;
      }
      fetchData();
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku_code || "").toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalInventoryValue = products.reduce((sum, p) => sum + (p.current_stock * p.selling_price), 0);

  const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER';

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
        {userRole !== 'STAFF' && (
          <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-zinc-900 border-indigo-100 dark:border-zinc-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-indigo-800 dark:text-indigo-400">Inventory Market Value</CardTitle>
            <IndianRupee className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-950 dark:text-white">
              ₹{totalInventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-indigo-600/80 mt-1">Based on current selling prices</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-zinc-950">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(val) => handleSelectChange('category', val)}>
                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PVC">PVC</SelectItem>
                  <SelectItem value="CEMENT">Cement</SelectItem>
                  <SelectItem value="IRON">Iron</SelectItem>
                  <SelectItem value="WOOD">Wood</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" value={formData.brand} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku_code">SKU Code</Label>
              <Input id="sku_code" name="sku_code" value={formData.sku_code} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit Measure *</Label>
              <Input id="unit" name="unit" placeholder="sq ft, bag, kg, piece" value={formData.unit} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst_percent">GST %</Label>
              <Input id="gst_percent" name="gst_percent" type="number" value={formData.gst_percent} onChange={handleChange} />
            </div>
            {isAdminOrManager && (
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price (₹) *</Label>
                <Input id="purchase_price" name="purchase_price" type="number" value={formData.purchase_price} onChange={handleChange} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="selling_price">Selling Price (₹) *</Label>
              <Input id="selling_price" name="selling_price" type="number" value={formData.selling_price} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_stock">Initial Stock *</Label>
              <Input id="current_stock" name="current_stock" type="number" disabled={userRole === 'ACCOUNTANT'} value={formData.current_stock} onChange={handleChange} />
              {userRole === 'ACCOUNTANT' && <p className="text-[10px] text-amber-600">Accountants cannot manually alter stock.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_stock_alert">Low Stock Alert Level *</Label>
              <Input id="min_stock_alert" name="min_stock_alert" type="number" value={formData.min_stock_alert} onChange={handleChange} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveProduct} className="bg-blue-600 hover:bg-blue-700 text-white">Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Products List</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8 text-zinc-500">Loading inventory...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  {isAdminOrManager && <TableHead>Purch (₹)</TableHead>}
                  <TableHead>Sell (₹)</TableHead>
                  <TableHead>Market Value (₹)</TableHead>
                  {userRole !== 'STAFF' && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={isAdminOrManager ? 8 : 7} className="text-center text-zinc-500 py-6">No products found.</TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((p) => {
                    const totalVal = p.current_stock * p.selling_price;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-xs text-zinc-500">{p.sku_code || '---'}</TableCell>
                        <TableCell>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-zinc-500">{p.brand || 'No Brand'} • {p.unit}</div>
                        </TableCell>
                        <TableCell>{p.category}</TableCell>
                        <TableCell>
                          <div className={`font-medium ${p.current_stock <= p.min_stock_alert ? 'text-red-500' : 'text-green-600'}`}>
                            {p.current_stock}
                          </div>
                        </TableCell>
                        {isAdminOrManager && <TableCell>₹{p.purchase_price}</TableCell>}
                        <TableCell>₹{p.selling_price}</TableCell>
                        <TableCell className="font-semibold text-indigo-700 dark:text-indigo-400">
                          ₹{totalVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </TableCell>
                        {userRole !== 'STAFF' && (
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(p)}>
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            {userRole !== 'ACCOUNTANT' && (
                              <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
