"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { z } from "zod";

import {
  requestSameOrigin,
  requestSameOriginUpload,
  BrowserClientError,
} from "@/modules/backend-client/browser";
import {
  availabilitySlotSchema,
  mateAvailabilitySchema,
  mateProfileSchema,
  mateResultSchema,
  replaceAvailabilitySchema,
} from "./schemas";
import type { MateProfile } from "./schemas";

type Lookup = { id: number; name: string };
type ProfileProps = {
  mate: MateProfile | null;
  activities: Lookup[];
  interests: Lookup[];
  provinces: Lookup[];
  districts: Lookup[];
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
}: ProfileProps) {
  const [provinceId, setProvinceId] = useState(String(mate?.province.id ?? ""));
  const [districts, setDistricts] = useState(initialDistricts);
  const [districtId, setDistrictId] = useState(String(mate?.district.id ?? ""));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!provinceId || provinceId === String(mate?.province.id ?? "")) return;
    const controller = new AbortController();
    fetch(`/api/provinces/${provinceId}/districts`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload: { items?: Lookup[] }) => setDistricts(payload.items ?? []))
      .catch(() => {
        if (!controller.signal.aborted) setDistricts([]);
      });
    return () => controller.abort();
  }, [provinceId, mate?.province.id]);

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
      await requestSameOrigin(
        "/api/mates/me",
        mateResultSchema,
        mate ? { method: "PATCH", body } : { method: "POST", body },
      );
      setMessage("Profile saved.");
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
      await requestSameOrigin("/api/mates/me", z.unknown(), { method: "DELETE" });
      setMessage("Profile deactivated. Contact support if you want to reactivate it.");
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-rose-100 bg-white p-6 shadow-sm sm:p-8">
      <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit}>
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
                {item.name}
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
                {item.name}
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
        <label className="grid gap-2 text-sm font-semibold">
          Activities
          <select
            className="min-h-36 rounded-lg border border-neutral-300 px-3 py-2"
            defaultValue={ids(mate?.activities ?? []).map(String)}
            multiple
            name="activityIds"
          >
            {activities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-neutral-500">
            Select all activities you offer.
          </span>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Interests
          <select
            className="min-h-36 rounded-lg border border-neutral-300 px-3 py-2"
            defaultValue={ids(mate?.interests ?? []).map(String)}
            multiple
            name="interestIds"
          >
            {interests.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-neutral-500">
            Select all interests you want to share.
          </span>
        </label>
        {error && (
          <p className="text-sm text-red-700 sm:col-span-2" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-green-700 sm:col-span-2" role="status">
            {message}
          </p>
        )}
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            className="button"
            disabled={busy || (mate !== null && !mate.isActive)}
            type="submit"
          >
            {busy ? "Saving…" : mate ? "Save profile" : "Create profile"}
          </button>
          {mate?.isActive && (
            <button
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700"
              disabled={busy}
              onClick={deactivate}
              type="button"
            >
              Deactivate profile
            </button>
          )}
        </div>
        {mate && !mate.isActive && (
          <p className="text-sm text-amber-800 sm:col-span-2">
            This profile is inactive and hidden from discovery.
          </p>
        )}
      </form>
    </section>
  );
}

export function PhotosEditor({ mate }: { mate: MateProfile }) {
  const [photos, setPhotos] = useState(mate.photos);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("photo");
    const url = String(form.get("url") ?? "").trim();
    if (file instanceof File && file.size > 5 * 1024 * 1024) {
      setError("Photo must be 5 MB or smaller.");
      setBusy(false);
      return;
    }
    const body = new FormData();
    if (file instanceof File && file.size > 0) body.append("photo", file);
    else if (url) body.append("url", url);
    else {
      setError("Choose an image file or provide an image URL.");
      setBusy(false);
      return;
    }
    try {
      setUploadProgress(0);
      const result = await requestSameOriginUpload(
        "/api/mates/me/photos",
        z.object({ photo: mateProfileSchema.shape.photos.element }),
        body,
        setUploadProgress,
      );
      setPhotos((current) => [...current, result.photo].sort((a, b) => a.sortOrder - b.sortOrder));
      formElement.reset();
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
      setMessage("Photo removed.");
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mx-auto grid max-w-4xl gap-6 rounded-2xl border border-rose-100 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm text-neutral-600">
        Add up to six photos. Image files must be 5 MB or smaller.
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
              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700"
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
        <form
          className="grid gap-4 border-t border-neutral-200 pt-5 sm:grid-cols-2"
          onSubmit={upload}
        >
          <label className="grid gap-2 text-sm font-semibold">
            Image file
            <input
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="rounded-lg border border-neutral-300 p-2"
              name="photo"
              type="file"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Or image URL
            <input
              className="rounded-lg border border-neutral-300 px-3 py-2"
              maxLength={2048}
              name="url"
              placeholder="https://, /image.jpg, or data:image/…"
              type="text"
            />
          </label>
          {uploadProgress !== null && (
            <div
              aria-label="Photo upload progress"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={uploadProgress}
              className="sm:col-span-2"
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
          <button className="button sm:col-span-2" disabled={busy} type="submit">
            {busy ? "Uploading…" : "Add photo"}
          </button>
        </form>
      )}
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-green-700" role="status">
          {message}
        </p>
      )}
      {!mate.isActive && (
        <p className="text-sm text-amber-800">Reactivate your profile before changing photos.</p>
      )}
    </section>
  );
}

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
type Slot = z.infer<typeof availabilitySlotSchema>;
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
  function update(index: number, field: keyof Slot, value: string) {
    setSlots((current) =>
      current.map((slot, position) =>
        position === index
          ? { ...slot, [field]: field === "dayOfWeek" ? Number(value) : value }
          : slot,
      ),
    );
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
    <section className="mx-auto max-w-3xl rounded-2xl border border-rose-100 bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-5 text-sm text-neutral-600">
        Set recurring weekly hours in Bangkok local time. The booking calendar will show open slots
        after existing requests are accounted for.
      </p>
      <form className="grid gap-4" onSubmit={save}>
        {slots.map((slot, index) => (
          <div
            className="grid gap-3 rounded-xl bg-rose-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
            key={`${index}-${slot.dayOfWeek}-${slot.startTime}`}
          >
            <label className="grid gap-1 text-xs font-semibold">
              Day
              <select
                className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm"
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
                className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm"
                onChange={(event) => update(index, "startTime", event.target.value)}
                required
                type="time"
                value={slot.startTime}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold">
              Until
              <input
                className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm"
                onChange={(event) => update(index, "endTime", event.target.value)}
                required
                type="time"
                value={slot.endTime}
              />
            </label>
            <button
              className="self-end rounded-lg border border-neutral-300 px-3 py-2 text-sm"
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
          className="justify-self-start rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold"
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
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-green-700" role="status">
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
          <p className="text-sm text-amber-800">
            Reactivate your profile before changing availability.
          </p>
        )}
      </form>
    </section>
  );
}
