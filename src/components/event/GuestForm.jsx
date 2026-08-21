"use client";

import { useState } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";

export default function GuestForm({ event }) {
  const [form, setForm] = useState({
    nama: "",
    instansi: "",
    tujuan: "",
    no_hp: "",
    alamat: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!event) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/public/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: form.nama,
          instansi: form.instansi,
          tujuan: form.tujuan,
          no_hp: form.no_hp,
          alamat: form.alamat,
          acara_id: event.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmittedData({ ...form, status_kehadiran: data.status_kehadiran, already_registered: !!data.already_registered });
        setSubmitted(true);
      } else {
        const err = await res.json();
        setError(err.error || "Gagal mendaftarkan kehadiran");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    const statusLabel = {
      hadir: "Hadir (Tepat Waktu)",
      terlambat: "Terlambat",
      tidak_hadir: "Tidak Terdaftar",
    };
    const statusColor = {
      hadir: "text-success bg-success-muted border-success/20",
      terlambat: "text-warning bg-warning-muted border-warning/20",
      tidak_hadir: "text-danger bg-danger-muted border-danger/20",
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-success/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-success/5 rounded-full blur-3xl" />
        </div>

        <div className="relative text-center max-w-md mx-4">
          <div className="w-20 h-20 rounded-2xl bg-success-muted mx-auto flex items-center justify-center mb-5 glow-success">
            <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Terima Kasih!</h1>
          <p className="text-muted text-sm mb-2">
            {submittedData.already_registered
              ? "Anda sudah terdaftar sebelumnya. Data berikut sudah tercatat untuk acara:"
              : "Data kehadiran Anda telah berhasil tercatat untuk acara:"}
          </p>
          <p className="text-accent font-semibold text-lg mb-6">{event.nama_acara}</p>

          <div className="glass-card rounded-2xl p-5 text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Nama</span>
              <span className="text-foreground font-medium">{submittedData.nama}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Instansi</span>
              <span className="text-foreground font-medium">{submittedData.instansi || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Tujuan</span>
              <span className="text-foreground font-medium">{submittedData.tujuan}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Alamat</span>
              <span className="text-foreground font-medium">{submittedData.alamat}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border/50 pt-3">
              <span className="text-muted">Status</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${statusColor[submittedData.status_kehadiran] || statusColor.hadir}`}>
                {statusLabel[submittedData.status_kehadiran] || "Hadir"}
              </span>
            </div>
          </div>

          <Button variant="secondary" onClick={() => { setSubmitted(false); setForm({ nama: "", instansi: "", tujuan: "", no_hp: "", alamat: "" }); setSubmittedData(null); }}>
            Daftar Tamu Lain
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg mx-4">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent mx-auto flex items-center justify-center shadow-lg shadow-accent/30 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground">Tamuin</h1>
          <p className="text-sm text-muted mt-1">Silakan isi data kehadiran Anda</p>
        </div>

        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-muted text-accent flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground">{event.nama_acara}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                <span className="text-xs text-muted flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.lokasi}
                </span>
                <span className="text-xs text-muted flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(event.tanggal_mulai)}
                </span>
                <span className="text-xs text-muted flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {event.jam_mulai}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 glow-accent">
          <div className="min-h-[52px]" role="status" aria-live="polite">
            {error && (
              <div className="bg-danger-muted border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger mb-4">{error}</div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input id="guest-name" label="Nama Lengkap (Opsional)" placeholder="Opsional - Masukkan nama lengkap Anda" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            } />
            <Input id="guest-instansi" label="Instansi / Lembaga" placeholder="Opsional - Contoh: Universitas Airlangga" value={form.instansi} onChange={(e) => setForm({ ...form, instansi: e.target.value })} icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            } />
            <Input id="guest-tujuan" label="Tujuan Kunjungan" placeholder="Contoh: Menghadiri Seminar" value={form.tujuan} onChange={(e) => setForm({ ...form, tujuan: e.target.value })} required icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            } />
            <Input id="guest-phone" label="Nomor HP" type="tel" placeholder="Opsional" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            } />
            <Input id="guest-alamat" label="Alamat" placeholder="Masukkan alamat Anda" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} required icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            } />
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Mengirim...
                </span>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Kirim Data Kehadiran</>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted/50 mt-6">Tamuin — Powered by Next.js</p>
      </div>
    </div>
  );
}