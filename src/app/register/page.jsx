"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mountain, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName,
          ownerName: formData.ownerName,
          email: formData.email,
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccess(true);
      // Optional: automatically redirect after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Card className="w-full max-w-md border-0 shadow-lg dark:border-zinc-800 text-center py-8">
          <CardHeader>
            <div className="mx-auto bg-green-100 p-3 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
              <Mountain className="text-green-600 h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Registration Successful!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your business <strong>{formData.businessName}</strong> has been registered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              You can now log in using your email and password.
            </p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => router.push("/login")}>
              Go to Login Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center space-y-2 mb-8 text-center">
          <div className="bg-blue-600 p-3 rounded-xl mb-2">
            <Mountain className="text-white h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Register Your Business
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Create an account to manage your inventory, sales, and purchases.
          </p>
        </div>

        <Card className="border-0 shadow-lg dark:border-zinc-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3 text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name / Company Name</Label>
                <Input id="businessName" type="text" placeholder="e.g. Himalayan Trading Co." value={formData.businessName} onChange={handleChange} required />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Your Full Name</Label>
                  <Input id="ownerName" type="text" placeholder="John Doe" value={formData.ownerName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Login Username</Label>
                  <Input id="username" type="text" placeholder="johndoe" value={formData.username} onChange={handleChange} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={formData.password} onChange={handleChange} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required minLength={6} />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                  {loading ? "Creating Account..." : "Register Business"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col border-t pt-4 px-6 gap-2 items-center">
            <Link href="/login" className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back to Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
