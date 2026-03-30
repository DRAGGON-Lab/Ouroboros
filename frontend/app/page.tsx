import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <div>
        <h1>Ouroboros</h1>
        <p>Open the genome viewer route.</p>
        <Link href="/viewer">Go to viewer</Link>
      </div>
    </main>
  );
}
