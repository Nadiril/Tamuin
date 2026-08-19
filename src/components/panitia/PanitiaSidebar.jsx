"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Calendar,
  QrCode,
  ClipboardList,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/panitia", icon: LayoutDashboard },
  { label: "Pilih Acara", href: "/panitia/events", icon: Calendar },
  { label: "Scan QR", href: "/panitia/scan", icon: QrCode },
  { label: "Riwayat Registrasi", href: "/panitia/history", icon: ClipboardList },
  { label: "Profil", href: "/panitia/profile", icon: User },
];

export default function PanitiaSidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) onCloseMobile?.();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onCloseMobile]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/");
  }, [supabase, router]);

  const isActive = (href) => {
    if (href === "/panitia") return pathname === "/panitia";
    return pathname.startsWith(href);
  };

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[280px]";

  const sidebarContent = (
    <aside
      className={`flex flex-col h-full ${sidebarWidth} bg-sidebar border-r border-border transition-all duration-300 ease-in-out`}
    >
      {/* Logo Section */}
      <div className={`flex items-center border-b border-border ${collapsed ? "justify-center px-0 py-5" : "px-5 py-4"}`}>
        <Link href="/panitia" className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-3"}`}>
          <div className="shrink-0 flex items-center justify-center overflow-hidden rounded-xl" style={{ height: 44, width: collapsed ? 40 : 44 }}>
            <Image
              src="/Logo.webp"
              alt="Tamuin"
              width={collapsed ? 40 : 44}
              height={collapsed ? 32 : 35}
              className="object-contain"
              priority
              unoptimized
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground leading-tight tracking-tight">
                Tamuin
              </span>
              <span className="text-xs font-medium text-muted leading-tight mt-0.5">
                Panel Panitia
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto sidebar-scroll py-3 space-y-0.5 ${collapsed ? "px-0" : "px-2"}`}>
        {!collapsed && (
          <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em]">
            Menu
          </p>
        )}
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 group
                ${collapsed ? "justify-center px-0 py-3 w-full" : "px-3 py-2.5"}
                ${
                  active
                    ? "bg-accent-muted text-accent"
                    : "text-muted hover:text-foreground hover:bg-sidebar-muted"
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              {active && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r-full" />
              )}
              <Icon className={`shrink-0 transition-colors ${collapsed ? "w-5 h-5" : "w-[18px] h-[18px]"}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle (Desktop) */}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex items-center justify-center w-full py-3 border-t border-border text-muted hover:text-foreground transition-colors cursor-pointer"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Logout */}
      <div className={`border-t border-border ${collapsed ? "px-0 py-3 flex justify-center" : "p-3"}`}>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 text-sm font-medium text-muted hover:text-danger transition-colors cursor-pointer w-full
            ${collapsed ? "justify-center px-0 py-2" : "px-3 py-2.5 rounded-lg hover:bg-danger-light"}
          `}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:block fixed left-0 top-0 h-screen z-40 transition-all duration-300 ${sidebarWidth}`}>
        {sidebarContent}
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
