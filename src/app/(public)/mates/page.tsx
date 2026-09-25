import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";

import { DiscoveryFilters } from "@/modules/mate-discovery/discovery-filters";
import {
  buildMateSearchParams,
  getDiscoveryLookups,
  getPublicMates,
} from "@/modules/mate-discovery/public-data";

export const metadata: Metadata = {
  title: "Find a Mate",
  description: "Find a local mate for the things you want to do.",
  alternates: { canonical: "/mates" },
  openGraph: {
    title: "Find a Mate",
    description: "Find a local mate for the things you want to do.",
    url: "/mates",
    type: "website",
  },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

export default async function MatesPage({ searchParams }: Props) {
  const search = await searchParams;
  const [result, lookups] = await Promise.all([getPublicMates(search), getDiscoveryLookups()]);
  const q = Array.isArray(search.q) ? search.q[0] : (search.q ?? "");
  const normalized = buildMateSearchParams(search);
  const filterParams = new URLSearchParams();
  const filterKeys = [
    "q",
    "activityId",
    "interestId",
    "provinceId",
    "districtId",
    "availableDate",
    "minRate",
    "maxRate",
    "minRating",
    "sort",
  ] as const;
  const normalizedSearch: Record<string, string | string[]> = {};
  for (const key of filterKeys) {
    const values = normalized.getAll(key);
    for (const value of values) filterParams.append(key, value);
    if (values.length === 1) normalizedSearch[key] = values[0];
    else if (values.length > 1) normalizedSearch[key] = values;
  }
  return (
    <main className="directory-page">
      <section className="directory-intro">
        <div className="directory-intro-inner">
          <div className="directory-intro-copy">
            <p className="directory-kicker">Local people · shared plans</p>
            <h1>
              Find your <em>Mate.</em>
            </h1>
            <p>A good coffee, a new neighbourhood, or a little company while you study.</p>
          </div>
          <aside className="directory-intro-note" aria-label="About the mate directory">
            <span className="directory-note-label">A little company goes a long way</span>
            <strong>Make room for a good plan.</strong>
            <p>Meet people nearby who are up for the same things you are.</p>
          </aside>
        </div>
      </section>
      <section aria-label="Find and filter mates" className="directory-wrap">
        <DiscoveryFilters
          activities={lookups.activities}
          interests={lookups.interests}
          provinces={lookups.provinces}
          lookupError={lookups.error}
          search={normalizedSearch}
        />
        {lookups.error && (
          <p className="text-sm text-amber-800" role="status">
            Filter options may be incomplete.{" "}
            <Link href={`/mates?${filterParams}`}>Retry options</Link>
          </p>
        )}
        <div aria-live="polite" className="directory-results-head">
          <p>
            {result.error
              ? "Mates are taking a moment to load"
              : `${result.total} ${result.total === 1 ? "mate" : "mates"} to meet`}
            {q ? ` matching “${q}”` : ""}
          </p>
          {Array.from(
            new URLSearchParams(
              Object.entries(search).flatMap(([key, value]) =>
                (Array.isArray(value) ? value : value === undefined ? [] : [value]).map((item) => [
                  key,
                  item,
                ]),
              ),
            ),
          ).some(([key, value]) => key !== "page" && !(key === "sort" && value === "-rating")) && (
            <Link href="/mates">Clear filters</Link>
          )}
        </div>
        {result.error ? (
          <div className="state-card" role="status">
            <h2>We couldn’t load mates just now.</h2>
            <p>Your filters are still here. Try again in a moment.</p>
            <Link
              className="button button-outline"
              href={`/mates?${new URLSearchParams([...filterParams, ["_retry", "1"]]).toString()}`}
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
                      <span className="avatar-initial">{mate.name.slice(0, 1)}</span>
                      <span className="avatar-caption">Say hello to {mate.name}</span>
                    </span>
                  )}
                </Link>
                <div className="mate-card-details">
                  <div className="mate-name-row">
                    <div>
                      <h2>{mate.name}</h2>
                      <p>
                        {mate.district ? `${mate.district}, ` : ""}
                        {mate.province}
                      </p>
                    </div>
                    {mate.avgRating === null ? (
                      <span className="mate-new-label">New profile</span>
                    ) : (
                      <span className="mate-rating">
                        <Star aria-hidden="true" fill="currentColor" size={14} />
                        {mate.avgRating.toFixed(1)}
                        <small>{mate.reviewCount} reviews</small>
                      </span>
                    )}
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
                href={`/mates?${new URLSearchParams([...filterParams, ["page", String(result.page - 1)]])}`}
              >
                <ArrowLeft size={16} /> Previous
              </Link>
            )}
            <span>
              Page {result.page} of {result.totalPages}
            </span>
            {result.page < result.totalPages && (
              <Link
                href={`/mates?${new URLSearchParams([...filterParams, ["page", String(result.page + 1)]])}`}
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
