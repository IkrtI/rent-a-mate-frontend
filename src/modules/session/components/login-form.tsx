"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: searchParams.get("email") ?? "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    try {
      await login(values);
      router.replace(safeReturnTo(searchParams.get("returnTo")));
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
      <p className="font-sans text-[11px] tracking-[0.12em] text-[#e34b58] uppercase">Sign in</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
        Pick up where you left off.
      </h2>
      <p className="mt-3 text-sm leading-6 text-neutral-600">
        Your bookings, messages, and account are all here.
      </p>
      {searchParams.get("registered") === "1" ? (
        <p
          className="mt-5 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          role="status"
        >
          Account created. Sign in to continue.
        </p>
      ) : null}
      <form className="mt-7 grid gap-5" onSubmit={onSubmit} noValidate>
        <Field label="Email address" error={errors.email?.message}>
          <input
            autoComplete="email"
            className={inputClassName}
            type="email"
            {...registerField("email")}
          />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input
            autoComplete="current-password"
            className={inputClassName}
            type="password"
            {...registerField("password")}
          />
        </Field>
        {message ? (
          <p className="text-sm text-red-600" role="alert">
            {message}
          </p>
        ) : null}
        <button className={primaryButtonClassName} disabled={isSubmitting} type="submit">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-600">
        New here?{" "}
        <Link className="font-bold text-[#e34b58] hover:underline" href="/signup">
          Create an account
        </Link>
      </p>
    </div>
  );
}
