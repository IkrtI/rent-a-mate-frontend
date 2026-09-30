import Link from "next/link";

import { requestAuthenticatedBackend } from "@/app/api/_lib/session";
import { PhotosEditor, ProfileEditor } from "@/modules/mate-profile/management-panels";
import { getMateEditorData } from "@/modules/mate-profile/server-data";
import { AccountEditor } from "@/modules/session/components/account-editor";
import { sessionUserSchema } from "@/modules/session/schemas";

export const metadata = {
  title: "Your profile | mateflow.",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await requestAuthenticatedBackend({
    path: "/users/me",
    responseSchema: sessionUserSchema,
  }).catch(() => null);
  if (!user)
    return (
      <main className="profile-settings">
        <section className="profile-settings-error" role="alert">
          <h1>We couldn’t load your profile.</h1>
          <p>Check your connection and try again.</p>
          <Link href="/profile">Retry profile</Link>
        </section>
      </main>
    );
  const mate = user.role === "mate" ? await getMateEditorData() : null;

  return (
    <main className="profile-settings">
      <header className="profile-settings-heading">
        <div>
          <p>Your account</p>
          <h1>Profile & settings</h1>
          <span>
            Keep your details and {user.role === "mate" ? "Mate listing" : "account"} up to date.
          </span>
        </div>
        {user.role === "mate" && (
          <Link className="button" href="/mate/availability">
            Edit weekly hours
          </Link>
        )}
      </header>
      <AccountEditor user={user} />
      {mate && (
        <>
          <section aria-labelledby="mate-heading" className="profile-settings-section" id="mate">
            <div className="profile-settings-section-heading">
              <h2 id="mate-heading">Mate profile</h2>
              <p>Your public details, activities, and location.</p>
            </div>
            {mate.loadError ? (
              <div className="profile-settings-error" role="alert">
                <p>We couldn’t load your Mate profile.</p>
                <Link href="/profile#mate">Retry Mate profile</Link>
              </div>
            ) : (
              <ProfileEditor {...mate} />
            )}
          </section>
          <section
            aria-labelledby="photos-heading"
            className="profile-settings-section"
            id="photos"
          >
            <div className="profile-settings-section-heading">
              <h2 id="photos-heading">Profile photos</h2>
              <p>Choose and crop the images renters will see.</p>
            </div>
            {mate.loadError ? (
              <div className="profile-settings-error" role="alert">
                <p>Photos couldn’t load with your Mate profile.</p>
                <Link href="/profile#photos">Retry photos</Link>
              </div>
            ) : mate.mate ? (
              <PhotosEditor mate={mate.mate} />
            ) : (
              <div className="profile-settings-error">
                <p>Create your Mate profile before adding photos.</p>
                <a href="#mate">Go to Mate profile</a>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
