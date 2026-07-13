// app/register/page.tsx
// Public account registration was removed — landlords and tenants no longer
// sign up for logins on the site. Landlords onboard via /landlord-registration;
// staff/admin accounts are created internally. Anyone hitting /register is sent
// back to the homepage.
import { redirect } from 'next/navigation';

export default function RegisterPage() {
  redirect('/');
}
