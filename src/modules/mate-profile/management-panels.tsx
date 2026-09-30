"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";

import {
  requestSameOrigin,
  requestSameOriginUpload,
  BrowserClientError,
} from "@/modules/backend-client/browser";
import {
  availabilitySlotSchema,
  dateAvailabilityOverrideSchema,
  dateAvailabilityOverridesSchema,
  mateAvailabilitySchema,
  mateProfileSchema,
  mateResultSchema,
  replaceDateAvailabilitySchema,
  replaceAvailabilitySchema,
} from "./schemas";
import type { MateProfile } from "./schemas";
import {
  englishActivityName,
  englishInterestName,
  englishLookupName,
} from "@/lib/i18n/english-labels";
import { cropBlob, drawSquareCrop } from "./photo-crop";
import { WeeklyAvailabilityGrid } from "./weekly-availability-grid";
import { BookingCalendar } from "./booking-calendar";
import { bangkokToday, isCurrentOrFutureDate } from "./time-selection";

type Lookup = { id: number; name: string };
type ProfileProps = {
  mate: MateProfile | null;
  activities: Lookup[];
  interests: Lookup[];
  provinces: Lookup[];
  districts: Lookup[];
  lookupError: boolean;
  loadError: boolean;
};
function errorText(error: unknown) {
  return error instanceof BrowserClientError
    ? error.message
    : "We couldn’t save your changes. Please try again.";
}
function ids(items: Lookup[]) {
  return items.map(({ id }) => id);
}

export function ProfileEditor({
  mate,
  activities,
  interests,
  provinces,
  districts: initialDistricts,
  lookupError,
}: ProfileProps) {
  const router = useRouter();
  const [provinceId, setProvinceId] = useState(String(mate?.province.id ?? ""));
  const [districts, setDistricts] = useState(initialDistricts);
  const [districtsForProvince, setDistrictsForProvince] = useState(String(mate?.province.id ?? ""));
  const [districtId, setDistrictId] = useState(String(mate?.district.id ?? ""));
  const [profileExists, setProfileExists] = useState(mate !== null);
  const [profileActive, setProfileActive] = useState(mate?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!provinceId || provinceId === districtsForProvince) return;
    const controller = new AbortController();
    fetch(`/api/provinces/${provinceId}/districts`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload: { items?: Lookup[] }) => {
        setDistricts(
          (payload.items ?? []).map((item) => ({ ...item, name: englishLookupName(item.name) })),
        );
        setDistrictsForProvince(provinceId);
      })
      .catch(() => {
        if (!controller.signal.aborted) setDistricts([]);
      });
    return () => controller.abort();
  }, [districtsForProvince, provinceId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const input = {
      age: Number(form.get("age")),
      bio: String(form.get("bio") ?? "").trim() || undefined,
      hourlyRate: Number(form.get("hourlyRate")),
      provinceId: Number(provinceId),
      districtId: Number(districtId),
      activityIds: form.getAll("activityIds").map(Number),
      interestIds: form.getAll("interestIds").map(Number),
    };
    try {
      const body = JSON.stringify(input);
      const result = await requestSameOrigin(
        profileExists ? "/api/mates/me" : "/api/mates",
        mateResultSchema,
        profileExists ? { method: "PATCH", body } : { method: "POST", body },
      );
      setProfileExists(true);
      setProfileActive(result.mate.isActive);
      setMessage("Profile saved.");
      if (!profileExists) router.refresh();
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }
  async function deactivate() {
    if (!window.confirm("Deactivate your Mate profile? It will no longer appear in discovery."))
      return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await requestSameOrigin("/api/mates/me", z.object({ isActive: z.boolean() }), {
        method: "DELETE",
      });
      setProfileActive(result.isActive);
      setMessage("Profile deactivated. Contact support if you want to reactivate it.");
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="border-border bg-card text-card-foreground mx-auto max-w-3xl rounded-2xl border p-6 shadow-sm sm:p-8">
      <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit}>
        {lookupError && (
          <div
            className="text-foreground flex flex-wrap items-center gap-3 text-sm sm:col-span-2"
            role="alert"
          >
            <span>Some profile options could not load. Retry before changing your profile.</span>
            <button
              className="font-semibold underline"
              onClick={() => window.location.reload()}
              type="button"
            >
              Retry options
            </button>
          </div>
        )}
        <label className="grid gap-2 text-sm font-semibold">
          Age
          <input
            className="rounded-lg border border-neutral-300 px-3 py-2"
            defaultValue={mate?.age ?? ""}
            min="18"
            max="120"
            name="age"
            required
            type="number"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Hourly rate (THB)
          <input
            className="rounded-lg border border-neutral-300 px-3 py-2"
            defaultValue={mate?.hourlyRate ?? ""}
            min="0.01"
            name="hourlyRate"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Province
          <select
            className="rounded-lg border border-neutral-300 px-3 py-2"
            onChange={(event) => {
              setProvinceId(event.target.value);
              setDistrictId("");
            }}
            required
            value={provinceId}
          >
            <option value="">Choose province</option>
            {provinces.map((item) => (
              <option key={item.id} value={item.id}>
                {englishLookupName(item.name)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          District
          <select
            className="rounded-lg border border-neutral-300 px-3 py-2"
            disabled={!provinceId}
            onChange={(event) => setDistrictId(event.target.value)}
            required
            value={districtId}
          >
            <option value="">Choose district</option>
            {districts.map((item) => (
              <option key={item.id} value={item.id}>
                {englishLookupName(item.name)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
          About you
          <textarea
            className="min-h-32 rounded-lg border border-neutral-300 px-3 py-2"
            defaultValue={mate?.bio ?? ""}
            maxLength={2000}
            name="bio"
            placeholder="Share what you enjoy doing with renters."
          />
        </label>
        <fieldset className="grid content-start gap-2 text-sm font-semibold">
          <legend>Activities you offer</legend>
          <div className="flex flex-wrap gap-2">
            {activities.map((item) => (
              <label className="profile-option" key={item.id}>
                <input
                  defaultChecked={ids(mate?.activities ?? []).includes(item.id)}
                  name="activityIds"
                  type="checkbox"
                  value={item.id}
                />
                <span>{englishActivityName(item.name)}</span>
              </label>
            ))}
            {activities.length === 0 && (
              <span className="text-xs font-normal text-neutral-500">
                No activity options available.
              </span>
            )}
          </div>
        </fieldset>
        <fieldset className="grid content-start gap-2 text-sm font-semibold">
          <legend>Interests</legend>
          <div className="flex flex-wrap gap-2">
            {interests.map((item) => (
              <label className="profile-option" key={item.id}>
                <input
                  defaultChecked={ids(mate?.interests ?? []).includes(item.id)}
                  name="interestIds"
                  type="checkbox"
                  value={item.id}
                />
                <span>{englishInterestName(item.name)}</span>
              </label>
            ))}
            {interests.length === 0 && (
              <span className="text-xs font-normal text-neutral-500">
                No interest options available.
              </span>
            )}
          </div>
        </fieldset>
        {error && (
          <p className="text-destructive text-sm sm:col-span-2" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="text-foreground text-sm sm:col-span-2" role="status">
            {message}
          </p>
        )}
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            className="button"
            disabled={busy || lookupError || (profileExists && !profileActive)}
            type="submit"
          >
            {busy ? "Saving…" : profileExists ? "Save profile" : "Create profile"}
          </button>
          {profileExists && profileActive && (
            <button
              className="border-destructive text-destructive rounded-lg border px-4 py-2 text-sm font-semibold"
              disabled={busy}
              onClick={deactivate}
              type="button"
            >
              Deactivate profile
            </button>
          )}
        </div>
        {profileExists && !profileActive && (
          <p className="text-foreground text-sm sm:col-span-2">
            This profile is inactive and hidden from discovery.
          </p>
        )}
      </form>
    </section>
  );
}

export function PhotosEditor({ mate }: { mate: MateProfile }) {
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState(mate.photos);
  const [file, setFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [horizontal, setHorizontal] = useState(50);
  const [vertical, setVertical] = useState(50);
  const [previewReady, setPreviewReady] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const image = useRef<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!file) {
      image.current = null;
      return;
    }
    const url = URL.createObjectURL(file);
    const loaded = new window.Image();
    loaded.onload = () => {
      image.current = loaded;
      setPreviewReady(true);
    };
    loaded.onerror = () => setError("We couldn’t open that image. Choose another file.");
    loaded.src = url;
    return () => {
      URL.revokeObjectURL(url);
      image.current = null;
      setPreviewReady(false);
    };
  }, [file]);
  useEffect(() => {
    if (previewReady && canvas.current && image.current) {
      drawSquareCrop(canvas.current, image.current, zoom, horizontal, vertical);
    }
  }, [horizontal, previewReady, vertical, zoom]);
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const formElement = event.currentTarget;
    if (!file || !previewReady || !canvas.current) {
      setError("Choose an image and wait for its preview.");
      setBusy(false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be 5 MB or smaller.");
      setBusy(false);
      return;
    }
    try {
      const cropped = await cropBlob(canvas.current);
      const body = new FormData();
      body.append(
        "photo",
        new File([cropped], `${file.name.replace(/\.[^.]+$/, "")}-crop.jpg`, {
          type: "image/jpeg",
        }),
      );
      setUploadProgress(0);
      const result = await requestSameOriginUpload(
        "/api/mates/me/photos",
        z.object({ photo: mateProfileSchema.shape.photos.element }),
        body,
        setUploadProgress,
      );
      setPhotos((current) => [...current, result.photo].sort((a, b) => a.sortOrder - b.sortOrder));
      await queryClient.invalidateQueries({ queryKey: ["mate-profile"] });
      formElement.reset();
      setFile(null);
      setZoom(1);
      setHorizontal(50);
      setVertical(50);
      setMessage("Photo added.");
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
      setUploadProgress(null);
    }
  }
  async function remove(id: number) {
    if (!window.confirm("Remove this photo from your Mate profile?")) return;
    setBusy(true);
    setError("");
    try {
      await requestSameOrigin(`/api/mates/me/photos/${id}`, z.unknown(), { method: "DELETE" });
      setPhotos((current) => current.filter((photo) => photo.id !== id));
      await queryClient.invalidateQueries({ queryKey: ["mate-profile"] });
      setMessage("Photo removed.");
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="border-border bg-card text-card-foreground mx-auto grid max-w-4xl gap-6 rounded-2xl border p-6 shadow-sm sm:p-8">
      <p className="text-sm text-neutral-600">
        Add up to six photos. Choose a file, adjust the square crop, then upload. Files must be 5 MB
        or smaller.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {photos.map((photo) => (
          <article className="grid gap-2" key={photo.id}>
            <Image
              alt="Mate profile photo"
              className="aspect-square w-full rounded-xl object-cover"
              height={480}
              src={photo.url}
              unoptimized
              width={480}
            />
            <button
              className="border-destructive text-destructive rounded-lg border px-3 py-2 text-sm font-semibold"
              disabled={busy || !mate.isActive}
              onClick={() => void remove(photo.id)}
              type="button"
            >
              Remove photo
            </button>
          </article>
        ))}
      </div>
      {mate.isActive && photos.length < 6 && (
        <form className="grid gap-4 border-t border-neutral-200 pt-5" onSubmit={upload}>
          <label className="grid gap-2 text-sm font-semibold">
            Image file
            <input
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="rounded-lg border border-neutral-300 p-2"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setPreviewReady(false);
                setError("");
              }}
              name="photo"
              type="file"
            />
          </label>
          {file && (
            <div className="photo-crop-layout">
              <div>
                <canvas
                  aria-label="Photo crop preview"
                  className="photo-crop-preview"
                  height={600}
                  ref={canvas}
                  role="img"
                  width={600}
                />
                {!previewReady && (
                  <p className="text-sm text-neutral-600" role="status">
                    Preparing preview…
                  </p>
                )}
              </div>
              <div className="grid content-start gap-4">
                <label className="grid gap-1 text-sm font-semibold">
                  Zoom
                  <input
                    max="3"
                    min="1"
                    onChange={(event) => setZoom(Number(event.target.value))}
                    step="0.05"
                    type="range"
                    value={zoom}
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Move left or right
                  <input
                    max="100"
                    min="0"
                    onChange={(event) => setHorizontal(Number(event.target.value))}
                    type="range"
                    value={horizontal}
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Move up or down
                  <input
                    max="100"
                    min="0"
                    onChange={(event) => setVertical(Number(event.target.value))}
                    type="range"
                    value={vertical}
                  />
                </label>
                <p className="text-xs text-neutral-600">
                  The square preview is the image that will be uploaded.
                </p>
              </div>
            </div>
          )}
          {uploadProgress !== null && (
            <div
              aria-label="Photo upload progress"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={uploadProgress}
              role="progressbar"
            >
              <div className="h-2 rounded-full bg-rose-100">
                <div
                  className="h-2 rounded-full bg-rose-500"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-neutral-600">Uploading: {uploadProgress}%</p>
            </div>
          )}
          <button
            className="button justify-self-start"
            disabled={busy || !previewReady}
            type="submit"
          >
            {busy ? "Uploading…" : "Add photo"}
          </button>
        </form>
      )}
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-foreground text-sm" role="status">
          {message}
        </p>
      )}
      {!mate.isActive && (
        <p className="text-foreground text-sm">Reactivate your profile before changing photos.</p>
      )}
    </section>
  );
}

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
type Slot = z.infer<typeof availabilitySlotSchema>;
type DateOverride = z.infer<typeof dateAvailabilityOverrideSchema>;

function weekdayForDate(date: string) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

function formatAvailabilityDate(date: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "full", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

export function AvailabilityEditor({ mate }: { mate: MateProfile }) {
  const [slots, setSlots] = useState<Slot[]>(
    mate.availability.map(({ dayOfWeek, startTime, endTime }) => ({
      dayOfWeek,
      startTime,
      endTime,
    })),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [datesLoadedFor, setDatesLoadedFor] = useState<number | null>(null);
  const [datesLoadFailure, setDatesLoadFailure] = useState<{
    retry: number;
    message: string;
  } | null>(null);
  const [datesRetry, setDatesRetry] = useState(0);
  const [selectedDate, setSelectedDate] = useState(bangkokToday());
  const [dateDraft, setDateDraft] = useState<{ date: string; slots: Slot[] } | null>(null);
  const [dateBusy, setDateBusy] = useState(false);
  const [dateError, setDateError] = useState("");
  const [dateMessage, setDateMessage] = useState("");
  const datesBusy = datesLoadedFor !== datesRetry;
  const datesError = datesLoadFailure?.retry === datesRetry ? datesLoadFailure.message : "";
  const selectedDayOfWeek = weekdayForDate(selectedDate);
  const selectedOverride = dateOverrides.find((override) => override.date === selectedDate);
  const inheritedDateSlots = useMemo(
    () => slots.filter((slot) => slot.dayOfWeek === selectedDayOfWeek),
    [selectedDayOfWeek, slots],
  );
  const savedDateSlots = useMemo(
    () =>
      selectedOverride
        ? selectedOverride.slots.map((slot) => ({ ...slot, dayOfWeek: selectedDayOfWeek }))
        : inheritedDateSlots,
    [inheritedDateSlots, selectedDayOfWeek, selectedOverride],
  );
  const visibleDateSlots = dateDraft?.date === selectedDate ? dateDraft.slots : savedDateSlots;

  useEffect(() => {
    const controller = new AbortController();
    void requestSameOrigin("/api/mates/me/availability/dates", dateAvailabilityOverridesSchema, {
      signal: controller.signal,
    })
      .then((result) => {
        setDateOverrides(result.overrides);
        setDatesLoadFailure(null);
        setDatesLoadedFor(datesRetry);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setDatesLoadFailure({ retry: datesRetry, message: errorText(cause) });
          setDatesLoadedFor(datesRetry);
        }
      });
    return () => controller.abort();
  }, [datesRetry]);

  function update(index: number, field: keyof Slot, value: string) {
    setSlots((current) =>
      current.map((slot, position) =>
        position === index
          ? { ...slot, [field]: field === "dayOfWeek" ? Number(value) : value }
          : slot,
      ),
    );
  }

  function updateDateSlot(index: number, field: "startTime" | "endTime", value: string) {
    setDateDraft((current) => {
      const currentSlots = current?.date === selectedDate ? current.slots : savedDateSlots;
      return {
        date: selectedDate,
        slots: currentSlots.map((slot, position) =>
          position === index ? { ...slot, [field]: value } : slot,
        ),
      };
    });
  }

  async function saveDateAvailability() {
    setDateError("");
    setDateMessage("");
    if (!isCurrentOrFutureDate(selectedDate)) {
      setDateError("Choose today or a future date.");
      return;
    }
    const checked = replaceDateAvailabilitySchema.safeParse({
      slots: visibleDateSlots.map(({ startTime, endTime }) => ({ startTime, endTime })),
    });
    if (!checked.success) {
      setDateError(checked.error.issues[0]?.message ?? "Check the hours for this date.");
      return;
    }
    setDateBusy(true);
    try {
      const result = await requestSameOrigin(
        `/api/mates/me/availability/dates/${encodeURIComponent(selectedDate)}`,
        dateAvailabilityOverrideSchema,
        { method: "PUT", body: JSON.stringify(checked.data) },
      );
      setDateOverrides((current) =>
        [...current.filter((override) => override.date !== result.date), result].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      );
      setDateDraft({
        date: result.date,
        slots: result.slots.map((slot) => ({ ...slot, dayOfWeek: weekdayForDate(result.date) })),
      });
      setDateMessage(
        result.slots.length === 0
          ? "This date is closed for booking."
          : `Availability saved for ${formatAvailabilityDate(result.date)}.`,
      );
    } catch (cause) {
      setDateError(errorText(cause));
    } finally {
      setDateBusy(false);
    }
  }

  async function restoreWeeklyHours() {
    setDateError("");
    setDateMessage("");
    if (!selectedOverride || !isCurrentOrFutureDate(selectedDate)) return;
    setDateBusy(true);
    try {
      await requestSameOrigin(
        `/api/mates/me/availability/dates/${encodeURIComponent(selectedDate)}`,
        z.object({ cleared: z.literal(true) }),
        { method: "DELETE" },
      );
      setDateOverrides((current) => current.filter((override) => override.date !== selectedDate));
      setDateDraft((current) => (current?.date === selectedDate ? null : current));
      setDateMessage("Weekly hours now apply on this date.");
    } catch (cause) {
      setDateError(errorText(cause));
    } finally {
      setDateBusy(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const checked = replaceAvailabilitySchema.safeParse({ slots });
    if (!checked.success) {
      setError(checked.error.issues[0]?.message ?? "Check the weekly schedule.");
      return;
    }
    setBusy(true);
    try {
      const result = await requestSameOrigin(
        "/api/mates/me/availability",
        z.object({ slots: z.array(mateAvailabilitySchema) }),
        { method: "PUT", body: JSON.stringify(checked.data) },
      );
      setSlots(
        result.slots.map(({ dayOfWeek, startTime, endTime }) => ({
          dayOfWeek,
          startTime,
          endTime,
        })),
      );
      setMessage("Weekly availability saved.");
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="border-border bg-card text-card-foreground mx-auto max-w-3xl rounded-2xl border p-6 shadow-sm sm:p-8">
      <p className="text-muted-foreground mb-5 text-sm">
        Set recurring weekly hours in Bangkok local time. The booking calendar will show open slots
        after existing requests are accounted for. Set a date below to change one day only.
      </p>
      <form className="grid gap-4" onSubmit={save}>
        <WeeklyAvailabilityGrid
          disabled={busy || !mate.isActive}
          onChange={setSlots}
          slots={slots}
        />
        <h2 className="text-lg font-semibold">Your time blocks</h2>
        {slots.length === 0 && (
          <p className="text-sm text-neutral-600">
            No weekly hours yet. Add a time block below. On desktop, you can also drag on the
            calendar.
          </p>
        )}
        {slots.map((slot, index) => (
          <div
            className="bg-accent grid gap-3 rounded-xl p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
            key={index}
          >
            <label className="grid gap-1 text-xs font-semibold">
              Day
              <select
                className="border-border bg-card text-card-foreground rounded-lg border px-2 py-2 text-sm"
                onChange={(event) => update(index, "dayOfWeek", event.target.value)}
                value={slot.dayOfWeek}
              >
                {dayNames.map((day, position) => (
                  <option key={day} value={position + 1}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold">
              From
              <input
                className="border-border bg-card text-card-foreground rounded-lg border px-2 py-2 text-sm"
                onChange={(event) => update(index, "startTime", event.target.value)}
                required
                type="time"
                value={slot.startTime}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold">
              Until
              <input
                className="border-border bg-card text-card-foreground rounded-lg border px-2 py-2 text-sm"
                onChange={(event) => update(index, "endTime", event.target.value)}
                required
                type="time"
                value={slot.endTime}
              />
            </label>
            <button
              className="border-border self-end rounded-lg border px-3 py-2 text-sm"
              onClick={() =>
                setSlots((current) => current.filter((_, position) => position !== index))
              }
              type="button"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          className="border-border justify-self-start rounded-lg border px-4 py-2 text-sm font-semibold"
          onClick={() =>
            setSlots((current) => [
              ...current,
              { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
            ])
          }
          type="button"
        >
          Add time block
        </button>
        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="text-foreground text-sm" role="status">
            {message}
          </p>
        )}
        <button
          className="button justify-self-start"
          disabled={busy || !mate.isActive}
          type="submit"
        >
          {busy ? "Saving…" : "Save weekly availability"}
        </button>
        {!mate.isActive && (
          <p className="text-foreground text-sm">
            Reactivate your profile before changing availability.
          </p>
        )}
      </form>
      <section
        className="border-border mt-10 grid gap-4 border-t pt-6"
        aria-labelledby="date-hours-heading"
      >
        <div>
          <h2 className="text-xl font-semibold" id="date-hours-heading">
            Specific dates
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Dates without a marker use your weekly hours. Save an empty date to close it.
          </p>
        </div>
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
          <BookingCalendar
            disabled={dateBusy}
            markedDates={dateOverrides.map((override) => override.date)}
            onChange={(date) => {
              setSelectedDate(date);
              setDateError("");
              setDateMessage("");
            }}
            today={bangkokToday()}
            value={selectedDate}
          />
          <div className="grid min-w-0 content-start gap-3">
            <h3 className="text-base font-semibold">{formatAvailabilityDate(selectedDate)}</h3>
            {datesBusy && <p role="status">Loading saved dates…</p>}
            {datesError && (
              <div className="grid gap-2" role="alert">
                <p>{datesError}</p>
                <button
                  className="justify-self-start text-sm font-semibold underline"
                  onClick={() => setDatesRetry((current) => current + 1)}
                  type="button"
                >
                  Retry saved dates
                </button>
              </div>
            )}
            {!datesBusy && !datesError && (
              <>
                {selectedOverride ? (
                  <p className="text-sm">Custom hours apply to this date only.</p>
                ) : inheritedDateSlots.length > 0 ? (
                  <p className="text-sm">
                    Using your weekly {dayNames[selectedDayOfWeek - 1]} hours.
                  </p>
                ) : (
                  <p className="text-sm text-neutral-600">No weekly hours are set for this day.</p>
                )}
                <WeeklyAvailabilityGrid
                  days={[{ dayOfWeek: selectedDayOfWeek, label: "This date" }]}
                  disabled={dateBusy || datesBusy || !mate.isActive}
                  onChange={(next) => {
                    setDateDraft({ date: selectedDate, slots: next });
                  }}
                  slots={visibleDateSlots}
                />
                <h4 className="text-sm font-semibold">Time blocks for this date</h4>
                {visibleDateSlots.length === 0 && (
                  <p className="text-sm text-neutral-600">
                    No time blocks means this date will be unavailable for booking.
                  </p>
                )}
                {visibleDateSlots.map((slot, index) => (
                  <div
                    className="bg-accent grid gap-3 rounded-xl p-3 sm:grid-cols-[1fr_1fr_auto]"
                    key={`${slot.startTime}-${index}`}
                  >
                    <label className="grid gap-1 text-xs font-semibold">
                      Starts at
                      <input
                        className="border-border bg-card text-card-foreground rounded-lg border px-2 py-2 text-sm"
                        disabled={dateBusy}
                        onChange={(event) => updateDateSlot(index, "startTime", event.target.value)}
                        required
                        type="time"
                        value={slot.startTime}
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold">
                      Ends at
                      <input
                        className="border-border bg-card text-card-foreground rounded-lg border px-2 py-2 text-sm"
                        disabled={dateBusy}
                        onChange={(event) => updateDateSlot(index, "endTime", event.target.value)}
                        required
                        type="time"
                        value={slot.endTime}
                      />
                    </label>
                    <button
                      className="border-border self-end rounded-lg border px-3 py-2 text-sm"
                      disabled={dateBusy}
                      onClick={() => {
                        setDateDraft((current) => {
                          const currentSlots =
                            current?.date === selectedDate ? current.slots : savedDateSlots;
                          return {
                            date: selectedDate,
                            slots: currentSlots.filter((_, position) => position !== index),
                          };
                        });
                      }}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex flex-wrap gap-3">
                  <button
                    className="border-border rounded-lg border px-4 py-2 text-sm font-semibold"
                    disabled={dateBusy || !mate.isActive}
                    onClick={() => {
                      setDateDraft((current) => {
                        const currentSlots =
                          current?.date === selectedDate ? current.slots : savedDateSlots;
                        return {
                          date: selectedDate,
                          slots: [
                            ...currentSlots,
                            { dayOfWeek: selectedDayOfWeek, startTime: "09:00", endTime: "12:00" },
                          ],
                        };
                      });
                    }}
                    type="button"
                  >
                    Add time block
                  </button>
                  {selectedOverride && (
                    <button
                      className="border-border rounded-lg border px-4 py-2 text-sm font-semibold"
                      disabled={dateBusy || !mate.isActive}
                      onClick={restoreWeeklyHours}
                      type="button"
                    >
                      Use weekly hours
                    </button>
                  )}
                </div>
                {dateError && (
                  <p className="text-destructive text-sm" role="alert">
                    {dateError}
                  </p>
                )}
                {dateMessage && (
                  <p className="text-foreground text-sm" role="status">
                    {dateMessage}
                  </p>
                )}
                <button
                  className="button justify-self-start"
                  disabled={
                    dateBusy ||
                    datesBusy ||
                    Boolean(datesError) ||
                    !mate.isActive ||
                    !isCurrentOrFutureDate(selectedDate)
                  }
                  onClick={saveDateAvailability}
                  type="button"
                >
                  {dateBusy ? "Saving…" : "Save date availability"}
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
