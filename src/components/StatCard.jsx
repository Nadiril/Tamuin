export default function StatCard({ title, value = 0, caption, icon, color = "accent" }) {
  const colorMap = {
    accent: {
      bg: "bg-accent-muted",
      icon: "text-accent",
    },
    success: {
      bg: "bg-success-muted",
      icon: "text-success",
    },
    warning: {
      bg: "bg-warning-muted",
      icon: "text-warning",
    },
    info: {
      bg: "bg-info-muted",
      icon: "text-info",
    },
  };

  const c = colorMap[color] || colorMap.accent;
  const numericValue = typeof value === "number" ? value : Number(value) || 0;

  return (
    <div className="glass-card rounded-2xl p-5 hover:border-border-hover transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground tracking-tight mt-1 tabular-nums">
            {numericValue}
          </p>
          {caption && (
            <p className="text-xs text-muted mt-0.5">{caption}</p>
          )}
        </div>
        <div
          className={`${c.bg} ${c.icon} p-2.5 rounded-xl shrink-0 group-hover:scale-105 transition-transform duration-200`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
