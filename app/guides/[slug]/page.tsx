// app/guides/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { guides, getGuide, guidesByDate } from "@/lib/guides";

const INK = "#182135";
const BLUE_SM = "#0A46EF";
const BLUE_LG = "#253996";
const BODY = "#4b5568";
const HAIR = "#eceff4";
const ALT_BG = "#f4f7fc";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const guide = getGuide(params.slug);
  if (!guide) return { title: "Guide not found | House of Lettings" };
  return {
    title: `${guide.title} | Renting Guides | House of Lettings`,
    description: guide.excerpt,
  };
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const guide = getGuide(params.slug);
  if (!guide) notFound();

  const more = guidesByDate.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <>
      <Navbar />
      <main style={{ background: "#fff", color: INK, fontFamily: "'Poppins', 'Inter', sans-serif" }}>
        {/* Header */}
        <section style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 24px" }}>
          <Link href="/guides" style={{ color: BLUE_SM, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            ← All renting guides
          </Link>
          <h1 style={{ fontSize: "clamp(28px, 4.5vw, 42px)", fontWeight: 800, letterSpacing: "-0.02em", color: INK, margin: "18px 0 14px", lineHeight: 1.15 }}>
            {guide.title}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#7a889c" }}>
            <span>{guide.dateLabel}</span>
            <span>·</span>
            <span>{guide.readMins} min read</span>
          </div>
        </section>

        {/* Hero image */}
        <section style={{ maxWidth: 900, margin: "0 auto", padding: "8px 24px 0" }}>
          <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 56px rgba(24,33,53,0.18)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={guide.image} alt={guide.title} style={{ display: "block", width: "100%", height: "auto", objectFit: "cover", maxHeight: 420 }} />
          </div>
        </section>

        {/* Body */}
        <article style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 8px" }}>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: INK, fontWeight: 600, margin: "0 0 28px" }}>{guide.excerpt}</p>
          {guide.sections.map((s) => (
            <div key={s.h} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 21, fontWeight: 800, color: INK, margin: "0 0 10px" }}>{s.h}</h2>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: BODY, margin: 0 }}>{s.p}</p>
            </div>
          ))}
        </article>

        {/* CTA */}
        <section style={{ maxWidth: 760, margin: "0 auto", padding: "16px 24px 56px" }}>
          <div style={{ background: ALT_BG, border: `1px solid ${HAIR}`, borderRadius: 18, padding: "28px 28px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Ready to find your next home?</div>
              <div style={{ fontSize: 14, color: BODY, marginTop: 4 }}>Browse available homes across Leeds &amp; Manchester.</div>
            </div>
            <Link href="/listings" style={{ background: BLUE_SM, color: "#fff", fontWeight: 700, fontSize: 15, padding: "13px 26px", borderRadius: 999, textDecoration: "none", whiteSpace: "nowrap" }}>
              Browse Properties
            </Link>
          </div>
        </section>

        {/* More guides */}
        <section style={{ background: ALT_BG, borderTop: `1px solid ${HAIR}` }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 24px" }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: INK, margin: "0 0 24px" }}>More renting guides</h2>
            <style>{`
              .gm-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
              @media (max-width: 900px) { .gm-grid { grid-template-columns: repeat(2, 1fr); } }
              @media (max-width: 600px) { .gm-grid { grid-template-columns: 1fr; } }
            `}</style>
            <div className="gm-grid">
              {more.map((g) => (
                <Link key={g.slug} href={`/guides/${g.slug}`} style={{ display: "flex", flexDirection: "column", background: "#fff", border: `1px solid ${HAIR}`, borderRadius: 16, overflow: "hidden", textDecoration: "none", color: "inherit" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.image} alt={g.title} loading="lazy" style={{ width: "100%", height: 150, objectFit: "cover" }} />
                  <div style={{ padding: "16px 18px 20px" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: INK, lineHeight: 1.35, marginBottom: 6 }}>{g.title}</div>
                    <div style={{ fontSize: 12.5, color: "#7a889c" }}>{g.dateLabel} · {g.readMins} min read</div>
                    <span style={{ color: BLUE_LG, fontWeight: 700, fontSize: 13.5, display: "inline-block", marginTop: 10 }}>Read guide →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
