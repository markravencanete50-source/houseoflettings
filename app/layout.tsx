// app/layout.tsx
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';
import CookieBanner from '@/components/CookieBanner';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'House of Lettings — Find Your Next Home',
  description: 'The UK\'s premier direct rental platform. No agency fees, no middlemen.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body style={{ paddingTop: '72px' }}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
