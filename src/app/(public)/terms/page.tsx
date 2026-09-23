import type { Metadata } from "next";

import { EditorialPage } from "@/components/shared/editorial-page";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The essential rules for using matefor as a renter or Mate.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <EditorialPage
      eyebrow="TERMS OF SERVICE"
      title="Terms for a better kind of plan."
      description="The essential rules for using matefor as a renter or Mate."
      updated="18 Sep 2026"
      intro="These terms explain how the matefor service works and what we ask from the people who use it. By creating an account or making a booking, you agree to follow them."
      sections={[
        {
          heading: "1. Using matefor",
          paragraphs: [
            "You must be at least the age required in your location to use the service. Keep your account information accurate, protect your sign-in details, and use the platform lawfully.",
            "A Mate offers social company for an agreed activity. The service does not promise a particular outcome or relationship.",
          ],
        },
        {
          heading: "2. Bookings and availability",
          paragraphs: [
            "A booking request becomes a booking only when the Mate confirms it. Availability can change before confirmation. Review the activity, date, time, and price before sending a request.",
            "If a plan changes, contact the other participant as soon as you can and follow the cancellation options shown for your booking.",
          ],
        },
        {
          heading: "3. Mock payment",
          paragraphs: [
            "matefor uses simulated payment in this release. No real payment is collected through the current booking flow. Do not send payment details through messages or to another user.",
          ],
        },
        {
          heading: "4. Reviews and conduct",
          paragraphs: [
            "Reviews should reflect a completed booking and describe your experience honestly. Harassment, discrimination, threats, and misleading profile information are not allowed.",
            "We may restrict accounts or content when needed to protect people or comply with the law.",
          ],
        },
        {
          heading: "5. Your responsibilities",
          paragraphs: [
            "Meet in ways that are legal, safe, and respectful. Share only information you are comfortable disclosing, and tell someone you trust about your plans.",
            "You are responsible for the choices you make before and during a meetup. The platform does not replace your judgment or local emergency services.",
          ],
        },
      ]}
    />
  );
}
