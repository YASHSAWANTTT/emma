import Link from "next/link";
import { resolveDemoVideoEmbed } from "@/lib/demoVideoEmbed";

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14m0 0-6-6m6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DemoVideoBlock({ url }: { url: string | undefined }) {
  const resolved = url ? resolveDemoVideoEmbed(url) : null;

  if (resolved?.kind === "iframe") {
    return (
      <div className="landingVideoChrome">
        <div className="landingVideoShell">
          <iframe
            className="landingVideoFrame"
            src={resolved.src}
            title="Emma product demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (resolved?.kind === "video") {
    return (
      <div className="landingVideoChrome">
        <div className="landingVideoShell">
          <video className="landingVideoFrame" src={resolved.src} controls playsInline preload="metadata" />
        </div>
      </div>
    );
  }

  return (
    <div className="landingVideoChrome">
      <div className="landingVideoShell landingVideoPlaceholder landingPlaceholderShimmer">
        <div className="landingPlaceholderInner">
          <span className="landingPlayIcon" aria-hidden>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1" opacity="0.25" />
              <circle cx="32" cy="32" r="30" stroke="url(#landingPlayGrad)" strokeWidth="1.5" opacity="0.9" />
              <defs>
                <linearGradient id="landingPlayGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#c6a15b" />
                  <stop offset="1" stopColor="#e8d5a3" />
                </linearGradient>
              </defs>
              <path
                d="M26 22L42 32L26 42V22Z"
                fill="currentColor"
                className="landingPlayTriangle"
              />
            </svg>
          </span>
          <p className="landingPlaceholderTitle">Demo reel</p>
          <p className="landingPlaceholderHint">
            Drop a URL into <code className="landingCode">NEXT_PUBLIC_DEMO_VIDEO_URL</code> when your cut is ready.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const demoUrl = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL?.trim() || undefined;

  return (
    <main className="pageShell landingShell">
      <div className="textureLayer" aria-hidden />
      <div className="landingGrain" aria-hidden />
      <div className="landingContent">
        <section className="landingHero translatorCard" aria-labelledby="landing-headline">
          <div className="landingHeroTop landingFadeIn landingFadeIn--1">
            <span className="landingProductMark">Emma</span>
            <span className="landingHeroRule" aria-hidden />
            <span className="landingContextTag">Zoom Apps</span>
          </div>

          <div className="landingHeroGrid">
            <div className="landingHeroMain">
              <h1 id="landing-headline" className="landingTitle landingFadeIn landingFadeIn--2">
                Translate in the moment.
                <span className="landingTitleBreak" aria-hidden />
                <span className="landingTitleLine2">
                  Then <em className="landingAccentWord">practice</em> what stuck.
                </span>
              </h1>
              <p className="landingLead landingFadeIn landingFadeIn--3">
                One glass-dark workspace for live OpenAI translation and a guided lesson path — listening, matching,
                speaking — without leaving your meeting rhythm.
              </p>
            </div>
            <aside className="landingHeroRail landingFadeIn landingFadeIn--4" aria-label="Product pillars">
              <span className="landingRailLine" aria-hidden />
              <ul className="landingRailList">
                <li>Live</li>
                <li>Learn</li>
                <li>Listen</li>
              </ul>
            </aside>
          </div>

          <ul className="landingFeatures" aria-label="Capabilities">
            <li className="landingFeature landingFadeIn landingFadeIn--5">
              <span className="landingFeatureIndex">01</span>
              <div className="landingFeatureBody">
                <p className="landingFeatureTitle">Side-panel native</p>
                <p className="landingFeatureCopy">Designed to sit beside Zoom, not fight it.</p>
              </div>
            </li>
            <li className="landingFeature landingFadeIn landingFadeIn--6">
              <span className="landingFeatureIndex">02</span>
              <div className="landingFeatureBody">
                <p className="landingFeatureTitle">Many languages</p>
                <p className="landingFeatureCopy">Pick source and target; skip the guesswork.</p>
              </div>
            </li>
            <li className="landingFeature landingFadeIn landingFadeIn--7">
              <span className="landingFeatureIndex">03</span>
              <div className="landingFeatureBody">
                <p className="landingFeatureTitle">Roadmap + voice</p>
                <p className="landingFeatureCopy">Linear lessons with device-audio TTS for every line.</p>
              </div>
            </li>
          </ul>

          <div className="landingCtas landingFadeIn landingFadeIn--8">
            <Link href="/translate" className="landingCta landingCtaPrimary">
              <span>Open translator</span>
              <ArrowIcon className="landingCtaIcon" />
            </Link>
            <Link href="/practice" className="landingCta landingCtaGhost">
              <span>Start practice path</span>
            </Link>
          </div>
        </section>

        <section
          className="landingVideoSection translatorCard landingFadeIn landingFadeIn--9"
          aria-labelledby="demo-heading"
        >
          <div className="landingVideoSectionHead">
            <p className="landingVideoOverline">Watch</p>
            <h2 id="demo-heading" className="landingVideoHeading">
              The flow, end to end
            </h2>
            <p className="landingVideoSub">
              From first paste in translate to unlocking the next lesson — your recording belongs here when it&apos;s
              ready.
            </p>
          </div>
          <DemoVideoBlock url={demoUrl} />
        </section>
      </div>
    </main>
  );
}
