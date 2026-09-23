import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const mainLinks = [
  { href: "/mates", label: "Find a Mate" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/safety", label: "Safety" },
];

export function Brand() {
  return (
    <Link aria-label="matefor. home" className="brand" href="/">
      <span aria-hidden="true" className="brand-mark">
        m
      </span>
      <span>matefor.</span>
    </Link>
  );
}

export function PublicHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        <nav aria-label="Main navigation" className="desktop-nav">
          {mainLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="login-link" href="/login">
            Log in
          </Link>
          <Link className="button button-small" href="/signup">
            Sign up
          </Link>
          <details className="mobile-menu">
            <summary aria-label="Open navigation menu">
              <span />
              <span />
            </summary>
            <nav aria-label="Mobile navigation">
              {mainLinks.map((link) => (
                <Link href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
              <Link href="/login">Log in</Link>
              <Link href="/signup">Sign up</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Brand />
          <p>Good company, thoughtfully connected.</p>
        </div>
        <nav aria-label="Footer navigation" className="footer-nav">
          <Link href="/safety">Safety</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/signup?role=mate">
            Become a Mate <ArrowUpRight aria-hidden="true" size={14} />
          </Link>
        </nav>
        <p className="copyright">© 2026 matefor. Made for better plans.</p>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <PublicHeader />
      {children}
      <PublicFooter />
    </>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="page-hero">
      <div className="page-hero-inner">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-hero-copy">{description}</p>
      </div>
    </section>
  );
}
