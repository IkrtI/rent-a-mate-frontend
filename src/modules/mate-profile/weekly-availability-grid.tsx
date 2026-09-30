"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { clockTime, minutes } from "./time-selection";

export type WeeklySlot = { dayOfWeek: number; startTime: string; endTime: string };

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
type GridDay = { dayOfWeek: number; label: string };
export type AvailabilityDrag = {
  day: number;
  first: number;
  last: number;
  mode: "add" | "remove";
};

export function applyAvailabilityDrag(slots: WeeklySlot[], selection: AvailabilityDrag) {
  const start = Math.min(selection.first, selection.last) * 30;
  const end =
    Math.max(selection.first, selection.last) * 30 + (selection.first === selection.last ? 30 : 0);
  const sameDay = slots.filter((slot) => slot.dayOfWeek === selection.day);
  const otherDays = slots.filter((slot) => slot.dayOfWeek !== selection.day);
  const sortSlots = (items: WeeklySlot[]) =>
    items.sort((a, b) => a.dayOfWeek - b.dayOfWeek || minutes(a.startTime) - minutes(b.startTime));

  if (selection.mode === "remove") {
    const remaining = sameDay.flatMap((slot) => {
      const slotStart = minutes(slot.startTime);
      const slotEnd = minutes(slot.endTime);
      if (slotStart >= end || slotEnd <= start) return [slot];
      return [
        ...(slotStart < start ? [{ ...slot, endTime: clockTime(Math.min(start, slotEnd)) }] : []),
        ...(slotEnd > end ? [{ ...slot, startTime: clockTime(Math.max(end, slotStart)) }] : []),
      ];
    });
    return sortSlots([...otherDays, ...remaining]);
  }

  const ordered = [
    ...sameDay,
    {
      dayOfWeek: selection.day,
      startTime: clockTime(start),
      endTime: clockTime(end),
    },
  ].sort((a, b) => minutes(a.startTime) - minutes(b.startTime));
  const merged: WeeklySlot[] = [];
  for (const slot of ordered) {
    const previous = merged.at(-1);
    if (previous && minutes(slot.startTime) <= minutes(previous.endTime)) {
      previous.endTime = clockTime(Math.max(minutes(previous.endTime), minutes(slot.endTime)));
    } else merged.push({ ...slot });
  }
  return sortSlots([...otherDays, ...merged]);
}

export function WeeklyAvailabilityGrid({
  slots,
  onChange,
  disabled,
  days,
}: {
  slots: WeeklySlot[];
  onChange: (slots: WeeklySlot[]) => void;
  disabled: boolean;
  days?: GridDay[];
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<AvailabilityDrag | null>(null);
  const [preview, setPreview] = useState<AvailabilityDrag | null>(null);
  const visibleDays = days ?? dayNames.map((label, index) => ({ dayOfWeek: index + 1, label }));

  useEffect(() => {
    if (viewport.current) viewport.current.scrollTop = 16 * 32;
  }, []);

  const finish = useCallback(() => {
    const selection = drag.current;
    drag.current = null;
    setPreview(null);
    if (!selection) return;
    onChange(applyAvailabilityDrag(slots, selection));
  }, [onChange, slots]);

  useEffect(() => {
    window.addEventListener("pointerup", finish);
    return () => window.removeEventListener("pointerup", finish);
  }, [finish]);

  return (
    <div className="availability-grid-wrap">
      <p className="text-sm text-neutral-600">
        Drag across empty time to add hours. Start on a red block and drag to remove those hours.
        Edit or remove whole blocks below.
      </p>
      <div
        className="availability-grid-head"
        aria-hidden="true"
        style={{ gridTemplateColumns: `48px repeat(${visibleDays.length}, minmax(0, 1fr))` }}
      >
        <span />
        {visibleDays.map((day) => (
          <strong key={day.dayOfWeek}>{day.label}</strong>
        ))}
      </div>
      <div className="availability-grid-viewport" ref={viewport}>
        <div
          className="availability-grid"
          aria-hidden="true"
          onPointerCancel={() => {
            drag.current = null;
            setPreview(null);
          }}
          onPointerUp={finish}
        >
          {Array.from({ length: 47 }, (_, index) => (
            <div
              className="availability-grid-row"
              key={index}
              style={{ gridTemplateColumns: `48px repeat(${visibleDays.length}, minmax(0, 1fr))` }}
            >
              <span className="availability-grid-hour" aria-hidden="true">
                {index % 2 === 0 ? clockTime(index * 30) : ""}
              </span>
              {visibleDays.map((day) => {
                const dayOfWeek = day.dayOfWeek;
                const selected = slots.some(
                  (slot) =>
                    slot.dayOfWeek === dayOfWeek &&
                    minutes(slot.startTime) < (index + 1) * 30 &&
                    minutes(slot.endTime) > index * 30,
                );
                const inPreview =
                  preview?.day === dayOfWeek &&
                  index >= Math.min(preview.first, preview.last) &&
                  index <
                    Math.max(preview.first, preview.last) +
                      (preview.first === preview.last ? 1 : 0);
                const className = inPreview
                  ? preview?.mode === "remove"
                    ? "is-removing"
                    : "is-selected"
                  : selected
                    ? "is-selected"
                    : "";
                return (
                  <button
                    aria-label={`${day.label} ${clockTime(index * 30)} to ${clockTime((index + 1) * 30)}`}
                    className={className}
                    disabled={disabled}
                    key={day.dayOfWeek}
                    onPointerDown={(event) => {
                      if (event.pointerType === "touch") return;
                      event.preventDefault();
                      drag.current = {
                        day: dayOfWeek,
                        first: index,
                        last: index,
                        mode: selected ? "remove" : "add",
                      };
                      setPreview(drag.current);
                    }}
                    onPointerEnter={() => {
                      if (drag.current?.day !== dayOfWeek) return;
                      drag.current = { ...drag.current, last: index };
                      setPreview(drag.current);
                    }}
                    tabIndex={-1}
                    type="button"
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-neutral-600">Keyboard or touch: use the time fields below.</p>
    </div>
  );
}
