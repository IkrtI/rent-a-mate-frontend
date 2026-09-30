"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { login, SessionRequestError } from "../client";
import { safeReturnTo } from "../navigation";
import { Field, inputClassName, primaryButtonClassName } from "./form-controls";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});
type Values = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(
    searchParams.get("reason") === "forbidden"
      ? "This account does not have administrator access. Sign in with an Admin account."
      : null,
  );
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { email: searchParams.get("email") ?? "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    try {
      const { user } = await login(values);
      queryClient.setQueryData(["session"], { user });
      const requestedDestination = searchParams.get("returnTo");
      router.replace(
        requestedDestination
          ? safeReturnTo(requestedDestination)
          : user.role === "admin"
            ? "/admin"
            : "/dashboard",
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof SessionRequestError
          ? error.details.message
          : "Sign in is unavailable right now.",
      );
    }
  });

  return (
    <div className="w-full">
      <p className="font-sans text-[11px] tracking-[0.12em] text-[var(--primary-text-accent)] uppercase">
        Sign in
      </p>
      <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight">
        Pick up where you left off.
      </h2>
      <p className="text-muted-foreground mt-3 text-sm leading-6">
        Your bookings, messages, and account are all here.
      </p>
      {searchParams.get("registered") === "1" ? (
        <p
          className="mt-5 rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
          role="status"
        >
          Account created. Sign in to continue.
        </p>
      ) : null}
      <form className="mt-7 grid gap-5" onSubmit={onSubmit} noValidate>
        <Field id="login-email" label="Email address" error={errors.email?.message}>
          <input
            aria-describedby={errors.email ? "login-email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            className={inputClassName}
            id="login-email"
            required
            type="email"
            {...registerField("email")}
          />
        </Field>
        <Field id="login-password" label="Password" error={errors.password?.message}>
          <input
            aria-describedby={errors.password ? "login-password-error" : undefined}
            aria-invalid={Boolean(errors.password)}
            autoComplete="current-password"
            className={inputClassName}
            id="login-password"
            required
            type="password"
            {...registerField("password")}
          />
        </Field>
        {message ? (
          <p className="text-destructive text-sm" role="alert">
            {message}
          </p>
        ) : null}
        <button className={primaryButtonClassName} disabled={isSubmitting} type="submit">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="text-muted-foreground mt-6 text-center text-sm">
        New here?{" "}
        <Link
          className="font-bold text-[var(--primary-text-accent)] hover:underline"
          href="/signup"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
