"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Scanner, useDevices } from "@yudiel/react-qr-scanner";
import "@/lib/zxing";

export default function QRScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const mountedRef = useRef(true);
  const [scanState, setScanState] = useState("loading");
  const [facingMode, setFacingMode] = useState("environment");
  const loadingTimeoutRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (scanState !== "loading") return;
    loadingTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setScanState("idle");
    }, 1000);
    return () => clearTimeout(loadingTimeoutRef.current);
  }, [scanState]);

  const devices = useDevices();
  const videoDevices = useMemo(() => devices.filter((d) => d.kind === "videoinput"), [devices]);
  const hasMultipleCameras = videoDevices.length > 1;

  const constraints = useMemo(() => ({
    facingMode,
    width: { ideal: 640, max: 640 },
    height: { ideal: 480, max: 480 },
  }), [facingMode]);

  const handleScan = useCallback(
    (codes) => {
      if (onScan) onScan(codes);
      setScanState("idle"); // admin page doesn't need scanning flash, just keep idle
    },
    [onScan],
  );

  const handleError = useCallback(
    (err) => {
      if (!mountedRef.current) return;
      if (!err || typeof err !== 'object' || Object.keys(err).length === 0) return;
      setScanState("error");
      if (onError) onError(err);
    },
    [onError],
  );

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    setScanState("loading");
  }, []);

  const getStatusText = () => {
    switch (scanState) {
      case "loading":
        return "Mengaktifkan kamera...";
      case "idle":
        return "Posisikan QR Code di dalam kotak untuk melakukan pemindaian.";
      case "scanning":
        return "Memindai QR Code...";
      case "error":
        return "Gagal mengakses kamera";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-[340px] mx-auto">
        <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-black">
          {scanState === "loading" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
              <div className="w-8 h-8 border-2 border-white/60 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-white/60">Mengaktifkan kamera...</p>
            </div>
          )}

          {videoDevices.length === 0 && scanState !== "loading" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
              <p className="text-sm text-white/60">Kamera tidak tersedia</p>
            </div>
          )}

          <Scanner
            ref={scannerRef}
            onScan={handleScan}
            onError={handleError}
            formats={["qr_code"]}
            constraints={constraints}
            paused={scanState === "loading"}
            components={{ finder: false }}
            styles={{
              container: { width: "100%", height: "100%" },
              video: {
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: facingMode === "environment" ? "scaleX(1)" : "scaleX(-1)",
              },
            }}
            scanDelay={300}
            retryDelay={100}
            startTimeoutMs={5000}
          >
            {scanState !== "loading" && (
              <>
                <div className="absolute inset-0">
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] pb-[75%] rounded-2xl"
                    style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }}
                  />
                </div>

                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-[12.5%] left-[12.5%] w-5 h-5 border-t-[3px] border-l-[3px] border-white/90 rounded-tl-md" />
                  <div className="absolute top-[12.5%] right-[12.5%] w-5 h-5 border-t-[3px] border-r-[3px] border-white/90 rounded-tr-md" />
                  <div className="absolute bottom-[12.5%] left-[12.5%] w-5 h-5 border-b-[3px] border-l-[3px] border-white/90 rounded-bl-md" />
                  <div className="absolute bottom-[12.5%] right-[12.5%] w-5 h-5 border-b-[3px] border-r-[3px] border-white/90 rounded-br-md" />
                </div>
              </>
            )}
          </Scanner>
        </div>
      </div>

      <p className="text-sm text-center text-muted max-w-xs">
        {getStatusText()}
      </p>

      <div className="flex items-center gap-3">
        {hasMultipleCameras && (
          <button
            onClick={toggleCamera}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-muted hover:text-foreground bg-input/50 hover:bg-input border border-border rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Ganti Kamera
          </button>
        )}
      </div>
    </div>
  );
}
