import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export const metadata = {
  title: 'Terms & Conditions | House of Lettings',
  description: 'Terms and Conditions of Use for House of Lettings.',
};

const SECTIONS = [
  {
    number: '1',
    title: 'Company Overview',
    content: `House of Lettings is a UK-based residential lettings and property management company operating as a licensed intermediary between landlords and tenants. We are headquartered at Peter House, Oxford Street, Manchester.

House of Lettings provides services across the Greater Manchester region and surrounding areas, offering flexible, transparent, and competitively priced letting solutions for both landlords and tenants.

Registered address: Peter House, Oxford Street, Manchester
Contact email: info@houseoflettings.co.uk
Telephone: 0161 768 1758
Website: www.houseoflettings.co.uk`,
  },
  {
    number: '2',
    title: 'Scope of Services',
    content: `House of Lettings provides a range of residential lettings and property management services.`,
    table: {
      headers: ['Service Package', 'Key Inclusions', 'Fee (from)'],
      rows: [
        ['Virtual Tenant Find', 'Property valuation, portal advertising, enquiry and viewings handling', '£399'],
        ['Expert Tenant Find', 'Photography, Right to Rent checks, deposit & first rent collection, offer negotiation', '£599'],
        ['Full Management', 'Deposit protection, inventory, maintenance records, key holding, ongoing management', '8% of monthly rent'],
        ['Free Listing', 'Basic property advertisement on House of Lettings platform', 'Free'],
      ],
    },
    contentAfter: `Full service details, scope, and deliverables are set out in the separate Landlord Agreement and Tenant Agreement provided at the point of engagement. In the event of any conflict between these Terms and a specific service agreement, the specific agreement shall prevail.`,
  },
  {
    number: '3',
    title: 'Website Use & User Obligations',
    subsections: [
      {
        title: '3.1 General Users',
        items: [
          'Use the website only for lawful purposes and in accordance with these Terms',
          'Not use the website in any way that is fraudulent, unlawful, or harmful to others',
          'Not submit false, inaccurate, or misleading information through any form or communication channel',
          'Not attempt to gain unauthorised access to any part of the website, its servers, or databases',
          'Not transmit any unsolicited commercial communications (spam) or introduce malware or malicious code',
          'Not reproduce, duplicate, or copy content from the website without our prior written consent',
        ],
      },
      {
        title: '3.2 Landlords',
        intro: 'Landlords using our services accept additional obligations as follows:',
        items: [
          'Ensure the property fully complies with all applicable UK safety and housing laws at all times',
          'Provide accurate, complete, and up-to-date information about the property, including its condition, title, and any known defects',
          'Hold all required certificates prior to tenancy commencement, including Gas Safety Certificate, Electrical Installation Condition Report (EICR), and Energy Performance Certificate (EPC)',
          'Ensure the property meets the minimum EPC rating of E (or higher as required by current legislation)',
          'Maintain the property in a safe and habitable condition throughout any tenancy',
          'Provide correct and complete contact and banking details for fee processing and rental payments',
          'Notify House of Lettings promptly of any material changes to the property or their circumstances',
        ],
      },
      {
        title: '3.3 Tenants',
        intro: 'Tenants using our platform or services agree to:',
        items: [
          'Provide honest and accurate information during the referencing and application process',
          'Pay all agreed rent on the due date and in the agreed manner',
          'Maintain the property in a clean and responsible condition throughout the tenancy',
          'Report maintenance issues promptly to the relevant party (landlord or House of Lettings)',
          'Not sublet or assign the tenancy without prior written consent from the landlord',
          'Comply fully with all terms of the tenancy agreement',
          'Vacate the property at the end of the tenancy in the agreed condition, subject to fair wear and tear',
        ],
      },
    ],
  },
  {
    number: '4',
    title: 'Property Listings Disclaimer',
    content: `All property listings published on our website are provided in good faith based on information supplied by landlords or their representatives. House of Lettings does not independently verify the accuracy of all information provided.`,
    items: [
      'Listings are provided for guidance and marketing purposes only and do not constitute a contractual offer',
      'Property availability, rent prices, and listing details are subject to change without notice',
      'Photographs, floor plans, and virtual tours are indicative only and may not reflect the current state of the property',
      'We do not accept liability for inaccuracies in information supplied by third parties, including landlords, portals, or external data providers',
      'All measurements and descriptions are approximate and should be independently verified',
    ],
    contentAfter: 'Prospective tenants are strongly encouraged to conduct their own inspections and due diligence prior to entering into any tenancy agreement.',
  },
  {
    number: '5',
    title: 'Fees and Payments',
    content: 'House of Lettings is committed to full transparency in its fee structure. All applicable fees will be clearly communicated and agreed in writing before any services are rendered.',
    items: [
      'No fees are payable by tenants for finding or applying for a property through our platform, in compliance with the Tenant Fees Act 2019',
      'Landlord fees are as outlined in the applicable service agreement and our published pricing schedule at www.houseoflettings.co.uk/pricing-services',
      'Additional services outside the scope of the agreed package may incur supplementary charges, which will be confirmed in writing in advance',
      'All quoted fees are exclusive of VAT unless stated otherwise',
      'Payment of fees is due in accordance with the agreed payment schedule or invoice date',
      'Late payment of fees may result in interest being charged at 8% per annum above the Bank of England base rate, in accordance with the Late Payment of Commercial Debts (Interest) Act 1998',
      'House of Lettings reserves the right to suspend services in the event of non-payment of agreed fees',
    ],
  },
  {
    number: '6',
    title: 'Tenancy Deposits & Compliance',
    content: `All tenancy deposits must be protected in accordance with the Housing Act 2004 and subsequent regulations. House of Lettings uses Government-approved tenancy deposit protection schemes, including:`,
    items: [
      'Deposit Protection Service (DPS)',
      'Tenancy Deposit Scheme (TDS)',
      'mydeposits',
    ],
    contentAfter: `Where House of Lettings holds the deposit as part of a Full Management service, the deposit will be protected within 30 days of receipt. A Deposit Protection Certificate and Prescribed Information will be provided to the tenant within this timeframe.

The maximum permitted deposit is capped as follows:
• Five weeks' rent for properties with an annual rent below £50,000
• Six weeks' rent for properties with an annual rent of £50,000 or above

Deposit disputes will be handled in accordance with the dispute resolution service provided by the applicable protection scheme.`,
  },
  {
    number: '7',
    title: 'Legal Compliance',
    content: 'House of Lettings operates in full compliance with applicable UK housing and property legislation. Our services are conducted in accordance with, including but not limited to:',
    items: [
      'Housing Act 1988 (as amended) and the Assured Shorthold Tenancy regime',
      'Housing Act 2004 – Tenancy Deposit Protection and Housing Health and Safety Rating System (HHSRS)',
      'Tenant Fees Act 2019 – prohibiting unlawful tenant fees',
      'Renters\' Rights Act 2025 – including abolition of \'no-fault\' Section 21 evictions, introduction of periodic tenancies, and enhanced tenant protections',
      'Immigration Act 2014 – Right to Rent checks',
      'Electrical Safety Standards in the Private Rented Sector (England) Regulations 2020',
      'Gas Safety (Installation and Use) Regulations 1998',
      'Energy Efficiency (Private Rented Property) (England and Wales) Regulations 2015',
      'Equality Act 2010',
      'Consumer Protection from Unfair Trading Regulations 2008',
    ],
    contentAfter: 'Landlords are solely responsible for ensuring their properties comply with all relevant statutory requirements. House of Lettings will provide guidance where applicable but does not accept liability for a landlord\'s failure to comply.',
  },
  {
    number: '8',
    title: 'Limitation of Liability',
    content: 'House of Lettings acts as an intermediary between landlords and tenants. Accordingly:',
    items: [
      'We are not a party to the tenancy agreement between landlord and tenant, and are not liable for breaches thereof by either party',
      'We are not liable for tenant default, rent arrears, property damage, or any loss sustained by a landlord as a result of a tenant\'s actions or omissions',
      'We are not liable for any loss sustained by a tenant as a result of a landlord\'s breach of their legal obligations',
      'We are not responsible for the actions, omissions, or representations of any third-party contractors, portals, or service providers',
      'Our liability in respect of any claim arising from our services is limited to the total fees paid by the claimant to House of Lettings in the 12 months preceding the event giving rise to the claim',
      'Nothing in these Terms limits or excludes our liability for death or personal injury caused by our negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be excluded by law',
    ],
    contentAfter: 'We make no warranty that the website will be uninterrupted, error-free, or free from viruses or other harmful components. You are responsible for ensuring appropriate security measures are in place on your own devices.',
  },
  {
    number: '9',
    title: 'Data Protection & Privacy',
    content: 'House of Lettings is committed to protecting your personal data. We process personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.',
    items: [
      'Facilitate the letting and property management process',
      'Conduct referencing, Right to Rent checks, and identity verification',
      'Comply with legal and regulatory obligations',
      'Communicate with landlords, tenants, and prospective customers',
      'Improve our website and services',
    ],
    contentAfter: 'We will not sell, rent, or share your personal data with third parties for marketing purposes without your explicit consent. Data is retained only for as long as necessary for the purposes for which it was collected, or as required by law.\n\nFor full details of how we collect, use, store, and protect your personal data, please refer to our Privacy Policy available at www.houseoflettings.co.uk/privacy-policy. For any data protection queries, contact us at info@houseoflettings.co.uk.',
  },
  {
    number: '10',
    title: 'Complaints Procedure',
    content: 'House of Lettings is committed to providing a high standard of service. If you are dissatisfied with any aspect of our service, we encourage you to raise a formal complaint.',
    steps: [
      { label: 'Step 1 — Initial Contact', desc: 'Contact us in writing at info@houseoflettings.co.uk or by post to Peter House, Oxford Street, Manchester, setting out the nature of your complaint.' },
      { label: 'Step 2 — Acknowledgement', desc: 'We will acknowledge your complaint within 3 business days of receipt.' },
      { label: 'Step 3 — Investigation', desc: 'We will investigate and provide a written response within 15 business days.' },
      { label: 'Step 4 — Escalation', desc: 'If you remain dissatisfied, you may refer your complaint to an independent redress scheme. Details of our membership of any applicable redress or professional body are available on our website.' },
    ],
  },
  {
    number: '11',
    title: 'Intellectual Property',
    content: 'All content on the House of Lettings website, including text, graphics, logos, images, photographs, audio clips, video, and software, is the property of House of Lettings or its content suppliers and is protected by UK and international copyright and intellectual property laws.',
    contentAfter: `You may view and print website content for personal, non-commercial use only. Without our prior written consent you may not:
• Reproduce, copy, republish, upload, post, transmit, or distribute any website content
• Use our name, logo, or branding in any context that may create confusion or imply affiliation
• Scrape, crawl, or use automated tools to extract content from the website

Any unauthorised use of website content may give rise to a claim for damages and/or be a criminal offence.`,
  },
  {
    number: '12',
    title: 'Third-Party Links & External Websites',
    content: 'Our website may contain links to third-party websites, including property portals (e.g. Rightmove, Zoopla), deposit protection schemes, and regulatory bodies. These links are provided for your convenience only.\n\nHouse of Lettings does not endorse, control, or take responsibility for the content, privacy practices, or availability of any third-party websites. Your use of any linked website is at your own risk and subject to the terms and conditions of that website.',
  },
  {
    number: '13',
    title: 'Suspension & Termination of Access',
    content: 'House of Lettings reserves the right, at its sole discretion and without notice, to:',
    items: [
      'Restrict, suspend, or terminate your access to any part of the website or our services',
      'Remove any listing, content, or account that breaches these Terms or applicable law',
      'Take legal action in respect of any breach of these Terms',
    ],
    contentAfter: 'Grounds for termination include, but are not limited to, providing false or misleading information, non-payment of fees, harassment of staff or other users, breach of applicable laws, or any conduct detrimental to the interests of House of Lettings, landlords, or tenants.\n\nOn termination, any ongoing service obligations will be wound down in accordance with the applicable service agreement.',
  },
  {
    number: '14',
    title: 'Amendments to These Terms',
    content: 'House of Lettings reserves the right to update or amend these Terms and Conditions at any time. Changes will be effective upon posting to this website, with the effective date updated accordingly.\n\nWhere changes are material, we will endeavour to provide reasonable notice via email or a prominent notice on our website. Your continued use of the website or our services following the posting of revised Terms constitutes your acceptance of those changes.\n\nWe encourage you to review these Terms periodically to ensure you remain aware of the current version.',
  },
  {
    number: '15',
    title: 'Governing Law & Dispute Resolution',
    content: 'These Terms and Conditions and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the laws of England and Wales.\n\nAny disputes arising from these Terms or our services shall be subject to the exclusive jurisdiction of the courts of England and Wales, save that either party may seek interim injunctive relief in any court of competent jurisdiction.\n\nWhere possible, the parties agree to attempt to resolve any disputes informally before commencing formal legal proceedings.',
  },
  {
    number: '16',
    title: 'Contact Information',
    contact: true,
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <div style={{ background: 'var(--black)', padding: '100px 5% 60px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 16 }}>
            Legal
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 700, color: '#fff', lineHeight: 1.05, marginBottom: 20 }}>
            Terms &amp; Conditions
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.7, maxWidth: 560 }}>
            Please read these Terms carefully before using the House of Lettings website or engaging our services.
          </p>
          <div style={{ marginTop: 28, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Effective Date', value: 'May 2025' },
              { label: 'Version', value: '1.0' },
              { label: 'Jurisdiction', value: 'England & Wales' },
            ].map(item => (
              <div key={item.label} style={{ borderLeft: '2px solid var(--red)', paddingLeft: 14 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Important Notice Banner */}
      <div style={{ background: '#fef9ec', borderBottom: '1px solid #f5e4a0', padding: '20px 5%' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <p style={{ fontSize: 14, color: '#92400e', lineHeight: 1.65, margin: 0 }}>
            <strong>Important Notice:</strong> By accessing or using our website (www.houseoflettings.co.uk), you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree, please discontinue use immediately. These Terms apply to all users, including landlords, tenants, property seekers, and general visitors.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ background: '#fff', padding: '60px 5% 80px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* Table of Contents */}
          <div style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)', borderRadius: 10, padding: '28px 32px', marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 16 }}>Contents</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px 24px' }}>
              {SECTIONS.map(s => (
                <a key={s.number} href={`#section-${s.number}`} style={{ fontSize: 13, color: 'var(--gray-600)', textDecoration: 'none', display: 'flex', gap: 8, alignItems: 'baseline', transition: 'color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray-600)')}>
                  <span style={{ color: 'var(--red)', fontWeight: 700, flexShrink: 0, minWidth: 20 }}>{s.number}.</span>
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          {SECTIONS.map((section, idx) => (
            <div key={section.number} id={`section-${section.number}`} style={{ marginBottom: 52, paddingBottom: 52, borderBottom: idx < SECTIONS.length - 1 ? '1px solid var(--gray-200)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, background: 'var(--black)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {section.number}
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 700, color: 'var(--black)', margin: 0, paddingTop: 6 }}>
                  {section.title}
                </h2>
              </div>

              {section.contact ? (
                <div style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)', borderRadius: 10, padding: '28px 32px', marginLeft: 58 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>House of Lettings</div>
                  {[
                    { label: 'Address', value: 'Peter House, Oxford Street, Manchester' },
                    { label: 'Email', value: 'info@houseoflettings.co.uk' },
                    { label: 'Telephone', value: '0161 768 1758' },
                    { label: 'Website', value: 'www.houseoflettings.co.uk' },
                    { label: 'Office Hours', value: 'Monday – Friday, 9:00am – 5:30pm' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 14 }}>
                      <span style={{ fontWeight: 600, color: 'var(--black)', minWidth: 100 }}>{item.label}:</span>
                      <span style={{ color: 'var(--gray-600)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginLeft: 58 }}>
                  {section.content && (
                    <p style={{ fontSize: 15, color: 'var(--gray-600)', lineHeight: 1.8, marginBottom: section.items || section.table || section.steps || section.subsections ? 16 : 0, whiteSpace: 'pre-line' }}>
                      {section.content}
                    </p>
                  )}

                  {section.table && (
                    <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                          <tr style={{ background: 'var(--black)', color: '#fff' }}>
                            {section.table.headers.map(h => (
                              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.table.rows.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--gray-200)', background: i % 2 === 0 ? '#fff' : 'var(--gray-100)' }}>
                              {row.map((cell, j) => (
                                <td key={j} style={{ padding: '12px 16px', color: j === 0 ? 'var(--black)' : 'var(--gray-600)', fontWeight: j === 0 ? 600 : 400 }}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {section.items && (
                    <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none' }}>
                      {section.items.map((item, i) => (
                        <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10, fontSize: 15, color: 'var(--gray-600)', lineHeight: 1.7 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0, marginTop: 9 }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.steps && (
                    <div>
                      {section.steps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                          <div style={{ width: 32, height: 32, background: 'var(--red)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                            {i + 1}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--black)', marginBottom: 4 }}>{step.label}</div>
                            <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.subsections && section.subsections.map((sub, i) => (
                    <div key={i} style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--black)', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--gray-200)' }}>{sub.title}</div>
                      {sub.intro && <p style={{ fontSize: 15, color: 'var(--gray-600)', marginBottom: 12, lineHeight: 1.7 }}>{sub.intro}</p>}
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {sub.items.map((item, j) => (
                          <li key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10, fontSize: 15, color: 'var(--gray-600)', lineHeight: 1.7 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0, marginTop: 9 }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {section.contentAfter && (
                    <p style={{ fontSize: 15, color: 'var(--gray-600)', lineHeight: 1.8, marginTop: 16, whiteSpace: 'pre-line' }}>
                      {section.contentAfter}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Footer note */}
          <div style={{ background: 'var(--black)', borderRadius: 10, padding: '28px 32px', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: '0 0 8px' }}>
              By using this website or engaging our services, you confirm that you have read, understood, and agree to these Terms and Conditions.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: 0 }}>
              Last reviewed: May 2025 · Document Version: 1.0 · © 2025 House of Lettings Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 7, height: 7, background: 'var(--red)', borderRadius: '50%', display: 'inline-block' }} />
            House of Lettings
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
            © {new Date().getFullYear()} House of Lettings Ltd. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>Privacy</span>
            <Link href="/terms" style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600 }}>Terms</Link>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>Contact</span>
          </div>
        </div>
      </footer>
    </>
  );
}
