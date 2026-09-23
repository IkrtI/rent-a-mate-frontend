import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, MapPin, Star } from "lucide-react";

import { BookingEntry } from "@/modules/mate-profile/booking-entry";
import { getPublicMate, getPublicMateReviews } from "@/modules/mate-discovery/public-data";

type Props = { params: Promise<{ mateId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mateId } = await params;
  const mate = await getPublicMate(Number(mateId));
  return mate
    ? {
        title: `${mate.user.name} — Mate profile`,
        description:
          mate.bio ??
          `Meet ${mate.user.name}, a local mate in ${mate.district.name}, ${mate.province.name}.`,
        robots: { index: true, follow: true },
      }
    : { title: "Mate profile not found", robots: { index: false, follow: false } };
}

export default async function MateProfilePage({ params }: Props) {
  const { mateId } = await params;
  const mate = await getPublicMate(Number(mateId));
  if (!mate || !mate.isActive)
    return (
      <main className="profile-page">
        <div className="state-card profile-state">
          <p className="eyebrow">MATE PROFILE</p>
          <h1>We couldn’t find this Mate.</h1>
          <p>This profile may have moved or is no longer available.</p>
          <Link className="button button-outline" href="/mates">
            <ArrowLeft size={16} /> Back to mates
          </Link>
        </div>
      </main>
    );
  const reviews = await getPublicMateReviews(mate.id);
  const photo = [...mate.photos].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const today = `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
  return (
    <main className="profile-page">
      <div className="profile-top-link">
        <Link href="/mates">
          <ArrowLeft size={16} /> Back to mates
        </Link>
      </div>
      <div className="profile-cover">
        {photo ? (
          <Image
            alt={`${mate.user.name}, local Rent a Mate companion`}
            fill
            priority
            sizes="100vw"
            src={photo}
            unoptimized
          />
        ) : (
          <div className="profile-cover-placeholder" aria-hidden="true">
            {mate.user.name.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="profile-layout">
        <article className="profile-copy">
          <p className="eyebrow">A MATE IN BANGKOK</p>
          <h1>Hi, I’m {mate.user.name}.</h1>
          <p className="profile-location">
            <MapPin aria-hidden="true" size={16} /> {mate.district.name}, {mate.province.name}
          </p>
          <section className="profile-section">
            <h2>About me</h2>
            <p>{mate.bio || "This Mate hasn’t added an introduction yet."}</p>
          </section>
          {mate.activities.length > 0 && (
            <section className="profile-section">
              <h2>Things we can do</h2>
              <div className="pill-row">
                {mate.activities.map(({ id, name }) => (
                  <span className="pill" key={id}>
                    {name}
                  </span>
                ))}
              </div>
            </section>
          )}
          {mate.interests.length > 0 && (
            <section className="profile-section">
              <h2>Things I’m into</h2>
              <div className="pill-row">
                {mate.interests.map(({ id, name }) => (
                  <span className="pill" key={id}>
                    {name}
                  </span>
                ))}
              </div>
            </section>
          )}
          <section className="profile-section review-preview">
            <h2>From people I’ve met</h2>
            {reviews?.items.length ? (
              <>
                {reviews.items.map((review) => (
                  <blockquote className="review-card" key={review.id}>
                    <p aria-label={`${review.rating} out of 5 stars`} className="review-stars">
                      {"★".repeat(review.rating)}
                      <span>{"★".repeat(5 - review.rating)}</span>
                    </p>
                    <p>{review.comment || "A lovely time together."}</p>
                    <footer>
                      {review.renter.name} ·{" "}
                      {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                        new Date(review.createdAt),
                      )}
                    </footer>
                  </blockquote>
                ))}
                <p className="review-summary">
                  <Star aria-hidden="true" fill="currentColor" size={16} />{" "}
                  {reviews.averageRating?.toFixed(1) ?? "New"} · {reviews.reviewCount} reviews
                </p>
              </>
            ) : (
              <p>
                {reviews
                  ? "No public reviews yet. Be the first to make a good plan."
                  : "Reviews are temporarily unavailable."}
              </p>
            )}
          </section>
        </article>
        <aside className="booking-card">
          <p className="booking-price">
            ฿{mate.hourlyRate.toLocaleString("en-US")} <span>/ hour</span>
          </p>
          <p className="booking-description">Ready for a good plan?</p>
          <BookingEntry
            activities={mate.activities}
            hourlyRate={mate.hourlyRate}
            initialDate={today}
            mateId={mate.id}
          />
        </aside>
      </div>
    </main>
  );
}
