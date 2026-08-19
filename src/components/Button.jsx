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
    "inline-flex items-center justify-center gap-2 font-medium rounded-[10px] transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants = {
    // Material 3: Filled
    primary:
      "bg-primary text-on-primary shadow-sm hover:bg-accent-hover hover:shadow-[var(--shadow-lifted)]",
    // Material 3: Tonal
    tonal:
      "bg-primary-container text-on-primary-container hover:brightness-[0.97]",
    // Material 3: Outlined
    secondary:
      "bg-surface text-foreground border border-outline hover:bg-surface-variant hover:border-border-hover",
    // Material 3: Text
    ghost: "bg-transparent text-accent hover:bg-accent-muted",
    // Material 3: Filled error
    danger: "bg-error text-on-error hover:brightness-[0.95] shadow-sm",
    success: "bg-success/10 hover:bg-success/20 text-success border border-success/20 hover:border-success/40",
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