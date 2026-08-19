"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Input from "./Input";
import Button from "./Button";
import { QRCodeCanvas } from "qrcode.react";
import { formatTime as formatTimeWIB } from "@/lib/format-time";

const kategoriMap = {
  reguler: { badge: "bg-info-muted text-info border border-info/20", label: "Reguler" },
  vip: { badge: "bg-warning-muted text-warning border border-warning/20", label: "VIP" },
  vvip: { badge: "bg-danger-muted text-danger border border-danger/20", label: "VVIP" },
};

const statusKehadiranMap = {
  hadir: { badge: "bg-success-muted text-success border border-success/20", label: "Hadir" },
  terlambat: { badge: "bg-warning-muted text-warning border border-warning/20", label: "Terlambat" },
  tidak_hadir: { badge: "bg-danger-muted text-danger border border-danger/20", label: "Tidak Hadir" },
};

export default function GuestTable({ guests, showEvent = false, events = [], onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [qrGuest, setQrGuest] = useState(null);
  const [detailGuest, setDetailGuest] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const triggerRefs = useRef({});
  const qrCanvasRef = useRef(null);

  useEffect(() => {
    if (!openMenuId) return;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        const trigger = triggerRefs.current[openMenuId];
        if (trigger && !trigger.contains(e.target)) {
          setOpenMenuId(null);
        }
      }
    };
    const onScroll = () => setOpenMenuId(null);
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [openMenuId]);

  const toggleMenu = (guestId, e) => {
    if (openMenuId === guestId) {
      setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 192;
    const menuHeight = 220;

    let top = rect.bottom + 4;
    let left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8);

    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 4;
    }

    if (left < 8) left = 8;
    if (top < 8) top = 8;

    setMenuPos({ top, left });
    triggerRefs.current[guestId] = e.currentTarget;
    setOpenMenuId(guestId);
  };

  const getEventName = (acara_id) => {
    const event = events.find((e) => e.id === acara_id);
    return event ? event.nama_acara : "—";
  };

  const filtered = guests.filter((g) => {
    const matchSearch =
      (g.nama || "").toLowerCase().includes(search.toLowerCase()) ||
      (g.instansi || "").toLowerCase().includes(search.toLowerCase()) ||
      (g.nama_mahasiswa || "").toLowerCase().includes(search.toLowerCase()) ||
      (g.alamat || "").toLowerCase().includes(search.toLowerCase()) ||
      (g.no_hp || "").includes(search);
    const matchKategori = !kategoriFilter || g.kategori_tamu === kategoriFilter;
    return matchSearch && matchKategori;
  });

  const formatTime = (dateStr) => formatTimeWIB(dateStr);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const hasActions = !!(onEdit || onDelete);
  const cols = (showEvent ? 9 : 8) + (hasActions ? 1 : 0);

  const handleSendQR = async (guest) => {
    if (!guest.email) {
      setEmailStatus({ type: "error", message: `Tamu "${guest.nama}" tidak memiliki alamat email` });
      setTimeout(() => setEmailStatus(null), 4000);
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch("/api/send-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_ids: [guest.id], acara_id: guest.acara_id }),
      });
      const data = await res.json();
      if (res.ok && data.results?.[0]?.status === "sent") {
        setEmailStatus({ type: "success", message: `QR Code terkirim ke ${guest.email}` });
      } else {
        setEmailStatus({ type: "error", message: data.results?.[0]?.error || "Gagal mengirim email" });
      }
    } catch {
      setEmailStatus({ type: "error", message: "Gagal terhubung ke server" });
    } finally {
      setSendingEmail(false);
      setTimeout(() => setEmailStatus(null), 4000);
    }
  };

  const getQrUrl = (token) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/scan/${token}`;
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Cari nama, instansi, atau no. HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
            />
          </div>
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="w-full sm:w-44 h-10 rounded-[10px] bg-surface border border-input-border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-input-focus transition-all duration-200"
          >
            <option value="">Semua Kategori</option>
            <option value="reguler">Reguler</option>
            <option value="vip">VIP</option>
            <option value="vvip">VVIP</option>
          </select>
        </div>
        <p className="text-sm text-muted whitespace-nowrap">
          Menampilkan{" "}
          <span className="text-foreground font-medium">{filtered.length}</span>{" "}
          dari {guests.length} tamu
        </p>
      </div>

      {/* Card Layout for Mobile & Tablet Portrait */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-muted text-sm">
            <div className="flex flex-col items-center gap-3">
              <svg
                className="w-14 h-14 text-muted/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-foreground/60 font-medium">Belum ada data tamu.</p>
            </div>
          </div>
        ) : (
          filtered.map((guest) => (
            <div key={guest.id} className="glass-card rounded-2xl p-4 flex flex-col gap-3 relative border border-border/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-accent-muted text-accent flex items-center justify-center text-xs font-bold shrink-0">
                    {guest.nama
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate" title={guest.nama}>
                      {guest.nama}
                    </p>
                    <p className="text-xs text-muted truncate" title={guest.instansi}>
                      {guest.instansi || "—"}
                    </p>
                  </div>
                </div>
                {hasActions && (
                  <button
                    onClick={(e) => toggleMenu(guest.id, e)}
                    className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-input/50 transition-all cursor-pointer shrink-0"
                    title="Aksi"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-border/30 pt-3">
                {guest.nama_mahasiswa && guest.nama_mahasiswa !== "-" && (
                  <div>
                    <span className="text-muted block mb-0.5">Nama Mahasiswa</span>
                    <span className="text-foreground font-medium block truncate">{guest.nama_mahasiswa}</span>
                  </div>
                )}
                {guest.alamat && (
                  <div>
                    <span className="text-muted block mb-0.5">Alamat</span>
                    <span className="text-foreground font-medium block truncate" title={guest.alamat}>{guest.alamat}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted block mb-0.5">Kategori</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
                      (kategoriMap[guest.kategori_tamu] || kategoriMap.reguler).badge
                    }`}
                  >
                    {(kategoriMap[guest.kategori_tamu] || kategoriMap.reguler).label}
                  </span>
                </div>
                {showEvent && (
                  <div>
                    <span className="text-muted block mb-0.5">Acara</span>
                    <span className="text-xs bg-accent-muted text-accent px-2 py-0.5 rounded-full font-medium inline-block truncate max-w-[120px]" title={getEventName(guest.acara_id)}>
                      {getEventName(guest.acara_id)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-muted block mb-0.5">No. HP</span>
                  <span className="text-foreground font-medium font-mono">{guest.no_hp || "—"}</span>
                </div>
                <div>
                  <span className="text-muted block mb-0.5">Status Kehadiran</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
                      (statusKehadiranMap[guest.status_kehadiran] || statusKehadiranMap.hadir).badge
                    }`}
                  >
                    {(statusKehadiranMap[guest.status_kehadiran] || statusKehadiranMap.hadir).label}
                  </span>
                </div>
                <div className="col-span-2 border-t border-border/30 pt-2 flex items-center justify-between">
                  <span className="text-muted">Waktu Kehadiran</span>
                  {guest.status_kehadiran === "tidak_hadir" ? (
                    <span className="text-foreground/80 font-medium">—</span>
                  ) : guest.waktu_kedatangan ? (
                    <span className="text-foreground/80 font-medium">
                      {formatTime(guest.waktu_kedatangan)} ({formatDate(guest.waktu_kedatangan)})
                    </span>
                  ) : (
                    <span className="text-foreground/80 font-medium">—</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table (desktop & tablet landscape) */}
      <div className="hidden lg:block glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-variant/60">
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                  Nama
                </th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                  Instansi
                </th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                  Nama Mahasiswa
                </th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                  Alamat
                </th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                  Kategori
                </th>
                {showEvent && (
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                    Acara
                  </th>
                )}
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                  No. HP
                </th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                  Status Kehadiran
                </th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                  Jam Hadir
                </th>
                {hasActions && (
                  <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={cols}
                    className="text-center py-16 text-muted text-sm"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <svg
                        className="w-14 h-14 text-muted/30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <p className="text-foreground/60 font-medium">Belum ada data tamu.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((guest) => (
                  <tr
                    key={guest.id}
                    className="border-b border-border/50 table-row-hover"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 max-w-full">
                        <div className="w-8 h-8 rounded-full bg-accent-muted text-accent flex items-center justify-center text-xs font-bold shrink-0">
                          {guest.nama
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span
                          className="text-sm font-medium text-foreground truncate max-w-[200px] lg:max-w-[280px]"
                          title={guest.nama}
                        >
                          {guest.nama}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-sm text-muted block truncate max-w-[160px] lg:max-w-[220px]"
                        title={guest.instansi}
                      >
                        {guest.instansi || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-sm text-foreground/80 block truncate max-w-[160px]"
                        title={guest.nama_mahasiswa || "-"}
                      >
                        {guest.nama_mahasiswa || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-sm text-muted block truncate max-w-[180px]"
                        title={guest.alamat || "—"}
                      >
                        {guest.alamat || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block whitespace-nowrap ${
                          (kategoriMap[guest.kategori_tamu] || kategoriMap.reguler).badge
                        }`}
                      >
                        {(kategoriMap[guest.kategori_tamu] || kategoriMap.reguler).label}
                      </span>
                    </td>
                    {showEvent && (
                      <td className="px-5 py-3.5">
                        <span className="text-xs bg-accent-muted text-accent px-2.5 py-1 rounded-full font-medium inline-block truncate max-w-[180px]" title={getEventName(guest.acara_id)}>
                          {getEventName(guest.acara_id)}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-3.5 text-sm text-muted font-mono">
                      {guest.no_hp || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block whitespace-nowrap ${
                          (statusKehadiranMap[guest.status_kehadiran] || statusKehadiranMap.hadir).badge
                        }`}
                      >
                        {(statusKehadiranMap[guest.status_kehadiran] || statusKehadiranMap.hadir).label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {guest.status_kehadiran === "tidak_hadir" ? (
                        <span className="text-sm text-muted">—</span>
                      ) : guest.waktu_kedatangan ? (
                        <div className="text-sm whitespace-nowrap">
                          <p className="text-foreground/80 font-medium">
                            {formatTime(guest.waktu_kedatangan)}
                          </p>
                          <p className="text-xs text-muted">
                            {formatDate(guest.waktu_kedatangan)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted">—</span>
                      )}
                    </td>
                    {hasActions && (
                      <td className="pl-5 pr-6 py-3 text-right">
                        <button
                          onClick={(e) => toggleMenu(guest.id, e)}
                          className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-input/50 transition-all cursor-pointer"
                          title="Aksi"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions Dropdown Menu */}
      {openMenuId && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 60 }}
          className="w-48 glass-card rounded-xl py-1.5 shadow-[var(--shadow-dialog)] border border-outline-variant"
        >
          <button
            onClick={() => {
              const g = guests.find((g) => g.id === openMenuId);
              if (g) setDetailGuest(g);
              setOpenMenuId(null);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground hover:bg-input/50 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Detail Tamu
          </button>
          {onEdit && (
            <button
              onClick={() => {
                const g = guests.find((g) => g.id === openMenuId);
                if (g) onEdit(g);
                setOpenMenuId(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground hover:bg-input/50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Data
            </button>
          )}
          <button
            onClick={() => {
              const g = guests.find((g) => g.id === openMenuId);
              if (g) setQrGuest(g);
              setOpenMenuId(null);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground hover:bg-input/50 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Lihat QR Code
          </button>
          <button
            onClick={() => {
              const g = guests.find((g) => g.id === openMenuId);
              if (g) handleSendQR(g);
              setOpenMenuId(null);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground hover:bg-input/50 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Kirim QR via Email
          </button>
          <div className="border-t border-border my-1.5 mx-3" />
          {onDelete && (
            <button
              onClick={() => {
                onDelete(openMenuId);
                setOpenMenuId(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-danger hover:bg-danger/10 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus Data
            </button>
          )}
        </div>,
        document.body
      )}

      {/* Detail Guest Modal */}
      {detailGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailGuest(null)}></div>
          <div className="relative glass-card rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4 glow-accent max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-lg font-bold text-foreground">Detail Tamu</h3>
              <button onClick={() => setDetailGuest(null)} className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                <div className="w-12 h-12 rounded-full bg-accent-muted text-accent flex items-center justify-center text-lg font-bold shrink-0">
                  {detailGuest.nama.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{detailGuest.nama}</p>
                  <p className="text-sm text-muted">{detailGuest.instansi || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted text-xs mb-0.5">No. HP</p>
                  <p className="text-foreground font-medium">{detailGuest.no_hp || "—"}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-0.5">Kategori</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${
                    (kategoriMap[detailGuest.kategori_tamu] || kategoriMap.reguler).badge
                  }`}>
                    {(kategoriMap[detailGuest.kategori_tamu] || kategoriMap.reguler).label}
                  </span>
                </div>
                <div>
                  <p className="text-muted text-xs mb-0.5">Nama Mahasiswa</p>
                  <p className="text-foreground font-medium">{detailGuest.nama_mahasiswa || "-"}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-0.5">Alamat</p>
                  <p className="text-foreground font-medium">{detailGuest.alamat || "—"}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-0.5">Acara</p>
                  <p className="text-foreground font-medium">{getEventName(detailGuest.acara_id)}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-0.5">Status Kehadiran</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${
                    (statusKehadiranMap[detailGuest.status_kehadiran] || statusKehadiranMap.hadir).badge
                  }`}>
                    {(statusKehadiranMap[detailGuest.status_kehadiran] || statusKehadiranMap.hadir).label}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4 shrink-0 border-t border-border/20">
              <Button type="button" onClick={() => setDetailGuest(null)}>Tutup</Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Status Toast */}
      {emailStatus && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[60] flex justify-end animate-in">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg bg-white ${
            emailStatus.type === "success" ? "border-success/20" : "border-danger/20"
          }`}>
            <svg className={`w-5 h-5 ${emailStatus.type === "success" ? "text-success" : "text-danger"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {emailStatus.type === "success" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <p className="text-sm font-medium text-foreground">{emailStatus.message}</p>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setQrGuest(null)}></div>
          <div className="relative glass-card rounded-2xl p-6 sm:p-8 w-full max-w-sm mx-4 glow-accent text-center max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-lg font-bold text-foreground">QR Code Tamu</h3>
              <button onClick={() => setQrGuest(null)} className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 py-2 space-y-2 pr-1">
              <p className="text-sm font-medium text-foreground mb-1">{qrGuest.nama}</p>
              <p className="text-xs text-muted mb-4">{getEventName(qrGuest.acara_id)}</p>
              <div className="bg-white rounded-xl p-3 inline-block mx-auto">
                <QRCodeCanvas
                  ref={qrCanvasRef}
                  value={getQrUrl(qrGuest.qr_token)}
                  size={192}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                  marginSize={2}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4 shrink-0 border-t border-border/20">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  const canvas = qrCanvasRef.current;
                  if (!canvas) return;
                  const fileName = `qr-${qrGuest.nama}-${getEventName(qrGuest.acara_id)}.png`.replace(/[\s/\\]+/g, "-").replace(/[^a-zA-Z0-9\-]/g, "");
                  const out = document.createElement("canvas");
                  out.width = 500;
                  out.height = 500;
                  out.getContext("2d").imageSmoothingEnabled = false;
                  out.getContext("2d").drawImage(canvas, 0, 0, 500, 500);
                  out.toBlob((blob) => {
                    if (!blob) return;
                    const objectUrl = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = objectUrl;
                    a.download = fileName;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
                  });
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </Button>
              <Button type="button" className="flex-1" onClick={() => setQrGuest(null)}>Tutup</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
