import Link from "next/link";

type ErrorStatusPageProps = {
  code: string;
  eyebrow?: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
};

export function ErrorStatusPage({
  code,
  eyebrow = "Something went off course",
  title,
  description,
  action = { href: "/", label: "Back to home" },
}: ErrorStatusPageProps) {
  return (
    <main className="status-page">
      <div className="status-page__content">
        <Link className="status-page__brand" href="/" aria-label="matefor home">
          <span className="status-page__mark">m</span> matefor.
        </Link>
        <p className="status-page__code">{code}</p>
        <p className="status-page__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="status-page__description">{description}</p>
        <Link className="status-page__action" href={action.href}>
          {action.label}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
  );
}
