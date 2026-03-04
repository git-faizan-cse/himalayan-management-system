"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Menu, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on navigation on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950 overflow-hidden relative">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-white dark:bg-zinc-950 dark:border-zinc-800 z-20 absolute top-0 left-0 right-0 h-14">
        <div className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-500">
          <Mountain className="h-6 w-6" />
          <span className="text-zinc-900 dark:text-zinc-100">Dealer Desk</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto w-full flex-col pt-14 md:pt-0 relative z-0">
        {children}
      </main>
    </div>
  );
}
