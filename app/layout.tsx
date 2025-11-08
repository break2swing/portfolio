import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ColorThemeProvider } from '@/contexts/ColorThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { Toaster } from '@/components/ui/sonner';

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
      <body className={inter.className}>
        <ThemeProvider>
          <ColorThemeProvider>
            <AuthProvider>
              <AppLayout>{children}</AppLayout>
              <Toaster />
            </AuthProvider>
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
