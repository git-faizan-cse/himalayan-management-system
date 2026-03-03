"use client";

import { useEffect, useState } from "react";
import { Plus, X, Search, Edit2, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PlatformUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "", // Only required on create, optional on update
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/super-admin/platform-users");
      if (!res.ok) {
        if (res.status === 403) throw new Error("Unauthorized Access. Only Super Admins can manage platform users.");
        throw new Error("Failed to load platform users");
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openNewUser = () => {
    setEditingId(null);
    setForm({ name: "", email: "", password: "" });
    setOpen(true);
  };

  const openEdit = (user) => {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, password: "" });
    setOpen(true);
  };

  const saveUser = async () => {
    if (!form.name || !form.email || (!editingId && !form.password)) {
      alert("Please fill all required fields.");
      return;
    }

    const url = editingId ? `/api/super-admin/platform-users/${editingId}` : "/api/super-admin/platform-users";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save platform user");
      
      setOpen(false);
      fetchUsers();
    } catch (e) {
      alert(e.message);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this Super Admin? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/super-admin/platform-users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete platform user");
      fetchUsers();
    } catch (e) {
      alert(e.message);
    }
  };

  const filtered = users.filter(u =>
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-zinc-900">Access Denied</h2>
        <p className="text-zinc-500 max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Platform Administrators</h2>
          <p className="text-zinc-500 mt-1 hidden md:block">Manage users with top-level Super Admin access to the SaaS platform.</p>
        </div>
        <Button onClick={openNewUser} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Add Administrator
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              {editingId ? "Edit Administrator" : "Create Administrator"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@platform.com" />
            </div>
            <div className="space-y-2">
              <Label>Password {editingId && <span className="text-zinc-400 text-xs font-normal">(Leave blank to keep current)</span>}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-md border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-200">
              <strong>Note:</strong> This user will automatically be assigned the <code>SUPER_ADMIN</code> role and will have full access to all tenant management tools. They will not have access to individual shop data.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveUser} className="bg-blue-600 hover:bg-blue-700 text-white">
              {editingId ? "Save Changes" : "Create Administrator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
          <div>
            <CardTitle>Super Admin Accounts</CardTitle>
            <CardDescription>Accounts with global visibility over the SaaS infrastructure.</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
            <Input placeholder="Search admins..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-zinc-500">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-zinc-500">No platform administrators found.</TableCell></TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-semibold">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                        <Edit2 className="h-4 w-4 text-zinc-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteUser(user.id)}>
                        <X className="h-4 w-4 text-red-500" />
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
