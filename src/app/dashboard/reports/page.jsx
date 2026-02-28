"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, TrendingUp, Users, Package, ReceiptIndianRupee } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(null);

  const downloadReport = async (type) => {
    try {
      setDownloading(type);
      const res = await fetch(`/api/reports?type=${type}`);
      if (!res.ok) throw new Error("Failed to generate report");
      
      // Get the filename from headers or default to report.xlsx
      const contentDisposition = res.headers.get("content-disposition");
      let filename = `${type}_report.xlsx`;
      if (contentDisposition && contentDisposition.includes("filename=")) {
        filename = contentDisposition.split("filename=")[1].replace(/"/g, "");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      alert("Error downloading report: " + e.message);
    } finally {
      setDownloading(null);
    }
  };

  const reports = [
    {
      id: "sales",
      title: "Sales & GST Report",
      description: "Complete list of all sales invoices, customers, and GST totals.",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      id: "inventory",
      title: "Inventory Valuation",
      description: "Current stock levels multiplied by purchase price, arranged by supplier.",
      icon: Package,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      id: "ledgers",
      title: "Customer & Supplier Ledgers",
      description: "Outstanding balances for receivables (customers) and payables (suppliers).",
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      id: "expenses",
      title: "Expense Report",
      description: "Itemized breakdown of all recorded business expenses.",
      icon: ReceiptIndianRupee,
      color: "text-rose-600",
      bg: "bg-rose-50"
    }
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reports & Exports</h2>
      </div>
      
      <p className="text-zinc-500 mb-8 max-w-2xl">
        Generate and download comprehensive Excel (.xlsx) reports for your accounting and business performance analysis.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={`p-3 rounded-full ${report.bg} ${report.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription className="pt-1">{report.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex justify-end">
                <Button 
                  onClick={() => downloadReport(report.id)} 
                  disabled={downloading === report.id}
                  variant="outline" 
                  className={`border-${report.color.split('-')[1]}-200 hover:bg-${report.color.split('-')[1]}-50 transition-colors`}
                >
                  {downloading === report.id ? (
                    "Generating..."
                  ) : (
                    <>
                      <Download className={`mr-2 h-4 w-4 ${report.color}`} />
                      Download Excel
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500 flex items-start gap-3">
        <FileSpreadsheet className="h-5 w-5 shrink-0 mt-0.5" />
        <p>
          <strong>Accounting Note:</strong> These reports are generated in real-time based on current database records. 
          For tax compliance, it is recommended to download the "Sales & GST Report" at the end of each financial month.
        </p>
      </div>
    </div>
  );
}
