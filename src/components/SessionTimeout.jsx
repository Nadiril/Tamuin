"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useIdleTimer } from "@/hooks/useIdleTimer";

const TIMEOUT = 10 * 60 * 1000;

const WARNING_BEFORE = 60 * 1000;

function clearAuthStorage() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("sb-")) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith("sb-")) keys.push(key);
  }
  keys.forEach((key) => sessionStorage.removeItem(key));
}

function formatCountdown(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${seconds} detik`;
}

export default function SessionTimeout({ role = "admin" }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const supabaseRef = useRef(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    supabaseRef.current = createClient();
  }, []);

  const endSession = useCallback(async () => {
    try {
      await supabaseRef.current.auth.signOut();
    } catch {}

    clearAuthStorage();
  }, []);

  const handleTimeout = useCallback(() => {
    setExpired(true);
  }, []);

  const handleGoToLogin = useCallback(async () => {
    await endSession();
    routerRef.current.push("/");
  }, [endSession]);

  const handleForceLogout = useCallback(async () => {
    await endSession();
    routerRef.current.push("/");
  }, [endSession]);

  const { showWarning, remaining, extend, forceTimeout } = useIdleTimer({
    timeout: TIMEOUT,
    warningBefore: WARNING_BEFORE,
    onTimeout: handleTimeout,
    onForceTimeout: handleForceLogout,
    channelId: role,
  });

  if (expired) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-surface rounded-2xl p-6 w-full max-w-sm mx-4 shadow-[var(--shadow-dialog)] animate-fade-in text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-warning-muted flex items-center justify-center">
              <svg className="w-6 h-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Sesi Telah Berakhir</h3>
              <p className="text-sm text-muted mt-1 leading-relaxed">Sesi Anda telah berakhir karena tidak ada aktivitas. Silakan masuk kembali.</p>
            </div>
            <button
              onClick={handleGoToLogin}
              className="w-full h-11 rounded-xl bg-gradient-to-b from-accent to-accent-hover text-white text-sm font-semibold shadow-lg shadow-accent/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 cursor-pointer mt-2"
            >
              Mengerti
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl p-6 w-full max-w-sm mx-4 shadow-[var(--shadow-dialog)] animate-fade-in text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-warning-muted flex items-center justify-center">
            <svg className="w-6 h-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Sesi Akan Berakhir</h3>
            <p className="text-sm text-muted mt-1 leading-relaxed">Anda tidak melakukan aktivitas selama beberapa waktu. Sesi akan berakhir dalam:</p>
          </div>
          <div className="text-3xl font-bold text-warning tabular-nums">
            {formatCountdown(remaining)}
          </div>
          <div className="flex flex-col w-full gap-2 pt-2">
            <button
              onClick={extend}
              className="w-full h-11 rounded-xl bg-gradient-to-b from-accent to-accent-hover text-white text-sm font-semibold shadow-lg shadow-accent/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 cursor-pointer"
            >
              Perpanjang Sesi
            </button>
            <button
              onClick={forceTimeout}
              className="w-full h-11 rounded-xl border border-border text-sm font-semibold text-muted hover:text-foreground hover:bg-bg-secondary transition-colors cursor-pointer"
            >
              Logout Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
