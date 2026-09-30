"use client";

import { useState } from "react";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function asUtcDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function BookingCalendar({
  value,
  today,
  onChange,
}: {
  value: string;
  today: string;
  onChange: (value: string) => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => value.slice(0, 7));
  const first = asUtcDate(`${visibleMonth}-01`);
  const offset = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const monthLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(first);

  function moveMonth(amount: number) {
    setVisibleMonth((current) => {
      const next = asUtcDate(`${current}-01`);
      next.setUTCMonth(next.getUTCMonth() + amount);
      return dateKey(next).slice(0, 7);
    });
  }

  return (
    <div className="booking-calendar" aria-label="Booking date calendar">
      <div className="booking-calendar-heading">
        <strong>{monthLabel}</strong>
        <div>
          <button
            aria-label="Previous month"
            disabled={visibleMonth <= today.slice(0, 7)}
            onClick={() => moveMonth(-1)}
            type="button"
          >
            ‹
          </button>
          <button aria-label="Next month" onClick={() => moveMonth(1)} type="button">
            ›
          </button>
        </div>
      </div>
      <div className="booking-calendar-grid">
        {weekdays.map((day) => (
          <span className="booking-calendar-weekday" key={day}>
            {day}
          </span>
        ))}
        {Array.from({ length: offset }, (_, index) => (
          <span aria-hidden="true" key={`blank-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = String(index + 1).padStart(2, "0");
          const key = `${visibleMonth}-${day}`;
          return (
            <button
              aria-label={new Intl.DateTimeFormat("en", {
                dateStyle: "full",
                timeZone: "UTC",
              }).format(asUtcDate(key))}
              aria-pressed={key === value}
              disabled={key < today}
              key={key}
              onClick={() => onChange(key)}
              type="button"
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
