"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  UserPlus,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const inputBase =
  "w-full h-[52px] md:h-[56px] rounded-2xl border bg-white/10 border-white/25 pl-12 pr-12 text-base text-white placeholder:text-white/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1553D7]/10 focus:border-[#1553D7] focus:bg-white/15 md:bg-[#FAFBFD] md:border-[#E6EAF2] md:text-[#0F172A] md:placeholder:text-[#9AA3B2] md:focus:bg-[#FAFBFD]";

export default function AuthForms() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ nama: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [registerShowPassword, setRegisterShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then(({ user, profile }) => {
        if (!active) return;
        if (user && profile) {
          if (profile.role === "admin") router.replace("/admin/dashboard");
          else router.replace("/panitia");
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, remember }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Email atau password salah");
        setLoading(false);
        return;
      }

      if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/panitia");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const switchToRegister = () => {
    setMode("register");
    setError("");
    setRegisterError("");
  };

  const switchToLogin = () => {
    setMode("login");
    setError("");
    setRegisterError("");
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError("");

    const name = registerForm.nama.trim();
    const email = registerForm.email.trim();
    const password = registerForm.password;

    const errors = [];
    if (!name) errors.push("Nama wajib diisi.");
    if (!email) errors.push("Email wajib diisi.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Format email tidak valid.");
    if (!password) errors.push("Password wajib diisi.");
    else if (password.length < 8) errors.push("Password minimal 8 karakter.");

    if (errors.length) {
      setRegisterError(errors.join(" "));
      return;
    }

    setRegisterLoading(true);
    try {
      const res = await fetch("/api/public/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRegisterError(data.error || "Terjadi kesalahan. Silakan coba lagi.");
        setRegisterLoading(false);
        return;
      }

      setRegisterForm({ nama: "", email: "", password: "" });
      setRegisterShowPassword(false);
      setShowSuccessModal(true);
    } catch {
      setRegisterError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setRegisterLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setMode("login");
    setError("");
  };

  return (
    <>
      <main className="relative flex flex-1 overflow-y-auto px-4 py-8 sm:px-8 sm:py-10 md:w-1/2 md:bg-white md:px-12 md:py-12 lg:px-20 lg:py-14">
        <div className="login-fade-up m-auto w-full max-w-[440px] rounded-[24px] border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8 md:max-w-[480px] lg:max-w-[460px] md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
          {/* Mobile logo */}
          <div className="mb-6 flex flex-col items-center gap-2.5 md:hidden">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg shadow-black/20">
              <Image
                src="/Logo.webp"
                alt="Tamuin"
                width={44}
                height={35}
                className="object-contain"
                sizes="44px"
              />
            </div>
            <div className="text-center leading-tight">
              <p className="text-[17px] font-extrabold tracking-[0.06em] text-white">
                Tamuin
              </p>
              <p className="text-xs font-medium text-white/70">
                Tamu masuk, semua tercatat.
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6 text-center md:mb-7 md:text-left">
            <h2 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-4xl md:text-[36px] md:leading-[1.15] md:tracking-[-0.01em] md:text-[#0F172A] lg:text-[42px]">
              {mode === "login" ? "Selamat Datang" : "Buat Akun"}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/70 md:mt-3 md:text-base md:leading-relaxed md:text-[#64748B] lg:text-[17px]">
              {mode === "login"
                ? "Silakan masuk menggunakan akun Anda untuk melanjutkan."
                : "Daftar untuk membuat akun baru. Akun Anda perlu disetujui administrator sebelum dapat digunakan."}
            </p>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              {/* Email / Username */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-white md:text-[#0F172A]"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50 md:text-[#94A3B8]"
                    aria-hidden="true"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="Masukkan email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                    className={`${inputBase} ${error ? "!border-red-400/60 md:!border-red-400/60" : ""}`}
                    aria-invalid={!!error}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-white md:text-[#0F172A]"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50 md:text-[#94A3B8]"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                    className={`${inputBase} ${error ? "!border-red-400/60 md:!border-red-400/60" : ""}`}
                    aria-invalid={!!error}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/60 transition-colors duration-200 hover:text-white md:text-[#94A3B8] md:hover:text-[#0F172A]"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 rounded-xl border border-red-300/60 bg-red-100/90 px-4 py-3 text-sm font-medium text-red-700"
                >
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {error}
                </div>
              )}

              {/* Remember me + forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer select-none items-center gap-2.5 text-white/80 transition-colors hover:text-white md:text-[#475569] md:hover:text-[#0F172A]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-[18px] w-[18px] cursor-pointer rounded-md border-[#E6EAF2] bg-white/10 accent-[#1553D7] md:bg-white"
                  />
                  Ingat saya
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="font-semibold text-white/80 underline-offset-4 transition-colors duration-200 hover:text-white hover:underline md:text-[#1553D7] md:hover:text-[#0A357E]"
                >
                  Lupa Password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#1553D7] to-[#0A357E] text-base font-semibold text-white shadow-[0_8px_24px_rgba(21,83,215,0.20)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(21,83,215,0.28)] hover:brightness-[1.05] active:translate-y-0 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#1553D7]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 md:h-[56px]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  <>
                    Masuk
                    <ArrowRight
                      className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>

              {/* Bottom text */}
              <p className="pt-3 text-center text-sm text-white/70 md:pt-4 md:text-[#64748B]">
                Belum memiliki akun?{" "}
                <button
                  type="button"
                  onClick={switchToRegister}
                  className="font-semibold text-white underline-offset-4 transition-colors duration-200 hover:text-white hover:underline md:text-[#1553D7] md:hover:text-[#0A357E]"
                >
                  Buat Sekarang
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 md:space-y-5">
              {/* Nama */}
              <div>
                <label
                  htmlFor="reg-nama"
                  className="mb-2 block text-sm font-semibold text-white md:text-[#0F172A]"
                >
                  Nama
                </label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50 md:text-[#94A3B8]"
                    aria-hidden="true"
                  />
                  <input
                    id="reg-nama"
                    type="text"
                    autoComplete="name"
                    placeholder="Masukkan nama"
                    value={registerForm.nama}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, nama: e.target.value })
                    }
                    required
                    className={`${inputBase} ${registerError ? "!border-red-400/60 md:!border-red-400/60" : ""}`}
                    aria-invalid={!!registerError}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="reg-email"
                  className="mb-2 block text-sm font-semibold text-white md:text-[#0F172A]"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50 md:text-[#94A3B8]"
                    aria-hidden="true"
                  />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="username"
                    placeholder="Masukkan email"
                    value={registerForm.email}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, email: e.target.value })
                    }
                    required
                    className={`${inputBase} ${registerError ? "!border-red-400/60 md:!border-red-400/60" : ""}`}
                    aria-invalid={!!registerError}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="reg-password"
                  className="mb-2 block text-sm font-semibold text-white md:text-[#0F172A]"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50 md:text-[#94A3B8]"
                    aria-hidden="true"
                  />
                  <input
                    id="reg-password"
                    type={registerShowPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Minimal 8 karakter"
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, password: e.target.value })
                    }
                    required
                    minLength={8}
                    className={`${inputBase} ${registerError ? "!border-red-400/60 md:!border-red-400/60" : ""}`}
                    aria-invalid={!!registerError}
                  />
                  <button
                    type="button"
                    onClick={() => setRegisterShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/60 transition-colors duration-200 hover:text-white md:text-[#94A3B8] md:hover:text-[#0F172A]"
                    aria-label={registerShowPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {registerShowPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {registerError && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 rounded-xl border border-red-300/60 bg-red-100/90 px-4 py-3 text-sm font-medium text-red-700"
                >
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {registerError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={registerLoading}
                className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#1553D7] to-[#0A357E] text-base font-semibold text-white shadow-[0_8px_24px_rgba(21,83,215,0.20)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(21,83,215,0.28)] hover:brightness-[1.05] active:translate-y-0 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#1553D7]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 md:h-[56px]"
              >
                {registerLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Membuat Akun...
                  </span>
                ) : (
                  <>
                    <UserPlus
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                    Buat Akun
                  </>
                )}
              </button>

              {/* Bottom text */}
              <p className="pt-3 text-center text-sm text-white/70 md:pt-4 md:text-[#64748B]">
                Sudah punya akun?{" "}
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="font-semibold text-white underline-offset-4 transition-colors duration-200 hover:text-white hover:underline md:text-[#1553D7] md:hover:text-[#0A357E]"
                >
                  Masuk
                </button>
              </p>
            </form>
          )}
        </div>
      </main>

      {/* Success registration modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeSuccessModal} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
              <CheckCircle className="h-9 w-9 text-success" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-extrabold text-[#0F172A]">Berhasil!</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
              Registrasi akun berhasil. Mohon tunggu persetujuan administrator
              sebelum dapat masuk ke aplikasi.
            </p>
            <button
              type="button"
              onClick={closeSuccessModal}
              className="mt-6 h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#1553D7] to-[#0A357E] text-base font-semibold text-white shadow-[0_8px_24px_rgba(21,83,215,0.20)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:brightness-[1.05] active:translate-y-0 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#1553D7]/20"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
