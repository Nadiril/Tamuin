"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import AttendanceChart from "@/components/charts/AttendanceChart";
import { useGuestsQuery } from "@/lib/queries/useGuestsQuery";
import { useEventsQuery } from "@/lib/queries/useEventsQuery";
import { useLogActivity } from "@/lib/queries/useActivitiesQuery";
import { FileDown, FileSpreadsheet, Users, CheckCircle, XCircle, AlertTriangle, TrendingUp } from "lucide-react";

const statusLabel = {
  hadir: "Hadir",
  terlambat: "Terlambat",
  tidak_hadir: "Tidak Hadir",
};

export default function LaporanPage() {
  const [eventFilter, setEventFilter] = useState("");
  const { data: guests = [] } = useGuestsQuery(eventFilter ? { acara_id: eventFilter } : {});
  const { data: events = [] } = useEventsQuery();
  const { mutateAsync: logActivity } = useLogActivity();

  const getEventName = (acara_id) => {
    const event = events.find((e) => e.id === acara_id);
    return event ? event.nama_acara : "—";
  };

  const filteredGuests = guests;

  const total = filteredGuests.length;
  const hadir = filteredGuests.filter((g) => g.status_kehadiran === "hadir").length;
  const terlambat = filteredGuests.filter((g) => g.status_kehadiran === "terlambat").length;
  const belumHadir = filteredGuests.filter((g) => g.status_kehadiran === "tidak_hadir").length;
  const persentase = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 0;

  const statCards = [
    {
      title: "Total Tamu",
      value: total,
      icon: Users,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Sudah Hadir",
      value: hadir,
      icon: CheckCircle,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Terlambat",
      value: terlambat,
      icon: AlertTriangle,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Tidak Hadir",
      value: belumHadir,
      icon: XCircle,
      color: "text-danger",
      bg: "bg-danger/10",
    },
    {
      title: "Kehadiran",
      value: `${persentase}%`,
      icon: TrendingUp,
      color: "text-info",
      bg: "bg-info/10",
    },
  ];

  const exportData = filteredGuests.map((g) => ({
    Nama: g.nama,
    Instansi: g.instansi,
    "Nama Mahasiswa": g.nama_mahasiswa || "-",
    Alamat: g.alamat || "-",
    "No. HP": g.no_hp || "-",
    Kategori: (g.kategori_tamu || "reguler").charAt(0).toUpperCase() + (g.kategori_tamu || "reguler").slice(1),
    "Status Kehadiran": statusLabel[g.status_kehadiran] || g.status_kehadiran,
    Acara: getEventName(g.acara_id),
  }));

  const handleExportCSV = () => {
    if (exportData.length === 0) return;
    logActivity({ action: "export_laporan", detail: "Mengexport laporan CSV" + (eventFilter ? ` (filter acara)` : " (semua acara)") });
    const headers = Object.keys(exportData[0]);
    const csvRows = [
      headers.join(","),
      ...exportData.map((row) =>
        headers.map((h) => `"${(row[h] || "").replace(/"/g, '""')}"`).join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-tamu${eventFilter ? `-${getEventName(parseInt(eventFilter)).replace(/\s+/g, "-")}` : ""}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    if (exportData.length === 0) return;
    logActivity({ action: "export_laporan", detail: "Mengexport laporan Excel" + (eventFilter ? ` (filter acara)` : " (semua acara)") });
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Tamu");
    XLSX.writeFile(wb, `laporan-tamu${eventFilter ? `-${getEventName(parseInt(eventFilter)).replace(/\s+/g, "-")}` : ""}-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const chartData = [
    { name: "Hadir", value: hadir, fill: "#22c55e" },
    { name: "Terlambat", value: terlambat, fill: "#f59e0b" },
    { name: "Tidak Hadir", value: belumHadir, fill: "#ef4444" },
  ];

  return (
    <>
      <Navbar
        title="Laporan"
        subtitle="Lihat dan unduh laporan data tamu berdasarkan acara"
      />

      <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Filter & Export */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full h-10 rounded-[10px] bg-surface border border-input-border pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-input-focus transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">Semua Acara</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.nama_acara}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="secondary" className="flex-1 sm:flex-none" onClick={handleExportCSV} disabled={total === 0}>
              <FileDown className="w-4 h-4" />
              Export CSV
            </Button>
            <Button variant="success" className="flex-1 sm:flex-none" onClick={handleExportExcel} disabled={total === 0}>
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="glass-card rounded-2xl p-4 sm:p-5 hover:border-border-hover transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-sm text-muted font-medium">{card.title}</span>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} />
                </div>
              </div>
              <p className={`text-xl sm:text-2xl font-bold text-foreground ${total === 0 ? "text-muted/40" : ""}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Grafik Kehadiran */}
        <div className="glass-card rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-muted" />
            <h3 className="text-sm sm:text-base font-bold text-foreground">Grafik Kehadiran</h3>
          </div>
          {total === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
              <svg className="w-24 h-24 sm:w-32 sm:h-32 text-muted/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm font-semibold text-muted">Belum Ada Data</p>
              <p className="text-xs text-muted/60 mt-1 max-w-xs">
                Grafik kehadiran akan tampil setelah terdapat tamu yang terdaftar
              </p>
            </div>
          ) : (
            <AttendanceChart data={chartData} />
          )}
        </div>

        {/* Rekapitulasi Tamu */}
        <div className="glass-card rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-muted" />
            <h3 className="text-sm sm:text-base font-bold text-foreground">Rekapitulasi Tamu</h3>
            {eventFilter && (
              <span className="text-xs bg-accent-muted text-accent px-2 py-0.5 rounded-full font-medium ml-auto">
                {getEventName(parseInt(eventFilter))}
              </span>
            )}
          </div>
          {filteredGuests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 text-muted/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-semibold text-muted">Belum Ada Data Tamu</p>
              <p className="text-xs text-muted/60 mt-1 max-w-xs">
                Data tamu akan muncul setelah filter acara dipilih dan terdapat tamu yang terdaftar
              </p>
            </div>
          ) : (
            <>
              {/* Card Layout for Mobile */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredGuests.map((guest) => (
                  <div key={guest.id} className="glass-card rounded-2xl p-4 flex flex-col gap-2 border border-border/50">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-foreground truncate">{guest.nama}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
                        guest.kategori_tamu === "vip" ? "bg-warning-muted text-warning border border-warning/20" :
                        guest.kategori_tamu === "vvip" ? "bg-danger-muted text-danger border border-danger/20" :
                        "bg-info-muted text-info border border-info/20"
                      }`}>
                        {guest.kategori_tamu === "vvip" ? "VVIP" : guest.kategori_tamu === "vip" ? "VIP" : "Reguler"}
                      </span>
                    </div>
                    
                    <div className="text-xs text-muted">
                      <span className="font-medium text-foreground/80">Instansi: </span>{guest.instansi || "—"}
                    </div>
                    {guest.nama_mahasiswa && guest.nama_mahasiswa !== "-" && (
                      <div className="text-xs text-muted">
                        <span className="font-medium text-foreground/80">Mahasiswa: </span>{guest.nama_mahasiswa}
                      </div>
                    )}
                    {guest.alamat && (
                      <div className="text-xs text-muted">
                        <span className="font-medium text-foreground/80">Alamat: </span>{guest.alamat}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-border/30 pt-2 mt-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
                        guest.status_kehadiran === "terlambat" ? "bg-warning-muted text-warning border border-warning/20" :
                        guest.status_kehadiran === "tidak_hadir" ? "bg-danger-muted text-danger border border-danger/20" :
                        "bg-success-muted text-success border border-success/20"
                      }`}>
                        {statusLabel[guest.status_kehadiran]}
                      </span>
                      {!eventFilter && (
                        <span className="text-xs bg-accent-muted text-accent px-2 py-0.5 rounded-full font-medium truncate max-w-[150px]">
                          {getEventName(guest.acara_id)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Table Layout for Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-4 py-3">Nama</th>
                      <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-4 py-3">Instansi</th>
                      <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-4 py-3">Nama Mahasiswa</th>
                      <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-4 py-3">Alamat</th>
                      <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-4 py-3">Kategori</th>
                      <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-4 py-3 whitespace-nowrap">Status</th>
                      {!eventFilter && (
                        <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-4 py-3 whitespace-nowrap">Acara</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGuests.map((guest) => (
                      <tr key={guest.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 font-medium text-foreground">{guest.nama}</td>
                        <td className="px-4 py-3 text-muted">{guest.instansi || "—"}</td>
                        <td className="px-4 py-3 text-muted">{guest.nama_mahasiswa || "-"}</td>
                        <td className="px-4 py-3 text-muted">{guest.alamat || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            guest.kategori_tamu === "vip" ? "bg-warning-muted text-warning border border-warning/20" :
                            guest.kategori_tamu === "vvip" ? "bg-danger-muted text-danger border border-danger/20" :
                            "bg-info-muted text-info border border-info/20"
                          }`}>
                            {guest.kategori_tamu === "vvip" ? "VVIP" : guest.kategori_tamu === "vip" ? "VIP" : "Reguler"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            guest.status_kehadiran === "terlambat" ? "bg-warning-muted text-warning border border-warning/20" :
                            guest.status_kehadiran === "tidak_hadir" ? "bg-danger-muted text-danger border border-danger/20" :
                            "bg-success-muted text-success border border-success/20"
                          }`}>
                            {statusLabel[guest.status_kehadiran]}
                          </span>
                        </td>
                        {!eventFilter && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs bg-accent-muted text-accent px-2.5 py-1 rounded-full font-medium">
                              {getEventName(guest.acara_id)}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
