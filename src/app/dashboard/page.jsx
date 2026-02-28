"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, TrendingUp, TrendingDown, Users, Package, AlertCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function StatCard({ title, value, icon, color, sub }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then(r => r.json()),
      fetch("/api/auth/me").then(r => r.json())
    ]).then(([d, me]) => {
      setUserRole(me.role);
      setData(d); 
      setLoading(false); 
    }).catch(console.error);
  }, [router]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-zinc-500">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4" />
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-5 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Control Room</h2>
        <p className="text-sm text-zinc-400">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {userRole === 'STAFF' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Sales Today" value={fmt(data.salesToday)} icon={<IndianRupee className="h-4 w-4" />} color="text-green-600" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Sales Today" value={fmt(data.salesToday)} icon={<IndianRupee className="h-4 w-4" />} color="text-green-600" />
            <StatCard title="Sales This Month" value={fmt(data.salesMonth)} icon={<TrendingUp className="h-4 w-4" />} color="text-green-600" sub={`GST Collected: ${fmt(data.salesGSTMonth)}`} />
            <StatCard title="Total Sales (All Time)" value={fmt(data.salesAllTime)} icon={<TrendingUp className="h-4 w-4" />} color="text-green-600" />
            <StatCard title="Estimated Profit (Month)" value={fmt(data.estimatedProfit)} icon={<TrendingUp className="h-4 w-4" />} color={data.estimatedProfit >= 0 ? "text-green-600" : "text-red-600"} sub="Profit this month" />
          </div>

          <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Purchases Today" value={fmt(data.purchasesToday)} icon={<TrendingDown className="h-4 w-4" />} color="text-blue-600" />
            <StatCard title="Purchases This Month" value={fmt(data.purchasesMonth)} icon={<TrendingDown className="h-4 w-4" />} color="text-blue-600" />
            <StatCard title="Total Purchases (All Time)" value={fmt(data.purchasesAllTime)} icon={<TrendingDown className="h-4 w-4" />} color="text-blue-600" />
          </div>

          <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard title="Expenses This Month" value={fmt(data.expensesMonth)} icon={<TrendingDown className="h-4 w-4" />} color="text-red-600" />
            <StatCard title="Receivables (Cash In)" value={fmt(data.totalReceivables)} icon={<ArrowUpRight className="h-4 w-4" />} color="text-amber-600" sub="Owed by customers" />
            <StatCard title="Payables (Cash Out)" value={fmt(data.totalPayables)} icon={<ArrowDownLeft className="h-4 w-4" />} color="text-red-600" sub="Owed to suppliers" />
            <StatCard title="Inventory Market Value" value={fmt(data.inventoryMarketValue)} icon={<Package className="h-4 w-4" />} color="text-indigo-600" sub="Capital in Stock (Sell Rate)" />
            <StatCard title="Low Stock Alerts" value={data.lowStockItems?.length || 0} icon={<AlertCircle className="h-4 w-4" />} color="text-amber-600" sub="Below min level" />
          </div>

          {/* Bottom panels */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Low Stock */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-500" /> Low Stock Alerts</CardTitle></CardHeader>
              <CardContent>
                {data.lowStockItems?.length === 0 ? (
                  <div className="text-center text-sm text-zinc-500 py-4">✅ All items are sufficiently stocked.</div>
                ) : (
                  <div className="space-y-2">
                    {data.lowStockItems?.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                        <div>
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-zinc-500">{item.category}</div>
                        </div>
                        <Badge variant="destructive" className="text-xs">Stock: {item.current_stock} / Min: {item.min_stock_alert}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Invoices</CardTitle></CardHeader>
              <CardContent>
                {data.recentInvoices?.length === 0 ? (
                  <div className="text-center text-sm text-zinc-500 py-4">No invoices yet.</div>
                ) : (
                  <div className="space-y-2">
                    {data.recentInvoices?.map(inv => (
                      <div key={inv.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                          <div className="font-medium text-sm">{inv.invoice_number}</div>
                          <div className="text-xs text-zinc-500">{inv.customer?.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">{fmt(inv.total_amount)}</div>
                          <Badge variant={inv.status === "PAID" ? "default" : "destructive"} className="text-xs">{inv.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          {data.topProducts?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Top Selling Products</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.topProducts.map((p, i) => (
                    <div key={p.product_id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{p.product?.name}</div>
                        <div className="text-xs text-zinc-500">{p.product?.category} • Qty Sold: {p._sum?.quantity}</div>
                      </div>
                      <div className="font-bold text-sm">{fmt(p._sum?.total)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
