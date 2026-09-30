import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("*/api/mates/me/availability/dates", () => HttpResponse.json({ overrides: [] })),
  http.get("http://localhost:3000/api/v1/", () =>
    HttpResponse.json({ data: { status: "ok" }, message: "OK", status: "success" }),
  ),
];
