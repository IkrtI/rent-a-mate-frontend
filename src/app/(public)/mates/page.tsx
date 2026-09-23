import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal, Star } from "lucide-react";

import { getPublicMates } from "@/modules/mate-discovery/public-data";

export const metadata: Metadata = {
  title: "Find a Mate",
  description: "Find a local mate for the things you want to do.",
  alternates: { canonical: "/mates" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

export default async function MatesPage({ searchParams }: Props) {
  const search = await searchParams;
  const result = await getPublicMates(search);
  const q = Array.isArray(search.q) ? search.q[0] : (search.q ?? "");
  const activity = Array.isArray(search.activity) ? search.activity[0] : (search.activity ?? "");
  const sort = Array.isArray(search.sort) ? search.sort[0] : (search.sort ?? "-rating");
  const minRate = Array.isArray(search.minRate) ? search.minRate[0] : (search.minRate ?? "");
  const maxRate = Array.isArray(search.maxRate) ? search.maxRate[0] : (search.maxRate ?? "");
  const rating = Array.isArray(search.rating) ? search.rating[0] : (search.rating ?? "");
  const next = new URLSearchParams();
  if (q) next.set("q", q);
  if (activity) next.set("activity", activity);
  if (sort) next.set("sort", sort);
  if (minRate) next.set("minRate", minRate);
  if (maxRate) next.set("maxRate", maxRate);
  if (rating) next.set("rating", rating);
  return (
    <main className="directory-page">
      <section className="directory-intro">
        <p className="eyebrow">GOOD PEOPLE, LOCAL PLANS</p>
        <h1>
          Find your <em>Mate.</em>
        </h1>
        <p>A good coffee, a new neighbourhood, or a little company while you study.</p>
      </section>
      <section aria-label="Find and filter mates" className="directory-wrap">
        <form action="/mates" className="filter-bar">
          <label className="directory-search">
            <Search aria-hidden="true" size={18} />
            <span className="sr-only">Search mates</span>
            <input defaultValue={q} name="q" placeholder="Try ‘coffee’ or a name" />
          </label>
          <label className="filter-select">
            <span className="sr-only">Activity</span>
            <select defaultValue={activity} name="activity">
              <option value="">All activities</option>
              {["Cafe", "Gaming", "Study", "Gym", "Events", "City walks"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="filter-select sort-select">
            <span className="sr-only">Sort mates</span>
            <select defaultValue={sort} name="sort">
              <option value="-rating">Top rated</option>
              <option value="-createdAt">Newest</option>
              <option value="rate">Price: low to high</option>
              <option value="-rate">Price: high to low</option>
            </select>
          </label>
          <label className="filter-number">
            <span>Min ฿ / hour</span>
            <input
              inputMode="decimal"
              min="0"
              name="minRate"
              type="number"
              defaultValue={minRate}
            />
          </label>
          <label className="filter-number">
            <span>Max ฿ / hour</span>
            <input
              inputMode="decimal"
              min="0"
              name="maxRate"
              type="number"
              defaultValue={maxRate}
            />
          </label>
          <label className="filter-select rating-select">
            <span className="sr-only">Minimum rating</span>
            <select defaultValue={rating} name="rating">
              <option value="">Any rating</option>
              <option value="4">4+ stars</option>
              <option value="4.5">4.5+ stars</option>
            </select>
          </label>
          <button className="button" type="submit">
            <SlidersHorizontal aria-hidden="true" size={17} /> Apply filters
          </button>
        </form>
        <div aria-live="polite" className="directory-results-head">
          <p>
            {result.error
              ? "Mates are taking a moment to load"
              : `${result.total} ${result.total === 1 ? "Mate" : "Mates"} to meet`}
            {activity ? ` for ${activity}` : ""}
          </p>
          {(q || activity) && <Link href="/mates">Clear filters</Link>}
        </div>
        {result.error ? (
          <div className="state-card" role="status">
            <h2>We couldn’t load mates just now.</h2>
            <p>Your filters are still here. Try again in a moment.</p>
            <Link
              className="button button-outline"
              href={`/mates?${new URLSearchParams({ ...(q ? { q } : {}), ...(activity ? { activity } : {}), ...(sort ? { sort } : {}), ...(minRate ? { minRate } : {}), ...(maxRate ? { maxRate } : {}), ...(rating ? { rating } : {}), _retry: "1" }).toString()}`}
            >
              Retry
            </Link>
          </div>
        ) : result.items.length === 0 ? (
          <div className="state-card">
            <h2>No mates match just yet.</h2>
            <p>Try another activity or clear your filters to see more people.</p>
            <Link className="button button-outline" href="/mates">
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="mate-grid directory-grid">
            {result.items.map((mate) => (
              <article className="mate-card" key={mate.id}>
                <Link
                  aria-label={`View ${mate.name}'s profile`}
                  className="mate-photo"
                  href={`/mates/${mate.id}`}
                >
                  {mate.photoUrl ? (
                    <Image
                      alt={`${mate.name}'s profile`}
                      fill
                      sizes="(max-width: 760px) 90vw, (max-width: 1100px) 45vw, 360px"
                      src={mate.photoUrl}
                      unoptimized
                    />
                  ) : (
                    <span aria-hidden="true" className="avatar-placeholder">
                      {mate.name.slice(0, 1)}
                    </span>
                  )}
                </Link>
                <div className="mate-card-details">
                  <div className="mate-name-row">
                    <div>
                      <h2>{mate.name}</h2>
                      <p>
                        {mate.district}, {mate.province}
                      </p>
                    </div>
                    <span className="mate-rating">
                      <Star aria-hidden="true" fill="currentColor" size={14} />{" "}
                      {mate.avgRating?.toFixed(1) ?? "New"} <small>({mate.reviewCount})</small>
                    </span>
                  </div>
                  <p className="mate-interests">{mate.activities.slice(0, 3).join(" · ")}</p>
                  <p className="mate-rate">
                    <strong>{money.format(mate.hourlyRate)}</strong> / hour
                  </p>
                  <Link className="profile-link" href={`/mates/${mate.id}`}>
                    View profile <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
        {!result.error && result.totalPages > 1 && (
          <nav aria-label="Mate result pages" className="pagination">
            {result.page > 1 && (
              <Link
                href={`/mates?${new URLSearchParams([...next, ["page", String(result.page - 1)]])}`}
              >
                <ArrowLeft size={16} /> Previous
              </Link>
            )}
            <span>
              Page {result.page} of {result.totalPages}
            </span>
            {result.page < result.totalPages && (
              <Link
                href={`/mates?${new URLSearchParams([...next, ["page", String(result.page + 1)]])}`}
              >
                Next <ArrowRight size={16} />
              </Link>
            )}
          </nav>
        )}
      </section>
    </main>
  );
}
