import Link from "next/link";

import { requestAuthenticatedBackend } from "@/app/api/_lib/session";
import { AccountEditor } from "@/modules/session/components/account-editor";
import { sessionUserSchema } from "@/modules/session/schemas";

export const metadata = {
  title: "Sign-in & security | mateflow.",
  robots: { index: false, follow: false },
};

export default async function ProfileSecurityPage() {
  const user = await requestAuthenticatedBackend({
    path: "/users/me",
    responseSchema: sessionUserSchema,
  }).catch(() => null);

  if (!user) {
    return (
      <main className="profile-settings">
        <section className="profile-settings-error" role="alert">
          <h1>We couldn’t load your security settings.</h1>
          <p>Check your connection and try again.</p>
          <Link href="/profile/security">Retry security settings</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="profile-settings">
      <header className="profile-settings-heading">
        <div>
          <p>Your account</p>
          <h1>Sign-in & security</h1>
          <span>Manage the email address and password used to access your account.</span>
        </div>
        <Link className="button" href="/profile">
          Back to profile
        </Link>
      </header>
      <AccountEditor mode="security" user={user} />
    </main>
  );
}
