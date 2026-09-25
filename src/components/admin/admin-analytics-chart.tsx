"use client";

import { useState } from "react";

import type { AdminAnalytics } from "@/modules/admin/contracts";

type Metric = "bookings" | "paidRevenue" | "newUsers";

const metrics: Array<{ key: Metric; label: string; color: string }> = [
  { key: "bookings", label: "Bookings", color: "var(--admin-primary)" },
  { key: "paidRevenue", label: "Paid revenue", color: "#14866d" },
  { key: "newUsers", label: "New active users", color: "#d97706" },
];

function formatValue(metric: Metric, value: number) {
  return metric === "paidRevenue"
    ? new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        maximumFractionDigits: 0,
      }).format(value)
    : value.toLocaleString();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function AdminAnalyticsChart({ data }: { data: AdminAnalytics["daily"] }) {
  const [metric, setMetric] = useState<Metric>("bookings");
  const selected = metrics.find((item) => item.key === metric) ?? metrics[0];
  const width = 720;
  const height = 180;
  const padX = 16;
  const padTop = 12;
  const chartBottom = 151;
  const max = Math.max(1, ...data.map((point) => point[metric]));
  const points = data.map((point, index) => {
    const x = padX + (data.length === 1 ? 0 : (index / (data.length - 1)) * (width - padX * 2));
    const y = chartBottom - (point[metric] / max) * (chartBottom - padTop);
    return { x, y, date: point.date, value: point[metric] };
  });
  const line = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const area = `${padX},${chartBottom} ${line} ${width - padX},${chartBottom}`;
  const labels = [points[0], points[Math.floor((points.length - 1) / 2)], points.at(-1)];
  const sum = data.reduce((total, point) => total + point[metric], 0);

  if (!data.length) {
    return (
      <div className="admin-empty-state">
        <p>No daily activity is available for this range.</p>
      </div>
    );
  }

  return (
    <div className="admin-analytics-chart">
      <div
        aria-label="Choose analytics metric"
        className="admin-chart-metric-controls"
        role="group"
      >
        {metrics.map((item) => (
          <button
            aria-pressed={metric === item.key}
            className={metric === item.key ? "is-active" : ""}
            key={item.key}
            onClick={() => setMetric(item.key)}
            type="button"
          >
            <span aria-hidden="true" style={{ backgroundColor: item.color }} /> {item.label}
          </button>
        ))}
      </div>
      <p className="admin-chart-summary">
        {selected.label}: {formatValue(metric, sum)} across {data.length} days
      </p>
      <div className="admin-chart-wrap">
        <svg
          aria-label={`Daily ${selected.label.toLowerCase()} over the selected date range`}
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <title>Daily {selected.label.toLowerCase()}</title>
          <defs>
            <linearGradient id="admin-chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={selected.color} stopOpacity=".18" />
              <stop offset="100%" stopColor={selected.color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.33, 0.66, 1].map((fraction) => {
            const y = padTop + fraction * (chartBottom - padTop);
            return (
              <line
                className="admin-chart-gridline"
                key={fraction}
                x1={padX}
                x2={width - padX}
                y1={y}
                y2={y}
              />
            );
          })}
          <polygon className="admin-chart-area" points={area} />
          <polyline className="admin-chart-line" points={line} style={{ stroke: selected.color }} />
          {points
            .filter((_, index) => data.length < 12 || index % Math.ceil(data.length / 10) === 0)
            .map((point) => (
              <circle
                className="admin-chart-dot"
                cx={point.x}
                cy={point.y}
                key={point.date}
                r="3.5"
                style={{ fill: selected.color }}
              >
                <title>
                  {point.date}: {formatValue(metric, point.value)}
                </title>
              </circle>
            ))}
        </svg>
        <div className="admin-chart-labels">
          {labels.map((point, index) => (
            <span key={`${point?.date ?? "range"}-${index}`}>
              {point ? formatDate(point.date) : ""}
            </span>
          ))}
        </div>
      </div>
      <details className="admin-chart-data">
        <summary>View daily data</summary>
        <div className="admin-chart-data-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bookings</th>
                <th>Paid revenue</th>
                <th>New active users</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr key={point.date}>
                  <td>{point.date}</td>
                  <td>{point.bookings.toLocaleString()}</td>
                  <td>{formatValue("paidRevenue", point.paidRevenue)}</td>
                  <td>{point.newUsers.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
