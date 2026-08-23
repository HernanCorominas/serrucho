"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle, LayoutDashboard, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { BrandLogo } from "@/components/brand-logo";
import { UserNavMenu } from "@/components/user-nav-menu";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 no-print">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
        <BrandLogo size="md" showTagline={true} href="/" />

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <Link href="/calculadora" aria-label="Calculadora de Cuenta">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex gap-1.5 font-bold text-xs sm:text-sm text-foreground/80 hover:text-foreground rounded-xl">
              <Calculator className="h-4 w-4 text-primary" />
              <span>Calculadora</span>
            </Button>
          </Link>

          <Link href="/dashboard" aria-label="Mis Serruchos">
            <Button variant="ghost" size="sm" className="gap-1.5 font-bold text-xs sm:text-sm text-foreground/80 hover:text-foreground rounded-xl">
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              <span className="hidden md:inline">Mis Serruchos</span>
            </Button>
          </Link>

          <ThemeToggle />

          <NotificationBell />

          {/* User Sign In / Account Dropdown Menu */}
          <UserNavMenu />

          <Link href="/dashboard?new=true">
            <Button size="sm" className="gap-1.5 shadow-sm font-extrabold bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm rounded-xl px-3.5 sm:px-4">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Serrucho</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
