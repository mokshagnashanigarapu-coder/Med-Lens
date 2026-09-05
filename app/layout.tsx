import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MedLens — AI-Powered Clinical Information Intelligence',
  description: 'Transform fragmented patient history and medical reports into a structured, traceable, and reviewable patient record with strict provenance tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
