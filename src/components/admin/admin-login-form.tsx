"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, Mail } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof payload.message === "string"
            ? payload.message
            : "Sign in could not be completed. Check your details and try again.";
        setError(message);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Sign in is temporarily unavailable. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      <label className="admin-field">
        <span>Email address</span>
        <span className="admin-input-wrap">
          <Mail aria-hidden="true" size={17} />
          <input
            autoComplete="username"
            name="email"
            placeholder="name@matefor.com"
            required
            type="email"
          />
        </span>
      </label>
      <label className="admin-field">
        <span>Password</span>
        <span className="admin-input-wrap">
          <KeyRound aria-hidden="true" size={17} />
          <input
            autoComplete="current-password"
            minLength={8}
            name="password"
            placeholder="Enter your password"
            required
            type="password"
          />
        </span>
      </label>
      {error && (
        <p className="admin-form-alert" role="alert">
          {error}
        </p>
      )}
      <button className="admin-primary-button admin-login-submit" disabled={pending} type="submit">
        {pending ? "Verifying access…" : "Sign in to Admin"}
        {!pending && <ArrowRight aria-hidden="true" size={17} />}
      </button>
    </form>
  );
}
