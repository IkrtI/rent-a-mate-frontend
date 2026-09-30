"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { englishActivityName } from "@/lib/i18n/english-labels";
import { BookingCalendar } from "./booking-calendar";
import {
  availableStarts,
  bangkokNowMinutes,
  bangkokToday,
  clockTime,
  minutes,
} from "./time-selection";

type Activity = { id: number; name: string };
type Slot = { start: string; end: string };
type Props = { mateId: number; activities: Activity[]; initialDate: string; hourlyRate: number };
type AvailabilityState = "loading" | "ready" | "error";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function BookingEntry({ mateId, activities, initialDate, hourlyRate }: Props) {
  const router = useRouter();
  const today = bangkokToday();
  const [date, setDate] = useState(initialDate < today ? today : initialDate);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [availability, setAvailability] = useState<AvailabilityState>("loading");
  const [duration, setDuration] = useState(2);
  const [startTime, setStartTime] = useState("");
  const [activityId, setActivityId] = useState(activities[0]?.id ? String(activities[0].id) : "");
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [retry, setRetry] = useState(0);
  const starts =
    availability === "ready"
      ? availableStarts(slots, duration * 60, date === today ? bangkokNowMinutes() : 0)
      : [];

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/mates/${mateId}/availability?date=${encodeURIComponent(date)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Availability is unavailable.");
        const payload: unknown = await response.json();
        const data = isRecord(payload) ? (isRecord(payload.data) ? payload.data : payload) : null;
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
    if (!activityId || !startTime || !starts.includes(startTime)) {
      setError("Choose an activity and an available start time to continue.");
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
          startTime,
          endTime: clockTime(minutes(startTime) + duration * 60),
        }),
      });
      if (response.status === 401) {
        router.push(`/login?returnTo=${encodeURIComponent(`/mates/${mateId}`)}`);
        return;
      }
      if (response.status === 409) {
        setError("That time was just taken. Choose another available time.");
        setStartTime("");
        setAvailability("loading");
        setRetry((current) => current + 1);
        return;
      }
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const apiError = isRecord(payload) && isRecord(payload.error) ? payload.error : null;
        setError(
          response.status === 404
            ? "Booking requests are not available yet. Please try again later."
            : typeof apiError?.message === "string"
              ? apiError.message
              : "We couldn’t send your request. Please try again.",
        );
        return;
      }
      const data = isRecord(payload) ? (isRecord(payload.data) ? payload.data : payload) : null;
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
      <div>
        <p className="booking-step">1. Choose a day</p>
        <BookingCalendar
          onChange={(value) => {
            setDate(value);
            setAvailability("loading");
            setSlots([]);
            setStartTime("");
            setError("");
            setSuccessId(null);
          }}
          today={today}
          value={date}
        />
      </div>
      <label className="booking-field">
        <span>2. How long do you need your Mate?</span>
        <select
          onChange={(event) => {
            setDuration(Number(event.target.value));
            setStartTime("");
          }}
          value={duration}
        >
          {Array.from({ length: 15 }, (_, index) => (index + 2) / 2).map((hours) => (
            <option key={hours} value={hours}>
              {hours} {hours === 1 ? "hour" : "hours"}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="booking-times">
        <legend className="booking-step">3. Choose a start time</legend>
        {availability === "loading" && <p role="status">Loading times for {date}…</p>}
        {availability === "ready" && starts.length === 0 && (
          <p>
            No {duration}-hour times are open on this day. Try another day or a shorter duration.
          </p>
        )}
        {starts.length > 0 && (
          <div className="booking-time-grid">
            {starts.map((start) => (
              <button
                aria-pressed={startTime === start}
                key={start}
                onClick={() => {
                  setStartTime(start);
                  setError("");
                }}
                type="button"
              >
                {start}
              </button>
            ))}
          </div>
        )}
      </fieldset>
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
                {englishActivityName(item.name)}
              </option>
            ))}
          </select>
        </label>
      )}
      {startTime && starts.includes(startTime) && (
        <p className="booking-selection" role="status">
          {date} · {startTime}–{clockTime(minutes(startTime) + duration * 60)}
        </p>
      )}
      <p className="booking-cost">
        Estimated total <strong>฿{(hourlyRate * duration).toLocaleString("en-US")}</strong>
      </p>
      {error && (
        <p className="booking-error" role="alert">
          {error}
        </p>
      )}
      {successId !== null && (
        <p className="booking-success" role="status">
          Booking request sent successfully. The Mate will confirm it soon.{" "}
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
          pending || successId !== null || !starts.includes(startTime) || activities.length === 0
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
