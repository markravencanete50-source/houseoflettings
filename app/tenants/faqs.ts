// app/tenants/faqs.ts - Plain data module (no 'use client') so both the server
// page (FAQPage JSON-LD) and the client component can import it. Importing an
// array from a 'use client' module and calling .map() in a server component
// throws "Attempted to call map() from the server".
export const TENANT_FAQS = [
  {
    q: 'Is it free to rent through House of Lettings?',
    a: "Yes, there are no agency fees for tenants. The only payment before moving in is a holding deposit to secure the property, which is deducted from your first month's rent. You're not losing anything.",
  },
  {
    q: 'What is the holding deposit?',
    a: "A holding deposit reserves the property while your application is processed. It's fully deducted from your first rent payment, so it comes straight off what you'd pay anyway.",
  },
  {
    q: 'How quickly can I book a viewing?',
    a: 'Once you send an enquiry and answer a few quick questions, we arrange the viewing as fast as possible, usually within a few days.',
  },
  {
    q: 'What checks do you run?',
    a: 'Standard referencing: employment and income checks, a credit check, right to rent verification, and a previous landlord reference where applicable. We keep it straightforward, no unnecessary hoops.',
  },
  {
    q: 'Which areas do you cover?',
    a: 'We operate across Leeds and Manchester, covering a wide range of property types from city centre apartments to family homes.',
  },
  {
    q: 'Can I apply if I am self employed or a student?',
    a: "Yes. We assess applications individually and work with a range of tenant profiles. Get in touch and we'll let you know what we need from you.",
  },
];
