import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Smart "What to Cook" - Recipe & Meal Planner',
  description: 'An intelligent recommendation system suggesting personalized meals based on ingredients, preferences, and cooking times, helping to reduce food waste.',
  keywords: ['what to cook', 'recipe recommendation', 'meal planner', 'grocery list generator', 'reduce food waste'],
  authors: [{ name: 'Rahul Suthar' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
