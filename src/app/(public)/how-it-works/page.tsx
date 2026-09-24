import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, HeartHandshake, Search } from "lucide-react";

import { PageHero } from "@/components/layout/public-shell";

export const metadata: Metadata = {
  title: "How it works",
  description: "From first search to a good plan, see how matefor works.",
  alternates: { canonical: "/how-it-works" },
  openGraph: { title: "How it works", description: "From first search to a good plan, see how matefor works.", url: "/how-it-works", type: "website" },
};

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Find your kind of person",
    copy: "Browse local mates by activity, interests, and the energy you’re looking for. Every profile gives you a feel for the person behind the plan.",
  },
  {
    number: "02",
    icon: CalendarDays,
    title: "Make a plan together",
    copy: "Choose a date and an available time, then send a booking request. Your Mate confirms the details before your plan is set.",
  },
  {
    number: "03",
    icon: HeartHandshake,
    title: "Meet, enjoy, review",
    copy: "Meet in a public place, spend time doing something you both enjoy, and share a review after your booking is complete.",
  },
];

export default function HowItWorksPage() {
  return (
    <main>
      <PageHero
        title="Good plans start with a simple hello."
        description="A thoughtful way to find company for the things you already love doing."
      />
      <section className="how-steps">
        <div className="how-steps-inner">
          {steps.map(({ number, icon: Icon, title, copy }) => (
            <article className="how-step" key={number}>
              <div className="how-step-mark">
                <span>{number}</span>
                <Icon aria-hidden="true" size={24} />
              </div>
              <div>
                <p className="eyebrow">STEP {number}</p>
                <h2>{title}</h2>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="how-note">
        <p className="eyebrow">YOUR PLAN, YOUR PACE</p>
        <h2>
          Thoughtful connections
          <br />
          <em>start with choice.</em>
        </h2>
        <p>
          Browse at your own pace, ask questions before you book, and choose a public place that
          feels right for you.
        </p>
        <Link className="button" href="/mates">
          Find a Mate <ArrowRight size={17} />
        </Link>
      </section>
    </main>
  );
}
