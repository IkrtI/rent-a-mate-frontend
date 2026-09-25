"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

type Lookup = { id: number; name: string };
type Props = {
  activities: Lookup[];
  interests: Lookup[];
  provinces: Lookup[];
  lookupError: boolean;
  search: Record<string, string | string[] | undefined>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
function selected(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value : value ? [value] : []).map(String);
}

export function DiscoveryFilters({ activities, interests, provinces, lookupError, search }: Props) {
  const [districts, setDistricts] = useState<Lookup[]>([]);
  const [districtError, setDistrictError] = useState(false);
  const [districtRetry, setDistrictRetry] = useState(0);
  const provinceId = first(search.provinceId);
  const activeFilterCount = [
    "activityId",
    "interestId",
    "provinceId",
    "districtId",
    "availableDate",
    "minRate",
    "maxRate",
    "minRating",
  ].filter((key) => selected(search[key]).length > 0).length;
  useEffect(() => {
    if (!provinceId) return;
    const controller = new AbortController();
    fetch(`/api/provinces/${encodeURIComponent(provinceId)}/districts`, {
      signal: controller.signal,
    })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("lookup failed")),
      )
      .then((payload: { items?: Lookup[] }) => {
        setDistricts(payload.items ?? []);
        setDistrictError(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setDistricts([]);
          setDistrictError(true);
        }
      });
    return () => controller.abort();
  }, [districtRetry, provinceId]);

  return (
    <form action="/mates" className="filter-bar">
      {(lookupError || districtError) && (
        <div className="filter-message" role="status">
          <span>
            Some filter options could not load. You can still search with the options available.
          </span>
          {districtError && (
            <button
              className="font-semibold underline"
              onClick={() => setDistrictRetry((count) => count + 1)}
              type="button"
            >
              Retry districts
            </button>
          )}
        </div>
      )}
      <div className="directory-search-row">
        <label className="directory-search">
          <Search aria-hidden="true" size={19} />
          <span className="sr-only">Search mates</span>
          <input
            defaultValue={first(search.q)}
            maxLength={100}
            name="q"
            placeholder="Search by name, place, or plan"
          />
        </label>
        <button className="button directory-search-button" type="submit">
          Search mates
        </button>
      </div>
      <details className="directory-filter-disclosure" open={activeFilterCount > 0}>
        <summary>
          <SlidersHorizontal aria-hidden="true" size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span aria-label={`${activeFilterCount} filters selected`} className="filter-count">
              {activeFilterCount}
            </span>
          )}
        </summary>
        <div className="filter-controls">
          <label className="filter-select filter-multiple">
            <span>Activities</span>
            <select
              defaultValue={selected(search.activityId)}
              multiple
              name="activityId"
              aria-label="Activities"
            >
              {activities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-select filter-multiple">
            <span>Interests</span>
            <select
              defaultValue={selected(search.interestId)}
              multiple
              name="interestId"
              aria-label="Interests"
            >
              {interests.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-select">
            <span>Province</span>
            <select defaultValue={provinceId} name="provinceId" aria-label="Province">
              <option value="">All provinces</option>
              {provinces.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-select">
            <span>District</span>
            <select
              defaultValue={provinceId ? first(search.districtId) : ""}
              disabled={!provinceId || districts.length === 0}
              name="districtId"
              aria-label="District"
            >
              <option value="">All districts</option>
              {districts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-number">
            <span>Available on</span>
            <input
              defaultValue={first(search.availableDate)}
              min={new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(
                new Date(),
              )}
              name="availableDate"
              type="date"
            />
          </label>
          <label className="filter-number">
            <span>Min ฿ / hour</span>
            <input
              defaultValue={first(search.minRate)}
              inputMode="decimal"
              min="0"
              name="minRate"
              step="0.01"
              type="number"
            />
          </label>
          <label className="filter-number">
            <span>Max ฿ / hour</span>
            <input
              defaultValue={first(search.maxRate)}
              inputMode="decimal"
              min="0"
              name="maxRate"
              step="0.01"
              type="number"
            />
          </label>
          <label className="filter-select">
            <span>Minimum rating</span>
            <select
              defaultValue={first(search.minRating) || first(search.rating)}
              name="minRating"
              aria-label="Minimum rating"
            >
              <option value="">Any rating</option>
              <option value="4">4+ stars</option>
              <option value="4.5">4.5+ stars</option>
            </select>
          </label>
          <label className="filter-select">
            <span>Sort mates</span>
            <select defaultValue={first(search.sort) || "-createdAt"} name="sort">
              <option value="-rating">Top rated</option>
              <option value="-createdAt">Newest</option>
              <option value="rate">Price: low to high</option>
              <option value="-rate">Price: high to low</option>
            </select>
          </label>
          <button className="button button-outline filter-submit" type="submit">
            Apply filters
          </button>
        </div>
      </details>
    </form>
  );
}
