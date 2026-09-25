"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { register, SessionRequestError } from "../client";
import { Field, inputClassName, primaryButtonClassName } from "./form-controls";

const schema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
    acceptPolicies: z.boolean().refine(Boolean, "Please accept the Terms and Privacy Policy."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
type Values = z.infer<typeof schema>;

export function SignupForm({
  initialRole = "renter",
}: {
  initialRole?: "renter" | "mate";
} = {}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<"renter" | "mate">(initialRole);
  const [message, setMessage] = useState<string | null>(null);
  const {
    register: registerField,
    handleSubmit,
    control,
    trigger,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptPolicies: false,
    },
  });
  const password = useWatch({ control, name: "password" });

  useEffect(() => {
    if (touchedFields.confirmPassword) void trigger("confirmPassword");
  }, [password, touchedFields.confirmPassword, trigger]);

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
        <p className="font-sans text-[11px] tracking-[0.12em] text-[var(--primary-text-accent)] uppercase">
          Step 1 of 2
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
          What brings you here?
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Choose how you would like to use mateflow.
        </p>
        <div className="mt-7 grid gap-3">
          {(
            [
              ["renter", "I want to find a mate", "Browse profiles and request time together."],
              ["mate", "I want to become a mate", "Share activities and manage booking requests."],
            ] as const
          ).map(([value, title, description]) => (
            <button
              aria-pressed={role === value}
              className={`flex min-h-24 items-start gap-3 rounded-md border p-4 text-left transition-colors ${
                role === value
                  ? "border-[#ff5c67] bg-[#fff0f1] dark:border-[#f17a81] dark:bg-[#382a2c]"
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
          <Link
            className="font-bold text-[var(--primary-text-accent)] hover:underline"
            href="/login"
          >
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
      <p className="font-mono text-[11px] tracking-[0.12em] text-[var(--primary-text-accent)] uppercase">
        Step 2 of 2
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
        Create your account.
      </h2>
      <form className="mt-7 grid gap-4" onSubmit={onSubmit} noValidate>
        <Field id="signup-name" label="Full name" error={errors.name?.message}>
          <input
            aria-describedby={errors.name ? "signup-name-error" : undefined}
            aria-invalid={Boolean(errors.name)}
            autoComplete="name"
            className={inputClassName}
            id="signup-name"
            required
            {...registerField("name")}
          />
        </Field>
        <Field id="signup-email" label="Email address" error={errors.email?.message}>
          <input
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            className={inputClassName}
            id="signup-email"
            required
            type="email"
            {...registerField("email")}
          />
        </Field>
        <Field
          id="signup-password"
          label="Password"
          error={errors.password?.message}
          hint="At least 8 characters."
        >
          <input
            aria-describedby={errors.password ? "signup-password-error" : "signup-password-hint"}
            aria-invalid={Boolean(errors.password)}
            autoComplete="new-password"
            className={inputClassName}
            id="signup-password"
            required
            type="password"
            {...registerField("password")}
          />
        </Field>
        <Field
          id="signup-confirm-password"
          label="Confirm password"
          error={errors.confirmPassword?.message}
        >
          <input
            aria-describedby={errors.confirmPassword ? "signup-confirm-password-error" : undefined}
            aria-invalid={Boolean(errors.confirmPassword)}
            autoComplete="new-password"
            className={inputClassName}
            id="signup-confirm-password"
            required
            type="password"
            {...registerField("confirmPassword")}
          />
        </Field>
        <div className="grid gap-2">
          <div className="flex items-start gap-3 text-sm leading-5 text-neutral-700">
            <input
              aria-describedby={errors.acceptPolicies ? "signup-policies-error" : undefined}
              aria-invalid={Boolean(errors.acceptPolicies)}
              aria-labelledby="signup-policies-label"
              className="mt-0.5 size-4 shrink-0 accent-[#ff5c67]"
              id="signup-policies"
              type="checkbox"
              {...registerField("acceptPolicies")}
            />
            <span id="signup-policies-label">
              I agree to the{" "}
              <Link
                className="font-semibold text-[var(--primary-text-accent)] underline"
                href="/terms"
                rel="noopener noreferrer"
                target="_blank"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                className="font-semibold text-[var(--primary-text-accent)] underline"
                href="/privacy"
                rel="noopener noreferrer"
                target="_blank"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </div>
          {errors.acceptPolicies ? (
            <span
              className="text-xs font-medium text-red-600"
              id="signup-policies-error"
              role="alert"
            >
              {errors.acceptPolicies.message}
            </span>
          ) : null}
        </div>
        {message ? (
          <p className="text-sm text-red-600" role="alert">
            {message}
          </p>
        ) : null}
        <button className={primaryButtonClassName} disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
