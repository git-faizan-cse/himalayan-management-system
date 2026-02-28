"use client";

import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full flex-col">
        {children}
      </main>
    </div>
  );
}
