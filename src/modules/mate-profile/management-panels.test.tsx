import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProfileEditor } from "./management-panels";
import type { MateProfile } from "./schemas";

const mate: MateProfile = {
  id: 7,
  user: { id: 12, name: "Mew" },
  age: 24,
  bio: "Coffee walks",
  hourlyRate: 250,
  isActive: true,
  deactivatedAt: null,
  province: { id: 1, name: "Bangkok" },
  district: { id: 11, name: "Pathum Wan" },
  activities: [],
  interests: [],
  photos: [],
  availability: [],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ProfileEditor", () => {
  it("uses POST to create once, then PATCH for later saves", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/districts"))
        return Promise.resolve(
          new Response(JSON.stringify({ items: [{ id: 11, name: "Pathum Wan" }] }), {
            status: 200,
          }),
        );
      return Promise.resolve(
        new Response(JSON.stringify({ mate }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <ProfileEditor
        mate={null}
        activities={[]}
        interests={[]}
        provinces={[{ id: 1, name: "Bangkok" }]}
        districts={[{ id: 11, name: "Pathum Wan" }]}
        lookupError={false}
        loadError={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("Age"), { target: { value: "24" } });
    fireEvent.change(screen.getByLabelText("Hourly rate (THB)"), { target: { value: "250" } });
    fireEvent.change(screen.getByLabelText("Province"), { target: { value: "1" } });
    await screen.findByRole("option", { name: "Pathum Wan" });
    fireEvent.change(screen.getByLabelText("District"), { target: { value: "11" } });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Create profile" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Create profile" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Save profile" })).toBeEnabled());
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/mates")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => url === "/api/mates/me")).toBe(true),
    );
    expect(fetchMock.mock.calls.find(([url]) => url === "/api/mates/me")?.[1]?.method).toBe(
      "PATCH",
    );
  });

  it("reloads dependent districts when returning to the saved province", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const items = url.endsWith("/2/districts")
        ? [{ id: 22, name: "District B" }]
        : [{ id: 11, name: "District A" }];
      return Promise.resolve(new Response(JSON.stringify({ items }), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <ProfileEditor
        mate={mate}
        activities={[]}
        interests={[]}
        provinces={[
          { id: 1, name: "Bangkok" },
          { id: 2, name: "Other" },
        ]}
        districts={[{ id: 11, name: "District A" }]}
        lookupError={false}
        loadError={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("Province"), { target: { value: "2" } });
    await screen.findByRole("option", { name: "District B" });
    fireEvent.change(screen.getByLabelText("Province"), { target: { value: "1" } });
    await screen.findByRole("option", { name: "District A" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
