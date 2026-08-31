"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGuestsQuery } from "@/lib/queries/useGuestsQuery";
import { useState, useEffect, useRef } from "react";

export default function EventCard({ event, onEdit, onDelete, onStatusChange, preview = false }) {
  const router = useRouter();
  const { data: guests = [] } = useGuestsQuery();
  const totalTamu = guests.filter((g) => g.acara_id === event.id).length;
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRegistrasi = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (event.status !== "registrasi_dibuka") return;
    router.push(`/admin/scan-qr?eventId=${event.id}`);
  };

  const statusStyles = {
    registrasi_dibuka: {
      badge: "bg-success-muted text-success border border-success/20",
      dot: "bg-success",
      label: "Registrasi Dibuka",
    },
    akan_datang: {
      badge: "bg-warning-muted text-warning border border-warning/20",
      dot: "bg-warning",
      label: "Akan Datang",
    },
    registrasi_ditutup: {
      badge: "bg-danger-muted text-danger border border-danger/20",
      dot: "bg-danger",
      label: "Registrasi Ditutup",
    },
  };

  const statusList = [
    { value: "akan_datang", label: "Akan Datang" },
    { value: "registrasi_dibuka", label: "Registrasi Dibuka" },
    { value: "registrasi_ditutup", label: "Registrasi Ditutup" },
  ];

  const s = statusStyles[event.status] || statusStyles.akan_datang;
  const isRegistrasiDisabled = event.status !== "registrasi_dibuka";

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Link href={`/admin/events/${event.id}`} className="flex h-full">
      <div className={`group flex flex-col flex-1 rounded-xl bg-surface border transition-all duration-200 ${
        event.status === "registrasi_dibuka"
          ? "border-accent/25 hover:border-accent/40 hover:shadow-[var(--shadow-lifted)]"
          : "border-border hover:border-border-hover hover:shadow-[var(--shadow-lifted)]"
      }`}>
        {/* Top color bar */}
        <div className={`h-1 w-full rounded-t-[calc(0.75rem-1px)] ${
          event.status === "registrasi_dibuka" ? "bg-accent" : event.status === "akan_datang" ? "bg-warning" : "bg-border-hover"
        }`} />

        <div className="flex flex-col flex-1 p-5 space-y-3">
          {/* Header */}
          <div>
            <span className={`${s.badge} text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
              {s.label}
            </span>
            <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-150 mt-2">
              {event.nama_acara}
            </h3>
          </div>

          {/* Info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="truncate">{formatDate(event.tanggal_mulai)}{event.jam_mulai ? `, ${event.jam_mulai}` : ""}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{event.lokasi}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium text-foreground/80">{totalTamu}</span>
              <span>Tamu</span>
            </div>
          </div>

          {/* Footer actions */}
          {preview ? (
            <div className="mt-auto pt-3 border-t border-border">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent group-hover:text-accent-hover transition-colors">
                Lihat Detail
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          ) : (
            <div className="mt-auto pt-3 border-t border-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-0.5">
                {(onEdit || onDelete) && (
                  <>
                    {onEdit && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(event); }}
                        className="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent-muted transition-colors cursor-pointer"
                        title="Edit acara"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(event.id); }}
                        className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger-muted transition-colors cursor-pointer"
                        title="Hapus acara"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    {onStatusChange && (
                      <div className="relative" ref={statusRef}>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowStatusDropdown((v) => !v); }}
                          className="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent-muted transition-colors cursor-pointer"
                          title="Ubah Status"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        {showStatusDropdown && (
                          <div className="absolute left-0 top-full mt-1 z-50 w-44 bg-surface border border-border rounded-xl py-1 shadow-[var(--shadow-dialog)]">
                            {statusList.map((st) => (
                              <button
                                key={st.value}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onStatusChange(event, st.value);
                                  setShowStatusDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                                  event.status === st.value
                                    ? "text-accent bg-accent-muted"
                                    : "text-muted hover:text-foreground hover:bg-surface-variant"
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <span
                onClick={handleRegistrasi}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  isRegistrasiDisabled
                    ? "bg-surface-variant text-muted/50 cursor-not-allowed"
                    : "bg-accent text-white hover:bg-accent-hover cursor-pointer shadow-sm"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {isRegistrasiDisabled ? "Registrasi Belum Aktif" : "Registrasi Tamu"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
