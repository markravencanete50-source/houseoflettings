'use client';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function TermsAndConditions() {
  const sections = [
    {
      number: '01',
      title: 'About Us',
      content: (
        <>
          <p className="hol-body">
            House of Lettings is a UK-based residential lettings and property management company
            headquartered at Peter House, Oxford Street, Manchester. This website is operated by
            House of Lettings to provide information about our services, property listings, and
            contact options for landlords and tenants.
          </p>
          <div className="hol-contact-grid">
            <div className="hol-contact-item">
              <span className="hol-contact-label">Email</span>
              <span className="hol-contact-value">info@houseoflettings.co.uk</span>
            </div>
            <div className="hol-contact-item">
              <span className="hol-contact-label">Phone</span>
              <span className="hol-contact-value">0161 768 1758</span>
            </div>
            <div className="hol-contact-item">
              <span className="hol-contact-label">Website</span>
              <span className="hol-contact-value">www.houseoflettings.co.uk</span>
            </div>
          </div>
        </>
      ),
    },
    {
      number: '02',
      title: 'Acceptable Use',
      content: (
        <>
          <p className="hol-body">By using this website, you agree to use it only for lawful purposes. You must not:</p>
          <ul className="hol-list">
            <li>Use the website in any way that is fraudulent, unlawful, or harmful to others</li>
            <li>Submit false, inaccurate, or misleading information through any form or contact channel</li>
            <li>Attempt to gain unauthorised access to any part of the website, its servers, or databases</li>
            <li>Transmit spam, malware, viruses, or any other harmful or disruptive code</li>
            <li>Reproduce, copy, or redistribute any content from the website without our prior written consent</li>
            <li>Use automated tools, scrapers, or bots to extract content from the website</li>
            <li>Engage in any conduct that may damage the reputation or operations of House of Lettings</li>
          </ul>
          <p className="hol-body">
            We reserve the right to restrict or terminate your access to the website at any time if we believe
            you have violated these Terms.
          </p>
        </>
      ),
    },
    {
      number: '03',
      title: 'Website Content & Accuracy',
      content: (
        <>
          <p className="hol-body">
            We take care to ensure the information on this website is accurate and up to date. However, we do
            not guarantee that all content is complete, current, or free from errors. In particular:
          </p>
          <ul className="hol-list">
            <li>Property listings are provided for guidance purposes only and do not constitute a contractual offer</li>
            <li>Property availability, pricing, and details are subject to change without notice</li>
            <li>Photographs, floor plans, and descriptions are indicative and may not reflect the current condition of a property</li>
            <li>We are not responsible for inaccuracies in information provided by third parties, including landlords or external portals</li>
          </ul>
          <p className="hol-body">
            Nothing on this website constitutes legal, financial, or professional advice. You should seek
            independent advice before making any property-related decisions.
          </p>
        </>
      ),
    },
    {
      number: '04',
      title: 'Enquiry Forms & Communications',
      content: (
        <>
          <p className="hol-body">When you submit an enquiry, valuation request, or contact form on this website, you agree to:</p>
          <ul className="hol-list">
            <li>Provide accurate and truthful information</li>
            <li>Allow House of Lettings to respond to your enquiry by email, phone, or other contact methods you have provided</li>
            <li>Receive follow-up communications relevant to your enquiry</li>
          </ul>
          <p className="hol-body">
            We will not use your contact details for unsolicited marketing without your consent. For full
            details on how we handle your personal data, please refer to our{' '}
            <Link href="/privacy-policy" className="hol-link">Privacy Policy</Link>.
          </p>
        </>
      ),
    },
    {
      number: '05',
      title: 'Intellectual Property',
      content: (
        <>
          <p className="hol-body">
            All content on this website, including text, graphics, logos, images, and software, is the
            property of House of Lettings or its content suppliers and is protected by UK and international
            copyright laws.
          </p>
          <p className="hol-body">You <strong>may</strong>:</p>
          <ul className="hol-list">
            <li>View and print content for your own personal, non-commercial use</li>
          </ul>
          <p className="hol-body">You <strong>may not</strong>, without our prior written consent:</p>
          <ul className="hol-list">
            <li>Reproduce, republish, upload, post, or distribute any website content</li>
            <li>Use our name, logo, or branding in any way that implies affiliation or endorsement</li>
            <li>Frame or mirror any part of this website on another website</li>
          </ul>
        </>
      ),
    },
    {
      number: '06',
      title: 'Third-Party Links',
      content: (
        <p className="hol-body">
          Our website may contain links to third-party websites such as property portals (e.g. Rightmove,
          Zoopla) and regulatory bodies. These links are provided for your convenience only. House of
          Lettings does not endorse, control, or take responsibility for the content or privacy practices
          of any third-party websites. Your use of any linked website is at your own risk.
        </p>
      ),
    },
    {
      number: '07',
      title: 'Limitation of Liability',
      content: (
        <>
          <p className="hol-body">
            To the fullest extent permitted by law, House of Lettings shall not be liable for any direct,
            indirect, incidental, or consequential loss arising from your use of, or inability to use, this website.
          </p>
          <p className="hol-body">In particular, we are not liable for:</p>
          <ul className="hol-list">
            <li>Any inaccuracies or omissions in website content</li>
            <li>Interruptions, errors, or downtime affecting the website</li>
            <li>Loss of data, unauthorised access, or security breaches resulting from your use of the website</li>
            <li>Any reliance placed on information published on this website</li>
          </ul>
          <p className="hol-body">
            Nothing in these Terms excludes our liability for death or personal injury caused by negligence,
            fraud, or any other liability that cannot be excluded by applicable law.
          </p>
        </>
      ),
    },
    {
      number: '08',
      title: 'Privacy & Cookies',
      content: (
        <p className="hol-body">
          Your use of this website is also governed by our{' '}
          <Link href="/privacy-policy" className="hol-link">Privacy Policy</Link> and{' '}
          <Link href="/cookie-policy" className="hol-link">Cookie Policy</Link>, which are incorporated
          into these Terms by reference. By using this website, you consent to the use of cookies as
          described in our Cookie Policy.
        </p>
      ),
    },
    {
      number: '09',
      title: 'Changes to These Terms',
      content: (
        <p className="hol-body">
          We may update these Terms from time to time. Any changes will be posted on this page with an
          updated effective date. Your continued use of the website after changes are posted constitutes
          your acceptance of the updated Terms. We encourage you to review this page periodically.
        </p>
      ),
    },
    {
      number: '10',
      title: 'Governing Law',
      content: (
        <p className="hol-body">
          These Terms are governed by the laws of England and Wales. Any disputes arising from your use
          of this website shall be subject to the exclusive jurisdiction of the courts of England and Wales.
        </p>
      ),
    },
    {
      number: '11',
      title: 'Contact Us',
      content: (
        <>
          <p className="hol-body">If you have any questions about these Terms, please contact us:</p>
          <div className="hol-offices-grid">
            <div className="hol-card">
              <p className="hol-card-label">Manchester Office</p>
              <p className="hol-card-name">House of Lettings</p>
              <p>Peter House, Oxford Street, Manchester</p>
              <p>Email: <a href="mailto:info@houseoflettings.co.uk" className="hol-link">info@houseoflettings.co.uk</a></p>
              <p>Phone: <a href="tel:01617681758" className="hol-link">0161 768 1758</a></p>
              <p>Office Hours: Monday-Friday, 9:00am-5:30pm</p>
            </div>
            <div className="hol-card">
              <p className="hol-card-label">Leeds Office</p>
              <p className="hol-card-name">House of Lettings Leeds</p>
              <p>199 Roundhay Rd, Harehills, Leeds LS8 5PL, United Kingdom</p>
              <p>Email: <a href="mailto:info@houseoflettings.co.uk" className="hol-link">info@houseoflettings.co.uk</a></p>
              <p>Phone: <a href="tel:+441138689212" className="hol-link">+44 113 868 9212</a></p>
              <p>Office Hours: Open · Closes 7 PM</p>
            </div>
          </div>
        </>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Poppins', sans-serif; }
        /* ── Tokens ── */
        :root {
          --navy: #0f1f3d;
          --navy-mid: #162849;
          --navy-light: #1e3a6e;
          --gold: #c9a96e;
          --gold-light: #e0c896;
          --white: #ffffff;
          --off-white: #f7f8fa;
          --text: #374151;
          --text-light: #6b7280;
          --border: #e5e7eb;
        }

        /* ── Hero ── */
        .hol-hero {
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 60%, var(--navy-light) 100%);
          padding: 80px 24px 72px;
          position: relative;
          overflow: hidden;
        }
        .hol-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 70% 50%, rgba(201,169,110,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .hol-hero-inner {
          max-width: 760px;
          margin: 0 auto;
          position: relative;
        }
        .hol-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #ffffff;
          margin-bottom: 20px;
        }
        .hol-hero-eyebrow::before {
          content: '';
          display: block;
          width: 28px;
          height: 2px;
          background: #ffffff;
          border-radius: 2px;
        }
        .hol-hero-title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          color: var(--white);
          margin: 0 0 16px;
          line-height: 1.15;
          letter-spacing: -0.02em;
          font-family: 'Poppins', sans-serif;
        }
        .hol-hero-meta {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .hol-hero-meta span {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .hol-hero-meta span::before {
          content: '·';
          color: var(--gold);
        }
        .hol-hero-meta span:first-child::before { display: none; }

        /* ── Notice Banner ── */
        .hol-notice {
          background: #fffbeb;
          border-left: 4px solid var(--gold);
          padding: 16px 24px;
        }
        .hol-notice-inner {
          max-width: 760px;
          margin: 0 auto;
          font-size: 13px;
          color: #78350f;
          line-height: 1.7;
        }
        .hol-notice-inner a {
          color: #92400e;
          font-weight: 600;
          text-decoration: underline;
        }

        /* ── Layout ── */
        .hol-page {
          max-width: 760px;
          margin: 0 auto;
          padding: 64px 24px 80px;
        }

        /* ── TOC ── */
        .hol-toc {
          background: var(--off-white);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 28px 32px;
          margin-bottom: 56px;
        }
        .hol-toc-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-light);
          margin: 0 0 16px;
        }
        .hol-toc-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 24px;
        }
        .hol-toc-list a {
          font-size: 13px;
          color: var(--navy);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          transition: color 0.15s;
        }
        .hol-toc-list a:hover { color: var(--gold); }
        .hol-toc-num {
          font-size: 10px;
          color: var(--text-light);
          font-weight: 600;
          min-width: 20px;
        }
        @media (max-width: 520px) {
          .hol-toc-list { grid-template-columns: 1fr; }
        }

        /* ── Sections ── */
        .hol-section {
          padding: 40px 0;
          border-bottom: 1px solid var(--border);
        }
        .hol-section:last-of-type { border-bottom: none; }
        .hol-section-header {
          display: flex;
          align-items: baseline;
          gap: 16px;
          margin-bottom: 20px;
        }
        .hol-section-num {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #1a56db;
          min-width: 28px;
        }
        .hol-section-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--navy);
          margin: 0;
          line-height: 1.3;
        }

        /* ── Typography ── */
        .hol-body {
          font-size: 14.5px;
          color: var(--text);
          line-height: 1.8;
          margin: 0 0 14px;
        }
        .hol-body:last-child { margin-bottom: 0; }
        .hol-list {
          list-style: none;
          padding: 0;
          margin: 12px 0 16px;
          space-y: 8px;
        }
        .hol-list li {
          font-size: 14px;
          color: var(--text);
          line-height: 1.7;
          padding: 6px 0 6px 20px;
          position: relative;
          border-bottom: 1px solid #f3f4f6;
        }
        .hol-list li:last-child { border-bottom: none; }
        .hol-list li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 14px;
          width: 6px;
          height: 6px;
          background: #1a56db;
          border-radius: 50%;
        }
        .hol-link {
          color: var(--navy);
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.15s;
        }
        .hol-link:hover { color: var(--gold); }

        /* ── Contact Card ── */
        .hol-contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }
        .hol-contact-item {
          background: var(--off-white);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .hol-contact-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-light);
        }
        .hol-contact-value {
          font-size: 13px;
          color: var(--navy);
          font-weight: 500;
        }
        .hol-card {
          background: var(--navy);
          color: #ffffff;
          border-radius: 12px;
          padding: 24px 28px;
          font-size: 14px;
          line-height: 2;
          margin-top: 16px;
        }
        .hol-card p { color: #ffffff; margin: 0; }
        .hol-card-name {
          font-weight: 700;
          color: #ffffff;
          font-size: 15px;
          margin-bottom: 4px;
        }
        .hol-card a { color: #ffffff; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
        .hol-card a:hover { color: var(--gold-light); }
        .hol-offices-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 16px;
        }
        @media (max-width: 560px) {
          .hol-offices-grid { grid-template-columns: 1fr; }
        }
        .hol-card-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 8px;
        }

        /* ── Footer note ── */
        .hol-foot {
          margin-top: 48px;
          padding-top: 32px;
          border-top: 1px solid var(--border);
          text-align: center;
          font-size: 12px;
          color: var(--text-light);
          line-height: 1.8;
        }
      `}</style>

      <main className="min-h-screen" style={{ background: "#ffffff" }}>

        {/* Hero */}
        <div className="hol-hero">
          <div className="hol-hero-inner">
            <p className="hol-hero-eyebrow">Legal</p>
            <h1 className="hol-hero-title">Terms &amp; Conditions</h1>
            <div className="hol-hero-meta">
              <span>Effective Date: May 2026</span>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="hol-notice">
          <div className="hol-notice-inner">
            <strong>Important:</strong> Please read these Terms carefully before using our website. By
            accessing{' '}
            <a href="https://www.houseoflettings.uk">www.houseoflettings.uk</a>, you
            confirm that you have read, understood, and agree to be bound by these Terms. If you do not
            agree, please stop using the website immediately.
          </div>
        </div>

        <div className="hol-page">

          {/* Table of Contents */}
          <div className="hol-toc">
            <p className="hol-toc-title">Table of Contents</p>
            <ul className="hol-toc-list">
              {sections.map((s) => (
                <li key={s.number}>
                  <a href={`#section-${s.number}`}>
                    <span className="hol-toc-num">{s.number}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Sections */}
          {sections.map((s) => (
            <section key={s.number} id={`section-${s.number}`} className="hol-section">
              <div className="hol-section-header">
                <span className="hol-section-num">{s.number}</span>
                <h2 className="hol-section-title">{s.title}</h2>
              </div>
              {s.content}
            </section>
          ))}

          {/* Footer note */}
          <div className="hol-foot">
            <p>Last reviewed: May 2026 · Version 1.1</p>
            <p>© 2026 House of Lettings Ltd. All rights reserved.</p>
          </div>

        </div>
      </main>
    </>
  );
}
