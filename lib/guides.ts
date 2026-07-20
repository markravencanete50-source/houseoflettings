// lib/guides.ts
// Renting guides for tenants, lightweight, data-driven content surfaced on the
// tenant page and rendered as full articles at /guides and /guides/[slug].
// Static content (no CMS): edit this file to add or update a guide.

export interface GuideSection {
  h: string;
  p: string;
}

export interface Guide {
  slug: string;
  title: string;
  date: string;        // ISO, used for sorting
  dateLabel: string;   // human-readable
  readMins: number;
  excerpt: string;
  image: string;
  sections: GuideSection[];
}

export const guides: Guide[] = [
  {
    slug: "how-the-holding-deposit-works",
    title: "How the holding deposit works",
    date: "2026-07-02",
    dateLabel: "2 July 2026",
    readMins: 3,
    excerpt: "What a holding deposit is, why it protects your new home, and how it comes straight off your first month's rent.",
    image: "/images/compliance.webp",
    sections: [
      { h: "What it is", p: "A holding deposit reserves a property while your application is processed. It tells the landlord you're serious and takes the home off the market so it isn't offered to anyone else while your references are checked." },
      { h: "You're not paying extra", p: "The holding deposit is deducted from your first month's rent, so it isn't an additional cost, it's simply paying a little of your rent early. By law it can't be more than one week's rent." },
      { h: "When it's refundable", p: "If we or the landlord decide not to proceed, or you're let down through no fault of your own, your holding deposit is returned. It may be withheld if you provide false information, fail Right to Rent, or pull out yourself." },
      { h: "What happens next", p: "Once your references and Right to Rent checks are complete, we'll confirm your move-in date, send your tenancy agreement to e-sign, and set up your first payment. Nothing is hidden, you'll always know the next step." },
    ],
  },
  {
    slug: "booking-a-viewing-online",
    title: "Booking a viewing online: what to expect",
    date: "2026-06-24",
    dateLabel: "24 June 2026",
    readMins: 2,
    excerpt: "No phone tag, no waiting for a callback. Here's how our online viewings work from click to keys.",
    image: "/images/areas/deansgate.webp",
    sections: [
      { h: "Pick a time that suits you", p: "Browse available homes, choose the one you like and select a viewing slot online. You'll get an instant confirmation, no calls, no waiting around for office hours." },
      { h: "What to bring", p: "Just yourself and any questions. It helps to know your budget, ideal move-in date and whether you'll need a guarantor, so we can talk you through the next steps on the day." },
      { h: "After the viewing", p: "Like it? You can apply online straight away. We'll guide you through referencing and the holding deposit, and keep you updated at every stage." },
    ],
  },
  {
    slug: "right-to-rent-explained",
    title: "Right to Rent checks explained",
    date: "2026-06-10",
    dateLabel: "10 June 2026",
    readMins: 3,
    excerpt: "Every tenant in England needs a Right to Rent check. Here's what it is and which documents you'll need.",
    image: "/images/brand-desk.webp",
    sections: [
      { h: "Why it's required", p: "Landlords and agents in England must confirm every adult tenant has the right to rent property in the UK. It's a legal requirement and applies to everyone, regardless of nationality." },
      { h: "What you'll need", p: "Usually a valid passport, or a biometric residence permit, or a share code from the government's online service. British and Irish citizens can use a passport; others may use a share code generated at gov.uk." },
      { h: "How we handle it", p: "It's all done digitally as part of your application, no need to post original documents. If your permission to stay has a time limit, we'll carry out a simple follow-up check before it expires." },
    ],
  },
  {
    slug: "tenant-referencing-checklist",
    title: "Your tenant referencing checklist",
    date: "2026-05-28",
    dateLabel: "28 May 2026",
    readMins: 3,
    excerpt: "Referencing is quicker when you're prepared. Gather these details before you apply to speed things up.",
    image: "/images/landlord-app.webp",
    sections: [
      { h: "Proof of income", p: "Recent payslips or, if you're self-employed, accounts or an accountant's reference. As a rule of thumb, annual income of around 30x the monthly rent is comfortable, a guarantor can help if you're under this." },
      { h: "Employment & previous landlord", p: "Your employer's contact details for a reference, plus your current or previous landlord if you've rented before. A good landlord reference goes a long way." },
      { h: "Identity & Right to Rent", p: "Photo ID and your Right to Rent evidence (passport or share code). Having these ready means we can complete checks in days, not weeks." },
      { h: "Thinking about a guarantor", p: "Students, first-time renters or anyone below the income threshold can use a UK-based guarantor. They'll complete a short form and a reference of their own, we'll walk them through it." },
    ],
  },
  {
    slug: "reporting-maintenance-the-easy-way",
    title: "Reporting maintenance the easy way",
    date: "2026-05-14",
    dateLabel: "14 May 2026",
    readMins: 2,
    excerpt: "Something not working? Report it online in minutes and we'll coordinate the right contractor for you.",
    image: "/images/service-compare.webp",
    sections: [
      { h: "Report it online", p: "Answer a couple of quick questions and send a photo of the issue. That's usually all we need to understand the problem and get the right trade on the case." },
      { h: "We coordinate the repair", p: "We arrange an appropriate contractor as soon as possible and handle the back-and-forth, so you don't have to chase anyone." },
      { h: "You're kept updated", p: "You'll hear from us as the job progresses and when it's booked in, no wondering what's happening. For anything urgent, like a total loss of heating or water, flag it as an emergency." },
    ],
  },
  {
    slug: "moving-in-first-week-checklist",
    title: "Moving in: your first-week checklist",
    date: "2026-04-30",
    dateLabel: "30 April 2026",
    readMins: 3,
    excerpt: "Keys in hand? Here's how to settle in smoothly and protect your deposit from day one.",
    image: "/images/family-kitchen.webp",
    sections: [
      { h: "Check your inventory", p: "Review the inventory and check-in report carefully, take your own dated photos of any existing marks or wear, and flag anything within the first few days. This protects your deposit when you move out." },
      { h: "Meter readings & utilities", p: "Take gas, electric and water meter readings on day one and set up your accounts with the suppliers. Don't forget broadband and your council tax registration." },
      { h: "Find the essentials", p: "Locate the stopcock, fuse box and thermostat, and test the smoke and carbon monoxide alarms. Knowing where these are saves stress if something goes wrong." },
      { h: "Settle in", p: "Save our details for maintenance, register with a local GP, and enjoy your new home. Anything you're unsure about, just ask, we're a local team and happy to help." },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

// Newest first, used by the tenant-page teaser and the /guides index.
export const guidesByDate: Guide[] = [...guides].sort((a, b) => (a.date < b.date ? 1 : -1));
