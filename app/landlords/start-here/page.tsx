// app/landlords/start-here/page.tsx
// The landlord "Start Here" guide: everything a landlord needs before letting
// with us, on one page, who we are, the process end to end, how long it takes,
// what it costs, what we need from them, and the legal duties they carry.
// Reached from the "Start Here" CTA on /landlords and linked in the sitemap.
//
// A Server Component (so it can export metadata and JSON-LD and be statically
// rendered for SEO), which means styling lives in page.module.css, an inline
// <style> in a Server Component gets hoisted away by React in a production
// build. The FAQ uses native <details>/<summary> so the page needs no client JS.
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { BUNDLES } from '@/lib/bundles';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Start Here | The Landlord’s Guide | House of Lettings',
  description:
    'New to letting, or new to House of Lettings? The complete landlord guide: how to get started, our step-by-step process, what it costs, what documents you need and how long it takes. Leeds and Manchester.',
  alternates: { canonical: '/landlords/start-here' },
  openGraph: {
    title: 'Start Here | The Landlord’s Guide | House of Lettings',
    description:
      'How to start letting your property with House of Lettings: the process, the pricing, the paperwork and the timescales, explained in plain English.',
    url: 'https://www.houseoflettings.uk/landlords/start-here',
    siteName: 'House of Lettings',
    images: [
      { url: '/images/heropage-og.jpg', width: 1200, height: 630, alt: 'House of Lettings landlord guide' },
    ],
    locale: 'en_GB',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Start Here | The Landlord’s Guide | House of Lettings',
    description: 'The landlord process, pricing, paperwork and timescales, explained in plain English.',
    images: ['/images/heropage-og.jpg'],
  },
};

// Fee figures come from lib/bundles.ts, never typed here, so this page can
// never quote a fee that /pricing disagrees with.
const LOWEST_MGMT_FEE = BUNDLES
  .filter((b) => b.mgmtFee)
  .map((b) => b.mgmtFee)
  .sort((a, b) => parseFloat(a) - parseFloat(b))[0];

const LOWEST_FIND_FEE = BUNDLES
  .filter((b) => b.kind === 'Tenant Find')
  .map((b) => b.setupFee)
  .sort((a, b) => Number(a.replace(/[^0-9.]/g, '')) - Number(b.replace(/[^0-9.]/g, '')))[0];

const STEPS: { title: string; when: string; text: string; points: string[] }[] = [
  {
    title: 'Get in touch',
    when: 'Day 1 · 5 minutes',
    text: 'Tell us about your property. Register online, call your local branch or book a valuation directly. There is no fee and no commitment at this stage, you are simply starting a conversation with a local agent.',
    points: [
      'Register online in about five minutes',
      'Or speak to the Leeds or Manchester team directly',
      'No fee, no contract, no obligation to proceed',
    ],
  },
  {
    title: 'Free rental valuation',
    when: 'Within 48 hours',
    text: 'A local expert visits your property, or reviews it remotely if you prefer, and gives you an honest, data-backed rental figure based on what comparable properties are actually achieving right now, not an inflated number to win your business.',
    points: [
      'Based on live Leeds and Manchester market data',
      'Honest figure, with the reasoning explained',
      'Advice on any work that would lift your rent',
    ],
  },
  {
    title: 'Choose your package',
    when: 'When you are ready',
    text: 'We send a clear written proposal. You pick the level of support you want, from a one-time tenant find where you run the tenancy yourself, through to comprehensive management with rent guarantee and legal cover. Every price is inclusive of VAT.',
    points: [
      `Tenant Find from ${LOWEST_FIND_FEE}, one time, no ongoing fees`,
      `Management from ${LOWEST_MGMT_FEE} of the monthly rent, rolling`,
      'Upgrade, downgrade or cancel management at any time',
    ],
  },
  {
    title: 'Get the property compliant',
    when: '1 to 2 weeks',
    text: 'Before the property can be marketed it needs to be legally lettable. We check exactly what you need, tell you what is missing, and arrange anything outstanding through our own contractors if you would like us to.',
    points: [
      'Gas Safety, EICR and EPC checked and arranged',
      'Smoke and carbon monoxide alarms confirmed',
      'Licensing checked, and applied for where needed',
    ],
  },
  {
    title: 'Marketing and tenant find',
    when: '2 to 4 weeks typically',
    text: 'Your property goes live on Rightmove, Zoopla and OnTheMarket. We manage every enquiry, run the viewings, and reference each applicant properly, so only genuinely suitable, affordable tenants reach your shortlist.',
    points: [
      'Listed on all major portals, plus our own audience',
      'Professional photography and floor plan on Expert and managed tiers',
      'Full credit, employment, affordability and Right to Rent checks',
    ],
  },
  {
    title: 'Move in',
    when: 'Move-in day',
    text: 'We prepare the tenancy agreement, register the deposit in a government-approved scheme within the legal window, serve the prescribed information, complete the inventory and collect the first month’s rent before handing over the keys.',
    points: [
      'Tenancy agreement drawn up and signed',
      'Deposit protected and prescribed information served',
      'Check-in inventory completed with photographs',
    ],
  },
  {
    title: 'Ongoing management',
    when: 'For as long as you want it',
    text: 'On a managed package we take it from here. Rent collected and monitored, arrears chased, maintenance handled, compliance tracked and renewed before it lapses, and a statement to you every month. You just watch the rent arrive.',
    points: [
      'Rent collection, monitoring and arrears chasing',
      'Maintenance and vetted contractor coordination',
      'Compliance renewed on time, every time',
    ],
  },
];

const DOCS: { title: string; note: string; items: { label: string; detail: string }[]; icon: 'id' | 'home' | 'cert' | 'money' }[] = [
  {
    title: 'About you',
    note: 'The basics we need to confirm you are entitled to let the property.',
    icon: 'id',
    items: [
      { label: 'Photo ID', detail: 'passport or driving licence' },
      { label: 'Proof of address', detail: 'a recent utility bill or bank statement' },
      { label: 'Proof of ownership', detail: 'title deeds or a Land Registry entry' },
      { label: 'Contact details', detail: 'phone, email and a correspondence address' },
    ],
  },
  {
    title: 'About the property',
    note: 'What we need to value it accurately and market it well.',
    icon: 'home',
    items: [
      { label: 'Full address and postcode', detail: 'including flat or unit number' },
      { label: 'Property type and size', detail: 'bedrooms, bathrooms, parking, garden' },
      { label: 'Furnishing level', detail: 'furnished, part furnished or unfurnished' },
      { label: 'Access arrangements', detail: 'keys, alarm codes, any restrictions' },
    ],
  },
  {
    title: 'Compliance paperwork',
    note: 'Legally required before a tenant can move in. Do not have these yet? We arrange them.',
    icon: 'cert',
    items: [
      { label: 'EPC', detail: 'rated E or above, valid 10 years' },
      { label: 'Gas Safety Certificate', detail: 'renewed annually, where there is gas' },
      { label: 'EICR', detail: 'electrical report, renewed every 5 years' },
      { label: 'Alarms', detail: 'smoke alarms on every floor, CO where needed' },
    ],
  },
  {
    title: 'Money and cover',
    note: 'So rent reaches you correctly and your investment stays protected.',
    icon: 'money',
    items: [
      { label: 'Bank details', detail: 'the account rent should be paid into' },
      { label: 'Mortgage consent to let', detail: 'if the property is mortgaged' },
      { label: 'Landlord insurance', detail: 'a let property is not covered by home insurance' },
      { label: 'Freeholder permission', detail: 'if it is a leasehold flat' },
    ],
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How much does it cost to get started?',
    a: `Nothing. The valuation is free, registering is free, and there is no fee to get a proposal from us. You only pay once you have chosen a package and we begin work. Tenant Find starts at ${LOWEST_FIND_FEE} as a one-time fee with no ongoing charges, and management starts at ${LOWEST_MGMT_FEE} of the monthly rent plus a set up fee. Every price we quote is inclusive of VAT with no hidden extras.`,
  },
  {
    q: 'How long until my property is let?',
    a: 'From your first call to a tenant moving in is typically four to six weeks, though it depends on your property and how much compliance work is outstanding. The valuation happens within 48 hours, getting a compliant property to market takes a few days, and a well-priced property in Leeds or Manchester usually finds a tenant within two to four weeks of going live.',
  },
  {
    q: 'Am I tied into a contract?',
    a: 'Management runs on a rolling monthly basis, so you can upgrade, downgrade or cancel at any time. A Tenant Find is a one-time service with nothing ongoing at all. We would rather keep you because you are happy than because you are locked in.',
  },
  {
    q: 'What if my property is not ready or not compliant yet?',
    a: 'That is completely normal and it is not a problem. Tell us what you have and we will tell you what is missing. We can arrange the Gas Safety Certificate, EICR, EPC, alarms and anything else through our own vetted contractors, and you can order any of these individually from our additional services without taking a package at all.',
  },
  {
    q: 'Can I still use you if I only want part of the service?',
    a: 'Yes. Plenty of landlords self-manage and just want a quality tenant found, which is exactly what our Tenant Find packages do. Others take a management package but arrange their own maintenance. And every individual service, from inventories to photography to referencing, can be ordered on its own with or without a package.',
  },
  {
    q: 'Do I need a licence to rent my property out?',
    a: 'It depends on the property and the local authority. Houses in Multiple Occupation above a certain size need a mandatory HMO licence, and many areas of Leeds and Manchester fall under selective licensing schemes that apply to every rental property in that zone. We check the licensing position for every property we take on and handle the application if one is needed.',
  },
  {
    q: 'What happens if the tenant stops paying?',
    a: 'On our managed packages we monitor rent daily and chase arrears the moment a payment is missed, which resolves most cases quickly. Our Comprehensive Management package goes further and includes rent guarantee cover plus legal and eviction protection, so your income is protected and the legal costs of possession are covered, subject to the policy terms.',
  },
  {
    q: 'Who looks after my property day to day?',
    a: 'A dedicated local agent from your branch, in Leeds or Manchester, not a call centre. You will have a name, a direct line and someone who has actually stood in your property. That is the whole point of using a local agent.',
  },
];

// FAQPage rich result, driven by the same FAQs rendered below.
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

// HowTo rich result for the letting process itself.
const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to let your property with House of Lettings',
  description:
    'The step-by-step process for landlords letting a property in Leeds or Manchester with House of Lettings, from first contact to ongoing management.',
  step: STEPS.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.title,
    text: s.text,
  })),
};

function Tick() {
  return (
    <span className={styles.tick} aria-hidden>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

function DocIcon({ kind }: { kind: 'id' | 'home' | 'cert' | 'money' }) {
  const common = {
    width: 19,
    height: 19,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (kind === 'id') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="11" r="2.2" />
        <path d="M5.5 16.2a3.8 3.8 0 0 1 7 0M15 10h4M15 14h2.5" />
      </svg>
    );
  }
  if (kind === 'home') {
    return (
      <svg {...common}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.7V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.7" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    );
  }
  if (kind === 'cert') {
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h5M8 17h4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

export default function StartHerePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <Navbar />
      <main className={styles.page}>
        {/* ── HERO ─────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden />
          <div className={`${styles.container} ${styles.heroInner}`}>
            <div className={styles.heroPill}>
              <span className={styles.heroDot} aria-hidden />
              The Landlord&rsquo;s Guide
            </div>
            <h1 className={styles.heroTitle}>
              Everything You Need to Know, <span className={styles.heroAccent}>Before You Start</span>
            </h1>
            <p className={styles.heroBody}>
              Letting a property should not feel like a maze. This is the whole picture in one place:
              how you get started, exactly what happens at each stage, what it costs, what we need
              from you, and how long it all takes. No jargon, no small print.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/book-valuation" className={`${styles.btn} ${styles.btnPrimary}`}>
                Book a Free Valuation
              </Link>
              <Link href="/landlord-registration" className={`${styles.btn} ${styles.btnGhostLight}`}>
                Register Your Property
              </Link>
            </div>
            <nav className={styles.jump} aria-label="On this page">
              <span className={styles.jumpLabel}>On this page</span>
              <a href="#process" className={styles.jumpLink}>The process</a>
              <a href="#pricing" className={styles.jumpLink}>What it costs</a>
              <a href="#documents" className={styles.jumpLink}>What we need from you</a>
              <a href="#legal" className={styles.jumpLink}>Your legal duties</a>
              <a href="#faqs" className={styles.jumpLink}>Questions</a>
            </nav>
          </div>
        </section>

        {/* ── WHO WE ARE ───────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.eyebrow}>First things first</div>
            <h2 className={styles.h2}>Who House of Lettings is, in one paragraph</h2>
            <p className={styles.lede}>
              We are a local letting agent for landlords in Leeds and Manchester. We find and
              reference tenants, collect the rent, handle maintenance, and keep your property on the
              right side of a lot of legislation, at prices that are published openly and always
              inclusive of VAT. You can use us for one job or for everything, and you get a named
              local agent rather than a call centre. That is genuinely the whole pitch.
            </p>
          </div>
        </section>

        {/* ── THE PROCESS ──────────────────────────────────── */}
        <section id="process" className={`${styles.section} ${styles.sectionGrey}`} style={{ scrollMarginTop: 88 }}>
          <div className={styles.container}>
            <div className={styles.headCentre}>
              <div className={styles.eyebrow}>The process</div>
              <h2 className={styles.h2}>From first call to rent in your account</h2>
              <p className={styles.lede}>
                Seven stages. Most landlords go from that first conversation to a tenant moving in
                within four to six weeks.
              </p>
            </div>
            <ol className={styles.steps}>
              {STEPS.map((s, i) => (
                <li key={s.title} className={styles.step}>
                  <span className={styles.stepNum}>{String(i + 1).padStart(2, '0')}</span>
                  <div className={styles.stepBody}>
                    <div className={styles.stepTop}>
                      <h3 className={styles.stepTitle}>{s.title}</h3>
                      <span className={styles.stepWhen}>{s.when}</span>
                    </div>
                    <p className={styles.stepText}>{s.text}</p>
                    <ul className={styles.stepList}>
                      {s.points.map((p) => (
                        <li key={p}>
                          <Tick />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────── */}
        <section id="pricing" className={styles.section} style={{ scrollMarginTop: 88 }}>
          <div className={styles.container}>
            <div className={styles.headCentre}>
              <div className={styles.eyebrow}>What it costs</div>
              <h2 className={styles.h2}>Five packages, all prices inclusive of VAT</h2>
              <p className={styles.lede}>
                Tenant Find is a one-time fee and nothing after. Management is a percentage of the
                rent you actually collect, on a rolling monthly basis. Tap any package for the full
                list of what is included.
              </p>
            </div>
            <div className={styles.priceGrid}>
              {BUNDLES.map((b) => (
                <Link
                  key={b.id}
                  href={`/pricing/${b.id}`}
                  className={`${styles.priceCard}${b.badge ? ` ${styles.priceCardHot}` : ''}`}
                >
                  {b.badge && <span className={styles.priceBadge}>{b.badge}</span>}
                  <span className={styles.priceKind}>{b.kind}</span>
                  <h3 className={styles.priceName}>{b.label}</h3>
                  <p className={styles.priceBest}>Best for {b.bestForLead} {b.bestForRest}.</p>
                  <div className={styles.priceFigs}>
                    <span className={styles.priceFig}>{b.mgmtFee || b.setupFee}</span>
                    <span className={styles.priceUnit}>
                      {b.mgmtFee ? `management fees + ${b.setupFee} set up fees` : 'set up fees, no management fees'}
                    </span>
                  </div>
                  <span className={styles.priceMore}>
                    See what&rsquo;s included
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutIcon} aria-hidden>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </span>
              <p className={styles.calloutText}>
                <b>Do not want a package at all?</b> Every service we offer, from certificates and
                inventories to photography and referencing, can be{' '}
                <Link href="/additional-services">ordered individually</Link> at a fixed, published
                price. Take one thing or take everything.
              </p>
            </div>
          </div>
        </section>

        {/* ── WHAT WE NEED ─────────────────────────────────── */}
        <section id="documents" className={`${styles.section} ${styles.sectionGrey}`} style={{ scrollMarginTop: 88 }}>
          <div className={styles.container}>
            <div className={styles.headCentre}>
              <div className={styles.eyebrow}>What we need from you</div>
              <h2 className={styles.h2}>The information and paperwork checklist</h2>
              <p className={styles.lede}>
                Do not worry about gathering all of this before you call us. This is simply what we
                will work through together, and we can arrange anything you are missing.
              </p>
            </div>
            <div className={styles.docGrid}>
              {DOCS.map((d) => (
                <div key={d.title} className={styles.docCard}>
                  <div className={styles.docHead}>
                    <span className={styles.docIcon}>
                      <DocIcon kind={d.icon} />
                    </span>
                    <h3 className={styles.docTitle}>{d.title}</h3>
                  </div>
                  <p className={styles.docNote}>{d.note}</p>
                  <ul className={styles.docList}>
                    {d.items.map((it) => (
                      <li key={it.label}>
                        <Tick />
                        <span><b>{it.label}</b>, {it.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutIcon} aria-hidden>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
              <p className={styles.calloutText}>
                <b>Missing a certificate?</b> That is normal and it will not hold you up. Tell us
                what you have, and we will arrange the Gas Safety Certificate, EICR, EPC or alarms
                through our own vetted contractors, usually within a week.
              </p>
            </div>
          </div>
        </section>

        {/* ── LEGAL DUTIES ─────────────────────────────────── */}
        <section id="legal" className={styles.section} style={{ scrollMarginTop: 88 }}>
          <div className={styles.container}>
            <div className={styles.headCentre}>
              <div className={styles.eyebrow}>Your legal duties</div>
              <h2 className={styles.h2}>What the law asks of every landlord</h2>
              <p className={styles.lede}>
                These duties sit with you as the landlord, whoever manages the property. On a managed
                package we track and handle all of them on your behalf.
              </p>
            </div>
            <div className={styles.docGrid}>
              <div className={styles.docCard}>
                <div className={styles.docHead}>
                  <span className={styles.docIcon}><DocIcon kind="cert" /></span>
                  <h3 className={styles.docTitle}>Safety and certification</h3>
                </div>
                <ul className={styles.docList}>
                  <li><Tick /><span>A <b>Gas Safety Certificate</b> renewed every year where there are gas appliances, and given to the tenant.</span></li>
                  <li><Tick /><span>An <b>EICR</b> renewed at least every five years, with a copy to the tenant.</span></li>
                  <li><Tick /><span>An <b>EPC rated E or above</b>, provided before the tenancy starts.</span></li>
                  <li><Tick /><span><b>Smoke alarms</b> on every storey and a <b>CO alarm</b> in any room with a fuel-burning appliance.</span></li>
                </ul>
              </div>
              <div className={styles.docCard}>
                <div className={styles.docHead}>
                  <span className={styles.docIcon}><DocIcon kind="money" /></span>
                  <h3 className={styles.docTitle}>Deposits and money</h3>
                </div>
                <ul className={styles.docList}>
                  <li><Tick /><span>Protect the deposit in an <b>approved scheme within 30 days</b> and serve the prescribed information.</span></li>
                  <li><Tick /><span>Getting this wrong can <b>invalidate a Section 21 notice</b> and carries a financial penalty.</span></li>
                  <li><Tick /><span><b>Rental profit is taxable</b> and must be declared through Self Assessment.</span></li>
                  <li><Tick /><span>Mortgage interest is no longer fully deductible; a <b>20% tax credit</b> applies instead.</span></li>
                </ul>
              </div>
              <div className={styles.docCard}>
                <div className={styles.docHead}>
                  <span className={styles.docIcon}><DocIcon kind="id" /></span>
                  <h3 className={styles.docTitle}>Tenants and licensing</h3>
                </div>
                <ul className={styles.docList}>
                  <li><Tick /><span><b>Right to Rent checks</b> on every adult occupier before the tenancy begins.</span></li>
                  <li><Tick /><span>An <b>HMO licence</b> where the property meets the criteria for one.</span></li>
                  <li><Tick /><span><b>Selective licensing</b> applies across many Leeds and Manchester zones.</span></li>
                  <li><Tick /><span>Serve the <b>How to Rent guide</b> at the start of the tenancy.</span></li>
                </ul>
              </div>
              <div className={styles.docCard}>
                <div className={styles.docHead}>
                  <span className={styles.docIcon}><DocIcon kind="home" /></span>
                  <h3 className={styles.docTitle}>The property itself</h3>
                </div>
                <ul className={styles.docList}>
                  <li><Tick /><span>Keep it <b>free of serious hazards</b> and fit for human habitation.</span></li>
                  <li><Tick /><span>Repair the <b>structure, exterior and installations</b> for heat, water and power.</span></li>
                  <li><Tick /><span>Give <b>24 hours&rsquo; notice</b> in writing before visiting.</span></li>
                  <li><Tick /><span>Hold <b>landlord insurance</b>, home insurance does not cover a let property.</span></li>
                </ul>
              </div>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutIcon} aria-hidden>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </span>
              <p className={styles.calloutText}>
                This is a plain-English summary to get you oriented, not legal or tax advice. Rules
                in this area change, and we keep our landlords updated as they do. For your own tax
                position, please speak to an accountant.
              </p>
            </div>
          </div>
        </section>

        {/* ── FAQs ─────────────────────────────────────────── */}
        <section id="faqs" className={`${styles.section} ${styles.sectionGrey}`} style={{ scrollMarginTop: 88 }}>
          <div className={styles.container}>
            <div className={styles.headCentre}>
              <div className={styles.eyebrow}>Questions</div>
              <h2 className={styles.h2}>The things landlords ask us first</h2>
            </div>
            <div className={styles.faqList}>
              {FAQS.map((f) => (
                <details key={f.q} className={styles.faq}>
                  <summary className={styles.faqQ}>
                    {f.q}
                    <svg className={styles.faqChevron} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <p className={styles.faqA}>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CLOSING CTA ──────────────────────────────────── */}
        <section className={styles.cta}>
          <div className={styles.ctaGlow} aria-hidden />
          <div className={`${styles.container} ${styles.ctaInner}`}>
            <h2 className={styles.ctaTitle}>Ready when you are</h2>
            <p className={styles.ctaBody}>
              Start with a free valuation and an honest conversation about your property. No fee, no
              contract, and no pressure to go any further than that.
            </p>
            <div className={styles.ctaBtns}>
              <Link href="/book-valuation" className={`${styles.btn} ${styles.btnPrimary}`}>
                Book a Free Valuation
              </Link>
              <Link href="/branches" className={`${styles.btn} ${styles.btnGhostLight}`}>
                Speak to Our Team
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
