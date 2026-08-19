"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { QrCode, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfileQuery } from "@/lib/queries/useProfileQuery";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    label: "Kelola Acara",
    href: "/admin/events",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Data Tamu",
    href: "/admin/guests",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-5.364-3.636M17 20H7m10 0v-2c0-.656-.126-1.283-.364-1.858M7 20H2v-2a4 4 0 015.364-3.636M7 20v-2c0-.656.126-1.283.364-1.858m0 0A5.971 5.971 0 0112 15c1.773 0 3.376.766 4.636 1.978M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Scan QR",
    href: "/admin/scan-qr",
    icon: <QrCode className="w-5 h-5" />,
  },
  {
    label: "Laporan",
    href: "/admin/laporan",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Kelola Pengguna",
    href: "/admin/users",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.858M7 20H2v-2a4 4 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { data: profile } = useProfileQuery();
  const supabase = createClient();

  const displayName = profile?.display_name || "Admin";
  const email = profile?.email || "";

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "72px" : "256px");
  }, [collapsed]);

  const sidebarWidth = collapsed ? "w-[72px]" : "w-64";

  const sidebarContent = (
    <aside className={`flex flex-col h-full ${sidebarWidth} bg-sidebar border-r border-border transition-all duration-300 ease-in-out`}>
      {/* Logo */}
      <div className={`flex items-center border-b border-border ${collapsed ? "justify-center px-0 py-4" : "px-6 py-5"}`}>
        <Link href="/admin/dashboard" className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-3"}`}>
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-lg shadow-accent/20 shrink-0">
            <Image
              src="/Logo.webp"
              alt="Tamuin"
              width={collapsed ? 36 : 40}
              height={collapsed ? 29 : 32}
              className="object-contain w-full"
              style={{ height: "auto" }}
              priority
              unoptimized
            />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight tracking-tight">Tamuin</h1>
              <p className="text-xs text-muted font-medium">Panel Admin</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto py-4 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
        {!collapsed && (
          <p className="px-3 mb-3 text-xs font-semibold text-muted uppercase tracking-widest">
            Menu Utama
          </p>
        )}
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 group
                ${collapsed ? "justify-center py-3" : "px-3 py-3"}
                ${
                  isActive
                    ? "bg-accent-muted text-accent"
                    : "text-muted hover:text-foreground hover:bg-card-hover"
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              <span
                className={`${
                  isActive
                    ? "text-accent"
                    : "text-muted group-hover:text-foreground"
                } transition-colors`}
              >
                {item.icon}
              </span>
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle (Desktop) */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="hidden lg:flex items-center justify-center w-full py-3 border-t border-border text-muted hover:text-foreground transition-colors cursor-pointer"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Footer */}
      <div className={`border-t border-border ${collapsed ? "px-0 py-3 flex justify-center" : "px-4 py-4"}`}>
        <div className={`flex items-center gap-3 ${collapsed ? "" : "px-2"}`}>
          <div className={`shrink-0 rounded-full bg-accent-muted text-accent flex items-center justify-center text-xs font-bold ${collapsed ? "w-8 h-8" : "w-8 h-8"}`}>
            {displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "AD"}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted truncate">{email}</p>
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/");
                }}
                className="text-muted hover:text-danger transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* ── Desktop: sidebar fixed di kiri ── */}
      <div className={`hidden lg:block fixed left-0 top-0 h-screen z-40 transition-all duration-300 ${sidebarWidth}`}>
        {sidebarContent}
      </div>

      {/* ── Mobile: hamburger button ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-foreground transition-colors"
        aria-label="Buka menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── Mobile: overlay + drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
