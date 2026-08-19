"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useEventsQuery } from "@/lib/queries/useEventsQuery";
import { useGuestsQuery } from "@/lib/queries/useGuestsQuery";
import {
  Calendar,
  MapPin,
  Users,
  Search,
  QrCode,
  ArrowRight,
  CalendarRange,
  Clock,
} from "lucide-react";

const statusStyles = {
  registrasi_dibuka: {
    badge: "bg-success-light text-success border border-success/20",
    dot: "bg-success",
    label: "Registrasi Dibuka",
  },
  akan_datang: {
    badge: "bg-warning-light text-warning border border-warning/20",
    dot: "bg-warning",
    label: "Akan Datang",
  },
  registrasi_ditutup: {
    badge: "bg-danger-light text-danger border border-danger/20",
    dot: "bg-danger",
    label: "Registrasi Ditutup",
  },
};

export default function PanitiaEventsPage() {
  const router = useRouter();
  const { data: events = [] } = useEventsQuery();
  const { data: guests = [] } = useGuestsQuery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchSearch =
        (e.nama_acara || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.lokasi || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [events, search, statusFilter]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari acara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg bg-white border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg bg-white border border-border px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all"
        >
          <option value="all">Semua Status</option>
          <option value="registrasi_dibuka">Registrasi Dibuka</option>
          <option value="akan_datang">Akan Datang</option>
          <option value="registrasi_ditutup">Registrasi Ditutup</option>
        </select>
        {filtered.length > 0 && (
          <span className="w-fit inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-white border border-border rounded-full px-3 py-1.5 sm:ml-auto self-start sm:self-center">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            {filtered.length} Acara
          </span>
        )}
      </div>

      <div className={`grid grid-cols-1 gap-5 max-lg:gap-4 max-sm:gap-3 ${filtered.length === 1 ? "sm:grid-cols-1 xl:max-w-2xl mx-auto" : filtered.length === 2 ? "sm:grid-cols-2 xl:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
        {filtered.map((event) => {
          const s = statusStyles[event.status] || statusStyles.akan_datang;
          const totalTamu = guests.filter((g) => g.acara_id === event.id).length;
          const checkedIn = guests.filter(
            (g) => g.acara_id === event.id && (g.status_kehadiran === "hadir" || g.status_kehadiran === "terlambat")
          ).length;
          const canScan = event.status === "registrasi_dibuka";
          const chipTone = canScan
            ? "bg-accent-muted text-accent"
            : event.status === "akan_datang"
              ? "bg-warning-muted text-warning"
              : "bg-muted/5 text-muted-foreground/50";

          return (
            <div
              key={event.id}
              className={`group flex flex-col rounded-xl border bg-surface shadow-[var(--shadow-soft)] transition-all duration-200 overflow-hidden ${canScan
                ? "border-accent/25 hover:border-accent/40 hover:shadow-[var(--shadow-lifted)]"
                : "border-outline-variant hover:border-border-hover hover:shadow-[var(--shadow-lifted)]"
                }`}
            >
              {/* Top color bar */}
              <div className={`h-1 w-full ${canScan ? "bg-accent" : event.status === "akan_datang" ? "bg-warning" : "bg-muted-foreground/20"}`} />

              <div className="flex flex-col flex-1 p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${chipTone}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`${s.badge} text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors mt-1.5">
                      {event.nama_acara}
                    </h3>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{event.lokasi}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarRange className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{formatDate(event.tanggal_mulai)}{event.jam_mulai ? `, ${event.jam_mulai}` : ""}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-medium text-foreground/70">{totalTamu}</span> Tamu
                    {checkedIn > 0 && (
                      <span className="text-success">
                        · {checkedIn} hadir
                      </span>
                    )}
                  </div>
                </div>

                {/* Action — pinned to bottom so cards stay equal height */}
                <div className="mt-auto pt-4">
                  {canScan ? (
                    <button
                      onClick={() => router.push(`/panitia/scan?eventId=${event.id}`)}
                      className="w-full inline-flex items-center gap-2 px-3 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors shadow-sm shadow-accent/20 group-hover:shadow-accent/30 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 shrink-0" />
                      Scan QR
                      <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ) : (
                    <div className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-muted/5 text-muted-foreground/50 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {event.status === "akan_datang"
                        ? "Registrasi Belum Dibuka"
                        : "Registrasi Ditutup"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">Tidak ada acara ditemukan</p>
        </div>
      )}
    </div>
  );
}
