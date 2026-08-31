"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Input from "@/components/Input";
import Button from "@/components/Button";
import Toast from "@/components/Toast";
import { useUsersQuery, useUserMutations } from "@/lib/queries/useUsersQuery";

const roleMap = {
  admin: {
    badge: "bg-danger-muted text-danger border border-danger/20",
    label: "Admin",
  },
  panitia: {
    badge: "bg-warning-muted text-warning border border-warning/20",
    label: "Panitia",
  },
};

const statusMap = {
  pending: {
    badge: "bg-warning-muted text-warning border border-warning/20",
    label: "Menunggu Persetujuan",
  },
  active: {
    badge: "bg-success-light text-success border border-success/20",
    label: "Aktif",
  },
};

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsersQuery();
  const { createUser, updateUser, resetPassword, deleteUser, createMutation, updateMutation, resetPasswordMutation, deleteMutation } = useUserMutations();
  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    display_name: "",
    role: "panitia",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [resettingUser, setResettingUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");

  const [deletingUser, setDeletingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [rejectingUser, setRejectingUser] = useState(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const [toast, setToast] = useState(null);
  const [pageError, setPageError] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await createUser(form);
      setShowAddModal(false);
      setForm({ email: "", password: "", display_name: "", role: "panitia" });
    } catch (err) {
      setFormError(err.message || "Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await updateUser(editingUser.id, {
        display_name: editingUser.display_name,
        role: editingUser.role,
      });
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err) {
      setFormError(err.message || "Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setSubmitting(true);
    try {
      await resetPassword(resettingUser.id, newPassword);
      setShowResetModal(false);
      setResettingUser(null);
      setNewPassword("");
    } catch (err) {
      setResetError(err.message || "Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await deleteUser(deletingUser.id);
      setShowDeleteConfirm(false);
      setDeletingUser(null);
    } catch (err) {
      setFormError(err.message || "Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (user) => {
    setPageError("");
    setSubmitting(true);
    try {
      await updateUser(user.id, { status: "active" });
      setToast({ message: `${user.display_name || user.username} telah disetujui`, type: "success" });
    } catch (err) {
      setPageError(err.message || "Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  const openReject = (user) => {
    setRejectingUser(user);
    setShowRejectConfirm(true);
  };

  const handleReject = async () => {
    setPageError("");
    setSubmitting(true);
    try {
      await deleteUser(rejectingUser.id);
      setShowRejectConfirm(false);
      setRejectingUser(null);
      setToast({ message: "Pendaftaran ditolak dan akun dihapus", type: "error" });
    } catch (err) {
      setPageError(err.message || "Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (user) => {
    setEditingUser({ ...user });
    setFormError("");
    setShowEditModal(true);
  };

  const openResetPassword = (user) => {
    setResettingUser(user);
    setNewPassword("");
    setResetError("");
    setShowResetModal(true);
  };

  const openDelete = (user) => {
    setDeletingUser(user);
    setShowDeleteConfirm(true);
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.display_name || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <Navbar
        title="Kelola Pengguna"
        subtitle="Manajemen pengguna dan role akses"
        actions={
          <Button onClick={() => setShowAddModal(true)} title="Tambah Pengguna Baru">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Tambah Pengguna</span>
          </Button>
        }
      />

      <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Cari nama, email, atau role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <p className="text-sm text-muted whitespace-nowrap">
            Menampilkan <span className="text-foreground font-medium">{filtered.length}</span> dari {users.length} pengguna
          </p>
        </div>

        {pageError && (
          <div className="bg-danger-muted border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {pageError}
          </div>
        )}

        {/* Card Layout for Mobile */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {isLoading ? (
            <div className="glass-card rounded-2xl p-8 text-center text-muted">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-muted text-sm">
              <div className="flex flex-col items-center gap-3">
                <svg className="w-14 h-14 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M17 20h5v-2a4 4 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a4 4 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-foreground/60 font-medium">Belum ada data pengguna.</p>
              </div>
            </div>
          ) : (
            filtered.map((user) => (
              <div key={user.id} className="glass-card rounded-2xl p-4 flex flex-col gap-3 relative border border-border/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-accent-muted text-accent flex items-center justify-center text-xs font-bold shrink-0">
                      {(user.display_name || user.username || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{user.display_name || user.username}</p>
                      <p className="text-xs text-muted truncate">{user.username}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${(roleMap[user.role] || roleMap.panitia).badge}`}>
                      {(roleMap[user.role] || roleMap.panitia).label}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${(statusMap[user.status] || statusMap.active).badge}`}>
                      {(statusMap[user.status] || statusMap.active).label}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-border/30 pt-3">
                   <div className="text-xs text-muted">
                    Dibuat: {formatDate(user.created_at)}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {user.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleApprove(user)}
                          className="p-1.5 rounded-lg text-success hover:bg-success-light transition-colors cursor-pointer"
                          title="Setujui Pengguna"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openReject(user)}
                          className="p-1.5 rounded-lg text-danger hover:bg-danger-muted transition-colors cursor-pointer"
                          title="Tolak & Hapus Pengguna"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                    <button
                      onClick={() => openEdit(user)}
                      className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent-muted transition-colors cursor-pointer"
                      title="Edit Pengguna"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openResetPassword(user)}
                      className="p-1.5 rounded-lg text-muted hover:text-warning hover:bg-warning-muted transition-colors cursor-pointer"
                      title="Reset Password"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDelete(user)}
                      className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger-muted transition-colors cursor-pointer"
                      title="Hapus Pengguna"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Table */}
        <div className="hidden md:block glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5">Pengguna</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5">Email</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5">Role</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5">Status</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5">Dibuat</th>
                  <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted text-sm">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-14 h-14 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M17 20h5v-2a4 4 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a4 4 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-foreground/60 font-medium">Belum ada data pengguna.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} className="border-b border-border/50 table-row-hover">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-muted text-accent flex items-center justify-center text-xs font-bold shrink-0">
                            {(user.display_name || user.username || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-foreground">{user.display_name || user.username}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted">{user.username}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block whitespace-nowrap ${(roleMap[user.role] || roleMap.panitia).badge}`}>
                          {(roleMap[user.role] || roleMap.panitia).label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block whitespace-nowrap ${(statusMap[user.status] || statusMap.active).badge}`}>
                          {(statusMap[user.status] || statusMap.active).label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted">{formatDate(user.created_at)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user.status === "pending" ? (
                            <>
                              <button
                                onClick={() => handleApprove(user)}
                                className="p-2 rounded-lg text-success hover:bg-success-light transition-colors cursor-pointer"
                                title="Setujui Pengguna"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => openReject(user)}
                                className="p-2 rounded-lg text-danger hover:bg-danger-muted transition-colors cursor-pointer"
                                title="Tolak & Hapus Pengguna"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <>
                          <button
                            onClick={() => openEdit(user)}
                            className="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent-muted transition-colors cursor-pointer"
                            title="Edit Pengguna"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openResetPassword(user)}
                            className="p-2 rounded-lg text-muted hover:text-warning hover:bg-warning-muted transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDelete(user)}
                            className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger-muted transition-colors cursor-pointer"
                            title="Hapus Pengguna"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setFormError(""); }} />
          <div className="relative bg-surface rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4 shadow-[var(--shadow-dialog)] max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-lg font-bold text-foreground">Tambah Pengguna</h3>
              <button onClick={() => { setShowAddModal(false); setFormError(""); }} className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
              <Input id="email" label="Email" type="email" placeholder="Masukkan email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
              } />
              <Input id="password" label="Password" type="password" placeholder="Masukkan password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              } />
              <Input id="display_name" label="Nama Tampilan" type="text" placeholder="Masukkan nama tampilan (opsional)" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              } />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground/80">Role <span className="text-danger ml-1">*</span></label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-xl bg-input border border-input-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-input-focus transition-all duration-200">
                  <option value="panitia">Panitia (Scan & Lihat Data)</option>
                  <option value="admin">Admin (Akses Penuh)</option>
                </select>
              </div>
              {formError && (
                <div className="bg-danger-muted border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {formError}
                </div>
              )}
              <div className="flex gap-3 pt-2 shrink-0">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowAddModal(false); setFormError(""); }}>Batal</Button>
                <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowEditModal(false); setFormError(""); }} />
          <div className="relative bg-surface rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4 shadow-[var(--shadow-dialog)] max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-lg font-bold text-foreground">Edit Pengguna</h3>
              <button onClick={() => { setShowEditModal(false); setFormError(""); }} className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
              <Input id="edit_email" label="Email" type="email" value={editingUser.username || ""} disabled icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
              } />
              <Input id="edit_display_name" label="Nama Tampilan" type="text" placeholder="Masukkan nama tampilan" value={editingUser.display_name || ""} onChange={(e) => setEditingUser({ ...editingUser, display_name: e.target.value })} icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              } />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground/80">Role <span className="text-danger ml-1">*</span></label>
                <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })} className="w-full rounded-xl bg-input border border-input-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-input-focus transition-all duration-200">
                  <option value="panitia">Panitia (Scan & Lihat Data)</option>
                  <option value="admin">Admin (Akses Penuh)</option>
                </select>
              </div>
              {formError && (
                <div className="bg-danger-muted border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {formError}
                </div>
              )}
              <div className="flex gap-3 pt-2 shrink-0">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowEditModal(false); setFormError(""); }}>Batal</Button>
                <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowResetModal(false); setResetError(""); }} />
          <div className="relative bg-surface rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4 shadow-[var(--shadow-dialog)] max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-lg font-bold text-foreground">Reset Password</h3>
              <button onClick={() => { setShowResetModal(false); setResetError(""); }} className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
              <p className="text-sm text-muted">
                Reset password untuk <span className="font-semibold text-foreground">{resettingUser.display_name || resettingUser.username}</span>
              </p>
              <Input id="new_password" label="Password Baru" type="password" placeholder="Masukkan password baru" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              } />
              {resetError && (
                <div className="bg-danger-muted border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {resetError}
                </div>
              )}
              <div className="flex gap-3 pt-2 shrink-0">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowResetModal(false); setResetError(""); }}>Batal</Button>
                <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowDeleteConfirm(false); }} />
          <div className="relative bg-surface rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4 shadow-[var(--shadow-dialog)] max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="text-center p-2 overflow-y-auto flex-1 pr-1">
              <div className="w-14 h-14 rounded-full bg-danger-muted flex items-center justify-center mx-auto mb-4 mt-2">
                <svg className="w-7 h-7 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">Hapus Pengguna</h3>
              <p className="text-sm text-muted mt-2">
                Apakah Anda yakin ingin menghapus <span className="font-semibold text-foreground">{deletingUser.display_name || deletingUser.username}</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-3 pt-4 border-t border-border/20 shrink-0">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowDeleteConfirm(false); }}>Batal</Button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-danger text-white text-sm font-medium hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {submitting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation */}
      {showRejectConfirm && rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowRejectConfirm(false); }} />
          <div className="relative bg-surface rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4 shadow-[var(--shadow-dialog)] max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="text-center p-2 overflow-y-auto flex-1 pr-1">
              <div className="w-14 h-14 rounded-full bg-danger-muted flex items-center justify-center mx-auto mb-4 mt-2">
                <svg className="w-7 h-7 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">Tolak pendaftaran?</h3>
              <p className="text-sm text-muted mt-2">
                Pengguna <span className="font-semibold text-foreground">{rejectingUser.display_name || rejectingUser.username}</span> ini akan dihapus dan tidak dapat masuk ke aplikasi.
              </p>
            </div>
            <div className="flex gap-3 pt-4 border-t border-border/20 shrink-0">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowRejectConfirm(false); }}>Batal</Button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-danger text-white text-sm font-medium hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {submitting ? "Menghapus..." : "Tolak & Hapus"}
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
