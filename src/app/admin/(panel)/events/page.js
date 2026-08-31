"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import EventCard from "@/components/EventCard";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Toast from "@/components/Toast";
import { useEventsQuery, useEventMutations } from "@/lib/queries/useEventsQuery";

const defaultForm = {
  nama_acara: "",
  lokasi: "",
  tanggal_mulai: "",
  tanggal_selesai: "",
  jam_mulai: "",
  jam_selesai: "",
  grace_period_minutes: "30",
};

// "09:00:00" / "09:00" → "09:00" (input type="time" hanya menerima HH:mm)
function toHHmm(value) {
  if (!value) return "";
  const match = String(value).match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

export default function EventsPage() {
  const { data: events = [] } = useEventsQuery();
  const { addEvent, updateEvent, deleteEvent, addMutation, updateMutation, deleteMutation } = useEventMutations();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [newEvent, setNewEvent] = useState({ ...defaultForm });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
  };

  const filtered = events.filter(
    (e) => (e.nama_acara || "").toLowerCase().includes(search.toLowerCase()) || (e.lokasi || "").toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setNewEvent({ ...defaultForm });
    setEditingEvent(null);
    setShowModal(false);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.jam_mulai || !newEvent.jam_selesai) {
      showToast("Jam Mulai dan Jam Selesai wajib diisi", "error");
      return;
    }
    const event = {
      nama_acara: newEvent.nama_acara,
      lokasi: newEvent.lokasi,
      tanggal_mulai: newEvent.tanggal_mulai,
      tanggal_selesai: newEvent.tanggal_selesai,
      jam_mulai: newEvent.jam_mulai,
      jam_selesai: newEvent.jam_selesai || "17:00",
      grace_period_minutes: parseInt(newEvent.grace_period_minutes) || 30,
      status: "akan_datang",
    };
    try {
      await addEvent(event, crypto.randomUUID());
      resetForm();
      showToast("Acara berhasil dibuat!");
    } catch (err) {
      showToast(err.message || "Gagal membuat acara. Silakan coba lagi.", "error");
    }
  };

  const handleEdit = (event) => {
    setNewEvent({
      nama_acara: event.nama_acara,
      lokasi: event.lokasi,
      tanggal_mulai: event.tanggal_mulai,
      tanggal_selesai: event.tanggal_selesai,
      jam_mulai: event.jam_mulai,
      jam_selesai: event.jam_selesai || "17:00",
      grace_period_minutes: String(event.grace_period_minutes || 30),
    });
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.jam_mulai || !newEvent.jam_selesai) {
      showToast("Jam Mulai dan Jam Selesai wajib diisi", "error");
      return;
    }
    try {
      await updateEvent(editingEvent.id, {
        nama_acara: newEvent.nama_acara,
        lokasi: newEvent.lokasi,
        tanggal_mulai: newEvent.tanggal_mulai,
        tanggal_selesai: newEvent.tanggal_selesai,
        jam_mulai: newEvent.jam_mulai,
        jam_selesai: newEvent.jam_selesai || "17:00",
        grace_period_minutes: parseInt(newEvent.grace_period_minutes) || 30,
      }, crypto.randomUUID());
      resetForm();
      showToast("Acara berhasil diperbarui!");
    } catch (err) {
      showToast(err.message || "Gagal memperbarui acara. Silakan coba lagi.", "error");
    }
  };

  const handleDelete = (id) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    try {
      await deleteEvent(confirmDeleteId, crypto.randomUUID());
      setConfirmDeleteId(null);
      showToast("Acara berhasil dihapus!");
    } catch {
      setConfirmDeleteId(null);
      showToast("Gagal menghapus acara. Silakan coba lagi.", "error");
    }
  };

  const handleStatusChange = async (event, newStatus) => {
    const statusLabels = {
      akan_datang: "Akan Datang",
      "registrasi_dibuka": "registrasi_dibuka",
      registrasi_ditutup: "Registrasi Ditutup",
    };

    if (newStatus === "registrasi_dibuka") {
      const alreadyActive = events.some(
        (e) => e.status === "registrasi_dibuka" && e.id !== event.id,
      );
      if (alreadyActive) {
        showToast(
          "Gagal mengubah status. Hanya satu acara yang bisa berstatus registrasi_dibuka dalam satu waktu.",
          "error",
        );
        return;
      }
    }

    try {
      const result = await updateEvent(event.id, { status: newStatus }, crypto.randomUUID());
      if (!result) {
        showToast("Gagal mengubah status acara. Silakan coba lagi.", "error");
        return;
      }
      showToast("Status acara berhasil diperbarui!");
    } catch {
      showToast("Gagal mengubah status acara. Silakan coba lagi.", "error");
    }
  };

  return (
    <>
      <Navbar title="Kelola Acara" subtitle="Buat, edit, dan kelola semua acara" actions={
        <Button onClick={() => setShowModal(true)} title="Buat Acara Baru" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}><span className="hidden sm:inline">Buat Acara</span></Button>
      } />

      <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="w-full sm:w-80">
            <Input placeholder="Cari acara..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} />
          </div>
          <span className="text-sm text-muted"><span className="text-foreground font-medium">{filtered.length}</span> acara ditemukan</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
          {filtered.map((event) => (<EventCard key={event.id} event={event} onEdit={handleEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} />))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-muted/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="text-muted text-sm">Tidak ada acara ditemukan</p>
          </div>
        )}
      </div>

      {/* Create / Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetForm}></div>
          <div className="relative glass-card rounded-2xl p-6 sm:p-8 w-full max-w-lg mx-4 glow-accent max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground">{editingEvent ? "Edit Acara" : "Buat Acara Baru"}</h2>
                <p className="text-sm text-muted mt-0.5">{editingEvent ? "Perbarui detail acara di bawah ini" : "Isi detail acara di bawah ini"}</p>
              </div>
              <button onClick={resetForm} className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
              <Input id="event-name" label="Nama Acara" placeholder="Contoh: Seminar AI 2026" value={newEvent.nama_acara} onChange={(e) => setNewEvent({ ...newEvent, nama_acara: e.target.value })} required />
              <Input id="event-location" label="Lokasi" placeholder="Contoh: Aula Kampus Utama" value={newEvent.lokasi} onChange={(e) => setNewEvent({ ...newEvent, lokasi: e.target.value })} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input id="event-start" label="Tanggal Mulai" type="date" value={newEvent.tanggal_mulai} onChange={(e) => setNewEvent({ ...newEvent, tanggal_mulai: e.target.value })} required />
                <Input id="event-end" label="Tanggal Selesai" type="date" value={newEvent.tanggal_selesai} onChange={(e) => setNewEvent({ ...newEvent, tanggal_selesai: e.target.value })} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input id="event-start-time" label="Jam Mulai" type="time" value={toHHmm(newEvent.jam_mulai)} onChange={(e) => setNewEvent({ ...newEvent, jam_mulai: e.target.value })} required />
                <Input id="event-end-time" label="Jam Selesai" type="time" value={toHHmm(newEvent.jam_selesai)} onChange={(e) => setNewEvent({ ...newEvent, jam_selesai: e.target.value })} required />
              </div>
              <Input id="event-grace" label="Batas Toleransi (menit)" type="number" placeholder="30" value={newEvent.grace_period_minutes} onChange={(e) => setNewEvent({ ...newEvent, grace_period_minutes: e.target.value })} />
              <div className="flex gap-3 pt-4 shrink-0">
                <Button type="button" variant="secondary" className="flex-1" onClick={resetForm}>Batal</Button>
                <Button type="submit" className="flex-1" disabled={addMutation.isPending || updateMutation.isPending}>{editingEvent ? "Simpan Perubahan" : "Simpan Acara"}</Button>
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
            <h3 className="text-lg font-bold text-foreground mb-2">Hapus Acara?</h3>
            <p className="text-sm text-muted mb-6">Acara yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setConfirmDeleteId(null)}>Batal</Button>
              <Button type="button" variant="danger" className="flex-1" onClick={confirmDelete} disabled={deleteMutation.isPending}>Hapus</Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </>
  );
}
