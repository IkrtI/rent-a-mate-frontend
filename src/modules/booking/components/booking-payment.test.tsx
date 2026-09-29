import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StripePaymentForm } from "./booking-payment";

const confirmPayment = vi.fn().mockResolvedValue({ paymentIntent: { status: "processing" } });

vi.mock("@stripe/react-stripe-js", () => ({
  PaymentElement: () => <div>Stripe payment methods</div>,
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
    expect(screen.getByText(/Choose PromptPay to scan a QR code/)).toBeInTheDocument();
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
});
