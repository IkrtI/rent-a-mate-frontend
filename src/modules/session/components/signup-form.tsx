"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { register, SessionRequestError } from "../client";
import { Field, inputClassName, primaryButtonClassName } from "./form-controls";

const schema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
type Values = z.infer<typeof schema>;

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<"renter" | "mate">("renter");
  const [message, setMessage] = useState<string | null>(null);
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        role,
      });
      router.push(`/login?registered=1&email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      setMessage(
        error instanceof SessionRequestError
          ? error.details.message
          : "Account creation is unavailable right now.",
      );
    }
  });

  if (step === 1) {
    return (
      <div className="w-full">
        <p className="font-mono text-xs text-[#e34b58] uppercase">Step 1 of 2</p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-normal text-neutral-950">
          How will you use mateflow?
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Choose the role that matches your plans.
        </p>
        <div className="mt-7 grid gap-3">
          {(
            [
              ["renter", "I want to find a mate", "Browse profiles and request time together."],
              ["mate", "I want to become a mate", "Share activities and manage booking requests."],
            ] as const
          ).map(([value, title, description]) => (
            <button
              className={`flex min-h-24 items-start gap-3 rounded-md border p-4 text-left transition-colors ${
                role === value
                  ? "border-[#ff5c67] bg-[#fff0f1]"
                  : "border-neutral-300 bg-white hover:border-neutral-500"
              }`}
              key={value}
              onClick={() => setRole(value)}
              type="button"
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-current">
                {role === value ? <Check aria-hidden size={13} /> : null}
              </span>
              <span>
                <span className="block text-sm font-bold text-neutral-950">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-neutral-600">{description}</span>
              </span>
            </button>
          ))}
        </div>
        <button
          className={`${primaryButtonClassName} mt-6`}
          onClick={() => setStep(2)}
          type="button"
        >
          Continue
        </button>
        <p className="mt-6 text-center text-sm text-neutral-600">
          Already have an account?{" "}
          <Link className="font-bold text-[#e34b58] hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-950"
        onClick={() => setStep(1)}
        type="button"
      >
        <ArrowLeft aria-hidden size={16} /> Back
      </button>
      <p className="font-mono text-xs text-[#e34b58] uppercase">Step 2 of 2</p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-normal text-neutral-950">
        A few details first.
      </h2>
      <form className="mt-7 grid gap-4" onSubmit={onSubmit} noValidate>
        <Field label="Full name" error={errors.name?.message}>
          <input autoComplete="name" className={inputClassName} {...registerField("name")} />
        </Field>
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
            autoComplete="new-password"
            className={inputClassName}
            type="password"
            {...registerField("password")}
          />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <input
            autoComplete="new-password"
            className={inputClassName}
            type="password"
            {...registerField("confirmPassword")}
          />
        </Field>
        {message ? (
          <p className="text-sm text-red-600" role="alert">
            {message}
          </p>
        ) : null}
        <button className={primaryButtonClassName} disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-xs leading-5 text-neutral-500">
        By continuing, you agree to our Terms and Privacy Policy.
      </p>
    </div>
  );
}
