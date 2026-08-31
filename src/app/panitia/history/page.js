"use client";

import { useState, useMemo } from "react";
import { useGuestsQuery } from "@/lib/queries/useGuestsQuery";
import { useEventsQuery } from "@/lib/queries/useEventsQuery";
import { formatTime as formatTimeWIB } from "@/lib/format-time";
import {
  Search,
  Users,
  User,
  Building2,
  Phone,
  CheckCircle,
  Clock,
  Filter,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const statusKehadiranMap = {
  hadir: { badge: "bg-success-light text-success border border-success/20", label: "Hadir" },
  terlambat: { badge: "bg-warning-light text-warning border border-warning/20", label: "Terlambat" },
  tidak_hadir: { badge: "bg-danger-light text-danger border border-danger/20", label: "Tidak Hadir" },
};

const kategoriMap = {
  reguler: { badge: "bg-info-muted text-info border border-info/20", label: "Reguler" },
  vip: { badge: "bg-warning-light text-warning border border-warning/20", label: "VIP" },
  vvip: { badge: "bg-danger-light text-danger border border-danger/20", label: "VVIP" },
};

const ITEMS_PER_PAGE = 15;

export default function HistoryPage() {
  const { data: guests = [] } = useGuestsQuery();
  const { data: events = [] } = useEventsQuery();
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [page, setPage] = useState(1);
  const [detailGuest, setDetailGuest] = useState(null);

  const getEventName = (acaraId) => {
    const event = events.find((e) => e.id === acaraId);
    return event ? event.nama_acara : "—";
  };

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch =
        (g.nama || "").toLowerCase().includes(search.toLowerCase()) ||
        (g.instansi || "").toLowerCase().includes(search.toLowerCase()) ||
        (g.nama_mahasiswa || "").toLowerCase().includes(search.toLowerCase()) ||
        (g.alamat || "").toLowerCase().includes(search.toLowerCase()) ||
        (g.no_hp || "").includes(search);
      const matchEvent = eventFilter === "all" || g.acara_id === parseInt(eventFilter);
      const matchStatus = statusFilter === "all" || g.status_kehadiran === statusFilter;
      const matchKategori = !kategoriFilter || g.kategori_tamu === kategoriFilter;
      return matchSearch && matchEvent && matchStatus && matchKategori;
    });
  }, [guests, search, eventFilter, statusFilter, kategoriFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const formatTime = (dateStr) => formatTimeWIB(dateStr);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama, instansi..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-10 rounded-lg bg-white border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all"
          />
        </div>
        <select
          value={eventFilter}
          onChange={(e) => { setEventFilter(e.target.value); setPage(1); }}
          className="w-full md:w-auto h-10 rounded-lg bg-white border border-border px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all cursor-pointer"
        >
          <option value="all">Semua Acara</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.nama_acara}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="w-full md:w-auto h-10 rounded-lg bg-white border border-border px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all cursor-pointer"
        >
          <option value="all">Semua Status</option>
          <option value="hadir">Hadir</option>
          <option value="terlambat">Terlambat</option>
          <option value="tidak_hadir">Tidak Hadir</option>
        </select>
        <select
          value={kategoriFilter}
          onChange={(e) => { setKategoriFilter(e.target.value); setPage(1); }}
          className="w-full md:w-auto h-10 rounded-lg bg-white border border-border px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all cursor-pointer"
        >
          <option value="">Semua Kategori</option>
          <option value="reguler">Reguler</option>
          <option value="vip">VIP</option>
          <option value="vvip">VVIP</option>
        </select>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Menampilkan <span className="font-medium text-foreground">{filtered.length}</span> tamu
        </p>
      </div>

      {/* Card Layout for Mobile */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {paginated.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground text-sm">
            <div className="flex flex-col items-center gap-3">
              <Users className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Belum ada data tamu</p>
            </div>
          </div>
        ) : (
          paginated.map((guest) => (
            <div key={guest.id} className="glass-card rounded-2xl p-4 flex flex-col gap-3 relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-accent-muted text-accent flex items-center justify-center text-xs font-semibold shrink-0">
                    {guest.nama.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{guest.nama}</p>
                    <p className="text-xs text-muted-foreground truncate">{guest.instansi || "—"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailGuest(guest)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors cursor-pointer shrink-0"
                  title="Detail"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-border/50 pt-3">
                {guest.nama_mahasiswa && guest.nama_mahasiswa !== "-" && (
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Nama Mahasiswa</span>
                    <span className="text-foreground font-medium block truncate">{guest.nama_mahasiswa}</span>
                  </div>
                )}
                {guest.alamat && (
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Alamat</span>
                    <span className="text-foreground font-medium block truncate" title={guest.alamat}>{guest.alamat}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block mb-0.5">Kategori</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
                      (kategoriMap[guest.kategori_tamu] || kategoriMap.reguler).badge
                    }`}
                  >
                    {(kategoriMap[guest.kategori_tamu] || kategoriMap.reguler).label}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Acara</span>
                  <span className="text-xs bg-accent-muted text-accent px-2 py-0.5 rounded-full font-medium inline-block truncate max-w-[120px]" title={getEventName(guest.acara_id)}>
                    {getEventName(guest.acara_id)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">No. HP</span>
                  <span className="text-foreground font-medium font-mono">{guest.no_hp || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Status Kehadiran</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
                      (statusKehadiranMap[guest.status_kehadiran] || statusKehadiranMap.tidak_hadir).badge
                    }`}
                  >
                    {(statusKehadiranMap[guest.status_kehadiran] || statusKehadiranMap.tidak_hadir).label}
                  </span>
                </div>
                <div className="col-span-2 border-t border-border/50 pt-2 flex items-center justify-between">
                  <span className="text-muted-foreground">Waktu Kehadiran</span>
                  {guest.status_kehadiran !== "tidak_hadir" && guest.waktu_kedatangan ? (
                    <span className="text-foreground font-medium">
                      {formatTime(guest.waktu_kedatangan)} ({formatDate(guest.waktu_kedatangan)})
                    </span>
                  ) : (
                    <span className="text-foreground font-medium">—</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table */}
      <div className="hidden md:block glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px]">
            <thead>
              <tr className="border-b border-border bg-card-hover/50">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5 whitespace-nowrap">Nama</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5 whitespace-nowrap">Instansi</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5 whitespace-nowrap">Nama Mahasiswa</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5 whitespace-nowrap">Alamat</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5 whitespace-nowrap">Kategori</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5 whitespace-nowrap">Acara</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5 whitespace-nowrap">No. HP</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5 whitespace-nowrap">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5 whitespace-nowrap">Jam Hadir</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5 whitespace-nowrap">Detail</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Belum ada data tamu</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((guest) => (
                  <tr key={guest.id} className="border-b border-border/50 table-row-hover">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-muted text-accent flex items-center justify-center text-xs font-semibold shrink-0">
                          {guest.nama.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{guest.nama}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground truncate max-w-[160px]">
                      {guest.instansi || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-foreground/80 block truncate max-w-[160px]" title={guest.nama_mahasiswa || "-"}>
                        {guest.nama_mahasiswa || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-muted-foreground block truncate max-w-[180px]" title={guest.alamat || "—"}>
                        {guest.alamat || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block whitespace-nowrap ${
                        (kategoriMap[guest.kategori_tamu] || kategoriMap.reguler).badge
                      }`}>
                        {(kategoriMap[guest.kategori_tamu] || kategoriMap.reguler).label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-accent-muted text-accent px-2.5 py-1 rounded-full font-medium inline-block truncate max-w-[180px]">
                        {getEventName(guest.acara_id)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground font-mono">
                      {guest.no_hp || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block whitespace-nowrap ${
                        (statusKehadiranMap[guest.status_kehadiran] || statusKehadiranMap.tidak_hadir).badge
                      }`}>
                        {(statusKehadiranMap[guest.status_kehadiran] || statusKehadiranMap.tidak_hadir).label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {guest.status_kehadiran !== "tidak_hadir" && guest.waktu_kedatangan ? (
                        <div>
                          <p className="text-sm font-medium text-foreground/80">{formatTime(guest.waktu_kedatangan)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(guest.waktu_kedatangan)}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setDetailGuest(guest)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-card-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    p === page
                      ? "bg-accent text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-card-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetailGuest(null)} />
          <div className="relative bg-surface rounded-2xl shadow-[var(--shadow-dialog)] animate-fade-in w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h3 className="text-sm font-semibold text-foreground">Detail Tamu</h3>
              <button onClick={() => setDetailGuest(null)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1 pr-1 pb-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                <div className="w-10 h-10 rounded-full bg-accent-muted text-accent flex items-center justify-center text-sm font-semibold shrink-0">
                  {detailGuest.nama.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{detailGuest.nama}</p>
                  <p className="text-xs text-muted-foreground">{detailGuest.instansi || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-card-hover">
                  <p className="text-xs text-muted-foreground mb-0.5">Nama Mahasiswa</p>
                  <p className="font-medium text-foreground">{detailGuest.nama_mahasiswa || "-"}</p>
                </div>
                <div className="p-3 rounded-lg bg-card-hover">
                  <p className="text-xs text-muted-foreground mb-0.5">Alamat</p>
                  <p className="font-medium text-foreground text-xs">{detailGuest.alamat || "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-card-hover">
                  <p className="text-xs text-muted-foreground mb-0.5">No. HP</p>
                  <p className="font-medium text-foreground">{detailGuest.no_hp || "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-card-hover">
                  <p className="text-xs text-muted-foreground mb-0.5">Kategori</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${
                    (kategoriMap[detailGuest.kategori_tamu] || kategoriMap.reguler).badge
                  }`}>
                    {(kategoriMap[detailGuest.kategori_tamu] || kategoriMap.reguler).label}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-card-hover">
                  <p className="text-xs text-muted-foreground mb-0.5">Acara</p>
                  <p className="font-medium text-foreground text-xs">{getEventName(detailGuest.acara_id)}</p>
                </div>
                <div className="p-3 rounded-lg bg-card-hover">
                  <p className="text-xs text-muted-foreground mb-0.5">Status Kehadiran</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${
                    (statusKehadiranMap[detailGuest.status_kehadiran] || statusKehadiranMap.tidak_hadir).badge
                  }`}>
                    {(statusKehadiranMap[detailGuest.status_kehadiran] || statusKehadiranMap.tidak_hadir).label}
                  </span>
                </div>
                {detailGuest.waktu_kedatangan && (
                  <div className="col-span-2 p-3 rounded-lg bg-card-hover">
                    <p className="text-xs text-muted-foreground mb-0.5">Waktu Kedatangan</p>
                    <p className="font-medium text-foreground">
                      {formatDate(detailGuest.waktu_kedatangan)}, {formatTime(detailGuest.waktu_kedatangan)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
