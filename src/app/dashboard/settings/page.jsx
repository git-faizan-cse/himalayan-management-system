"use client";

import { useEffect, useState } from "react";
import { Mountain, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    company_name: "",
    address: "",
    gst_number: "",
    phone: "",
    email: "",
    invoice_prefix: "INV"
  });

  useEffect(() => {
    // Fetch the current user session which now includes the full tenant object
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data && data.tenant) {
          setForm({
            company_name: data.tenant.company_name || "",
            address: data.tenant.address || "",
            gst_number: data.tenant.gst_number || "",
            phone: data.tenant.phone || "",
            email: data.tenant.email || "",
            invoice_prefix: data.tenant.invoice_prefix || "INV"
          });
        }
      })
      .catch(err => console.error("Failed to fetch tenant settings:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      alert("Business Settings saved successfully!");
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-zinc-500">Loading settings...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Business Settings</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Invoicing Identity</CardTitle>
            <CardDescription>
              These details will appear on all your generated invoices and purchase bills.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              
              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input id="company_name" value={form.company_name} onChange={handleChange} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Full Business Address *</Label>
                  <Input id="address" value={form.address} onChange={handleChange} placeholder="123 Market St, City, Zip" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" value={form.phone} onChange={handleChange} placeholder="+1 555-0123" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Business Email *</Label>
                    <Input id="email" type="email" value={form.email} onChange={handleChange} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gst_number">GST / Tax Number</Label>
                    <Input id="gst_number" value={form.gst_number} onChange={handleChange} placeholder="22AAAAA0000A1Z5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice_prefix">Invoice Prefix *</Label>
                    <Input id="invoice_prefix" value={form.invoice_prefix} onChange={handleChange} maxLength={5} className="uppercase" required />
                    <p className="text-xs text-zinc-500 mt-1">Example: {form.invoice_prefix.toUpperCase() || 'INV'}-001</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t pt-4">
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {saving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Settings</>}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
