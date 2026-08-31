export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  icon,
  disabled = false,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants = {
    primary:
      "bg-accent text-white shadow-sm hover:bg-accent-hover hover:shadow-[var(--shadow-lifted)]",
    tonal:
      "bg-primary-container text-on-primary-container hover:bg-primary-container/80",
    secondary:
      "bg-surface text-foreground border border-border hover:bg-surface-variant hover:border-border-hover",
    ghost: "bg-transparent text-accent hover:bg-accent-muted",
    danger: "bg-danger text-white hover:bg-danger/90 shadow-sm",
    success:
      "bg-success/10 hover:bg-success/15 text-success border border-success/20 hover:border-success/30",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="w-4 h-4 shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
