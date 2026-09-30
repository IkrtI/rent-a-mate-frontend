export type TimeWindow = { start: string; end: string };

export function minutes(time: string) {
  const [hours, minute] = time.split(":").map(Number);
  return hours * 60 + minute;
}

export function clockTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export function availableStarts(windows: TimeWindow[], durationMinutes: number, earliest = 0) {
  const starts = new Set<number>();
  for (const window of windows) {
    const first = Math.ceil(Math.max(minutes(window.start), earliest) / 30) * 30;
    const last = minutes(window.end) - durationMinutes;
    for (let start = first; start <= last; start += 30) starts.add(start);
  }
  return [...starts].sort((a, b) => a - b).map(clockTime);
}

export function bangkokToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

export function bangkokNowMinutes() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  return (
    Number(parts.find((part) => part.type === "hour")?.value) * 60 +
    Number(parts.find((part) => part.type === "minute")?.value) +
    1
  );
}
