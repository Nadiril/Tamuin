export default function Input({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  error,
  icon,
  className = "",
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-on-surface">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          className={`h-10 w-full rounded-[10px] bg-surface border border-input-border px-4 text-sm text-foreground placeholder:text-muted/60
            focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-input-focus
            transition-all duration-200
            ${icon ? "pl-10" : ""}
            ${error ? "border-error focus:ring-error/50 focus:border-error" : ""}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-error mt-0.5">{error}</p>}
    </div>
  );
}