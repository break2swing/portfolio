import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ColorThemeProvider } from '@/contexts/ColorThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { Toaster } from '@/components/ui/sonner';
import { WebVitals } from '@/components/WebVitals';
import { PrefetchData } from '@/components/PrefetchData';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mes créations - Portfolio',
  description: 'Portfolio de créations artistiques et professionnelles',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://soundcloud.com" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <ColorThemeProvider>
            <AuthProvider>
              <PrefetchData />
              <AppLayout>{children}</AppLayout>
              <Toaster />
              <WebVitals />
            </AuthProvider>
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
