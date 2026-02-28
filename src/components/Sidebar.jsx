import { Mountain, LayoutDashboard, Package, ShoppingCart, Users, Truck, Receipt, Settings, LogOut, FileSpreadsheet, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function Sidebar({ userRole }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800">
      <div className="flex h-14 items-center border-b px-4 dark:border-zinc-800">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-500">
          <Mountain className="h-6 w-6" />
          <span className="text-zinc-900 dark:text-zinc-100">Himalayan</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-auto py-4">
        <div className="grid gap-1 px-2">
          <SidebarItem href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
          <SidebarItem href="/dashboard/inventory" icon={<Package className="h-4 w-4" />} label="Inventory" />
          <SidebarItem href="/dashboard/sales" icon={<ShoppingCart className="h-4 w-4" />} label="Sales & GST" />
          <SidebarItem href="/dashboard/purchases" icon={<Truck className="h-4 w-4" />} label="Purchases" />
          <SidebarItem href="/dashboard/customers" icon={<Users className="h-4 w-4" />} label="Customers" />
          <SidebarItem href="/dashboard/suppliers" icon={<Users className="h-4 w-4" />} label="Suppliers" />
          <SidebarItem href="/dashboard/expenses" icon={<Receipt className="h-4 w-4" />} label="Expenses" />
          <SidebarItem href="/dashboard/reports" icon={<FileSpreadsheet className="h-4 w-4" />} label="Reports" />
          {userRole === 'ADMIN' && (
            <SidebarItem href="/dashboard/users" icon={<Shield className="h-4 w-4" />} label="System Users" />
          )}
        </div>
      </nav>

      <div className="border-t p-4 dark:border-zinc-800">
        <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}

function SidebarItem({ href, icon, label }) {
  return (
    <Link href={href}>
      <span className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-colors">
        {icon}
        {label}
      </span>
    </Link>
  );
}
