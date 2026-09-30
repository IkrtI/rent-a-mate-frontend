"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useState } from "react";

import type { Booking } from "../schemas";
import { createReview, deleteReview, updateReview } from "../client";

type ReviewValues = { rating: number; comment: string };

function Rating({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          aria-checked={value === rating}
          aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
          className="rounded p-1 text-[#ff5c67] disabled:opacity-50"
          disabled={disabled}
          key={rating}
          onClick={() => onChange(rating)}
          role="radio"
          type="button"
        >
          <Star aria-hidden fill={rating <= value ? "currentColor" : "none"} size={22} />
        </button>
      ))}
    </div>
  );
}

export function BookingReview({ booking, canManage }: { booking: Booking; canManage: boolean }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<ReviewValues>({
    rating: booking.review?.rating ?? 0,
    comment: booking.review?.comment ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["booking", booking.id] }),
      queryClient.invalidateQueries({ queryKey: ["bookings"] }),
    ]);
  const save = useMutation({
    mutationFn: () => {
      if (values.rating < 1 || values.rating > 5) throw new Error("Choose a rating from 1 to 5.");
      const input = {
        rating: values.rating,
        // An empty comment deliberately clears an existing review comment;
        // creation omits it entirely because it is optional.
        comment: booking.review ? values.comment.trim() : values.comment.trim() || undefined,
      };
      return booking.review
        ? updateReview(booking.review.id, input)
        : createReview(booking.id, input);
    },
    onSuccess: async () => {
      setError(null);
      setSuccess(booking.review ? "Review updated." : "Review submitted.");
      setEditing(false);
      await refresh();
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : "The review could not be saved."),
  });
  const remove = useMutation({
    mutationFn: () => deleteReview(booking.review!.id),
    onSuccess: async () => {
      setError(null);
      setSuccess("Review deleted.");
      setEditing(false);
      setValues({ rating: 0, comment: "" });
      await refresh();
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : "The review could not be deleted."),
  });

  if (!booking.review && !canManage) return null;
  const formOpen = !booking.review || editing;

  return (
    <section
      className="mt-8 rounded-md border border-neutral-200 bg-white p-5 shadow-sm"
      aria-labelledby="review-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold" id="review-heading">
          Your review
        </h2>
        {booking.review && canManage && !formOpen ? (
          <div className="flex gap-3 text-sm font-semibold">
            <button className="text-[#d74653]" onClick={() => setEditing(true)} type="button">
              Edit
            </button>
            <button
              className="text-red-700 disabled:opacity-50"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm("Delete this review?")) remove.mutate();
              }}
              type="button"
            >
              {remove.isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        ) : null}
      </div>
      {formOpen ? (
        <form
          className="mt-4 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <Rating
            disabled={save.isPending}
            onChange={(rating) => setValues((current) => ({ ...current, rating }))}
            value={values.rating}
          />
          <div>
            <label className="text-sm font-semibold" htmlFor="review-comment">
              Comment <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <textarea
              className="mt-2 min-h-28 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-[#ff5c67]"
              disabled={save.isPending}
              id="review-comment"
              maxLength={1000}
              onChange={(event) =>
                setValues((current) => ({ ...current, comment: event.target.value }))
              }
              value={values.comment}
            />
            <p className="mt-1 text-right text-xs text-neutral-500">{values.comment.length}/1000</p>
          </div>
          <div className="flex gap-3">
            <button
              className="h-10 rounded-md bg-[#23212b] px-4 text-sm font-bold text-white disabled:opacity-50"
              disabled={save.isPending}
              type="submit"
            >
              {save.isPending ? "Saving…" : booking.review ? "Save changes" : "Submit review"}
            </button>
            {booking.review ? (
              <button
                className="text-sm font-semibold"
                disabled={save.isPending}
                onClick={() => {
                  setEditing(false);
                  setValues({
                    rating: booking.review!.rating,
                    comment: booking.review!.comment ?? "",
                  });
                }}
                type="button"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : booking.review ? (
        <div className="mt-4">
          <Rating onChange={() => undefined} value={booking.review.rating} disabled />
          {booking.review.comment ? (
            <p className="mt-3 text-sm leading-6 whitespace-pre-wrap text-neutral-700">
              {booking.review.comment}
            </p>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">No comment left.</p>
          )}
        </div>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 text-sm text-emerald-700" role="status">
          {success}
        </p>
      ) : null}
    </section>
  );
}
