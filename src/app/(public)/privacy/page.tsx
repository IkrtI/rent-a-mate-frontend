import type { Metadata } from "next";

import { EditorialPage } from "@/components/shared/editorial-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "A clear overview of the information that supports your matefor experience.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy",
    description: "A clear overview of the information that supports your matefor experience.",
    url: "/privacy",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <EditorialPage
      eyebrow="PRIVACY POLICY"
      title="Privacy, in plain language."
      description="A clear overview of the information that supports your matefor experience."
      updated="18 Sep 2026"
      intro="This page reflects the current product specification and explains the account and booking information used to run the service."
      sections={[
        {
          heading: "Information we handle",
          paragraphs: [
            "Your account name, email address, role, and account settings help us provide the service. Mate profile details, activity preferences, booking information, and reviews support discovery and agreed plans.",
            "We also receive technical information needed to protect and operate the site, such as request and device details.",
          ],
        },
        {
          heading: "How we use it",
          paragraphs: [
            "We use information to create and protect accounts, show public Mate profiles, coordinate booking requests, respond to support needs, and improve service reliability.",
            "We do not display private account credentials in public discovery results.",
          ],
        },
        {
          heading: "Public vs private data",
          paragraphs: [
            "Public discovery results are intentionally limited to profile information a Mate has chosen to share, including name, location, activities, interests, photos, rates, and public reviews.",
            "Email addresses, passwords, session tokens, and private account details are not shown on public profiles.",
          ],
        },
        {
          heading: "Security approach",
          paragraphs: [
            "Passwords are stored as one-way scrypt hashes with individual salts by the backend service. Session tokens are held in secure, HttpOnly cookies by the frontend adapter.",
            "No internet service can guarantee perfect security. Use a unique password and contact support if you believe your account is at risk.",
          ],
        },
        {
          heading: "Your choices",
          paragraphs: [
            "You can update profile details through available account settings and choose what you add to a public Mate profile.",
            "For a question about access, correction, or deletion of your information, contact us and we’ll explain the options available for your account.",
          ],
        },
      ]}
    />
  );
}
