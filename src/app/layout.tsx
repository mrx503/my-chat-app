
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'duck',
  description: 'A modern chat application',
  manifest: '/manifest.json',
};

const DuckLogo = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="duckGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#43AFFF" />
          <stop offset="100%" stopColor="#2089E6" />
        </linearGradient>
      </defs>
      <path d="M18.34 10.65C18.34 7.66 16.59 5.22 14.28 4.23C13.88 4.08 13.46 4 13.02 4C10.53 4 8.5 6.03 8.5 8.52C8.5 8.95 8.57 9.37 8.71 9.76C6.27 10.05 4.5 12.1 4.5 14.59C4.5 16.2 5.24 17.61 6.42 18.57C6.22 18.82 6.08 19.12 6.08 19.46C6.08 20.31 6.77 21 7.62 21H18.38C19.23 21 19.92 20.31 19.92 19.46C19.92 18.23 19.24 17.15 18.34 16.03V10.65Z" fill="url(#duckGradient)"/>
      <path d="M18.34 10.65C18.34 10.4 18.38 10.16 18.44 9.93C18.3 9.44 18.06 9 17.75 8.6C17.34 8.08 16.8 7.68 16.2 7.42C15.93 7.3 15.65 7.22 15.36 7.19C15.42 6.88 15.45 6.57 15.45 6.25C15.45 4.95 14.35 3.86 13.05 3.86C12.44 3.86 11.89 4.11 11.48 4.52C10.5 5.34 10.03 6.57 10.15 7.82C9.48 8.1 9 8.78 9 9.56C9 9.98 9.16 10.36 9.43 10.65H18.34Z" fill="white" fillOpacity="0.3"/>
      <path d="M20.5 14.5C20.5 13.12 19.38 12 18 12C17.8 12 17.61 12.02 17.42 12.05C17.06 11.23 16.2 10.69 15.21 10.69H10.5C9.4 10.69 8.5 11.59 8.5 12.69V17C8.5 17.14 8.51 17.28 8.53 17.42C9.42 17.07 10.43 16.88 11.5 16.88H13.5L14.5 18.88L15.5 16.88H18C19.38 16.88 20.5 15.76 20.5 14.5Z" fill="white" fillOpacity="0.2"/>
    </svg>
  );

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="font-body antialiased overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
