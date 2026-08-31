"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo } from "react";
import { useEventsQuery } from "@/lib/queries/useEventsQuery";
import { useGuestsQuery, useGuestMutations } from "@/lib/queries/useGuestsQuery";
import {
  User,
  Building2,
  Phone,
  Tag,
  CalendarRange,
  MapPin,
  Users,
  CheckCircle,
  Loader2,
  ArrowLeft,
  UserPlus,
} from "lucide-react";

const kategoriOptions = [
  { value: "reguler", label: "Reguler" },
  { value: "vip", label: "VIP" },
  { value: "vvip", label: "VVIP" },
];

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedEventId = searchParams.get("eventId");
  const { data: events = [] } = useEventsQuery();
  const { data: guests = [] } = useGuestsQuery();
  const { addGuest, addMutation } = useGuestMutations();

  const [eventId, setEventId] = useState(selectedEventId || "");
  const [form, setForm] = useState({
    nama: "",
    instansi: "",
    no_hp: "",
    nama_mahasiswa: "",
    alamat: "",
    kategori_tamu: "reguler",
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const selectedEvent = events.find((e) => e.id === parseInt(eventId));

  const recentRegistrations = useMemo(() => {
    if (!eventId) return [];
    return guests
      .filter((g) => g.acara_id === parseInt(eventId))
      .slice(0, 5);
  }, [guests, eventId]);

  const isVip = form.kategori_tamu !== "reguler";

  const validate = () => {
    const errs = {};
    if (!form.nama.trim()) errs.nama = "Nama wajib diisi";
    if (!isVip && !form.nama_mahasiswa.trim()) errs.nama_mahasiswa = "Nama mahasiswa wajib diisi untuk tamu reguler";
    if (!form.alamat.trim()) errs.alamat = "Alamat wajib diisi";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!eventId) {
      setToast({ id: Date.now(), message: "Silakan pilih acara terlebih dahulu", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const result = await addGuest({
        acara_id: parseInt(eventId),
        nama: form.nama.trim(),
        instansi: form.instansi.trim(),
        no_hp: form.no_hp.trim() || null,
        nama_mahasiswa: isVip ? "-" : form.nama_mahasiswa.trim(),
        alamat: form.alamat.trim(),
        kategori_tamu: form.kategori_tamu,
      }, crypto.randomUUID());
      if (result) {
        setToast({ id: Date.now(), message: "Tamu berhasil diregistrasi!", type: "success" });
        setForm({ nama: "", instansi: "", no_hp: "", nama_mahasiswa: "", alamat: "", kategori_tamu: "reguler" });
      } else {
        setToast({ id: Date.now(), message: "Gagal meregistrasi tamu", type: "error" });
      }
    } catch (err) {
      setToast({ id: Date.now(), message: err?.message || "Terjadi kesalahan server", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-3 space-y-4">
          {/* Event Selector */}
          <div className="glass-card rounded-2xl p-5">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Pilih Acara <span className="text-danger">*</span>
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full h-10 rounded-lg bg-white border border-border px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all"
            >
              <option value="">-- Pilih Acara --</option>
              {events
                .filter((e) => e.status === "registrasi_dibuka")
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nama_acara}
                  </option>
                ))}
            </select>
            {!eventId && (
              <p className="text-xs text-muted-foreground mt-2">
                Pilih acara dengan status <span className="text-success font-medium">Registrasi Dibuka</span>
              </p>
            )}
          </div>

          {/* Guest Form */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Data Tamu</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nama" className="text-sm font-medium text-foreground mb-1.5 block">
                    Nama Lengkap <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="nama"
                      type="text"
                      placeholder="Masukkan nama tamu"
                      value={form.nama}
                      onChange={(e) => updateField("nama", e.target.value)}
                      className={`w-full h-10 rounded-lg bg-white border pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all ${errors.nama ? "border-danger" : "border-border"
                        }`}
                    />
                  </div>
                  {errors.nama && <p className="text-xs text-danger mt-1">{errors.nama}</p>}
                </div>

                <div>
                  <label htmlFor="instansi" className="text-sm font-medium text-foreground mb-1.5 block">
                    Instansi <span className="text-xs text-muted-foreground">(Opsional)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="instansi"
                      type="text"
                      placeholder="Masukkan instansi"
                      value={form.instansi}
                      onChange={(e) => updateField("instansi", e.target.value)}
                      className={`w-full h-10 rounded-lg bg-white border pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all ${errors.instansi ? "border-danger" : "border-border"
                        }`}
                    />
                  </div>
                  {errors.instansi && <p className="text-xs text-danger mt-1">{errors.instansi}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nama_mahasiswa" className="text-sm font-medium text-foreground mb-1.5 block">
                    Nama Mahasiswa {isVip ? "" : <span className="text-danger">*</span>}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="nama_mahasiswa"
                      type="text"
                      placeholder={isVip ? "-" : "Masukkan nama mahasiswa"}
                      value={isVip ? "-" : form.nama_mahasiswa}
                      onChange={(e) => updateField("nama_mahasiswa", e.target.value)}
                      disabled={isVip}
                      className={`w-full h-10 rounded-lg bg-white border pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all disabled:bg-muted/10 disabled:text-muted-foreground ${errors.nama_mahasiswa ? "border-danger" : "border-border"
                        }`}
                    />
                  </div>
                  {errors.nama_mahasiswa && <p className="text-xs text-danger mt-1">{errors.nama_mahasiswa}</p>}
                  {isVip && (
                    <p className="text-xs text-muted-foreground mt-1">Otomatis &quot;-&quot; untuk tamu VIP/VVIP</p>
                  )}
                </div>

                <div>
                  <label htmlFor="alamat" className="text-sm font-medium text-foreground mb-1.5 block">
                    Alamat Tamu <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="alamat"
                      type="text"
                      placeholder="Masukkan alamat tamu"
                      value={form.alamat}
                      onChange={(e) => updateField("alamat", e.target.value)}
                      className={`w-full h-10 rounded-lg bg-white border pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all ${errors.alamat ? "border-danger" : "border-border"
                        }`}
                    />
                  </div>
                  {errors.alamat && <p className="text-xs text-danger mt-1">{errors.alamat}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="no_hp" className="text-sm font-medium text-foreground mb-1.5 block">
                  No. HP
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="no_hp"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={form.no_hp}
                    onChange={(e) => updateField("no_hp", e.target.value)}
                    className="w-full h-10 rounded-lg bg-white border border-border pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="kategori" className="text-sm font-medium text-foreground mb-1.5 block">
                  Kategori Tamu
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    id="kategori"
                    value={form.kategori_tamu}
                    onChange={(e) => updateField("kategori_tamu", e.target.value)}
                    className="w-full h-10 rounded-lg bg-white border border-border pl-10 pr-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all appearance-none"
                  >
                    {kategoriOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || addMutation.isPending || !eventId}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-accent/20 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {submitting ? "Menyimpan..." : "Registrasi Tamu"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Event Info + Recent */}
        <div className="lg:col-span-2 space-y-4">
          {/* Selected Event Info */}
          {selectedEvent ? (
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Informasi Acara</h3>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent-muted border border-accent/10">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <CalendarRange className="w-4 h-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{selectedEvent.nama_acara}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{selectedEvent.lokasi}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(selectedEvent.tanggal_mulai).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {selectedEvent.jam_mulai ? `, ${selectedEvent.jam_mulai}` : ""}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CalendarRange className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Pilih acara untuk melihat informasi</p>
              </div>
            </div>
          )}

          {/* Recent Registrations */}
          {eventId && (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Registrasi Terbaru</h3>
                <span className="text-xs text-muted-foreground">{recentRegistrations.length} tamu</span>
              </div>
              {recentRegistrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada tamu di acara ini</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentRegistrations.map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-card-hover transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-accent-muted text-accent flex items-center justify-center text-xs font-semibold shrink-0">
                        {guest.nama.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{guest.nama}</p>
                        <p className="text-xs text-muted-foreground truncate">{guest.instansi || "—"}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${guest.status_kehadiran === "hadir" ? "bg-success-light text-success border border-success/20" :
                        guest.status_kehadiran === "terlambat" ? "bg-warning-light text-warning border border-warning/20" :
                          "bg-muted/10 text-muted-foreground border border-border"
                        }`}>
                        {guest.status_kehadiran === "hadir" ? "Hadir" :
                          guest.status_kehadiran === "terlambat" ? "Terlambat" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 flex justify-end">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg bg-white w-full sm:w-auto ${toast.type === "success" ? "border-success/20" : "border-danger/20"
            }`}>
            <CheckCircle className={`w-5 h-5 ${toast.type === "success" ? "text-success" : "text-danger"}`} />
            <p className="text-sm font-medium text-foreground flex-1 sm:flex-initial">{toast.message}</p>
            <button onClick={() => setToast(null)} className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
