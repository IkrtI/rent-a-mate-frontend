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
vi.mock("../../_lib/session", () => ({ requestAuthenticatedBackend }));

import { GET, POST } from "./[[...path]]/route";

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
    expect(response.status).toBe(200);
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
