import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { AccountEditor } from "./account-editor";

const { replace, refresh } = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));

const user = { id: 12, name: "Mew", email: "mew@example.com", role: "mate" as const };

function show() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AccountEditor user={user} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  replace.mockClear();
  refresh.mockClear();
});

it("saves the display name and updates the visible account", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ ...user, name: "Mew Updated" }), { status: 200 }),
    );
  vi.stubGlobal("fetch", fetchMock);
  show();
  fireEvent.change(screen.getByLabelText("Name shown on your profile"), {
    target: { value: "Mew Updated" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save name" }));
  await screen.findByText("Display name saved.");
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/account",
    expect.objectContaining({ method: "PATCH", body: JSON.stringify({ name: "Mew Updated" }) }),
  );
  expect(refresh).toHaveBeenCalled();
});

it("checks password confirmation before changing it and returns to sign-in", async () => {
  const fetchMock = vi
    .fn()
    .mockImplementation((url: string) =>
      Promise.resolve(
        new Response(
          url === "/api/auth/logout" ? JSON.stringify({ success: true }) : JSON.stringify(user),
          { status: 200 },
        ),
      ),
    );
  vi.stubGlobal("fetch", fetchMock);
  show();
  const form = screen.getByRole("heading", { name: "Password" }).closest("form")!;
  fireEvent.change(within(form).getByLabelText("Current password"), {
    target: { value: "old-password" },
  });
  fireEvent.change(within(form).getByLabelText("New password"), {
    target: { value: "new-password" },
  });
  fireEvent.change(within(form).getByLabelText("Confirm new password"), {
    target: { value: "different" },
  });
  fireEvent.click(within(form).getByRole("button", { name: "Change password" }));
  expect(screen.getByRole("alert")).toHaveTextContent("New passwords do not match.");
  expect(fetchMock).not.toHaveBeenCalled();
  fireEvent.change(within(form).getByLabelText("Confirm new password"), {
    target: { value: "new-password" },
  });
  fireEvent.click(within(form).getByRole("button", { name: "Change password" }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?passwordChanged=1"));
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/account/password",
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ currentPassword: "old-password", newPassword: "new-password" }),
    }),
  );
});
