"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mountain, CheckCircle2, ArrowRight, ShieldCheck, Zap, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="px-6 lg:px-14 h-16 flex items-center border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="#">
          <Mountain className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-xl tracking-tight text-blue-900">Dealer Desk</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-zinc-600 hover:text-blue-600" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-zinc-600 hover:text-blue-600" href="/login">
            Sign In
          </Link>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/register">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-dot-pattern">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-zinc-900">
                  Manage your entire business on <span className="text-blue-600">autopilot.</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-zinc-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-zinc-400">
                  The all-in-one ERP and CRM platform for modern businesses. Invoicing, inventory, purchasing, and reporting — unified.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-lg">
                  <Link href="/register">
                    Open Your Free Account <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8 text-lg">
                  <Link href="/login">Login to Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-zinc-50 border-t">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-zinc-900">Everything you need to scale</h2>
              <p className="max-w-[900px] text-zinc-500 md:text-xl/relaxed">
                A seamless toolkit designed to prevent losses, track growth, and streamline operations.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 md:gap-10">
              {/* Feature 1 */}
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white rounded-2xl shadow-sm border border-zinc-100 h-full">
                <div className="p-4 bg-blue-100 rounded-full">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Fast Invoicing</h3>
                <p className="text-zinc-500">Create GST-compliant invoices in seconds. Track paid and pending balances automatically.</p>
              </div>
              {/* Feature 2 */}
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white rounded-2xl shadow-sm border border-zinc-100 h-full">
                <div className="p-4 bg-green-100 rounded-full">
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold">Inventory Control</h3>
                <p className="text-zinc-500">Never run out of stock. Secure multi-location tracking and real-time valuation metrics.</p>
              </div>
              {/* Feature 3 */}
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white rounded-2xl shadow-sm border border-zinc-100 h-full">
                <div className="p-4 bg-purple-100 rounded-full">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold">Profit Reporting</h3>
                <p className="text-zinc-500">Instant financial insights. Track income vs expenses and generate beautiful accountant-ready reports.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          © 2026 Himalayan SaaS Platform. Built for Dealers. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 text-zinc-500" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-zinc-500" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
