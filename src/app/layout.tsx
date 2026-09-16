import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/providers/Providers';

export const metadata: Metadata = {
  title: 'NIRO Triage — Multimodal Healthcare Triage-Support Platform',
  description:
    'Human-in-the-loop multimodal healthcare triage-support prototype for government and institutional health facilities in India. Fast information. Clear evidence. Human judgment.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Oriya:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#102033]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
