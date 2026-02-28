"use client";

import { useEffect, useState } from "react";
import { Plus, X, Search, Edit2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function UsersPage() {
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
    role: "STAFF",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      if (!res.ok) {
        if (res.status === 403) throw new Error("Unauthorized Access. Only ADMIN can manage users.");
        throw new Error("Failed to load users");
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
    setForm({ name: "", email: "", password: "", role: "STAFF" });
    setOpen(true);
  };

  const openEdit = (user) => {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setOpen(true);
  };

  const saveUser = async () => {
    if (!form.name || !form.email || (!editingId && !form.password)) {
      alert("Please fill all required fields.");
      return;
    }

    const url = editingId ? `/api/users/${editingId}` : "/api/users";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save user");
      
      setOpen(false);
      fetchUsers();
    } catch (e) {
      alert(e.message);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      fetchUsers();
    } catch (e) {
      alert(e.message);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
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
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <Button onClick={openNewUser} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit User Account" : "Create New User"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Password {editingId && <span className="text-zinc-400 text-xs font-normal">(Leave blank to keep current)</span>}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>System Role</Label>
              <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">STAFF (Basic access)</SelectItem>
                  <SelectItem value="ACCOUNTANT">ACCOUNTANT (Accounting only)</SelectItem>
                  <SelectItem value="MANAGER">MANAGER (All features except users)</SelectItem>
                  <SelectItem value="ADMIN">ADMIN (Full access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveUser} className="bg-blue-600 hover:bg-blue-700 text-white">
              {editingId ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>System Accounts</CardTitle>
            <CardDescription>Manage who has access to the management system.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
            <Input placeholder="Search users..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-zinc-500">No users found.</TableCell></TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-semibold">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={
                        user.role === 'ADMIN' ? 'default' : 
                        user.role === 'MANAGER' ? 'secondary' : 
                        'outline'
                      }>
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
