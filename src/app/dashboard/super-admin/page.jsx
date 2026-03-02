"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShieldCheck, Lock, Unlock, Users } from "lucide-react";

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const toggleSubscription = async (tenantId, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus === "ACTIVE" ? "SUSPEND" : "ACTIVATE"} this tenant?`)) return;
    
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    
    try {
      const res = await fetch("/api/super-admin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTenantId: tenantId, subscription: newStatus })
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

  if (loading) return <div className="p-8 text-zinc-500">Loading Platform Data...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-blue-600" /> Platform Administration
        </h2>
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
                <TableHead>Domain/Identifier</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Registered On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-semibold">{t.company_name}</TableCell>
                  <TableCell className="text-zinc-500">{t.domain || 'N/A'}</TableCell>
                  <TableCell>{t._count?.users || 0}</TableCell>
                  <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      t.subscription === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {t.subscription}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleSubscription(t.id, t.subscription)}
                      className={t.subscription === 'ACTIVE' ? 'text-red-600 hover:bg-red-50 hover:text-red-700' : 'text-green-600 hover:bg-green-50 hover:text-green-700'}
                    >
                      {t.subscription === 'ACTIVE' ? <Lock className="h-4 w-4 mr-1" /> : <Unlock className="h-4 w-4 mr-1" />}
                      {t.subscription === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </Button>
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
