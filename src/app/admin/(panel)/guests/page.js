"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import GuestTable from "@/components/GuestTable";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Toast from "@/components/Toast";
import { useGuestsQuery, useGuestMutations, guestsKey } from "@/lib/queries/useGuestsQuery";
import { useEventsQuery } from "@/lib/queries/useEventsQuery";
import { useLogActivity } from "@/lib/queries/useActivitiesQuery";

export default function GuestsPage() {
  const queryClient = useQueryClient();
  const [eventFilter, setEventFilter] = useState("");
  const { data: guests = [], isLoading } = useGuestsQuery(eventFilter ? { acara_id: eventFilter } : {});
  const { data: events = [] } = useEventsQuery();
  const { addGuest, updateGuest, deleteGuest } = useGuestMutations();
  const { mutateAsync: logActivity } = useLogActivity();
  const fetchGuests = useCallback(() => queryClient.invalidateQueries({ queryKey: ['guests'] }), [queryClient]);
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [sendingBulkQr, setSendingBulkQr] = useState(false);
  const [newGuest, setNewGuest] = useState({
    nama: "",
    instansi: "",
    no_hp: "",
    nama_mahasiswa: "",
    alamat: "",
    kategori_tamu: "reguler",
    acara_id: "",
  });

  // Import state
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importStep, setImportStep] = useState("upload"); // upload | preview
  const [importEventId, setImportEventId] = useState("");

  const filteredGuests = guests;

  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
  };

  const handleEdit = (guest) => {
    setNewGuest({
      nama: guest.nama,
      instansi: guest.instansi || "",
      no_hp: guest.no_hp || "",
      nama_mahasiswa: guest.nama_mahasiswa && guest.nama_mahasiswa !== "-" ? guest.nama_mahasiswa : "",
      alamat: guest.alamat || "",
      kategori_tamu: guest.kategori_tamu,
      acara_id: guest.acara_id || "",
    });
    setEditingGuest(guest);
    setShowModal(true);
  };

  const handleUpdateGuest = async (e) => {
    e.preventDefault();
    const acaraId = eventFilter ? parseInt(eventFilter) : parseInt(newGuest.acara_id);
    if (!acaraId) {
      showToast("Pilih acara terlebih dahulu!", "error");
      return;
    }
    try {
      await updateGuest(editingGuest.id, {
        nama: newGuest.nama,
        instansi: newGuest.instansi,
        no_hp: newGuest.no_hp,
        nama_mahasiswa: newGuest.kategori_tamu === "reguler" ? newGuest.nama_mahasiswa : "-",
        alamat: newGuest.alamat,
        kategori_tamu: newGuest.kategori_tamu,
        acara_id: acaraId,
      });
      await logActivity({ action: "update_guest", detail: `Mengedit tamu "${newGuest.nama}"` });
      setShowModal(false);
      setEditingGuest(null);
      setNewGuest({ nama: "", instansi: "", no_hp: "", nama_mahasiswa: "", alamat: "", kategori_tamu: "reguler", acara_id: "" });
      showToast("Tamu berhasil diperbarui!");
    } catch (err) {
      showToast(err?.message || "Gagal memperbarui tamu. Silakan coba lagi.", "error");
    }
  };

  const handleDelete = (id) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    const deleted = guests.find((g) => g.id === confirmDeleteId);
    try {
      await deleteGuest(confirmDeleteId);
      if (deleted) await logActivity({ action: "delete_guest", detail: `Menghapus tamu "${deleted.nama}"` });
      setConfirmDeleteId(null);
      showToast("Tamu berhasil dihapus!");
    } catch {
      setConfirmDeleteId(null);
      showToast("Gagal menghapus tamu. Silakan coba lagi.", "error");
    }
  };

  const handleBulkSendQR = async () => {
    if (!eventFilter) {
      showToast("Pilih acara terlebih dahulu!", "error");
      return;
    }
    setSendingBulkQr(true);
    const eventGuests = guests.filter((g) => g.acara_id === parseInt(eventFilter) && g.email);
    if (eventGuests.length === 0) {
      showToast("Tidak ada tamu dengan alamat email di acara ini", "error");
      setSendingBulkQr(false);
      return;
    }
    try {
      const res = await fetch("/api/send-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_ids: eventGuests.map((g) => g.id),
          acara_id: parseInt(eventFilter),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const sent = data.results.filter((r) => r.status === "sent").length;
        const failed = data.results.filter((r) => r.status === "failed").length;
        const skipped = data.results.filter((r) => r.status === "skipped").length;
        showToast(`${sent} terkirim, ${failed} gagal, ${skipped} dilewati`);
        fetchGuests();
      } else {
        showToast(data.error || "Gagal mengirim QR massal", "error");
      }
    } catch {
      showToast("Gagal terhubung ke server", "error");
    } finally {
      setSendingBulkQr(false);
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    const acaraId = eventFilter ? parseInt(eventFilter) : parseInt(newGuest.acara_id);
    if (!acaraId) {
      showToast("Pilih acara terlebih dahulu!", "error");
      return;
    }
    const guest = {
      nama: newGuest.nama,
      instansi: newGuest.instansi,
      no_hp: newGuest.no_hp,
      nama_mahasiswa: newGuest.kategori_tamu === "reguler" ? newGuest.nama_mahasiswa : "-",
      alamat: newGuest.alamat,
      kategori_tamu: newGuest.kategori_tamu,
      status_kehadiran: "tidak_hadir",
      waktu_kedatangan: null,
      acara_id: acaraId,
    };
    try {
      await addGuest(guest);
      await logActivity({ action: "create_guest", detail: `Menambah tamu "${guest.nama}"` });
      setShowModal(false);
      setNewGuest({ nama: "", instansi: "", no_hp: "", nama_mahasiswa: "", alamat: "", kategori_tamu: "reguler", acara_id: "" });
      showToast("Tamu berhasil ditambahkan!");
    } catch (err) {
      showToast(err?.message || "Gagal menambahkan tamu. Silakan coba lagi.", "error");
    }
  };

  const sanitizeCSV = (value) => {
    const v = value.trim();
    if (["=", "+", "-", "@"].includes(v[0])) return "'" + v;
    return v;
  };

  const parseCSV = (text) => {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];
      if (inQuotes) {
        if (c === '"') {
          if (next === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (c === "\r") {
        // ignore carriage returns
      } else {
        field += c;
      }
    }
    if (field !== "" || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    if (rows.length < 2) return [];

    const rawHeaders = rows[0].map((h) => h.trim());
    const lowerHeaders = rawHeaders.map((h) => h.toLowerCase().replace(/[\s.]+/g, "_").replace(/[^a-z0-9_]/g, ""));
    const headers = lowerHeaders.map((h) => {
      if (/^kategori/i.test(h) || (h === "status" && !lowerHeaders.some((x) => /^kategori/i.test(x)))) return "kategori_tamu";
      if (/^(status_)?kehadiran/i.test(h)) return "status_kehadiran";
      if (/^no_?hp|nohp|telepon|telp|phone/i.test(h)) return "no_hp";
      if (/mahasiswa|nim|nama_?siswa/i.test(h)) return "nama_mahasiswa";
      if (/alamat|address/i.test(h)) return "alamat";
      if (/acara|event/i.test(h)) return "acara_id";
      return h;
    });
    const results = [];
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].map((v) => sanitizeCSV(v));
      if (values.every((v) => v === "")) continue;
      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || "";
      });
      if (rowObj.nama) results.push(rowObj);
    }
    return results;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      showToast("Hanya file CSV yang didukung", "error");
      return;
    }
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        showToast("File CSV kosong atau format tidak valid", "error");
        return;
      }
      setImportPreview(rows);
      setImportStep("preview");
    };
    reader.readAsText(file);
  };

  const normalize = (s) => s.trim().toLowerCase().replace(/\s+/g, " ");

  const resolveAcaraId = (row) => {
    const csvValue = row.acara_id;
    if (csvValue) {
      const matched = events.find(
        (e) => normalize(e.nama_acara) === normalize(csvValue)
      );
      if (matched) return matched.id;
      const parsed = parseInt(csvValue);
      if (!isNaN(parsed) && events.some((e) => e.id === parsed)) return parsed;
    }
    if (importEventId && events.some((e) => e.id === parseInt(importEventId))) return parseInt(importEventId);
    if (eventFilter && events.some((e) => e.id === parseInt(eventFilter))) return parseInt(eventFilter);
    return 0;
  };

  const handleImport = async () => {
    const hasAcaraColumn = importPreview.some((row) => row.acara_id);
    if (!eventFilter && !importEventId && !hasAcaraColumn) {
      showToast("Pilih acara terlebih dahulu sebelum import!", "error");
      return;
    }
    setImporting(true);
    try {
      const payload = importPreview.map((row) => ({
        nama: row.nama || "",
        instansi: row.instansi || "",
        no_hp: row.no_hp || null,
        tujuan: row.tujuan || null,
        nama_mahasiswa: row.nama_mahasiswa || null,
        alamat: row.alamat || null,
        kategori_tamu: (row.kategori_tamu || "reguler").toLowerCase(),
        acara_id: resolveAcaraId(row),
      }));
      const hasMissing = payload.some((g) => !g.acara_id);
      if (hasMissing) {
        showToast("Ada tamu yang tidak memiliki acara valid. Periksa kembali data CSV atau pilih acara!", "error");
        return;
      }

      const res = await fetch("/api/guests/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || "Gagal mengimpor data", "error");
        return;
      }

      await fetchGuests();
      logActivity({ action: "import_guest", detail: `Mengimpor ${data.count} tamu dari CSV${data.skipped ? ` (${data.skipped} duplikat dilewati)` : ""}` });
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview([]);
      setImportStep("upload");
      setImportEventId("");
      showToast(
        data.count > 0
          ? `${data.count} tamu berhasil diimpor!${data.skipped ? ` ${data.skipped} duplikat dilewati.` : ""}`
          : `${data.skipped || 0} duplikat ditemukan, tidak ada tamu baru yang diimpor.`
      );
    } catch {
      showToast("Gagal terhubung ke server", "error");
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportPreview([]);
    setImportStep("upload");
    setImportEventId("");
    setShowImportModal(false);
  };

  return (
    <>
      <Navbar
        title="Data Tamu"
        subtitle="Kelola semua data tamu"
        actions={
          <div className="flex items-center gap-2">
            {eventFilter && (
              <Button onClick={handleBulkSendQR} disabled={sendingBulkQr} variant="secondary" title="Kirim QR Code ke semua tamu" icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }>
                <span className="hidden sm:inline">{sendingBulkQr ? "Mengirim..." : "Kirim QR Massal"}</span>
              </Button>
            )}
            <Button onClick={() => setShowImportModal(true)} variant="secondary" title="Import Tamu dari CSV" icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            }>
              <span className="hidden sm:inline">Import Data</span>
            </Button>
            <Button onClick={() => setShowModal(true)} title="Tambah Tamu Baru" icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }>
              <span className="hidden sm:inline">Tambah Tamu</span>
            </Button>
          </div>
        }
      />

      <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Event Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
          {eventFilter && (
            <button
              onClick={() => setEventFilter("")}
              className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Hapus filter
            </button>
          )}
        </div>
        <GuestTable guests={filteredGuests} events={events} showEvent onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetImport}></div>
          <div className="relative glass-card rounded-2xl p-6 sm:p-8 w-full max-w-2xl mx-4 glow-accent max-h-[90vh] overflow-y-auto">
            {importStep === "upload" && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Import Data Tamu</h2>
                    <p className="text-sm text-muted mt-0.5">Unggah file CSV untuk mengimpor banyak tamu sekaligus</p>
                  </div>
                  <button onClick={resetImport} className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>


                {/* File Upload */}
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 sm:p-12 text-center hover:border-accent/50 transition-colors cursor-pointer" onClick={() => document.getElementById("csv-file-input").click()}>
                  <svg className="w-12 h-12 text-muted/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-semibold text-foreground mb-1">Klik untuk unggah file CSV</p>
                  <p className="text-xs text-muted">atau seret file ke sini</p>
                  <input id="csv-file-input" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                </div>

                <div className="flex gap-3 pt-6">
                  <Button type="button" variant="secondary" className="flex-1" onClick={resetImport}>Batal</Button>
                  <Button type="button" className="flex-1" disabled>Pilih File</Button>
                </div>
              </>
            )}

            {importStep === "preview" && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Preview Data</h2>
                    <p className="text-sm text-muted mt-0.5">{importPreview.length} data akan diimpor dari <span className="font-medium text-foreground">{importFile?.name}</span></p>
                  </div>
                  <button onClick={resetImport} className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Event Selector (when no filter active) */}
                {!eventFilter && (
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4 p-4 bg-muted/10 rounded-xl border border-border">
                    <div className="flex-1 w-full">
                      <label className="text-sm font-medium text-foreground/80 block mb-1.5">
                        Acara Tujuan <span className="text-danger ml-1">*</span>
                      </label>
                      <select
                        value={importEventId}
                        onChange={(e) => setImportEventId(e.target.value)}
                        className="w-full rounded-xl bg-input border border-input-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-input-focus transition-all duration-200"
                      >
                        <option value="">Pilih Acara</option>
                        {events.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.nama_acara}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted mt-1">
                        {importPreview.some((row) => row.acara_id)
                          ? "Acara dari CSV akan dicocokkan otomatis. Pilih acara di atas sebagai fallback jika nama tidak dikenal."
                          : "CSV tidak memiliki kolom Acara. Pilih acara untuk semua data yang diimport."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Preview Table */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/10 border-b border-border">
                        <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-4 py-3">Nama</th>
                        <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-4 py-3">Instansi</th>
                        <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-4 py-3">Kategori</th>
                        <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-4 py-3">No. HP</th>
                        <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-4 py-3">Status Kehadiran</th>
                        <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-4 py-3">Acara</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((row, idx) => {
                        const resolvedEvent = events.find(
                          (e) => normalize(e.nama_acara) === normalize(row.acara_id || "")
                        );
                        const resolvedName = resolvedEvent
                          ? resolvedEvent.nama_acara
                          : row.acara_id
                            ? null
                            : null;
                        return (
                        <tr key={idx} className="border-b border-border/50 last:border-0">
                          <td className="px-4 py-3 text-sm font-medium text-foreground">{row.nama || "—"}</td>
                          <td className="px-4 py-3 text-sm text-muted">{row.instansi || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              (row.kategori_tamu || "reguler").toLowerCase() === "vip" ? "bg-warning-muted text-warning border border-warning/20" :
                              (row.kategori_tamu || "reguler").toLowerCase() === "vvip" ? "bg-danger-muted text-danger border border-danger/20" :
                              "bg-info-muted text-info border border-info/20"
                            }`}>
                              {(row.kategori_tamu || "reguler").toLowerCase() === "vvip" ? "VVIP" : (row.kategori_tamu || "reguler").toLowerCase() === "vip" ? "VIP" : "Reguler"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted font-mono">{row.no_hp || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              (row.status_kehadiran || "hadir").toLowerCase() === "terlambat" ? "bg-warning-muted text-warning border border-warning/20" :
                              (row.status_kehadiran || "hadir").toLowerCase() === "tidak_hadir" ? "bg-danger-muted text-danger border border-danger/20" :
                              "bg-success-muted text-success border border-success/20"
                            }`}>
                              {(row.status_kehadiran || "hadir").toLowerCase() === "tidak_hadir" ? "Tidak Hadir" : (row.status_kehadiran || "hadir").toLowerCase() === "terlambat" ? "Terlambat" : "Hadir"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {resolvedName ? (
                              <span className="text-xs bg-accent-muted text-accent px-2.5 py-1 rounded-full font-medium">
                                {resolvedName}
                              </span>
                            ) : row.acara_id ? (
                              <span className="text-xs bg-warning-muted text-warning px-2.5 py-1 rounded-full font-medium" title="Nama acara tidak dikenal di sistem">
                                {row.acara_id}
                              </span>
                            ) : (
                              <span className="text-xs text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 pt-6">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => { setImportStep("upload"); setImportEventId(""); }}>Kembali</Button>
                  <Button type="button" className="flex-1" onClick={handleImport} disabled={importing}>
                    {importing ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Mengimpor...
                      </span>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import {importPreview.length} Data
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Guest Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowModal(false); setEditingGuest(null); setNewGuest({ nama: "", instansi: "", no_hp: "", nama_mahasiswa: "", alamat: "", kategori_tamu: "reguler", acara_id: "" }); }}></div>
          <div className="relative glass-card rounded-2xl p-6 sm:p-8 w-full max-w-lg mx-4 glow-accent max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground">{editingGuest ? "Edit Tamu" : "Tambah Tamu Baru"}</h2>
                <p className="text-sm text-muted mt-0.5">{editingGuest ? "Perbarui data tamu di bawah ini" : "Isi data tamu di bawah ini"}</p>
              </div>
              <button onClick={() => { setShowModal(false); setEditingGuest(null); setNewGuest({ nama: "", instansi: "", no_hp: "", nama_mahasiswa: "", alamat: "", kategori_tamu: "reguler", acara_id: "" }); }} className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={editingGuest ? handleUpdateGuest : handleAddGuest} className="space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
              <Input
                id="guest-name"
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                value={newGuest.nama}
                onChange={(e) => setNewGuest({ ...newGuest, nama: e.target.value })}
                required
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              <Input
                id="guest-instansi"
                label="Instansi / Lembaga"
                placeholder="Opsional - Contoh: Universitas Airlangga"
                value={newGuest.instansi}
                onChange={(e) => setNewGuest({ ...newGuest, instansi: e.target.value })}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
              <Input
                id="guest-phone"
                label="Nomor HP"
                type="tel"
                placeholder="Opsional"
                value={newGuest.no_hp}
                onChange={(e) => setNewGuest({ ...newGuest, no_hp: e.target.value })}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground/80">
                  Nama Mahasiswa {newGuest.kategori_tamu === "reguler" ? <span className="text-danger ml-1">*</span> : null}
                </label>
                <input
                  type="text"
                  placeholder={newGuest.kategori_tamu === "reguler" ? "Masukkan nama mahasiswa" : "-"}
                  value={newGuest.kategori_tamu === "reguler" ? newGuest.nama_mahasiswa : "-"}
                  onChange={(e) => setNewGuest({ ...newGuest, nama_mahasiswa: e.target.value })}
                  disabled={newGuest.kategori_tamu !== "reguler"}
                  className="w-full rounded-xl bg-input border border-input-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-input-focus transition-all duration-200 disabled:bg-muted/10 disabled:text-muted-foreground"
                  required={newGuest.kategori_tamu === "reguler"}
                />
                {newGuest.kategori_tamu !== "reguler" && (
                  <p className="text-xs text-muted">Otomatis &quot;-&quot; untuk tamu VIP/VVIP</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground/80">
                  Alamat Tamu <span className="text-danger ml-1">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Masukkan alamat tamu"
                  value={newGuest.alamat}
                  onChange={(e) => setNewGuest({ ...newGuest, alamat: e.target.value })}
                  className="w-full rounded-xl bg-input border border-input-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-input-focus transition-all duration-200"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground/80">
                  Kategori <span className="text-danger ml-1">*</span>
                </label>
                <select
                  value={newGuest.kategori_tamu}
                  onChange={(e) => setNewGuest({ ...newGuest, kategori_tamu: e.target.value })}
                  className="w-full rounded-xl bg-input border border-input-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-input-focus transition-all duration-200"
                  required
                >
                  <option value="reguler">Reguler</option>
                  <option value="vip">VIP</option>
                  <option value="vvip">VVIP</option>
                </select>
              </div>
              {(!eventFilter || editingGuest) && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground/80">
                    Acara <span className="text-danger ml-1">*</span>
                  </label>
                  <select
                    value={newGuest.acara_id}
                    onChange={(e) => setNewGuest({ ...newGuest, acara_id: e.target.value })}
                    className="w-full rounded-xl bg-input border border-input-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-input-focus transition-all duration-200"
                    required
                  >
                    <option value="">Pilih Acara</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.nama_acara}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-4 shrink-0">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowModal(false); setEditingGuest(null); setNewGuest({ nama: "", instansi: "", no_hp: "", nama_mahasiswa: "", alamat: "", kategori_tamu: "reguler", acara_id: "" }); }}>Batal</Button>
                <Button type="submit" className="flex-1">{editingGuest ? "Simpan Perubahan" : "Simpan Tamu"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}></div>
          <div className="relative glass-card rounded-2xl p-6 w-full max-w-sm mx-4 glow-danger text-center">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Hapus Tamu?</h3>
            <p className="text-sm text-muted mb-6">Data tamu yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setConfirmDeleteId(null)}>Batal</Button>
              <Button type="button" variant="danger" className="flex-1" onClick={confirmDelete}>Hapus</Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[60] flex justify-end">
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </>
  );
}
