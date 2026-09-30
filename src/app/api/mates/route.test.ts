import { beforeEach, describe, expect, it, vi } from "vitest";

const { requestBackend, requestAuthenticatedBackend } = vi.hoisted(() => ({
  requestBackend: vi.fn(),
  requestAuthenticatedBackend: vi.fn(),
}));
vi.mock("@/modules/backend-client/client", async () => ({
  ...(await vi.importActual<typeof import("@/modules/backend-client/client")>(
    "@/modules/backend-client/client",
  )),
  requestBackend,
}));
vi.mock("../_lib/session", () => ({ requestAuthenticatedBackend }));

import { DELETE, GET, POST, PUT } from "./[[...path]]/route";
import { bangkokToday } from "@/modules/mate-profile/time-selection";

function dateOffset(days: number) {
  const date = new Date(`${bangkokToday()}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

describe("mate BFF routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("proxies public date-specific availability through the backend client", async () => {
    requestBackend.mockResolvedValue({
      date: "2026-10-10",
      openSlots: [{ start: "09:00", end: "10:00" }],
    });
    const response = await GET(
      new Request("https://example.test/api/mates/7/availability?date=2026-10-10"),
      { params: Promise.resolve({ path: ["7", "availability"] }) },
    );
    expect(response.status, await response.clone().text()).toBe(200);
    expect(requestBackend).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/mates/7/availability?date=2026-10-10" }),
    );
  });

  it("rejects malformed public availability dates without calling the backend", async () => {
    const response = await GET(
      new Request("https://example.test/api/mates/7/availability?date=tomorrow"),
      { params: Promise.resolve({ path: ["7", "availability"] }) },
    );
    expect(response.status).toBe(400);
    expect(requestBackend).not.toHaveBeenCalled();
  });

  it("proxies saved date-specific availability for the signed-in Mate", async () => {
    requestAuthenticatedBackend.mockResolvedValue({ overrides: [] });
    const response = await GET(
      new Request("https://example.test/api/mates/me/availability/dates"),
      { params: Promise.resolve({ path: ["me", "availability", "dates"] }) },
    );

    expect(response.status).toBe(200);
    expect(requestAuthenticatedBackend).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/mates/me/availability/dates" }),
    );
  });

  it("rejects a past date override before forwarding it", async () => {
    const response = await PUT(
      new Request("https://example.test/api/mates/me/availability/dates/old", {
        method: "PUT",
        headers: { origin: "https://example.test", "content-type": "application/json" },
        body: JSON.stringify({ slots: [] }),
      }),
      { params: Promise.resolve({ path: ["me", "availability", "dates", dateOffset(-1)] }) },
    );

    expect(response.status).toBe(400);
    expect(requestAuthenticatedBackend).not.toHaveBeenCalled();
  });

  it("sends a date-specific availability update to the backend", async () => {
    const date = dateOffset(1);
    requestAuthenticatedBackend.mockResolvedValue({ date, slots: [] });
    const response = await PUT(
      new Request(`https://example.test/api/mates/me/availability/dates/${date}`, {
        method: "PUT",
        headers: { origin: "https://example.test", "content-type": "application/json" },
        body: JSON.stringify({ slots: [] }),
      }),
      { params: Promise.resolve({ path: ["me", "availability", "dates", date] }) },
    );

    expect(response.status).toBe(200);
    expect(requestAuthenticatedBackend).toHaveBeenCalledWith(
      expect.objectContaining({
        path: `/mates/me/availability/dates/${date}`,
        method: "PUT",
        body: { slots: [] },
      }),
    );
  });

  it("clears a date override so weekly hours apply again", async () => {
    const date = dateOffset(1);
    requestAuthenticatedBackend.mockResolvedValue({ cleared: true });
    const response = await DELETE(
      new Request(`https://example.test/api/mates/me/availability/dates/${date}`, {
        method: "DELETE",
        headers: { origin: "https://example.test" },
      }),
      { params: Promise.resolve({ path: ["me", "availability", "dates", date] }) },
    );

    expect(response.status).toBe(200);
    expect(requestAuthenticatedBackend).toHaveBeenCalledWith(
      expect.objectContaining({
        path: `/mates/me/availability/dates/${date}`,
        method: "DELETE",
      }),
    );
  });

  it("validates mate profile creation before forwarding it", async () => {
    requestAuthenticatedBackend.mockResolvedValue({ mate: { id: 2 } });
    const response = await POST(
      new Request("https://example.test/api/mates", {
        method: "POST",
        headers: { origin: "https://example.test", "content-type": "application/json" },
        body: JSON.stringify({
          age: 17,
          hourlyRate: 50,
          provinceId: 1,
          districtId: 1,
          activityIds: [],
          interestIds: [],
        }),
      }),
      { params: Promise.resolve({ path: [] }) },
    );
    expect(response.status).toBe(400);
    expect(requestAuthenticatedBackend).not.toHaveBeenCalled();
  });
});
