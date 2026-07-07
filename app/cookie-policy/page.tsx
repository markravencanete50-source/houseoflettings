'use client';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

const FUNCTIONAL_COOKIES = [
  { title: 'Cookie Consent', name: 'cookie_consent', desc: 'Tracks your cookie preferences so we know what we can and cannot use. This is a persistent cookie.' },
  { title: 'Cookie Acceptance', name: 'cookie_policy', desc: 'Tracks interaction with the cookie banner and which version has been accepted, so we can show it again if anything changes. This is a persistent cookie.' },
  { title: 'Website Session', name: 'PHPSESSID', desc: 'Essential for property search, account login and form functionality to operate. This is a session cookie that expires after 1 hour of inactivity.' },
  { title: 'Security', name: '__CFDUID', desc: 'Set by Cloudflare to maintain the security and performance of our website. Helps identify genuine traffic. This is a persistent cookie.' },
  { title: 'Session ID', name: 'JSESSIONID', desc: 'Assigns a unique session identifier to each visitor so essential website functions can operate correctly. Expires at the end of the browser session.' },
  { title: 'Google reCAPTCHA', name: '_GRECAPTCHA', desc: 'Set by Google reCAPTCHA to identify whether website activity is carried out by a human or automated bot, supporting spam prevention and fraud detection.' },
];

const ANALYTICAL_COOKIES = [
  { title: 'Google Analytics', name: '_ga, _ga_*', desc: 'Collects anonymised information about how visitors use our website, including user behaviour and page views. IP anonymisation is enabled. Used to improve the website and our services.' },
  { title: 'Session Analytics', name: 'aa_click', desc: 'Records a session ID used to generate data about website usage. Helps us understand how our website is being used. This is a session cookie that expires after 1 hour of inactivity.' },
];

const NON_ESSENTIAL_COOKIES = [
  { title: 'Facebook Pixel', name: '_fbp, _fbc', desc: 'Used to retarget visitors on Facebook with properties and services that may be of interest. This is a persistent cookie.' },
];

export default function CookiePolicyPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'var(--black)', padding: '100px 5% 60px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 16 }}>
            Legal
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 700, color: '#fff', lineHeight: 1.05, marginBottom: 20 }}>
            Cookie Policy
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.7, maxWidth: 560 }}>
            Full details about what cookies we set, why we use them, and how to manage them on the House of Lettings website.
          </p>
          <div style={{ marginTop: 28, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Last Updated', value: 'May 2026' },
              { label: 'Version', value: '1.0' },
              { label: 'Applies To', value: 'houseoflettingsrent.vercel.app' },
            ].map(item => (
              <div key={item.label} style={{ borderLeft: '2px solid var(--red)', paddingLeft: 14 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ background: '#fff', padding: '60px 5% 80px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* About Us */}
          <Section title="About Us">
            <p>House of Lettings is a UK-based residential lettings and property management company, headquartered at Peter House, Oxford Street, Manchester.</p>
            <p>We are committed to protecting your privacy. This Cookie Policy forms part of our legal information and sets out how we use cookies on our website to help make your visits more effective.</p>
          </Section>

          {/* What are cookies */}
          <Section title="What Are Cookies?">
            <p>Cookies are small text files placed on your computer by websites and sometimes by emails. They provide useful information to organisations, which helps to make your visits to their websites more effective and efficient.</p>
            <p>We use cookies to ensure that we are able to understand how our website is used and to make improvements accordingly. Cookies do not contain any personal or confidential information about you.</p>
          </Section>

          {/* How we use cookies */}
          <Section title="How We Use Cookies">
            <p>We use cookies to ensure that you get the best experience from our website. The first time you visit, you will be asked to consent to our use of cookies. We suggest that you accept cookies being active on your device whilst you visit and browse our website to ensure you experience it fully.</p>
          </Section>

          {/* Types of cookies */}
          <Section title="The Types of Cookies We Use">
            <p>We use three types of cookies on our website:</p>
            <ol style={{ paddingLeft: 20, margin: '12px 0' }}>
              {[
                'Functional cookies that are essential for our website to work',
                'Analytical cookies that anonymously count interactions on our website',
                'Non-essential or tracking cookies that are used for marketing activities',
              ].map((item, i) => (
                <li key={i} style={{ fontSize: 15, color: 'var(--gray-600)', lineHeight: 1.8, marginBottom: 6 }}>{item}</li>
              ))}
            </ol>

            <SubSection title="Functional Cookies">
              <p>Functional session and persistent cookies are necessary for our website to work. These cookies can be deleted via your browser, but this will restrict certain functions such as logging into your account.</p>
              <p>Session cookies expire when you leave the website and are not stored on your computer. They do not contain any personal data. Persistent cookies last beyond your visit to our website.</p>
            </SubSection>

            <SubSection title="Analytical Cookies">
              <p>We use analytical cookies on our website to track how popular our site is and to record visitor trends over time. These cookies do not contain any personal data but may use your computer's IP address to determine where in the world you are accessing the website from, and to track your page visits within the site.</p>
            </SubSection>

            <SubSection title="Non-Essential Cookies">
              <p>These cookies are usually supplied by business partners and help us to filter out information that is not relevant to you. Our service providers may use cookies that are stored on your computer when you visit our website.</p>
            </SubSection>
          </Section>

          {/* Cookies table */}
          <Section title="Cookies We Use">
            <CookieTable label="Functional" color="var(--black)" cookies={FUNCTIONAL_COOKIES} />
            <CookieTable label="Analytical" color="#1d4ed8" cookies={ANALYTICAL_COOKIES} />
            <CookieTable label="Non-Essential" color="#b45309" cookies={NON_ESSENTIAL_COOKIES} />
          </Section>

          {/* Managing cookies via browser */}
          <Section title="Accepting / Blocking Cookies Using Your Browser">
            <p>You can accept or block any cookies from any website through your browser settings. Most browsers allow you to refuse to accept cookies and to delete cookies. You can obtain up-to-date information about blocking and deleting cookies via these links:</p>
            <ul style={{ margin: '12px 0', padding: 0, listStyle: 'none' }}>
              {[
                { label: 'Chrome', url: 'https://support.google.com/chrome/answer/95647' },
                { label: 'Firefox', url: 'https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences' },
                { label: 'Opera', url: 'https://help.opera.com/en/latest/security-and-privacy/' },
                { label: 'Internet Explorer', url: 'https://support.microsoft.com/en-gb/help/17442/windows-internet-explorer-delete-manage-cookies' },
                { label: 'Safari', url: 'https://support.apple.com/en-gb/guide/safari/manage-cookies-and-website-data-sfri11471/mac' },
                { label: 'Edge', url: 'https://privacy.microsoft.com/en-us/windows-10-microsoft-edge-and-privacy' },
              ].map(b => (
                <li key={b.label} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
                  <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: 'var(--red)', textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                    {b.label}
                  </a>
                </li>
              ))}
            </ul>
            <div style={{ background: '#fef9ec', border: '1px solid #f5e4a0', borderRadius: 8, padding: '14px 18px', marginTop: 16 }}>
              <p style={{ fontSize: 14, color: '#92400e', lineHeight: 1.65, margin: 0 }}>
                <strong>Please note:</strong> If you share the use of a computer, accepting or blocking cookies will affect all users of that computer. Blocking all cookies will have a negative impact upon the usability of many websites and you may not be able to use all the features on our website.
              </p>
            </div>
          </Section>

          {/* More info */}
          <Section title="More Information on Cookies">
            <p>For more information about cookies, visit the Information Commissioner's website at{' '}
              <a href="https://ico.org.uk/your-data-matters/online/cookies/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--red)', textDecoration: 'none' }}>www.ico.org.uk</a>.
            </p>
          </Section>

          {/* Contact */}
          <Section title="Contact Us" last>
            <p>If you have questions or comments about our Cookie Policy, or wish to exercise your data rights, please contact us:</p>
            <div style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)', borderRadius: 10, padding: '24px 28px', marginTop: 16 }}>
              {[
                { label: 'Email', value: 'info@houseoflettingsrent.vercel.app' },
                { label: 'Address', value: 'Peter House, Oxford Street, Manchester' },
                { label: 'Telephone', value: '0161 768 1758' },
                { label: 'Office Hours', value: 'Monday to Friday, 9:00am to 5:30pm' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 14 }}>
                  <span style={{ fontWeight: 600, color: 'var(--black)', minWidth: 100 }}>{item.label}:</span>
                  <span style={{ color: 'var(--gray-600)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Footer note */}
          <div style={{ background: 'var(--black)', borderRadius: 10, padding: '28px 32px', textAlign: 'center', marginTop: 20 }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: '0 0 8px' }}>
              By continuing to use our website, you consent to our use of cookies in accordance with this policy.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: 0 }}>
              Last reviewed: May 2026 · © 2026 House of Lettings Ltd. All rights reserved.
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
            <Link href="/cookie-policy" style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600 }}>Cookie Policy</Link>
            <Link href="/terms" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Terms</Link>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>Contact</span>
          </div>
        </div>
      </footer>
    </>
  );
}

// ── Helper Components ──────────────────────────────────────────────────────────

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : 48, paddingBottom: last ? 0 : 48, borderBottom: last ? 'none' : '1px solid var(--gray-200)' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 700, color: 'var(--black)', marginBottom: 16 }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, color: 'var(--gray-600)', lineHeight: 1.8 }}>
        {children}
      </div>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 20, paddingLeft: 16, borderLeft: '3px solid var(--red)' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--black)', marginBottom: 8 }}>{title}</h3>
      <div style={{ fontSize: 15, color: 'var(--gray-600)', lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

function CookieTable({ label, color, cookies }: { label: string; color: string; cookies: { title: string; name: string; desc: string }[] }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'inline-block', background: color, color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', padding: '4px 12px', borderRadius: 20, marginBottom: 12 }}>
        {label}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--gray-100)', borderBottom: '2px solid var(--gray-200)' }}>
              {['Title', 'Name', 'Description'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--black)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cookies.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--gray-200)', background: i % 2 === 0 ? '#fff' : 'var(--gray-100)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--black)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{c.title}</td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: color, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{c.name}</td>
                <td style={{ padding: '12px 14px', color: 'var(--gray-600)', lineHeight: 1.6, verticalAlign: 'top' }}>{c.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
