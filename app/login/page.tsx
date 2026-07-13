// app/login/page.tsx
// The public landlord/tenant login was removed. All sign-in now goes through
// the single team login at /admin-login (staff + admin, role-based routing).
import { redirect } from 'next/navigation';

export default function LoginPage() {
  redirect('/admin-login');
}
