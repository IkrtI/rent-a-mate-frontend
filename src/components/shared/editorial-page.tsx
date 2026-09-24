import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PageHero } from "@/components/layout/public-shell";

export type EditorialSection = { heading: string; paragraphs: string[] };

export function EditorialPage({
  eyebrow,
  title,
  description,
  updated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  updated?: string;
  intro: string;
  sections: EditorialSection[];
}) {
  return (
    <main className="editorial-page">
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      <div className="editorial-layout">
        <aside className="editorial-aside">
          {updated && (
            <p>
              Last updated
              <br />
              <time dateTime="2026-09-18">{updated}</time>
            </p>
          )}
          <Link href="/safety">
            Our safety approach <ArrowUpRight size={14} />
          </Link>
        </aside>
        <article className="editorial-article">
          <p className="editorial-intro">{intro}</p>
          {sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
          <section className="editorial-contact">
            <h2>Contact</h2>
            <p>
              Questions? We’re happy to help.{" "}
              <Link href="mailto:hello@matefor.example">
                Get in touch <ArrowUpRight aria-hidden="true" size={14} />
              </Link>
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
