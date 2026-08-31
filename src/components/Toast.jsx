"use client";

import { useCallback, useEffect, useState } from "react";

const icons = {
  success: (
    <svg className="w-5 h-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-danger shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-info shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
};

const styles = {
  success: "border-success/20 bg-success-muted",
  error: "border-danger/20 bg-danger-muted",
  info: "border-info/20 bg-info-muted",
  warning: "border-warning/20 bg-warning-muted",
};

const barStyles = {
  success: "bg-success",
  error: "bg-danger",
  info: "bg-info",
  warning: "bg-warning",
};

export default function Toast({ message, type = "success", duration = 3000, onClose }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const handleClose = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onClose(), 300);
  }, [onClose]);

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 10);
    const dismissTimer = setTimeout(() => handleClose(), duration);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration, handleClose]);

  return (
    <div
      className={`
        relative flex items-start gap-3 w-full max-w-sm px-4 py-3.5
        bg-surface border rounded-xl shadow-[var(--shadow-dialog)] overflow-hidden
        transition-all duration-300
        ${styles[type]}
        ${visible && !leaving ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      {icons[type]}
      <p className="text-sm text-foreground font-medium flex-1 leading-snug pt-0.5">{message}</p>
      <button
        onClick={handleClose}
        className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-variant transition-colors shrink-0 -m-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-border/30">
        <div
          className={`h-full ${barStyles[type]} transition-all ease-linear`}
          style={{
            width: visible && !leaving ? "0%" : "100%",
            transitionDuration: visible && !leaving ? `${duration}ms` : "0ms",
          }}
        />
      </div>
    </div>
  );
}
