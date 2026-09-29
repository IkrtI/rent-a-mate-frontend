import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StripePaymentForm } from "./booking-payment";

const confirmPayment = vi.fn().mockResolvedValue({ paymentIntent: { status: "processing" } });

vi.mock("@stripe/react-stripe-js", () => ({
  PaymentElement: ({ onReady }: { onReady: () => void }) => {
    function Element() {
      useEffect(onReady, []);
      return <div>Stripe payment methods</div>;
    }
    return <Element />;
  },
  useElements: () => ({}),
  useStripe: () => ({ confirmPayment }),
}));

afterEach(() => {
  cleanup();
  confirmPayment.mockClear();
});

describe("StripePaymentForm", () => {
  it("confirms through Stripe Elements with a return URL to the booking", async () => {
    const onComplete = vi.fn();
    render(<StripePaymentForm bookingId={12} onComplete={onComplete} />);

    expect(screen.getByText("Stripe payment methods")).toBeInTheDocument();
    expect(screen.getByText(/Pay with PromptPay/)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Confirm payment" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm payment" }));

    await waitFor(() =>
      expect(confirmPayment).toHaveBeenCalledWith({
        elements: expect.any(Object),
        confirmParams: { return_url: `${window.location.origin}/bookings/12` },
        redirect: "if_required",
      }),
    );
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
  });

  it("shows Stripe integration errors without crashing the page", async () => {
    confirmPayment.mockRejectedValueOnce(new Error("Payment Element is unavailable"));
    render(<StripePaymentForm bookingId={12} onComplete={vi.fn()} />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Confirm payment" })).toBeEnabled(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirm payment" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Payment Element is unavailable");
    expect(screen.getByRole("button", { name: "Confirm payment" })).toBeEnabled();
  });
});
