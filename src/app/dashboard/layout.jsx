"use client";

import { Sidebar } from "@/components/Sidebar";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }) {
  const [role, setRole] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => setRole(data.role))
      .catch(console.error);
  }, []);

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950">
      <Sidebar userRole={role} />
      <main className="flex-1 overflow-y-auto w-full flex-col">
        {children}
      </main>
    </div>
  );
}
