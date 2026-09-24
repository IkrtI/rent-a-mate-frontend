"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Clock3 } from "lucide-react";

type Activity = { id: number; name: string };
type Slot = { start: string; end: string };
type Props = { mateId: number; activities: Activity[]; initialDate: string; hourlyRate: number };
type AvailabilityState = "loading" | "ready" | "error";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getBangkokDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

export function BookingEntry({ mateId, activities, initialDate, hourlyRate }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [availability, setAvailability] = useState<AvailabilityState>("loading");
  const [slot, setSlot] = useState("");
  const [activityId, setActivityId] = useState(activities[0]?.id ? String(activities[0].id) : "");
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/v1/mates/${mateId}/availability?date=${encodeURIComponent(date)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Availability is unavailable.");
        const payload: unknown = await response.json();
        const data = isRecord(payload) && isRecord(payload.data) ? payload.data : null;
        const openSlots =
          data && Array.isArray(data.openSlots)
            ? data.openSlots.filter(
                (value): value is Slot =>
                  isRecord(value) &&
                  typeof value.start === "string" &&
                  typeof value.end === "string",
              )
            : null;
        if (!openSlots) throw new Error("Availability is unavailable.");
        setSlots(openSlots);
        setAvailability("ready");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setAvailability("error");
        setError(cause instanceof Error ? cause.message : "We couldn’t load availability.");
      });
    return () => controller.abort();
  }, [date, mateId, retry]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessId(null);
    if (!activityId || !slot) {
      setError("Choose an activity and an available time to continue.");
      return;
    }
    const selected = slots.find((item) => `${item.start}-${item.end}` === slot);
    if (!selected || selected.end <= selected.start) {
      setError("That time is no longer available. Choose another time.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          mateId,
          activityId: Number(activityId),
          date,
          startTime: selected.start,
          endTime: selected.end,
        }),
      });
      if (response.status === 401) {
        router.push(`/login?returnTo=${encodeURIComponent(`/mates/${mateId}`)}`);
        return;
      }
      if (response.status === 409) {
        setError("That time was just taken. Choose another available time.");
        return;
      }
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          response.status === 404
            ? "Booking requests are not available yet. Please try again later."
            : "We couldn’t send your request. Please try again.",
        );
        return;
      }
      const data = isRecord(payload) && isRecord(payload.data) ? payload.data : null;
      if (!data || typeof data.id !== "number") {
        setError("We couldn’t confirm your request. Please try again.");
        return;
      }
      setSuccessId(data.id);
    } catch {
      setError("We couldn’t send your request. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="booking-form" onSubmit={submit}>
      <label className="booking-field">
        <span>
          <CalendarDays aria-hidden="true" size={15} /> Select a date
        </span>
        <input
          min={getBangkokDate()}
          onChange={(event) => {
            setDate(event.target.value);
            setAvailability("loading");
            setSlots([]);
            setSlot("");
            setError("");
            setSuccessId(null);
          }}
          required
          type="date"
          value={date}
        />
      </label>
      <label className="booking-field">
        <span>
          <Clock3 aria-hidden="true" size={15} /> Available time
        </span>
        <select
          disabled={availability !== "ready" || slots.length === 0}
          onChange={(event) => setSlot(event.target.value)}
          required
          value={slot}
        >
          <option value="">
            {availability === "loading"
              ? "Loading times…"
              : availability === "error"
                ? "Could not load times"
                : slots.length
                  ? "Choose an available time"
                  : "No times available"}
          </option>
          {slots.map((item) => (
            <option key={`${item.start}-${item.end}`} value={`${item.start}-${item.end}`}>
              {item.start} – {item.end}
            </option>
          ))}
        </select>
      </label>
      {activities.length > 0 && (
        <label className="booking-field">
          <span>Activity</span>
          <select
            onChange={(event) => setActivityId(event.target.value)}
            required
            value={activityId}
          >
            {activities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="booking-cost">
        Rate <strong>฿{hourlyRate.toLocaleString("en-US")} / hour</strong>
      </p>
      {error && (
        <p className="booking-error" role="alert">
          {error}
        </p>
      )}
      {successId !== null && (
        <p className="booking-success" role="status">
          Request #{successId} sent. It will be confirmed when the Mate accepts.{" "}
          <Link href={`/bookings/${successId}`}>View booking</Link>
        </p>
      )}
      {availability === "error" && (
        <button
          className="booking-retry"
          onClick={() => {
            setAvailability("loading");
            setError("");
            setRetry((current) => current + 1);
          }}
          type="button"
        >
          Retry availability
        </button>
      )}
      <button
        className="button booking-button"
        disabled={
          pending || availability !== "ready" || slots.length === 0 || activities.length === 0
        }
        type="submit"
      >
        {pending ? "Sending request…" : "Send booking request"}
      </button>
      <p className="booking-note">
        You won’t be charged yet. Sign in is required to request a booking.
      </p>
    </form>
  );
}
