export default function Navbar({ title, subtitle, actions }) {
  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl border-b border-outline-variant shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-14 lg:h-16 pl-14 lg:pl-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-foreground leading-tight truncate tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}