import Link from "next/link";
import { ArrowUpRight, CalendarCheck, Coffee, Sparkles, UsersRound } from "lucide-react";

import styles from "./home-journey.module.css";

const steps = [
  {
    number: "01",
    label: "FIND YOUR PEOPLE",
    title: "Your kind of company.",
    description:
      "Coffee dates, study sessions or a little adventure. Find a Mate who shares your interests.",
    href: "/mates",
    action: "Explore mates",
    Icon: UsersRound,
    tone: styles.coral,
  },
  {
    number: "02",
    label: "MAKE A PLAN",
    title: "A good day starts here.",
    description:
      "Choose your Mate, pick a time and send a booking request. A new plan is on its way.",
    href: "/how-it-works",
    action: "See how booking works",
    Icon: CalendarCheck,
    tone: styles.plum,
  },
  {
    number: "03",
    label: "MEET & ENJOY",
    title: "Less scrolling. More living.",
    description:
      "Chat to confirm the details, meet in a public place and enjoy a little good company.",
    href: "/safety",
    action: "Meet with confidence",
    Icon: Coffee,
    tone: styles.cream,
  },
];

export function HomeJourney() {
  return (
    <section className={`steps-section ${styles.journey}`} aria-labelledby="journey-heading">
      <div className={styles.inner}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>GOOD COMPANY, MADE SIMPLE</p>
            <h2 id="journey-heading">
              New plans.
              <br />
              <em>Better together.</em>
            </h2>
          </div>
          <p className={styles.intro}>
            A little company can change your whole day.
            <br />
            Here’s how to find yours.
          </p>
        </div>
        <div className={styles.cards}>
          {steps.map(({ number, label, title, description, href, action, Icon, tone }) => (
            <article className={`${styles.card} ${tone}`} key={number}>
              <div className={styles.cardLabel}>
                <span>{label}</span>
                <span>{number}</span>
              </div>
              <h3>{title}</h3>
              <div className={styles.art} aria-hidden="true">
                <div className={styles.orbit} />
                <div className={styles.sculpture}>
                  <Icon strokeWidth={1.4} />
                </div>
                <Sparkles className={styles.sparkle} strokeWidth={1.5} />
              </div>
              <p>{description}</p>
              <Link href={href} className={styles.cardLink}>
                {action}
                <ArrowUpRight size={20} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
        <div className={styles.invitation}>
          <div>
            <p className={styles.eyebrow}>YOUR NEXT PLAN IS OUT THERE</p>
            <h2>
              Make room for <em>good company.</em>
            </h2>
          </div>
          <Link href="/mates" className={styles.cta}>
            Find your Mate
            <ArrowUpRight size={20} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
