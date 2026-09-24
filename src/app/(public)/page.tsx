import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { getPublicMates } from "@/modules/mate-discovery/public-data";

export const metadata: Metadata = {
  title: "Find your kind of company",
  description: "Meet local mates for coffee, gaming, study, the gym, and city plans.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Find your kind of company",
    description: "Meet local mates for coffee, gaming, study, the gym, and city plans.",
    url: "/",
    type: "website",
  },
};
export const dynamic = "force-dynamic";

const activities = [
  { name: "Cafe", image: "/images/figma/coffee.png", query: "Cafe" },
  { name: "Gaming", image: "/images/figma/gaming.png", query: "Gaming" },
  { name: "Study", image: "/images/figma/study.png", query: "Study" },
  { name: "Gym", image: "/images/figma/gym.png", query: "Gym" },
  { name: "Events", image: "/images/figma/event.png", query: "Events" },
];

export default async function HomePage() {
  const featured = await getPublicMates({ sort: "-rating", page: "1" });
  return (
    <main>
      <section className="home-hero">
        <div className="hero-copy">
          <h1>
            Find the right
            <br />
            mate{" "}
            <em>
              for the
              <br />
              right moment.
            </em>
          </h1>
          <p className="hero-description">
            Study together, explore the city, hit the gym, play games or simply hang out. Real
            people for plans that matter.
          </p>
          <form action="/mates" className="hero-search" role="search">
            <label className="sr-only" htmlFor="home-search">
              Find your kind of company
            </label>
            <input
              autoComplete="off"
              id="home-search"
              name="q"
              placeholder="Find your kind of company"
            />
            <button aria-label="Search mates" className="button search-button" type="submit">
              <span>Find a mate</span>
              <ArrowRight aria-hidden="true" size={18} />
            </button>
          </form>
        </div>
        <div className="hero-art">
          <div className="hero-photo-main">
            <Image
              alt="A mate smiling, ready to make a plan"
              fill
              priority
              sizes="(max-width: 760px) 60vw, 260px"
              src="/images/figma/nan.png"
            />
          </div>
          <div className="hero-photo-small">
            <Image
              alt="A friend enjoying a day out"
              fill
              sizes="(max-width: 760px) 45vw, 195px"
              src="/images/figma/mew.png"
            />
          </div>
          <div aria-hidden="true" className="hero-sticker">
            “Made a new
            <br />
            friend today!”
          </div>
          <span aria-hidden="true" className="hero-sparkle">
            ♥
          </span>
        </div>
        <div className="hero-bottom">
          <span>Bangkok, Thailand</span>
        </div>
      </section>

      <section className="section activity-section">
        <div className="section-heading">
          <div>
            <h2>
              Plans for every <em>mood.</em>
            </h2>
          </div>
          <Link className="text-link" href="/mates">
            See all activities <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="activity-grid">
          {activities.map(({ name, image, query }) => (
            <Link
              className="activity-card"
              href={`/mates?activity=${encodeURIComponent(query)}`}
              key={name}
            >
              <div className="activity-image">
                <Image alt="" fill sizes="(max-width: 760px) 42vw, 190px" src={image} />
              </div>
              <div className="activity-card-bottom">
                <span>{name}</span>
                <span aria-hidden="true" className="activity-arrow">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="featured-section">
        <div className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">GOOD PEOPLE, GREAT REVIEWS</p>
              <h2>
                Meet a few <em>mates.</em>
              </h2>
            </div>
            <Link className="text-link" href="/mates">
              See all mates <ArrowUpRight size={17} />
            </Link>
          </div>
          {!featured.error && featured.items.length > 0 && (
            <div className="mate-grid">
              {featured.items.slice(0, 3).map((mate) => (
                <article className="mate-card" key={mate.id}>
                  <Link
                    aria-label={`View ${mate.name}'s profile`}
                    className="mate-photo"
                    href={`/mates/${mate.id}`}
                  >
                    {mate.photoUrl ? (
                      <Image
                        alt={`${mate.name}, a Rent a Mate companion`}
                        fill
                        sizes="(max-width: 760px) 90vw, 360px"
                        src={mate.photoUrl}
                        unoptimized
                      />
                    ) : (
                      <span aria-hidden="true" className="avatar-placeholder">
                        {mate.name.slice(0, 1)}
                      </span>
                    )}
                  </Link>
                  <div className="mate-card-details">
                    <div className="mate-name-row">
                      <div>
                        <h3>{mate.name}</h3>
                        <p>
                          {mate.district}, {mate.province}
                        </p>
                      </div>
                      <span className="mate-rating">
                        ★ {mate.avgRating?.toFixed(1) ?? "New"} <small>({mate.reviewCount})</small>
                      </span>
                    </div>
                    <p className="mate-interests">{mate.activities.slice(0, 3).join(" · ")}</p>
                    <p className="mate-rate">
                      <strong>฿{mate.hourlyRate.toLocaleString("en-US")}</strong> / hour
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
          {featured.error && (
            <div className="state-inline">
              <p>We couldn’t load featured mates just now.</p>
              <Link href="/mates">
                Explore all mates <ArrowRight size={15} />
              </Link>
            </div>
          )}
          {!featured.error && featured.items.length === 0 && (
            <p className="state-inline">
              New mates are joining soon. Check back or explore the activity list above.
            </p>
          )}
        </div>
      </section>

      <section className="section steps-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">HOW IT WORKS</p>
            <h2>
              Good company is
              <br />
              <em>three taps away.</em>
            </h2>
          </div>
          <Link className="text-link" href="/how-it-works">
            See how it works <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="steps-grid">
          <article>
            <span>01</span>
            <h3>Find your person</h3>
            <p>Tell us the plan, place and time.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Send a booking</h3>
            <p>Pick a Mate who matches your vibe.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Meet &amp; enjoy</h3>
            <p>Chat, confirm and make it a good day.</p>
          </article>
        </div>
      </section>
      <section className="home-cta">
        <p className="eyebrow">YOUR NEXT PLAN IS OUT THERE</p>
        <h2>
          Good company
          <br />
          <em>looks good on you.</em>
        </h2>
        <Link className="button" href="/mates">
          Find your Mate <ArrowRight size={17} />
        </Link>
      </section>
    </main>
  );
}
