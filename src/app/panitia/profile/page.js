"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useProfileQuery, useUpdateProfile } from "@/lib/queries/useProfileQuery";
import {
  User,
  Mail,
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  X,
  Save,
  Pencil,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;
  const { data: profile, isLoading: loading } = useProfileQuery();
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setEditingName(false);
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ display_name: trimmed });
      setToast({ id: Date.now(), message: "Nama berhasil diperbarui", type: "success" });
      setEditingName(false);
    } catch {
      setToast({ id: Date.now(), message: "Gagal memperbarui nama", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordNew.length < 8) {
      setToast({ id: Date.now(), message: "Password baru minimal 8 karakter", type: "error" });
      return;
    }
    if (passwordNew !== passwordConfirm) {
      setToast({ id: Date.now(), message: "Konfirmasi password tidak cocok", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordNew });
      if (error) {
        setToast({ id: Date.now(), message: "Gagal mengubah password", type: "error" });
      } else {
        setToast({ id: Date.now(), message: "Password berhasil diubah", type: "success" });
        setPasswordNew("");
        setPasswordConfirm("");
      }
    } catch {
      setToast({ id: Date.now(), message: "Gagal mengubah password", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Profile Card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Informasi Akun</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-5 pb-6 mb-6 border-b border-border/50">
            <div className="w-16 h-16 rounded-full bg-accent-muted text-accent flex items-center justify-center text-xl font-bold ring-4 ring-white shadow-sm">
              {profile?.display_name
                ? profile.display_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                : "PT"}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{profile?.display_name || "Panitia"}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email || "—"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-card-hover">
              <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Nama Lengkap</p>
                {editingName ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="flex-1 h-8 rounded-lg bg-white border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all"
                      placeholder="Masukkan nama"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") setEditingName(false);
                      }}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-foreground">{profile?.display_name || "—"}</p>
                )}
              </div>
              {!editingName && (
                <button
                  onClick={() => { setNameInput(profile?.display_name || ""); setEditingName(true); }}
                  className="w-8 h-8 rounded-lg bg-input/50 text-muted-foreground hover:text-foreground hover:bg-input flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-card-hover">
              <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{profile?.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-card-hover">
              <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Role</p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-muted text-accent text-xs font-semibold border border-accent/10 mt-0.5">
                  <Shield className="w-3 h-3" />
                  Panitia
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
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
              <label htmlFor="new-password" className="text-sm font-medium text-foreground mb-1.5 block">
                Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  placeholder="Masukkan password baru"
                  value={passwordNew}
                  onChange={(e) => setPasswordNew(e.target.value)}
                  className="w-full h-10 rounded-lg bg-white border border-border pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="text-sm font-medium text-foreground mb-1.5 block">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Ulangi password baru"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full h-10 rounded-lg bg-white border border-border pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-all"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving || !passwordNew || !passwordConfirm}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-accent/20 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Menyimpan..." : "Simpan Password"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 flex justify-end">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg bg-white w-full sm:w-auto ${
            toast.type === "success" ? "border-success/20" : "border-danger/20"
          }`}>
            <CheckCircle className={`w-5 h-5 ${toast.type === "success" ? "text-success" : "text-danger"}`} />
            <p className="text-sm font-medium text-foreground flex-1 sm:flex-initial">{toast.message}</p>
            <button onClick={() => setToast(null)} className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
