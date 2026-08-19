"use client";

import { useState } from "react";
import Button from "@/components/Button";
import { formatTime as formatTimeWIB } from "@/lib/format-time";

export default function ScanConfirm({ token, guest: initialGuest }) {
  const [guest, setGuest] = useState(initialGuest);
  const event = guest?.events;
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const res = await fetch(`/api/public/scan/${token}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setGuest((prev) => ({ ...prev, status_kehadiran: data.status, waktu_kedatangan: new Date().toISOString() }));
        setConfirmed(true);
      } else if (res.status === 409 || data.code === "already_registered") {
        setGuest((prev) => ({ ...prev, status_kehadiran: data.guest?.status_kehadiran || "hadir" }));
        setConfirmed(true);
      } else {
        setError(data.error || data.message || "Gagal mengkonfirmasi kehadiran");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setConfirming(false);
    }
  };

  const statusLabel = {
    hadir: "Tepat Waktu",
    terlambat: "Terlambat",
    tidak_hadir: "Tidak Hadir",
  };

  const statusColor = {
    hadir: "bg-success-muted text-success border-success/20",
    terlambat: "bg-warning-muted text-warning border-warning/20",
    tidak_hadir: "bg-danger-muted text-danger border-danger/20",
  };

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-success/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-success/5 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-success-muted mx-auto flex items-center justify-center mb-5 glow-success">
            <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Kehadiran Dikonfirmasi!</h1>
          <p className="text-muted text-sm mb-2">Selamat datang,</p>
          <p className="text-accent font-semibold text-lg mb-1">{guest.nama}</p>
          <p className="text-sm text-muted mb-6">{event?.nama_acara || "—"}</p>
          <div className="glass-card rounded-2xl p-5 text-left space-y-3 mb-6">
<div className="flex justify-between text-sm">
            <span className="text-muted">Instansi</span>
            <span className="text-foreground font-medium">{guest.instansi || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Nama Mahasiswa</span>
            <span className="text-foreground font-medium">{guest.nama_mahasiswa || "-"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Alamat</span>
            <span className="text-foreground font-medium">{guest.alamat || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Status</span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${statusColor[guest.status_kehadiran] || statusColor.hadir}`}>
              {statusLabel[guest.status_kehadiran] || "Hadir"}
            </span>
          </div>
            <div className="flex justify-between text-sm border-t border-border/50 pt-3">
              <span className="text-muted">Waktu Hadir</span>
              <span className="text-foreground font-medium">
                {guest.waktu_kedatangan
                  ? `${formatTimeWIB(guest.waktu_kedatangan)} WIB`
                  : "—"}
              </span>
            </div>
          </div>
          <Button variant="secondary" onClick={() => window.close()}>Tutup</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      <div className="relative text-center max-w-sm">
        <div className="w-20 h-20 rounded-2xl bg-accent mx-auto flex items-center justify-center shadow-lg shadow-accent/30 mb-5">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Konfirmasi Kehadiran</h1>
        <p className="text-sm text-muted mb-6">Scan QR Code berhasil. Konfirmasi kehadiran Anda di bawah ini.</p>

        <div className="glass-card rounded-2xl p-5 text-left space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Nama</span>
            <span className="text-foreground font-medium">{guest.nama}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Instansi</span>
            <span className="text-foreground font-medium">{guest.instansi || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Nama Mahasiswa</span>
            <span className="text-foreground font-medium">{guest.nama_mahasiswa || "-"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Alamat</span>
            <span className="text-foreground font-medium">{guest.alamat || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Acara</span>
            <span className="text-foreground font-medium">{event?.nama_acara || "—"}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-border/50 pt-3">
            <span className="text-muted">Status</span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${statusColor[guest.status_kehadiran] || "bg-warning-muted text-warning border-warning/20"}`}>
              {guest.status_kehadiran === "hadir" ? "Sudah Hadir" : guest.status_kehadiran === "terlambat" ? "Terlambat" : "Belum Hadir"}
            </span>
          </div>
        </div>

        <div className="min-h-[52px]" role="status" aria-live="polite">
          {error && (
            <div className="bg-danger-muted border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger mb-4">{error}</div>
          )}
        </div>

        {guest.status_kehadiran === "hadir" || guest.status_kehadiran === "terlambat" ? (
          <div className="flex items-center gap-2 justify-center text-success text-sm mb-4">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {guest.status_kehadiran === "terlambat" ? "Anda sudah tercatat" : "Anda sudah terdaftar hadir"}
          </div>
        ) : (
          <Button className="w-full" size="lg" onClick={handleConfirm} disabled={confirming}>
            {confirming ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Memproses...
              </span>
            ) : (
              <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Konfirmasi Kehadiran</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}