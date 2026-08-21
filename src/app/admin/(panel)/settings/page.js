"use client";

import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import Toast from "@/components/Toast";
import { useResetDataQuery, useResetDataMutation } from "@/lib/queries/useResetDataQuery";
import { useProfileQuery, useUpdateProfile } from "@/lib/queries/useProfileQuery";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Mail,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Pencil,
  CheckCircle,
  Loader2,
  Save,
} from "lucide-react";

const INITIAL_COUNTS = { guests: 0, events: 0, activities: 0 };

export default function SettingsPage() {
  const { data: counts = INITIAL_COUNTS, isLoading: loadingCounts } = useResetDataQuery();
  const { deleteData, deleteMutation } = useResetDataMutation();
  const { data: profile, isLoading: loadingProfile } = useProfileQuery();
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [toast, setToast] = useState(null);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const submitting = deleteMutation.isPending;

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setEditingName(false);
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ display_name: trimmed });
      setToast({ message: "Nama berhasil diperbarui", type: "success" });
      setEditingName(false);
    } catch {
      setToast({ message: "Gagal memperbarui nama", type: "error" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordNew.length < 8) {
      setToast({ message: "Password baru minimal 8 karakter", type: "error" });
      return;
    }
    if (passwordNew !== passwordConfirm) {
      setToast({ message: "Konfirmasi password tidak cocok", type: "error" });
      return;
    }
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordNew });
      if (error) {
        setToast({ message: "Gagal mengubah password", type: "error" });
      } else {
        setToast({ message: "Password berhasil diubah", type: "success" });
        setPasswordNew("");
        setPasswordConfirm("");
      }
    } catch {
      setToast({ message: "Gagal mengubah password", type: "error" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteData();
      setConfirmText("");
      setShowConfirm(false);
      setToast({ message: "Semua data aplikasi berhasil dihapus.", type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Gagal menghapus data.", type: "error" });
    }
  };

  const countItems = [
    { label: "Tamu", value: counts.guests },
    { label: "Acara", value: counts.events },
    { label: "Log Aktivitas", value: counts.activities },
  ];

  const confirmReady = confirmText.trim().toUpperCase() === "HAPUS";

  return (
    <>
      <Navbar
        title="Pengaturan"
        subtitle="Pengaturan aplikasi"
      />

      <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Akun Saya */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Akun Saya</h2>
            <p className="text-xs text-muted mt-0.5">Informasi akun dan hak akses Anda</p>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-5 pb-6 mb-6 border-b border-border/50">
              <div className="w-16 h-16 rounded-full bg-accent-muted text-accent flex items-center justify-center text-xl font-bold shrink-0">
                {profile?.display_name
                  ? profile.display_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                  : "AD"}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {loadingProfile ? "…" : (profile?.display_name || "Admin")}
                </h3>
                <p className="text-sm text-muted truncate">{profile?.email || "—"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-card-hover">
                <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted">Nama Lengkap</p>
                  {editingName ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="flex-1 h-9 rounded-lg bg-input border border-input-border px-3 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-input-focus transition-all min-w-0"
                        placeholder="Masukkan nama"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName();
                          if (e.key === "Escape") setEditingName(false);
                        }}
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={savingProfile}
                        className="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                      >
                        {savingProfile ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-foreground truncate">
                      {profile?.display_name || "—"}
                    </p>
                  )}
                </div>
                {!editingName && (
                  <button
                    onClick={() => {
                      setNameInput(profile?.display_name || "");
                      setEditingName(true);
                    }}
                    className="w-8 h-8 rounded-lg bg-input/50 text-muted hover:text-foreground hover:bg-input flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Edit nama"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-card-hover">
                <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">{profile?.email || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-card-hover">
                <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted">Role</p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger-muted text-danger text-xs font-semibold border border-danger/20 mt-0.5">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ubah Password */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Ubah Password</h2>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label htmlFor="settings-new-password" className="text-sm font-medium text-foreground mb-1.5 block">
                  Password Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    id="settings-new-password"
                    type={showNew ? "text" : "password"}
                    placeholder="Masukkan password baru"
                    value={passwordNew}
                    onChange={(e) => setPasswordNew(e.target.value)}
                    className="w-full h-10 rounded-xl bg-input border border-input-border pl-10 pr-10 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-input-focus transition-all"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="settings-confirm-password" className="text-sm font-medium text-foreground mb-1.5 block">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    id="settings-confirm-password"
                    type={showConfirmPw ? "text" : "password"}
                    placeholder="Ulangi password baru"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full h-10 rounded-xl bg-input border border-input-border pl-10 pr-10 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-input-focus transition-all"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={savingProfile || !passwordNew || !passwordConfirm}
                  icon={savingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                >
                  {savingProfile ? "Menyimpan..." : "Simpan Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Hapus Data Aplikasi */}
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-danger-muted flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground leading-tight">Hapus Data Aplikasi</h2>
              <p className="text-sm text-muted mt-1 leading-relaxed">
                Menghapus seluruh <span className="font-semibold text-foreground">data tamu</span>,{" "}
                <span className="font-semibold text-foreground">acara</span>, dan{" "}
                <span className="font-semibold text-foreground">log aktivitas</span>. Akun admin dan
                panitia tetap aman. Tindakan ini <span className="font-semibold text-danger">tidak dapat dibatalkan</span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            {countItems.map((item) => (
              <div key={item.label} className="rounded-xl bg-surface-variant/60 border border-outline-variant px-4 py-3">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">{item.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {loadingCounts ? "…" : item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button
              variant="danger"
              onClick={() => {
                setConfirmText("");
                setShowConfirm(true);
              }}
              disabled={loadingCounts}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            >
              Hapus Data Aplikasi
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowConfirm(false); }} />
          <div className="relative glass-card rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="text-center p-2 overflow-y-auto flex-1 pr-1">
              <div className="w-14 h-14 rounded-full bg-danger-muted flex items-center justify-center mx-auto mb-4 mt-2">
                <svg className="w-7 h-7 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">Hapus Data Aplikasi?</h3>
              <p className="text-sm text-muted mt-2 leading-relaxed">
                Seluruh data tamu, acara, dan log aktivitas akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="mt-4 text-left">
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Ketik <span className="text-danger">HAPUS</span> untuk konfirmasi
                </label>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="HAPUS"
                  className="w-full rounded-xl bg-input border border-input-border px-4 py-2.5 text-sm text-foreground uppercase focus:outline-none focus:ring-2 focus:ring-danger/50 focus:border-danger transition-all duration-200"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-border/20 shrink-0">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowConfirm(false); }} disabled={submitting}>
                Batal
              </Button>
              <button
                onClick={handleDelete}
                disabled={!confirmReady || submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-danger text-white text-sm font-medium hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {submitting ? "Menghapus..." : "Ya, Hapus Semua"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[60] flex justify-end">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </>
  );
}