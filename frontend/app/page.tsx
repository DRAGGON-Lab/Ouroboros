import React from "react";
import Image from "next/image";
import Link from "next/link";

const OUROBOROS_LOGO_URL =
  "https://raw.githubusercontent.com/DRAGGON-Lab/Ouroboros/main/docs/Ouroboros_logotype.png";

export default function Home() {
  return (
    <main className="homeCanvas">
      <section className="homeHero" aria-label="ouroboros-home-hero">
        <Image
          src={OUROBOROS_LOGO_URL}
          alt="Ouroboros logotype"
          width={440}
          height={220}
          sizes="(max-width: 900px) 80vw, 440px"
          priority
          className="homeLogo"
        />
        <Link href="/viewer" className="viewerLinkButton">
          Go to viewer
        </Link>
      </section>
    </main>
  );
}
