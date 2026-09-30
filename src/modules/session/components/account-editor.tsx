"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { BrowserClientError, requestSameOrigin } from "@/modules/backend-client/browser";
import { sessionUserSchema } from "../schemas";
import type { SessionUser } from "../types";

function messageFor(error: unknown) {
  return error instanceof BrowserClientError
    ? error.message
    : "Your changes could not be saved. Please try again.";
}

export function AccountEditor({
  user,
  mode = "profile",
}: {
  user: SessionUser;
  mode?: "profile" | "security";
}) {
  const securityMode = mode === "security";
  const router = useRouter();
  const queryClient = useQueryClient();
  const [current, setCurrent] = useState(user);
  const [busy, setBusy] = useState<"name" | "email" | "password" | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { text: string; error: boolean }>>({});

  async function save(
    event: React.FormEvent<HTMLFormElement>,
    section: "name" | "email" | "password",
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    if (section === "password" && fields.get("newPassword") !== fields.get("confirmPassword")) {
      setFeedback((previous) => ({
        ...previous,
        password: { text: "New passwords do not match.", error: true },
      }));
      return;
    }
    const body =
      section === "name"
        ? { name: String(fields.get("name") ?? "").trim() }
        : section === "email"
          ? {
              email: String(fields.get("email") ?? "").trim(),
              currentPassword: String(fields.get("currentPassword") ?? ""),
            }
          : {
              currentPassword: String(fields.get("currentPassword") ?? ""),
              newPassword: String(fields.get("newPassword") ?? ""),
            };
    setBusy(section);
    setFeedback((previous) => ({ ...previous, [section]: { text: "", error: false } }));
    try {
      const updated = await requestSameOrigin(
        section === "name" ? "/api/account" : `/api/account/${section}`,
        sessionUserSchema,
        { method: "PATCH", body: JSON.stringify(body) },
      );
      if (section === "password") {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        queryClient.clear();
        router.replace("/login?passwordChanged=1");
        router.refresh();
        return;
      }
      setCurrent(updated);
      queryClient.setQueryData(["session"], { user: updated });
      form.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach((input) => {
        input.value = "";
      });
      setFeedback((previous) => ({
        ...previous,
        [section]: {
          text: section === "name" ? "Display name saved." : "Email address saved.",
          error: false,
        },
      }));
      router.refresh();
    } catch (error) {
      setFeedback((previous) => ({
        ...previous,
        [section]: { text: messageFor(error), error: true },
      }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      aria-labelledby="account-heading"
      className="account-editor"
      id={securityMode ? "security" : "account"}
    >
      <div className="account-editor-heading">
        <h2 id="account-heading">{securityMode ? "Sign-in & security" : "Account details"}</h2>
        <p>
          {securityMode
            ? "Update the email address you use to sign in or change your password."
            : "Choose the name people see on your profile."}
        </p>
        {!securityMode && (
          <Link className="account-editor-link" href="/profile/security">
            Change email or password
          </Link>
        )}
      </div>
      <div className={`account-editor-forms account-editor-forms--${mode}`}>
        {!securityMode && (
          <form onSubmit={(event) => void save(event, "name")}>
            <h3>Display name</h3>
            <label>
              Name shown on your profile
              <input
                autoComplete="name"
                defaultValue={current.name}
                maxLength={80}
                minLength={1}
                name="name"
                required
                type="text"
              />
            </label>
            {feedback.name?.text && (
              <p role={feedback.name.error ? "alert" : "status"}>{feedback.name.text}</p>
            )}
            <button className="button" disabled={busy !== null} type="submit">
              {busy === "name" ? "Saving…" : "Save name"}
            </button>
          </form>
        )}
        {securityMode && (
          <>
            <form onSubmit={(event) => void save(event, "email")}>
              <h3>Email address</h3>
              <label>
                New email
                <input
                  autoComplete="email"
                  defaultValue={current.email ?? ""}
                  name="email"
                  required
                  type="email"
                />
              </label>
              <label>
                Current password
                <input
                  autoComplete="current-password"
                  name="currentPassword"
                  required
                  type="password"
                />
              </label>
              {feedback.email?.text && (
                <p role={feedback.email.error ? "alert" : "status"}>{feedback.email.text}</p>
              )}
              <button className="button" disabled={busy !== null} type="submit">
                {busy === "email" ? "Saving…" : "Update email"}
              </button>
            </form>
            <form onSubmit={(event) => void save(event, "password")}>
              <h3>Password</h3>
              <label>
                Current password
                <input
                  autoComplete="current-password"
                  name="currentPassword"
                  required
                  type="password"
                />
              </label>
              <label>
                New password
                <input
                  autoComplete="new-password"
                  maxLength={128}
                  minLength={8}
                  name="newPassword"
                  required
                  type="password"
                />
              </label>
              <label>
                Confirm new password
                <input
                  autoComplete="new-password"
                  maxLength={128}
                  minLength={8}
                  name="confirmPassword"
                  required
                  type="password"
                />
              </label>
              <p>After changing your password, sign in again on this device.</p>
              {feedback.password?.text && (
                <p role={feedback.password.error ? "alert" : "status"}>{feedback.password.text}</p>
              )}
              <button className="button" disabled={busy !== null} type="submit">
                {busy === "password" ? "Updating…" : "Change password"}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
