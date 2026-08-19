"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useEventsQuery } from "@/lib/queries/useEventsQuery";
import { useGuestsQuery } from "@/lib/queries/useGuestsQuery";
import { useActivitiesQuery } from "@/lib/queries/useActivitiesQuery";
import {
  Calendar,
  Users,
  QrCode,
  Clock,
  ArrowRight,
  CalendarRange,
  MapPin,
  Activity,
  ChevronDown,
} from "lucide-react";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-border rounded-lg ${className}`} />;
}

export default function PanitiaDashboardPage() {
  const router = useRouter();
  const { data: events = [], isLoading: eventsLoading } = useEventsQuery();
  const { data: guests = [], isLoading: guestsLoading } = useGuestsQuery();
  const { data: activities = [], isLoading: activitiesLoading } = useActivitiesQuery();
  const [selectedEventId, setSelectedEventId] = useState("all");
  const loading = eventsLoading || guestsLoading;

  const filteredEvents = useMemo(() => {
    if (selectedEventId === "all") return events;
    return events.filter((e) => e.id === parseInt(selectedEventId));
  }, [events, selectedEventId]);

  const filteredGuests = useMemo(() => {
    if (selectedEventId === "all") return guests;
    return guests.filter((g) => g.acara_id === parseInt(selectedEventId));
  }, [guests, selectedEventId]);

  const stats = useMemo(() => {
    const activeEvents = filteredEvents.filter((e) => e.status === "registrasi_dibuka");
    const todayStart = new Date();
    todayStart.setHours(7, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const todayGuests = filteredGuests.filter(
      (g) => g.waktu_kedatangan && new Date(g.waktu_kedatangan) >= todayStart && new Date(g.waktu_kedatangan) < todayEnd
    );
    const checkedIn = filteredGuests.filter(
      (g) => g.status_kehadiran === "hadir" || g.status_kehadiran === "terlambat"
    );
    return {
      totalEvents: filteredEvents.length,
      activeEvents: activeEvents.length,
      totalGuests: filteredGuests.length,
      checkedIn: checkedIn.length,
      todayCheckIns: todayGuests.length,
    };
  }, [filteredEvents, filteredGuests]);

  const activeEvent = useMemo(
    () => events.find((e) => e.status === "registrasi_dibuka"),
    [events]
  );

  const recentActivity = useMemo(() => {
    return activities.slice(0, 8);
  }, [activities]);

  const fmtTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "baru saja";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  const quickActions = [
    {
      label: "Scan QR",
      description: "Scan kehadiran tamu",
      icon: QrCode,
      href: "/panitia/scan",
      color: "accent",
    },
    {
      label: "Pilih Acara",
      description: "Lihat acara tersedia",
      icon: Calendar,
      href: "/panitia/events",
      color: "success",
    },
    {
      label: "Riwayat",
      description: "Data registrasi",
      icon: Clock,
      href: "/panitia/history",
      color: "info",
    },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Hero: Current Event */}
      {loading ? (
        <div className="rounded-xl border border-border bg-white p-5">
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-7 w-72" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      ) : activeEvent ? (
        <div
          onClick={() => router.push(`/panitia/scan?eventId=${activeEvent.id}`)}
          className="relative overflow-hidden rounded-xl border border-accent/20 bg-surface shadow-[var(--shadow-soft)] p-5 cursor-pointer hover:border-accent/40 hover:shadow-[var(--shadow-lifted)] transition-all duration-200"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-4 sm:pl-3">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success-light text-success text-xs font-semibold border border-success/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-subtle" />
                  Sedang Berlangsung
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                {activeEvent.nama_acara}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-accent shrink-0" />
                  {activeEvent.lokasi}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarRange className="w-4 h-4 text-accent shrink-0" />
                  {new Date(activeEvent.tanggal_mulai).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {activeEvent.jam_mulai ? `, ${activeEvent.jam_mulai}` : ""}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/panitia/scan?eventId=${activeEvent.id}`);
              }}
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              Scan QR
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-white/50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted">Tidak ada acara aktif saat ini</p>
              <p className="text-xs text-muted/70">Pilih acara untuk mulai registrasi tamu</p>
            </div>
            <button
              onClick={() => router.push("/panitia/events")}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              Lihat Semua Acara
            </button>
          </div>
        </div>
      )}

      {/* Filter + Stats */}
      <div className="space-y-4">
        {/* Filter Dropdown */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Ringkasan Data</h3>
          {events.length > 1 && (
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="appearance-none text-xs font-medium text-muted bg-white border border-border rounded-lg px-3 py-1.5 pr-8 cursor-pointer hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
              >
                <option value="all">Semua Acara</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nama_acara}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-lg:gap-5 max-sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-lg:gap-5 max-sm:gap-4">
            <div className="glass-card rounded-2xl p-5 hover:border-border-hover transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">Total Acara</span>
                <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-accent" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                {stats.totalEvents || 0}
              </p>
              {stats.totalEvents > 0 && (
                <p className="text-xs text-muted mt-1">
                  <span className="text-success font-medium">{stats.activeEvents}</span> aktif
                </p>
              )}
            </div>

            <div className="glass-card rounded-2xl p-5 hover:border-border-hover transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">Total Tamu</span>
                <div className="w-9 h-9 rounded-lg bg-success-muted flex items-center justify-center">
                  <Users className="w-4 h-4 text-success" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                {stats.totalGuests || 0}
              </p>
              {stats.totalGuests > 0 && (
                <p className="text-xs text-muted mt-1">
                  <span className="text-success font-medium">{stats.checkedIn}</span> sudah check-in
                </p>
              )}
            </div>

            <div className="glass-card rounded-2xl p-5 hover:border-border-hover transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">Check-In Hari Ini</span>
                <div className="w-9 h-9 rounded-lg bg-warning-muted flex items-center justify-center">
                  <Clock className="w-4 h-4 text-warning" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                {stats.todayCheckIns || 0}
              </p>
              <p className="text-xs text-muted mt-1">Tamu yang sudah hadir hari ini</p>
            </div>

            <div className="glass-card rounded-2xl p-5 hover:border-border-hover transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">Acara Aktif</span>
                <div className="w-9 h-9 rounded-lg bg-info-muted flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-info" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                {stats.activeEvents || 0}
              </p>
              <p className="text-xs text-muted mt-1">Acara dengan registrasi terbuka</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-lg:gap-5 max-sm:gap-4">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Aksi Cepat</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const colorStyles = {
                accent: "bg-accent-muted text-accent border-accent/10",
                success: "bg-success-muted text-success border-success/10",
                warning: "bg-warning-muted text-warning border-warning/10",
                info: "bg-info-muted text-info border-info/10",
              };
              return (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="flex flex-col items-center gap-2 p-4 glass-card rounded-2xl hover:border-border-hover hover:shadow-sm transition-all duration-200 cursor-pointer text-center group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorStyles[action.color]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">
                      {action.label}
                    </p>
                    <p className="text-xs text-muted mt-0.5">{action.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Aktivitas Terbaru</h3>
            {activities.length > 0 && (
              <button
                onClick={() => router.push("/panitia/history")}
                className="text-xs font-medium text-accent hover:text-accent-hover transition-colors cursor-pointer"
              >
                Lihat Semua
              </button>
            )}
          </div>
          {activitiesLoading ? (
            <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <Skeleton className="w-2 h-2 rounded-full shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-3 w-16 shrink-0" />
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Activity className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Aktivitas akan muncul saat tamu melakukan registrasi</p>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="divide-y divide-border">
                {recentActivity.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-card-hover transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-accent/40 shrink-0" />
                    <p className="text-sm text-foreground flex-1 truncate">{a.detail}</p>
                    <span className="text-xs text-muted-foreground shrink-0">{fmtTime(a.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
