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
import { ShieldCheck, Lock, Unlock, Users, PlusCircle, CheckCircle, Settings, Key, Trash2 } from "lucide-react";

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "", admin_name: "", admin_email: "", admin_username: "", admin_password: ""
  });

  // Configure Dialog State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [configData, setConfigData] = useState({
    company_name: "", address: "", gst_number: "", phone: "", email: "", invoice_prefix: ""
  });
  const [newPassword, setNewPassword] = useState("");

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
      if (selectedTenant && selectedTenant.id === tenantId) {
         setSelectedTenant({...selectedTenant, subscription: targetStatus});
      }
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

  const openConfig = async (tenant) => {
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenant.id}`);
      if (res.ok) {
         const t = await res.json();
         setSelectedTenant(t);
         setConfigData({
           company_name: t.company_name || "",
           address: t.address || "",
           gst_number: t.gst_number || "",
           phone: t.phone || "",
           email: t.email || "",
           invoice_prefix: t.invoice_prefix || "INV"
         });
         setNewPassword("");
         setIsConfigOpen(true);
      } else {
         alert("Failed to fetch tenant details.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateDetails = async () => {
    try {
      const res = await fetch(`/api/super-admin/tenants/${selectedTenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData)
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      alert("Tenant details updated successfully.");
      fetchTenants();
    } catch(err) {
      alert(err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.trim() === '') {
      alert("Please enter a new password");
      return;
    }
    if (!confirm("Are you sure you want to forcibly reset the primary Admin's password for this business?")) return;
    
    try {
      const res = await fetch(`/api/super-admin/tenants/${selectedTenant.id}/reset-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword })
      });
      if (!res.ok) throw new Error((await res.json()).error || "Reset failed");
      alert("Password reset successfully.");
      setNewPassword("");
    } catch(err) {
      alert(err.message);
    }
  };

  const handleSoftDelete = async () => {
    if (!confirm("WARNING: Are you sure you want to soft-delete this business? They will immediately lose access, and the action will be audit-logged.")) return;
    try {
      const res = await fetch(`/api/super-admin/tenants/${selectedTenant.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      alert("Tenant deleted and suspended successfully.");
      setIsConfigOpen(false);
      fetchTenants();
    } catch(err) {
      alert(err.message);
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
                      <Button size="sm" variant="outline" onClick={() => openConfig(t)}>
                        <Settings className="h-4 w-4 mr-1" /> Configure
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Configuration Modal */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Business: {selectedTenant?.company_name}</DialogTitle>
          </DialogHeader>
          
          {selectedTenant && (
            <div className="space-y-6 py-4">
              
              {/* STATUS TOGGLE */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <div>
                  <h4 className="font-semibold text-sm">Account Status: <span className={selectedTenant.subscription === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}>{selectedTenant.subscription}</span></h4>
                  <p className="text-xs text-zinc-500">Toggle whether this business has active access to the SaaS.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleSubscription(selectedTenant.id, selectedTenant.subscription, selectedTenant.subscription === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                  className={selectedTenant.subscription === 'ACTIVE' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                >
                  {selectedTenant.subscription === 'ACTIVE' ? <Lock className="h-4 w-4 mr-1" /> : <Unlock className="h-4 w-4 mr-1" />}
                  {selectedTenant.subscription === 'ACTIVE' ? 'Suspend Access' : 'Activate Access'}
                </Button>
              </div>

              {/* DETAILS FORM */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Business Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input value={configData.company_name} onChange={e => setConfigData({...configData, company_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>GST Number</Label>
                    <Input value={configData.gst_number} onChange={e => setConfigData({...configData, gst_number: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={configData.email} onChange={e => setConfigData({...configData, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={configData.phone} onChange={e => setConfigData({...configData, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Address</Label>
                    <Input value={configData.address} onChange={e => setConfigData({...configData, address: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice Prefix</Label>
                    <Input value={configData.invoice_prefix} onChange={e => setConfigData({...configData, invoice_prefix: e.target.value})} />
                  </div>
                </div>
                <Button onClick={handleUpdateDetails} className="mt-2 text-white bg-blue-600 hover:bg-blue-700">Save Details</Button>
              </div>

              <hr className="dark:border-zinc-800" />

              {/* ADMIN PASSWORD RESET */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-purple-700 dark:text-purple-400">Emergency Access Recovery</h3>
                <div className="flex gap-4 items-end">
                  <div className="space-y-2 flex-1">
                    <Label>New Password for Primary Admin</Label>
                    <Input type="password" placeholder="Enter new password..." value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <Button onClick={handleResetPassword} variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                    <Key className="w-4 h-4 mr-2"/> Reset Password
                  </Button>
                </div>
                <p className="text-xs text-zinc-500">This instantly overwrites the password for the primary Admin (`role === 'ADMIN'`) of this tenant and creates an audit log entry.</p>
              </div>

              <hr className="dark:border-zinc-800" />

              {/* DANGEROUS DELETE */}
              <div className="space-y-4 p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 rounded-lg">
                <h3 className="text-lg font-medium text-red-600 flex items-center gap-2"><Trash2 className="w-5 h-5"/> Danger Zone</h3>
                <p className="text-sm text-red-700 dark:text-red-400">Soft-deletes this tenant. The data remains in the database for compliance, but the tenant is removed from the active system and all its users are locked out.</p>
                <Button onClick={handleSoftDelete} variant="destructive">
                  Delete Business
                </Button>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
