"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ShieldCheck, Lock, Unlock, Users, PlusCircle, CheckCircle } from "lucide-react";

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "", admin_name: "", admin_email: "", admin_username: "", admin_password: ""
  });

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/tenants");
      if (!res.ok) throw new Error("Failed to fetch tenants");
      const data = await res.json();
      setTenants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const toggleSubscription = async (tenantId, currentStatus, targetStatus) => {
    let confirmMsg = `Are you sure you want to update this tenant to ${targetStatus}?`;
    if (!confirm(confirmMsg)) return;
    
    try {
      const res = await fetch("/api/super-admin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTenantId: tenantId, subscription: targetStatus })
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to update tenant status");
        return;
      }
      
      fetchTenants();
    } catch (err) {
      alert("An error occurred");
    }
  };

  const handleManualCreate = async () => {
    try {
      const res = await fetch("/api/super-admin/tenants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create business");
        return;
      }
      
      setIsDialogOpen(false);
      setFormData({ company_name: "", admin_name: "", admin_email: "", admin_username: "", admin_password: "" });
      fetchTenants();
    } catch (err) {
      alert("An error occurred");
    }
  };

  if (loading) return <div className="p-8 text-zinc-500">Loading Platform Data...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  const pendingCount = tenants.filter(t => t.subscription === 'PENDING').length;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-blue-600" /> Platform Administration
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" /> Manually Create Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Business</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Admin Name</Label>
                <Input value={formData.admin_name} onChange={e => setFormData({...formData, admin_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Admin Username</Label>
                <Input value={formData.admin_username} onChange={e => setFormData({...formData, admin_username: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Admin Email</Label>
                <Input type="email" value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Admin Password</Label>
                <Input type="password" value={formData.admin_password} onChange={e => setFormData({...formData, admin_password: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleManualCreate} className="bg-blue-600 hover:bg-blue-700 text-white">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registered Businesses</CardTitle>
            <ShieldCheck className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Global Users</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.reduce((sum, t) => sum + (t._count?.users || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card className={pendingCount > 0 ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${pendingCount > 0 ? 'text-amber-800 dark:text-amber-500' : ''}`}>Pending Approvals</CardTitle>
            <CheckCircle className={`h-4 w-4 ${pendingCount > 0 ? 'text-amber-600' : 'text-zinc-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pendingCount > 0 ? 'text-amber-700 dark:text-amber-400' : ''}`}>
              {pendingCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Tenants</CardTitle>
          <CardDescription>Manage businesses subscribed to the SaaS platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Registered On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map(t => (
                <TableRow key={t.id} className={t.subscription === 'PENDING' ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
                  <TableCell className="font-semibold">{t.company_name}</TableCell>
                  <TableCell>{t._count?.users || 0}</TableCell>
                  <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      t.subscription === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                      t.subscription === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
                    }`}>
                      {t.subscription}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {t.subscription === 'PENDING' ? (
                      <Button size="sm" onClick={() => toggleSubscription(t.id, t.subscription, 'ACTIVE')} className="bg-amber-600 hover:bg-amber-700 text-white">
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleSubscription(t.id, t.subscription, t.subscription === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                        className={t.subscription === 'ACTIVE' ? 'text-red-600 hover:bg-red-50 hover:text-red-700' : 'text-green-600 hover:bg-green-50 hover:text-green-700'}
                      >
                        {t.subscription === 'ACTIVE' ? <Lock className="h-4 w-4 mr-1" /> : <Unlock className="h-4 w-4 mr-1" />}
                        {t.subscription === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
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
