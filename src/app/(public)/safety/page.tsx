import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, MessageCircle, ShieldCheck } from "lucide-react";

import { PageHero } from "@/components/layout/public-shell";

export const metadata: Metadata = {
  title: "Safety",
  description: "Practical guidance for comfortable, respectful meetups with matefor.",
  alternates: { canonical: "/safety" },
  openGraph: { title: "Safety", description: "Practical guidance for comfortable, respectful meetups with matefor.", url: "/safety", type: "website" },
};

const habits = [
  {
    icon: ShieldCheck,
    title: "Get to know each other first",
    copy: "Take time to read profiles and reviews. Keep early conversations on the platform and make sure the plan feels comfortable to everyone.",
  },
  {
    icon: MapPin,
    title: "Meet somewhere public",
    copy: "Choose a familiar cafe, park, or other public place. Let someone you trust know where you’re going and when you expect to be back.",
  },
  {
    icon: MessageCircle,
    title: "Keep clear boundaries",
    copy: "A booking is for social company around an agreed activity. Be respectful, communicate changes, and leave if a situation doesn’t feel right.",
  },
];

export default function SafetyPage() {
  return (
    <main>
      <PageHero
        eyebrow="CARE COMES FIRST"
        title="Good company should feel good."
        description="A few practical ways to help every plan feel comfortable, respectful, and safe."
      />
      <section className="safety-content">
        <div className="safety-lead">
          <p className="eyebrow">BEFORE YOU MEET</p>
          <h2>
            A little care goes
            <br />
            <em>a long way.</em>
          </h2>
          <p>
            Rent a Mate is designed around thoughtful social plans. These simple habits help renters
            and mates look out for themselves and one another.
          </p>
        </div>
        <div className="safety-list">
          {habits.map(({ icon: Icon, title, copy }) => (
            <article className="safety-item" key={title}>
              <span>
                <Icon aria-hidden="true" size={22} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="safety-help">
        <h2>Need a hand?</h2>
        <p>
          If something feels wrong or a plan changes, end the meetup and contact local emergency
          services if you’re in immediate danger. For product support,{" "}
          <Link href="mailto:hello@matefor.example">get in touch</Link>.
        </p>
        <Link className="button button-outline" href="/mates">
          Browse mates <ArrowRight size={17} />
        </Link>
      </section>
    </main>
  );
}
