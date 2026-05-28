import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex items-center justify-center px-4 pt-20"
        style={{ backgroundColor: "#0d0d0d" }}
      >
        {/* Subtle background texture overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #0a1f44 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1a3a6b 0%, transparent 40%)",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-6"
            style={{ color: "#c9a84c" }}
          >
            Trusted Lettings Agency · Est. 2018
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Find Your Perfect
            <br />
            <span style={{ color: "#c9a84c" }}>Rental Home</span>
          </h1>

          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
            House of Lettings connects landlords and tenants across the UK with
            a personal, professional service you can trust.
          </p>

          {/* CTA Buttons — includes Terms & Conditions */}
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/properties"
              className="px-7 py-3 rounded-md font-semibold text-white text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#0a1f44" }}
            >
              Browse Properties
            </Link>
            <Link
              href="/landlords"
              className="px-7 py-3 rounded-md font-semibold text-sm border transition-colors hover:bg-white/10"
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}
            >
              List Your Property
            </Link>
            <Link
              href="/terms"
              className="px-7 py-3 rounded-md font-semibold text-sm border transition-colors hover:bg-white/10"
              style={{ color: "#c9a84c", borderColor: "rgba(201,168,76,0.5)" }}
            >
              Terms &amp; Conditions
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-white text-xs tracking-widest uppercase">
            Scroll
          </span>
          <div className="w-px h-10 bg-white/40" />
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "#c9a84c" }}
            >
              Why Choose Us
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{ color: "#0a1f44" }}
            >
              A Lettings Service Built on Trust
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🏡",
                title: "Handpicked Properties",
                desc: "Every listing is verified and presented with accurate details — no surprises.",
              },
              {
                icon: "🤝",
                title: "Dedicated Support",
                desc: "Our team is available to guide landlords and tenants through every step.",
              },
              {
                icon: "📋",
                title: "Transparent Process",
                desc: "Clear contracts, fair fees, and honest communication from day one.",
              },
              {
                icon: "⚡",
                title: "Fast Turnaround",
                desc: "Properties filled quickly with reliable, referenced tenants.",
              },
              {
                icon: "🔒",
                title: "Fully Compliant",
                desc: "All lettings meet current UK regulations and safety standards.",
              },
              {
                icon: "📍",
                title: "Local Expertise",
                desc: "Deep knowledge of the local market to get you the best outcome.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: "#0a1f44" }}
                >
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROPERTIES ── */}
      <section className="py-20 px-4" style={{ backgroundColor: "#f7f8fa" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "#c9a84c" }}
            >
              Available Now
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{ color: "#0a1f44" }}
            >
              Featured Properties
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                type: "2 Bed Apartment",
                location: "City Centre",
                price: "£950 pcm",
                tag: "Available Now",
              },
              {
                type: "3 Bed House",
                location: "Suburban Area",
                price: "£1,200 pcm",
                tag: "Just Listed",
              },
              {
                type: "1 Bed Studio",
                location: "Town Centre",
                price: "£650 pcm",
                tag: "Available Now",
              },
            ].map((prop) => (
              <div
                key={prop.type + prop.location}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className="h-48 flex items-center justify-center"
                  style={{ backgroundColor: "#e8ecf5" }}
                >
                  <span className="text-4xl">🏠</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                      style={{ backgroundColor: "#0a1f44" }}
                    >
                      {prop.tag}
                    </span>
                    <span
                      className="text-lg font-bold"
                      style={{ color: "#c9a84c" }}
                    >
                      {prop.price}
                    </span>
                  </div>
                  <h3
                    className="font-semibold text-base"
                    style={{ color: "#0a1f44" }}
                  >
                    {prop.type}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">{prop.location}</p>
                  <Link
                    href="/properties"
                    className="mt-4 block text-center py-2.5 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#0a1f44" }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/properties"
              className="inline-block px-8 py-3 rounded-md font-semibold text-sm border-2 transition-colors hover:text-white hover:bg-[#0a1f44]"
              style={{ color: "#0a1f44", borderColor: "#0a1f44" }}
            >
              View All Properties
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "#c9a84c" }}
            >
              What People Say
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{ color: "#0a1f44" }}
            >
              Trusted by Hundreds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                quote:
                  "The whole process was smooth and stress-free. I found my flat within a week!",
                name: "Sarah M.",
                role: "Tenant",
              },
              {
                quote:
                  "My property was rented out within days. Professional and reliable team.",
                name: "James K.",
                role: "Landlord",
              },
              {
                quote:
                  "Excellent communication throughout. Would recommend to anyone.",
                name: "Priya T.",
                role: "Tenant",
              },
              {
                quote:
                  "They handled everything — I had zero headaches as a landlord.",
                name: "David L.",
                role: "Landlord",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-xl border border-gray-100"
              >
                <p className="text-gray-600 text-sm leading-relaxed mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: "#0a1f44" }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p
                      className="font-semibold text-sm"
                      style={{ color: "#0a1f44" }}
                    >
                      {t.name}
                    </p>
                    <p className="text-gray-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section
        className="py-20 px-4 text-center"
        style={{ backgroundColor: "#0a1f44" }}
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-300 mb-8">
            Whether you&apos;re searching for a home or looking to let your
            property — we&apos;re here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/properties"
              className="px-7 py-3 rounded-md font-semibold text-sm text-white border-2 border-white transition-colors hover:bg-white hover:text-[#0a1f44]"
            >
              Find a Home
            </Link>
            <Link
              href="/contact"
              className="px-7 py-3 rounded-md font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#c9a84c", color: "#0a1f44" }}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="py-10 px-4 text-center text-sm"
        style={{ backgroundColor: "#0d0d0d", color: "#888" }}
      >
        <p className="mb-3">
          © {new Date().getFullYear()} House of Lettings. All rights reserved.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms &amp; Conditions
          </Link>
          <Link href="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
        </div>
      </footer>
    </main>
  );
}
