const TIME_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  hourCycle: "h23",
  timeZone: "Asia/Jakarta",
});

export function formatTime(dateStr, { fallback = "—" } = {}) {
  if (!dateStr) return fallback;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return fallback;
  return TIME_FORMATTER.format(date).replace(".", ":");
}
