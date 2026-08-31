"use client";

import { useActivitiesQuery } from "@/lib/queries/useActivitiesQuery";
import {
  LogIn,
  CalendarPlus,
  CalendarSync,
  CalendarX,
  UserPlus,
  UserPen,
  UserX,
  ScanLine,
  Download,
  Upload,
  Trash2,
} from "lucide-react";

const actionConfig = {
  login: { icon: LogIn, color: "text-info", bg: "bg-info-muted" },
  create_event: { icon: CalendarPlus, color: "text-accent", bg: "bg-accent-muted" },
  update_event: { icon: CalendarSync, color: "text-warning", bg: "bg-warning-muted" },
  delete_event: { icon: CalendarX, color: "text-danger", bg: "bg-danger-muted" },
  create_guest: { icon: UserPlus, color: "text-success", bg: "bg-success-muted" },
  update_guest: { icon: UserPen, color: "text-warning", bg: "bg-warning-muted" },
  delete_guest: { icon: UserX, color: "text-danger", bg: "bg-danger-muted" },
  scan_guest: { icon: ScanLine, color: "text-accent", bg: "bg-accent-muted" },
  guest_scanned: { icon: ScanLine, color: "text-success", bg: "bg-success-muted" },
  guest_self_scanned: { icon: ScanLine, color: "text-success", bg: "bg-success-muted" },
  scan_rejected_event_ended: { icon: ScanLine, color: "text-danger", bg: "bg-danger-muted" },
  export_laporan: { icon: Download, color: "text-info", bg: "bg-info-muted" },
  import_guest: { icon: Upload, color: "text-success", bg: "bg-success-muted" },
  clear_activities: { icon: Trash2, color: "text-danger", bg: "bg-danger-muted" },
};

export default function ActivityFeed({ limit = 10 }) {
  const { data: activities = [] } = useActivitiesQuery();

  const recent = activities.slice(0, limit);

  const fmtTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "baru saja";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  if (recent.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted">Belum ada aktivitas</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {recent.map((a) => {
        const cfg = actionConfig[a.action] || { icon: LogIn, color: "text-muted", bg: "bg-surface-variant" };
        const Icon = cfg.icon;
        return (
          <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-card-hover transition-colors min-h-[56px]">
            <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${cfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">{a.detail}</p>
              <p className="text-xs text-muted mt-0.5">{fmtTime(a.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
