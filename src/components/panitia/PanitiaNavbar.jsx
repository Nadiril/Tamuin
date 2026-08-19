"use client";

import { usePathname } from "next/navigation";
import { Bell, CalendarRange, X } from "lucide-react";
import { useEventsQuery } from "@/lib/queries/useEventsQuery";

const pageTitleMap = {
  "/panitia": "Dashboard",
  "/panitia/events": "Pilih Acara",
  "/panitia/scan": "Scan QR",
  "/panitia/history": "Riwayat Registrasi",
  "/panitia/profile": "Profil",
  "/panitia/register": "Registrasi Tamu",
};

const pageSubtitleMap = {
  "/panitia": "Selamat datang di Panel Panitia",
  "/panitia/events": "Pilih dan kelola acara yang tersedia",
  "/panitia/scan": "Scan QR Code tamu dengan cepat",
  "/panitia/history": "Riwayat registrasi tamu",
  "/panitia/profile": "Kelola data profil Anda",
  "/panitia/register": "Tambahkan tamu baru ke dalam acara",
};

export default function PanitiaNavbar({
  panitiaName = "Panitia",
  collapsed = false,
  mobileOpen = false,
  onToggleMobile,
}) {
  const pathname = usePathname() ?? "";
  const { data: events = [] } = useEventsQuery();

  const activeEvent = events?.find((e) => e.status === "registrasi_dibuka");
  const title = pageTitleMap[pathname] || "Dashboard";
  const subtitle = pageSubtitleMap[pathname] || "";

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl border-b border-outline-variant shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-3 px-4 h-14 lg:h-16 lg:px-6">
        {/* Hamburger Button */}
        <button
          onClick={onToggleMobile}
          className="lg:hidden w-9 h-9 rounded-[10px] bg-surface-variant flex items-center justify-center shrink-0 text-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>

        {/* Title + Subtitle */}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-foreground leading-tight truncate tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        {/* Right: Event Badge, Notifications, Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {activeEvent && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-muted border border-accent/10">
              <CalendarRange className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-medium text-accent truncate max-w-[180px]">
                {activeEvent.nama_acara}
              </span>
            </div>
          )}

          <button className="relative p-2 rounded-[10px] text-muted hover:text-foreground hover:bg-surface-variant transition-colors cursor-pointer">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full ring-2 ring-surface" />
          </button>

          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 sm:border-l sm:border-outline-variant">
            <div className="w-8 h-8 rounded-full bg-accent-muted text-accent flex items-center justify-center text-xs font-semibold shrink-0 ring-2 ring-white">
              {panitiaName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-medium text-foreground">
              {panitiaName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}