// app/layout.tsx
import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';
import CookieBanner from '@/components/CookieBanner';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'House of Lettings — Find Your Next Home',
  description: 'The UK\'s premier direct rental platform. No agency fees, no middlemen.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
