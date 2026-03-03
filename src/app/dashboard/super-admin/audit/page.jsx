"use client";

import { useEffect, useState } from "react";
import { Search, ShieldAlert, Activity, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/super-admin/audit-logs");
      if (!res.ok) {
        if (res.status === 403) throw new Error("Unauthorized Access. Only Super Admins view Audit Logs.");
        throw new Error("Failed to load audit logs");
      }
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter(l =>
    (l.super_admin?.email || "").toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.entity_type.toLowerCase().includes(search.toLowerCase())
  );

  const formatJSON = (data) => {
    if (!data) return "None";
    return JSON.stringify(data, null, 2);
  };

  const getActionColor = (action) => {
    if (action.includes('DELETED')) return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    if (action.includes('UPDATED') || action.includes('CHANGED')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300';
    if (action.includes('RESET')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-zinc-900">Access Denied</h2>
        <p className="text-zinc-500 max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" /> Platform Audit Tracker
          </h2>
          <p className="text-zinc-500 mt-1 hidden md:block">Real-time operational non-repudiation log of all Super Admin actions.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
          <div>
            <CardTitle>System Interactions</CardTitle>
            <CardDescription>Track state changes across businesses and platform configurations.</CardDescription>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
            <Input placeholder="Search actions, emails, entities..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 dark:bg-zinc-900/50">
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Executor (Super Admin)</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target Entity</TableHead>
                  <TableHead className="w-[30%]">Differences Payload</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-zinc-500">Loading Trail...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                       <ClipboardList className="h-10 w-10 mx-auto text-zinc-300 mb-2" />
                       No audit logs match your search.
                     </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((log) => (
                    <TableRow key={log.id} className="group">
                      <TableCell className="text-xs text-zinc-500 whitespace-nowrap align-top pt-4">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="align-top pt-4">
                        <div className="font-medium text-xs text-zinc-900 dark:text-zinc-100">{log.super_admin.name}</div>
                        <div className="text-xs text-zinc-500">{log.super_admin.email}</div>
                      </TableCell>
                      <TableCell className="align-top pt-4">
                        <Badge variant="outline" className={`text-[10px] uppercase font-mono tracking-wider border-0 ${getActionColor(log.action)}`}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top pt-4">
                        <div className="text-xs font-semibold">{log.entity_type}</div>
                        <div className="text-[10px] text-zinc-400 font-mono truncate w-32" title={log.entity_id}>{log.entity_id}</div>
                      </TableCell>
                      <TableCell className="align-top">
                         <div className="max-h-24 overflow-y-auto w-full bg-zinc-50 dark:bg-zinc-950 p-2 rounded text-[10px] font-mono whitespace-pre text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800">
                           {log.new_values ? `+ ${formatJSON(log.new_values)}` : ''}
                           {log.new_values && log.old_values ? '\n-----------------\n' : ''}
                           {log.old_values ? `- ${formatJSON(log.old_values)}` : ''}
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
