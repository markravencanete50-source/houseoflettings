export default function TermsAndConditions() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#1a1a2e] text-white py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm uppercase tracking-widest text-gray-400 mb-3">Legal</p>
          <h1 className="text-4xl font-bold mb-4">Terms &amp; Conditions</h1>
          <p className="text-gray-300 text-sm">
            Effective Date: May 2025 &nbsp;·&nbsp; Version 1.0
          </p>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 border-l-4 border-amber-400 px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-amber-900 font-medium">
            <strong>Important:</strong> Please read these Terms carefully before using our website. By accessing{" "}
            <a href="https://www.houseoflettings.co.uk" className="underline">
              www.houseoflettings.co.uk
            </a>{" "}
            or{" "}
            <a href="https://houseoflettingsrent.vercel.app" className="underline">
              houseoflettingsrent.vercel.app
            </a>
            , you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree,
            please stop using the website immediately.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-14 space-y-12">

        {/* 1. About Us */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            1. About Us
          </h2>
          <p className="text-gray-700 leading-relaxed">
            House of Lettings is a UK-based residential lettings and property management company headquartered at Peter
            House, Oxford Street, Manchester. This website is operated by House of Lettings to provide information about
            our services, property listings, and contact options for landlords and tenants.
          </p>
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p><strong>Email:</strong> info@houseoflettings.co.uk</p>
            <p><strong>Phone:</strong> 0161 768 1758</p>
            <p><strong>Website:</strong> www.houseoflettings.co.uk</p>
          </div>
        </section>

        {/* 2. Acceptable Use */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            2. Acceptable Use
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            By using this website, you agree to use it only for lawful purposes. You must not:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm leading-relaxed pl-2">
            <li>Use the website in any way that is fraudulent, unlawful, or harmful to others</li>
            <li>Submit false, inaccurate, or misleading information through any form or contact channel</li>
            <li>Attempt to gain unauthorised access to any part of the website, its servers, or databases</li>
            <li>Transmit spam, malware, viruses, or any other harmful or disruptive code</li>
            <li>Reproduce, copy, or redistribute any content from the website without our prior written consent</li>
            <li>Use automated tools, scrapers, or bots to extract content from the website</li>
            <li>Engage in any conduct that may damage the reputation or operations of House of Lettings</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            We reserve the right to restrict or terminate your access to the website at any time if we believe you have
            violated these Terms.
          </p>
        </section>

        {/* 3. Website Content & Accuracy */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            3. Website Content &amp; Accuracy
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We take care to ensure the information on this website is accurate and up to date. However, we do not
            guarantee that all content is complete, current, or free from errors. In particular:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm leading-relaxed pl-2">
            <li>Property listings are provided for guidance purposes only and do not constitute a contractual offer</li>
            <li>Property availability, pricing, and details are subject to change without notice</li>
            <li>Photographs, floor plans, and descriptions are indicative and may not reflect the current condition of a property</li>
            <li>We are not responsible for inaccuracies in information provided by third parties, including landlords or external portals</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            Nothing on this website constitutes legal, financial, or professional advice. You should seek independent
            advice before making any property-related decisions.
          </p>
        </section>

        {/* 4. Enquiry Forms & Communications */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            4. Enquiry Forms &amp; Communications
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            When you submit an enquiry, valuation request, or contact form on this website, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm leading-relaxed pl-2">
            <li>Provide accurate and truthful information</li>
            <li>Allow House of Lettings to respond to your enquiry by email, phone, or other contact methods you have provided</li>
            <li>Receive follow-up communications relevant to your enquiry</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            We will not use your contact details for unsolicited marketing without your consent. For full details on how
            we handle your personal data, please refer to our{" "}
            <a href="/privacy-policy" className="text-blue-600 underline">
              Privacy Policy
            </a>
            .
          </p>
        </section>

        {/* 5. Intellectual Property */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            5. Intellectual Property
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            All content on this website — including text, graphics, logos, images, and software — is the property of
            House of Lettings or its content suppliers and is protected by UK and international copyright laws.
          </p>
          <p className="text-gray-700 leading-relaxed mb-2">You may:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm leading-relaxed pl-2">
            <li>View and print content for your own personal, non-commercial use</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4 mb-2">You may not, without our prior written consent:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm leading-relaxed pl-2">
            <li>Reproduce, republish, upload, post, or distribute any website content</li>
            <li>Use our name, logo, or branding in any way that implies affiliation or endorsement</li>
            <li>Frame or mirror any part of this website on another website</li>
          </ul>
        </section>

        {/* 6. Third-Party Links */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            6. Third-Party Links
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Our website may contain links to third-party websites such as property portals (e.g. Rightmove, Zoopla) and
            regulatory bodies. These links are provided for your convenience only. House of Lettings does not endorse,
            control, or take responsibility for the content or privacy practices of any third-party websites. Your use
            of any linked website is at your own risk.
          </p>
        </section>

        {/* 7. Limitation of Liability */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            7. Limitation of Liability
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            To the fullest extent permitted by law, House of Lettings shall not be liable for any direct, indirect,
            incidental, or consequential loss arising from your use of, or inability to use, this website.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">In particular, we are not liable for:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm leading-relaxed pl-2">
            <li>Any inaccuracies or omissions in website content</li>
            <li>Interruptions, errors, or downtime affecting the website</li>
            <li>Loss of data, unauthorised access, or security breaches resulting from your use of the website</li>
            <li>Any reliance placed on information published on this website</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            Nothing in these Terms excludes our liability for death or personal injury caused by negligence, fraud, or
            any other liability that cannot be excluded by applicable law.
          </p>
          <p className="text-gray-700 leading-relaxed mt-4">
            We make no warranty that this website will be uninterrupted, error-free, or free from viruses or harmful
            components. You are responsible for ensuring appropriate security measures are in place on your own device.
          </p>
        </section>

        {/* 8. Privacy & Cookies */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            8. Privacy &amp; Cookies
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Your use of this website is also governed by our{" "}
            <a href="/privacy-policy" className="text-blue-600 underline">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="/cookie-policy" className="text-blue-600 underline">
              Cookie Policy
            </a>
            , which are incorporated into these Terms by reference. By using this website, you consent to the use of
            cookies as described in our Cookie Policy.
          </p>
        </section>

        {/* 9. Changes to These Terms */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            9. Changes to These Terms
          </h2>
          <p className="text-gray-700 leading-relaxed">
            We may update these Terms from time to time. Any changes will be posted on this page with an updated
            effective date. Your continued use of the website after changes are posted constitutes your acceptance of
            the updated Terms. We encourage you to review this page periodically.
          </p>
        </section>

        {/* 10. Governing Law */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            10. Governing Law
          </h2>
          <p className="text-gray-700 leading-relaxed">
            These Terms are governed by the laws of England and Wales. Any disputes arising from your use of this
            website shall be subject to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </section>

        {/* 11. Contact */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            11. Contact Us
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            If you have any questions about these Terms, please contact us:
          </p>
          <div className="bg-gray-50 rounded-lg p-5 text-sm text-gray-700 space-y-1 border border-gray-200">
            <p><strong>House of Lettings</strong></p>
            <p>Peter House, Oxford Street, Manchester</p>
            <p>Email: info@houseoflettings.co.uk</p>
            <p>Phone: 0161 768 1758</p>
            <p>Office Hours: Monday – Friday, 9:00am – 5:30pm</p>
          </div>
        </section>

        {/* Footer note */}
        <div className="border-t border-gray-200 pt-8 text-center text-xs text-gray-400">
          <p>Last reviewed: May 2025 · Version 1.0</p>
          <p className="mt-1">© 2025 House of Lettings Ltd. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
