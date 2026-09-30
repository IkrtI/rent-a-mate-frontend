"use client";

import { useEffect, useRef, useState } from "react";
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
  mateAvailabilitySchema,
  mateProfileSchema,
  mateResultSchema,
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
  const [dragging, setDragging] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const image = useRef<HTMLImageElement | null>(null);
  const cropDrag = useRef<{
    pointerId: number;
    x: number;
    y: number;
    horizontal: number;
    vertical: number;
    width: number;
    height: number;
  } | null>(null);
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
  function resetCrop() {
    setZoom(1);
    setHorizontal(50);
    setVertical(50);
  }
  function changeZoom(nextZoom: number) {
    setZoom(Math.min(3, Math.max(1, Number(nextZoom.toFixed(2)))));
  }
  function startCropDrag(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!previewReady || !image.current || rect.width === 0 || rect.height === 0) return;
    event.preventDefault();
    cropDrag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      horizontal,
      vertical,
      width: rect.width,
      height: rect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }
  function moveCrop(event: React.PointerEvent<HTMLCanvasElement>) {
    const start = cropDrag.current;
    const selectedImage = image.current;
    if (!start || start.pointerId !== event.pointerId || !selectedImage) return;
    const cropSize = Math.min(selectedImage.naturalWidth, selectedImage.naturalHeight) / zoom;
    const horizontalRange = selectedImage.naturalWidth - cropSize;
    const verticalRange = selectedImage.naturalHeight - cropSize;
    const sourceX = ((event.clientX - start.x) * cropSize) / start.width;
    const sourceY = ((event.clientY - start.y) * cropSize) / start.height;
    setHorizontal(
      horizontalRange === 0
        ? start.horizontal
        : Math.min(100, Math.max(0, start.horizontal - (sourceX / horizontalRange) * 100)),
    );
    setVertical(
      verticalRange === 0
        ? start.vertical
        : Math.min(100, Math.max(0, start.vertical - (sourceY / verticalRange) * 100)),
    );
  }
  function endCropDrag() {
    cropDrag.current = null;
    setDragging(false);
  }
  function nudgeCrop(event: React.KeyboardEvent<HTMLCanvasElement>) {
    if (!previewReady) return;
    const amount = event.shiftKey ? 8 : 2;
    if (event.key === "ArrowLeft") setHorizontal((position) => Math.min(100, position + amount));
    else if (event.key === "ArrowRight")
      setHorizontal((position) => Math.max(0, position - amount));
    else if (event.key === "ArrowUp") setVertical((position) => Math.min(100, position + amount));
    else if (event.key === "ArrowDown") setVertical((position) => Math.max(0, position - amount));
    else if (event.key === "+" || event.key === "=") changeZoom(zoom + 0.1);
    else if (event.key === "-") changeZoom(zoom - 0.1);
    else return;
    event.preventDefault();
  }
  function zoomWithWheel(event: React.WheelEvent<HTMLCanvasElement>) {
    if (!previewReady) return;
    event.preventDefault();
    changeZoom(zoom + (event.deltaY < 0 ? 0.1 : -0.1));
  }
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
      resetCrop();
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
      <div className="photo-library-heading">
        <p>Choose up to six photos to show renters what spending time with you is like.</p>
        <span>{photos.length} of 6 photos</span>
      </div>
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
          <div className="photo-file-picker">
            <label className="photo-file-select" htmlFor="mate-photo-input">
              <span aria-hidden="true">＋</span>
              {file ? "Choose another photo" : "Choose a photo"}
            </label>
            <span className="photo-file-name" title={file?.name ?? undefined}>
              {file?.name ?? "JPG, PNG, GIF or WebP"}
            </span>
            <input
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="photo-file-input"
              id="mate-photo-input"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                setPreviewReady(false);
                setError("");
                setMessage("");
                resetCrop();
              }}
              name="photo"
              type="file"
            />
            <p>Maximum file size: 5 MB</p>
          </div>
          {file && (
            <div className="photo-editor">
              <header className="photo-editor-toolbar">
                <div>
                  <h3>Adjust your photo</h3>
                  <p>Move and frame your square profile crop.</p>
                </div>
                <button
                  className="photo-editor-reset"
                  disabled={!previewReady}
                  onClick={resetCrop}
                  type="button"
                >
                  Reset crop
                </button>
              </header>
              <div className="photo-editor-workspace">
                <div className={`photo-editor-stage${dragging ? "is-dragging" : ""}`}>
                  <div className="photo-crop-frame">
                    <canvas
                      aria-label="Photo crop. Drag to reposition, use arrow keys to move, or scroll to zoom."
                      aria-describedby="photo-crop-help"
                      aria-disabled={!previewReady}
                      className="photo-crop-canvas"
                      height={600}
                      ref={canvas}
                      onKeyDown={nudgeCrop}
                      onLostPointerCapture={endCropDrag}
                      onPointerCancel={endCropDrag}
                      onPointerDown={startCropDrag}
                      onPointerMove={moveCrop}
                      onPointerUp={endCropDrag}
                      onWheel={zoomWithWheel}
                      role="application"
                      tabIndex={0}
                      width={600}
                    />
                    <div aria-hidden="true" className="photo-crop-guides" />
                  </div>
                  {!previewReady && (
                    <p className="photo-editor-loading" role="status">
                      Preparing preview…
                    </p>
                  )}
                </div>
                <aside className="photo-editor-tools" aria-label="Crop controls">
                  <div className="photo-editor-position-heading">
                    <strong>Position</strong>
                    <span>Drag the image to move it</span>
                  </div>
                  <div className="photo-editor-zoom">
                    <div className="photo-editor-control-heading">
                      <label htmlFor="photo-zoom">Zoom</label>
                      <output htmlFor="photo-zoom">{Math.round(zoom * 100)}%</output>
                    </div>
                    <div className="photo-editor-zoom-row">
                      <button
                        aria-label="Zoom out"
                        disabled={!previewReady || zoom <= 1}
                        onClick={() => changeZoom(zoom - 0.1)}
                        type="button"
                      >
                        −
                      </button>
                      <input
                        id="photo-zoom"
                        max="3"
                        aria-label="Zoom level"
                        min="1"
                        onChange={(event) => changeZoom(Number(event.target.value))}
                        step="0.1"
                        type="range"
                        value={zoom}
                      />
                      <button
                        aria-label="Zoom in"
                        disabled={!previewReady || zoom >= 3}
                        onClick={() => changeZoom(zoom + 0.1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    <div className="photo-editor-zoom-range-labels">
                      <span>100%</span>
                      <span>300%</span>
                    </div>
                  </div>
                  <p className="photo-editor-help" id="photo-crop-help">
                    Drag to reposition. Scroll to zoom, or use arrow keys for precise adjustments.
                  </p>
                  <div className="photo-editor-crop-label">
                    <span aria-hidden="true">□</span>
                    Square profile photo
                  </div>
                </aside>
              </div>
              <footer className="photo-editor-footer">
                <span>The square frame is exactly what renters will see.</span>
                <span>JPG · PNG · GIF · WEBP</span>
              </footer>
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
    <section className="border-border bg-card text-card-foreground mx-auto max-w-3xl rounded-2xl border p-6 shadow-sm sm:p-8">
      <p className="text-muted-foreground mb-5 text-sm">
        Set recurring weekly hours in Bangkok local time. The booking calendar will show open slots
        after existing requests are accounted for.
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
    </section>
  );
}
