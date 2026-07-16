// app/guides/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { guidesByDate } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Renting Guides | House of Lettings",
  description:
    "Renting guides for tenants across Leeds & Manchester — holding deposits, viewings, referencing, Right to Rent, maintenance and moving in.",
};

const INK = "#182135";
const BLUE_SM = "#0A46EF";
const BODY = "#4b5568";
const HAIR = "#eceff4";

export default function GuidesPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: "#fff", color: INK, fontFamily: "'Poppins', 'Inter', sans-serif" }}>
        <style>{`
          .g-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
          .g-card { display: flex; flex-direction: column; background: #fff; border: 1px solid ${HAIR};
            border-radius: 18px; overflow: hidden; text-decoration: none; color: inherit;
            box-shadow: 0 10px 26px rgba(24,33,53,0.05);
            transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease; }
          .g-card:hover { transform: translateY(-8px); border-color: #bdd2fa; box-shadow: 0 18px 40px rgba(29,78,216,0.14); }
          .g-card img { width: 100%; height: 190px; object-fit: cover; display: block; transition: transform .5s ease; }
          .g-card:hover img { transform: scale(1.05); }
          @media (max-width: 900px) { .g-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 600px) { .g-grid { grid-template-columns: 1fr; } }
        `}</style>

        <section style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 24px 40px", textAlign: "center" }}>
          <p style={{ color: BLUE_SM, fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>
            For Tenants
          </p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, letterSpacing: "-0.02em", color: INK, margin: "0 0 16px" }}>
            Renting guides
          </h1>
          <p style={{ fontSize: 17, color: BODY, lineHeight: 1.7, maxWidth: 620, margin: "0 auto" }}>
            Benefit from our expertise and years of experience — practical guides covering the topics and
            tips that matter most to tenants across Leeds &amp; Manchester.
          </p>
        </section>

        <section style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 24px 88px" }}>
          <div className="g-grid">
            {guidesByDate.map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} className="g-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.image} alt={g.title} loading="lazy" />
                <div style={{ padding: "22px 22px 24px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  <h2 style={{ fontSize: 19, fontWeight: 800, color: INK, margin: 0, lineHeight: 1.3 }}>{g.title}</h2>
                  <p style={{ fontSize: 14, color: BODY, lineHeight: 1.6, margin: 0, flex: 1 }}>{g.excerpt}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#7a889c", marginTop: 4 }}>
                    <span>{g.dateLabel}</span>
                    <span>·</span>
                    <span>{g.readMins} min read</span>
                  </div>
                  <span style={{ color: BLUE_SM, fontWeight: 700, fontSize: 14, marginTop: 4 }}>Read guide →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
