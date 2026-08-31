"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import QRScanner from "@/components/scanner/QRScanner";
import Button from "@/components/Button";
import Toast from "@/components/Toast";
import { useGuestsQuery } from "@/lib/queries/useGuestsQuery";
import { useEventsQuery } from "@/lib/queries/useEventsQuery";
import { formatTime as formatTimeWIB } from "@/lib/format-time";
import { UserRound, Clock, CheckCircle, Building2, Phone, Calendar, User, Send, ArrowLeft, QrCode, MapPin } from "lucide-react";

function ScanQRContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get("eventId");
  const { data: allEvents = [] } = useEventsQuery();
  const selectedEvent = allEvents.find((e) => e.id === parseInt(eventId));
  const { data: guests = [] } = useGuestsQuery();

  const [scannedGuest, setScannedGuest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [scanKey, setScanKey] = useState(0);
  const [toast, setToast] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const toastSeq = useRef(0);

  const showToast = (message, type = "success") => {
    toastSeq.current += 1;
    setToast({ message, type, id: toastSeq.current });
  };

  const resetScan = () => {
    setScannedGuest(null);
    setSubmitting(false);
    setSubmitted(false);
    setScanKey((k) => k + 1);
  };

  const handleSubmit = async () => {
    if (!scannedGuest) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/scan/${scannedGuest.qr_token}?acara_id=${eventId}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        // Status diupdate oleh RPC register_guest_scan di server;
        // cache React Query disinkronkan lewat realtime subscription.
        setScannedGuest((prev) => ({ ...prev, status_kehadiran: data.status }));
        setSubmitted(true);
        const scanTime = formatTimeWIB(data.guest?.waktu_kedatangan || new Date().toISOString());
        setScanHistory((prev) => [
          { id: Date.now(), nama: scannedGuest.nama, instansi: scannedGuest.instansi, no_hp: scannedGuest.no_hp, kategori_tamu: scannedGuest.kategori_tamu, event: selectedEvent?.nama_acara || allEvents.find((e) => e.id === scannedGuest.acara_id)?.nama_acara, status: data.status, time: scanTime },
          ...prev,
        ]);
        showToast(
          data.status === "hadir" ? "Kehadiran tepat waktu!" :
            data.status === "terlambat" ? "Tamu tercatat terlambat." :
              "Kehadiran tercatat."
        );
        setTimeout(resetScan, 2000);
      } else {
        showToast(data.error || data.message || "Gagal mencatat kehadiran", "error");
      }
    } catch {
      showToast("Gagal terhubung ke server", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScanError = (err) => {
    console.error("QR Scan error:", err);
    const msg = err?.message || "Gagal mengakses kamera atau memindai QR Code";
    showToast(msg, "error");
  };

  const handleScan = (detectedCodes) => {
    if (submitting || submitted) return;
    if (!Array.isArray(detectedCodes) || detectedCodes.length === 0) return;
    const raw = detectedCodes[0]?.rawValue;
    if (!raw) return;
    let token = null;
    const match = String(raw).match(/\/scan\/([a-zA-Z0-9-]+)/);
    if (match) token = match[1];
    if (token) {
      const eventGuests = guests.filter((g) => g.acara_id === parseInt(eventId));
      const guest = eventGuests.find((g) => g.qr_token === token);
      if (guest) {
        setScannedGuest(guest);
        setSubmitted(false);
        return;
      }
    }
    showToast("QR Code tidak dikenali atau tamu tidak ditemukan di acara ini", "error");
  };

  const statusStyles = {
    registrasi_dibuka: { badge: "bg-success-muted text-success", dot: "bg-success", label: "Registrasi Dibuka" },
    akan_datang: { badge: "bg-warning-muted text-warning", dot: "bg-warning", label: "Akan Datang" },
    registrasi_ditutup: { badge: "bg-danger-muted text-danger", dot: "bg-danger", label: "Registrasi Ditutup" },
  };

  if (!selectedEvent) {
    return (
      <>
        <Navbar title="Registrasi Tamu" subtitle="Pilih acara untuk memulai registrasi tamu" />
        <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {allEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <QrCode className="w-8 h-8 text-accent/60" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Belum Ada Acara</h3>
              <p className="text-sm text-muted mb-6 max-w-xs">Silakan buat acara terlebih dahulu sebelum melakukan registrasi tamu.</p>
              <Button onClick={() => router.push("/admin/events")}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Buat Acara
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allEvents.map((event) => {
                const s = statusStyles[event.status] || statusStyles.akan_datang;
                const canScan = event.status === "registrasi_dibuka";
                return (
                  <button key={event.id} onClick={() => { if (!canScan) { showToast("Registrasi belum dibuka untuk acara ini", "warning"); return; } router.push(`/admin/scan-qr?eventId=${event.id}`); }}
                    className={`glass-card rounded-2xl p-5 transition-all duration-300 text-left w-full group ${canScan ? "hover:border-border-hover hover:bg-card-hover cursor-pointer" : "opacity-60 cursor-not-allowed"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${canScan ? "bg-accent/10" : "bg-muted/10"}`}>
                        <QrCode className={`w-5 h-5 ${canScan ? "text-accent" : "text-muted/50"}`} />
                      </div>
                      <span className={`${s.badge} text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ml-3 whitespace-nowrap`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                        {s.label || event.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">{event.nama_acara}</h3>
                    <p className="text-xs text-muted mt-1">{event.lokasi}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title={`Registrasi Tamu - ${selectedEvent.nama_acara}`} subtitle="Scan QR Code tamu untuk mencatat kehadiran"
        actions={<Button variant="secondary" size="sm" onClick={() => router.push("/admin/scan-qr")} title="Ganti Acara" icon={<ArrowLeft className="w-4 h-4" />}><span className="hidden sm:inline">Ganti Acara</span></Button>}
      />

      {selectedEvent.status !== "registrasi_dibuka" && (
        <div className="mx-4 sm:mx-6 mt-4 sm:mt-6 flex items-center gap-3 p-4 rounded-xl bg-warning-muted border border-warning/20">
          <svg className="w-5 h-5 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-warning">Registrasi Belum Tersedia</p>
            <p className="text-xs text-warning/70 mt-0.5">
              {selectedEvent.status === "akan_datang" ? "Acara ini masih dalam status Akan Datang. Tunggu hingga Admin membuka registrasi." : "Registrasi untuk acara ini sudah ditutup. Scan QR tidak dapat dilakukan."}
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          <div className="glass-card rounded-2xl p-4 sm:p-6 flex flex-col">
            <h2 className="text-sm sm:text-base font-bold text-foreground mb-3 sm:mb-4">Scanner QR-Code</h2>
            <div className="flex-1 flex items-center justify-center">
              {selectedEvent.status === "registrasi_dibuka" ? (
                <QRScanner key={scanKey} onScan={handleScan} onError={handleScanError} />
              ) : (
                <div className="flex flex-col items-center justify-center px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted/10 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-muted mb-1">Scanner Terkunci</p>
                  <p className="text-xs text-muted/60 max-w-[200px]">
                    {selectedEvent.status === "akan_datang" ? "Registrasi belum dibuka. Silakan tunggu hingga Admin mengubah status acara." : "Registrasi sudah ditutup. Tidak dapat melakukan scan QR."}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 sm:p-6 flex flex-col">
            <h2 className="text-sm sm:text-base font-bold text-foreground mb-3 sm:mb-4">Detail Tamu</h2>
            {scannedGuest ? (
              <div className="space-y-3 sm:space-y-4 flex-1">
                <div className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl ${submitted ? "bg-success-muted border border-success/20" : "bg-accent-muted border border-accent/20"}`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${submitted ? "bg-success/10" : "bg-accent/10"} flex items-center justify-center shrink-0`}>
                    <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${submitted ? "text-success" : "text-accent"}`} />
                  </div>
                  <div>
                    <p className={`text-xs sm:text-sm font-semibold ${submitted ? "text-success" : "text-accent"}`}>
                      {submitted ? "Kehadiran Tercatat" : "Scan Berhasil"}
                    </p>
                    <p className={`text-xs sm:text-sm ${submitted ? "text-success/60" : "text-accent/60"}`}>
                      {submitted ? "Tamu sudah check-in" : "QR Code terverifikasi"}
                    </p>
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-input/50 border border-border space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><User className="w-3 h-3 sm:w-4 sm:h-4 text-accent" /></div>
                    <div><p className="text-xs text-muted">Nama</p><p className="text-xs sm:text-sm font-semibold text-foreground">{scannedGuest.nama}</p></div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-accent" /></div>
                    <div><p className="text-xs text-muted">Instansi</p><p className="text-xs sm:text-sm font-semibold text-foreground">{scannedGuest.instansi || "—"}</p></div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><User className="w-3 h-3 sm:w-4 sm:h-4 text-accent" /></div>
                    <div><p className="text-xs text-muted">Nama Mahasiswa</p><p className="text-xs sm:text-sm font-semibold text-foreground">{scannedGuest.nama_mahasiswa || "-"}</p></div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-accent" /></div>
                    <div><p className="text-xs text-muted">Alamat</p><p className="text-xs sm:text-sm font-semibold text-foreground">{scannedGuest.alamat || "—"}</p></div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><Phone className="w-3 h-3 sm:w-4 sm:h-4 text-accent" /></div>
                    <div><p className="text-xs text-muted">No. HP</p><p className="text-xs sm:text-sm font-semibold text-foreground">{scannedGuest.no_hp || "—"}</p></div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-accent" /></div>
                    <div><p className="text-xs text-muted">Acara</p><p className="text-xs sm:text-sm font-semibold text-foreground">{allEvents.find((e) => e.id === scannedGuest.acara_id)?.nama_acara || "—"}</p></div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-accent" /></div>
                    <div>
                      <p className="text-xs text-muted">Status</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${scannedGuest.status_kehadiran === "hadir" ? "bg-success-muted text-success border border-success/20" :
                        scannedGuest.status_kehadiran === "terlambat" ? "bg-warning-muted text-warning border border-warning/20" :
                          "bg-warning-muted text-warning border border-warning/20"}`}>
                        {scannedGuest.status_kehadiran === "hadir" ? "Sudah Hadir" : scannedGuest.status_kehadiran === "terlambat" ? "Terlambat" : "Belum Hadir"}
                      </span>
                    </div>
                  </div>
                </div>
                {scannedGuest.status_kehadiran !== "hadir" && scannedGuest.status_kehadiran !== "terlambat" && !submitted && (
                  <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Mengirim...
                      </span>
                    ) : (<><Send className="w-4 h-4" /> Konfirmasi Kehadiran</>)}
                  </Button>
                )}
                {submitted && <Button variant="secondary" className="w-full" onClick={resetScan}>Scan Tamu Lain</Button>}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-input/50 flex items-center justify-center mb-3 sm:mb-4">
                  <UserRound className="w-6 h-6 sm:w-8 sm:h-8 text-muted/40" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-muted">Belum ada data tamu</p>
                <p className="text-xs text-muted/60 mt-1">Data akan tampil setelah QR Code berhasil dipindai</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-muted" />
            <h2 className="text-sm sm:text-base font-bold text-foreground">Riwayat Scan</h2>
          </div>
          {scanHistory.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {scanHistory.map((item) => {
                const isLate = item.status === "terlambat";
                return (
                  <div key={item.id} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-input/30 border border-border">
                    <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg ${isLate ? "bg-warning-muted" : "bg-success-muted"} flex items-center justify-center shrink-0`}>
                      <CheckCircle className={`w-3 h-3 sm:w-4 sm:h-4 ${isLate ? "text-warning" : "text-success"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-foreground">{item.nama}</p>
                      <p className="text-xs text-muted">{item.instansi || "—"}</p>
                      <p className="text-xs text-muted/60">{item.event}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${isLate ? "bg-warning-muted text-warning" : "bg-success-muted text-success"}`}>
                        {isLate ? "Terlambat" : "Hadir"}
                      </span>
                      <span className="block text-xs text-muted/60 mt-1">{item.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4 sm:px-6 text-center">
              <p className="text-xs sm:text-sm font-semibold text-muted">Belum ada riwayat scan</p>
              <p className="text-xs text-muted/60 mt-1">Riwayat akan muncul setelah tamu berhasil discan</p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[60] flex justify-end">
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </>
  );
}

export default function ScanQRPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ScanQRContent />
    </Suspense>
  );
}
