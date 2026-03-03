"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mountain, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }), // Backend parses email vs username interchangeably
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Success, redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative">
      <Link href="/" className="absolute top-6 left-6 md:top-8 md:left-8">
        <Button variant="ghost" size="sm" className="text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Website
        </Button>
      </Link>
      
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center space-y-2 mb-8 text-center">
          <div className="bg-blue-600 p-3 rounded-xl mb-2">
            <Mountain className="text-white h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Himalayan Building & Trading
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Internal Business Management System
          </p>
        </div>

        <Card className="border-0 shadow-lg dark:border-zinc-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Enter your email or username and password to access the portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="identifier">Email or Username</Label>
                <Input 
                  id="identifier" 
                  type="text" 
                  placeholder="admin@himalayan.com or adminuser" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col border-t pt-4 px-6 gap-3">
            <p className="text-xs text-center text-zinc-500">
              Only authorized personnel can log in. Contact your admin for access.
            </p>
            <div className="text-sm text-center text-zinc-600 dark:text-zinc-400">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                Register your business
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
